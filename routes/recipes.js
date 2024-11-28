import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import db from "../config/db.js";

const app = express.Router();

// Crée un équivalent de __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let folder = "./uploads/";
        if (file.fieldname === "recipeCoverPicture1" || file.fieldname === "recipeCoverPicture2") {
            folder += "recipes";
        } else if (file.fieldname.startsWith("instructionImage")) {
            folder += "instructions";
        }
        cb(null, folder);
    },
    filename: function (req, file, cb) {
        const fileName = req.body[file.fieldname]; // Récupérer le nom du fichier depuis req.body
        if (!fileName) {
            cb(new Error(`Missing file name in req.body for ${file.fieldname}`));
        } else {
            cb(null, fileName);
        }
    },
});

const upload = multer({ storage });

// Middleware pour parser les champs texte avant de traiter les fichiers
app.use((req, res, next) => {
    express.json()(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: "Invalid JSON format" });
        }
        next();
    });
});

// Route pour publier une recette
app.post("/", (req, res, next) => {
    console.log("Received request to create recipe");
    // Capture d'abord les champs texte
    upload.fields([
        { name: "recipeCoverPicture1", maxCount: 1 },
        { name: "recipeCoverPicture2", maxCount: 1 },
        { name: "instructionImages", maxCount: 10 },
    ])(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: err.message });
            console.log("Multer error:", err);
        } else if (err) {
            return res.status(500).json({ error: "File upload error" });
            console.log("Unknown error:", err);
        }

        // Extraire les données du body
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
            recipeCoverPictureUrl1,
            recipeCoverPictureUrl2,
        } = req.body;
        console.log("Received recipe data:", req.body);
        if (!userId || !title || !description || !cookTime || !serves || !origin || !ingredients || !instructions) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Parse JSON pour ingrédients et instructions
        let parsedIngredients;
        let parsedInstructions;

        try {
            parsedIngredients = JSON.parse(ingredients);
            parsedInstructions = JSON.parse(instructions);
        } catch (err) {
            return res.status(400).json({ error: "Invalid JSON format for ingredients or instructions" });
        }

        // Préparer les URLs des images
        const finalRecipeCoverPictureUrl1 = recipeCoverPictureUrl1
            ? `/uploads/recipes/${recipeCoverPictureUrl1}`
            : null;

        const finalRecipeCoverPictureUrl2 = recipeCoverPictureUrl2
            ? `/uploads/recipes/${recipeCoverPictureUrl2}`
            : null;

        const instructionImagesUrls = req.files["instructionImages"]
            ? req.files["instructionImages"].map(file => `/uploads/instructions/${file.filename}`)
            : [];

        // Ajouter les URLs aux instructions
        parsedInstructions.forEach((instruction, index) => {
            instruction.instructionPictureUrl1 = instructionImagesUrls[index * 3] || null;
            instruction.instructionPictureUrl2 = instructionImagesUrls[index * 3 + 1] || null;
            instruction.instructionPictureUrl3 = instructionImagesUrls[index * 3 + 2] || null;
        });

        // Sauvegarder en base de données
        const sql = `
            INSERT INTO recipes (
                user_id, title, recipe_cover_picture_url_1, recipe_cover_picture_url_2, 
                description, cook_time, serves, origin, ingredients, instructions, is_published
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(sql, [
            userId,
            title,
            finalRecipeCoverPictureUrl1,
            finalRecipeCoverPictureUrl2,
            description,
            cookTime,
            serves,
            origin,
            JSON.stringify(parsedIngredients),
            JSON.stringify(parsedInstructions),
            isPublished === "true",
        ], (err, result) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Error saving recipe" });
            }

            res.status(201).json({ message: "Recipe created successfully", recipeId: result.insertId });
        });
    });
});

export default app;
