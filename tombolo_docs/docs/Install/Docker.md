---
sidebar_position: 2
pagination_next: null
pagination_prev: null
title: Docker Setup
---

# Docker Setup Instructions

Tombolo can be deployed quickly by following a few simple steps and running a couple of Docker commands. With Docker, there are fewer prerequisites, and you don’t need to worry about installing multiple applications or having a specific operating system on your machine. This makes Docker the preferred packaging method for production, as it ensures consistency across environments, enhances portability, and simplifies the deployment process.

---

### System Requirements and Prerequisites

Before setting up Tombolo with Docker, ensure your system meets the following requirements:

- **CPU**: 2+ cores
- **RAM**: 4GB+ (8GB recommended for optimal performance)
- **Storage**: At least 10GB of free disk space
- **Docker**: Ensure Docker is installed and running on your machine, preferably the latest version. You can download the most recent version from [Docker's official site](https://www.docker.com/get-started).
- **Git**: Preferably latest version

### Other Prerequisites

- **Email Provider** - Required to verify user accounts.

---

### Step 1- Clone the Repository

To get started, clone the Tombolo repository using the following command:

```bash
git clone https://github.com/hpcc-systems/Tombolo.git
```

The default branch is `master`, which will be checked out automatically when you clone. If you have switched branches and need to return to `master`, use:

```bash
git checkout master
```

---

### Step 2 - Update Configuration Files

There are two configuration files that need to be modified. The one at the root of the project is for the backend service, and the one inside `client-reactjs` is for the front-end React application.

<div class="important_block">
> Please carefully review each variable before making any changes. Detailed explanations can be found in the [Configurations](./Configurations).
</div>

1. Navigate to `/Tombolo/Tombolo` and create a new `.env` file.
2. Copy all the contents from `/Tombolo/Tombolo/.env.sample` and paste them into the newly created `.env` file.
3. Navigate to `/Tombolo/Tombolo/client-reactjs` and create a new `.env` file.
4. Copy all the contents from `/Tombolo/Tombolo/client-reactjs/.env.sample` and paste them into the newly created `.env` file.
5. Review both `.env` files and update variables if necessary. Use the [Configurations](./Configurations) documentation as a guide.

---

### Step 3 - Configure Nginx

Nginx is required to serve the frontend and reverse proxy requests to the backend. You can configure Nginx with or without SSL. Running without SSL is only recommended if you are configuring for testing purposes.

1. Create a new file named `nginx.conf.template` inside the `/client-reactjs/nginx/conf.d` directory.
2. If you're using SSL, copy the content from `nginx.conf.template-ssl` and paste it into `nginx.conf.template`. If you're not using SSL, copy the content from `nginx.conf.template-no-ssl` and paste it into `nginx.conf.template`.

---

### Step 4 - Whitelist Clusters

<div class="important_block">
> If your cluster uses self signed certificates you must add the certificate to Tombolo. Instructions can be found in [Self Signed certs](/docs/User-Guides/self-signed-certs).
</div>

Clusters need to be whitelisted to allow Tombolo to communicate with them. Any clusters that will be used in Tombolo must be whitelisted for security reasons.

1. Inside the `/server` directory, create a new file called `cluster-whitelist.js`.
2. Use `cluster-whitelist.sample.js` as a template to add the clusters that you would like to whitelist.

---

### Step 5 - Set Up Docker Compose

Docker Compose is used to define and run the multi-container Docker applications required for this project. In this setup, you will create three services: `web`, `node`, and `mysql_db`.

1. In the project root directory (`/Tombolo/Tombolo`), create a new file called `docker-compose.yml`.
2. Copy everything from `docker-compose-sample` and paste it into the new file you just created. Update any configurations if necessary.

---

### Step 6 - Build and Start the Application

To build and start the application using Docker, run the following commands. The first command builds the application image, while the second command starts the application in detached mode, allowing it to run in the background.

NOTE: If you are receiving errors when executing the commands on linux you may need to run them with `sudo`

```bash
# Navigate to the project root directory
cd /path/to/Tombolo/Tombolo

# Execute docker compose commands

# Linux
docker compose build
docker compose up -d

# Mac/Windows
docker-compose build
docker-compose up -d
```

Once the containers have started successfully, the application will be accessible at: `http://<host_hostname>:<host_port>`

---
