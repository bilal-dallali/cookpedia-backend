//import express from "express";
//import db from "../config/db.js";
//import multer from "multer";
//import path from "path";
//import { fileURLToPath } from "url";
const express = require("express");
const db = require("../config/db.js");
const multer = require("multer");
//const path = require("path");
//const { fileURLToPath } = require("url");

const app = express.Router();

//const __filename = fileURLToPath(import.meta.url);
//const __dirname = path.dirname(__filename);

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
        // Utilisation des noms dans req.body pour les instructionImages
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
            // Si aucune correspondance n'est trouvée, attribue un nom par défaut
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

    console.log("req.body", req.body);
    console.log("req.files", req.files.instructionImages);
    // Validate required fields
    if (!userId || !title || !description || !cookTime || !serves || !origin || !ingredients || !instructions) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    // Handle uploaded files
    const uploadedCover1 = req.files?.recipeCoverPicture1?.[0]?.filename || null;
    const uploadedCover2 = req.files?.recipeCoverPicture2?.[0]?.filename || null;

    console.log("Recipe Cover Picture URL 1:", uploadedCover1);
    console.log("Recipe Cover Picture URL 2:", uploadedCover2);

    // Validation: file names must match
    if (uploadedCover1 !== `${recipeCoverPictureUrl1}.jpg` || uploadedCover2 !== `${recipeCoverPictureUrl2}.jpg`) {
        return res.status(400).json({ error: "Uploaded file names do not match the expected names." });
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

app.get("/getRecipeData", (req, res) => {
    db.query("SELECT * FROM recipes", (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Server error" });
        }
        res.status(200).json(result);
    });
});

module.exports = app;
