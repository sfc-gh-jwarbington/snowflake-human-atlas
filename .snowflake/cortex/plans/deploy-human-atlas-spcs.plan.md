# Plan: Deploy Human Atlas to Snowflake (SPCS)

## Context

The **Human Atlas** is a pure static SPA (React 19 + Three.js + Vite) that visualizes 2,234 anatomical meshes in 3D. It has zero backend dependencies — just ~33 MB of compressed geometry served as static files. Currently deployed to Vercel.

**Deployment target:** Snowpark Container Services (SPCS) with nginx serving the static build.

## Step 1: Create Dockerfile

Multi-stage build:
- **Stage 1 (build):** Node 22 alpine, `npm ci`, `npm run build` → produces `dist/`
- **Stage 2 (serve):** nginx alpine, copy `dist/` to `/usr/share/nginx/html`
- Custom `nginx.conf`:
  - Serve `.bin.gz` files with `Content-Encoding: gzip` and `Content-Type: application/octet-stream`
  - SPA fallback: `try_files $uri $uri/ /index.html`
  - Listen on port 8080 (SPCS convention)
  - Cache headers for model assets

## Step 2: Create SPCS Service Spec

A `service-spec.yaml` defining:
- Container name, image path (from Snowflake image repo)
- Single endpoint on port 8080, public access
- Resource limits (small — static file serving is lightweight)

## Step 3: Build & Push Image

```bash
docker build -t human-atlas .
docker tag human-atlas <registry>/human_atlas_db/public/human_atlas_repo/human-atlas:latest
docker push <registry>/human_atlas_db/public/human_atlas_repo/human-atlas:latest
```

## Step 4: Snowflake Infrastructure SQL

```sql
CREATE DATABASE IF NOT EXISTS HUMAN_ATLAS_DB;
CREATE IMAGE REPOSITORY IF NOT EXISTS HUMAN_ATLAS_DB.PUBLIC.HUMAN_ATLAS_REPO;
-- Use existing compute pool or create one
CREATE SERVICE HUMAN_ATLAS_DB.PUBLIC.HUMAN_ATLAS_SERVICE
  IN COMPUTE POOL <pool>
  FROM SPECIFICATION_FILE='service-spec.yaml'
  EXTERNAL_ACCESS_INTEGRATIONS = ()
  MIN_INSTANCES=1 MAX_INSTANCES=1;
```

## Step 5: Verify

- `SHOW SERVICES` / `DESCRIBE SERVICE` to get endpoint URL
- Open in browser, confirm 3D model loads and interactions work

## Step 6: GUPPI Registration

Register the Human Atlas as a product in GUPPI and create a deployment story to track the work.

## Key Decisions

- **Port 8080** — SPCS standard for HTTP services
- **nginx alpine** — minimal image size (~30 MB base + ~40 MB dist = ~70 MB total)
- **No auth** — the app is a public demo; SPCS endpoint can be toggled public/private
- **No Snowflake connectivity** — the app is fully self-contained
