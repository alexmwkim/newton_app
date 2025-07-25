-- Add missing columns for subpage functionality to notes table
-- Run these commands in Supabase SQL Editor

-- Add is_subpage column to identify subpages
ALTER TABLE notes ADD COLUMN IF NOT EXISTS is_subpage boolean DEFAULT false;

-- Add parent_note_id column for parent-child relationship
ALTER TABLE notes ADD COLUMN IF NOT EXISTS parent_note_id uuid REFERENCES notes(id) ON DELETE CASCADE;

-- Add comment for documentation
COMMENT ON COLUMN notes.is_subpage IS 'Flag to identify if this note is a subpage (child) of another note';
COMMENT ON COLUMN notes.parent_note_id IS 'Reference to parent note ID, NULL for main notes';

-- Create index for better performance when filtering subpages
CREATE INDEX IF NOT EXISTS idx_notes_is_subpage ON notes(is_subpage);
CREATE INDEX IF NOT EXISTS idx_notes_parent_note_id ON notes(parent_note_id);

-- Update existing notes to ensure they are marked as main notes
UPDATE notes SET is_subpage = false WHERE is_subpage IS NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'notes' 
AND column_name IN ('is_subpage', 'parent_note_id')
ORDER BY column_name;