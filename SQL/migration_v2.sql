-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. Enable Location Standardisation
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS city text;

ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS city text;

ALTER TABLE public.arenas ADD COLUMN IF NOT EXISTS city text;

-- 2. Add Detailed Stats fields
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS detailed_stats jsonb DEFAULT '{}'::jsonb;

ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS detailed_stats jsonb DEFAULT '{}'::jsonb;

-- 3. Create Player Evaluations Table
CREATE TABLE IF NOT EXISTS public.player_evaluations (
    id text PRIMARY KEY,
    player_id text NOT NULL,
    evaluator_id text NOT NULL,
    match_id text,
    rating int CHECK (rating >= 0 AND rating <= 10),
    technical_score int,
    tactical_score int,
    physical_score int,
    mental_score int,
    comments text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable RLS for Evaluations
ALTER TABLE public.player_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for all users" ON public.player_evaluations FOR ALL USING (true)
WITH
    CHECK (true);