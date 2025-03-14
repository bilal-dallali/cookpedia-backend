const express = require("express");
const db = require("../config/db.js");
const multer = require("multer");
const path = require('path');
const fs = require('fs');
const sharp = require("sharp")

const app = express.Router();

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
        // Using names iin req.body for instructionImages
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
            // If no match is found, assign a default name
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


// Filtrer uniquement les images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Seules les images sont autorisées'), false);
    }
};

const upload = multer({ 
    storage, 
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024
    }
});

// Middleware pour optimiser l'image après upload
async function optimizeImage(req, res, next) {
    if (!req.file) return next();
    
    try {
        const originalPath = req.file.path;
        const optimizedFilename = `optimized-${path.basename(originalPath)}`;
        const optimizedPath = path.join(path.dirname(originalPath), optimizedFilename);
        
        // Optimiser l'image avec sharp
        await sharp(originalPath)
            .resize(800)
            .jpeg({ quality: 80, progressive: true })
            .toFile(optimizedPath);
            
        // Remplacer le fichier original
        fs.unlinkSync(originalPath);
        fs.renameSync(optimizedPath, originalPath);
        
        next();
    } catch (error) {
        next(error);
    }
}


// Recipe upload endpoint
app.post("/upload", upload.fields([
    { name: "recipeCoverPicture1", maxCount: 1 },
    { name: "recipeCoverPicture2", maxCount: 1 },
    { name: "instructionImages", maxCount: 30 },
]), optimizeImage, async (req, res) => {
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
            ingredients,
            instructions,
            isPublished,
        } = req.body;

        // Validate required fields
        if (!userId || !title || !description || !cookTime || !serves || !origin || !ingredients || !instructions) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const slugify = (title) => {
            let slug = title.toLowerCase();
            slug = slug.replace(/\s+/g, "-");
            return slug;
        }

        // Handle uploaded files
        const uploadedCover1 = req.files?.recipeCoverPicture1?.[0]?.filename || null;
        const uploadedCover2 = req.files?.recipeCoverPicture2?.[0]?.filename || null;

        const slug = slugify(title);

        const recipeData = [
            userId,
            title,
            slug,
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

        const result = await new Promise((resolve, reject) => {
            db.query(
                `INSERT INTO recipes (
                    user_id, 
                    title, 
                    slug, 
                    recipe_cover_picture_url_1, 
                    recipe_cover_picture_url_2, 
                    description, 
                    cook_time, 
                    serves, 
                    origin, 
                    ingredients, 
                    instructions, 
                    published
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                recipeData,
                (err, result) => {
                    if (err) reject(err);
                    resolve(result);
                }
            );
        });

        res.status(201).json({
            message: "Recipe uploaded successfully",
            recipeId: result.insertId
        });

    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Error saving recipe" });
    }
});

// Get all recipes unused
app.get("/get-recipe-data", (req, res) => {
    db.query("SELECT * FROM recipes", (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Server error" });
        }
        res.status(200).json(result);
    });
});


// Recent recipes
app.get("/recent-recipes", async (req, res) => {
    const query = "SELECT recipes.*, users.profile_picture_url, users.full_name FROM recipes JOIN users ON recipes.user_id = users.id WHERE recipes.published = 1 ORDER BY recipes.created_at DESC;";

    try {
        // Exécution de la requête SQL avec async/await
        const [results] = await db.promise().query(query);

        // Retourne les résultats
        res.status(200).json(results);
    } catch (err) {
        console.error("Error fetching recipes:", err);
        return res.status(500).json({ error: "Failed to fetch recipes" });
    }
});


// Get recipe cover picture
//app.get("/recipe-cover/:imageName", async (req, res) => {
//    try {
//        const imageName = req.params.imageName;
//        const imagePath = path.join(__dirname, "../uploads/recipes", imageName);
//
//        const fileExists = await fs.promises.access(imagePath)
//            .then(() => true)
//            .catch(() => false);
//
//        if (fileExists) {
//            res.sendFile(imagePath);
//        } else {
//            res.status(404).send("Image non trouvée");
//        }
//    } catch (error) {
//        console.error("Erreur lors de la lecture de l'image de recette:", error);
//        res.status(500).send("Erreur serveur");
//    }
//});

app.get("/recipe-cover/:imageName", async (req, res) => {
    try {
        const imageName = req.params.imageName;
        const imagePath = path.join(__dirname, "../uploads/recipes", imageName);
        
        // Vérification de l'existence du fichier
        const fileExists = await fs.promises.access(imagePath)
            .then(() => true)
            .catch(() => false);
            
        if (!fileExists) {
            return res.status(404).send('Image non trouvée');
        }
        
        // Configuration de l'en-tête Cache-Control
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache d'un jour
        
        // Vérifier si le client a déjà l'image en cache
        const etag = require('crypto')
            .createHash('md5')
            .update(fs.readFileSync(imagePath))
            .digest('hex');
            
        res.setHeader('ETag', `"${etag}"`);
        
        // Vérifier si le client a déjà cette version
        if (req.headers['if-none-match'] === `"${etag}"`) {
            return res.status(304).end(); // Not Modified
        }
        
        // Servir l'image optimisée à la volée si un paramètre de taille est fourni
        const width = parseInt(req.query.width) || null;
        
        if (width && width > 0 && width <= 2000) {
            const imageStream = fs.createReadStream(imagePath);
            const transformer = sharp().resize(width);
            
            res.setHeader('Content-Type', 'image/jpeg');
            return imageStream.pipe(transformer).pipe(res);
        }
        
        // Sinon, servir le fichier directement
        res.sendFile(imagePath);
        
    } catch (error) {
        console.error('Erreur lors de la lecture du fichier:', error);
        res.status(500).send('Erreur serveur');
    }
});

// Get recipe instruction images
//app.get("/instruction-image/:imageName", async (req, res) => {
//    try {
//        const imageName = req.params.imageName;
//        const imagePath = path.join(__dirname, "../uploads/instructions", imageName);
//
//        // Vérification asynchrone de l'existence du fichier
//        const fileExists = await fs.promises.access(imagePath)
//            .then(() => true)
//            .catch(() => false);
//
//        if (fileExists) {
//            res.sendFile(imagePath);
//        } else {
//            res.status(404).send("Image non trouvée");
//        }
//    } catch (error) {
//        console.error("Erreur lors de la lecture de l'image d'instruction:", error);
//        res.status(500).send("Erreur serveur");
//    }
//});

app.get("/instruction-image/:imageName", async (req, res) => {
    try {
        const imageName = req.params.imageName;
        const imagePath = path.join(__dirname, "../uploads/instructions", imageName);
        
        // Vérification de l'existence du fichier
        const fileExists = await fs.promises.access(imagePath)
            .then(() => true)
            .catch(() => false);
            
        if (!fileExists) {
            return res.status(404).send('Image non trouvée');
        }
        
        // Configuration de l'en-tête Cache-Control
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache d'un jour
        
        // Vérifier si le client a déjà l'image en cache
        const etag = require('crypto')
            .createHash('md5')
            .update(fs.readFileSync(imagePath))
            .digest('hex');
            
        res.setHeader('ETag', `"${etag}"`);
        
        // Vérifier si le client a déjà cette version
        if (req.headers['if-none-match'] === `"${etag}"`) {
            return res.status(304).end(); // Not Modified
        }
        
        // Servir l'image optimisée à la volée si un paramètre de taille est fourni
        const width = parseInt(req.query.width) || null;
        
        if (width && width > 0 && width <= 2000) {
            const imageStream = fs.createReadStream(imagePath);
            const transformer = sharp().resize(width);
            
            res.setHeader('Content-Type', 'image/jpeg');
            return imageStream.pipe(transformer).pipe(res);
        }
        
        // Sinon, servir le fichier directement
        res.sendFile(imagePath);
        
    } catch (error) {
        console.error('Erreur lors de la lecture du fichier:', error);
        res.status(500).send('Erreur serveur');
    }
});


// Get recipe by userId
app.get("/fetch-all-recipes-from-user/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;

        if (!userId) {
            return res.status(400).json({ error: "Missing userId" });
        }

        const recipes = await new Promise((resolve, reject) => {
            db.query(
                "SELECT * FROM recipes WHERE user_id = ?",
                [userId],
                (err, result) => {
                    if (err) reject(err);
                    resolve(result);
                }
            );
        });

        if (recipes.length === 0) {
            return res.status(404).json({ error: "No recipes found for this user" });
        }

        res.status(200).json(recipes);

    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// get published recipe by userId
app.get("/fetch-user-published-recipes/:userId/:published", async (req, res) => {
    try {
        const { userId, published } = req.params;

        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        const recipes = await new Promise((resolve, reject) => {
            db.query(
                "SELECT * FROM recipes WHERE user_id = ? AND published = ?",
                [userId, published],
                (err, result) => {
                    if (err) reject(err);
                    resolve(result);
                }
            );
        });

        if (recipes.length === 0) {
            return res.status(404).json({
                message: "No published recipes found for this user"
            });
        }

        res.status(200).json(recipes);

    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({
            error: "Failed to fetch published recipes for the user"
        });
    }
});


// Get recipes title and cover and fullname and profile picture by userId
app.get("/user-recipes-with-details/:userId", async (req, res) => {
    const { userId } = req.params;

    // Vérification du paramètre userId
    if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
    }

    try {
        // Exécution de la requête SQL avec async/await
        const [results] = await db.promise().query(`SELECT recipes.id, recipes.user_id, recipes.title, recipes.recipe_cover_picture_url_1, users.full_name AS fullName, users.profile_picture_url FROM recipes JOIN users ON recipes.user_id = users.id WHERE recipes.user_id = ?;`,
            [userId]
        );

        if (results.length === 0) {
            return res.status(404).json({ message: "No recipes found for this user" });
        }

        res.status(200).json(results);
    } catch (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Server error" });
    }
});

// Get published recipe count by userId
app.get("/published-recipes-count/:userId", async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
    }

    try {
        // Exécution de la requête SQL avec async/await
        const [result] = await db.promise().query(
            "SELECT COUNT(*) AS count FROM recipes WHERE user_id = ? AND published = 1",
            [userId]
        );

        // Retourne le nombre de recettes publiées
        res.status(200).json({ count: result[0].count });
    } catch (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to fetch published recipes count" });
    }
});


// Get draft reicpes count by userId
app.get("/draft-recipes-count/:userId", async (req, res) => {
    const { userId } = req.params;

    // Vérification du paramètre userId
    if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
    }

    try {
        // Exécution de la requête SQL avec async/await
        const [result] = await db.promise().query(
            "SELECT COUNT(*) AS count FROM recipes WHERE user_id = ? AND published = 0",
            [userId]
        );

        // Retourne le nombre de recettes en brouillon
        res.status(200).json({ count: result[0].count });
    } catch (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to fetch draft recipes count" });
    }
});

// Make bookmark by recipeId
app.post("/bookmark", async (req, res) => {
    const { userId, recipeId } = req.body;

    if (!userId || !recipeId) {
        return res.status(400).json({ error: "User ID and Recipe ID are required" });
    }

    const query = "INSERT INTO saved_recipes (user_id, recipe_id) VALUES (?, ?)";

    try {
        const [result] = await db.promise().query(query, [userId, recipeId]);

        res.status(200).json({ message: "Recipe bookmarked successfully" });
    } catch (err) {
        console.error("Database error:", err);

        if (err.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ error: "Recipe is already bookmarked" });
        }

        return res.status(500).json({ error: "Failed to save recipe" });
    }
});


// Remove bookmark
app.delete("/bookmark", async (req, res) => {
    const { userId, recipeId } = req.body;

    if (!userId || !recipeId) {
        return res.status(400).json({ error: "User ID and Recipe ID are required" });
    }

    try {
        const [result] = await db.promise().query(
            "DELETE FROM saved_recipes WHERE user_id = ? AND recipe_id = ?",
            [userId, recipeId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "No bookmark found for the specified user and recipe" });
        }

        res.status(200).json({ message: "Recipe unbookmarked successfully" });
    } catch (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to remove bookmark" });
    }
});

// Get bookmark for a userId and recipeId
app.get("/bookmark/:userId/:recipeId", async (req, res) => {
    const { userId, recipeId } = req.params;

    if (!userId || !recipeId) {
        return res.status(400).json({ error: "Both userId and recipeId are required" });
    }

    try {
        const [result] = await db.promise().query(
            "SELECT * FROM saved_recipes WHERE user_id = ? AND recipe_id = ?",
            [userId, recipeId]
        );

        if (result.length === 0) {
            return res.status(200).json([]);
        }

        res.status(200).json(result);
    } catch (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to fetch bookmarks" });
    }
});


// Get all bookmarked recipes for a userId
app.get("/bookmarked-recipes/:userId", async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
    }

    const query = `
        SELECT 
            recipes.*, 
            users.profile_picture_url, 
            users.full_name 
        FROM saved_recipes 
        INNER JOIN recipes ON saved_recipes.recipe_id = recipes.id 
        INNER JOIN users ON recipes.user_id = users.id 
        WHERE saved_recipes.user_id = ?;
    `;

    try {
        const [results] = await db.promise().query(query, [userId]);

        res.status(200).json(results);
    } catch (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to fetch saved recipes" });
    }
});


// Get recipe details page
app.get("/recipe-details/:recipeId", async (req, res) => {
    const { recipeId } = req.params;

    if (!recipeId) {
        return res.status(400).json({ error: "Recipe ID is required" });
    }

    const query = `
        SELECT 
            recipes.*, 
            users.full_name, 
            users.profile_picture_url, 
            users.username 
        FROM recipes 
        JOIN users ON recipes.user_id = users.id 
        WHERE recipes.id = ?;
    `;

    try {
        const [result] = await db.promise().query(query, [recipeId]);

        if (result.length === 0) {
            return res.status(404).json({ error: "Recipe not found" });
        }

        const recipe = result[0];
        recipe.ingredients = JSON.parse(recipe.ingredients);
        recipe.instructions = JSON.parse(recipe.instructions);

        res.status(200).json(recipe);
    } catch (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to fetch recipe details" });
    }
});


// Update recipe
app.put(
    "/update-recipe/:recipeId",
    upload.fields([
        { name: "recipeCoverPicture1", maxCount: 1 },
        { name: "recipeCoverPicture2", maxCount: 1 },
        { name: "instructionImages", maxCount: 30 },
    ]), optimizeImage,
    async (req, res) => {
        const { recipeId } = req.params;

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

        if (
            !userId ||
            !title ||
            !description ||
            !cookTime ||
            !serves ||
            !origin ||
            !ingredients ||
            !instructions
        ) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const slugify = (title) => {
            let slug = title.toLowerCase();
            slug = slug.replace(/\s+/g, "-");
            return slug;
        };

        const slug = slugify(title);

        const updatedRecipeData = [
            userId,
            title,
            slug,
            recipeCoverPictureUrl1,
            recipeCoverPictureUrl2,
            description,
            cookTime,
            serves,
            origin,
            ingredients,
            instructions,
            isPublished === "true" ? 1 : 0,
            recipeId, // Condition WHERE
        ];

        const query = `
            UPDATE recipes 
            SET 
                user_id = ?, 
                title = ?, 
                slug = ?, 
                recipe_cover_picture_url_1 = ?, 
                recipe_cover_picture_url_2 = ?, 
                description = ?, 
                cook_time = ?, 
                serves = ?, 
                origin = ?, 
                ingredients = ?, 
                instructions = ?, 
                published = ? 
            WHERE id = ?;
        `;

        try {
            const [result] = await db.promise().query(query, updatedRecipeData);

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Recipe not found" });
            }

            res.status(200).json({ message: "Recipe updated successfully" });
        } catch (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Error updating recipe" });
        }
    }
);


// Delete recipe
app.delete("/delete-recipe/:recipeId", async (req, res) => {
    const { recipeId } = req.params;

    if (!recipeId) {
        return res.status(400).json({ error: "Recipe ID is required" });
    }

    const query = "DELETE FROM recipes WHERE id = ?";

    try {
        const [result] = await db.promise().query(query, [recipeId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Recipe not found" });
        }

        res.status(200).json({ message: "Recipe successfully deleted" });
    } catch (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to delete the recipe" });
    }
});


// Increment views
app.post("/increment-views/:recipeId", async (req, res) => {
    const { recipeId } = req.params;

    if (!recipeId) {
        return res.status(400).json({ error: "Recipe ID is required" });
    }

    const query = `
        INSERT INTO recipe_views (recipe_id, view_count) 
        VALUES (?, 1) 
        ON DUPLICATE KEY UPDATE view_count = view_count + 1;
    `;

    try {
        await db.promise().query(query, [recipeId]);

        res.status(200).json({ message: "View count updated successfully" });
    } catch (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to update view count" });
    }
});

// Increment searches
app.post("/increment-searches/:recipeId", async (req, res) => {
    const { recipeId } = req.params;

    if (!recipeId) {
        return res.status(400).json({ error: "Recipe ID is required" });
    }

    const query = `
        INSERT INTO recipe_searches (recipe_id, search_count) 
        VALUES (?, 1) 
        ON DUPLICATE KEY UPDATE search_count = search_count + 1;
    `;

    try {
        await db.promise().query(query, [recipeId]);
        res.status(200).json({ message: "View count updated successfully" });
    } catch (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to update view count" });
    }
});


// Get most popular recipes
app.get("/most-popular-recipes", async (req, res) => {
    const query = `
        SELECT 
            recipes.id AS id, 
            recipes.user_id AS userId, 
            recipes.title AS title, 
            recipes.recipe_cover_picture_url_1 AS recipeCoverPictureUrl1, 
            users.full_name AS fullName, 
            users.profile_picture_url AS profilePictureUrl, 
            COALESCE(recipe_views.view_count, 0) AS viewCount
        FROM recipes
        JOIN users ON recipes.user_id = users.id
        LEFT JOIN recipe_views ON recipes.id = recipe_views.recipe_id
        WHERE recipes.published = 1
        ORDER BY recipe_views.view_count DESC
        LIMIT 50;
    `;

    try {
        const [results] = await db.promise().query(query);

        res.status(200).json(results);
    } catch (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to fetch top-viewed recipes" });
    }
});

// Get recommendation recipes
app.get("/recommendations", async (req, res) => {
    const query = `
        SELECT 
            recipes.id AS id, 
            recipes.user_id AS userId, 
            recipes.title AS title, 
            recipes.recipe_cover_picture_url_1 AS recipeCoverPictureUrl1, 
            users.full_name AS fullName, 
            users.profile_picture_url AS profilePictureUrl
        FROM recipes
        JOIN users ON recipes.user_id = users.id
        WHERE recipes.published = 1
        ORDER BY RAND()
        LIMIT 50;
    `;

    try {
        const [results] = await db.promise().query(query);

        res.status(200).json(results);
    } catch (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to fetch random recipes" });
    }
});


// Get most searched recipes
app.get("/most-searches-recipes", async (req, res) => {
    const query = `
        SELECT 
            recipes.id AS id, 
            recipes.user_id AS userId, 
            recipes.title AS title, 
            recipes.recipe_cover_picture_url_1 AS recipeCoverPictureUrl1, 
            users.full_name AS fullName, 
            users.profile_picture_url AS profilePictureUrl, 
            COALESCE(recipe_searches.search_count, 0) AS searchesCount
        FROM recipes
        JOIN users ON recipes.user_id = users.id
        LEFT JOIN recipe_searches ON recipes.id = recipe_searches.recipe_id
        WHERE recipes.published = 1
        ORDER BY recipe_searches.search_count DESC
        LIMIT 50;
    `;

    try {
        const [results] = await db.promise().query(query);

        res.status(200).json(results);
    } catch (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to fetch top-searched recipes" });
    }
});

module.exports = app;
