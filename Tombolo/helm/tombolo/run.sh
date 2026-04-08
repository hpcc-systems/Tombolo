#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHART_DIR="$SCRIPT_DIR"
RELEASE_NAME="tombolo"
NAMESPACE="tombolo"
ENV_NAME="dev"
FORCE_BUILD_IMAGES=false
RUN_PREPARE=false
HELM_WAIT=false
HELM_TIMEOUT="10m"
START_PORT_FORWARD=true
PORT_FORWARD_DIR="/tmp/tombolo-port-forward"
PORT_FORWARD_RETRIES=20
PORT_FORWARD_RETRY_DELAY=2

usage() {
	cat <<'EOF'
Usage: ./helm/tombolo/run.sh [options]

Options:
	--prepare           Run prepare checks before deploy (default: off).
	--build-images      Build local dev images via prepare step; implies --prepare.
	--skip-prepare      Deprecated alias (prepare is already skipped by default).
	--env <name>        Values environment name; loads values-<name>.yaml (default: dev).
	--release <name>    Helm release name (default: tombolo).
	--namespace <name>  Kubernetes namespace (default: tombolo).
	--wait              Wait for resources to become ready.
	--no-wait           Do not wait for resources to become ready.
	--port-forward      Start non-blocking kubectl port-forwards after deploy (default: on).
	--no-port-forward   Skip starting kubectl port-forwards.
	--timeout <dur>     Helm wait timeout (default: 10m).
	-h, --help          Show this help message.
EOF
}

cleanup_stale_port_forward_on_local_port() {
	local local_port="$1"
	local service="$2"
	local remote_port="$3"
	local pids

	pids="$(lsof -tiTCP:"$local_port" -sTCP:LISTEN 2>/dev/null | tr '\n' ' ' | xargs 2>/dev/null || true)"
	if [[ -z "$pids" ]]; then
		return 0
	fi

	local pid
	for pid in $pids; do
		local cmd
		cmd="$(ps -p "$pid" -o command= 2>/dev/null || true)"
		if [[ -z "$cmd" ]]; then
			continue
		fi

		# Only auto-kill kubectl port-forwards; never kill arbitrary app processes.
		if [[ "$cmd" == *"kubectl"*"port-forward"* ]]; then
			echo "[info] Replacing stale kubectl port-forward on localhost:${local_port} (PID: $pid)..."
			kill "$pid" >/dev/null 2>&1 || true
		fi
	done

	# Give the OS a moment to release the socket before next bind attempt.
	sleep 1
}

start_port_forward() {
	local service="$1"
	local local_port="$2"
	local remote_port="$3"
	local name="$4"
	local log_file="$PORT_FORWARD_DIR/${NAMESPACE}-${name}.log"
	local pid_file="$PORT_FORWARD_DIR/${NAMESPACE}-${name}.pid"
	local attempt=1

	# Stop previously started port-forward process if we have a PID file.
	if [[ -f "$pid_file" ]]; then
		local old_pid
		old_pid="$(cat "$pid_file" 2>/dev/null || true)"
		if [[ -n "$old_pid" ]] && kill -0 "$old_pid" >/dev/null 2>&1; then
			echo "[info] Stopping existing port-forward for $name (PID: $old_pid)..."
			kill "$old_pid" >/dev/null 2>&1 || true
		fi
		rm -f "$pid_file"
	fi

	while [[ $attempt -le $PORT_FORWARD_RETRIES ]]; do
		: >"$log_file"
		nohup kubectl -n "$NAMESPACE" port-forward "svc/${service}" "${local_port}:${remote_port}" >"$log_file" 2>&1 &
		local pf_pid=$!
		echo "$pf_pid" >"$pid_file"

		# kubectl may exit immediately if no running endpoint is available yet.
		sleep 1
		if kill -0 "$pf_pid" >/dev/null 2>&1; then
			echo "[info] Port-forward started for $name: localhost:${local_port} -> svc/${service}:${remote_port} (PID: $pf_pid)"
			echo "[info] Logs: $log_file"
			return 0
		fi

		if grep -q "address already in use" "$log_file" 2>/dev/null; then
			cleanup_stale_port_forward_on_local_port "$local_port" "$service" "$remote_port"

			# If no listener remains now, retry immediately.
			if ! lsof -tiTCP:"$local_port" -sTCP:LISTEN >/dev/null 2>&1; then
				echo "[warn] Cleared stale listener on localhost:${local_port}; retrying now..."
				attempt=$((attempt + 1))
				continue
			fi

			echo "[error] Local port ${local_port} is already in use; cannot start port-forward for $name."
			echo "[error] Find owner: lsof -nP -iTCP:${local_port} -sTCP:LISTEN"
			echo "[error] Last log output:"
			tail -n 20 "$log_file" 2>/dev/null || true
			return 1
		fi

		echo "[warn] Port-forward for $name failed on attempt $attempt/$PORT_FORWARD_RETRIES; retrying in ${PORT_FORWARD_RETRY_DELAY}s..."
		attempt=$((attempt + 1))
		sleep "$PORT_FORWARD_RETRY_DELAY"
	done

	echo "[error] Could not start port-forward for $name after $PORT_FORWARD_RETRIES attempts."
	echo "[error] Last log output:"
	tail -n 20 "$log_file" 2>/dev/null || true
	return 1
}

