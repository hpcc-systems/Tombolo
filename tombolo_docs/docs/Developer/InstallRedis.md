---
sidebar_position: -94
title: Install Redis
---

## Prerequisites

- macOS, Linux, or Windows with WSL

## Installing Redis

Tombolo uses [Redis](https://redis.io) for job queue management with BullMQ. Follow the instructions below for your operating system.

### macOS

The easiest way to install Redis on macOS is using [Homebrew](https://brew.sh):

```bash
brew install redis
```

Start Redis as a background service:

```bash
brew services start redis
```

Or run Redis manually (foreground):

```bash
redis-server
```

### Linux (Ubuntu/Debian)

Install Redis using apt:

```bash
sudo apt update
sudo apt install redis-server
```

Start and enable Redis to run on system boot:

```bash
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

Check Redis status:

```bash
sudo systemctl status redis-server
```

### Windows (WSL)

Redis doesn't run natively on Windows. Use Windows Subsystem for Linux (WSL) and follow the Linux installation steps above.

First, ensure WSL is installed:

```bash
wsl --install
```

Then open your WSL terminal and follow the Linux (Ubuntu/Debian) instructions.

## Verify Redis Installation

Test that Redis is running correctly:

```bash
redis-cli ping
```

You should see the response:

```
PONG
```

## Configuration for Tombolo

By default, Tombolo connects to Redis on `localhost:6379` without authentication. You can customize the connection in your `.env` file:

## Troubleshooting

### Redis Not Running

If `redis-cli ping` fails, check if Redis is running:

**macOS:**

```bash
brew services list
```

**Linux:**

```bash
sudo systemctl status redis-server
```

### Port Already in Use

If port 6379 is already in use, you can change the Redis port by editing the Redis configuration file or setting `REDIS_PORT` in your `.env` file.

## Additional Resources

- [Official Redis Documentation](https://redis.io/docs/latest/operate/oss_and_stack/install/archive/install-redis/)
- [Redis CLI Documentation](https://redis.io/docs/latest/develop/connect/cli/)
- [BullMQ Documentation](https://docs.bullmq.io/)
