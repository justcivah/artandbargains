CREATE TABLE article_type (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL
);

CREATE TABLE period (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL
);

CREATE TABLE category (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL
);

CREATE TABLE article (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    year_start INTEGER CHECK (year_start > 0),
    year_end INTEGER CHECK (year_end > 0),
    date_display VARCHAR(100),
    author VARCHAR(255),
    size VARCHAR(100),
    medium VARCHAR(100),
    condition VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) CHECK (price >= 0),
    article_type_id INTEGER NOT NULL REFERENCES article_type(id) ON DELETE RESTRICT,
    period_id INTEGER REFERENCES period(id) ON DELETE SET NULL,
    CONSTRAINT year_range_check CHECK (year_end >= year_start)
);

CREATE TABLE article_category (
    article_id INTEGER NOT NULL REFERENCES article(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES category(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, category_id)
);

CREATE TABLE image (
    id SERIAL PRIMARY KEY,
    article_id INTEGER NOT NULL REFERENCES article(id) ON DELETE CASCADE,
    url VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE
);
CREATE UNIQUE INDEX idx_image_primary ON image(article_id) WHERE is_primary = TRUE;

CREATE TABLE inventory (
    article_id INTEGER PRIMARY KEY REFERENCES article(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0)
);

CREATE OR REPLACE FUNCTION set_period_from_year_range()
RETURNS TRIGGER AS $$
DECLARE
    pid INTEGER;
BEGIN
    IF NEW.period_id IS NOT NULL OR NEW.year_start IS NULL OR NEW.year_end IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT id INTO pid
    FROM period
    WHERE name = CASE
        WHEN (NEW.year_start + NEW.year_end)/2 BETWEEN 1400 AND 1499 THEN '15th century'
        WHEN (NEW.year_start + NEW.year_end)/2 BETWEEN 1500 AND 1599 THEN '16th century'
        WHEN (NEW.year_start + NEW.year_end)/2 BETWEEN 1600 AND 1699 THEN '17th century'
        WHEN (NEW.year_start + NEW.year_end)/2 BETWEEN 1700 AND 1799 THEN '18th century'
        WHEN (NEW.year_start + NEW.year_end)/2 BETWEEN 1800 AND 1899 THEN '19th century'
        WHEN (NEW.year_start + NEW.year_end)/2 BETWEEN 1900 AND 1999 THEN '20th century'
        WHEN (NEW.year_start + NEW.year_end)/2 >= 2000 THEN '21st century'
        ELSE NULL
    END;

    IF pid IS NOT NULL THEN
        NEW.period_id := pid;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_period_from_year_range_trigger
BEFORE INSERT OR UPDATE ON article
FOR EACH ROW EXECUTE FUNCTION set_period_from_year_range();

CREATE INDEX idx_article_type_id ON article(article_type_id);
CREATE INDEX idx_period_id ON article(period_id);
CREATE INDEX idx_year_start ON article(year_start);
CREATE INDEX idx_year_end ON article(year_end);

INSERT INTO article_type (name, display_name) VALUES
  ('prints',              'Prints'),
  ('porcelains',          'Porcelains'),
  ('vintage furnishings', 'Vintage Furnishings');

INSERT INTO period (name, display_name) VALUES
  ('15th century', '15th Century'),
  ('16th century', '16th Century'),
  ('17th century', '17th Century'),
  ('18th century', '18th Century'),
  ('19th century', '19th Century'),
  ('20th century', '20th Century'),
  ('21st century', '21st Century');

INSERT INTO category (name, display_name) VALUES
  ('map',               'Map'),
  ('animal',            'Animal'),
  ('botany',            'Botany'),
  ('japanese woodblock','Japanese Woodblock'),
  ('poster',            'Poster');