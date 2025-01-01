const express = require("express");
const db = require("../config/db.js");

const app = express.Router();

app.post("/add-comment", (req, res) => {
    const { userId, recipeId, comment } = req.body;
    console.log("reqbody", req.body);

    // Vérification des paramètres requis
    if (!userId || !recipeId || !comment) {
        console.log("Missing required fields");
        console.log("userId", userId);
        console.log("recipeId", recipeId);
        console.log("content", comment);
        return res.status(400).json({ error: "Missing required fields" });
    }

    const sql = `INSERT INTO comments (user_id, recipe_id, comment, created_at) VALUES (?, ?, ?, NOW())`;

    const values = [userId, recipeId, comment];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Failed to post comment" });
        }
        console.log("Comment posted successfully", result);

        res.status(201).json({ message: "Comment posted successfully", commentId: result.insertId });
    });
});

app.get("/get-comments-from-recipe-id/:recipeId", (req, res) => {
    const { recipeId } = req.params;

    // Vérification du paramètre recipeId
    if (!recipeId) {
        return res.status(400).json({ error: "Recipe ID is required" });
    }

    const sql = `
        SELECT 
            comments.*, 
            users.full_name AS fullName, 
            users.profile_picture_url AS profilePictureUrl
        FROM comments
        JOIN users ON comments.user_id = users.id
        WHERE comments.recipe_id = ?
        ORDER BY comments.created_at DESC
    `;

    db.query(sql, [recipeId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Failed to fetch comments" });
        }

        res.status(200).json(results);
    });
});

module.exports = app;