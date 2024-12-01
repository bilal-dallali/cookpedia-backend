import express from "express";
import db from "./config/db.js";
import usersRoute from "./routes/users.js";
import recipesRoute from "./routes/recipes.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json())

db.connect((err) => {
    if (err) {
        console.error("ERROR NOT CONNECTED WITH DATABASE", err);
    } else {
        console.log("CONNECTED TO THE DATABASE");
    }
});

//const usersRoute = require("./routes/users.js")
app.use("/api/users", usersRoute)
app.use("/api/recipes", recipesRoute)

app.listen(port, () => console.log("serveur lancé sur le port " + port));