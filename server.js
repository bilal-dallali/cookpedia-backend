const express = require("express");
const db = require("./config/db.js");
const usersRoute = require("./routes/users.js");
const recipesRoute = require("./routes/recipes.js");
const commentsRoute = require("./routes/comments.js");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json())

db.getConnection((err, connection) => {
    if (err) {
        console.error("ERROR NOT CONNECTED WITH DATABASE:", err);
        process.exit(1);
    } else {
        console.log("CONNECTED TO THE DATABASE");
        connection.release();
    }
});

//db.getConnection((err, connection) => {
//    if (err) {
//        console.error("Database connection error:", err.code);
//        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
//            console.error("Database connection was closed.");
//        } else if (err.code === 'ER_CON_COUNT_ERROR') {
//            console.error("Database has too many connections.");
//        } else if (err.code === 'ECONNREFUSED') {
//            console.error("Database connection was refused.");
//        }
//    }
//
//    if (connection) connection.release();
//    return;
//});

app.use("/api/users", usersRoute)
app.use("/api/recipes", recipesRoute)
app.use("/api/comments", commentsRoute)

app.listen(port, () => console.log("serveur lancé sur le port " + port));