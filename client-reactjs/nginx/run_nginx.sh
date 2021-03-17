#!/bin/sh

echo "######## Run nginx"
hostname="$1"
export HOSTNAME=$hostname
export DOLLAR='$'
envsubst < /etc/nginx/conf.d/nginx.conf.template > /etc/nginx/conf.d/nginx.conf
nginx -g "daemon off;"