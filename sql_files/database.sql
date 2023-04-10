-- Active: 1680937398788@@127.0.0.1@3306
DROP DATABASE cookpedia;

CREATE DATABASE cookpedia;

USE cookpedia;

CREATE TABLE users (
  id INT NOT NULL AUTO_INCREMENT,
  username VARCHAR(255) NOT NULL UNIQUE,
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
  PRIMARY KEY (id)
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