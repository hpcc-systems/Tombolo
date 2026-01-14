#!/bin/sh

host="$1"
port="$2"

# Wait for MySQL to be ready
until $(nc -z $host $port); do
  echo "Waiting for MySQL at $host:$port..."
  sleep 2
done

echo "MySQL is ready, initializing database..."

# Create database if it doesn't exist (ignore error if it already exists)
sequelize db:create || true

# Run migrations
echo "Running migrations..."
sequelize db:migrate

# Run seeds
echo "Running seeds..."
sequelize db:seed:all

# Start the application
echo "Starting server with PM2..."
pm2-runtime start process.yml