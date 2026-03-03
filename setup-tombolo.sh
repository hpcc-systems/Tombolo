#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(pwd)"
APP_DIR="$REPO_ROOT/Tombolo"
STATE_FILE="$REPO_ROOT/.tombolo-setup-state.json"

if [[ ! -d "$APP_DIR" ]]; then
  echo "Error: expected Tombolo directory at $APP_DIR"
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "Error: python3 is required but not found. Please install Python 3 and try again."
  exit 1
fi

ENV_FILE="$APP_DIR/.env"
ENV_SAMPLE="$APP_DIR/.env.sample"
CLIENT_ENV_FILE="$APP_DIR/client-reactjs/.env"
CLIENT_ENV_SAMPLE="$APP_DIR/client-reactjs/.env.sample"

NGINX_DIR="$APP_DIR/client-reactjs/nginx/conf.d"
NGINX_TEMPLATE="$NGINX_DIR/nginx.conf.template"
NGINX_NO_SSL="$NGINX_DIR/nginx.conf.template-no-ssl"
NGINX_SSL="$NGINX_DIR/nginx.conf.template-ssl"

CLUSTER_WHITELIST="$APP_DIR/server/cluster-whitelist.js"
CLUSTER_WHITELIST_SAMPLE="$APP_DIR/server/cluster-whitelist.sample.js"

COMPOSE_FILE="$APP_DIR/docker-compose.yml"
COMPOSE_SAMPLE="$APP_DIR/docker-compose-sample.yml"

say() { printf "%s\n" "$*"; }

prompt() {
  local message="$1"
  local default_value="${2:-}"
  local input
  if [[ -n "$default_value" ]]; then
    read -r -p "$message [$default_value]: " input
    if [[ -z "$input" ]]; then
      input="$default_value"
    fi
  else
    read -r -p "$message: " input
  fi
  printf "%s" "$input"
}

prompt_required() {
  local message="$1"
  local default_value="${2:-}"
  local input=""
  while [[ -z "$input" ]]; do
    input="$(prompt "$message" "$default_value")"
    if [[ -z "$input" ]]; then
      say "Value is required."
    fi
  done
  printf "%s" "$input"
}

prompt_port() {
  local message="$1"
  local default_value="${2:-}"
  local input=""
  while true; do
    input="$(prompt "$message" "$default_value")"
    if [[ "$input" =~ ^[0-9]+$ ]] && (( input >= 1 && input <= 65535 )); then
      printf "%s" "$input"
      return 0
    fi
    say "Please enter a valid port number (1-65535)."
  done
}

prompt_bool_optional() {
  local message="$1"
  local default_value="${2:-}"
  local input=""
  while true; do
    input="$(prompt "$message" "$default_value")"
    if [[ -z "$input" ]]; then
      printf "%s" ""
      return 0
    fi
    case "$input" in
      true|false) printf "%s" "$input"; return 0 ;;
      *) say "Please enter 'true', 'false', or leave blank." ;;
    esac
  done
}

confirm() {
  local message="$1"
  local default_yes="${2:-false}"
  local prompt_suffix="[y/N]"
  if [[ "$default_yes" == "true" ]]; then
    prompt_suffix="[Y/n]"
  fi
  local input
  read -r -p "$message $prompt_suffix: " input
  input="${input:-}"
  if [[ -z "$input" ]]; then
    if [[ "$default_yes" == "true" ]]; then
      return 0
    fi
    return 1
  fi
  case "$input" in
    y|Y|yes|YES) return 0 ;;
    *) return 1 ;;
  esac
}

ensure_file_from_sample() {
  local target="$1"
  local sample="$2"
  if [[ -f "$target" ]]; then
    if confirm "${target} exists. Overwrite with sample?" false; then
      cp "$sample" "$target"
      say "Overwrote $target from sample."
    else
      say "Keeping existing $target."
    fi
  else
    cp "$sample" "$target"
    say "Created $target from sample."
  fi
}

set_env_value() {
  local file="$1"
  local key="$2"
  local value="$3"

  python3 - "$file" "$key" "$value" <<'PY'
import sys, re
file_path, key, value = sys.argv[1], sys.argv[2], sys.argv[3]
pattern = re.compile(rf'^\s*{re.escape(key)}=')
try:
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.read().splitlines()
except FileNotFoundError:
    lines = []

out = []
replaced = False
for line in lines:
    if pattern.match(line):
        out.append(f"{key}={value}")
        replaced = True
    else:
        out.append(line)
if not replaced:
    out.append(f"{key}={value}")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write("\n".join(out))
    f.write("\n")
PY
}

gen_secret() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -base64 32
  else
    python3 - <<'PY'
import secrets
print(secrets.token_urlsafe(32))
PY
  fi
}

