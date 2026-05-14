-- One-shot backfill: assign a deterministic visit_code to every airdrop
-- row that has a project_url but no primary_cta_visit_code yet (i.e. the
-- 17 airdrops.io + 40 DefiLlama rows ingested before the upsert.ts fix).
--
-- Matches the JS implementation:
--   crypto.createHash('sha256').update('v1:' + slug).digest('base64url').slice(0,8)
-- expressed in MySQL:
--   SUBSTRING(REPLACE(REPLACE(REPLACE(
--     TO_BASE64(UNHEX(SHA2(CONCAT('v1:', slug), 256))), '+', '-'), '/', '_'), '=', ''),
--   1, 8)

-- 1. Set the visit code on each airdrop row that's missing one.
UPDATE airdrops
SET primary_cta_visit_code = SUBSTRING(
  REPLACE(REPLACE(REPLACE(
    TO_BASE64(UNHEX(SHA2(CONCAT('v1:', slug), 256))),
    '+', '-'),
    '/', '_'),
    '=', ''),
  1, 8)
WHERE primary_cta_visit_code IS NULL
  AND project_url IS NOT NULL
  AND deleted_at IS NULL;

-- 2. Create the visit_codes mapping rows so /visit/[code] resolves.
INSERT INTO visit_codes (code, target_url, airdrop_id, source_label)
SELECT
  a.primary_cta_visit_code,
  a.project_url,
  a.id,
  CONCAT('ingest-', COALESCE(s.slug, 'unknown'))
FROM airdrops a
LEFT JOIN sources s ON s.id = a.primary_source_id
WHERE a.primary_cta_visit_code IS NOT NULL
  AND a.project_url IS NOT NULL
  AND a.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM visit_codes vc WHERE vc.code = a.primary_cta_visit_code
  )
ON DUPLICATE KEY UPDATE
  target_url = VALUES(target_url),
  airdrop_id = VALUES(airdrop_id),
  source_label = VALUES(source_label);

-- 3. Sanity-check report (returned as the last result).
SELECT
  (SELECT COUNT(*) FROM airdrops WHERE primary_cta_visit_code IS NOT NULL AND deleted_at IS NULL) AS airdrops_with_code,
  (SELECT COUNT(*) FROM airdrops WHERE primary_cta_visit_code IS NULL AND deleted_at IS NULL) AS airdrops_missing_code,
  (SELECT COUNT(*) FROM visit_codes) AS visit_code_rows;
