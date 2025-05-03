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

-- Create articles table with date range support
CREATE TABLE articles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    year_start INTEGER CHECK (year_start > 0),
    year_end INTEGER CHECK (year_end > 0),
    date_display VARCHAR(100),
    author VARCHAR(255),
    size VARCHAR(100),
    medium VARCHAR(100),
    condition VARCHAR(50) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) CHECK (price >= 0),
    article_type_id INTEGER NOT NULL REFERENCES article_types(id) ON DELETE RESTRICT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    period_id INTEGER REFERENCES periods(id) ON DELETE SET NULL,
    CONSTRAINT year_range_check CHECK (year_end >= year_start)
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

-- Create function to automatically set period based on year range
CREATE OR REPLACE FUNCTION set_period_from_year_range()
RETURNS TRIGGER AS $$
DECLARE
    period_id_var INTEGER;
BEGIN
    -- Skip if period is explicitly set
    IF NEW.period_id IS NOT NULL THEN
        RETURN NEW;
    END IF;
    
    -- Skip if both year_start and year_end are null
    IF NEW.year_start IS NULL OR NEW.year_end IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Find the period based on the average of year_start and year_end
    -- This is a simplified approach, could be made more sophisticated
    SELECT id INTO period_id_var
    FROM periods
    WHERE name = 
        CASE 
            WHEN (NEW.year_start + NEW.year_end) / 2 BETWEEN 1500 AND 1599 THEN '16th century'
            WHEN (NEW.year_start + NEW.year_end) / 2 BETWEEN 1600 AND 1699 THEN '17th century'
            WHEN (NEW.year_start + NEW.year_end) / 2 BETWEEN 1700 AND 1799 THEN '18th century'
            WHEN (NEW.year_start + NEW.year_end) / 2 BETWEEN 1800 AND 1899 THEN '19th century'
            WHEN (NEW.year_start + NEW.year_end) / 2 BETWEEN 1900 AND 1999 THEN '20th century'
            ELSE NULL
        END;
    
    IF period_id_var IS NOT NULL THEN
        NEW.period_id := period_id_var;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set period
CREATE TRIGGER set_period_from_year_range_trigger
BEFORE INSERT OR UPDATE ON articles
FOR EACH ROW EXECUTE FUNCTION set_period_from_year_range();

-- Add indexes for performance
CREATE INDEX idx_articles_article_type_id ON articles (article_type_id);
CREATE INDEX idx_articles_category_id ON articles (category_id);
CREATE INDEX idx_articles_period_id ON articles (period_id);
CREATE INDEX idx_articles_year_start ON articles (year_start);
CREATE INDEX idx_articles_year_end ON articles (year_end);
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