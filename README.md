# Haulio - Running Instructions

Follow these instructions to configure and run the application locally or via Docker.

---

## ⚙️ Environment Configuration

The application communicates with the backend operations service via the `BACKEND_URL` environment variable. Ensure the correct environment configurations are set before running:

- **Local Development** (`.env.local`):
  ```env
  BACKEND_URL=http://127.0.0.1:3001
  ```

---

## 🛠️ Running Locally (Node.js)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 3. Run Production Build
```bash
npm run build
npm start
```

---

## 🐳 Running the local demo with Docker

Each repository owns one Compose command. They share the `haulio-local-demo`
Docker network, so the backend resolves the DS as `http://ds:8088/` and the
frontend resolves the backend as `http://be:3001`. Start them in this order:

```bash
# 1. DS — from the directory containing all three repositories
cd compfest-aic-2026-ds/real_policy/submission
COMPOSE_IGNORE_ORPHANS=1 docker compose up --build -d
curl --fail http://127.0.0.1:8088/health

# 2. BE — starts NestJS, PostgreSQL, and MQTT
cd ../../../haulio-be
COMPOSE_IGNORE_ORPHANS=1 docker compose up --build -d
curl --fail http://127.0.0.1:3001/api/v1/health

# 3. Seed 300 realistic synthetic trucks after BE is healthy
docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U postgres -d haulio_demo < scripts/seed-demo-data.sql

# 4. FE — dispatcher dashboard
cd ../compfest-aic-2026-fe
COMPOSE_IGNORE_ORPHANS=1 docker compose up --build -d
curl --fail http://127.0.0.1:3000/
```

Each command starts only the service(s) owned by that repository. The DS must
be running before the BE, and the BE must be running before requests through
the FE API proxy can succeed. `COMPOSE_IGNORE_ORPHANS=1` prevents Compose from
mistaking the services owned by the other two repositories for stale containers.

Open [http://127.0.0.1:3000/admin](http://127.0.0.1:3000/admin). The services are exposed
as follows:

| Service | URL | Purpose |
| --- | --- | --- |
| FE | `http://127.0.0.1:3000/admin` | Next.js dispatcher application (also `http://<host-ip>:3000/admin` on the same LAN) |
| BE | `http://127.0.0.1:3001/api` | NestJS and telemetry persistence |
| DS | `http://127.0.0.1:8088/health` | Frozen real-data policy |

Check the container path without revealing any credentials:

```bash
curl --fail http://127.0.0.1:8088/health
curl --fail http://127.0.0.1:3001/api/v1/health
curl --fail http://127.0.0.1:3000/
```

The DS deliberately exposes immutable `/infer/*` policy endpoints. For the
local demo, the backend serves the operations-map contract (`/fleet`,
`/regions`, `/recommendations`) from persisted PostgreSQL truck state and
telemetry. Its traffic colours are a labelled local telemetry heuristic; live
Google traffic remains an on-demand dispatcher confirmation, not training data.

For Google road-following route geometry and alternatives, create the
server-side `GOOGLE_MAP_API` key in `../compfest-aic-2026-ds/.env`; the backend
Compose file imports it automatically. The full safe key setup is in the
[DS local-demo guide](https://github.com/ElFariss/compfest-aic-2026-ds#hackathon-local-demo-ds--be--fe). Never put that key in frontend configuration.

To stop a component, run `docker compose down` from that component's repository.
