# Tombolo - A Data Curation Tool for HPCC Systems
![](/docs/images/tombolo/Slide1.png)
## Installation Guide
#### Local Environment 
1. Clone the repository
2. Go inside the '/server' directory and rename the '.env-sample' file to '.env'.
3. Next, you will need to set up a database and create a schema named 'tombolo'.
4. Open '.env' file that is located on the '/server' directory and  update the following information
      1. DB_USERNAME -*(mysql database username)*
      2. DB_PASSWORD -*(mysql database password)*
      3. secret - *(You can generate a strong and unique string [here](https://www.grc.com/passwords.htm))*
      4. WEB_URL - *(Example - \<protocol>://<host_name:port>/)*
5. Tombolo uses Auth Service for user authentication. An existing Auth Service can be used or you may set up Auth Service separately. 
    You can find the Authservice setup instructions [here](https://github.com/hpcc-systems/Auth-Service). Once you have an instance of Authservice up and running, 
    update the following information on the '.env' file located on the '/server' directory.
    1. AUTH_SERVICE_URL - *(URL to the AuthService. Eg - \<protocol>://<host_name>:<port>/api/auth)*
    2. AUTHSERVICE_TOMBOLO_CLIENT_ID - *(Unique identifier used to identify an application in AuthService. This value can be found in AuthService UI under applications)*
7. Locate 'cluster-whitelist.sample.js' file inside the "/server" directory, rename it to 'cluster-whitelist.js' and add cluster information.
8. Go Inside '/client-react.js' and rename the .env-sample file to '.env'
9. Please make sure the REACT_APP_PROXY_URL property is pointing to the backend server URL. This is used by the UI to interact with backend
10. Install dependencies.
    1. Inside '/server' run *'npm install'*
    2. Inside '/client-reactjs' run *'npm install'*
11. Now, under '/server' directory, run *'npx sequelize-cli db:migrate'*. This will create all the necessary tables on the database.
12. Once the database tables are created, you will need to seed the tables with some  data. While still inside server directory run *'npx sequelize-cli db:seed:all'*.
13. Tombolo is now ready for launch on your local machine. Run *'nodemon server.js'* to spin up the server. Make sure you are still inside the '/server' directory when you run this command.
14. Finally, on a separate terminal go to '/client-reactjs' directory and run *'npm start'*. This should open the client on your default browser. If a browser does not open, manually open it and go to 'localhost:3001'

----
#### Production Environment (Docker)
1. Clone repository
2. Locate '.env-sample' file on the root directory and rename it to '.env'
3. On that  '.env' file update the information below
   1. HOST_NAME 
   2. DB_USERNAME - *(MySql database username)*
   3. DB_PASSWORD - *(MySql database password)*
   4. DB_PORT - modify if the default port is in use
   5. secret -  *( You can generate a strong and unique string [here](https://www.grc.com/passwords.htm))*
   6. AUTH_SERVICE_URL - *( Tombolo uses Auth Service for user authentication. An existing Auth Service can be used or you may set up Auth Service separately. 
    You can find the Authservice setup instructions [here](https://github.com/hpcc-systems/Auth-Service). Once you have an instance of Authservice up and running, 
    update this value. Eg - <protocol>://<host_name>:<port>/api/auth)*
   7. AUTHSERVICE_TOMBOLO_CLIENT_ID - *(Unique id of Tombolo app in Auth Service. This will be used in the communication between Tombolo and AuthService)*
   8. CERT_PATH - *(SSL certificate location only if you are using SSL)*
   9. (Optional step) Update rest of the  values for Kafka and Zookeeper - *(To create keys, please refer here https://github.com/edenhill/librdkafka/wiki/Using-SSL-with-librdkafka#create-a-ca-certificate. For documentation on bitnami kafka and zookeeper docker images and setup, please refer https://github.com/bitnami/bitnami-docker-kafka, https://github.com/bitnami/bitnami-docker-zookeeper, For details on SSL config https://github.com/bitnami/bitnami-docker-kafka/issues/129 )*
   10. JOB_COMPLETE_GROUP_ID
   11. JOB_COMPLETE_TOPIC
4. If you are going to be running this application without SSL, locate 'nginx.conf.template' file located at 'client-reactjs/nginx/confd' and remove all SSL-related configuration. 
5. Rename .env.sample under /client-reactjs/ to .env and make sure REACT_APP_PROXY_URL has the correct URL to the backend. The Port number is the backend port ('PORT' in /.env file) 
6.  Locate 'cluster-whitelist.sample.js' file inside the "/server" directory, rename it to 'cluster-whitelist.js' and add cluster information.
7.  If the MySQL database does not have SSL enabled, please comment out the ssl config for database connection in server/config/config.js. Depending on the environment (development vs production), it will be line #10-#15 (dev) and #24-#29 (production)
8. If you are not setting up Kafka (optional) run *'docker-compose up -d --no-deps --build mysql_db node web'*. If you are setting up all services in docker-compose file, run *'docker-compose up -d'*. This will create and run all necessary containers.
9. Once the build  successfully completes, the application will be accessible at *'http://<host_name>:<WEB_EXPOSED_PORT>'*

----
## Documentation 
Click [here](https://github.com/hpcc-systems/Tombolo/blob/read-me/docs/images/tombolo/Tombolo%20User%20Guide.pdf) to view complete documentation
  
  

