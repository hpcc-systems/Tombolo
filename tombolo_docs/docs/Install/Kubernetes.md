---
sidebar_position: 5
title: Kubernetes Deployment
---

# Kubernetes Deployment

This guide deploys Tombolo runtime services on Kubernetes using the Helm workflow scripts:

- `Tombolo/helm/tombolo/prepare.sh`
- `Tombolo/helm/tombolo/run.sh`
- `Tombolo/helm/tombolo/cleanup.sh`

Services deployed:

- `server`
- `client-reactjs`
- `jobs`
- `redis`

MySQL is not deployed in-cluster by these manifests. Point Tombolo to an external MySQL endpoint using environment variables.

Ingress/service routing behavior:

- `/api` and `/socket.io` to `server`
- `/` to `client`

## Prerequisites

- Kubernetes cluster with an ingress controller (Nginx Ingress assumed)
- Docker (for local image builds and common local clusters such as Docker Desktop Kubernetes or kind)
- `kubectl`
- Helm 3
- Bash shell execution support (you can run `*.sh` scripts and they are executable)
- Stakater Reloader controller (for automatic pod rollouts on Secret/ConfigMap changes)
- Container registry credentials if images are private

For local development, ensure `kubectl config current-context` points at the intended cluster before deploying.

## Container Images

Update image repositories/tags for your registry:

- `ghcr.io/hpcc-systems/tombolo-server`
- `ghcr.io/hpcc-systems/tombolo-client`
- `ghcr.io/hpcc-systems/tombolo-jobs`

## Deploy with Helm

### Script Workflow (Recommended)

From repo root, run in this order:

```bash
./Tombolo/helm/tombolo/prepare.sh --build-images
./Tombolo/helm/tombolo/run.sh --wait
```

When done:

```bash
./Tombolo/helm/tombolo/cleanup.sh
```

### Step 1: Prepare

From repo root:

```bash
./Tombolo/helm/tombolo/prepare.sh --build-images
```

What `prepare.sh` does:

1. Creates `Tombolo/helm/tombolo/values-secrets.local.yaml` from `values-secrets.example.yaml` if missing
2. Runs Helm template validation using:
   - `Tombolo/helm/tombolo/values.yaml`
   - `Tombolo/helm/tombolo/values-dev.yaml`
   - `Tombolo/helm/tombolo/values-secrets.local.yaml`
3. Checks required local images (`tombolo-server:dev`, `tombolo-jobs:dev`, `tombolo-client:dev`)
4. Builds/rebuilds dev images when prompted, or immediately when `--build-images` is passed

If `values-secrets.local.yaml` is newly created, edit it and set real secret values before deploy.

### Step 2: Run

```bash
./Tombolo/helm/tombolo/run.sh --wait
```

What `run.sh` does:

1. Deploys or upgrades Helm release `tombolo` in namespace `tombolo`
2. Uses:
   - `Tombolo/helm/tombolo/values.yaml`
   - `Tombolo/helm/tombolo/values-dev.yaml`
   - `Tombolo/helm/tombolo/values-secrets.local.yaml`
3. Starts background port-forwards by default:
   - `localhost:3000 -> svc/tombolo-client:80`
   - `localhost:3001 -> svc/tombolo-server:3001`
   - `localhost:8678 -> svc/tombolo-jobs:8678`

Useful `run.sh` flags:

- `--prepare`: run `prepare.sh` before deploy
- `--build-images`: implies `--prepare` and rebuilds local dev images
- `--wait`: wait for resources to become ready
- `--no-port-forward`: skip background port-forwards
- `--namespace <name>`: override namespace
- `--release <name>`: override release name

### Step 3: Cleanup

```bash
./Tombolo/helm/tombolo/cleanup.sh
```

What `cleanup.sh` does:

1. Uninstalls the Helm release
2. Deletes namespace `tombolo` (default)
3. Deletes local dev images (default)
4. Stops/removes background port-forwards (default)

Useful `cleanup.sh` flags:

- `--keep-namespace`
- `--keep-images`
- `--keep-port-forwards`
- `-y, --yes`

### Manual Helm Command (Equivalent to run script)

```bash
helm upgrade --install tombolo Tombolo/helm/tombolo \
  -n tombolo \
  --create-namespace \
  -f Tombolo/helm/tombolo/values.yaml \
  -f Tombolo/helm/tombolo/values-dev.yaml \
  -f Tombolo/helm/tombolo/values-secrets.local.yaml
```

## Secret And Config Inputs

The chart intentionally splits config:

- Non-sensitive settings in ConfigMaps
- Sensitive settings in Secrets

For Helm, shared runtime DB/Redis values are sourced from:

- ConfigMap: `tombolo-runtime-config` (from `runtime.config`)
- Secret: `tombolo-runtime-secrets` (from `runtime.secret`)

Do not duplicate those shared DB/Redis values in service-specific sections.

See [Kubernetes Environment Variables](./Kubernetes-Environment-Variables) for full setup, including Akeyless.

## Validate Before Deploying

```bash
helm lint Tombolo/helm/tombolo
helm template tombolo Tombolo/helm/tombolo \
  -f Tombolo/helm/tombolo/values.yaml \
  -f Tombolo/helm/tombolo/values-dev.yaml \
  -f Tombolo/helm/tombolo/values-secrets.local.yaml > /tmp/tombolo-helm-dev.yaml
```

## Basic Smoke Checks

```bash
kubectl get pods -n tombolo
kubectl get ingress -n tombolo
kubectl get svc -n tombolo
```

Server health endpoint:

```bash
kubectl -n tombolo port-forward svc/tombolo-server 3001:3001
curl -f http://localhost:3001/api/status/health
```

Client + API through the client route:

```bash
kubectl -n tombolo port-forward svc/tombolo-client 3000:80
curl -f http://localhost:3000/api/status/health
```

## Security Notes

- Keep `jobs` service internal unless you explicitly require external Bull Board access.
- Store all sensitive values in Kubernetes Secrets, not ConfigMaps.
- Rotate `JOBS_API_KEY`, JWT secrets, and Akeyless access keys regularly.
