-- Create tables for beat-the-buffet app
-- Tables: game_tables, participants, captures

-- Main tables table (stores game sessions)
CREATE TABLE IF NOT EXISTS game_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) UNIQUE NOT NULL,
  table_name TEXT NOT NULL,
  restaurant TEXT NOT NULL,
  city TEXT NOT NULL,
  ayce_price_per_person DECIMAL(10, 2) NOT NULL,
  tax_included BOOLEAN NOT NULL DEFAULT false,
  tip_percent DECIMAL(5, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

-- Participants table
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES game_tables(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Captures table (stores food detection results)
CREATE TABLE IF NOT EXISTS captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES game_tables(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total INTEGER NOT NULL DEFAULT 0,
  counts JSONB NOT NULL DEFAULT '[]',
  pricing JSONB NOT NULL DEFAULT '{}'
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_game_tables_code ON game_tables(code);
CREATE INDEX IF NOT EXISTS idx_participants_table_id ON participants(table_id);
CREATE INDEX IF NOT EXISTS idx_captures_table_id ON captures(table_id);
CREATE INDEX IF NOT EXISTS idx_captures_participant_id ON captures(participant_id);
