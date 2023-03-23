const express = require("express")
require("dotenv").config("/.env")
const db = require("./config/db")
const app = express()
const port = 4000

app.use(express.json())

db.connect((err) => {
    if (err) {
        console.error('ERROR NOT CONNECTED WITH DATABASE', err);
    } else {
        console.log('CONNECTED TO THE DATABASE');
    }
});


app.listen(port, () => console.log("serveur lancé sur le port " + port));