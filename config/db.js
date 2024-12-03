//import mysql from "mysql2";
//import dotenv from "dotenv";
const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    //uri: process.env.DB_URI,
    //port: process.env.DB_PORT
});

module.exports = db;
