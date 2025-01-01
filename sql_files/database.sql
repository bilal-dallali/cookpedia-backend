-- Active: 1733608871982@@127.0.0.1@3306@cookpedia
DROP DATABASE cookpedia;

CREATE DATABASE cookpedia;

USE cookpedia;

CREATE TABLE users (
    id INT NOT NULL AUTO_INCREMENT,
    username VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone_number VARCHAR(255) UNIQUE,
    gender VARCHAR(255),
    date_of_birth VARCHAR(255),
    profile_picture_url VARCHAR(255),
    country VARCHAR(255),
    city VARCHAR(255),
    salad BOOLEAN,
    egg BOOLEAN,
    soup BOOLEAN,
    meat BOOLEAN,
    chicken BOOLEAN,
    seafood BOOLEAN,
    burger BOOLEAN,
    pizza BOOLEAN,
    sushi BOOLEAN,
    rice BOOLEAN,
    bread BOOLEAN,
    fruit BOOLEAN,
    vegetarian BOOLEAN,
    vegan BOOLEAN,
    gluten_free BOOLEAN,
    nut_free BOOLEAN,
    dairy_free BOOLEAN,
    low_carb BOOLEAN,
    peanut_free BOOLEAN,
    keto BOOLEAN,
    soy_free BOOLEAN,
    raw_food BOOLEAN,
    low_fat BOOLEAN,
    halal BOOLEAN,
    cooking_level VARCHAR(255),
    description TEXT,
    youtube VARCHAR(255),
    facebook VARCHAR(255),
    twitter VARCHAR(255),
    instagram VARCHAR(255),
    website VARCHAR(255),
    reset_code VARCHAR(10),
    code_generated_at DATETIME,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

CREATE TABLE sessions (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    auth_token VARCHAR(255) NOT NULL,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE recipes (
    id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    recipe_cover_picture_url_1 VARCHAR(255),
    recipe_cover_picture_url_2 VARCHAR(255),
    description TEXT NOT NULL,
    cook_time VARCHAR(255) NOT NULL,
    serves VARCHAR(255) NOT NULL,
    origin VARCHAR(255) NOT NULL,
    ingredients JSON NOT NULL,
    instructions JSON NOT NULL,
    published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE saved_recipes (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    recipe_id INT NOT NULL,
    saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes (id) ON DELETE CASCADE
);

CREATE TABLE follows (
    id INT NOT NULL AUTO_INCREMENT,
    follower_id INT NOT NULL,
    followed_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (followed_id) REFERENCES users(id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS recipe_searches;

CREATE TABLE recipe_searches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipe_id INT NOT NULL UNIQUE,
    search_count INT DEFAULT 0,
    last_searched TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

CREATE TABLE recipe_views (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipe_id INT NOT NULL UNIQUE,
    view_count INT DEFAULT 0,
    last_viewed TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

CREATE TABLE comments (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    recipe_id INT NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes (id) ON DELETE CASCADE
);