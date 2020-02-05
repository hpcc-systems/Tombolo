# Tombolo - A Data Catalog Tool for HPCC Systems

![](/docs/images/tombolo/Slide1.png)

### Installation:

1. Clone Git repo
2. Update the following information in .env
    1.  DB_USERNAME
    2.  DB_PASSWORD
    3.  secret - Use the alpha numeric value from https://www.grc.com/passwords.htm for this secret.

3. Update the following information in server/.env file
    1.  APP_ADMIN_PASSWORD - This is the password used for the admin account for the application
    2.  DB_USERNAME
    3.  DB_PASSWORD
    4.  secret - Same secret used above
4. Give a valid host name for Kafka PLAINTEXT_HOST://localhost:${KAFKA_EXTERNAL_PORT} in docker-compose.yml. For development servers, localhost should work
5. docker-compose up -d
6. Application should be accessible under http://<<host_name>>:3001 once the build is completed.

### Documentation:

[Link](docs/README.md)
