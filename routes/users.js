import express from "express";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import cryptoRandomString from "crypto-random-string";
import db from "../config/db.js";

const app = express.Router();
const saltRounds = 10;

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

  // Check if all required fields are present
  if (!username || !email || !password) {
    res.status(400).send({ error: "Username, email, and password are required" });
    return;
  }

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
    ];
    
    db.query(
      "INSERT INTO users (username, email, password, country, cooking_level, salad, egg, soup, meat, chicken, seafood, burger, pizza, sushi, rice, bread, fruit, vegetarian, vegan, gluten_free, nut_free, dairy_free, low_carb, peanut_free, keto, soy_free, raw_food, low_fat, halal, full_name, phone_number, gender, date_of_birth, city, profile_picture_url) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);",
      userData,
      (err, result) => {
        if (err) {
          console.log("Error storing user data: ", err);
          if (err.code === "ER_DUP_ENTRY") {
            if (err.message.includes("email")) {
              console.log("Error storing user data: Email already exists");
              res.status(400).send({ error: "Email already exists" });
            } else if (err.message.includes("username")) {
              console.log("Error storing user data: Username already exists");
              res.status(400).send({ error: "Username already exists" });
            } else if (err.message.includes("phone_number")) {
              console.log(
                "Error storing user data: Phone number already exists"
              );
              res.status(400).send({ error: "Phone number already exists" });
            }
          } else {
            res.status(500).send({ error: "Server error" });
          }
          console.log("Error storing user data: ", err);
          res
            .status(500)
            .send({ error: "Server error I don't have the high ground" });
          return;
        }
        console.log("User data stored", req.body);
        res.status(201).send({ message: "User created" });
      }
    );
  });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // Vérifier si l'utilisateur existe avec l'email fourni
  db.query("SELECT * FROM users WHERE email = ?;", [email], (err, result) => {
    if (err) {
      console.log("Erreur serveur:", err);
      res.status(500).send({ error: "Erreur serveur" });
      return;
    }
    if (result.length > 0) {
      const user = result[0];
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
          console.log("Erreur serveur:", err);
          res.status(500).send({ error: "Erreur serveur" });
          return;
        }
        if (isMatch) {
          console.log("Connexion réussie pour l'utilisateur:", user.email);
          res.status(200).send({ message: "Connexion réussie" });
        } else {
          console.log("Mot de passe incorrect pour l'utilisateur:", user.email);
          res.status(401).send({ error: "Mot de passe incorrect" });
        }
      });
    } else {
      console.log("Utilisateur non trouvé avec l'email:", email);
      res.status(404).send({ error: "Utilisateur non trouvé" });
    }
  });
});

// Route pour envoyer un code de réinitialisation de mot de passe
app.post("/send-reset-code", (req, res) => {
  const { email } = req.body;

  // Vérifiez si l'utilisateur existe
  db.query("SELECT * FROM users WHERE email = ?;", [email], (err, result) => {
    if (err) {
      console.log("Erreur serveur:", err);
      res.status(500).send({ error: "Erreur serveur" });
      return;
    }
    if (result.length === 0) {
      res.status(404).send({ error: "Utilisateur non trouvé" });
      return;
    }

    // Génération d'un code de réinitialisation à 4 chiffres
    const resetCode = cryptoRandomString({ length: 4, type: "numeric" });

    // Configurer le transporteur d'e-mail
    const transporter = nodemailer.createTransport({
      service: "gmail", // Vous pouvez utiliser d'autres services comme Outlook
      auth: {
        user: process.env.EMAIL_USER, // Définir dans votre fichier .env
        pass: process.env.EMAIL_PASS  // Utilisez un mot de passe d'application sécurisé
      }
    });

    // Configurer le contenu de l'e-mail
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Code de réinitialisation de mot de passe",
      text: `Votre code de réinitialisation est : ${resetCode}`
    };

    // Envoyer l'e-mail
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Erreur lors de l'envoi de l'e-mail :", error);
        res.status(500).send({ error: "Erreur d'envoi de l'e-mail" });
      } else {
        console.log("E-mail envoyé avec succès :", info.response);
        
        // Stockez le code de réinitialisation (ici temporairement en mémoire pour la démonstration)
        db.query("UPDATE users SET reset_code = ? WHERE email = ?", [resetCode, email], (err, result) => {
          if (err) {
            console.log("Erreur de mise à jour du code de réinitialisation :", err);
            res.status(500).send({ error: "Erreur serveur" });
          } else {
            res.status(200).send({ message: "Code de réinitialisation envoyé" });
          }
        });
      }
    });
  });
});

export default app;
