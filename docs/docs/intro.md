---
sidebar_position: 1
---

# Intro

Let's discover **Tombolo**.

## Getting Started

Get started by **creating a new installation**.

### What you'll need

- [Node.js](https://nodejs.org/en/download/) version 18.0 or above:
  - When installing Node.js, you are recommended to check all checkboxes related to dependencies.
- [Git](https://git-scm.com/downloads) latest version recommended.
- [MySQL Database](https://dev.mysql.com/downloads/) latest version recommended.
- [HPCC clusters (High Performance Computing Cluster)](https://hpccsystems.com/getting-started/) latest version recommended.
  - Need to think about what to put here
- [Azure AD](https://azure.microsoft.com/en-us/free) You will need a client and tenant ID for authentication.

### Recommended

- Familiarity with basic commands associated with Command Prompt, Powershell, Terminal, or integrated terminal of your choice

- [Visual Studio Code](https://code.visualstudio.com/download) or your preferred IDE with integrated terminal.

## Clone the Git Repository into your local machine

Open a Command Prompt, Powershell, Terminal, or any other integrated terminal and navigate to your desired installation location.

Run the command below.

```bash
git clone https://github.com/hpcc-systems/Tombolo.git
```

## Configure the ENV

Open the .env.sample folder in the root of the project in your preferred text or code editor and set the following variables

```bash
HOST_HOSTNAME=localhost
PORT=3000
WEB_URL=http://localhost:3001/
DB_USERNAME={your db username, typically root}
DB_PASSWORD={your db user password}
DB_PORT={your db port, typically 3306}
DB_NAME=tombolo
DB_HOSTNAME={your db host, typically localhost}
APP_AUTH_METHOD=azure_ad
TENENT_ID={your azure tenant ID}
CLIENT_ID={your azure client ID}
```

Save the file as '.env', deleting the .sample extension

## Start the backend

Run the following commands

```bash
cd tombolo/server
```

```bash
npm i
```

```bash
npx sequelize db:migrate
```

```bash
node server.js
```

The `cd` command changes the directory you're working with. In order to work with your newly created Docusaurus site, you'll need to navigate the terminal there.

The `npm i` command installs dependencies located in the package.json file necessary for running and compiling the code.

The `npx sequelize db:migrate` command installs dependencies located in the package.json file necessary for running and compiling the code.

The `node server.js` command starts the backend server and associated API's necessary for the front end

## Start the front end

Open a seperate terminal, and navigate to your installation location

```bash
cd client-reactjs
```

```bash
npm i
```

```bash
npm start
```

The `cd` command changes the directory you're working with. In order to work with your newly created Docusaurus site, you'll need to navigate the terminal there.

The `npm i` command installs dependencies located in the package.json file necessary for running and compiling the code.

The `npm start` command starts your front end development environment at [http://localhost:3000/](http://localhost:3000/)

## Congratulations

Your Tombolo installation is now up and running. Lets learn some of the core concepts of the software.
