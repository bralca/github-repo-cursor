-- Migration: 012_add_placeholder_fields.sql
-- Description: Adds placeholder flags to contributors and commits tables

-- Add is_placeholder to contributors table
ALTER TABLE contributors 
ADD COLUMN IF NOT EXISTS is_placeholder BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN contributors.is_placeholder IS 'Indicates if this is a placeholder contributor with unknown GitHub username';

-- Add is_placeholder_author to commits table
ALTER TABLE commits 
ADD COLUMN IF NOT EXISTS is_placeholder_author BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN commits.is_placeholder_author IS 'Indicates if the author is a placeholder with unknown GitHub username';

-- Update existing placeholder records if applicable
UPDATE contributors
SET is_placeholder = TRUE
WHERE username = 'unknown' OR username = 'placeholder' OR username LIKE 'placeholder-%';

-- Update existing commits with placeholder authors if applicable
UPDATE commits
SET is_placeholder_author = TRUE
WHERE author = 'unknown' OR author = 'placeholder' OR author LIKE 'placeholder-%'; 