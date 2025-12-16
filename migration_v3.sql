-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. Add Scope to Tournaments
ALTER TABLE public.tournaments
ADD COLUMN IF NOT EXISTS scope text DEFAULT 'PARTICULAR';

-- 2. Ensure city exists (redundant safety)
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS city text;