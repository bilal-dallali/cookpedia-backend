const express = require("express");
const db = require("../config/db.js");

const app = express.Router();

// Adding a comment to a recipe
app.post("/add-comment", async (req, res) => {
    const { userId, recipeId, comment } = req.body;

    if (!userId || !recipeId || !comment) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const query = "INSERT INTO comments (user_id, recipe_id, comment, created_at) VALUES (?, ?, ?, NOW())";
    const values = [userId, recipeId, comment];

    try {
        const [result] = await db.promise().query(query, values);

        res.status(201).json({
            message: "Comment posted successfully",
            commentId: result.insertId,
        });
    } catch (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to post comment" });
    }
});

// Fetching all comments for a recipe
app.get("/get-comments-from-recipe-id-order-asc/:recipeId", async (req, res) => {
    const { recipeId } = req.params;

    if (!recipeId) {
        return res.status(400).json({ error: "Recipe ID is required" });
    }

    const query = "SELECT comments.*, users.full_name AS fullName, users.profile_picture_url AS profilePictureUrl FROM comments JOIN users ON comments.user_id = users.id WHERE comments.recipe_id = ? ORDER BY comments.created_at ASC;";

    try {
        const [results] = await db.promise().query(query, [recipeId]);

        res.status(200).json(results);
    } catch (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to fetch comments" });
    }
});


// Delete comment by ID
app.delete("/delete-comment/:commentId", async (req, res) => {
    const { commentId } = req.params;

    if (!commentId) {
        return res.status(400).json({ error: "Comment ID is required" });
    }

    const query = "DELETE FROM comments WHERE id = ?";

    try {
        const [result] = await db.promise().query(query, [commentId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Comment not found" });
        }

        res.status(200).json({ message: "Comment deleted successfully" });
    } catch (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to delete comment" });
    }
});

module.exports = app;