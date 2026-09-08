# Human Atlas

An interactive 3D anatomy explorer built with React, Three.js, and shadcn/ui. Take the BodyParts3D adult male reference apart into **2,234 individually selectable meshes**, explore **15 anatomical systems**, and search **3,432 named concepts**.

**[Explore the live demo](https://human-atlas-seven.vercel.app)**

> Originally shared by [Charly Wargnier](https://www.linkedin.com/posts/charlywargnier_this-is-wild-someone-used-gpt-6-astra-to-ugcPost-7502158259198263297-UZF6/). Created by [Ashe Magalhaes](https://x.com/ashebytes). Snowflake deployment and UX enhancements by Joe Warbington using [Cortex Code](https://docs.snowflake.com/en/user-guide/cortex-code/cortex-code).

## Explore

- Orbit, zoom, and select structures directly on the body.
- Scroll to zoom toward the cursor; middle-click to pan.
- Toggle individual systems or use skeleton and organ presets.
- Play or reverse the explode animation, or drag the scrubber to any position.
- Search anatomical names and source identifiers.
- Isolate a selected structure and read its details — selected parts pulse with a subtle glow.
- Switch between dark and light mode.
- Use compact controls and detail panels on mobile.

## Run locally

Requires Node.js 22.13 or newer. No API keys or accounts are needed.

```sh
npm ci
npm run dev
```

Open http://localhost:3016. To build the static site, run `npm run build`; the output is in `dist/`.

## Deploy to Snowflake (SPCS)

This repository includes everything needed to deploy to [Snowpark Container Services](https://docs.snowflake.com/en/developer-guide/snowpark-container-services/overview). The app runs as a static site served by nginx inside a container.

### Prerequisites

- A Snowflake account with SPCS enabled
- Docker installed locally
- The [Snowflake CLI](https://docs.snowflake.com/en/developer-guide/snowflake-cli/index) (`snow`) or Snowsight for running SQL

### Steps

1. **Create the Snowflake infrastructure:**

```sql
CREATE DATABASE IF NOT EXISTS HUMAN_ATLAS_DB;
CREATE IMAGE REPOSITORY IF NOT EXISTS HUMAN_ATLAS_DB.PUBLIC.HUMAN_ATLAS_REPO;
CREATE STAGE IF NOT EXISTS HUMAN_ATLAS_DB.PUBLIC.SPECS ENCRYPTION = (TYPE = 'SNOWFLAKE_SSE');

CREATE COMPUTE POOL IF NOT EXISTS HUMAN_ATLAS_POOL
  MIN_NODES = 1 MAX_NODES = 1
  INSTANCE_FAMILY = CPU_X64_XS
  AUTO_RESUME = TRUE
  AUTO_SUSPEND_SECS = 3600;
```

2. **Get your registry URL:**

```sql
SHOW IMAGE REPOSITORIES IN SCHEMA HUMAN_ATLAS_DB.PUBLIC;
-- Note the repository_url column, e.g.:
-- <account>.registry.snowflakecomputing.com/human_atlas_db/public/human_atlas_repo
```

3. **Build, push, and deploy:**

```sh
# Log in to the Snowflake container registry
docker login <repository_url> -u <username>

# Build the image (linux/amd64 required for SPCS)
docker build --platform linux/amd64 -t <repository_url>/human-atlas:latest .

# Push to Snowflake
docker push <repository_url>/human-atlas:latest

# Upload the service spec
snow stage copy service-spec.yaml @HUMAN_ATLAS_DB.PUBLIC.SPECS
```

4. **Create the service:**

```sql
CREATE SERVICE HUMAN_ATLAS_DB.PUBLIC.HUMAN_ATLAS_SERVICE
  IN COMPUTE POOL HUMAN_ATLAS_POOL
  FROM @HUMAN_ATLAS_DB.PUBLIC.SPECS
  SPECIFICATION_FILE = 'service-spec.yaml'
  MIN_INSTANCES = 1 MAX_INSTANCES = 1;
```

5. **Get the endpoint URL:**

```sql
SHOW ENDPOINTS IN SERVICE HUMAN_ATLAS_DB.PUBLIC.HUMAN_ATLAS_SERVICE;
-- Open the ingress_url in your browser (requires Snowflake authentication)
```

### Redeploying after changes

Rebuild the image, push it, then drop and recreate the service to pull the new image:

```sql
DROP SERVICE HUMAN_ATLAS_DB.PUBLIC.HUMAN_ATLAS_SERVICE;
CREATE SERVICE HUMAN_ATLAS_DB.PUBLIC.HUMAN_ATLAS_SERVICE
  IN COMPUTE POOL HUMAN_ATLAS_POOL
  FROM @HUMAN_ATLAS_DB.PUBLIC.SPECS
  SPECIFICATION_FILE = 'service-spec.yaml'
  MIN_INSTANCES = 1 MAX_INSTANCES = 1;
```

### Files

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage build: Node 22 alpine (build) then nginx alpine (serve) |
| `nginx.conf` | Gzip passthrough for `.bin.gz` anatomy files, SPA routing, health check |
| `service-spec.yaml` | SPCS container spec with public endpoint on port 8080 |
| `.dockerignore` | Excludes `node_modules`, `dist`, `.git` from build context |

## Deploy to Vercel

Import this repository into Vercel as a Vite project. The included `vercel.json` configures `npm ci`, `npm run build`, and the `dist` output directory. It can also be served by any static host.

## Validate

```sh
npm run check
node scripts/validate-atlas.mjs
node scripts/validate-interactions.mjs
npm run build
```

Validation covers mesh buffers, names and concept membership, nonoverlapping exploded layouts at desktop and mobile aspect ratios, search and inspection contracts, and tap-versus-drag handling. Browser interaction checks have exercised selection, system controls, search, isolation, rotation, and 390x844, 320x568, and 844x390 layouts. Phone controls stay clear of the exploded inventory, and isolated structures fit the space above or beside the detail panel. Physical-device performance and real multitouch hardware have not been tested.

## Anatomy data

The current viewer uses **BodyParts3D 4.0**, an adult male reference anatomy, licensed **CC BY 4.0**. It does not represent every human structure or variation. Individual source meshes are distinct from named concepts, which may group multiple meshes. Descriptions distinguish general system context from individual organ explanations.

Geometry is simplified for browser performance while retaining every source mesh. The packaged model contains 2,288,268 triangles and downloads approximately 33 MB of compressed geometry. Full credits, source links, and adaptation details are in [ATTRIBUTION.md](public/ATTRIBUTION.md).

This is an educational explorer, not a diagnostic or surgical tool.

## How it works

Geometry is merged into batches. Per-structure GPU textures control translation, visibility, and selection, while component geometry supports accurate picking. Exploded layouts pack only the visible pieces. Rendering updates when the scene changes; orbit controls remain responsive without thousands of separate draw calls.

The optional WebMCP tools expose anatomy search and inspection in compatible browsers. The visible interface works without them.

## Rebuilding geometry

The repository includes browser-ready geometry. Rebuilding it is optional: obtain the official BodyParts3D OBJ archive and English metadata tables, prepare the joined concepts and display-system mappings, run `scripts/convert-anatomy.py`, then `node scripts/optimize-anatomy.mjs` and `node scripts/compress-models.mjs`. Simplification uses a 0.2% relative error limit per structure.

## License

Original application code is released under the [MIT License](LICENSE). **The anatomy data has its own CC BY 4.0 license**; preserve the attribution when redistributing it. Third-party dependencies retain their respective licenses.

Issues and pull requests are welcome. Please include reproduction steps and browser/device details for interaction problems.
