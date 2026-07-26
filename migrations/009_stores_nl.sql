-- freecrypto.net — 009: Dutch (nl) store content for the Phase 2 NL cluster.
-- Satsback's inventory is NL-heavy and the Dutch "[winkel] bitcoin cashback"
-- SERP is uncontested. Parallel nl content columns keep the en and nl
-- clusters cleanly separated (served at /shop vs /nl/shop, linked by hreflang).
SET NAMES utf8mb4;

-- Add nl content columns (guarded so re-runs are safe on MariaDB).
SET @c1 := (SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'stores' AND column_name = 'description_nl_md');
SET @ddl1 := IF(@c1 = 0,
  'ALTER TABLE stores
     ADD COLUMN description_nl_md  MEDIUMTEXT NOT NULL DEFAULT '''',
     ADD COLUMN how_it_works_nl_md MEDIUMTEXT NOT NULL DEFAULT '''',
     ADD COLUMN worth_it_nl_md     MEDIUMTEXT NOT NULL DEFAULT ''''',
  'SELECT 1');
PREPARE s1 FROM @ddl1; EXECUTE s1; DEALLOCATE PREPARE s1;

-- Tag FAQs by language so store pages can carry en and nl FAQs independently.
SET @c2 := (SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'faqs' AND column_name = 'lang');
SET @ddl2 := IF(@c2 = 0,
  'ALTER TABLE faqs ADD COLUMN lang VARCHAR(5) NOT NULL DEFAULT ''en'', ADD KEY idx_faq_lang (store_id, lang, position)',
  'SELECT 1');
PREPARE s2 FROM @ddl2; EXECUTE s2; DEALLOCATE PREPARE s2;
