---
sidebar_position: -99
---

# System Architecture

Tombolo’s architecture integrates a React frontend, Node.js backend, MySQL and and external services like HPCC, with notification support via a mail server. The diagram below illustrates the system’s components and their interactions.

![Tombolo System Architecture](/img/system-architecture.jpg)

1. **Users** access Tombolo through a React app served by Nginx.
2. The **frontend** communicates with a Node.js backend via API calls.
3. The **backend** uses Sequelize to interact with a MySQL database.
4. The **backend** connects to an HPCC server via the HPCC JS comms library.
5. **Notifications** are sent via an external mail server.
6. All services (React, Node.js, MySQL) are packaged as Docker containers, orchestrated with a `docker-compose.yml` file located in `Tombolo/Tombolo`.
