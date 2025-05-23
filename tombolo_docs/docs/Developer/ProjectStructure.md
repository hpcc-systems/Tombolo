---
sidebar_position: -98
---

# Project Structure

The Tombolo project is structured for clarity, with `Tombolo/tombolo_docs` hosting the Docusaurus-powered documentation site, while `Tombolo/Tombolo` contains the codebase split into `client-reactjs` and `server` directories. This decoupled client-server architecture allows the React frontend to be served independently by its own web server, Nginx, rather than the Node.js backend, enabling separate development, deployment, and scaling of the client and server. Below is an overview of the key directories and their roles.

```
Tombolo
|
├── docs
|
└── Tombolo
    |
    ├── client-reactjs
    |     └── index.js
    |
    └── server
          ├── cluster-whitelist.js
          ├── logs
          ├── tests
          └── server.js
```
