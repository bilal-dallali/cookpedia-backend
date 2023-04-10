const express = require("express");
const app = express.Router();
const bcrypt = require("bcrypt");
const saltRounds = 10;
const db = require("../config/db");


app.post("/users", (req, res) => {
  const {
    username,
    email,
    password,
    country,
    level,
    salad,
    egg,
    soup,
    meat,
    chicken,
    seafood,
    burger,
    pizza,
    sushi,
    rice,
    bread,
    fruit,
    vegetarian,
    vegan,
    glutenFree,
    nutFree,
    dairyFree,
    lowCarb,
    peanutFree,
    keto,
    soyFree,
    rawFood,
    lowFat,
    halal,
    fullName,
    phoneNumber,
    gender,
    date,
    city,
    profilePictureUrl,
  } = req.body;

  // Hash the password
  bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
    if (hashErr) {
      console.log("Error hashing password: ", hashErr);
      res.status(500).send({ error: "Server error" });
      return;
    }
    // Store user data in database
    const userData = [
      username,
      email,
      hashedPassword,
      fullName,
      phoneNumber,
      gender,
      date,
      profilePictureUrl,
      country,
      city,
      salad,
      egg,
      soup,
      meat,
      chicken,
      seafood,
      burger,
      pizza,
      sushi,
      rice,
      bread,
      fruit,
      vegetarian,
      vegan,
      glutenFree,
      nutFree,
      dairyFree,
      lowCarb,
      peanutFree,
      keto,
      soyFree,
      rawFood,
      lowFat,
      halal,
      level,
    ];
    db.query(
      "INSERT INTO users (username, email, password, full_name, phone_number, gender, date_of_birth, profile_picture_url, city) VALUES (?,?,?,?,?,?,?,?,?);",
      userData,
      (err, result) => {
        if (err) {
          console.log("voici ton erreur", err)
          if (err.code === "ER_DUP_ENTRY") {
            if (err.message.includes("email")) {
              console.log("Error storing user data: Email already exists");
              res.status(400).send({ error: "Email already exists" });
              return;
            } else if (err.message.includes("username")) {
              console.log("Error storing user data: Username already exists");
              res.status(400).send({ error: "Username already exists" });
              return;
            } else if (err.message.includes("phone_number")) {
              console.log("Error storing user data: Phone number already exists");
              res.status(400).send({ error: "Phone number already exists" });
              return;
            }
          }
          console.log("Error storing user data: ", err);
          res.status(500).send({ error: "Server error I don't have the high ground" });
          return;
        }
        console.log("User data stored", req.body);
        res.status(201).send({ message: "User created" });
      }
    );
  });
});


app.get("/users", (req, res) => {
  db.query("SELECT * FROM users;", (err, result) => {
    if (err) {
      res.status(500).json(err);
    } else {
      res.status(200).json(result);
    }
  });
});

module.exports = app;