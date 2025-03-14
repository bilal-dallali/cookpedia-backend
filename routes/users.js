const express = require("express");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const db = require("../config/db.js");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp")

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

// Filtrer uniquement les images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Seules les images sont autorisées'), false);
    }
};

const upload = multer({ 
    storage, 
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024
    }
});

// Middleware pour optimiser l'image après upload
async function optimizeImage(req, res, next) {
    if (!req.file) return next();
    
    try {
        const originalPath = req.file.path;
        const optimizedFilename = `optimized-${path.basename(originalPath)}`;
        const optimizedPath = path.join(path.dirname(originalPath), optimizedFilename);
        
        // Optimiser l'image avec sharp
        await sharp(originalPath)
            .resize(800)
            .jpeg({ quality: 80, progressive: true })
            .toFile(optimizedPath);
            
        // Remplacer le fichier original
        fs.unlinkSync(originalPath);
        fs.renameSync(optimizedPath, originalPath);
        
        next();
    } catch (error) {
        next(error);
    }
}

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
app.post("/registration", upload.single("profilePicture"), optimizeImage, express.json(), async (req, res) => {
    try {
        const {
            username,
            email,
            password,
            rememberMe,
            country,
            level,
            fullName,
            phoneNumber,
            gender,
            date,
            city,
            profilePictureUrl
        } = req.body;

        // Check if required fields are missing
        if (!username || !email || !password) {
            return res.status(400).send({ error: "Username, email, and password are required" });
        }

        // Create a slug from the username
        const slugify = (username) => {
            let slug = username.toLowerCase();
            slug = slug.replace(/\s+/g, "-");
            return slug;
        }

        // Hash the password asynchronously
        const hashedPassword = await new Promise((resolve, reject) => {
            bcrypt.hash(password, saltRounds, (err, hash) => {
                if (err) reject(err);
                resolve(hash);
            });
        });

        const slug = slugify(username);
        const userData = [
            username,
            slug,
            email,
            hashedPassword,
            country,
            level,
            fullName,
            phoneNumber,
            gender,
            date,
            city,
            profilePictureUrl || null
        ];

        // Insert user into the database
        const result = await new Promise((resolve, reject) => {
            db.query(
                `INSERT INTO users (
                    username,
                    slug, 
                    email, 
                    password, 
                    country, 
                    cooking_level, 
                    full_name, 
                    phone_number, 
                    gender, 
                    date_of_birth, 
                    city, 
                    profile_picture_url
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
                userData,
                (err, result) => {
                    if (err) {
                        if (err.code === "ER_DUP_ENTRY") {
                            if (err.message.includes("email")) {
                                reject({ status: 400, message: "Email already exists" });
                            }
                            if (err.message.includes("username")) {
                                reject({ status: 400, message: "Username already exists" });
                            }
                            if (err.message.includes("phone_number")) {
                                reject({ status: 400, message: "Phone number already exists" });
                            }
                        }
                        reject({ status: 500, message: "Error creating user" });
                    }
                    resolve(result);
                }
            );
        });

        const userId = result.insertId;

        // Configure token expiration based on rememberMe
        const expiresIn = rememberMe === "true" ? "7d" : "1h";
        const tokenExpirationDate = rememberMe === "true"
            ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            : new Date(Date.now() + 60 * 60 * 1000);

        // Generate JWT
        const token = jwt.sign({ id: userId, email }, SECRET_KEY, { expiresIn });

        // Insert the token in the sessions table
        await new Promise((resolve, reject) => {
            db.query(
                `INSERT INTO sessions (user_id, auth_token, expires_at) VALUES (?, ?, ?)`,
                [userId, token, tokenExpirationDate],
                (err) => {
                    if (err) reject(err);
                    resolve();
                }
            );
        });

        // Send response to the client
        res.status(201).send({
            message: "User created successfully",
            token,
            userId
        });

    } catch (error) {
        if (error.status) {
            return res.status(error.status).send({ error: error.message });
        }
        console.error('Registration error:', error);
        res.status(500).send({ error: "Internal server error" });
    }
});

// Route to login a user
app.post("/login", async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;

        // Verify if the user exists
        const user = await new Promise((resolve, reject) => {
            db.query("SELECT * FROM users WHERE email = ?", [email], (err, result) => {
                if (err) reject(err);
                resolve(result[0]);
            });
        });

        if (!user) {
            return res.status(404).send({ error: "User not found" });
        }

        const id = user.id;

        // Check the password
        const isMatch = await new Promise((resolve, reject) => {
            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) reject(err);
                resolve(isMatch);
            });
        });

        if (!isMatch) {
            return res.status(401).send({ error: "Incorrect password" });
        }

        // Set token expiration based on rememberMe
        const expiresIn = rememberMe ? '7d' : '1h';
        const tokenExpirationDate = rememberMe
            ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            : new Date(Date.now() + 60 * 60 * 1000);

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, email: user.email },
            SECRET_KEY,
            { expiresIn }
        );

        // Store the token in the sessions table
        await new Promise((resolve, reject) => {
            db.query(
                "INSERT INTO sessions (user_id, auth_token, expires_at) VALUES (?, ?, ?)",
                [user.id, token, tokenExpirationDate],
                (err, result) => {
                    if (err) reject(err);
                    resolve(result);
                }
            );
        });

        // Send the token to the client
        res.status(200).send({ message: "Login successful", token, id });

    } catch (error) {
        console.error("Server error:", error);
        res.status(500).send({ error: "Server error" });
    }
});

// Route to send a password reset code
app.post("/send-reset-code", async (req, res) => {
    try {
        const { email } = req.body;

        // Check if the user exists
        const user = await new Promise((resolve, reject) => {
            db.query("SELECT * FROM users WHERE email = ?;", [email], (err, result) => {
                if (err) reject(err);
                resolve(result[0]);
            });
        });

        if (!user) {
            return res.status(404).send({ error: "Utilisateur non trouvé" });
        }

        // Generate a 4-digit reset code
        const generateFourDigitCode = () => {
            return Math.floor(1000 + Math.random() * 9000);
        };

        const resetCode = generateFourDigitCode();
        //const resetCode = 2324;
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

        // Send the email asynchronously
        await new Promise((resolve, reject) => {
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) reject(error);
                resolve(info);
            });
        });

        // Store the reset code and timestamp in the database
        await new Promise((resolve, reject) => {
            db.query(
                "UPDATE users SET reset_code = ?, code_generated_at = ? WHERE email = ?",
                [resetCode, codeGeneratedAt, email],
                (err, result) => {
                    if (err) reject(err);
                    resolve(result);
                }
            );
        });

        res.status(200).send({ message: "Code de réinitialisation envoyé" });

    } catch (error) {
        console.error("Erreur serveur:", error);
        res.status(500).send({
            error: error.message.includes("email")
                ? "Erreur d'envoi de l'e-mail"
                : "Erreur serveur"
        });
    }
});

// Route to verify reset code
app.post("/verify-reset-code", async (req, res) => {
    try {
        const { email, code } = req.body;

        // Query the user based on email and check the reset code
        const result = await new Promise((resolve, reject) => {
            db.query(
                "SELECT * FROM users WHERE email = ? AND reset_code = ?",
                [email, code],
                (err, result) => {
                    if (err) reject(err);
                    resolve(result);
                }
            );
        });

        // Check if the reset code matches
        if (result.length > 0) {
            // Code is correct; user can proceed to reset password
            res.status(200).send({
                success: true,
                message: "Code vérifié avec succès"
            });
        } else {
            // Incorrect code or user not found
            res.status(400).send({
                success: false,
                message: "Code incorrect ou utilisateur non trouvé"
            });
        }

    } catch (error) {
        console.error("Erreur serveur:", error);
        res.status(500).send({ error: "Erreur serveur" });
    }
});

// Route to reset password if the reset code is verified
app.post("/reset-password", async (req, res) => {
    try {
        const { email, newPassword, resetCode, rememberMe } = req.body;

        // Check if the reset code and email are correct
        const user = await new Promise((resolve, reject) => {
            db.query(
                "SELECT * FROM users WHERE email = ? AND reset_code = ?",
                [email, resetCode],
                (err, result) => {
                    if (err) reject(err);
                    resolve(result[0]);
                }
            );
        });

        if (!user) {
            return res.status(400).json({
                error: "Code de réinitialisation invalide ou utilisateur non trouvé"
            });
        }

        const id = user.id;

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update the user's password and remove the reset_code
        await new Promise((resolve, reject) => {
            db.query(
                "UPDATE users SET password = ?, reset_code = NULL WHERE email = ?",
                [hashedPassword, email],
                (err, result) => {
                    if (err) reject(err);
                    resolve(result);
                }
            );
        });

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
        await new Promise((resolve, reject) => {
            db.query(
                "INSERT INTO sessions (user_id, auth_token, expires_at) VALUES (?, ?, ?)",
                [user.id, token, tokenExpirationDate],
                (err, result) => {
                    if (err) reject(err);
                    resolve(result);
                }
            );
        });

        // Send the token to the client
        res.status(200).json({
            message: "Mot de passe réinitialisé avec succès",
            token,
            id
        });

    } catch (error) {
        console.error("Server error:", error);
        res.status(500).json({
            error: error.message.includes("session")
                ? "Erreur serveur lors de la création de la session"
                : error.message.includes("password")
                    ? "Erreur serveur lors de la mise à jour du mot de passe"
                    : "Erreur lors du traitement de la demande"
        });
    }
});

// Fetch the user's profile unused
app.get('/user/profileunused', authenticateToken, (req, res) => {
    const userId = req.user.id;

    const query = `
      SELECT id, username, email, full_name AS fullName, profile_picture_url AS profilePictureUrl 
      FROM users 
      WHERE id = ?`;

    db.query(query, [userId], (error, results) => {
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

// Route optimisée pour servir les images avec mise en cache
app.get("/profile-picture/:imageName", async (req, res) => {
    try {
        const imageName = req.params.imageName;
        const imagePath = path.join(__dirname, "../uploads/profile-pictures", imageName);
        
        // Vérification de l'existence du fichier
        const fileExists = await fs.promises.access(imagePath)
            .then(() => true)
            .catch(() => false);
            
        if (!fileExists) {
            return res.status(404).send('Image non trouvée');
        }
        
        // Configuration de l'en-tête Cache-Control
        res.setHeader('Cache-Control', 'public, max-age=86400');
        
        // Vérifier si le client a déjà l'image en cache
        const etag = require('crypto')
            .createHash('md5')
            .update(fs.readFileSync(imagePath))
            .digest('hex');
            
        res.setHeader('ETag', `"${etag}"`);
        
        // Vérifier si le client a déjà cette version
        if (req.headers['if-none-match'] === `"${etag}"`) {
            return res.status(304).end(); // Not Modified
        }
        
        // Servir l'image optimisée à la volée si un paramètre de taille est fourni
        const width = parseInt(req.query.width) || null;
        
        if (width && width > 0 && width <= 2000) {
            const imageStream = fs.createReadStream(imagePath);
            const transformer = sharp().resize(width);
            
            res.setHeader('Content-Type', 'image/jpeg');
            return imageStream.pipe(transformer).pipe(res);
        }
        
        // Sinon, servir le fichier directement
        res.sendFile(imagePath);
        
    } catch (error) {
        console.error('Erreur lors de la lecture du fichier:', error);
        res.status(500).send('Erreur serveur');
    }
});

// Fetch User data by ID
app.get("/profile/:id", async (req, res) => {
    try {
        const userId = req.params.id;

        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        // Promisification de la requête db.query
        const result = await new Promise((resolve, reject) => {
            db.query("SELECT * FROM users WHERE id = ?", [userId], (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });

        if (result.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json(result[0]);

    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// Update user profile
app.put("/edit-profile/:id", upload.single("profilePicture"), optimizeImage, async (req, res) => {
    try {
        const userId = req.params.id;
        const {
            fullName,
            username,
            description,
            youtube,
            facebook,
            twitter,
            instagram,
            website,
            city,
            country,
            profilePictureUrl
        } = req.body;

        if (!userId) {
            return res.status(400).send({ error: "User ID is required" });
        }

        const updatedData = {
            full_name: fullName,
            username,
            description,
            youtube,
            facebook,
            twitter,
            instagram,
            website,
            city,
            country,
            profile_picture_url: profilePictureUrl
        };

        const slugify = (username) => {
            let slug = username.toLowerCase();
            slug = slug.replace(/\s+/g, "-");
            return slug;
        }

        const slug = slugify(username);
        const userData = [
            updatedData.username,
            slug,
            updatedData.full_name,
            updatedData.description,
            updatedData.youtube,
            updatedData.facebook,
            updatedData.twitter,
            updatedData.instagram,
            updatedData.website,
            updatedData.city,
            updatedData.country,
            updatedData.profile_picture_url,
            userId
        ];

        await new Promise((resolve, reject) => {
            db.query(
                `UPDATE users SET 
                    username = ?, 
                    slug = ?, 
                    full_name = ?, 
                    description = ?, 
                    youtube = ?, 
                    facebook = ?, 
                    twitter = ?, 
                    instagram = ?, 
                    website = ?, 
                    city = ?, 
                    country = ?, 
                    profile_picture_url = ? 
                WHERE id = ?`,
                userData,
                (err, result) => {
                    if (err) reject(err);
                    resolve(result);
                }
            );
        });

        res.status(200).json({ message: "User profile updated successfully" });

    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Failed to update user profile" });
    }
});

// Follow someone
app.post("/follow", async (req, res) => {
    try {
        const { followerId, followedId } = req.body;

        // Check if required fields are missing
        if (!followerId || !followedId) {
            return res.status(400).json({ error: "Both followerId and followedId are required." });
        }

        // Check if the follower is trying to follow themselves
        if (followerId === followedId) {
            return res.status(400).json({ error: "You cannot follow yourself." });
        }

        const result = await new Promise((resolve, reject) => {
            db.query(
                "INSERT INTO follows (follower_id, followed_id) VALUES (?, ?)",
                [followerId, followedId],
                (err, result) => {
                    if (err) reject(err);
                    resolve(result);
                }
            );
        });

        res.status(201).json({
            message: "Followed successfully",
            followId: result.insertId
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: "You are already following this user." });
        }
        console.error("Database error:", error);
        res.status(500).json({ error: "Failed to follow the user." });
    }
});

// Check if user is following another user
app.get("/is-following/:followerId/:followedId", async (req, res) => {
    const { followerId, followedId } = req.params;

    // Check if required fields are missing
    if (!followerId || !followedId) {
        return res.status(400).json({ error: "Both followerId and followedId are required." });
    }

    try {
        // Exécution de la requête avec async/await
        const [result] = await db.promise().query(
            "SELECT * FROM follows WHERE follower_id = ? AND followed_id = ?",
            [followerId, followedId]
        );

        // Return true if the result exists
        if (result.length > 0) {
            return res.status(200).json({ isFollowing: true });
        } else {
            return res.status(200).json({ isFollowing: false });
        }
    } catch (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to check follow status." });
    }
});

// Unfollow someone
app.delete("/unfollow/:followerId/:followedId", async (req, res) => {
    const { followerId, followedId } = req.params;

    // Vérification des champs requis
    if (!followerId || !followedId) {
        return res.status(400).json({ error: "Both followerId and followedId are required." });
    }

    try {
        // Exécution de la requête DELETE avec async/await
        const [result] = await db.promise().query(
            "DELETE FROM follows WHERE follower_id = ? AND followed_id = ?",
            [followerId, followedId]
        );

        if (result.affectedRows > 0) {
            return res.status(200).json({ message: "Successfully unfollowed user." });
        } else {
            return res.status(404).json({ error: "No follow relationship found to delete." });
        }
    } catch (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to unfollow user." });
    }
});

// Get following number
app.get("/:userId/following", async (req, res) => {
    const { userId } = req.params;

    // Vérification du paramètre userId
    if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
    }

    try {
        // Exécution de la requête SQL avec async/await
        const [result] = await db.promise().query(
            "SELECT COUNT(*) AS followingCount FROM follows WHERE follower_id = ?",
            [userId]
        );

        // Retourne le nombre d'utilisateurs suivis
        res.status(200).json({ followingCount: result[0].followingCount });
    } catch (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Server error" });
    }
});

// Get followers number
app.get("/:userId/followers", async (req, res) => {
    const { userId } = req.params;

    // Vérification du paramètre userId
    if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
    }

    try {
        // Exécution de la requête SQL avec async/await
        const [result] = await db.promise().query(
            "SELECT COUNT(*) AS followersCount FROM follows WHERE followed_id = ?",
            [userId]
        );

        // Retourne le nombre de followers
        res.status(200).json({ followersCount: result[0].followersCount });
    } catch (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Server error" });
    }
});

// Get followers list
app.get("/followers/:userId", async (req, res) => {
    const { userId } = req.params;

    // Check if userId is missing
    if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
    }

    try {
        const [results] = await db.promise().query(
            `
            SELECT 
                users.id, 
                users.username, 
                users.full_name, 
                users.profile_picture_url 
            FROM follows 
            JOIN users 
                ON follows.follower_id = users.id 
            WHERE follows.followed_id = ?;
            `,
            [userId]
        );

        res.status(200).json(results);
    } catch (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to fetch followers" });
    }
});

// Get following list
app.get("/following/:userId", async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
    }

    try {
        const [results] = await db.promise().query(
            `
            SELECT 
                users.id, 
                users.username, 
                users.full_name, 
                users.profile_picture_url 
            FROM follows 
            JOIN users 
                ON follows.followed_id = users.id 
            WHERE follows.follower_id = ?;
            `,
            [userId]
        );

        res.status(200).json(results);
    } catch (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to fetch following" });
    }
});

// Get users by recipe views
app.get("/recipe-views", async (req, res) => {
    const query = `
        SELECT 
            users.id AS id,
            users.username AS username,
            users.full_name AS fullName, 
            users.profile_picture_url AS profilePictureUrl, 
            SUM(recipe_views.view_count) AS totalViews
        FROM users
        JOIN recipes ON users.id = recipes.user_id
        LEFT JOIN recipe_views ON recipes.id = recipe_views.recipe_id
        GROUP BY users.id, users.username, users.full_name, users.profile_picture_url
        ORDER BY totalViews DESC;
    `;

    try {
        const [results] = await db.promise().query(query);
        res.status(200).json(results);
    } catch (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to fetch users by recipe views" });
    }
});

// Check if there is an active session
app.get("/check-session", async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(400).json({ error: "Token is required." });
    }

    const token = authHeader.split(" ")[1];

    try {
        const [[session]] = await db.promise().query(
            "SELECT user_id FROM sessions WHERE auth_token = ? AND expires_at > NOW() LIMIT 1",
            [token]
        );

        if (session) {
            return res.status(200).json({ active: true, userId: session.user_id });
        } else {
            return res.status(401).json({ active: false, message: "Session expired or invalid" });
        }
    } catch (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Server error" });
    }
});

module.exports = app;
