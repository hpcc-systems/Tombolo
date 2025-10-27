---
sidebar_position: 3
pagination_next: null
pagination_prev: null
title: Configurations
---

# Environment Configuration

To get Tombolo up and running, you'll need to configure two essential files. For your convenience, sample .env files are already included in the project. Simply copy these sample files and adjust the values to suit your specific environment.

1. **General Environment File**:
   This file contains server-related configurations and Docker-related settings. It is located in the root directory of the project: `Tombolo/Tombolo/.env`.

2. **Client-Specific Environment File**:
   This file is specific to the client-side application and is located in `Tombolo/Tombolo/client-reactjs/.env`.

---

## Using Akeyless for Secure Secrets Management

Tombolo supports storing sensitive values (such as passwords and encryption keys) securely in Akeyless. This allows you to avoid keeping critical secrets directly in your .env files. If you plan to use Akeyless:

1. Provide the Akeyless configuration details in your .env file (e.g., access ID, access key, and path prefix).
2. Do not move all variables to Akeyless - certain values such as HOST, PORT, and other Docker-related settings must remain in the .env file, as they are required by docker-compose. Moving them to Akeyless will cause your environment to break.
3. If the same variable exists in both Akeyless and .env, the .env value takes precedence.

**Good candidates for storing in Akeyless include:**

- Database usernames and passwords
- Encryption or API keys
- Other sensitive credentials or tokens

---

<div class="important_block">
> **Important**: Review and understand the variables in these files as they may differ depending on your environment. Detailed explanations for each variable are provided below.
</div>

<!-- Force a line break -->
<br/>

<div class="custom_details_component">
<details class="env_config-details">
<summary>
## Server Environment Variables
</summary>

Below are the server and Docker-related configuration variables for Tombolo. These variables are also referenced in the Docker Compose file. Each one is explained with its purpose and usage.

### 1. Instance Configuration

- **INSTANCE_NAME**
  This variable is used to give a unique name to the instance of the Tombolo application.
  _Example:_ `tombolo_dev_1`

- **NODE_ENV**
  Defines the environment type in which Tombolo will run. It can either be set to `development` or `production`.
  _Example:_ `development`

