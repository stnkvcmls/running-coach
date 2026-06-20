FROM node:20-slim AS frontend-build
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM python:3.12-slim
WORKDIR /app

# Cap glibc malloc arenas. The sync jobs run in APScheduler worker threads and
# do large, bursty JSON/stream allocations; glibc otherwise spins up one arena
# per thread (default 8 x ncores) and rarely returns that memory to the OS, so
# RSS ratchets up on every sync and never comes back down. Capping arenas and
# lowering the trim threshold keeps the resident set bounded.
ENV MALLOC_ARENA_MAX=2 \
    MALLOC_TRIM_THRESHOLD_=131072

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/
COPY static/ ./static/

COPY --from=frontend-build /frontend/dist /app/frontend/dist

RUN mkdir -p /data

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
