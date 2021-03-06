# Tombolo - A Data Curation Tool for HPCC Systems

![](/docs/images/tombolo/Slide1.png)

### Installation:

1. Clone Git Repo
2. Rename .env.sample to .env
3. Update the following information in .env
    1.  DB_USERNAME
    2.  DB_PASSWORD
    3.  secret - Use the alpha numeric value from https://www.grc.com/passwords.htm for this secret.
    4. AUTH_SERVICE_URL - Tombolo uses Auth Service for user authentication. An existing Auth Service can used or Auth Service can be setup seperatly for this. Please refer to Auth Service repo for details on setting it up. 
    5. WEB_PORT & WEB_EXPOSED_PORT - WEB_EXPOSED_PORT(for e.g: 443 is SSL is enabled) on which the application will be listening 
    6. CERT_PATH - SSL certificate location if SSL is enabled 
    7. Give a valid host name for Kafka PLAINTEXT_HOST://localhost:${KAFKA_EXTERNAL_PORT} in docker-compose.yml. For development servers, localhost should work
    8. AUTHSERVICE_TOMBOLO_APP_ID - Unique id of Tombolo app in Auth Service. This will be used in the communication between Tombolo and AuthService
4. Rename server/.env.sample to .env
5. Update the following information in server/.env file    
    1.  DB_USERNAME
    2.  DB_PASSWORD
    3.  secret - Same secret used above     
6. docker-compose up -d
7. Application should be accessible under http://<<host_name>>:<WEB_EXPOSED_PORT> once the build is completed.

### Development Setup:
1. Clone Git Repo
2. Setup a MySQL database and create a schema named 'tombolo'
3. Rename .env.sample to .env
4. Update the following information in .env
    1.  DB_USERNAME
    2.  DB_PASSWORD
    3.  DB_HOSTNAME - Update as required
    3.  secret - Use the alpha numeric value from https://www.grc.com/passwords.htm for this secret.
    4. AUTH_SERVICE_URL - Tombolo uses Auth Service for user authentication. An existing Auth Service can used or Auth Service can be setup seperatly for this. Please refer to Auth Service repo for details on setting it up. 
5. Rename server/.env.sample to .env
6. Update the following information in server/.env file    
    1.  DB_USERNAME
    2.  DB_PASSWORD
    3.  secret - Same secret used above     
7. Install npm packages under /client-reactjs and /server directories    
8. Database Tables - Change to server directoy and run 'npx sequelize-cli db:migrate'. This will create the database tables required for Tombolo
9. Database seed entries - Under server directory, run 'npx sequelize-cli db:seed:all' to create seed entries required for the application
8. Change to /server directory and start the NodeJS process using 'nodemon server.js' (nodemon has to be setup prior to this step)
9. Change to /client-reactjs directory and start the application using 'npm start' command
10. The application should be listening at port 3001

### Documentation:

[Link](docs/README.md)
