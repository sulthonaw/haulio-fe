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

## 🐳 Running with Docker

The Compose file in this repository launches the complete local-demo stack:
the Next.js frontend, NestJS backend, frozen DS policy, PostgreSQL, and the
loopback-only MQTT broker. The sibling repositories must remain next to this
directory.

```bash
docker compose up --build -d
docker compose ps
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). The services are exposed
only on loopback:

| Service | URL | Purpose |
| --- | --- | --- |
| FE | `http://127.0.0.1:3000` | Next.js application |
| BE | `http://127.0.0.1:3001/api` | NestJS and telemetry persistence |
| DS | `http://127.0.0.1:8088/health` | Frozen real-data policy |

Check the container path without revealing any credentials:

```bash
curl --fail http://127.0.0.1:8088/health
curl --fail http://127.0.0.1:3001/api/v1/health
curl --fail http://127.0.0.1:3000/
```

The teammate's DS release intentionally exposes immutable `/infer/*` policy
endpoints, while the map UI still expects the earlier operations-map contract
(`/fleet`, `/regions`, `/recommendations`). All three containers run together,
but adapting that map contract to the new real-policy API is a separate product
integration; this Compose setup does not fabricate a fleet response.

Stop the local demo with:

```bash
docker compose down
```
