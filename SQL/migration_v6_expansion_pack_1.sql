-- MIGRATION V6: Expansion Pack 1 - Treasury, Hall of Fame, Match Simulator

-- 1. Financial Transactions Table
CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id text PRIMARY KEY,
    team_id text NOT NULL REFERENCES public.teams(id),
    user_id text REFERENCES public.users(id), -- Optional: payer/payee
    amount numeric(10, 2) NOT NULL,
    type text NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    category text NOT NULL CHECK (category IN ('FEE', 'RENT', 'EQUIPMENT', 'TRAVEL', 'OTHER')),
    description text,
    date text NOT NULL, -- ISO date string from frontend
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Trophies Table
CREATE TABLE IF NOT EXISTS public.trophies (
    id text PRIMARY KEY,
    team_id text REFERENCES public.teams(id),
    player_id text, -- Custom player ID from roster (not user_id)
    name text NOT NULL,
    description text,
    category text NOT NULL CHECK (category IN ('TEAM', 'INDIVIDUAL')),
    date_achieved text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Match Predictions Table
CREATE TABLE IF NOT EXISTS public.match_predictions (
    id text PRIMARY KEY,
    match_id text NOT NULL REFERENCES public.matches(id),
    user_id text NOT NULL REFERENCES public.users(id),
    predicted_home_score int NOT NULL,
    predicted_away_score int NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(match_id, user_id) -- Only one prediction per user per match
);

-- Enable RLS
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.trophies ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.match_predictions ENABLE ROW LEVEL SECURITY;

-- Simple "Enable all for all" policies (matching existing project style)
CREATE POLICY "Enable all access for all users" ON public.financial_transactions FOR ALL USING (true)
WITH
    CHECK (true);

CREATE POLICY "Enable all access for all users" ON public.trophies FOR ALL USING (true)
WITH
    CHECK (true);

CREATE POLICY "Enable all access for all users" ON public.match_predictions FOR ALL USING (true)
WITH
    CHECK (true);