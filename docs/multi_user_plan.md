# P3-4: Concrete Auth & Multi-User Plan

## Context

`docs/IMPROVEMENT_PLAN.md` P3-4 only ever sketched the *small* version: "the app is
single-user with no auth; add a simple access guard." This plan replaces that one-liner
with a concrete design, driven by two facts about the deployment:

1. **The app is fronted by a Cloudflare Tunnel + Cloudflare Access (Google login).**
   With a *tunnel* (`cloudflared` dialing out), **no inbound port is exposed** —
   `docker-compose.yml` maps `8080:8000` only on the host/LAN, not the internet. So edge
   access control is genuinely already solved. The residual gaps are (a) the app trusts
   *no* identity today (`app/main.py:154` has zero auth), and (b) anything on the same
   host can hit `:8000` and spoof the `Cf-Access-Authenticated-User-Email` header. Both
   are closed by **verifying the Cloudflare Access JWT** — which also gives a
   trustworthy email to key users on.

2. **Desired end state: true multi-user.** Identity comes from the Cloudflare Google
   email (no second login to build). Each additional user supplies *their own* Garmin
   credentials in-app afterward, since Garmin creds are required to fetch their data.

Today everything is single-tenant: no `User` table, no `user_id` on any table, one
global Garmin account from env (`config.py:5-6`), one token dir, one global Garmin
client singleton (`garmin_sync.py:17`), and global sync jobs. We get there in three
shippable phases: **identity → per-user Garmin credentials → data isolation.**

## Design decisions

- **Identity = verified Cloudflare Access JWT.** Middleware verifies the
  `Cf-Access-Jwt-Assertion` header against the team JWKS
  (`https://<team>.cloudflareaccess.com/cdn-cgi/access/certs`) and checks the `aud`
  matches the Access application's AUD tag. The verified `email` claim is the user
  key. A `User` row is auto-provisioned on first verified request. No app-native
  login, no passwords — Cloudflare owns the Google flow.
- **Dev/test bypass.** New `auth_enabled` config (default `false`). When off (local
  dev, CI, the current homelab until cutover), requests resolve to a single default
  user (`DEV_USER_EMAIL`, default the existing `garmin_email`). This keeps the test
  suite and local runs working with no Cloudflare dependency, and makes the rollout
  non-breaking.
- **Garmin stays a *data-source* credential, not the login.** Per-user creds entered
  in Settings, validated by a real Garmin login, password encrypted at rest (Fernet
  via a new `encryption_key`). Tokens move from one flat dir to per-user dirs
  (`{garmin_token_dir}/{user_id}/`). The env `GARMIN_EMAIL/PASSWORD` become the
  bootstrap for the first user only (migration path).

## Phase 1 — Identity layer (ship first, no data changes)

**Goal:** every request carries a verified `current_user`; existing behavior unchanged.

- `app/config.py`: add `auth_enabled: bool = False`, `cf_access_team_domain: str = ""`,
  `cf_access_aud: str = ""`, `dev_user_email: str = ""`, `encryption_key: str = ""`.
- `app/models.py`: add `User` (`id`, `email` unique, `full_name`, `created_at`).
- New `app/auth.py`:
  - `verify_cf_access_jwt(token) -> email` — fetch+cache team JWKS, verify signature,
    `aud`, expiry (reuse `httpx` already in deps; `PyJWT`/`jose` for verification).
  - `get_current_user(request, db) -> User` FastAPI dependency: when `auth_enabled`,
    read+verify the header and upsert the `User` by email; when disabled, return/create
    the `dev_user_email` user. Returns 401 on missing/invalid token.
- `app/api.py`: add `current_user: User = Depends(get_current_user)` to the router (or
  each route). No filtering yet — just thread the identity through.
- `app/main.py`: nothing required; Cloudflare terminates the Google flow. Optionally a
  `GET /api/v1/me` returning the current user's email/name for the frontend header.
- `frontend/src/components/settings/SettingsView.tsx`: show "Signed in as {email}"
  from `/api/v1/me`. No login UI (Cloudflare handles it).

**Verify:** with `auth_enabled=false`, full suite green and app behaves as today. With
`auth_enabled=true` + a real `Cf-Access-Jwt-Assertion`, `/api/v1/me` returns the
Google email; a forged/absent header returns 401.

## Phase 2 — Per-user Garmin credentials

**Goal:** each user connects their own Garmin; the global env account becomes user #1.

- `app/models.py`: add to `User` → `garmin_email`, `garmin_password_encrypted`
  (Fernet ciphertext). Tokens stored at `{garmin_token_dir}/{user_id}/`.
- New `app/crypto.py`: Fernet encrypt/decrypt using `settings.encryption_key`.
- `app/garmin_sync.py`: replace the single `_garmin_client` global (lines 17-42) with a
  `dict[user_id -> Garmin]` cache; `get_garmin_client(user)` builds from the user's
  decrypted creds and per-user token dir, loading the dumped OAuth tokens (so syncs
  never re-prompt for MFA). Keep the existing token-refresh logic.
