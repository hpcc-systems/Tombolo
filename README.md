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
5. Tombolo uses Auth Service for user authentication. An existing Auth Service can be used or you may set up Auth Service separately. 
    You can find the Authservice setup instructions [here](https://github.com/hpcc-systems/Auth-Service). Once you have an instance of Authservice up and running, 
    update the following information on the '.env' file located on the '/server' directory.
    1. AUTH_SERVICE_URL - *(URL to the AuthService. For e:g http://<host name>:<port>/auth.)*
    2. AUTHSERVICE_TOMBOLO_CLIENT_ID - *(Unique identifier used to identify an application in AuthService. This value can be found in AuthService UI under applications)*
6. On the same '.env file',  fill in the value for 'secret'. You can generate a strong and unique string [here](https://www.grc.com/passwords.htm)
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
	1. DB_USERNAME
	2. DB_PASSWORD
	3. secret -  *( You can generate a strong and unique string [here](https://www.grc.com/passwords.htm))*
   3. AUTH_SERVICE_URL - *( Tombolo uses Auth Service for user authentication. An existing Auth Service can be used or you may set up Auth Service separately. 
    You can find the Authservice setup instructions [here](https://github.com/hpcc-systems/Auth-Service). Once you have an instance of Authservice up and running, 
    update this value.)*
    4. AUTHSERVICE_TOMBOLO_CLIENT_ID - *(Unique id of Tombolo app in Auth Service. This will be used in the communication between Tombolo and AuthService)*
   4. CERT_PATH - *(SSL certificate location only if you are using SSL)*
   5. KAFKA_HOST_NAME 
   6. EMAIL_SMTP_HOST
   7. EMAIL_PORT
4. If you are going to be running this application without SSL, locate 'nginx.conf.template' file located at 'client-reactjs/nginx/confd' and remove all SSL-related configuration. 
 6. Now from the root directory run *'docker-compose up -d'*. This will create and run all necessary containers.
 7. Once the build  successfully completes, the application will be accessible at *'http://<host_name>:<WEB_EXPOSED_PORT>'*

----
## Documentation 
Click [here](https://github.com/hpcc-systems/Tombolo/blob/master/docs/README.md) to view complete documentation.
