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

- [Node.js](https://nodejs.org/en/download/) version 18.0 or above:
  - When installing Node.js, you are recommended to check all checkboxes related to dependencies.
- [Git](https://git-scm.com/downloads) latest version recommended.
- [MySQL Database](https://dev.mysql.com/downloads/) latest version recommended (URL, and port number, must be accessible from the installation environment).
- [HPCC cluster](https://hpccsystems.com/getting-started/) latest version recommended.
- Email Provider - Required to verify user accounts.

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

---

## Step 2 - Configure Environment Variables

### Server

<div class="important_block">
Please carefully review each variable before making any changes. Detailed explanations can be found in [Configurations](./Configurations)
</div>

Navigate to the Tombolo folder inside of the root directory of your git installation, and create a new .env file. Paste the code below and set your variables accordingly. These variables are the minimum requirements, for more options use the [Configurations](./Configurations) documentation as a guide.

```bash
HOST_HOSTNAME=localhost
PORT=3000
WEB_URL=http://localhost:3001/
DB_USERNAME={your db username, typically root}
DB_PASSWORD={your db user password}
DB_PORT={your db port, typically 3306}
DB_NAME=tombolo
DB_HOSTNAME={your db host, typically localhost}
EMAIL_SMTP_HOST=
EMAIL_PORT=
EMAIL_SENDER=
```

Save the file when finished.

### Client

From the root directory of your git installation, navigate to the Tombolo Folder, and then the Client-reactjs folder, and create a new .env file. Paste the code below and set your variables accordingly. These variables are the minimum requirements, for more options use the [Configurations](./Configurations) documentation as a guide.

```bash
PORT=3001
## PROXY URL ------------------------------------
# Make sure this url is pointing to the backend server URL. This is used by the UI to interact with backend (Eg : http://localhost:3000)
REACT_APP_PROXY_URL=http://localhost:3000
## APPLICATION VERSION ----------------------------
# This grabs the application version fron package.json to display on front end
REACT_APP_VERSION=$npm_package_version
# Authentication Methods, traditional, azure available.
REACT_APP_AUTH_METHODS="traditional"
```

Save the file when finished.

---

## Step 3 - Whitelist Clusters

Clusters need to be whitelisted to allow Tombolo to communicate with them. Any clusters that will be used in Tombolo must be whitelisted for security reasons. None are required to start the software, but at least one is required to access the featureset available.

Inside the Tombolo/server directory, create a new file called cluster-whitelist.js.
Use cluster-whitelist.sample.js as a template to add the clusters that you would like to whitelist.

---

## Step 4 - Run the application

### Server

Run the following commands from the root directory of your git repository in your preferred terminal or integrated IDE

```bash
cd Tombolo/server
```

```bash
npm run bootstrap-server
```

The `cd` command changes the directory you're working with.

The `npm run bootstrap-server` command installs dependencies located in the package.json file necessary for running and compiling the code, then creates the database schema and runs necessary migrations and seeder files for the application. After this is finished, it will start the server. You should see the message below in your console, followed by a set of informational messages stating services have started.

```bash
-----------------------------
Server is finished intializing, and is now running
-----------------------------
```

\*\*\* After the bootstrap command has been run, you can start the server in any terminal with the following command inside of the Tombolo/server directory

```bash
node server.js
```

### Client

Open a seperate terminal or integrated IDE, and navigate to your git repository location

```bash
cd Tombolo/client-reactjs
```

```bash
npm run bootstrap-client
```

The `cd` command changes the directory you're working with.

The `npm run bootstrap-client` command installs dependencies located in the package.json file necessary for running and compiling the code. After this is finished, it will start the front end.

\*\*\* After the bootstrap command has been run, you can start the client in any terminal with the following command inside of the Tombolo/client-reactjs directory

```bash
npm run start
```

---

## Step 5 - Open the application

Depending on your environment, your browser may have been opened to the start page of Tombolo already, after running the
`npm start` command for the client. If not, you can reach your new installation at [http://localhost:3001/](http://localhost:3001/). If you need any further assistance, check out our [user guides](/docs/category/user-guides).
