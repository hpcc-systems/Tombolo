---
sidebar_position: 1
---

# Local Setup

Local installation requires a few dependencies to be installed directly on your machine. This is the best choice for developers who want to contribute to the project, or develop integrations to customize their instance. If you intend to use this installation for production purposes, or do not want to configure your own system, we recommend a containerized installation using our [Docker Installation Guide](/docs/Install/Docker) instead.

---

## System Requirements and Prerequisites

### System Specifications

- **CPU**: 2+ cores
- **RAM**: 4GB+ (8GB recommended for optimal performance)
- **Storage**: At least 10GB of free disk space

### Required Software

- [Node.js](https://nodejs.org/en/download/) version 18.0 or above (20+ recommended):
  - When installing Node.js, you are recommended to check all checkboxes related to dependencies.
- [Git](https://git-scm.com/downloads) latest version recommended.
- [MySQL Database](https://dev.mysql.com/downloads/) latest version recommended (URL, and port number, must be accessible from the installation environment).
- [HPCC cluster](https://hpccsystems.com/getting-started/) latest version recommended.
- Email Provider - Required to verify user accounts.
- [pnpm](../Developer/InstallPnpm) The package manager used by Tombolo.

### Recommended Software and Skills

- Familiarity with basic commands associated with Command Prompt, Powershell, Terminal, or integrated terminal of your choice

- [Visual Studio Code](https://code.visualstudio.com/download) or your preferred IDE with integrated terminal.

---

## Step 1 - Clone the Git Repository

Open a Command Prompt, Powershell, Terminal, or any other integrated terminal and navigate to your desired installation location.

Run the command below.

```bash
git clone https://github.com/hpcc-systems/Tombolo.git
```

The default branch is `master`, which will be checked out automatically when you clone. If you have switched branches and need to return to `master`, use:

```bash
git checkout master
```

---

## Step 2 - Editor Setup (Recommended: Visual Studio Code)

For consistency across the team, we recommend using [Visual Studio Code](https://code.visualstudio.com/) as your editor for this project.

- This repository includes a `.vscode/settings.json` file. These workspace settings will **override your personal VS Code settings** for this project only.
- The workspace settings are intended to ensure a consistent development environment for all contributors.

**Required Extensions:**

- [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

Please make sure both extensions are **installed and enabled** in your VS Code environment.

---

## Step 3 - Configure Environment Variables

<div class="important_block">
Please carefully review each variable before making any changes. Detailed explanations can be found in [Configurations](./Configurations)
</div>

### Server

Navigate to the Tombolo folder inside the root directory of your git installation, and create a new `.env` file. Paste the contents of the `.env.sample` file into this newly created `.env` file. Carefully review the description of each variable, as they may differ depending on the environment. A detailed description of each variable can be found here: [Configurations](./Configurations).

### Client

From the root directory of your git installation, navigate to the Tombolo folder, then to the `client-reactjs` folder, and create a new `.env` file. Copy and paste the contents of the `.env.sample` file from the same level and update the variables as needed. Again, please refer to [Configurations](./Configurations) for a detailed explanation of what each variable is.

---

## Step 4 - Whitelist Clusters

<div class="important_block">
> If your cluster uses self signed certificates you must add the certificate to Tombolo. Instructions can be found in [Self Signed certs](/docs/User-Guides/self-signed-certs).
</div>

Clusters need to be whitelisted to allow Tombolo to communicate with them. Any clusters that will be used in Tombolo must be whitelisted for security reasons. None are required to start the software, but at least one is required to access the featureset available.

Inside the Tombolo/server directory, create a new file called cluster-whitelist.js.
Use cluster-whitelist.sample.js as a template to add the clusters that you would like to whitelist.

---

## Step 5 - Run the application

### Initialize the database

Run the following commands in the root directory of your git repository

```bash
pnpm install
```

The `pnpm install` command installs all dependencies for the application (even for nested repos)

```bash
pnpm db:init
```

The `pnpm db:init` command creates the schema, runs migrations and runs all seeds. This is required for the backend to interact with the database.

### Run the application

```bash
pnpm dev
```

The `pnpm dev` command starts the frontend and backend in dev mode.

---

## Step 6 - Open the application

Depending on your environment, your browser may have been opened to the start page of Tombolo already, after running the
`pnpm dev` command for the client. If not, you can reach your new installation at [http://localhost:3000/](http://localhost:3000/). If you need any further assistance, check out our [user guides](/docs/category/user-guides).

---
