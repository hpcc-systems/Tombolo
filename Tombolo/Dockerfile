# ===========================================
# Base Stage - Install all dependencies
# ===========================================
FROM node:24-alpine AS base

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./

# Copy all package.json files
COPY Tombolo/client-reactjs/package.json ./Tombolo/client-reactjs/
COPY Tombolo/server/package.json ./Tombolo/server/
COPY Tombolo/db/package.json ./Tombolo/db/
COPY Tombolo/shared/package.json ./Tombolo/shared/
COPY Tombolo/core/package.json ./Tombolo/core/
COPY Tombolo/jobs/package.json ./Tombolo/jobs/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# ===========================================
# Shared Package Builder Stage
# ===========================================
FROM base AS shared-builder

# Copy shared package source
COPY Tombolo/shared ./Tombolo/shared

WORKDIR /app/Tombolo/shared

# Build shared package
RUN pnpm build

# ===========================================
# DB Package Builder Stage
# ===========================================
FROM base AS db-builder

# Copy built shared package from shared-builder
COPY --from=shared-builder /app/Tombolo/shared/dist ./Tombolo/shared/dist
COPY --from=shared-builder /app/Tombolo/shared/package.json ./Tombolo/shared/package.json

# Copy db package source
COPY Tombolo/db ./Tombolo/db

WORKDIR /app/Tombolo/db

# Build db package
RUN pnpm build

# ===========================================
# Core Package Builder Stage
# ===========================================
FROM base AS core-builder

# Copy built shared package from shared-builder
COPY --from=shared-builder /app/Tombolo/shared/dist ./Tombolo/shared/dist
COPY --from=shared-builder /app/Tombolo/shared/package.json ./Tombolo/shared/package.json

# Copy built db package from db-builder (core depends on db for types)
COPY --from=db-builder /app/Tombolo/db/dist ./Tombolo/db/dist
COPY --from=db-builder /app/Tombolo/db/package.json ./Tombolo/db/package.json

# Copy core package source
COPY Tombolo/core ./Tombolo/core

WORKDIR /app/Tombolo/core

# Build core package
RUN pnpm build

# ===========================================
# Client Builder Stage
# ===========================================
FROM base AS client-builder

# Copy built shared package from shared-builder
COPY --from=shared-builder /app/Tombolo/shared/dist ./Tombolo/shared/dist
COPY --from=shared-builder /app/Tombolo/shared/package.json ./Tombolo/shared/package.json

# Copy built core package from core-builder
COPY --from=core-builder /app/Tombolo/core/dist ./Tombolo/core/dist
COPY --from=core-builder /app/Tombolo/core/package.json ./Tombolo/core/package.json

# Copy built db package from db-builder
COPY --from=db-builder /app/Tombolo/db/dist ./Tombolo/db/dist
COPY --from=db-builder /app/Tombolo/db/package.json ./Tombolo/db/package.json

# Copy client source (includes .env for Vite build-time variables)
COPY Tombolo/client-reactjs ./Tombolo/client-reactjs

WORKDIR /app/Tombolo/client-reactjs

# Build the React app
RUN pnpm run build

# ===========================================
# Client Runtime Stage
# ===========================================
FROM nginx:1.29.3-alpine AS client

# Copy built assets
COPY --from=client-builder /app/Tombolo/client-reactjs/build /usr/share/nginx/html

# Copy nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

RUN apk add --no-cache wget

COPY Tombolo/client-reactjs/nginx/nginx.conf /etc/nginx/nginx.conf
COPY Tombolo/client-reactjs/nginx/conf.d/nginx.conf.template /etc/nginx/conf.d/nginx.conf.template
COPY Tombolo/client-reactjs/nginx/run_nginx.sh /etc/nginx/run_nginx.sh

RUN chmod +x /etc/nginx/run_nginx.sh

# ===========================================
# Server Builder Stage (Debian for HPCC tools)
# ===========================================
FROM node:24-trixie AS server-builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./

# Copy all package.json files
COPY Tombolo/server/package.json ./Tombolo/server/
COPY Tombolo/db/package.json ./Tombolo/db/
COPY Tombolo/shared/package.json ./Tombolo/shared/
COPY Tombolo/core/package.json ./Tombolo/core/

# Install dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy server source code
COPY Tombolo/server ./Tombolo/server

# Copy built shared package from shared-builder
COPY --from=shared-builder /app/Tombolo/shared/dist ./Tombolo/shared/dist
COPY --from=shared-builder /app/Tombolo/shared/package.json ./Tombolo/shared/package.json

