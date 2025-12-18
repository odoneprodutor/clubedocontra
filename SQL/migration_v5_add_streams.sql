-- Add streams column to matches table to support multiple stream providers (YouTube, Twitch, Agora)
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS streams JSONB DEFAULT '[]'::jsonb;

-- Comment on column
COMMENT ON COLUMN matches.streams IS 'Array of stream objects {id, provider, identifier, label}';