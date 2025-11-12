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

# Install all dependencies
RUN pnpm install --frozen-lockfile

# ===========================================
# Client Builder Stage
# ===========================================
FROM base AS client-builder

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

# Install dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy source code
COPY Tombolo/server ./Tombolo/server
COPY Tombolo/db ./Tombolo/db

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
