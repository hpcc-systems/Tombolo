#!/usr/bin/env bash
set -euo pipefail

RELEASE_NAME="tombolo"
NAMESPACE="tombolo"
DELETE_NAMESPACE=true
DELETE_IMAGES=true
ASSUME_YES=false
STOP_PORT_FORWARDS=true
PORT_FORWARD_DIR="/tmp/tombolo-port-forward"

usage() {
  cat <<'EOF'
Usage: ./helm/tombolo/cleanup.sh [options]

Options:
  --release <name>      Helm release name to uninstall (default: tombolo).
  --namespace <name>    Kubernetes namespace (default: tombolo).
  --keep-namespace      Do not delete namespace after uninstall.
  --keep-images         Do not delete local dev images.
  --keep-port-forwards  Do not stop/remove background kubectl port-forwards.
  -y, --yes             Skip confirmation prompt.
  -h, --help            Show this help message.
EOF
}

stop_port_forward() {
  local name="$1"
  local pid_file="$PORT_FORWARD_DIR/${NAMESPACE}-${name}.pid"
  local log_file="$PORT_FORWARD_DIR/${NAMESPACE}-${name}.log"

  if [[ ! -f "$pid_file" ]]; then
    warn "No PID file found for $name port-forward ($pid_file)."
    return
  fi

  local pid
  pid="$(cat "$pid_file" 2>/dev/null || true)"
  if [[ -n "$pid" ]] && kill -0 "$pid" >/dev/null 2>&1; then
    info "Stopping $name port-forward (PID: $pid)..."
    kill "$pid" >/dev/null 2>&1 || true
  else
    warn "$name port-forward process is not running (PID: ${pid:-unknown})."
  fi

  rm -f "$pid_file"
  rm -f "$log_file"
}

info() {
  echo "[info] $*"
}

warn() {
  echo "[warn] $*"
}

error() {
  echo "[error] $*" >&2
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --release)
      RELEASE_NAME="${2:-}"
      if [[ -z "$RELEASE_NAME" ]]; then
        error "--release requires a value"
        exit 1
      fi
      shift 2
      ;;
    --namespace)
      NAMESPACE="${2:-}"
      if [[ -z "$NAMESPACE" ]]; then
        error "--namespace requires a value"
        exit 1
      fi
      shift 2
      ;;
    --keep-namespace)
      DELETE_NAMESPACE=false
      shift
      ;;
    --keep-images)
      DELETE_IMAGES=false
      shift
      ;;
    --keep-port-forwards)
      STOP_PORT_FORWARDS=false
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
      error "Unknown argument: $1"
      usage
      exit 1
      ;;
  esac
done

if ! command -v helm >/dev/null 2>&1; then
  error "helm command not found. Install Helm and ensure it is in PATH."
  exit 1
fi

if [[ "$DELETE_NAMESPACE" == true ]] && ! command -v kubectl >/dev/null 2>&1; then
  error "kubectl command not found, but namespace deletion is enabled."
  error "Use --keep-namespace or install kubectl."
  exit 1
fi

if [[ "$DELETE_IMAGES" == true ]] && ! command -v docker >/dev/null 2>&1; then
  error "docker command not found, but image deletion is enabled."
  error "Use --keep-images or install Docker."
  exit 1
fi

REQUIRED_IMAGES=(
  "tombolo-server:dev"
  "tombolo-jobs:dev"
  "tombolo-client:dev"
)

if [[ "$ASSUME_YES" != true ]]; then
  if [[ ! -t 0 ]]; then
    warn "Non-interactive mode detected without --yes; cancelling cleanup."
    warn "Re-run with --yes to allow non-interactive cleanup."
    exit 1
  else
    echo "This will perform cleanup with the following settings:"
    echo "  Release:            $RELEASE_NAME"
    echo "  Namespace:          $NAMESPACE"
    echo "  Delete namespace:   $DELETE_NAMESPACE"
    echo "  Delete local images:$DELETE_IMAGES"
    echo "  Stop port-forwards: $STOP_PORT_FORWARDS"
    echo
    read -r -p "Continue? [y/N]: " CONFIRM
    if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
      info "Cleanup cancelled."
      exit 0
    fi
  fi
fi

if helm status "$RELEASE_NAME" -n "$NAMESPACE" >/dev/null 2>&1; then
  info "Uninstalling Helm release '$RELEASE_NAME' from namespace '$NAMESPACE'..."
  helm uninstall "$RELEASE_NAME" -n "$NAMESPACE"
  info "Helm release uninstalled."
else
  warn "Helm release '$RELEASE_NAME' not found in namespace '$NAMESPACE'. Skipping uninstall."
fi

if [[ "$DELETE_NAMESPACE" == true ]]; then
  if kubectl get namespace "$NAMESPACE" >/dev/null 2>&1; then
    info "Deleting namespace '$NAMESPACE'..."
    kubectl delete namespace "$NAMESPACE" --wait=false --ignore-not-found=true
    info "Namespace deletion requested (non-blocking)."
  else
    warn "Namespace '$NAMESPACE' not found. Skipping namespace deletion."
  fi
fi

if [[ "$DELETE_IMAGES" == true ]]; then
  info "Deleting local dev images (if present)..."
  for image in "${REQUIRED_IMAGES[@]}"; do
    if docker image inspect "$image" >/dev/null 2>&1; then
      docker image rm "$image" >/dev/null
      info "Deleted image: $image"
    else
      warn "Image not found: $image"
    fi
  done
fi

if [[ "$STOP_PORT_FORWARDS" == true ]]; then
  info "Stopping background port-forwards (if present)..."
  stop_port_forward "client"
  stop_port_forward "server"
  stop_port_forward "jobs"

  if [[ -d "$PORT_FORWARD_DIR" ]]; then
    # Remove the directory if it is empty after cleaning current namespace files.
    rmdir "$PORT_FORWARD_DIR" >/dev/null 2>&1 || true
  fi
fi

info "Cleanup complete."
