# Phase 2 — Per-user Garmin credentials

Implement Phase 2 of docs/multi_user_plan.md. Note: DB migrations now use Alembic
(not the old hand-rolled `_migrate_db`), so schema changes ship as an Alembic revision.

## Tasks
- [x] `app/models.py`: add `garmin_email`, `garmin_password_encrypted` to `User`.
- [x] Alembic revision `b2c3d4e5f6a7`: add the two columns to `users` (batch ALTER).
- [x] `app/crypto.py`: Fernet encrypt/decrypt using `settings.encryption_key`.
- [x] `app/garmin_sync.py`: per-user client cache (`dict[user_id -> Garmin]`),
      `get_garmin_client(user=None)` (bootstrap fallback for global jobs),
      MFA-aware connect/resume/disconnect/status helpers, bootstrap seeding +
      flat-token-dir migration.
- [x] `app/api.py` + `app/schemas.py`: `POST /garmin-credentials`,
      `POST /garmin-credentials/mfa`, `GET /garmin-credentials/status`,
      `DELETE /garmin-credentials`.
- [x] `app/main.py`: seed user #1 from env + migrate token dir on startup.
- [x] requirements.txt: pin `cryptography`. docker-compose.yml: pass auth/encryption env.
- [x] Frontend: types, hooks, apiDelete, Connect-Garmin section in Settings.
- [x] Tests: crypto, connect flow, bootstrap/migration; updated the two
      `get_garmin_client` tests for the new per-user cache.
- [x] Regenerated `perf/perf.db` (new users columns) — perf suite 34 passed.
- [x] Full backend (coverage 84.8% ≥ 80%) + frontend (build + 50 vitest) green.

## Review
**Migration approach (Alembic, not the old `_migrate_db`).** The plan predated
Alembic adoption; schema changes now ship as Alembic revision `b2c3d4e5f6a7`
(batch `ALTER TABLE users` for SQLite). `perf/perf.db` was regenerated via
`python -m perf.seed_perf_db` so its `users` table carries the new columns and is
stamped at the new head — required because every endpoint upserts a `User`.

**garminconnect 0.3.2 (not 0.2.25/garth).** The codebase upgraded to garminconnect
0.3.2, which dropped garth and keeps MFA state *on the client instance* rather than
returning a `client_state` dict. So `connect_garmin_start` stashes the whole
`Garmin` object in an in-memory dict (5-min TTL) and `connect_garmin_mfa` calls
`resume_login(None, code)` on it. Tokens are dumped via `client.dump()`.

**Non-breaking for the existing single-user homelab.** `get_garmin_client()` with
no args resolves the bootstrap user #1 (seeded from env on startup) and the global
sync jobs keep working. Users without a stored encrypted password fall back to the
env `GARMIN_PASSWORD`, so a deployment without `ENCRYPTION_KEY` still runs; the key
is only required to *connect* a new account in-app.

Data isolation (per-user `user_id` on every row, per-user sync jobs) is Phase 3.
</content>
