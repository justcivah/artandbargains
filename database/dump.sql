-- Create article_types table
CREATE TABLE article_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- Create periods table
CREATE TABLE periods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- Create categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    article_type_id INTEGER NOT NULL REFERENCES article_types(id) ON DELETE RESTRICT
);

-- Create articles table
CREATE TABLE articles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    year INTEGER CHECK (year > 0),
    author VARCHAR(255),
    size VARCHAR(100),
    medium VARCHAR(100),
    condition VARCHAR(50) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) CHECK (price >= 0),
    article_type_id INTEGER NOT NULL REFERENCES article_types(id) ON DELETE RESTRICT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    period_id INTEGER REFERENCES periods(id) ON DELETE SET NULL
);

-- Create images table
CREATE TABLE images (
    id SERIAL PRIMARY KEY,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    url VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE
);

-- Add a constraint to ensure each article has at most one primary image
CREATE UNIQUE INDEX idx_primary_image ON images (article_id) WHERE is_primary = TRUE;

-- Create inventory table
CREATE TABLE inventory (
    article_id INTEGER PRIMARY KEY REFERENCES articles(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0)
);

-- Create function to enforce category belongs to article type
CREATE OR REPLACE FUNCTION check_category_article_type()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.category_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM categories c
            WHERE c.id = NEW.category_id AND c.article_type_id = NEW.article_type_id
        ) THEN
            RAISE EXCEPTION 'Category does not belong to the article''s article type';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to execute the function before insert or update
CREATE TRIGGER check_category_article_type_trigger
BEFORE INSERT OR UPDATE ON articles
FOR EACH ROW EXECUTE FUNCTION check_category_article_type();

-- Add indexes for performance
CREATE INDEX idx_articles_article_type_id ON articles (article_type_id);
CREATE INDEX idx_articles_category_id ON articles (category_id);
CREATE INDEX idx_articles_period_id ON articles (period_id);
CREATE INDEX idx_images_article_id ON images (article_id);

-- Insert initial data
INSERT INTO article_types (name) VALUES 
('Prints'), 
('Porcelains'), 
('Vintage Furnishings');

INSERT INTO periods (name) VALUES 
('16th century'),
('17th century'),
('18th century'),
('19th century'),
('20th century');

INSERT INTO categories (name, article_type_id) VALUES 
('Maps', (SELECT id FROM article_types WHERE name = 'Prints')),
('Animals', (SELECT id FROM article_types WHERE name = 'Prints')),
('Botany', (SELECT id FROM article_types WHERE name = 'Prints')),
('Japanese Woodblock', (SELECT id FROM article_types WHERE name = 'Prints')),
('Poster', (SELECT id FROM article_types WHERE name = 'Prints'));
