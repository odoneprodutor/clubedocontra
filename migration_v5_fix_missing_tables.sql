-- Create Match Predictions Table
CREATE TABLE IF NOT EXISTS match_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    match_id UUID NOT NULL,
    user_id UUID NOT NULL,
    predicted_home_score INT,
    predicted_away_score INT,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        UNIQUE (match_id, user_id)
);

-- Create Trophies Table
CREATE TABLE IF NOT EXISTS trophies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    team_id UUID,
    player_id TEXT, -- ID local de jogador (p-xxx) ou UUID de usuario
    name TEXT NOT NULL,
    description TEXT,
    category TEXT CHECK (
        category IN ('TEAM', 'INDIVIDUAL')
    ),
    date_achieved TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Ensure Player Evaluations Table exists (checking just in case)
CREATE TABLE IF NOT EXISTS player_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    player_id TEXT NOT NULL,
    evaluator_id UUID NOT NULL,
    match_id UUID,
    rating DECIMAL(3, 1),
    technical_score DECIMAL(3, 1),
    tactical_score DECIMAL(3, 1),
    physical_score DECIMAL(3, 1),
    mental_score DECIMAL(3, 1),
    comments TEXT,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Grant permissions (if needed for public role during dev, usually authenticated is better)
GRANT ALL ON match_predictions TO anon, authenticated, service_role;

GRANT ALL ON trophies TO anon, authenticated, service_role;

GRANT ALL ON player_evaluations TO anon, authenticated, service_role;