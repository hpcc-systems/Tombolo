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
      4. TOMBOLO_PASSWORD_RESET_URL - *(Example - \<protocol>://<host_name:port>/reset-password)*
5. Tombolo uses Auth Service for user authentication. An existing Auth Service can be used or you may set up Auth Service separately. 
    You can find the Authservice setup instructions [here](https://github.com/hpcc-systems/Auth-Service). Once you have an instance of Authservice up and running, 
    update the following information on the '.env' file located on the '/server' directory.
    1. AUTH_SERVICE_URL - *(URL to the AuthService. Eg - \<protocol>://<host_name>:<port>/api/auth)*
    2. AUTHSERVICE_TOMBOLO_CLIENT_ID - *(Unique identifier used to identify an application in AuthService. This value can be found in AuthService UI under applications)*
7. Locate cluster-whitelist.js file inside the "/server" directory and add cluster information.
8. Install dependencies.
    1. Inside '/server' run *'npm install'*
    2. Inside '/client-reactjs' run *'npm install'*
9. Now, under '/server' directory, run *'npx sequelize-cli db:migrate'*. This will create all the necessary tables on the database.
10. Once the database tables are created, you will need to seed the tables with some  data. While still inside server directory run *'npx sequelize-cli db:seed:all'*.
11. Tombolo is now ready for launch on your local machine. Run *'nodemon server.js'* to spin up the server. Make sure you are still inside the '/server' directory when you run this command.
12. Finally, on a separate terminal go to '/client-reactjs' directory and run *'npm start'*. This should open the client on your default browser. If a browser does not open, manually open it and go to 'localhost:3001'

----
#### Production Environment (Docker)
1. Clone repository
2. Locate '.env-sample' file on the root directory and rename it to '.env'
3. On that  '.env' file update the information below
   1. HOST_NAME 
	 2. DB_USERNAME - *(MySql database username)*
	 3. DB_PASSWORD - *(MySql database password)*
	 4. secret -  *( You can generate a strong and unique string [here](https://www.grc.com/passwords.htm))*
   5. AUTH_SERVICE_URL - *( Tombolo uses Auth Service for user authentication. An existing Auth Service can be used or you may set up Auth Service separately. 
    You can find the Authservice setup instructions [here](https://github.com/hpcc-systems/Auth-Service). Once you have an instance of Authservice up and running, 
    update this value. Eg - <protocol>://<host_name>:<port>/api/auth)*
   6. AUTHSERVICE_TOMBOLO_CLIENT_ID - *(Unique id of Tombolo app in Auth Service. This will be used in the communication between Tombolo and AuthService)*
   7. CERT_PATH - *(SSL certificate location only if you are using SSL)*
   8. Update rest of the  values for Kafka and Zookeeper - *(To create keys, please refer here https://github.com/edenhill/librdkafka/wiki/Using-SSL-with-librdkafka#create-a-ca-certificate. For documentation on bitnami kafka and zookeeper docker images and setup, please refer https://github.com/bitnami/bitnami-docker-kafka, https://github.com/bitnami/bitnami-docker-zookeeper, For details on SSL config https://github.com/bitnami/bitnami-docker-kafka/issues/129 )*
   9. JOB_COMPLETE_GROUP_ID
   10. JOB_COMPLETE_TOPIC
4. If you are going to be running this application without SSL, locate 'nginx.conf.template' file located at 'client-reactjs/nginx/confd' and remove all SSL-related configuration. 
 5.  Locate cluster-whitelist.js file inside the "/server" directory and add cluster information.
 6. Now from the root directory run *'docker-compose up -d'*. This will create and run all necessary containers.
 7. Once the build  successfully completes, the application will be accessible at *'http://<host_name>:<WEB_EXPOSED_PORT>'*

----
## Documentation 
Click [here](https://github.com/hpcc-systems/Tombolo/blob/master/docs/README.md) to view complete documentation.
Click [here](https://github.com/hpcc-systems/Tombolo/blob/master/client-reactjs/public/Tombolo-User-Guide.pdf) to view complete documentation.

