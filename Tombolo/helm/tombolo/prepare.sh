#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHART_DIR="$SCRIPT_DIR"
MONOREPO_ROOT="$(cd "$CHART_DIR/../../.." && pwd)"
ENV_NAME="dev"
SECRETS_FILE=""
SECRETS_EXAMPLE="$CHART_DIR/values-secrets.example.yaml"
FORCE_BUILD_IMAGES=false
ASSUME_YES=false
PROMPT_TIMEOUT_SECONDS=20

usage() {
  cat <<'EOF'
Usage: ./helm/tombolo/prepare.sh [--env <name>] [--build-images] [--yes] [--help]

Options:
  --env <name>    Values environment name; uses values-<name>.yaml and values-secrets.<name>.yaml (default: dev).
  --build-images  Build all local dev images without prompting.
  -y, --yes       Non-interactive mode; skip prompts.
  -h, --help      Show this help message.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env)
      ENV_NAME="${2:-}"
      if [[ -z "$ENV_NAME" ]]; then
        echo "[error] --env requires a value" >&2
        usage
        exit 1
      fi
      shift 2
      ;;
    --build-images)
      FORCE_BUILD_IMAGES=true
      shift
      ;;
    -y|--yes)
      ASSUME_YES=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "[error] Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

SECRETS_FILE="$CHART_DIR/values-secrets.${ENV_NAME}.yaml"
ENV_VALUES_FILE="$CHART_DIR/values-${ENV_NAME}.yaml"

if [[ ! -f "$ENV_VALUES_FILE" ]]; then
  echo "[error] Environment values file not found: $ENV_VALUES_FILE" >&2
  echo "[error] Create values-${ENV_NAME}.yaml or pass a valid --env value." >&2
  exit 1
fi

info() {
  echo "[info] $*"
}

error() {
  echo "[error] $*" >&2
}

print_image_status() {
  local image="$1"
  if docker image inspect "$image" >/dev/null 2>&1; then
    info "Found image: $image"
    return 0
  fi

  error "Missing image: $image"
  return 1
}

rebuild_dev_images() {
  info "Rebuilding local dev images from: $MONOREPO_ROOT"
  (
    cd "$MONOREPO_ROOT"
    docker build -f Tombolo/Dockerfile --target server -t tombolo-server:dev .
    docker build -f Tombolo/Dockerfile --target jobs -t tombolo-jobs:dev .
    docker build -f Tombolo/Dockerfile --target client -t tombolo-client:dev .
  )
}

collect_missing_images() {
  MISSING_IMAGES=()
  for image in "${REQUIRED_IMAGES[@]}"; do
    if ! print_image_status "$image"; then
      MISSING_IMAGES+=("$image")
    fi
  done
}

if [[ -f "$SECRETS_FILE" ]]; then
  info "Found values-secrets.${ENV_NAME}.yaml. It will be used."
else
  if [[ ! -f "$SECRETS_EXAMPLE" ]]; then
    error "Missing example secrets file: $SECRETS_EXAMPLE"
    exit 1
  fi

  cp "$SECRETS_EXAMPLE" "$SECRETS_FILE"
  info "Created values-secrets.${ENV_NAME}.yaml from values-secrets.example.yaml"
  info "Please edit $SECRETS_FILE and set real secret values before deploying."
  info "Continuing without waiting for keypress."
fi

info "Running Helm template validation..."
RENDER_OUT="/tmp/tombolo-helm-render.yaml"
if ! helm template tombolo "$CHART_DIR" -n tombolo \
  -f "$CHART_DIR/values.yaml" \
  -f "$ENV_VALUES_FILE" \
  -f "$SECRETS_FILE" >"$RENDER_OUT"; then
  error "Helm template validation failed."
  exit 1
fi
info "Helm template validation passed."

if ! command -v docker >/dev/null 2>&1; then
  error "docker command not found. Install Docker Desktop or ensure docker is in PATH."
  exit 1
fi

info "Checking required local Docker images..."
MISSING_IMAGES=()
REQUIRED_IMAGES=(
  "tombolo-server:dev"
  "tombolo-jobs:dev"
  "tombolo-client:dev"
)

collect_missing_images

echo
if [[ "$FORCE_BUILD_IMAGES" == true ]]; then
  REBUILD_CHOICE="y"
  info "--build-images set; building local dev images without prompt."
elif [[ "$ASSUME_YES" == true || ! -t 0 ]]; then
  REBUILD_CHOICE="n"
  info "Non-interactive mode detected; skipping image rebuild prompt."
else
  if read -r -t "$PROMPT_TIMEOUT_SECONDS" -p "Build all local dev images now (server/jobs/client)? [y/N]: " REBUILD_CHOICE; then
    :
  else
    REBUILD_CHOICE="n"
    echo
    info "No input received within ${PROMPT_TIMEOUT_SECONDS}s; defaulting to 'No'."
  fi
fi

if [[ "$REBUILD_CHOICE" =~ ^[Yy]$ ]]; then
  rebuild_dev_images

  info "Re-checking required local Docker images after rebuild..."
  collect_missing_images
fi

if [[ ${#MISSING_IMAGES[@]} -gt 0 ]]; then
  error "Missing required local images:"
  for image in "${MISSING_IMAGES[@]}"; do
    error "  - $image"
  done
  exit 1
fi

info "All checks passed."
