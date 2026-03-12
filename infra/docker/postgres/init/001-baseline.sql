-- Deterministic local baseline seed for integration compose stack.
-- Executed once on first DB init (docker-entrypoint-initdb.d).

CREATE SCHEMA IF NOT EXISTS bootstrap;

CREATE TABLE IF NOT EXISTS bootstrap.seed_info (
  id INTEGER PRIMARY KEY,
  seed_version TEXT NOT NULL,
  seeded_at TIMESTAMPTZ NOT NULL,
  seeded_by TEXT NOT NULL
);

INSERT INTO bootstrap.seed_info (id, seed_version, seeded_at, seeded_by)
VALUES (1, 'local-baseline-v1', '2026-03-12T00:00:00Z', 'infra/docker/postgres/init/001-baseline.sql')
ON CONFLICT (id) DO UPDATE
SET
  seed_version = EXCLUDED.seed_version,
  seeded_at = EXCLUDED.seeded_at,
  seeded_by = EXCLUDED.seeded_by;
