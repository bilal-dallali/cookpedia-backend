const express = require("express");
const db = require("../config/db.js");

const app = express.Router();

app.post("/add-comment", (req, res) => {
    const { userId, recipeId, comment } = req.body;

    if (!userId || !recipeId || !comment) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const values = [userId, recipeId, comment];

    db.query("INSERT INTO comments (user_id, recipe_id, comment, created_at) VALUES (?, ?, ?, NOW())", values, (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Failed to post comment" });
        }

        res.status(201).json({ message: "Comment posted successfully", commentId: result.insertId });
    });
});

app.get("/get-comments-from-recipe-id/:recipeId", (req, res) => {
    const { recipeId } = req.params;

    if (!recipeId) {
        return res.status(400).json({ error: "Recipe ID is required" });
    }

    db.query("SELECT comments.*, users.full_name AS fullName, users.profile_picture_url AS profilePictureUrl FROM comments JOIN users ON comments.user_id = users.id WHERE comments.recipe_id = ? ORDER BY comments.created_at DESC", [recipeId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Failed to fetch comments" });
        }

        res.status(200).json(results);
    });
});

app.delete("/delete-comment/:commentId", (req, res) => {
    const { commentId } = req.params;

    if (!commentId) {
        return res.status(400).json({ error: "Comment ID is required" });
    }

    db.query("DELETE FROM comments WHERE id = ?", [commentId], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Failed to delete comment" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Comment not found" });
        }

        res.status(200).json({ message: "Comment deleted successfully" });
    });
});

module.exports = app;