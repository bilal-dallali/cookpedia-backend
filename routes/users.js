const express = require("express");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const jwt = require('jsonwebtoken');
const db = require("../config/db.js");
const multer = require("multer");
const path = require('path');
const fs = require('fs');

const app = express.Router();
const saltRounds = 10;

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadPath = "./uploads/profile-pictures";
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
app.post("/registration", upload.single("profilePicture"), express.json(), (req, res) => {
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
    // Check if the required fields are provided
    if (!username || !email || !password) {
        return res.status(400).send({ error: "Username, email, and password are required" });
    }

    // Create slug from username
    const slugify = (username) => {
        let slug = username.toLowerCase();
        slug = slug.replace(/\s+./g, "-");
        slug = slug.replace(/[^\w\-]/g, '');
        return slug;
    }

    // Hash the password
    bcrypt.hash(password, saltRounds, (hashErr, hashedPassword) => {
        if (hashErr) {
            return res.status(500).send({ error: "Error hashing password" });
        }
        const slug = slugify(username);
        const userData = [
            username,
            slug,
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

        // Insert the user into the database
        db.query(
            `INSERT INTO users (
              username,
              slug, 
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
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
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
                }

                const userId = result.insertId;
                console.log("User ID:", userId);
                // Define token expiration based on rememberMe
                const expiresIn = rememberMe === "true" ? "7d" : "1h";
                const tokenExpirationDate = rememberMe === "true"
                    ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    : new Date(Date.now() + 60 * 60 * 1000);

                // Generate JWT
                const token = jwt.sign({ id: userId, email }, SECRET_KEY, { expiresIn });

                // Store the token in the sessions table
                db.query(
                    `INSERT INTO sessions (user_id, auth_token, expires_at) VALUES (?, ?, ?)`,
                    [userId, token, tokenExpirationDate],
                    (sessionErr) => {
                        if (sessionErr) {
                            return res.status(500).send({ error: "Error creating session" });
                        }

                        // Send the token to the client
                        res.status(201).send({
                            message: "User created successfully",
                            token,
                            userId
                        });
                        console.log("User created successfully and session stored on token:", token, userId)
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
        const id = user.id;
        console.log("User found:", user);
        console.log("User ID:", id);

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
                    res.status(200).send({ message: "Login successful", token, id });
                }
            );
        });
    });
});

// Route to send a password reset code
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

        function generateFourDigitCode() {
            return Math.floor(1000 + Math.random() * 9000);
        }

        // Generate a 4-digit reset code
        const resetCode = generateFourDigitCode();
        const codeGeneratedAt = new Date();

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
    const { email, newPassword, resetCode, rememberMe } = req.body;

    // CHECK IF THE RESET CODE AND EMAIL ARE CORRECT
    db.query("SELECT * FROM users WHERE email = ? AND reset_code = ?", [email, resetCode], async (err, result) => {
        if (err) {
            console.log("Database error:", err);
            return res.status(500).json({ error: "Erreur serveur" });
        }

        if (result.length === 0) {
            // No user found or incorrect code
            return res.status(400).json({ error: "Code de réinitialisation invalide ou utilisateur non trouvé" });
        }

        const user = result[0];
        const id = user.id;

        try {
            // Hash the new password
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

            // Update the user's password and remove the reset_code
            db.query("UPDATE users SET password = ?, reset_code = NULL WHERE email = ?", [hashedPassword, email], (err) => {
                if (err) {
                    console.log("Error updating password:", err);
                    return res.status(500).json({ error: "Erreur serveur lors de la mise à jour du mot de passe" });
                }

                // Generate a JWT token
                const expiresIn = rememberMe ? "7d" : "1h";
                const tokenExpirationDate = rememberMe
                    ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    : new Date(Date.now() + 60 * 60 * 1000);

                const token = jwt.sign(
                    { id: user.id, email: user.email },
                    SECRET_KEY,
                    { expiresIn }
                );

                // Insert the token in the sessions table
                db.query("INSERT INTO sessions (user_id, auth_token, expires_at) VALUES (?, ?, ?)", [user.id, token, tokenExpirationDate], (sessionErr) => {
                    if (sessionErr) {
                        console.log("Error creating session:", sessionErr);
                        return res.status(500).json({ error: "Erreur serveur lors de la création de la session" });
                    }

                    // Send the token to the client
                    res.status(200).json({
                        message: "Mot de passe réinitialisé avec succès",
                        token,
                        id
                    });
                    console.log("Mot de passe réinitialisé avec succès et session créée.", token, id);
                }
                );
            }
            );
        } catch (error) {
            console.log("Error hashing password:", error);
            res.status(500).json({ error: "Erreur lors du traitement de la demande" });
        }
    }
    );
});

// Fetch the user's profile unused
app.get('/user/profileunused', authenticateToken, (req, res) => {
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

// Unused route
app.get("/getUsersData", (req, res) => {
    db.query("SELECT * FROM users", (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: `Server error ${err}` });
        }
        res.status(200).json(result);
    });
});


// Unused route
app.get("/datas", (req, res) => {
    res.status(200).json({ message: "Data fetched successfully" });
})

// Route pour récupérer une image unused
app.get('/profile-picture/:imageName', (req, res) => {
    const imageName = req.params.imageName;
    const imagePath = path.join(__dirname, '../uploads/profile-pictures', imageName);

    // Vérifier si le fichier existe
    if (fs.existsSync(imagePath)) {
        res.sendFile(imagePath);
    } else {
        res.status(404).send('Image non trouvée');
    }
});

const baseUrl = process.env.BASE_URL

// Fetch User data by ID
app.get("/profile/:id", (req, res) => {
    const userId = req.params.id;
    console.log("User ID:", userId);

    if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
    }

    db.query("SELECT * FROM users WHERE id = ?", [userId], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Server error" });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const user = result[0];
        console.log("User:", user);

        res.status(200).json(result[0]);
    });
});

module.exports = app;
