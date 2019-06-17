# Tombolo - Data Catalog tool for HPCC

Installation: 

1. Clone Git repo
2. Update MySQL passwords in .env file under the root folder and under /server
3. Update the secret in the .env files - this is used by bcrypt for password hashes
4. Give a valid host name for Kafka PLAINTEXT_HOST://localhost:${KAFKA_EXTERNAL_PORT} in docker-compose.yml. For development servers, localhost should work
5. docker-compose up -d

To:Do's

* [x]  Replace application guid's in breadcrumb with application names 
* [x]  Expire user login token
* [ ]  Continuos Integration and Deployment
* [ ]  Ability to Delete a file from the tree
* [ ]  Integrate with IoT Admin User Authenitcation schema
* [ ]  File Validation tab - Change PII/SPII to a drop down (Personal Identification Number, Credit Card, etc) 
* [ ]  Run rules against Data profile
* [ ]  Include file path in Tombolo JSON schema export to be consumed by ECL Cloud IDE
* [ ]  Add the ability to import Tombolo file definition to Cloud IDE and show Licensing, permissible purposes etc
* [ ]  Direct linking to a file definition by its unqiue ID