update_compose_for_custom_services() {
  local file_path="$1"
  local disable_mysql="$2"
  local disable_redis="$3"

  python3 - "$file_path" "$disable_mysql" "$disable_redis" <<'PY'
import sys, re

file_path, disable_mysql, disable_redis = sys.argv[1], sys.argv[2] == "true", sys.argv[3] == "true"
try:
    with open(file_path, "r", encoding="utf-8") as f:
        lines = f.read().splitlines()
except FileNotFoundError:
    sys.exit(0)

def comment(line):
    if line.lstrip().startswith("#"):
        return line
    return "# " + line

out = []
in_service_block = None
service_indent = None
service_targets = set()
if disable_mysql:
    service_targets.add("mysql_db")
if disable_redis:
    service_targets.add("redis")

depends_on_indent = None
depends_on_buffer = []
depends_on_kept = 0
skip_dep_entry = False
skip_dep_entry_indent = None

for i, line in enumerate(lines):
    raw = line
    stripped = raw.lstrip()
    indent = len(raw) - len(stripped)

    # Track service blocks under "services:"
    if re.match(r"^\s{2}[A-Za-z0-9_]+:\s*$", raw):
        name = stripped[:-1]
        in_service_block = name
        service_indent = indent
    elif in_service_block and indent <= service_indent and stripped:
        in_service_block = None
        service_indent = None

    # Comment entire mysql_db or redis service blocks
    if in_service_block in service_targets and service_indent == 2:
        out.append(comment(raw))
        continue

    # Handle depends_on blocks and remove entries for disabled services
    if re.match(r"^\s*depends_on:\s*$", raw):
        depends_on_indent = indent
        depends_on_buffer = [raw]
        depends_on_kept = 0
        skip_dep_entry = False
        skip_dep_entry_indent = None
        continue

    if depends_on_indent is not None:
        if stripped and indent <= depends_on_indent:
            # flush depends_on buffer if it has any kept entries
            if depends_on_kept > 0:
                out.extend(depends_on_buffer)
            depends_on_indent = None
            depends_on_buffer = []
            depends_on_kept = 0
            skip_dep_entry = False
            skip_dep_entry_indent = None
        else:
            m = re.match(r"^\s*([A-Za-z0-9_]+):\s*$", raw)
            if m:
                entry = m.group(1)
                if entry in service_targets:
                    skip_dep_entry = True
                    skip_dep_entry_indent = indent
                    continue
                else:
                    skip_dep_entry = False
                    skip_dep_entry_indent = None
                    depends_on_kept += 1
                    depends_on_buffer.append(raw)
                    continue
            if skip_dep_entry and skip_dep_entry_indent is not None and indent > skip_dep_entry_indent:
                continue
            depends_on_buffer.append(raw)
            continue

    # Comment entrypoint lines referencing disabled services
    if ("mysql_db" in raw and disable_mysql) or ("redis" in raw and disable_redis):
        if "entrypoint" in raw or "depends_on" in raw:
            continue
        if re.match(r"^\s*-\s*(mysql_db|redis)\s*$", stripped):
            continue

    out.append(raw)

# flush trailing depends_on buffer
if depends_on_indent is not None:
    if depends_on_kept > 0:
        out.extend(depends_on_buffer)

with open(file_path, "w", encoding="utf-8") as f:
    f.write("\n".join(out) + "\n")
PY
}

prompt_change_value() {
  local file_path="$1"
  local key="$2"
  local label="$3"
  local current_value="$4"
  local value="$current_value"
  if confirm "Change ${label}?" false; then
    value="$(prompt "$label" "$current_value")"
    set_env_value "$file_path" "$key" "$value"
  fi
  printf "%s" "$value"
}

prompt_change_port() {
  local file_path="$1"
  local key="$2"
  local label="$3"
  local current_value="$4"
  local value="$current_value"
  if confirm "Change ${label}?" false; then
    value="$(prompt_port "$label" "$current_value")"
    set_env_value "$file_path" "$key" "$value"
  fi
  printf "%s" "$value"
}

say "Tombolo setup helper"

# --- State management (saves config choices, not just step number) ---

get_state_value() {
  local key="$1"
  local default_val="${2:-}"
  if [[ ! -f "$STATE_FILE" ]]; then
    printf "%s" "$default_val"
    return
  fi
  python3 - "$STATE_FILE" "$key" "$default_val" <<'PY'
import json, sys
path, key, default = sys.argv[1], sys.argv[2], sys.argv[3]
try:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    val = data.get(key)
    print(val if val is not None else default, end="")
except (FileNotFoundError, json.JSONDecodeError):
    print(default, end="")
PY
}

set_state_value() {
  local key="$1"
  local value="$2"
  python3 - "$STATE_FILE" "$key" "$value" <<'PY'
import json, sys
path, key, value = sys.argv[1], sys.argv[2], sys.argv[3]
try:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
except (FileNotFoundError, json.JSONDecodeError):
    data = {}
data[key] = value
with open(path, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)
PY
}

load_state() {
  get_state_value "step" "0"
}

write_state() {
  set_state_value "step" "$1"
}

clear_state() {
  if [[ -f "$STATE_FILE" ]]; then
    rm -f "$STATE_FILE"
  fi
}

