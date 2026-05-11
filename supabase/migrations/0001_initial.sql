-- LeadHawk Phase 8: Initial schema with Row-Level Security.
--
-- Design notes:
--   * One row per (user_id, app_id) for collections that are 1:1 with the
--     user (positioning, profile). One row per (user_id, item_id) for
--     collections that are 1:many.
--   * `data` is jsonb so the schema mirrors the TypeScript types without
--     per-field columns we'd have to migrate every time the model evolves.
--     RLS still works (auth.uid() = user_id) and the indexed queries we
--     care about (lead by id, signals for lead) read from generated columns
--     where needed.
--   * Every table has updated_at + a trigger to auto-update it. Sync layer
--     uses this for last-write-wins conflict resolution.
--   * RLS is ENABLED on every table; policies allow only the owner to read
--     and write their own rows.
--
-- Run order:
--   1. Open Supabase SQL Editor.
--   2. Paste this whole file.
--   3. Execute.

-- =====================================================================
-- Helpers
-- =====================================================================

CREATE OR REPLACE FUNCTION lh_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- Dev reset (safe to re-run in development).
-- Drops every table this migration owns + any leftover from an earlier
-- conflicting migration (e.g. linkedin_posts), so the canonical schema
-- below always applies cleanly. CASCADE removes attached triggers,
-- indexes and RLS policies in one shot.
--
-- !! DO NOT INCLUDE THIS BLOCK IN A PRODUCTION MIGRATION !!
-- =====================================================================

DROP TABLE IF EXISTS
  user_positioning,
  user_profile,
  pipeline_leads,
  lead_research,
  intent_signals,
  watchlist_accounts,
  warm_contacts,
  lead_filters,
  posts,
  linkedin_posts,
  tweets,
  twitter_threads,
  sequences,
  growth_plans,
  twitter_growth_plans,
  message_outcomes
CASCADE;

-- =====================================================================
-- 1:1 collections (one row per user)
-- =====================================================================

