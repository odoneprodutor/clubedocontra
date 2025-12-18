-- Migration to add styling columns to teams table
ALTER TABLE teams
ADD COLUMN IF NOT EXISTS primary_color TEXT,
ADD COLUMN IF NOT EXISTS secondary_color TEXT,
ADD COLUMN IF NOT EXISTS tertiary_color TEXT,
ADD COLUMN IF NOT EXISTS cover TEXT,
ADD COLUMN IF NOT EXISTS profile_picture TEXT;