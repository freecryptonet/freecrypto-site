-- Add airdrops.io as a new source row (the cron ingest needs the source
-- row to already exist; upsertNormalized auto-creates if missing but we
-- add it here for completeness + correct human-readable name/URL).

INSERT INTO sources (slug, name, url)
VALUES ('airdropsio', 'airdrops.io', 'https://airdrops.io')
ON DUPLICATE KEY UPDATE name = VALUES(name), url = VALUES(url);