# Copy built core package from core-builder
COPY --from=core-builder /app/Tombolo/core/dist ./Tombolo/core/dist
COPY --from=core-builder /app/Tombolo/core/package.json ./Tombolo/core/package.json

# Copy built db package from db-builder  
COPY --from=db-builder /app/Tombolo/db/dist ./Tombolo/db/dist
COPY --from=db-builder /app/Tombolo/db/package.json ./Tombolo/db/package.json

# Copy db migrations, seeders and config (needed at runtime)
COPY Tombolo/db/migrations ./Tombolo/db/migrations
COPY Tombolo/db/seeders ./Tombolo/db/seeders
COPY Tombolo/db/config ./Tombolo/db/config

# Copy Docker-specific .sequelizerc and rename it
COPY Tombolo/server/.sequelizerc.docker ./Tombolo/server/.sequelizerc

# Use pnpm deploy to create a clean deployment structure
RUN pnpm --filter @tombolo/server deploy /deploy/server --prod --legacy

# ===========================================
# Server Runtime Stage
# ===========================================
FROM node:24-trixie AS server

WORKDIR /app

ENV DEBIAN_FRONTEND=noninteractive
ENV DEBCONF_NONINTERACTIVE_SEEN=true

# Install system dependencies
RUN apt-get update -y && apt-get install -y build-essential curl git

# Set timezone
RUN echo "tzdata tzdata/Areas select America" > /tmp/preseed.txt && \
    echo "tzdata tzdata/Zones/America select New_York" >> /tmp/preseed.txt && \
    debconf-set-selections /tmp/preseed.txt && \
    apt-get install -y tzdata

# Install Python
RUN apt-get install -y python3 python-is-python3

# Install packages used by ECL client tools
RUN apt-get install -y \
    openssh-client \
    openssh-server \
    expect \
    rsync \
    libapr1 \
    psmisc \
    libaprutil1 \
    libarchive13 \
    libatlas3-base \
    libboost-regex1.83.0 \
    libmemcached11 \
    libmemcachedutil2 \
    libnuma1 \
    libxslt1.1 \
    libcurl4 \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

# Install global tools
RUN pnpm add -g node-gyp sequelize-cli pm2

# Copy deployed server from builder
COPY --from=server-builder /deploy/server /app

# Create required directories
RUN mkdir -p /gitClones

WORKDIR /app

# Entry point is set on docker-compose

# ===========================================
# Jobs Worker Builder Stage
# ===========================================
FROM node:24-alpine AS jobs-builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./

# Copy all package.json files
COPY Tombolo/jobs/package.json ./Tombolo/jobs/
COPY Tombolo/db/package.json ./Tombolo/db/
COPY Tombolo/shared/package.json ./Tombolo/shared/
COPY Tombolo/core/package.json ./Tombolo/core/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy built shared package from shared-builder (dist + package.json + source for types)
COPY --from=shared-builder /app/Tombolo/shared ./Tombolo/shared

# Copy built core package from core-builder (dist + package.json)
COPY --from=core-builder /app/Tombolo/core/dist ./Tombolo/core/dist
COPY --from=core-builder /app/Tombolo/core/package.json ./Tombolo/core/package.json

# Copy built db package from db-builder (dist + package.json)
COPY --from=db-builder /app/Tombolo/db/dist ./Tombolo/db/dist
COPY --from=db-builder /app/Tombolo/db/package.json ./Tombolo/db/package.json

# Copy jobs source code
COPY Tombolo/jobs ./Tombolo/jobs

# Copy db migrations, seeders, and config (needed at runtime)
COPY Tombolo/db/migrations ./Tombolo/db/migrations
COPY Tombolo/db/seeders ./Tombolo/db/seeders
COPY Tombolo/db/config ./Tombolo/db/config

# Build TypeScript without source maps for production
WORKDIR /app/Tombolo/jobs
RUN pnpm build:prod

# Use pnpm deploy to create a clean deployment structure
WORKDIR /app
RUN pnpm --filter @tombolo/jobs deploy /deploy/jobs --prod --legacy

# ===========================================
# Jobs Worker Runtime Stage
# ===========================================
FROM node:24-alpine AS jobs

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

# Install PM2 globally
RUN pnpm add -g pm2

# Copy deployed jobs from builder (includes node_modules with workspace deps resolved)
COPY --from=jobs-builder /deploy/jobs /app

# Copy the built dist folder with proper structure
COPY --from=jobs-builder /app/Tombolo/jobs/dist ./dist

WORKDIR /app

# Disable source map support in production
ENV NODE_OPTIONS="--no-enable-source-maps"

# Entry point is set on docker-compose
CMD ["pm2-runtime", "start", "dist/app.js", "--name", "tombolo-jobs"]