- **NODE_LOG_LEVEL**
  The logging level for the Node.js server. Options include `error`, `warn`, `info`, `http`, `verbose`, `debug`, and `silly`. For more information on configuring logging with Winston, refer to the [Winston Configuration](https://github.com/winstonjs/winston).
  _Example:_ `http`

---

### 2. Host, Port, and Web URL Configuration

- **HOSTNAME**
  This defines the hostname that Tombolo will use. Typically, `localhost` is used for local development, but in a production setup, this could be a domain name or an IP address where the Tombolo server is hosted.
  _Example:_ `localhost`

- **SERVER_PORT**
  Specifies the port on which the backend server will run. This is the port that handles API requests and communications between the frontend and backend.
  _Example:_ `3001`

- **HTTP_PORT**
  This port is dedicated to the frontend interface of Tombolo. When running locally, the frontend will be accessible through this port.
  _Example:_ `3000`

- **HTTPS_PORT**
  Port used for secure HTTP traffic (HTTPS). If SSL/TLS isn't configured or required for your local setup, this setting can be ignored.
  _Example:_ `443`

- **WEB_URL**
  URL to access Tombolo's web interface. It is composed of the hostname and HTTP port. In production, this would be a FQDN.
  _Example:_ `http://localhost:3000/`

---

### 3. SSL Certificate Configuration (Nginx)

These configurations are required if you're using SSL/TLS. Ignore if not using SSL.

- **CERT_PATH**
  Specifies the directory path where SSL certificates are stored. This path is referenced by Nginx.
  _Example:_ `/certs`

- **CERTIFICATE_NAME**
  The file name of your SSL certificate.
  _Example:_ `my_certificate.pem`

- **CERTIFICATE_KEY**
  The file name of the SSL certificate's private key.
  _Example:_ `my_certificate_key.pem`

---

### 4. Database Configuration

- **MYSQL_SSL_ENABLED**
  Determines whether SSL is enabled for the MySQL connection. Set this to `true` in production environment.
  _Example:_ `false`

- **DB_USERNAME**
  Provide a non-root database username.
  **Do not use `root`** – this is a reserved system user in MySQL
  _Example:_ `dbUser`

- **DB_PASSWORD**
  The password associated with the MySQL username.
  _Example:_ `dbPassword`

- **DB_PORT**
  The port used for MySQL communication. The default MySQL port is `3306`, but this may differ based on your environment.
  _Example:_ `3306`

- **DB_NAME**
  The name of the MySQL database used by Tombolo.
  _Example:_ `tombolo`

- **DB_HOSTNAME**
  The host of the MySQL database, typically `localhost` for local setups. For Docker, use the service name `mysql_db`.
  _Example:_ `localhost`

---

### 5. Authentication and Authorization Configuration

Tombolo offers two authentication methods: traditional authentication and Azure AD. By default, traditional authentication is enabled and is required for your ownership account. Regardless of whether you use Azure AD for authentication, the following three variables must be provided.

To generate these secret tokens, you can use the following bash command:
`openssl rand -base64 32`

- **JWT_SECRET**
  Avoid using predictable or short keys. Use a strong, random secret key generated by a secure method (such as using a cryptographically secure random generator)

- **JWT_REFRESH_SECRET**
  Same as JWT secret the Refresh Secret must be unpredictable and long.

- **CSRF_SECRET**
  This token is used by the application to protect against Cross-Site Request Forgery (CSRF) attacks. It must be a strong, unique value to ensure the integrity of requests and prevent unauthorized actions from malicious sources.

---

### 6. OAuth 2.0 (Azure) Configuration

<div class="important_block">
> **Important**: Azure AD authentication is optional, and you are not required to set Azure configuration variables
</div>

The first step to using Microsoft Entra ID for authentication is to register an application in Azure. Once registered, you will receive a Client ID and Tenant ID, which are crucial for this to work. You can also configure a redirect URI, which is a URL to be routed to when a user is authenticated.

- **TENANT_ID**
  The tenant ID from Azure AD. You obtain this after registering your application in Azure AD.
  _Example:_ `your_tenant_id`

- **CLIENT_ID**
  The client ID from Azure AD. You obtain this after registering your application in Azure AD.
  _Example:_ `your_client_id`

- **CLIENT_SECRET**
  The client secret from Azure AD. You obtain this after registering your application in Azure AD.
  _Example:_ `your_client_secret`

- **REDIRECT_URI**
  The redirect URI from Azure AD. You obtain this after registering your application in Azure AD.
  _Example:_ `http://localhost:3000`

---

### 7. Email Configuration

Tombolo does not include a built-in SMTP server. To enable email functionality (e.g., notifications), you will need to configure an external SMTP server:

Some services we recommend are: [SendGrid](https://sendgrid.com/), [Mailgun](https://www.mailgun.com/), [Azure ACS](https://azure.microsoft.com/en-us/products/communication-services) and [Brevo](https://www.brevo.com/)

- **EMAIL_SMTP_HOST**
  The SMTP host for sending emails.

  _Example:_ `smtp.mailserver.com`

- **EMAIL_PORT**
  The port number for the SMTP server.

  _Example:_ `25`

- **EMAIL_SENDER**
  The default sender email address.

  _Example:_ `donotreply@tombolo.com`

- **EMAIL_USER (optional)**
  The SMTP auth username.

  _Example:_ `testuser1`

- **EMAIL_PASS (optional)**
  The SMTP auth password.

---

### 8. Security Configuration

- **ENCRYPTION_KEY**
  This key is used for hashing, encryption, and decryption operations within Tombolo. You can generate this key using OpenSSL:
  `openssl rand -base64 32`

---

### 9. Integration-Specific Configuration

If you have any integrations enabled and they have environment variables, they can be added to this configuration file as well. There is a placeholder section for those integration-specific variables. Please add them there.

### 10. Test Configuration

- **RATE_LIMIT_REQUEST_MAX**
  The amount of requests per 15 minutes that will rate limit a user.

  _Example:_ `400`

---

- **TEST_MODE**
  This should only be set to true if end to end tests are being executed.

  _Example:_ `false`

---

</details>
</div>

<div class="custom_details_component">
<details>
<summary>
## Client Environment Variables
</summary>

### Development Configuration

- **PORT**
  Defines the port on which the front-end React application will run.
  _Example:_ `3000`

- **VITE_PROXY_URL**
  Specifies the proxy URL for the React application, typically used to proxy API requests during development.
  _Example:_ `http://localhost:3001`

### Authentication Configuration

- **VITE_AUTH_METHODS**
  Specifies the authentication method to be used by the application. Available options are `traditional` and `azure`. For more details, refer to the `APP_AUTH_METHOD` variable in the server configuration. These values should be entered in a CSV format. You can use any combination of methods, but at least one must always be present to be able to authenticate to the application.

  _Example:_ `traditional,azure`

### Azure Configuration (only if using Azure AD for authentication)

<div class="important_block">
> **Important**: Azure AD authentication is optional, and you are not required to set Azure configuration variables
</div>

- **VITE_AZURE_CLIENT_ID**
  The client ID for Azure AD authentication.
  _Example:_ `your-azure-client-id`

- **VITE_AZURE_TENANT_ID**
  The tenant ID for Azure AD authentication.
  _Example:_ `your-azure-tenant-id`

- **VITE_AZURE_REDIRECT_URI**
  The URL Azure will redirect the user to after successful authentication. This must also be configured in Azure when registering the app.
  _Example:_ `http://localhost:3001/auth/callback`

- **VITE_AZURE_API_TOKEN_SCOPE**
  The API token scope for Azure AD authentication.
  _Example:_ `api://your-api-id/.default`

### App Version

- **VITE_VERSION**
  The version of the application, typically derived from the package version.
  _Example:_ `$npm_package_version`

</details>
</div>
