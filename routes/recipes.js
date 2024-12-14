const express = require("express");
const db = require("../config/db.js");
const multer = require("multer");
const path = require('path');
const fs = require('fs');

const app = express.Router();

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let folder = "./uploads/";
        if (file.fieldname === "recipeCoverPicture1" || file.fieldname === "recipeCoverPicture2") {
            folder += "recipes";
        } else if (file.fieldname.startsWith("instructionImage")) {
            folder += "instructions";
        }
        cb(null, folder);
    },
    filename: (req, file, cb) => {
        // Using names iin req.body for instructionImages
        if (file.fieldname === "instructionImages") {
            // Get instructions from req.body
            const instructions = JSON.parse(req.body.instructions || "[]");

            // Extract index from file originalname
            const originalName = file.originalname || "";
            const match = originalName.match(/Image(\d+)Index(\d+)/);

            if (match) {
                // Extract image 1
                const imageIndex = parseInt(match[1], 10);
                // Extract index to adjust the index (base 0)
                const instructionIndex = parseInt(match[2], 10) - 1;

                // Check if the instruction exists
                if (instructions[instructionIndex]) {
                    const instruction = instructions[instructionIndex];
                    const customFileName = instruction[`instructionPictureUrl${imageIndex}`];

                    if (customFileName) {
                        // Use the name defined by the frontend
                        cb(null, `${customFileName}.jpg`);
                        return;
                    }
                }
            }
            // If no match is found, assign a default name
            cb(
                null,
                `instructionImage_${Date.now()}_${Math.random()
                    .toString(36)
                    .substring(2, 8)}.jpg`
            );
        }

        // Use the names in req.body (recipeCoverPictureUrl1 and recipeCoverPictureUrl2)
        const fileNameMapping = {
            recipeCoverPicture1: req.body.recipeCoverPictureUrl1,
            recipeCoverPicture2: req.body.recipeCoverPictureUrl2,
        };

        // Get the name of the corresponding variable
        const fileName = fileNameMapping[file.fieldname];
        if (fileName) {
            cb(null, `${fileName}.jpg`);
        } else {
            console.warn(`Missing filename for ${file.fieldname}, using default`);
            cb(null, `${file.fieldname}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`);
        }
    },
});

const upload = multer({ storage });

// Recipe upload endpoint
app.post("/upload", upload.fields([
    { name: "recipeCoverPicture1", maxCount: 1 },
    { name: "recipeCoverPicture2", maxCount: 1 },
    { name: "instructionImages", maxCount: 30 },
]), (req, res) => {
    // Extract fields from req.body
    const {
        userId,
        title,
        recipeCoverPictureUrl1,
        recipeCoverPictureUrl2,
        description,
        cookTime,
        serves,
        origin,
        ingredients,
        instructions,
        isPublished,
    } = req.body;

    // Validate required fields
    if (!userId || !title || !description || !cookTime || !serves || !origin || !ingredients || !instructions) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    // Handle uploaded files
    const uploadedCover1 = req.files?.recipeCoverPicture1?.[0]?.filename || null;
    const uploadedCover2 = req.files?.recipeCoverPicture2?.[0]?.filename || null;

    // Insert data into the database
    const sql = `
            INSERT INTO recipes (
                user_id, title, recipe_cover_picture_url_1, recipe_cover_picture_url_2,
                description, cook_time, serves, origin, ingredients, instructions, published
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

    const recipeData = [
        userId,
        title,
        recipeCoverPictureUrl1,
        recipeCoverPictureUrl2,
        description,
        cookTime,
        serves,
        origin,
        ingredients,
        instructions,
        isPublished === "true" ? 1 : 0,
    ];

    db.query(sql, recipeData, (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Error saving recipe" });
        }
        res.status(201).json({ message: "Recipe uploaded successfully", recipeId: result.insertId });
    });
});

// Get all recipes unused
app.get("/getRecipeData", (req, res) => {
    db.query("SELECT * FROM recipes", (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Server error" });
        }
        res.status(200).json(result);
    });
});

// Get recipe cover picture
app.get('/recipe-cover/:imageName', (req, res) => {
    const imageName = req.params.imageName;
    const imagePath = path.join(__dirname, '../uploads/recipes', imageName);

    // Vérifier si le fichier existe
    if (fs.existsSync(imagePath)) {
        res.sendFile(imagePath);
    } else {
        res.status(404).send('Image non trouvée');
    }
});


// Get recipe instruction images
app.get('/instruction-image/:imageName', (req, res) => {
    const imageName = req.params.imageName;
    const imagePath = path.join(__dirname, '../uploads/instructions', imageName);

    // Vérifier si le fichier existe
    if (fs.existsSync(imagePath)) {
        res.sendFile(imagePath);
    } else {
        res.status(404).send('Image non trouvée');
    }
});

// Get recipe by userId
app.get("/recipes-connected-user/:userId", (req, res) => {
    const userId = req.params.userId;

    if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
    }

    db.query("SELECT id, title, recipe_cover_picture_url_1 FROM recipes WHERE user_id = ?", [userId], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Server error" });
        } else if (result.length === 0) {
            return res.status(404).json({ error: "No recipes found for this user" });
            
        }
        res.status(200).json(result);
    });
});

module.exports = app;