while [[ $# -gt 0 ]]; do
	case "$1" in
		--prepare)
			RUN_PREPARE=true
			shift
			;;
		--build-images)
			FORCE_BUILD_IMAGES=true
			RUN_PREPARE=true
			shift
			;;
		--skip-prepare)
			RUN_PREPARE=false
			shift
			;;
		--release)
			RELEASE_NAME="${2:-}"
			if [[ -z "$RELEASE_NAME" ]]; then
				echo "[error] --release requires a value" >&2
				exit 1
			fi
			shift 2
			;;
		--env)
			ENV_NAME="${2:-}"
			if [[ -z "$ENV_NAME" ]]; then
				echo "[error] --env requires a value" >&2
				exit 1
			fi
			shift 2
			;;
		--namespace)
			NAMESPACE="${2:-}"
			if [[ -z "$NAMESPACE" ]]; then
				echo "[error] --namespace requires a value" >&2
				exit 1
			fi
			shift 2
			;;
		--no-wait)
			HELM_WAIT=false
			shift
			;;
		--wait)
			HELM_WAIT=true
			shift
			;;
		--timeout)
			HELM_TIMEOUT="${2:-}"
			if [[ -z "$HELM_TIMEOUT" ]]; then
				echo "[error] --timeout requires a value" >&2
				exit 1
			fi
			shift 2
			;;
		--port-forward)
			START_PORT_FORWARD=true
			shift
			;;
		--no-port-forward)
			START_PORT_FORWARD=false
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

if ! command -v helm >/dev/null 2>&1; then
	echo "[error] helm command not found. Install Helm and ensure it is in PATH." >&2
	exit 1
fi

if [[ "$START_PORT_FORWARD" == true ]] && ! command -v kubectl >/dev/null 2>&1; then
	echo "[error] kubectl command not found. Install kubectl or run with --no-port-forward." >&2
	exit 1
fi

if [[ "$RUN_PREPARE" == true ]]; then
	echo "[info] Running prepare checks..."
	if [[ "$FORCE_BUILD_IMAGES" == true ]]; then
		"$CHART_DIR/prepare.sh" --env "$ENV_NAME" --build-images
	else
		"$CHART_DIR/prepare.sh" --env "$ENV_NAME"
	fi
fi

ENV_VALUES_FILE="$CHART_DIR/values-${ENV_NAME}.yaml"
if [[ ! -f "$ENV_VALUES_FILE" ]]; then
	echo "[error] Environment values file not found: $ENV_VALUES_FILE" >&2
	echo "[error] Create values-${ENV_NAME}.yaml or pass a valid --env value." >&2
	exit 1
fi

ENV_SECRETS_FILE="$CHART_DIR/values-secrets.${ENV_NAME}.yaml"
if [[ ! -f "$ENV_SECRETS_FILE" ]]; then
	echo "[error] Environment secrets file not found: $ENV_SECRETS_FILE" >&2
	echo "[error] Run: $CHART_DIR/prepare.sh --env $ENV_NAME" >&2
	exit 1
fi

echo "[info] Deploying Helm release '$RELEASE_NAME' into namespace '$NAMESPACE'..."
HELM_CMD=(helm upgrade --install "$RELEASE_NAME" "$CHART_DIR"
	-n "$NAMESPACE"
	--create-namespace
	-f "$CHART_DIR/values.yaml"
	-f "$ENV_VALUES_FILE"
	-f "$ENV_SECRETS_FILE")

echo "[info] Using values file: $ENV_VALUES_FILE"
echo "[info] Using secrets file: $ENV_SECRETS_FILE"

if [[ "$HELM_WAIT" == true ]]; then
	HELM_CMD+=(--wait --timeout "$HELM_TIMEOUT")
fi

if [[ "$HELM_WAIT" == true ]]; then
	echo "[info] Helm wait enabled (timeout: $HELM_TIMEOUT)."
else
	echo "[info] Helm wait disabled; deploy command will return after apply."
fi

"${HELM_CMD[@]}"

echo "[info] Deployment complete."
echo "[info] Next: kubectl get deploy,statefulset,svc,ing -n $NAMESPACE"

if [[ "$START_PORT_FORWARD" == true ]]; then
	mkdir -p "$PORT_FORWARD_DIR"
	echo "[info] Starting background port-forwards..."
	pf_failures=0
	start_port_forward "tombolo-client" "3000" "80" "client" || pf_failures=1
	start_port_forward "tombolo-server" "3001" "3001" "server" || pf_failures=1
	start_port_forward "tombolo-jobs" "8678" "8678" "jobs" || pf_failures=1
	if [[ "$pf_failures" -eq 0 ]]; then
		echo "[info] Port-forwards are running in background."
	else
		echo "[warn] One or more port-forwards failed to start. Check logs in $PORT_FORWARD_DIR."
	fi
	echo "[info] To stop: kill \$(cat $PORT_FORWARD_DIR/${NAMESPACE}-{client,server,jobs}.pid)"
else
	echo "[info] Skipping port-forward startup (--no-port-forward)."
fi
