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
4. Rename server/.env.sample to .env
5. Update the following information in server/.env file    
    1.  DB_USERNAME
    2.  DB_PASSWORD
    3.  secret - Same secret used above     
6. docker-compose up -d
7. Application should be accessible under http://<<host_name>>:<WEB_EXPOSED_PORT> once the build is completed.

### Development Setup:
1. Clone Git Repo
2. Rename .env.sample to .env
3. Update the following information in .env
    1.  DB_USERNAME
    2.  DB_PASSWORD
    3.  secret - Use the alpha numeric value from https://www.grc.com/passwords.htm for this secret.
    4. AUTH_SERVICE_URL - Tombolo uses Auth Service for user authentication. An existing Auth Service can used or Auth Service can be setup seperatly for this. Please refer to Auth Service repo for details on setting it up. 
4. Rename server/.env.sample to .env
5. Update the following information in server/.env file    
    1.  DB_USERNAME
    2.  DB_PASSWORD
    3.  secret - Same secret used above     
6. Install npm packages under /client-reactjs and /server directories    
6. Change to /server directory and start the NodeJS process using nodemon server.js
7. Change to /client-reactjs directory and start the application using npm start command
8. The application should be listening at port 3001

### Documentation:

[Link](docs/README.md)
