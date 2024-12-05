//import express from "express";
//import db from "./config/db.js";
//import usersRoute from "./routes/users.js";
//import recipesRoute from "./routes/recipes.js";
const express = require("express");
const db = require("./config/db.js");
const usersRoute = require("./routes/users.js");
const recipesRoute = require("./routes/recipes.js");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json())

//db.connect((err) => {
//    if (err) {
//        console.error("ERROR NOT CONNECTED WITH DATABASE", err);
//    } else {
//        console.log("CONNECTED TO THE DATABASE");
//    }
//});

// Fonction équivalente à `db.connect`

db.getConnection((err, connection) => {
    if (err) {
        console.error("ERROR NOT CONNECTED WITH DATABASE:", err);
        process.exit(1); // Arrête le serveur en cas d'échec
    } else {
        console.log("CONNECTED TO THE DATABASE");
        connection.release(); // Libère la connexion après vérification
    }
});


// Vérifier la connexion au démarrage
//checkDatabaseConnection();

// Fonction pour simuler db.connect
//function checkDatabaseConnection() {
//    return new Promise((resolve, reject) => {
//        db.getConnection((err, connection) => {
//            if (err) {
//                reject(err); // Erreur lors de la récupération d'une connexion
//            } else {
//                console.log("CONNECTED TO THE DATABASE");
//                connection.release(); // Libère la connexion
//                resolve();
//            }
//        });
//    });
//}

// Vérification de la connexion à la base de données au démarrage
//checkDatabaseConnection()
//    .then(() => {
//        // Lancer le serveur uniquement si la connexion réussit
//        app.listen(port, () => {
//            console.log(`Serveur lancé sur le port ${port}`);
//        });
//    })
//    .catch((err) => {
//        console.error("ERROR NOT CONNECTED WITH DATABASE:", err);
//        process.exit(1); // Arrêter le processus en cas d'échec
//    });

//const usersRoute = require("./routes/users.js")
app.use("/api/users", usersRoute)
app.use("/api/recipes", recipesRoute)

app.listen(port, () => console.log("serveur lancé sur le port " + port));