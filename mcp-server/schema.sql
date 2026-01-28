-- MCP Vector DB Schema v2.0 (Simplified - No Vector Extension)
-- Minimal design: 2 tables, in-memory vector similarity

-- Patterns table: Successful code patterns
CREATE TABLE IF NOT EXISTS patterns (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  tech_stack TEXT NOT NULL,
  success_rate REAL DEFAULT 0.5
);

CREATE INDEX IF NOT EXISTS idx_patterns_tech_stack ON patterns(tech_stack);

-- Error fixes table: Error → fix mappings
CREATE TABLE IF NOT EXISTS error_fixes (
  id TEXT PRIMARY KEY,
  error_message TEXT NOT NULL,
  fix_code TEXT NOT NULL,
  tech_stack TEXT NOT NULL,
  success_rate REAL DEFAULT 0.5
);

CREATE INDEX IF NOT EXISTS idx_error_fixes_tech_stack ON error_fixes(tech_stack);

-- Migration tracking
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

-- Insert initial migration
INSERT OR IGNORE INTO schema_migrations (version, applied_at)
VALUES (2, datetime('now'));
