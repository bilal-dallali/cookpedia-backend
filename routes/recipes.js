import express from "express";
import db from "../config/db.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

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
        // Utiliser les noms dans req.body (recipeCoverPictureUrl1 et recipeCoverPictureUrl2)
        const fileNameMapping = {
            recipeCoverPicture1: req.body.recipeCoverPictureUrl1,
            recipeCoverPicture2: req.body.recipeCoverPictureUrl2,
        };

        const fileName = fileNameMapping[file.fieldname]; // Récupère le nom de la variable correspondante
        if (fileName) {
            cb(null, `${fileName}.jpg`); // Utilise le nom spécifié
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
    try {
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
            ingredients, // JSON string directly from frontend
            instructions, // JSON string directly from frontend
            isPublished,
        } = req.body;

        console.log("req.body", req.body);
        // Validate required fields
        if (!userId || !title || !description || !cookTime || !serves || !origin || !ingredients || !instructions) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Handle uploaded files
        // Vérification des fichiers uploadés
        const uploadedCover1 = req.files?.recipeCoverPicture1?.[0]?.filename || null;
        const uploadedCover2 = req.files?.recipeCoverPicture2?.[0]?.filename || null;

        console.log("Recipe Cover Picture URL 1:", uploadedCover1);
        console.log("Recipe Cover Picture URL 2:", uploadedCover2);

        // Validation : les noms des fichiers doivent correspondre
        if (uploadedCover1 !== recipeCoverPictureUrl1 || uploadedCover2 !== recipeCoverPictureUrl2) {
            console.log("7")
            //return res.status(400).json({ error: "Uploaded file names do not match the expected names." });
        }

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
            ingredients, // JSON string directly from frontend
            instructions, // JSON string directly from frontend
            isPublished === "true" ? 1 : 0,
        ];

        db.query(sql, recipeData, (err, result) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Error saving recipe" });
            }
            res.status(201).json({ message: "Recipe uploaded successfully", recipeId: result.insertId });
        });
    } catch (err) {
        console.log("Error processing recipe upload:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default app;
