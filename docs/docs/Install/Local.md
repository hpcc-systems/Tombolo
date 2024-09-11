---
sidebar_position: 1
---

# Local Setup

Local installation requires a few dependencies to be installed directly on your machine. This is the best choice for developers who want to contribute to the project, or develop integrations to customize their instance. If you intend to use this installation for production purposes, or do not want to configure your own system, we recommend a containerized installation using our [Docker Installation Guide](/docs/Install/Docker) instead.

---

## System Requirements and Prerequisites

Before setting up Tombolo with Docker, ensure your system meets the following requirements:

- **CPU**: 2+ cores
- **RAM**: 4GB+ (8GB recommended for optimal performance)
- **Storage**: At least 10GB of free disk space

### Required Software

- [Node.js](https://nodejs.org/en/download/) version 18.0 or above:
  - When installing Node.js, you are recommended to check all checkboxes related to dependencies.
- [Git](https://git-scm.com/downloads) latest version recommended.
- [MySQL Database](https://dev.mysql.com/downloads/) latest version recommended (URL, and port number, must be accessible from the installation environment).
- [HPCC cluster](https://hpccsystems.com/getting-started/) latest version recommended.
- [Azure Subscription](https://azure.microsoft.com/en-us/free)
  - App registration in Azure (Client ID and Tenant ID. For Authentication , Authorization and to Redirect after authentication). Two processes must be completed one for client application and one for server application
  - Adding users to an AD group for authentication (User access control)

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

Navigate to the Tombolo folder inside of the root directory of your git installation, and create a new .env file. Paste the code below and set your variables accordingly.

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

Save the file when finished.

### Client

From the root directory of your git installation, navigate to the Tombolo Folder, and then the Client-reactjs folder, and create a new .env file. Paste the code below and set your variables accordingly.

```bash
PORT=3001
## PROXY URL ------------------------------------
# Make sure this url is pointing to the backend server URL. This is used by the UI to interact with backend (Eg : http://localhost:3000)
REACT_APP_PROXY_URL=http://localhost:3000
## APPLICATION VERSION ----------------------------
# This grabs the application version fron package.json to display on front end
REACT_APP_VERSION=$npm_package_version
## AZURE -------------------------------------------
# Uncomment and add the values only if the application is using Auth service for authentication. If Auth service is used for authentication leave as it is.
REACT_APP_APP_AUTH_METHOD =azure_ad
REACT_APP_AZURE_CLIENT_ID ={your azure client ID}
REACT_APP_AZURE_TENENT_ID ={your azure tenant ID}
REACT_APP_AZURE_REDIRECT_URI = http://localhost:3001
REACT_APP_AZURE_API_TOKEN_SCOPE={your api token scope}
```

Save the file when finished.

---

## Step 3 - Run the application

### Server

Run the following commands from the root directory of your git repository in your preferred terminal or integrated IDE

```bash
cd tombolo/server
```

```bash
npm run boostrap-server
```

The `cd` command changes the directory you're working with.

The `npm run boostrap-server` command installs dependencies located in the package.json file necessary for running and compiling the code, then creates the database schema and runs necessary migrations and seeder files for the application. After this is finished, it will start the server.

## Start the front end

Open a seperate terminal or integrated IDE, and navigate to your git repository location

```bash
cd tombolo/client-reactjs
```

```bash
npm run bootstrap-client
```

The `cd` command changes the directory you're working with.

The `npm run bootstrap-client` command installs dependencies located in the package.json file necessary for running and compiling the code. After this is finished, it will start the front end.

---

## Step 4 - Open the application

Depending on your environment, your browser may have been opened to the start page of Tombolo already, after running the
`npm start` command for the client. If not, you can reach your new installation at [http://localhost:3001/](http://localhost:3001/). If you need any further assistance, check out our [user guides](/docs/category/user-guides).
