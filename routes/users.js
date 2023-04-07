const express = require("express");
const app = express.Router();
const bcrypt = require("bcrypt");
const saltRounds = 10
const db = require("../config/db");

app.post("/users", (req, res) => {
  const { username, email, password, full_name, phone_number, gender, date_of_birth, profile_picture_url, country, city, salad, egg, soup, meat, chicken, seafood, burger, pizza, sushi, rice, bread, fruit, vegetarian, vegan, gluten_free, nut_free, dairy_free, low_carb, peanut_free, keto, soy_free, raw_food, low_fat, halal, cooking_level } = req.body;

  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
      console.log(err, "Something went wrong");
    } else {
      console.log("successfully registered");
      console.log(req.body)
    }
    db.query(
      "INSERT INTO users (username, email, password, full_name, phone_number, gender, date_of_birth, profile_picture_url, city, country, salad, egg, soup, meat, chicken, seafood, burger, pizza, sushi, rice, bread, fruit, vegetarian, vegan, gluten_free, nut_free, dairy_free, low_carb, peanut_free, keto, soy_free, raw_food, low_fat, halal, cooking_level) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);",
      [
        username,
        email,
        hash,
        full_name,
        phone_number,
        gender,
        date_of_birth,
        profile_picture_url,
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
        gluten_free,
        nut_free,
        dairy_free,
        low_carb,
        peanut_free,
        keto,
        soy_free,
        raw_food,
        low_fat,
        halal,
        cooking_level,
      ],
      (err, result) => {
        if (err) {
          res.status(403).json(err);
        } else {
          res.status(200).json(result);
        }
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
