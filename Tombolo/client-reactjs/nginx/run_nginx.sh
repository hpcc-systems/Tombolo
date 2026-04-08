#!/bin/sh
echo ----------------------------------------------
echo "nginx run_nginx.sh executed"
echo ----------------------------------------------
hostname="${1:-localhost}"
export HOSTNAME=$hostname
export API_UPSTREAM_HOST="${API_UPSTREAM_HOST:-node}"
export API_UPSTREAM_PORT="${API_UPSTREAM_PORT:-3001}"
export DOLLAR='$'
envsubst < /etc/nginx/conf.d/nginx.conf.template > /etc/nginx/conf.d/tombolo-nginx.conf
echo -- nginx configuration -----------------------
cat /etc/nginx/conf.d/tombolo-nginx.conf
echo ----------------------------------------------
nginx -g "daemon off;"
