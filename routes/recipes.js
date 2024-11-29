import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import db from "../config/db.js";

const app = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        const fileName = req.body[file.fieldname]; // Extract expected filename from req.body
        if (fileName) {
            cb(null, fileName); // Use provided name if available
        } else {
            // Generate a default filename to prevent the error
            const uniqueName = `${file.fieldname}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;
            console.warn(`Missing filename for ${file.fieldname}, using default: ${uniqueName}`);
            cb(null, uniqueName);
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
    try {
        // Extract fields from req.body
        const {
            userId,
            title,
            description,
            cookTime,
            serves,
            origin,
            ingredients, // JSON string directly from frontend
            instructions, // JSON string directly from frontend
            isPublished,
        } = req.body;

        // Validate required fields
        if (!userId || !title || !description || !cookTime || !serves || !origin || !ingredients || !instructions) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Handle uploaded files
        const recipeCoverPictureUrl1 = req.files?.recipeCoverPicture1?.[0]?.filename || null;
        const recipeCoverPictureUrl2 = req.files?.recipeCoverPicture2?.[0]?.filename || null;

        // Insert data into the database
        const sql = `
            INSERT INTO recipes (
                user_id, title, recipe_cover_picture_url_1, recipe_cover_picture_url_2,
                description, cook_time, serves, origin, ingredients, instructions, published
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(sql, [
            userId,
            title,
            recipeCoverPictureUrl1,
            recipeCoverPictureUrl2,
            description,
            cookTime,
            serves,
            origin,
            ingredients, // Directly send JSON string
            instructions, // Directly send JSON string
            isPublished === "true",
        ], (err, result) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Error saving recipe" });
            }

            res.status(201).json({ message: "Recipe uploaded successfully", recipeId: result.insertId });
        });
    } catch (err) {
        console.error("Error processing recipe upload:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});



export default app;
