import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import db from "../config/db.js";

const app = express.Router();

// Create __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const type = req.body.type; // `type` field specifies the type of image
        let uploadPath;

        if (type === "ingredient") {
            uploadPath = path.join(__dirname, "../uploads/ingredients");
        } else if (type === "instruction") {
            uploadPath = path.join(__dirname, "../uploads/instructions");
        } else {
            uploadPath = path.join(__dirname, "../uploads/recipes");
        }

        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    },
});

const upload = multer({ storage });

// Route to upload recipe data
app.post("/upload", upload.fields([
    { name: "recipeCoverPicture1", maxCount: 1 },
    { name: "recipeCoverPicture2", maxCount: 1 },
    { name: "instructionImages", maxCount: 90 },
]), (req, res) => {
    const {
        userId,
        title,
        description,
        cookTime,
        serves,
        origin,
        ingredients,
        instructions,
        isPublished,
    } = req.body;

    // Parse JSON strings for ingredients and instructions
    const parsedIngredients = JSON.parse(ingredients);
    const parsedInstructions = JSON.parse(instructions);

    // Store instruction image URLs
    const instructionImagesUrls = req.files["instructionImages"]
        ? req.files["instructionImages"].map(file => `/uploads/instructions/${file.filename}`)
        : [];

    // Map the instructionImagesUrls back to their respective instructions
    parsedInstructions.forEach((instruction, index) => {
        instruction.instructionPictureUrl1 = instructionImagesUrls[index * 3] || null;
        instruction.instructionPictureUrl2 = instructionImagesUrls[index * 3 + 1] || null;
        instruction.instructionPictureUrl3 = instructionImagesUrls[index * 3 + 2] || null;
    });

    // Store recipe data in the database
    const sql = `
        INSERT INTO recipes (
            user_id, title, recipe_cover_picture_url_1, recipe_cover_picture_url_2, 
            description, cook_time, serves, origin, ingredients, instructions, is_published
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const recipeCoverPictureUrl1 = req.files["recipeCoverPicture1"]
        ? `/uploads/recipes/${req.files["recipeCoverPicture1"][0].filename}`
        : null;

    const recipeCoverPictureUrl2 = req.files["recipeCoverPicture2"]
        ? `/uploads/recipes/${req.files["recipeCoverPicture2"][0].filename}`
        : null;

    db.query(sql, [
        userId,
        title,
        recipeCoverPictureUrl1,
        recipeCoverPictureUrl2,
        description,
        cookTime,
        serves,
        origin,
        JSON.stringify(parsedIngredients),
        JSON.stringify(parsedInstructions),
        isPublished === "true",
    ], (err, result) => {
        if (err) {
            console.error("Error saving recipe:", err);
            return res.status(500).json({ error: "Error saving recipe" });
        }

        res.status(201).json({ message: "Recipe created successfully", recipeId: result.insertId });
    });
});


export default app;
