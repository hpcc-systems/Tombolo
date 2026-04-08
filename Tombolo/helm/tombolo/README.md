# Tombolo Helm Chart

This chart is the source of truth for Tombolo Kubernetes application configuration.

## Configuration Model

- Base defaults: `values.yaml`
- Environment overrides: `values-<env>.yaml` (for example `values-dev.yaml`)
- Secrets: managed by Helm Secret templates, supplied via `values-secrets.<env>.yaml` (for example `values-secrets.dev.yaml`)

Runtime DB/Redis resources are also managed by Helm:

- `tombolo-runtime-config` from `runtime.config`
- `tombolo-runtime-secrets` from `runtime.secret`

`tombolo-runtime-config` includes these runtime keys:

- `DB_HOSTNAME`
- `DB_PORT`
- `DB_NAME`
- `REDIS_DB`
- `REDIS_HOST`
- `REDIS_PORT`

`REDIS_HOST` and `REDIS_PORT` default to chart-managed Redis settings (service `tombolo-redis` and `.Values.redis.service.port`) when left empty in `runtime.config`.

## Script Workflow (Recommended)

Run from repo root:

```bash
./Tombolo/helm/tombolo/prepare.sh --env dev --build-images
./Tombolo/helm/tombolo/run.sh --env dev --wait
```

When finished:

```bash
./Tombolo/helm/tombolo/cleanup.sh
```

## Secrets (Helm Managed, Not Committed)

1. Create an env-specific secrets file via `prepare.sh`:

```bash
./Tombolo/helm/tombolo/prepare.sh --env dev
```

This creates `Tombolo/helm/tombolo/values-secrets.dev.yaml` from `values-secrets.example.yaml` if it does not exist.

2. Fill real secret values in `values-secrets.<env>.yaml`.

At minimum, set:

- `runtime.secret.DB_USERNAME`
- `runtime.secret.DB_PASSWORD`
- `runtime.secret.REDIS_PASSWORD`
- `server.secret.*`
- `jobs.secret.JOBS_API_KEY`

3. Deploy with the local secrets file included.

`values-secrets.<env>.yaml` files are ignored by git via `.gitignore`.

The chart validates required secrets at render/install time and fails fast if any are empty.

Required keys:

- `server.secret.JWT_SECRET`
- `server.secret.JWT_REFRESH_SECRET`
- `server.secret.CSRF_SECRET`
- `server.secret.ENCRYPTION_KEY`
- `server.secret.JOBS_API_KEY`
- `jobs.secret.JOBS_API_KEY`
- `runtime.secret.DB_USERNAME`
- `runtime.secret.DB_PASSWORD`
- `runtime.secret.REDIS_PASSWORD`

## Install/Upgrade

```bash
helm upgrade --install tombolo Tombolo/helm/tombolo \
  -n tombolo \
  --create-namespace \
  -f Tombolo/helm/tombolo/values.yaml \
  -f Tombolo/helm/tombolo/values-dev.yaml \
  -f Tombolo/helm/tombolo/values-secrets.dev.yaml
```

## Render Only

```bash
helm template tombolo Tombolo/helm/tombolo \
  -n tombolo \
  -f Tombolo/helm/tombolo/values.yaml \
  -f Tombolo/helm/tombolo/values-dev.yaml \
  -f Tombolo/helm/tombolo/values-secrets.dev.yaml
```

For another environment (example `aks`), use `--env aks` with scripts and `values-secrets.aks.yaml` in manual Helm commands.

## Validate Deployment

1. Validate workloads and pods:

```bash
kubectl get deploy,statefulset,svc,ing -n tombolo
kubectl get pods -n tombolo
```

2. Smoke test endpoints:

```bash
kubectl -n tombolo port-forward svc/tombolo-client 3000:80
kubectl -n tombolo port-forward svc/tombolo-server 3001:3001
kubectl -n tombolo port-forward svc/tombolo-jobs 8678:8678
```

## Cleanup

Tear down the local/dev Helm deployment and optionally remove namespace and local images:

```bash
./helm/tombolo/cleanup.sh
```

Common variants:

```bash
./helm/tombolo/cleanup.sh --keep-images
./helm/tombolo/cleanup.sh --keep-namespace
./helm/tombolo/cleanup.sh -y
```
