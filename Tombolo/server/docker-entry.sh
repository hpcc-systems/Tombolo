#!/bin/sh

host="$1"
port="$2"

until $(nc -z $host $port); do
  sleep 2
done

sequelize db:migrate
sequelize db:seed:all
pm2-runtime start process.yml