check_dependencies() {
  local missing=()
  if [[ "${install_type:-}" == "docker" ]]; then
    if ! command -v docker >/dev/null 2>&1; then
      missing+=("docker")
    fi
  else
    if ! command -v pnpm >/dev/null 2>&1; then
      missing+=("pnpm")
    fi
    if ! command -v node >/dev/null 2>&1; then
      missing+=("node")
    fi
  fi
  if [[ ${#missing[@]} -gt 0 ]]; then
    say "Error: Missing required dependencies: ${missing[*]}"
    say "Please install them and run this script again."
    exit 1
  fi
}

wait_for_docker_daemon() {
  while ! docker info >/dev/null 2>&1; do
    say ""
    say "Warning: Docker daemon is not running. Please start Docker and press Enter to try again."
    read -r _
  done
}

detect_existing_setup() {
  local found=0
  [[ -f "$ENV_FILE" ]] && found=1
  [[ -f "$CLIENT_ENV_FILE" ]] && found=1
  [[ -f "$CLUSTER_WHITELIST" ]] && found=1
  [[ -f "$COMPOSE_FILE" ]] && found=1
  [[ -f "$NGINX_TEMPLATE" ]] && found=1
  return $found
}

read_env_value() {
  local file_path="$1"
  local key="$2"
  python3 - "$file_path" "$key" <<'PY'
import sys, re
path, key = sys.argv[1], sys.argv[2]
try:
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip().startswith("#"):
                continue
            m = re.match(rf"\\s*{re.escape(key)}\\s*=\\s*(.*)\\s*$", line)
            if m:
                val = m.group(1).strip()
                if (val.startswith("'") and val.endswith("'")) or (val.startswith('"') and val.endswith('"')):
                    val = val[1:-1]
                print(val)
                sys.exit(0)
except FileNotFoundError:
    pass
print("")
PY
}

RESUME_MODE=false
FORCE_COMPOSE=false
USE_DOCKER_DB=""
USE_DOCKER_REDIS=""
install_type=""

if detect_existing_setup || [[ -f "$STATE_FILE" ]]; then
  if confirm "Found existing setup files or state. Continue where you left off?" true; then
    RESUME_MODE=true
  else
    clear_state
    say "Starting over."
  fi
fi

CURRENT_STEP="$(load_state)"

# Restore saved preferences when resuming
if [[ "$RESUME_MODE" == "true" ]]; then
  install_type="$(get_state_value "install_type" "")"
  USE_DOCKER_DB="$(get_state_value "use_docker_db" "")"
  USE_DOCKER_REDIS="$(get_state_value "use_docker_redis" "")"
  FORCE_COMPOSE="$(get_state_value "force_compose" "false")"
fi

if [[ -n "$install_type" ]]; then
  say "Using saved install type: $install_type"
else
  while true; do
    install_type="$(prompt "Install type (docker/local)" "docker")"
    case "$install_type" in
      docker|local) break ;;
      *) say "Invalid install type. Please enter 'docker' or 'local'." ;;
    esac
  done
fi
set_state_value "install_type" "$install_type"

# Check required dependencies now that install type is known
check_dependencies

if [[ "$install_type" == "docker" ]]; then
  wait_for_docker_daemon
fi

if [[ "$install_type" == "docker" && -f "$COMPOSE_FILE" ]]; then
  if [[ "$FORCE_COMPOSE" != "true" ]]; then
    if confirm "docker-compose.yml exists. Overwrite with sample?" false; then
      FORCE_COMPOSE=true
    fi
  fi
fi
set_state_value "force_compose" "$FORCE_COMPOSE"

if [[ "$install_type" == "docker" ]]; then
  if [[ -z "$USE_DOCKER_DB" ]]; then
    if confirm "Use Docker-provided MySQL (mysql_db)?" true; then
      USE_DOCKER_DB=true
    else
      USE_DOCKER_DB=false
    fi
  else
    say "Using saved Docker MySQL preference: $USE_DOCKER_DB"
  fi
  set_state_value "use_docker_db" "$USE_DOCKER_DB"

  if [[ -z "$USE_DOCKER_REDIS" ]]; then
    if confirm "Use Docker-provided Redis (redis)?" true; then
      USE_DOCKER_REDIS=true
    else
      USE_DOCKER_REDIS=false
    fi
  else
    say "Using saved Docker Redis preference: $USE_DOCKER_REDIS"
  fi
  set_state_value "use_docker_redis" "$USE_DOCKER_REDIS"
fi

say ""
say "Step 1: Ensure .env files"
if [[ "$RESUME_MODE" == "false" || "$CURRENT_STEP" -lt 1 ]]; then
  if [[ -f "$ENV_FILE" ]] || [[ -f "$CLIENT_ENV_FILE" ]]; then
    if confirm "Keep existing .env files?" true; then
      say "Keeping existing .env files."
    else
      ensure_file_from_sample "$ENV_FILE" "$ENV_SAMPLE"
      ensure_file_from_sample "$CLIENT_ENV_FILE" "$CLIENT_ENV_SAMPLE"
    fi
  else
    ensure_file_from_sample "$ENV_FILE" "$ENV_SAMPLE"
    ensure_file_from_sample "$CLIENT_ENV_FILE" "$CLIENT_ENV_SAMPLE"
  fi
  write_state 1
fi

say ""
say "Step 2: Configure environment"
if [[ "$RESUME_MODE" == "false" || "$CURRENT_STEP" -lt 2 ]]; then
  CHANGE_VARS=false
  if [[ -f "$ENV_FILE" ]] || [[ -f "$CLIENT_ENV_FILE" ]]; then
    if confirm "Would you like to change any variables?" false; then
      CHANGE_VARS=true
    fi
  else
    CHANGE_VARS=true
  fi

  HOSTNAME_VAL="$(read_env_value "$ENV_FILE" "HOSTNAME")"
  SERVER_PORT_VAL="$(read_env_value "$ENV_FILE" "SERVER_PORT")"
  HTTP_PORT_VAL="$(read_env_value "$ENV_FILE" "HTTP_PORT")"
  HTTPS_PORT_VAL="$(read_env_value "$ENV_FILE" "HTTPS_PORT")"
  CERT_PATH_VAL="$(read_env_value "$ENV_FILE" "CERT_PATH")"
  CERT_NAME_VAL="$(read_env_value "$ENV_FILE" "CERTIFICATE_NAME")"
  CERT_KEY_VAL="$(read_env_value "$ENV_FILE" "CERTIFICATE_KEY")"
  DB_HOSTNAME_VAL="$(read_env_value "$ENV_FILE" "DB_HOSTNAME")"
  DB_PORT_VAL="$(read_env_value "$ENV_FILE" "DB_PORT")"
  DB_NAME_VAL="$(read_env_value "$ENV_FILE" "DB_NAME")"
  DB_USERNAME_VAL="$(read_env_value "$ENV_FILE" "DB_USERNAME")"
  DB_PASSWORD_VAL="$(read_env_value "$ENV_FILE" "DB_PASSWORD")"
  MYSQL_SSL_ENABLED_VAL="$(read_env_value "$ENV_FILE" "MYSQL_SSL_ENABLED")"
  REDIS_HOST_VAL="$(read_env_value "$ENV_FILE" "REDIS_HOST")"
  REDIS_PORT_VAL="$(read_env_value "$ENV_FILE" "REDIS_PORT")"
  REDIS_USER_VAL="$(read_env_value "$ENV_FILE" "REDIS_USER")"
  REDIS_PASSWORD_VAL="$(read_env_value "$ENV_FILE" "REDIS_PASSWORD")"
  REDIS_DB_VAL="$(read_env_value "$ENV_FILE" "REDIS_DB")"
  JWT_SECRET_VAL="$(read_env_value "$ENV_FILE" "JWT_SECRET")"
  JWT_REFRESH_SECRET_VAL="$(read_env_value "$ENV_FILE" "JWT_REFRESH_SECRET")"
  CSRF_SECRET_VAL="$(read_env_value "$ENV_FILE" "CSRF_SECRET")"
  ENCRYPTION_KEY_VAL="$(read_env_value "$ENV_FILE" "ENCRYPTION_KEY")"
  TENANT_ID_VAL="$(read_env_value "$ENV_FILE" "TENANT_ID")"
  CLIENT_ID_VAL="$(read_env_value "$ENV_FILE" "CLIENT_ID")"
  CLIENT_SECRET_VAL="$(read_env_value "$ENV_FILE" "CLIENT_SECRET")"
  REDIRECT_URI_VAL="$(read_env_value "$ENV_FILE" "REDIRECT_URI")"
  EMAIL_SMTP_HOST_VAL="$(read_env_value "$ENV_FILE" "EMAIL_SMTP_HOST")"
  EMAIL_PORT_VAL="$(read_env_value "$ENV_FILE" "EMAIL_PORT")"
  EMAIL_SENDER_VAL="$(read_env_value "$ENV_FILE" "EMAIL_SENDER")"
  EMAIL_USER_VAL="$(read_env_value "$ENV_FILE" "EMAIL_USER")"
  EMAIL_PASS_VAL="$(read_env_value "$ENV_FILE" "EMAIL_PASS")"

  # Auto-generate empty secrets for new installs
  SECRETS_GENERATED=false
  if [[ -z "$JWT_SECRET_VAL" ]]; then
    JWT_SECRET_VAL=$(gen_secret)
    set_env_value "$ENV_FILE" "JWT_SECRET" "$JWT_SECRET_VAL"
    SECRETS_GENERATED=true
  fi
  if [[ -z "$JWT_REFRESH_SECRET_VAL" ]]; then
    JWT_REFRESH_SECRET_VAL=$(gen_secret)
    set_env_value "$ENV_FILE" "JWT_REFRESH_SECRET" "$JWT_REFRESH_SECRET_VAL"
    SECRETS_GENERATED=true
  fi
  if [[ -z "$CSRF_SECRET_VAL" ]]; then
    CSRF_SECRET_VAL=$(gen_secret)
    set_env_value "$ENV_FILE" "CSRF_SECRET" "$CSRF_SECRET_VAL"
    SECRETS_GENERATED=true
  fi
  if [[ -z "$ENCRYPTION_KEY_VAL" ]]; then
    ENCRYPTION_KEY_VAL=$(gen_secret)
    set_env_value "$ENV_FILE" "ENCRYPTION_KEY" "$ENCRYPTION_KEY_VAL"
    SECRETS_GENERATED=true
  fi
  if [[ "$SECRETS_GENERATED" == "true" ]]; then
    say "Auto-generated empty secrets (JWT, CSRF, ENCRYPTION_KEY)."
  fi

  if [[ "$CHANGE_VARS" == "true" ]]; then
    HOSTNAME_VAL="$(prompt_change_value "$ENV_FILE" "HOSTNAME" "Hostname" "${HOSTNAME_VAL:-localhost}")"
    SERVER_PORT_VAL="$(prompt_change_port "$ENV_FILE" "SERVER_PORT" "Server port" "${SERVER_PORT_VAL:-3001}")"
    HTTP_PORT_VAL="$(prompt_change_port "$ENV_FILE" "HTTP_PORT" "HTTP port" "${HTTP_PORT_VAL:-3000}")"
    HTTPS_PORT_VAL="$(prompt_change_port "$ENV_FILE" "HTTPS_PORT" "HTTPS port" "${HTTPS_PORT_VAL:-443}")"

    if confirm "Change SSL/Nginx settings?" false; then
      if confirm "Use SSL for Nginx?" false; then
        CERT_PATH_VAL="$(prompt_required "Cert path" "${CERT_PATH_VAL:-/certs}")"
        CERT_NAME_VAL="$(prompt_required "Certificate file name" "${CERT_NAME_VAL}")"
        CERT_KEY_VAL="$(prompt_required "Certificate key file name" "${CERT_KEY_VAL}")"
      else
        CERT_PATH_VAL="/certs"
        CERT_NAME_VAL=""
        CERT_KEY_VAL=""
      fi
      set_env_value "$ENV_FILE" "CERT_PATH" "$CERT_PATH_VAL"
      set_env_value "$ENV_FILE" "CERTIFICATE_NAME" "$CERT_NAME_VAL"
      set_env_value "$ENV_FILE" "CERTIFICATE_KEY" "$CERT_KEY_VAL"
    fi

    if confirm "Change database settings?" false; then
      if [[ "$install_type" == "docker" && "$USE_DOCKER_DB" == "true" ]]; then
        DB_HOSTNAME_VAL="mysql_db"
        DB_PORT_VAL="3306"
      else
        DB_HOSTNAME_VAL="$(prompt_required "DB hostname" "${DB_HOSTNAME_VAL:-localhost}")"
        DB_PORT_VAL="$(prompt_port "DB port" "${DB_PORT_VAL:-3306}")"
      fi
      DB_NAME_VAL="$(prompt_required "DB name" "${DB_NAME_VAL:-tombolo}")"
      DB_USERNAME_VAL="$(prompt_required "DB username" "${DB_USERNAME_VAL:-database_user}")"
      DB_PASSWORD_VAL="$(prompt_required "DB password" "${DB_PASSWORD_VAL:-database_user_password}")"
      if confirm "Enable MySQL SSL?" false; then
        MYSQL_SSL_ENABLED_VAL="true"
      else
        MYSQL_SSL_ENABLED_VAL="false"
      fi
      set_env_value "$ENV_FILE" "DB_HOSTNAME" "$DB_HOSTNAME_VAL"
      set_env_value "$ENV_FILE" "DB_PORT" "$DB_PORT_VAL"
      set_env_value "$ENV_FILE" "DB_NAME" "$DB_NAME_VAL"
      set_env_value "$ENV_FILE" "DB_USERNAME" "$DB_USERNAME_VAL"
      set_env_value "$ENV_FILE" "DB_PASSWORD" "$DB_PASSWORD_VAL"
      set_env_value "$ENV_FILE" "MYSQL_SSL_ENABLED" "$MYSQL_SSL_ENABLED_VAL"
    fi

    if confirm "Change Redis settings?" false; then
      if [[ "$install_type" == "docker" && "$USE_DOCKER_REDIS" == "true" ]]; then
        REDIS_HOST_VAL="redis"
        REDIS_PORT_VAL="6379"
      else
        REDIS_HOST_VAL="$(prompt_required "Redis hostname" "${REDIS_HOST_VAL:-localhost}")"
        REDIS_PORT_VAL="$(prompt_port "Redis port" "${REDIS_PORT_VAL:-6379}")"
      fi
      REDIS_USER_VAL="$(prompt "Redis username (optional)" "$REDIS_USER_VAL")"
      REDIS_PASSWORD_VAL="$(prompt "Redis password (optional)" "$REDIS_PASSWORD_VAL")"
      REDIS_DB_VAL="$(prompt_required "Redis DB" "${REDIS_DB_VAL:-0}")"
      set_env_value "$ENV_FILE" "REDIS_HOST" "$REDIS_HOST_VAL"
      set_env_value "$ENV_FILE" "REDIS_PORT" "$REDIS_PORT_VAL"
      set_env_value "$ENV_FILE" "REDIS_USER" "$REDIS_USER_VAL"
      set_env_value "$ENV_FILE" "REDIS_PASSWORD" "$REDIS_PASSWORD_VAL"
      set_env_value "$ENV_FILE" "REDIS_DB" "$REDIS_DB_VAL"
    fi

    if confirm "Change JWT/CSRF/Encryption secrets?" false; then
      if confirm "Auto-generate JWT/CSRF secrets and ENCRYPTION_KEY?" true; then
        JWT_SECRET_VAL=$(gen_secret)
        JWT_REFRESH_SECRET_VAL=$(gen_secret)
        CSRF_SECRET_VAL=$(gen_secret)
        ENCRYPTION_KEY_VAL=$(gen_secret)
      else
        JWT_SECRET_VAL="$(prompt_required "JWT_SECRET" "${JWT_SECRET_VAL}")"
        JWT_REFRESH_SECRET_VAL="$(prompt_required "JWT_REFRESH_SECRET" "${JWT_REFRESH_SECRET_VAL}")"
        CSRF_SECRET_VAL="$(prompt_required "CSRF_SECRET" "${CSRF_SECRET_VAL}")"
        ENCRYPTION_KEY_VAL="$(prompt_required "ENCRYPTION_KEY" "${ENCRYPTION_KEY_VAL}")"
      fi
      set_env_value "$ENV_FILE" "JWT_SECRET" "$JWT_SECRET_VAL"
      set_env_value "$ENV_FILE" "JWT_REFRESH_SECRET" "$JWT_REFRESH_SECRET_VAL"
      set_env_value "$ENV_FILE" "CSRF_SECRET" "$CSRF_SECRET_VAL"
      set_env_value "$ENV_FILE" "ENCRYPTION_KEY" "$ENCRYPTION_KEY_VAL"
    fi

    if confirm "Change Azure AD authentication settings?" false; then
      if confirm "Enable Azure AD authentication?" false; then
        TENANT_ID_VAL="$(prompt_required "Tenant ID" "${TENANT_ID_VAL}")"
        CLIENT_ID_VAL="$(prompt_required "CLIENT_ID" "${CLIENT_ID_VAL}")"
        CLIENT_SECRET_VAL="$(prompt_required "CLIENT_SECRET" "${CLIENT_SECRET_VAL}")"
        REDIRECT_URI_VAL="$(prompt_required "REDIRECT_URI" "${REDIRECT_URI_VAL:-http://localhost:3000}")"
      else
        TENANT_ID_VAL=""
        CLIENT_ID_VAL=""
        CLIENT_SECRET_VAL=""
        REDIRECT_URI_VAL=""
      fi
      set_env_value "$ENV_FILE" "TENANT_ID" "$TENANT_ID_VAL"
      set_env_value "$ENV_FILE" "CLIENT_ID" "$CLIENT_ID_VAL"
      set_env_value "$ENV_FILE" "CLIENT_SECRET" "$CLIENT_SECRET_VAL"
      set_env_value "$ENV_FILE" "REDIRECT_URI" "$REDIRECT_URI_VAL"
    fi

    if confirm "Change email (SMTP) settings?" false; then
      if confirm "Configure email (SMTP) now?" true; then
        EMAIL_SMTP_HOST_VAL="$(prompt_required "Email SMTP host" "${EMAIL_SMTP_HOST_VAL}")"
        EMAIL_PORT_VAL="$(prompt_port "Email port" "${EMAIL_PORT_VAL:-25}")"
        EMAIL_SENDER_VAL="$(prompt_required "Email sender" "${EMAIL_SENDER_VAL:-donotreply@tombolo.com}")"
        EMAIL_USER_VAL="$(prompt "Email user (optional)" "$EMAIL_USER_VAL")"
        EMAIL_PASS_VAL="$(prompt "Email pass (optional)" "$EMAIL_PASS_VAL")"
      else
        EMAIL_SMTP_HOST_VAL=""
        EMAIL_PORT_VAL=""
        EMAIL_SENDER_VAL="donotreply@tombolo.com"
        EMAIL_USER_VAL=""
        EMAIL_PASS_VAL=""
      fi
      set_env_value "$ENV_FILE" "EMAIL_SMTP_HOST" "$EMAIL_SMTP_HOST_VAL"
      set_env_value "$ENV_FILE" "EMAIL_PORT" "$EMAIL_PORT_VAL"
      set_env_value "$ENV_FILE" "EMAIL_SENDER" "$EMAIL_SENDER_VAL"
      set_env_value "$ENV_FILE" "EMAIL_USER" "$EMAIL_USER_VAL"
      set_env_value "$ENV_FILE" "EMAIL_PASS" "$EMAIL_PASS_VAL"
    fi
  fi

  USE_SSL=false
  if [[ -n "$CERT_NAME_VAL" || -n "$CERT_KEY_VAL" ]]; then
    USE_SSL=true
  fi

  if [[ -z "$USE_DOCKER_DB" ]]; then
    USE_DOCKER_DB=true
    if [[ "${DB_HOSTNAME_VAL}" != "mysql_db" ]]; then
      USE_DOCKER_DB=false
    fi
  fi

  if [[ -z "$USE_DOCKER_REDIS" ]]; then
    USE_DOCKER_REDIS=true
    if [[ "${REDIS_HOST_VAL}" != "redis" ]]; then
      USE_DOCKER_REDIS=false
    fi
  fi

  # Always force-apply Docker service hostnames so the .env is correct
  # regardless of whether the user went through the "Change settings" flow.
  if [[ "$install_type" == "docker" ]]; then
    if [[ "$USE_DOCKER_DB" == "true" ]]; then
      if [[ "$DB_HOSTNAME_VAL" != "mysql_db" ]]; then
        say "Setting DB_HOSTNAME=mysql_db for Docker."
      fi
      DB_HOSTNAME_VAL="mysql_db"
      DB_PORT_VAL="3306"
      set_env_value "$ENV_FILE" "DB_HOSTNAME" "mysql_db"
      set_env_value "$ENV_FILE" "DB_PORT" "3306"
    fi
    if [[ "$USE_DOCKER_REDIS" == "true" ]]; then
      if [[ "$REDIS_HOST_VAL" != "redis" ]]; then
        say "Setting REDIS_HOST=redis for Docker."
      fi
      REDIS_HOST_VAL="redis"
      REDIS_PORT_VAL="6379"
      set_env_value "$ENV_FILE" "REDIS_HOST" "redis"
      set_env_value "$ENV_FILE" "REDIS_PORT" "6379"
    fi
  fi

  WEB_SCHEME="http"
  WEB_PORT="$HTTP_PORT_VAL"
  if [[ "$USE_SSL" == "true" ]]; then
    WEB_SCHEME="https"
    WEB_PORT="$HTTPS_PORT_VAL"
  fi
  WEB_URL_VAL="${WEB_SCHEME}://${HOSTNAME_VAL}:${WEB_PORT}"
  set_env_value "$ENV_FILE" "WEB_URL" "$WEB_URL_VAL"

  USE_AZURE=false
  if [[ -n "$CLIENT_ID_VAL" || -n "$TENANT_ID_VAL" || -n "$REDIRECT_URI_VAL" ]]; then
    USE_AZURE=true
  fi

  set_env_value "$CLIENT_ENV_FILE" "PORT" "$HTTP_PORT_VAL"
  set_env_value "$CLIENT_ENV_FILE" "VITE_PROXY_URL" "http://${HOSTNAME_VAL}:${SERVER_PORT_VAL}"
  if [[ "$USE_AZURE" == "true" ]]; then
    set_env_value "$CLIENT_ENV_FILE" "VITE_AUTH_METHODS" "traditional,azure"
    set_env_value "$CLIENT_ENV_FILE" "VITE_AZURE_CLIENT_ID" "$CLIENT_ID_VAL"
    set_env_value "$CLIENT_ENV_FILE" "VITE_AZURE_TENANT_ID" "$TENANT_ID_VAL"
    set_env_value "$CLIENT_ENV_FILE" "VITE_AZURE_REDIRECT_URI" "$REDIRECT_URI_VAL"
  else
    set_env_value "$CLIENT_ENV_FILE" "VITE_AUTH_METHODS" "traditional"
    set_env_value "$CLIENT_ENV_FILE" "VITE_AZURE_CLIENT_ID" ""
    set_env_value "$CLIENT_ENV_FILE" "VITE_AZURE_TENANT_ID" ""
    set_env_value "$CLIENT_ENV_FILE" "VITE_AZURE_REDIRECT_URI" ""
  fi

  write_state 2
else
  HOSTNAME_VAL="$(read_env_value "$ENV_FILE" "HOSTNAME")"
  SERVER_PORT_VAL="$(read_env_value "$ENV_FILE" "SERVER_PORT")"
  HTTP_PORT_VAL="$(read_env_value "$ENV_FILE" "HTTP_PORT")"
  HTTPS_PORT_VAL="$(read_env_value "$ENV_FILE" "HTTPS_PORT")"
  CERT_PATH_VAL="$(read_env_value "$ENV_FILE" "CERT_PATH")"
  CERT_NAME_VAL="$(read_env_value "$ENV_FILE" "CERTIFICATE_NAME")"
  CERT_KEY_VAL="$(read_env_value "$ENV_FILE" "CERTIFICATE_KEY")"
  DB_HOSTNAME_VAL="$(read_env_value "$ENV_FILE" "DB_HOSTNAME")"
  DB_PORT_VAL="$(read_env_value "$ENV_FILE" "DB_PORT")"
  REDIS_HOST_VAL="$(read_env_value "$ENV_FILE" "REDIS_HOST")"
  REDIS_PORT_VAL="$(read_env_value "$ENV_FILE" "REDIS_PORT")"
  CLIENT_ID_VAL="$(read_env_value "$ENV_FILE" "CLIENT_ID")"
  TENANT_ID_VAL="$(read_env_value "$ENV_FILE" "TENANT_ID")"
  REDIRECT_URI_VAL="$(read_env_value "$ENV_FILE" "REDIRECT_URI")"
  VITE_AUTH_METHODS_VAL="$(read_env_value "$CLIENT_ENV_FILE" "VITE_AUTH_METHODS")"

  USE_SSL=false
  if [[ -n "$CERT_NAME_VAL" || -n "$CERT_KEY_VAL" ]]; then
    USE_SSL=true
  fi

  USE_DOCKER_DB=true
  if [[ "$DB_HOSTNAME_VAL" != "mysql_db" ]]; then
    USE_DOCKER_DB=false
  fi

  USE_DOCKER_REDIS=true
  if [[ "$REDIS_HOST_VAL" != "redis" ]]; then
    USE_DOCKER_REDIS=false
  fi

  USE_AZURE=false
  if [[ "$VITE_AUTH_METHODS_VAL" == *"azure"* ]] || [[ -n "$CLIENT_ID_VAL" ]] || [[ -n "$TENANT_ID_VAL" ]]; then
    USE_AZURE=true
  fi
fi

say ""
say "Step 3: Configure Nginx template"
if [[ "$RESUME_MODE" == "false" || "$CURRENT_STEP" -lt 3 ]]; then
if [[ "$USE_SSL" == "true" ]]; then
  if [[ -f "$NGINX_SSL" ]]; then
    if confirm "Use SSL Nginx template (overwrite nginx.conf.template)?" true; then
      cp "$NGINX_SSL" "$NGINX_TEMPLATE"
      say "Updated $NGINX_TEMPLATE from SSL template."
    fi
  else
    say "Warning: SSL template not found at $NGINX_SSL"
  fi
else
  if [[ -f "$NGINX_NO_SSL" ]]; then
    if confirm "Use non-SSL Nginx template (overwrite nginx.conf.template)?" true; then
      cp "$NGINX_NO_SSL" "$NGINX_TEMPLATE"
      say "Updated $NGINX_TEMPLATE from non-SSL template."
    fi
  else
    say "Warning: non-SSL template not found at $NGINX_NO_SSL"
  fi
fi
write_state 3
fi

say ""
say "Step 4: Cluster whitelist"
if [[ "$RESUME_MODE" == "false" || "$CURRENT_STEP" -lt 4 ]]; then
if confirm "Would you like to add clusters to the whitelist?" false; then
  clusters_json="[]"
  while true; do
    CLUSTER_NAME_VAL=$(prompt_required "Cluster name")
    THOR_HOST_VAL=$(prompt_required "Thor host (thor)")
    THOR_PORT_VAL=$(prompt_port "Thor port (thor_port)" "18010")
    ROXIE_HOST_VAL=$(prompt_required "Roxie host (roxie)")
    ROXIE_PORT_VAL=$(prompt_port "Roxie port (roxie_port)" "18002")

    clusters_json=$(python3 - "$clusters_json" "$CLUSTER_NAME_VAL" "$THOR_HOST_VAL" "$THOR_PORT_VAL" "$ROXIE_HOST_VAL" "$ROXIE_PORT_VAL" <<'PY'
import json, sys
arr = json.loads(sys.argv[1])
arr.append({
    "name": sys.argv[2],
    "thor": sys.argv[3],
    "thor_port": sys.argv[4],
    "roxie": sys.argv[5],
    "roxie_port": sys.argv[6],
})
print(json.dumps(arr))
PY
)

    if ! confirm "Add another cluster?" false; then
      break
    fi
  done

  python3 - "$CLUSTER_WHITELIST" "$clusters_json" <<'PY'
import json, sys
path = sys.argv[1]
arr = json.loads(sys.argv[2])
with open(path, "w", encoding="utf-8") as f:
    f.write("const clusters = [\n")
    for c in arr:
        f.write("  {\n")
        for key in ["name", "thor", "thor_port", "roxie", "roxie_port"]:
            f.write(f"    {key}: {json.dumps(c.get(key, ''))},\n")
        f.write("  },\n")
    f.write("];\n\nexport default clusters;\n")
PY
  say "Wrote $CLUSTER_WHITELIST with your clusters."
else
  if [[ -f "$CLUSTER_WHITELIST" ]]; then
    if confirm "Keep existing $CLUSTER_WHITELIST?" true; then
      say "Keeping existing $CLUSTER_WHITELIST."
    else
      cp "$CLUSTER_WHITELIST_SAMPLE" "$CLUSTER_WHITELIST"
      say "Overwrote $CLUSTER_WHITELIST from sample."
    fi
  else
    cp "$CLUSTER_WHITELIST_SAMPLE" "$CLUSTER_WHITELIST"
    say "Created $CLUSTER_WHITELIST from sample."
  fi
fi
write_state 4
fi

say ""
if [[ "$install_type" == "docker" ]]; then
  say "Step 5: Docker compose"
  if [[ "$RESUME_MODE" == "false" || "$CURRENT_STEP" -lt 5 || "$FORCE_COMPOSE" == "true" ]]; then
  if [[ -f "$COMPOSE_FILE" ]]; then
    if [[ "$FORCE_COMPOSE" == "true" ]]; then
      cp "$COMPOSE_SAMPLE" "$COMPOSE_FILE"
      say "Overwrote $COMPOSE_FILE from sample."
    else
      say "Found existing $COMPOSE_FILE."
    fi
  else
    cp "$COMPOSE_SAMPLE" "$COMPOSE_FILE"
    say "Created $COMPOSE_FILE from sample."
  fi
  write_state 5
  fi

  if [[ "$RESUME_MODE" == "false" || "$CURRENT_STEP" -lt 6 ]]; then
  if [[ "$USE_DOCKER_DB" == "false" || "$USE_DOCKER_REDIS" == "false" ]]; then
    update_compose_for_custom_services "$COMPOSE_FILE" "$([[ "$USE_DOCKER_DB" == "false" ]] && echo true || echo false)" "$([[ "$USE_DOCKER_REDIS" == "false" ]] && echo true || echo false)"
    say "Updated $COMPOSE_FILE to disable custom services."
  fi
  write_state 6
  fi

  if confirm "Run docker compose build and up -d now?" false; then
    pushd "$APP_DIR" >/dev/null
    if command -v docker-compose >/dev/null 2>&1; then
      docker-compose build
      docker-compose up -d
    else
      docker compose build
      docker compose up -d
    fi
    popd >/dev/null
    say ""
    say "Database initialization (create, migrate, seed) runs automatically via the server entrypoint."
    say "Monitor startup progress with: docker compose logs -f node"
    write_state 7
  else
    say "Skipping docker compose."
    say ""
    say "When you run 'docker compose up' later, database initialization"
    say "(create, migrate, seed) will run automatically via the server entrypoint."
  fi
else
  say "Step 5: Local dev commands"
  if confirm "Run pnpm install, pnpm db:init, pnpm dev now?" false; then
    pushd "$REPO_ROOT" >/dev/null
    pnpm install
    pnpm db:init
    pnpm dev
    popd >/dev/null
  else
    say "Skipping local dev commands."
    say ""
    say "To start manually, run:"
    say "  pnpm install"
    say "  pnpm db:init"
    say "  pnpm dev"
  fi
fi

say ""
say "Setup complete."
