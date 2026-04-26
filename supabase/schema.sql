-- ─────────────────────────────────────────────────────────────────────────────
-- TimeFlow Database Schema for Supabase
-- Run this entire file in: Supabase Dashboard → SQL Editor → New Query → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  pin_hash    VARCHAR(255) NOT NULL,
  role        VARCHAR(20)  NOT NULL DEFAULT 'employee' CHECK (role IN ('admin','employee')),
  avatar      VARCHAR(10)  NOT NULL DEFAULT '',
  email       VARCHAR(255) NOT NULL DEFAULT '',
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Sessions table (one per user per day)
CREATE TABLE IF NOT EXISTS sessions (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date        DATE         NOT NULL,
  check_in    TIMESTAMPTZ,
  check_out   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, date)
);

-- Breaks table
CREATE TABLE IF NOT EXISTS breaks (
  id          SERIAL PRIMARY KEY,
  session_id  INTEGER      NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  start_time  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  end_time    TIMESTAMPTZ,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id          SERIAL PRIMARY KEY,
  session_id  INTEGER      NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  status      VARCHAR(20)  NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','paused','completed')),
  total_ms    BIGINT       NOT NULL DEFAULT 0,
  notes       TEXT         NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Task timer logs
CREATE TABLE IF NOT EXISTS task_logs (
  id          SERIAL PRIMARY KEY,
  task_id     INTEGER      NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  start_time  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  end_time    TIMESTAMPTZ
);

-- Monthly reports cache
CREATE TABLE IF NOT EXISTS reports (
  id            SERIAL PRIMARY KEY,
  month         INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year          INTEGER NOT NULL,
  generated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data          JSONB   NOT NULL DEFAULT '{}',
  email_sent    BOOLEAN NOT NULL DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,
  UNIQUE (month, year)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON sessions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_breaks_session     ON breaks(session_id);
CREATE INDEX IF NOT EXISTS idx_tasks_session      ON tasks(session_id);
CREATE INDEX IF NOT EXISTS idx_task_logs_task     ON task_logs(task_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at    ON users;
DROP TRIGGER IF EXISTS trg_sessions_updated_at ON sessions;
DROP TRIGGER IF EXISTS trg_tasks_updated_at    ON tasks;

CREATE TRIGGER trg_users_updated_at    BEFORE UPDATE ON users    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_tasks_updated_at    BEFORE UPDATE ON tasks    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Disable Row Level Security (we use service key + JWT) ───────────────────
ALTER TABLE users     DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions  DISABLE ROW LEVEL SECURITY;
ALTER TABLE breaks    DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks     DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports   DISABLE ROW LEVEL SECURITY;

-- ─── Seed default admin (PIN: 0000) ─────────────────────────────────────────
-- bcrypt hash of "0000" with 10 rounds
INSERT INTO users (name, pin_hash, role, avatar, email)
VALUES (
  'Admin',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'admin',
  'A',
  ''
) ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- Done! Your database is ready. Default admin PIN is: 0000
-- Change it immediately after first login in Admin → Employees
-- ─────────────────────────────────────────────────────────────────────────────
