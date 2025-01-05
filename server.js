const express = require("express");
const db = require("./config/db.js");
const usersRoute = require("./routes/users.js");
const recipesRoute = require("./routes/recipes.js");
const commentsRoute = require("./routes/comments.js");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json())
app.use(express.urlencoded({ extended: true }));

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
app.use("/api/comments", commentsRoute)

app.get("/", (req, res) => {
    res.send("Hello World");
});

app.listen(port, () => console.log("serveur lancé sur le port " + port));