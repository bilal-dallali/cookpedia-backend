-- Active: 1733410756959@@127.0.0.1@3306@cookpedia
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
    reset_code VARCHAR(10),
    code_generated_at DATETIME,
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

DROP TABLE IF EXISTS recipes;

CREATE TABLE recipes (
    id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
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
SHOW TABLE STATUS;

INSERT INTO
    recipes (
        user_id,
        title,
        recipe_cover_picture_url_1,
        recipe_cover_picture_url_2,
        description,
        cook_time,
        serves,
        origin,
        ingredients,
        instructions
    )
VALUES (
        987, -- Remplacez par un user_id valide
        'Delicious Pancakes',
        'https://example.com/images/recipe1-cover1.jpg',
        'https://example.com/images/recipe1-cover2.jpg',
        'A simple and delicious pancake recipe perfect for breakfast.',
        '30 minutes',
        '4 people',
        'France',
        JSON_ARRAY(
            JSON_OBJECT(
                'index',
                1,
                'ingredient',
                '2 cups of flour❤️❤️❤️'
            ),
            JSON_OBJECT(
                'index',
                2,
                'ingredient',
                '1.5 cups of milk'
            ),
            JSON_OBJECT(
                'index',
                3,
                'ingredient',
                '2 eggs'
            ),
            JSON_OBJECT(
                'index',
                4,
                'ingredient',
                '3 tablespoons of sugar'
            ),
            JSON_OBJECT(
                'index',
                5,
                'ingredient',
                '1 teaspoon of vanilla extract'
            ),
            JSON_OBJECT(
                'index',
                6,
                'ingredient',
                'A pinch of salt'
            )
        ),
        JSON_ARRAY(
            JSON_OBJECT(
                'index',
                1,
                'instruction',
                'Mix all dry ingredients.',
                'instructionPictureUrl1',
                'https://example.com/images/instruction1-1.jpg',
                'instructionPictureUrl2',
                NULL,
                'instructionPictureUrl3',
                NULL
            ),
            JSON_OBJECT(
                'index',
                2,
                'instruction',
                'Whisk in the milk and eggs.',
                'instructionPictureUrl1',
                'https://example.com/images/instruction2-1.jpg',
                'instructionPictureUrl2',
                'https://example.com/images/instruction2-2.jpg',
                'instructionPictureUrl3',
                NULL
            ),
            JSON_OBJECT(
                'index',
                3,
                'instruction',
                'Heat a non-stick pan and pour batter to form pancakes.',
                'instructionPictureUrl1',
                'https://example.com/images/instruction3-1.jpg',
                'instructionPictureUrl2',
                NULL,
                'instructionPictureUrl3',
                NULL
            ),
            JSON_OBJECT(
                'index',
                4,
                'instruction',
                'Cook until golden on both sides and serve.',
                'instructionPictureUrl1',
                NULL,
                'instructionPictureUrl2',
                NULL,
                'instructionPictureUrl3',
                NULL
            )
        )
    );

SELECT * FROM recipes
