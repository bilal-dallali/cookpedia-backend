-- Active: 1679501651165@@127.0.0.1@3306
DROP DATABASE cookpedia;

CREATE DATABASE cookpedia;

USE cookpedia;

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    gender ENUM('male', 'female', 'other'),
    date_of_birth DATE,
    country VARCHAR(255),
    town VARCHAR(255),
    profile_picture_url VARCHAR(255)
);

CREATE TABLE cuisine_preferences (
    user_id INT,
    cuisine_type ENUM('salad', 'egg', 'soup', 'meat', 'chicken', 'seafood', 'burger', 'pizza', 'sushi', 'rice', 'bread', 'fruit'),
    PRIMARY KEY (user_id, cuisine_type),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE dietary_preferences (
    user_id INT,
    dietary_type ENUM('vegetarian', 'vegan', 'gluten-free', 'nut-free', 'dairy-free', 'low-carb', 'peanut-free', 'keto', 'soy-free', 'raw-food', 'low-fat', 'halal'),
    PRIMARY KEY (user_id, dietary_type),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE recipes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cover_image_url VARCHAR(255) NOT NULL,
    cuisine_type ENUM('salad', 'egg', 'soup', 'meat', 'chicken', 'seafood', 'burger', 'pizza', 'sushi', 'rice', 'bread', 'fruit') NOT NULL,
    origin_country VARCHAR(255) NOT NULL,
    cook_time INT NOT NULL,
    serves VARCHAR(255) NOT NULL,
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

/*CREATE TABLE ingredients (
    recipe_id INT NOT NULL,
    ingredient_text TEXT NOT NULL,
    PRIMARY KEY (recipe_id, ingredient_text),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);*/

CREATE TABLE ingredients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    recipe_id INT NOT NULL,
    ingredient_text TEXT NOT NULL,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    UNIQUE (recipe_id, ingredient_text(255))
);

CREATE TABLE recipe_steps (
    id INT PRIMARY KEY AUTO_INCREMENT,
    recipe_id INT NOT NULL,
    step_number INT NOT NULL,
    step_description TEXT NOT NULL,
    step_image_url VARCHAR(255),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

CREATE TABLE recipe_comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    recipe_id INT NOT NULL,
    user_id INT NOT NULL,
    comment_text TEXT NOT NULL,
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


CREATE TABLE favorites (
    user_id INT NOT NULL,
    recipe_id INT NOT NULL,
    PRIMARY KEY (user_id, recipe_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

CREATE TABLE subscriptions (
    follower_id INT NOT NULL,
    following_id INT NOT NULL,
    PRIMARY KEY (follower_id, following_id),
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    notification_type ENUM('recommendation', 'following', 'recipe_comment', 'comment_mention', 'like_comment', 'new_recipe'),
    notification_text TEXT NOT NULL,
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
