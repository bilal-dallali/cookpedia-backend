const express = require("express");
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

dotenv.config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

const app = express.Router();

//app.post("/add-comment", async (req, res) => {
//    const { userId, recipeId, comment } = req.body;
//
//    if (!userId || !recipeId || !comment) {
//        return res.status(400).json({ error: "Missing required fields" });
//    }
//
//    const values = [userId, recipeId, comment];
//
//    db.execute("INSERT INTO comments (user_id, recipe_id, comment, created_at) VALUES (?, ?, ?, NOW())", values, (err, result) => {
//        if (err) {
//            console.error("Database error:", err);
//            return res.status(500).json({ error: "Failed to post comment" });
//        }
//
//        res.status(201).json({ message: "Comment posted successfully", commentId: result.insertId });
//    });
//});

app.post("/add-comment", async (req, res) => {
    const { userId, recipeId, comment } = req.body;

    // Vérifier les champs obligatoires
    if (!userId || !recipeId || !comment) {
        console.log("Missing required fields", userId, recipeId, comment);
        return res.status(400).json({ error: "Missing required fields", 
        userId: userId,
        recipeId: recipeId,
        comment: comment
        });
    }

    const values = [userId, recipeId, comment];

    try {
        // Exécuter la requête avec async/await
        const [result] = await db.execute(
            "INSERT INTO comments (user_id, recipe_id, comment, created_at) VALUES (?, ?, ?, NOW())",
            values
        );

        // Répondre avec succès
        res.status(201).json({
            message: "Comment posted successfully",
            commentId: result.insertId
        });
    } catch (err) {
        // Gérer les erreurs
        console.error("Database error:", err);
        res.status(500).json({ error: "Failed to post comment" });
    }
});


app.get("/get-comments-from-recipe-id/:recipeId", async (req, res) => {
    const { recipeId } = req.params;

    if (!recipeId) {
        return res.status(400).json({ error: "Recipe ID is required" });
    }

    try {
        const [results] = await db.query("SELECT comments.*, users.full_name AS fullName, users.profile_picture_url AS profilePictureUrl FROM comments JOIN users ON comments.user_id = users.id WHERE comments.recipe_id = ? ORDER BY comments.created_at DESC", [recipeId]);
        res.status(200).json(results);
    } catch (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to fetch comments" });
    }
});

app.delete("/delete-comment/:commentId", async (req, res) => {
    const { commentId } = req.params;

    // Vérifier si commentId est fourni
    if (!commentId) {
        return res.status(400).json({ error: "Comment ID is required" });
    }

    try {
        // Exécuter la requête DELETE
        const [result] = await db.execute(
            "DELETE FROM comments WHERE id = ?",
            [commentId]
        );

        // Vérifier si une ligne a été affectée
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Comment not found" });
        }

        // Répondre avec succès
        res.status(200).json({ message: "Comment deleted successfully" });
    } catch (err) {
        // Gérer les erreurs
        console.error("Database error:", err);
        res.status(500).json({ error: "Failed to delete comment" });
    }
});

// Get all comments
app.get("/get-comments", async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM comments");
        res.status(200).json(results);
    } catch (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to fetch comments" });
    }
});

module.exports = app;