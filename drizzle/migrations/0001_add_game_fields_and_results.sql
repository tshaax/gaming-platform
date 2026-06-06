-- Add game and opponent_user_id columns to gaming_sessions
ALTER TABLE gaming_sessions
  ADD COLUMN IF NOT EXISTS game VARCHAR(255),
  ADD COLUMN IF NOT EXISTS opponent_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create index for opponent_user_id
CREATE INDEX IF NOT EXISTS idx_gaming_sessions_opponent_user_id ON gaming_sessions(opponent_user_id);

-- Create game_session_results table
CREATE TABLE IF NOT EXISTS game_session_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES gaming_sessions(id) ON DELETE CASCADE,
  game VARCHAR(255),
  score INTEGER,
  placement INTEGER,
  result VARCHAR(50),
  kills INTEGER NOT NULL DEFAULT 0,
  deaths INTEGER NOT NULL DEFAULT 0,
  assists INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for game_session_results
CREATE INDEX IF NOT EXISTS idx_game_session_results_session_id ON game_session_results(session_id);
