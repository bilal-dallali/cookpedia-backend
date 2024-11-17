import express from "express";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import cryptoRandomString from "crypto-random-string";
import jwt from 'jsonwebtoken';
import db from "../config/db.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const app = express.Router();
const saltRounds = 10;

// Create __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../uploads/profile-pictures");
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const { profilePictureUrl } = req.body;
    cb(null, `${profilePictureUrl}.jpg` || `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

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

const SECRET_KEY = process.env.JWT_SECRET || "your-secret-key";

// User registration route
app.post("/users", upload.single("profilePicture"), express.json(), (req, res) => {
  const {
      username,
      email,
      password,
      rememberMe,
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
      profilePictureUrl
  } = req.body;
  console.log(req.body);
  // Validation des champs obligatoires
  if (!username || !email || !password) {
      return res.status(400).send({ error: "Username, email, and password are required" });
  }

  // Hachage du mot de passe
  bcrypt.hash(password, saltRounds, (hashErr, hashedPassword) => {
      if (hashErr) {
          return res.status(500).send({ error: "Error hashing password" });
      }

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
          profilePictureUrl || null
      ];

      // Insérer l'utilisateur dans la base de données
      db.query(
          `INSERT INTO users (
              username, 
              email, 
              password, 
              country, 
              cooking_level, 
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
              full_name, 
              phone_number, 
              gender, 
              date_of_birth, 
              city, 
              profile_picture_url
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          userData,
          (err, result) => {
              if (err) {
                  console.log("Error creating user:", err);
                  if (err.code === "ER_DUP_ENTRY") {
                      if (err.message.includes("email")) {
                          console.log("Email already exists")
                          return res.status(400).send({ error: "Email already exists" });
                      }
                      if (err.message.includes("username")) {
                          console.log("Username already exists")
                          return res.status(400).send({ error: "Username already exists" });
                      }
                      if (err.message.includes("phone_number")) {
                          console.log("Phone number already exists")
                          return res.status(400).send({ error: "Phone number already exists" });
                      }
                  }
                  return res.status(500).send({ error: "Error creating user" });
                  console.log("Error creating user")
              }

              const userId = result.insertId;

              // Définir la durée d'expiration du token
              const expiresIn = rememberMe === "true" ? "7d" : "1h";
              const tokenExpirationDate = rememberMe === "true"
                  ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                  : new Date(Date.now() + 60 * 60 * 1000);

              // Générer le token JWT
              const token = jwt.sign({ id: userId, email }, SECRET_KEY, { expiresIn });

              // Stocker le token dans la table sessions
              db.query(
                  `INSERT INTO sessions (user_id, auth_token, expires_at) VALUES (?, ?, ?)`,
                  [userId, token, tokenExpirationDate],
                  (sessionErr) => {
                      if (sessionErr) {
                          return res.status(500).send({ error: "Error creating session" });
                          console.log("error creating session")
                      }

                      // Répondre avec le token généré
                      res.status(201).send({
                          message: "User created successfully",
                          token,
                      });
                      console.log("User created successfully and session stored on token:", token)
                  }
              );
          }
      );
  });
});

// Route to login
app.post("/login", (req, res) => {
  const { email, password, rememberMe } = req.body;
  console.log(req.body);
  // Verify if the user exists
  db.query("SELECT * FROM users WHERE email = ?", [email], (err, result) => {
      if (err) {
          console.error("Server error:", err);
          return res.status(500).send({ error: "Server error" });
      }
      
      if (result.length === 0) {
          return res.status(404).send({ error: "User not found" });
      }

      const user = result[0];
      
      // Check the password
      bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) {
              console.error("Server error:", err);
              return res.status(500).send({ error: "Server error" });
          }

          if (!isMatch) {
              return res.status(401).send({ error: "Incorrect password" });
          }

          // Set token expiration based on rememberMe
          const expiresIn = rememberMe ? '7d' : '1h';
          const tokenExpirationDate = rememberMe ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : new Date(Date.now() + 60 * 60 * 1000);
          
          // Generate JWT
          const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn });
          console.log("Token generated:", token);

          // Store the token in the sessions table
          db.query(
              "INSERT INTO sessions (user_id, auth_token, expires_at) VALUES (?, ?, ?)",
              [user.id, token, tokenExpirationDate],
              (err, result) => {
                  if (err) {
                      console.error("Error saving session:", err);
                      return res.status(500).send({ error: "Error creating session" });
                  }

                  // Send the token to the client
                  res.status(200).send({ message: "Login successful", token });
              }
          );
      });
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
  const userId = req.user.id;
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

      res.status(200).json(results[0]);
  });
});

export default app;
