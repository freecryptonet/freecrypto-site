-- freecrypto.net — 007: shop-to-earn stores (earn-hub pivot Phase 1)
-- Idempotent: CREATE IF NOT EXISTS; column add guarded below.
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS stores (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  slug              VARCHAR(120) NOT NULL,
  name              VARCHAR(180) NOT NULL,
  logo_url          VARCHAR(500) NULL,
  satsback_slug     VARCHAR(160) NULL,
  cashback_text     VARCHAR(120) NULL,
  cashback_kind     ENUM('percent','sats','discount','unknown') NOT NULL DEFAULT 'unknown',
  cashback_value    DECIMAL(10,3) NULL,
  category_slug     VARCHAR(60) NULL,
  geo_scope         ENUM('global','eu','nl','other') NOT NULL DEFAULT 'global',
  is_bitcoin_native TINYINT(1) NOT NULL DEFAULT 0,
  description_md    MEDIUMTEXT NOT NULL DEFAULT '',
  how_it_works_md   MEDIUMTEXT NOT NULL DEFAULT '',
  worth_it_md       MEDIUMTEXT NOT NULL DEFAULT '',
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at        DATETIME NULL,
  UNIQUE KEY uniq_store_slug (slug),
  KEY idx_store_category (category_slug),
  KEY idx_store_geo (geo_scope)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- store_categories (our own taxonomy for shop hubs)
CREATE TABLE IF NOT EXISTS store_categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  slug        VARCHAR(60)  NOT NULL,
  name        VARCHAR(120) NOT NULL,
  description TEXT NULL,
  sort_order  INT NOT NULL DEFAULT 100,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_store_category_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add faqs.store_id so the existing faqs table serves stores too.
-- Guard the ADD COLUMN so re-running is safe on MariaDB.
SET @col := (SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'faqs' AND column_name = 'store_id');
SET @ddl := IF(@col = 0,
  'ALTER TABLE faqs ADD COLUMN store_id INT NULL, ADD KEY idx_faq_store (store_id, position)',
  'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
