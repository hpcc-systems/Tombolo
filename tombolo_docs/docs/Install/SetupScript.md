---
sidebar_position: 1
pagination_next: null
pagination_prev: null
title: Guided Setup Script
---

# Guided Setup Script

Tombolo ships with an interactive setup script that automates the configuration steps described in the [Docker](./Docker) and [Local](./Local) setup guides. The script walks you through every required decision — install type, environment variables, Nginx configuration, cluster whitelist, and optionally launching the application — and saves your progress so it can be resumed if interrupted.

| Script              | Platform             |
| ------------------- | -------------------- |
| `setup-tombolo.sh`  | macOS / Linux (Bash) |
| `setup-tombolo.ps1` | Windows (PowerShell) |

Both scripts live in the **repository root** and produce identical results. Running either one is an alternative to following the manual step-by-step guides.

---

## Prerequisites

The same system requirements apply regardless of whether you use the scripts or the manual guides. See [Docker Setup](./Docker#system-requirements-and-prerequisites) or [Local Setup](./Local#system-requirements-and-prerequisites) for the full list.

In addition, the scripts require:

- **Python 3** — used internally to read and write `.env` files and JSON state. Available by default on macOS and most Linux distributions. Download from [python.org](https://www.python.org/downloads/) if needed.
- **Docker** (Docker install type) or **Node.js + pnpm** (local install type) — same as the manual guides.

---

## Running the Script

### macOS / Linux

From the **repository root**:

```bash
bash setup-tombolo.sh
```

or, if the file is already executable:

```bash
./setup-tombolo.sh
```

### Windows (PowerShell)

From the **repository root** in a PowerShell terminal:

```powershell
.\setup-tombolo.ps1
```

If your execution policy blocks unsigned scripts, run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\setup-tombolo.ps1
```

---

## What the Script Does

The script runs through the same steps as the manual guides. At each step it prompts you for input, shows a sensible default in brackets, and applies your answer automatically.

### Install type

```
Install type (docker/local) [docker]:
```

Choose `docker` for a containerised production-style deployment, or `local` for a developer environment running directly on your machine.

### Step 1 — Environment files

Copies `.env.sample` → `.env` and `client-reactjs/.env.sample` → `client-reactjs/.env` when they do not already exist, or prompts before overwriting.

### Step 2 — Configure environment variables

Prompts for each major configuration group. Press **Enter** to keep the current value or skip a group entirely:

- **General** — hostname, server port, HTTP/HTTPS ports
- **SSL / Nginx** — certificate path and filenames; leave blank for non-SSL
- **Database** — host, port, name, username, password, SSL flag  
  (Docker installs default to the `mysql_db` container)
- **Redis** — host, port, optional username/password, DB index  
  (Docker installs default to the `redis` container)
- **Secrets** — JWT secret, JWT refresh secret, CSRF secret, encryption key  
  (offered as auto-generate if the values are currently empty)
- **Azure AD** — tenant ID, client ID, client secret, redirect URI  
  (optional; leave blank to use traditional login only)
- **Email / SMTP** — host, port, sender address, optional credentials

All values are written directly to the `.env` files with no manual editing required.

### Step 3 — Nginx template

Selects the correct Nginx template (`nginx.conf.template-ssl` or `nginx.conf.template-no-ssl`) based on whether SSL was configured, and copies it to `nginx.conf.template`. Skipped for local installs.

### Step 4 — Cluster whitelist

Optionally create `server/cluster-whitelist.js` by entering cluster names, Thor host/port, and Roxie host/port. Multiple clusters can be added in one run. If you skip this step, the sample file is used.

### Step 5 — Docker Compose (Docker install type only)

Creates `docker-compose.yml` from `docker-compose-sample.yml`. Services for `mysql_db` and/or `redis` are automatically commented out if you opted for external instances.

Optionally runs:

```bash
docker compose build
docker compose up -d
```

Database initialisation (create schema, run migrations, seed data) runs automatically through the server container's entrypoint.

### Step 5 — Local dev commands (local install type only)

Optionally runs:

```bash
pnpm install
pnpm db:init
pnpm dev
```

---

## Resuming an Interrupted Run

The script writes progress to a `.tombolo-setup-state.json` file in the repository root. If the script exits before completing, re-run it and choose **"Continue where you left off"** — it will skip already-completed steps and restore previously saved preferences (install type, Docker service choices).

To start over from scratch, answer **"N"** to the resume prompt, or delete `.tombolo-setup-state.json` manually.

---

## After the Script

Once the script completes, Tombolo is configured and (if you opted in) already running.

- **Docker** — monitor startup with `docker compose logs -f node`. The app is available at `http://<hostname>:<http_port>` once ready.
- **Local** — the app is available at [http://localhost:3000](http://localhost:3000) by default.

For further configuration details see [Configurations](./Configurations), and for first-use guidance see the [User Guides](/docs/category/user-guides).
