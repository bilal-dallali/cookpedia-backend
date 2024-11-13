import express from "express";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import cryptoRandomString from "crypto-random-string";
import jwt from 'jsonwebtoken';
import db from "../config/db.js";

const app = express.Router();
const saltRounds = 10;

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
          return res.status(403).json({ error: 'Invalid or expired token.' });
      }
      req.user = user;
      next();
  });
}

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

const SECRET_KEY = process.env.JWT_SECRET || "your-secret-key";

// Route to login
app.post("/login", (req, res) => {
  const { email, password, rememberMe } = req.body;
  console.log(req.body);
  // Vérifier si l'utilisateur existe avec cet email
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
          
          // Durée de validité du token basée sur "rememberMe"
          const expiresIn = rememberMe ? '7d' : '1h'; // 7 jours si
          console.log("expiresIn:", expiresIn);
          const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn });
          console.log("Token généré:", token);

          res.status(200).send({ 
            message: "Connexion réussie", 
            token: token // Envoie du token au client
          });
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

  // Check if the user exists
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

    // Generate a 4-digit reset code
    const resetCode = cryptoRandomString({ length: 4, type: "numeric" });
    const codeGeneratedAt = new Date(); // Current timestamp

    // Configure the email transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Configure the email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Code de réinitialisation de mot de passe",
      text: `Votre code de réinitialisation est : ${resetCode}`
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Erreur lors de l'envoi de l'e-mail :", error);
        res.status(500).send({ error: "Erreur d'envoi de l'e-mail" });
      } else {
        console.log("E-mail envoyé avec succès :", info.response);

        // Store the reset code and timestamp in the database
        db.query(
          "UPDATE users SET reset_code = ?, code_generated_at = ? WHERE email = ?",
          [resetCode, codeGeneratedAt, email],
          (err, result) => {
            if (err) {
              console.log("Erreur de mise à jour du code de réinitialisation :", err);
              res.status(500).send({ error: "Erreur serveur" });
            } else {
              res.status(200).send({ message: "Code de réinitialisation envoyé" });
            }
          }
        );
      }
    });
  });
});

// Route to verify reset code
app.post("/verify-reset-code", (req, res) => {
  const { email, code } = req.body;

  // Query the user based on email and check the reset code
  db.query("SELECT * FROM users WHERE email = ? AND reset_code = ?", [email, code], (err, result) => {
      if (err) {
          console.log("Server error:", err);
          res.status(500).send({ error: "Erreur serveur" });
          return;
      }

      // Check if the reset code matches
      if (result.length > 0) {
          // Code is correct; user can proceed to reset password
          res.status(200).send({ success: true, message: "Code vérifié avec succès" });
          console.log("Code vérifié avec succès")
      } else {
          // Incorrect code or user not found
          res.status(400).send({ success: false, message: "Code incorrect ou utilisateur non trouvé" });
          console.log("Code incorrect ou utilisateur non trouvé")
      }
  });
});

// Route to reset password if the reset code is verified
app.post("/reset-password", async (req, res) => {
  const { email, newPassword, resetCode } = req.body;
  // Verify that the reset code and email are correct
  db.query("SELECT * FROM users WHERE email = ? AND reset_code = ?", [email, resetCode], async (err, result) => {
      if (err) {
          console.log("Database error:", err);
          return res.status(500).json({ error: "Erreur serveur" });
      }

      if (result.length === 0) {
          // No user found or incorrect reset code
          return res.status(400).json({ error: "Code de réinitialisation invalide ou utilisateur non trouvé" });
          console.log("Code de réinitialisation invalide ou utilisateur non trouvé")
      }

      try {
          // Hash the new password
          const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
          // Update the user's password and clear the reset code
          db.query("UPDATE users SET password = ?, reset_code = NULL WHERE email = ?", [hashedPassword, email], (err) => {
              if (err) {
                  console.log("Error updating password:", err);
                  return res.status(500).json({ error: "Erreur serveur lors de la mise à jour du mot de passe" });
              }

              res.status(200).json({ message: "Mot de passe réinitialisé avec succès" });
              console.log("mot de passe réinitialisé")
          });
      } catch (error) {
          console.log("Error hashing password:", error);
          res.status(500).json({ error: "Erreur lors du traitement de la demande" });
      }
  });
});

// Fetch the user's profile
app.get('/user/profile', authenticateToken, (req, res) => {
  const userId = req.user.id; // Extracted from token
  console.log("User ID:", userId);
  const query = `
      SELECT id, username, email, full_name AS fullName, profile_picture_url AS profilePictureUrl 
      FROM users 
      WHERE id = ?`;

  db.query(query, [userId], (error, results) => {
    console.log("Results:", results);
      if (error) {
          console.error("Database error:", error);
          return res.status(500).json({ error: "Server error." });
      }

      if (results.length === 0) {
          return res.status(404).json({ error: "User not found." });
      }

      res.status(200).json(results[0]); // Return user profile data
  });
});

export default app;
