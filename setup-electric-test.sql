-- Electric SQL Test Setup
-- Run this in your Neon database to create test data

-- Create a simple test table
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert some test data
INSERT INTO items (name, description) VALUES 
  ('Test Item 1', 'This is a test item for Electric SQL'),
  ('Test Item 2', 'Another test item'),
  ('Test Item 3', 'Third test item')
ON CONFLICT (id) DO NOTHING;

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_items_updated_at 
    BEFORE UPDATE ON items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the data
SELECT * FROM items;