- `app/api.py` — MFA-aware connect flow (see "Garmin MFA" below):
  - `POST /api/v1/garmin-credentials` → runs garth step-1 login. On success stores
    encrypted creds + dumps tokens; on `needs_mfa` stashes the transient `client_state`
    and returns `{status: "mfa_required"}`.
  - `POST /api/v1/garmin-credentials/mfa` → body `{code}`; runs `resume_login` and
    dumps tokens.
  - `GET /api/v1/garmin-credentials/status`, `DELETE`.
- `app/main.py` startup/`_migrate_db`: seed user #1 from `GARMIN_EMAIL/PASSWORD` and
  migrate the existing flat token dir into `{garmin_token_dir}/{user_1_id}/`.
- `frontend/src/components/settings/SettingsView.tsx` + `frontend/src/api/types.ts`:
  add a "Connect Garmin" form (email/password, status, disconnect).

**Verify:** user #1's sync still works off the migrated token dir; a second user can
save creds (bad creds rejected at save time) and their client authenticates independently.

## Phase 3 — Data isolation (the heavy lift)

**Goal:** every row, query, computation, and sync job is scoped to one user.

- `app/models.py`: add `user_id` FK to `Activity`, `DailySummary`, `Insight`, `Race`,
  `GarminCalendarEvent`, `AthleteProfile`, `ZoneConfig`, `TrainingPlan`,
  `TrainingPlanDay`, `SyncStatus`. Change single-row/`date`-unique constraints to
  composite `(user_id, …)` (e.g. `DailySummary` unique `(user_id, date)`;
  `AthleteProfile` one-per-user instead of one global row).
- `app/database.py::_migrate_db` (line 52): extend the existing hand-rolled
  `ALTER TABLE … ADD COLUMN` helper to add `user_id` and **backfill all existing rows
  to user #1**, so current data isn't orphaned. (P3-3's Alembic adoption would
  supersede this helper later — out of scope here.)
- `app/api.py`: add `.filter(<Model>.user_id == current_user.id)` to every query;
  replace `.first()` singletons (athlete profile, latest plan) with user-scoped lookups.
- Compute paths take a `user_id`/user scope: `app/training_load.py`, `app/threshold.py`,
  `app/adherence.py`, `app/ai_coach.py` (per-user context), `app/garmin_sync.py`
  (write rows with `user_id`).
- `app/main.py` scheduler: the four cron jobs (activity poll, daily sync, weekly review,
  plan generation) iterate over all users with Garmin connected, syncing each in
  isolation; one user's failure must not abort the others. When a user's login fails
  because tokens are gone/expired **and** Garmin returns `needs_mfa` (a cron can't
  answer an MFA prompt), mark that user's Garmin connection `needs_reauth` (a field on
  `User` or a per-user `SyncStatus` row) and skip them — the Settings UI surfaces a
  "Reconnect" action to complete the one-time code step interactively.
- `docs/IMPROVEMENT_PLAN.md`: rewrite the P3-4 bullet to describe this concrete
  multi-user design.

**Verify:** seed two users with separate Garmin accounts; confirm `/api/v1/today`,
activities, plan, and profile return only the caller's data; a daily-sync run populates
each user's rows under their own `user_id`; suite green with `auth_enabled=false`.

## Notes / risks

- **Garmin MFA** (supported via garth's two-step flow): `garminconnect==0.2.25`'s
  `Garmin.login()` only offers a blocking `prompt_mfa` callback, unusable in a web app.
  Instead call garth directly through the client's `.garth`:
  `garth.login(email, password, return_on_mfa=True)` returns **either**
  `(oauth1, oauth2)` (MFA-off accounts — completes immediately) **or**
  `("needs_mfa", client_state)`. For the latter, persist the short-lived `client_state`
  server-side (in-memory dict keyed by `user_id` with a short TTL is fine for a
  single-container deploy; a temp DB row if hardening), return `mfa_required` to the UI,
  then on the user's 6-digit code call `garth.resume_login(client_state, mfa_code)` and
  `garth.dump()` the tokens to `{garmin_token_dir}/{user_id}/`. MFA is a **one-time,
  interactive step at connect** — the dumped OAuth1 token (~1yr) refreshes the access
  token, so daily syncs and restarts reuse tokens and never re-prompt; a fresh prompt
  only recurs on token expiry/revocation. Frontend: add an MFA-code step to the Connect
  Garmin form.
- **Token loss / app migration**: re-login is always possible because the **encrypted
  Garmin password is stored in the DB**, not just the tokens. If the token dir is lost
  or you move hosts, the app re-logs in from stored creds automatically (MFA-off) or
  with one interactive code step (MFA-on). Clean migration = carry the `/data` volume
  (DB + token dir). Full from-scratch reconnect is only forced if you lose the DB *or*
  change the `encryption_key`.
- **Secrets**: `encryption_key` is a Fernet key generated **once** before connecting the
  first Garmin account:
  `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`.
  It must be set, **stable, and part of your backup** — moving the app with a different
  key (or rotating it) makes stored passwords undecryptable and forces every user to
  reconnect (no data is lost). Document `ENCRYPTION_KEY` in `.env.example` and
  `docker-compose.yml`.
- **Sequencing**: Phase 1 is independently valuable and low-risk; Phases 2-3 can land
  later. Keep the 80% coverage gate green throughout (CLAUDE.md / `tests.yml`).
