INSERT INTO recipes (
    user_id,
    title,
    recipe_cover_picture_url_1,
    recipe_cover_picture_url_2,
    description,
    cook_time,
    serves,
    origin,
    ingredients,
    instructions,
    published
) VALUES (
    2, -- user_id
    'User 2 Recipe 10',
    'recipe_cover_picture_url_1_20241206213130_CCD6CA1F-2E34-4D4F-8BCC-BB5723EA52AF',
    'recipe_cover_picture_url_2_20241206213141_61F03417-D34B-4332-A760-A2DC434DEDF8',
    'This salad is a healthy and delicious combination of fresh vegetables and fruit with an easy dressing. Feel free to add or replace any ingredients according to your taste.',
    '10 mins',
    '2 people',
    'United States of America',
    JSON_ARRAY(
        JSON_OBJECT('index', 1, 'ingredient', '1 large lettuce, sliced 🥬'),
        JSON_OBJECT('index', 2, 'ingredient', '1 pint cherry tomatoes, halve...'),
        JSON_OBJECT('index', 3, 'ingredient', '1 red onion, sliced 🧅'),
        JSON_OBJECT('index', 4, 'ingredient', '1/2 cup kalamata olives 🫒'),
        JSON_OBJECT('index', 5, 'ingredient', '1/2 cup crumbled feta cheese'),
        JSON_OBJECT('index', 6, 'ingredient', '2 tablespoons red wine vine'),
        JSON_OBJECT('index', 7, 'ingredient', 'Salt and pepper to taste 🧂')
    ),
    JSON_ARRAY(
        JSON_OBJECT(
            'index', 1,
            'instruction', 'In a large bowl, combine the lettuce, cherry tomatoes, red onion, and kalamata olives.',
            'instructionPictureUrl1', 'instruction_picture_url_1_20241206213346_47901E76-F689-44F2-85E8-15A69CB14B81',
            'instructionPictureUrl2', 'instruction_picture_url_2_20241206213348_1167F5B0-60A8-417F-BB4E-4B2B2D8BA801',
            'instructionPictureUrl3', 'instruction_picture_url_3_20241206213353_561E61DE-6FDF-4173-A4A1-358895FA84E4'
        ),
        JSON_OBJECT(
            'index', 2,
            'instruction', 'Sprinkle feta cheese on top of the vegetable mixture.',
            'instructionPictureUrl1', 'instruction_picture_url_1_20241206213401_2C9896D1-C6B1-425A-A9D1-8CFD422A0CEE',
            'instructionPictureUrl2', 'instruction_picture_url_2_20241206213404_1F68B969-E2AA-47E2-BBA5-79783C605116',
            'instructionPictureUrl3', 'instruction_picture_url_3_20241206213407_7DA4F16A-89ED-40EF-9568-1FA9CC5683E9'
        ),
        JSON_OBJECT(
            'index', 3,
            'instruction', 'In a small bowl, whisk together red wine vinegar, salt, and pepper to create a dressing.',
            'instructionPictureUrl1', 'instruction_picture_url_1_20241206213409_EF7181CF-E9C6-454A-B809-8C2FBD1498EA',
            'instructionPictureUrl2', 'instruction_picture_url_2_20241206213413_11118A09-89D6-4358-BB01-7F13F6D98792',
            'instructionPictureUrl3', 'instruction_picture_url_3_20241206213416_9B23B205-E82E-4A8A-A019-2953A4B45A32'
        ),
        JSON_OBJECT(
            'index', 4,
            'instruction', 'Pour the dressing over the salad & gently toss everything together to combine. Serve immediately.',
            'instructionPictureUrl1', 'instruction_picture_url_1_20241206213421_98AB764F-488C-419B-821D-F2A1451FB7BB',
            'instructionPictureUrl2', 'instruction_picture_url_2_20241206213427_1C13229B-02A5-4794-A686-D4A1D898FA1C',
            'instructionPictureUrl3', 'instruction_picture_url_3_20241206213431_C3689A6B-3EFC-4F01-B56A-02910FE12E82'
        )
    ),
    0 -- published (false)-- created_at
);

-- Étape 1 : Ajouter une colonne "slug" dans la table "recipes"
ALTER TABLE recipes ADD COLUMN slug VARCHAR(255) NOT NULL;

-- Étape 2 : Générer des slugs pour les recettes existantes
UPDATE recipes
SET slug = LOWER(REPLACE(title, ' ', '-'));

-- Optionnel : Si vous souhaitez éliminer les caractères spéciaux des slugs
-- Vous pouvez adapter cette commande selon le support de REGEXP_REPLACE dans votre version de MySQL
-- UPDATE recipes
-- SET slug = LOWER(REGEXP_REPLACE(title, '[^a-zA-Z0-9]+', '-'));

-- Étape 3 : Ajouter une contrainte d'unicité pour la colonne "slug"
ALTER TABLE recipes ADD CONSTRAINT unique_slug UNIQUE (slug);


SELECT * FROM recipes WHERE published = 1;