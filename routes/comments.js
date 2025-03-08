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

// Fetching all comments for a recipe from the oldest to the newest
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

// Fetching all comments for a recipe from the newest to the oldest
app.get("/get-comments-from-recipe-id-order-desc/:recipeId", async (req, res) => {
    const { recipeId } = req.params;

    if (!recipeId) {
        return res.status(400).json({ error: "Recipe ID is required" });
    }

    const query = `
        SELECT comments.*, users.full_name AS fullName, users.profile_picture_url AS profilePictureUrl 
        FROM comments 
        JOIN users ON comments.user_id = users.id 
        WHERE comments.recipe_id = ? 
        ORDER BY comments.created_at DESC;
    `;

    try {
        const [results] = await db.promise().query(query, [recipeId]);
        res.status(200).json(results);
    } catch (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to fetch comments" });
    }
});

// Fetching all comments for a recipe from the one with the most likes
app.get("/get-comments-from-recipe-id-order-by-likes/:recipeId", async (req, res) => {
    const { recipeId } = req.params;

    if (!recipeId) {
        return res.status(400).json({ error: "Recipe ID is required" });
    }

    const query = `
        SELECT comments.*, users.full_name AS fullName, users.profile_picture_url AS profilePictureUrl, 
               COUNT(comment_likes.comment_id) AS likeCount
        FROM comments
        JOIN users ON comments.user_id = users.id
        LEFT JOIN comment_likes ON comments.id = comment_likes.comment_id
        WHERE comments.recipe_id = ?
        GROUP BY comments.id, users.full_name, users.profile_picture_url
        ORDER BY likeCount DESC;
    `;

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

// Like a comment
app.post("/like-comment", async (req, res) => {
    const { userId, commentId } = req.body;

    // Vérification des champs requis
    if (!userId || !commentId) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const query = `
        INSERT INTO comment_likes (user_id, comment_id) 
        VALUES (?, ?) 
        ON DUPLICATE KEY UPDATE liked_at = NOW();
    `;

    try {
        const [result] = await db.promise().query(query, [userId, commentId]);

        // Vérification si un like a été ajouté
        const message = result.affectedRows > 0 ? "Comment liked successfully" : "Already liked";
        res.status(200).json({ message });
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).json({ error: "Failed to like comment" });
    }
});

// Delete like for a comment
app.delete("/unlike-comment", async (req, res) => {
    const { userId, commentId } = req.body;

    if (!userId || !commentId) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const [result] = await db.promise().query(
            "DELETE FROM comment_likes WHERE user_id = ? AND comment_id = ?",
            [userId, commentId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Like not found" });
        }

        res.status(200).json({ message: "Like removed successfully" });
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).json({ error: "Failed to remove like" });
    }
});

// Get likes number
app.get("/comment-likes/:commentId", async (req, res) => {
    const { commentId } = req.params;

    if (!commentId) {
        return res.status(400).json({ error: "Comment ID is required" });
    }

    try {
        const [[result]] = await db.promise().query(
            "SELECT COUNT(*) AS likeCount FROM comment_likes WHERE comment_id = ?",
            [commentId]
        );
        res.status(200).json(result || { likeCount: 0 });
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).json({ error: "Failed to fetch likes count" });
    }
});

// Check if user liked the comment
app.get("/is-comment-liked/:userId/:commentId", async (req, res) => {
    const { userId, commentId } = req.params;

    if (!userId || !commentId) {
        return res.status(400).json({ error: "User ID and Comment ID are required" });
    }

    try {
        const [[like]] = await db.promise().query(
            "SELECT 1 FROM comment_likes WHERE user_id = ? AND comment_id = ? LIMIT 1",
            [userId, commentId]
        );

        res.status(200).json({ isLiked: !!like });
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).json({ error: "Failed to check like status" });
    }
});

module.exports = app;