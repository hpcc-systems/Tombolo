#!/bin/sh
echo ----------------------------------------------
echo "nginx run_nginx.sh executed"
echo ----------------------------------------------
hostname="$1"
export HOSTNAME=$hostname
export DOLLAR='$'
envsubst < /etc/nginx/conf.d/nginx.conf.template > /etc/nginx/conf.d/tombolo-nginx.conf
echo -- nginx configuration -----------------------
cat /etc/nginx/conf.d/tombolo-nginx.conf
echo ----------------------------------------------
nginx -g "daemon off;"
