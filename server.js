const express = require("express");
const db = require("./config/db.js");
const usersRoute = require("./routes/users.js");
const recipesRoute = require("./routes/recipes.js");

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

app.use("/api/users", usersRoute)
app.use("/api/recipes", recipesRoute)

app.listen(port, () => console.log("serveur lancé sur le port " + port));