-- Active: 1679501651165@@127.0.0.1@3306@cookpedia
DROP DATABASE cookpedia;

CREATE DATABASE cookpedia;

USE cookpedia;

CREATE TABLE users (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(255) NOT NULL,
  gender VARCHAR(255) NOT NULL,
  date_of_birth VARCHAR(255) NOT NULL,
  profile_picture_url VARCHAR(255) NOT NULL,
  country VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL,
  salad BOOLEAN NOT NULL,
  egg BOOLEAN NOT NULL,
  soup BOOLEAN NOT NULL,
  meat BOOLEAN NOT NULL,
  chicken BOOLEAN NOT NULL,
  seafood BOOLEAN NOT NULL,
  burger BOOLEAN NOT NULL,
  pizza BOOLEAN NOT NULL,
  sushi BOOLEAN NOT NULL,
  rice BOOLEAN NOT NULL,
  bread BOOLEAN NOT NULL,
  fruit BOOLEAN NOT NULL,
  vegetarian BOOLEAN NOT NULL,
  vegan BOOLEAN NOT NULL,
  gluten_free BOOLEAN NOT NULL,
  nut_free BOOLEAN NOT NULL,
  dairy_free BOOLEAN NOT NULL,
  low_carb BOOLEAN NOT NULL,
  peanut_free BOOLEAN NOT NULL,
  keto BOOLEAN NOT NULL,
  soy_free BOOLEAN NOT NULL,
  raw_food BOOLEAN NOT NULL,
  low_fat BOOLEAN NOT NULL,
  halal BOOLEAN NOT NULL,
  cooking_level VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE (email)
);


/*
CREATE TABLE recipe_categories (
  category_id INT PRIMARY KEY AUTO_INCREMENT,
  category_name VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recipes (
  recipe_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  category_id INT NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  cook_time INT NOT NULL,
  serves VARCHAR(20) NOT NULL,
  origin VARCHAR(100),
  cover_image_url VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES recipe_categories(category_id) ON DELETE CASCADE
);

CREATE TABLE recipe_ingredients (
  ingredient_id INT PRIMARY KEY AUTO_INCREMENT,
  recipe_id INT NOT NULL,
  ingredient_name VARCHAR(100) NOT NULL,
  quantity VARCHAR(50) NOT NULL,
  unit VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id) ON DELETE CASCADE
);

CREATE TABLE recipe_instructions (
  instruction_id INT PRIMARY KEY AUTO_INCREMENT,
  recipe_id INT NOT NULL,
  instruction_order INT NOT NULL,
  instruction_text TEXT NOT NULL,
  instruction_image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id) ON DELETE CASCADE
);

CREATE TABLE recipe_comments (
  comment_id INT PRIMARY KEY AUTO_INCREMENT,
  recipe_id INT NOT NULL,
  user_id INT NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE recipe_likes (
  like_id INT PRIMARY KEY AUTO_INCREMENT,
  recipe_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE followers (
  follower_id INT NOT NULL,
  following_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_id, following_id),
  FOREIGN KEY (follower_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (following_id) REFERENCES users(user_id) ON DELETE CASCADE
);
*/