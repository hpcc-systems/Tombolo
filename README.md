# Tombolo - A Data Curation Tool for HPCC Systems
![](/docs/images/tombolo/Slide1.png)
## Installation Guide
#### Local Environment (Without Docker)
1. Clone the repository
2. Go inside the '/server' directory and rename the '.env-sample' file to '.env' and update necessary variables
    > **IMPORTANT**: We have added comment for each variable blocks. Read them carefully before updating or adding any variables
3. Locate 'cluster-whitelist.sample.js' file inside the '/server' directory, rename it to 'cluster-whitelist.js' and add cluster information.
4. Inside /server run `npm run bootstrap-server`. This will install all the dependencies, create schema, migrate tables, seed initial data and spin the server
5. Go Inside '/client-react.js' and rename the .env-sample file to '.env' and update all necessary variables
6. Inside '/client-react.js' run  `npm run bootstrap-server`. This will install  all the dependencies and start client.


----
#### Production Environment (Docker)
1. Clone repository
2. Locate '.env-sample' file on the root directory and rename it to '.env' and update necessary variables
     > **IMPORTANT**: We have added comment for each variable blocks. Read them carefully before updating or adding any variables
4. If you are going to be running this application without SSL, locate 'nginx.conf.template' file located at 'client-reactjs/nginx/confd' and remove all SSL-related configuration. 
5. Locate 'cluster-whitelist.sample.js' file inside the "/server" directory, rename it to 'cluster-whitelist.js' and add cluster information.
6. Locate '.env' file inside the "/client-react.js" directory, rename it to '.env' and update necessary variables.
7. Build Application
    - If you are not setting up Kafka  run *'docker-compose up -d --no-deps --build mysql_db node web'*.
    - If you are setting up all services in docker-compose file, run *'docker-compose up -d'*. 
8. Once the build  successfully completes, the application will be accessible at *'http://<host_name>:<WEB_EXPOSED_PORT>'*
----
## Documentation 
Click [here](https://github.com/hpcc-systems/Tombolo/blob/read-me/docs/images/tombolo/Tombolo%20User%20Guide.pdf) to view complete documentation
  
  

