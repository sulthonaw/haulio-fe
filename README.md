# Haulio - Running Instructions

Follow these instructions to configure and run the application locally or via Docker.

---

## ⚙️ Environment Configuration

The application communicates with the backend operations service via the `BACKEND_URL` environment variable. Ensure the correct environment configurations are set before running:

- **Local Development** (`.env.development`):
  ```env
  BACKEND_URL=http://localhost:8080
  PORT=3000
  ```
- **Staging environment** (`.env.staging`):
  ```env
  BACKEND_URL=https://staging-api.haulio.id
  PORT=3000
  ```
- **Production environment** (`.env.production`):
  ```env
  BACKEND_URL=https://api.haulio.id
  PORT=3000
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

### 1. Build Production Container Image
```bash
docker build -t haulio-fe:latest .
```

### 2. Run with Docker Compose
We support running different profile configurations through docker-compose services:

- **Run Development Profile** (runs on port `3000`):
  ```bash
  docker compose up haulio-fe-dev
  ```
- **Run Staging Profile** (runs on port `3001`):
  ```bash
  docker compose up haulio-fe-staging
  ```
- **Run Production Profile** (runs on port `3002`):
  ```bash
  docker compose up haulio-fe-prod
  ```
