# Tombolo - A Data Curation Tool for HPCC Systems
![](/docs/images/tombolo/Slide1.png)
## Installation Guide
#### Local Environment (Without Docker)
1. Clone the repository
2. Create `.env` file in the root.
3. Copy everything from `.env.sample`, paste it to `.env` file and update necessary variables. 
4. If you are using kafka copy everything from `.env.sample.kafka`, append it to `.env` file and update necessary fields.
    > **IMPORTANT**: Read the comments carefully before updating or adding any variables
5. Inside /server create new file `cluster-whitelist.js` and add cluster details. Use `cluster-whitelist.sample.js` as a template.
6. Inside /server run `npm run bootstrap-server`. 
   This will install dependencies, create schema, migrate tables, seed initial data and start the server.
7. Go Inside /client-react.js, create new `.env` file, copy-paste everything from .env.sample amd update necessary variables
8. Inside /client-react.js run  `npm run bootstrap-client`. This will install  all the dependencies and start client.
9. To start server and client independently run `nodemon server` and `npm start` from /server and /client directory respectively

----
#### Production Environment (Docker)
1. Clone the repository
2. Create `.env` file in the root.
3. Copy everything from `.env.sample`, paste it to `.env` file and update necessary variables. 
4. If you are using kafka copy everything from `.env.sample.kafka`, append it to `.env` file and update necessary fields.
    > **IMPORTANT**: Read the comments carefully before updating or adding any variables
5. Create new file `nginx.conf.template` inside `/client-reactjs/nginx/conf.d` directory
6. If you are using SSL copy all the content from `nginx.conf.template-ssl` and paste it to `nginx.conf.template`. 
   If you are not using SSL copy the content from `nginx.conf.template-no-ssl` and paste it to `nginx.conf.template`.
7. Inside /server create new file `cluster-whitelist.js` and add cluster details. Use `cluster-whitelist.sample.js` as a template.
8. Go Inside /client-react.js, create new `.env` file, copy-paste everything from .env.sample amd update necessary variables
9. Build Application
    - If you are not setting up Kafka and Zookeeper run *`docker-compose up -d mysql_db node web`*.
    - If you are setting up all services including kafka and zookeeper, locate *`docker-compose.yml`*, un-comment the commented services and run *`docker-compose up -d`*. 
10. Once the build  successfully completes, the application will be accessible at `http://<host_hostname>:<host_port>`
----
## Documentation 
Click [here](https://github.com/hpcc-systems/Tombolo/blob/master/docs/images/tombolo/Tombolo%20User%20Guide.pdf) to view complete documentation