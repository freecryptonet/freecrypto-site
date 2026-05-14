-- One-shot cleanup: remove AirdropAlert RSS entries that are actually
-- blog posts / news articles, not airdrop announcements.
--
-- Editorial rows are untouched (primary_source_id != 'airdropalert').

SET @airdropalert_id = (SELECT id FROM sources WHERE slug = 'airdropalert' LIMIT 1);

-- Wipe ALL airdropalert-sourced rows. The next cron run will re-ingest
-- only items that pass the tightened title/URL filter.
DELETE FROM airdrops WHERE primary_source_id = @airdropalert_id;
