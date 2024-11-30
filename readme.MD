# This is the API for the application Cookpedia

- To use it you need first to install Node JS ans MySQL if you don't have it
- Once installed go to the file with your terminal and use the command 'npm install' to install all the dependencies
- Then add a .env file with those infos in it :
    - Those infos to link the server with your database
        * DB_HOST=your host name
        * DB_USER=your database user
        * DB_PASSWORD=your password user
        * DB_NAME=the name of your database
    - Those info are the email address you'll use to send reset password emails to the user, you cannot use your regular password, you need to generate an app password through your email parameters
        * EMAIL_USER=your email
        * EMAIL_PASS=your email password
    - This info is a JWT key to generate a web token
        * JWT_SECRET=your JWT key
- Create the database with the right commands, use the database.sql file in the folder sql_files, it contains all the command necessary to create the database
- Once all of that is done you can start the server with the command 'npm run start' to start the server

# You can find the mobile app which work with this API at this repository 'https://github.com/bilal-dallali/Cookpedia'