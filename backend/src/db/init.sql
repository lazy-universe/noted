-- Create folders table (self-referencing)
CREATE TABLE IF NOT EXISTS folders (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id INT REFERENCES folders(id) ON DELETE CASCADE
);

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY,
    folder_id INT REFERENCES folders(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    frontmatter JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

-- Create note_tags junction table
CREATE TABLE IF NOT EXISTS note_tags (
    note_id INT REFERENCES notes(id) ON DELETE CASCADE,
    tag_id INT REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY(note_id, tag_id)
);

-- Create note_links junction table
CREATE TABLE IF NOT EXISTS note_links (
    from_note_id INT REFERENCES notes(id) ON DELETE CASCADE,
    to_note_id INT REFERENCES notes(id) ON DELETE CASCADE,
    PRIMARY KEY(from_note_id, to_note_id)
);