CREATE TABLE IF NOT EXISTS user_positioning (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  data       jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_user_positioning_updated_at BEFORE UPDATE ON user_positioning
  FOR EACH ROW EXECUTE FUNCTION lh_set_updated_at();

CREATE TABLE IF NOT EXISTS user_profile (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  data       jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_user_profile_updated_at BEFORE UPDATE ON user_profile
  FOR EACH ROW EXECUTE FUNCTION lh_set_updated_at();

-- =====================================================================
-- 1:many collections (many rows per user). `item_id` is the client-
-- generated id (so the client can write before knowing the server id),
-- and (user_id, item_id) is the natural primary key.
-- =====================================================================

CREATE TABLE IF NOT EXISTS pipeline_leads (
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id    text NOT NULL,
  data       jsonb NOT NULL,
  -- Generated columns for indexed queries
  stage      text GENERATED ALWAYS AS (data->>'stage') STORED,
  icp_tag    text GENERATED ALWAYS AS (data->>'icpTag') STORED,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);
CREATE INDEX IF NOT EXISTS idx_pipeline_leads_user_stage ON pipeline_leads (user_id, stage);
CREATE INDEX IF NOT EXISTS idx_pipeline_leads_user_icp   ON pipeline_leads (user_id, icp_tag);
CREATE TRIGGER trg_pipeline_leads_updated_at BEFORE UPDATE ON pipeline_leads
  FOR EACH ROW EXECUTE FUNCTION lh_set_updated_at();

CREATE TABLE IF NOT EXISTS lead_research (
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id    text NOT NULL,
  data       jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);
CREATE TRIGGER trg_lead_research_updated_at BEFORE UPDATE ON lead_research
  FOR EACH ROW EXECUTE FUNCTION lh_set_updated_at();

CREATE TABLE IF NOT EXISTS intent_signals (
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id    text NOT NULL,
  data       jsonb NOT NULL,
  -- Indexed: signals for lead, signals for watchlist account
  lead_id              text GENERATED ALWAYS AS (data->>'leadId') STORED,
  watchlist_account_id text GENERATED ALWAYS AS (data->>'watchlistAccountId') STORED,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);
CREATE INDEX IF NOT EXISTS idx_intent_signals_user_lead       ON intent_signals (user_id, lead_id);
CREATE INDEX IF NOT EXISTS idx_intent_signals_user_watchlist  ON intent_signals (user_id, watchlist_account_id);
CREATE TRIGGER trg_intent_signals_updated_at BEFORE UPDATE ON intent_signals
  FOR EACH ROW EXECUTE FUNCTION lh_set_updated_at();

CREATE TABLE IF NOT EXISTS watchlist_accounts (
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id    text NOT NULL,
  data       jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);
CREATE TRIGGER trg_watchlist_accounts_updated_at BEFORE UPDATE ON watchlist_accounts
  FOR EACH ROW EXECUTE FUNCTION lh_set_updated_at();

CREATE TABLE IF NOT EXISTS warm_contacts (
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id    text NOT NULL,
  data       jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);
CREATE TRIGGER trg_warm_contacts_updated_at BEFORE UPDATE ON warm_contacts
  FOR EACH ROW EXECUTE FUNCTION lh_set_updated_at();

CREATE TABLE IF NOT EXISTS lead_filters (
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id    text NOT NULL,
  data       jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);
CREATE TRIGGER trg_lead_filters_updated_at BEFORE UPDATE ON lead_filters
  FOR EACH ROW EXECUTE FUNCTION lh_set_updated_at();

CREATE TABLE IF NOT EXISTS posts (
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id    text NOT NULL,
  data       jsonb NOT NULL,
  icp_tag    text GENERATED ALWAYS AS (data->>'icpTag') STORED,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);
CREATE INDEX IF NOT EXISTS idx_posts_user_icp ON posts (user_id, icp_tag);
CREATE TRIGGER trg_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION lh_set_updated_at();

CREATE TABLE IF NOT EXISTS tweets (
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id    text NOT NULL,
  data       jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);
CREATE TRIGGER trg_tweets_updated_at BEFORE UPDATE ON tweets
  FOR EACH ROW EXECUTE FUNCTION lh_set_updated_at();

CREATE TABLE IF NOT EXISTS twitter_threads (
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id    text NOT NULL,
  data       jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);
CREATE TRIGGER trg_twitter_threads_updated_at BEFORE UPDATE ON twitter_threads
  FOR EACH ROW EXECUTE FUNCTION lh_set_updated_at();

CREATE TABLE IF NOT EXISTS sequences (
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id    text NOT NULL,
  data       jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);
CREATE TRIGGER trg_sequences_updated_at BEFORE UPDATE ON sequences
  FOR EACH ROW EXECUTE FUNCTION lh_set_updated_at();

CREATE TABLE IF NOT EXISTS growth_plans (
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id    text NOT NULL,
  data       jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);
CREATE TRIGGER trg_growth_plans_updated_at BEFORE UPDATE ON growth_plans
  FOR EACH ROW EXECUTE FUNCTION lh_set_updated_at();

CREATE TABLE IF NOT EXISTS twitter_growth_plans (
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id    text NOT NULL,
  data       jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);
CREATE TRIGGER trg_twitter_growth_plans_updated_at BEFORE UPDATE ON twitter_growth_plans
  FOR EACH ROW EXECUTE FUNCTION lh_set_updated_at();

CREATE TABLE IF NOT EXISTS message_outcomes (
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id    text NOT NULL,
  data       jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);
CREATE TRIGGER trg_message_outcomes_updated_at BEFORE UPDATE ON message_outcomes
  FOR EACH ROW EXECUTE FUNCTION lh_set_updated_at();

-- =====================================================================
-- Row-Level Security: every table is private to its owner.
-- =====================================================================

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN VALUES
    ('user_positioning'), ('user_profile'),
    ('pipeline_leads'), ('lead_research'),
    ('intent_signals'), ('watchlist_accounts'),
    ('warm_contacts'), ('lead_filters'),
    ('posts'), ('tweets'), ('twitter_threads'),
    ('sequences'), ('growth_plans'), ('twitter_growth_plans'),
    ('message_outcomes')
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);

    -- Drop and recreate so the script is re-runnable
    EXECUTE format('DROP POLICY IF EXISTS owner_select ON %I', tbl);
    EXECUTE format('CREATE POLICY owner_select ON %I FOR SELECT USING (user_id = auth.uid())', tbl);

    EXECUTE format('DROP POLICY IF EXISTS owner_insert ON %I', tbl);
    EXECUTE format('CREATE POLICY owner_insert ON %I FOR INSERT WITH CHECK (user_id = auth.uid())', tbl);

    EXECUTE format('DROP POLICY IF EXISTS owner_update ON %I', tbl);
    EXECUTE format('CREATE POLICY owner_update ON %I FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())', tbl);

    EXECUTE format('DROP POLICY IF EXISTS owner_delete ON %I', tbl);
    EXECUTE format('CREATE POLICY owner_delete ON %I FOR DELETE USING (user_id = auth.uid())', tbl);
  END LOOP;
END $$;
