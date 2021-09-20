# Tombolo - A Data Curation Tool for HPCC Systems
![](/docs/images/tombolo/Slide1.png)
## Installation Guide
#### Local Environment 
1. Clone the repository
2. Go inside the '/server' directory and rename the '.env-sample' file to '.env'.
3. Next, you will need to set up a database. Create a mysql database and name it 'tombolo'.
4. Open '.env' file that is located on the '/server' directory and  update the following information
      1. DB_USERNAME
      2. DB_PASSWORD
5. Tombolo uses Auth Service for user authentication. An existing Auth Service can be used or you may set up Auth Service separately. 
    You can find the Authservice setup instructions [here](https://github.com/hpcc-systems/Auth-Service). Once you have an instance of Authservice up and running, 
    update the following information on the '.env' file located on the '/server' directory.
    1. AUTH_SERVICE_URL
    2. AUTHSERVICE_TOMBOLO_CLIENT_ID
6. On the same '.env file',  fill in the value for 'secret'. You can generate a strong and unique string [here](https://www.grc.com/passwords.htm)
7. Install dependencies.
    1. Inside '/server' run *'npm install'*
    2. Inside '/client-reactjs' run *'npm install'*
8. Now, under '/server' directory, run *'npx sequelize-cli db:migrate'*. This will create all the necessary tables on the database.
9. Once the database tables are created, you will be able to seed the table with the required data. While still under server folder run *'npx sequelize-cli db:seed:all'*.
10. Tombolo is now ready for lunch on your local machine. Run *'nodemon /server.js'* to spin up the server. Make sure you are still inside the server directory when you run this command.
11. Finally, on a separate terminal go to '/client-reactjs' directory and run *'npm start'*. This should open the client on your default browser. If a browser does not open, manually open it and go to 'localhost:3001'

----
#### Production Environment 

