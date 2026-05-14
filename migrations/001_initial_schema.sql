-- freecrypto.net — initial schema (MariaDB 10.6+)
-- Idempotent: every CREATE uses IF NOT EXISTS, every INSERT uses INSERT IGNORE.
-- Apply via: npm run migrate

SET NAMES utf8mb4;

-- ============================================================
-- chains
-- ============================================================
CREATE TABLE IF NOT EXISTS chains (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  slug          VARCHAR(60)  NOT NULL,
  name          VARCHAR(120) NOT NULL,
  description   TEXT NULL,
  logo_url      VARCHAR(500) NULL,
  sort_order    INT NOT NULL DEFAULT 100,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_chain_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- categories  (retroactive, testnet, holder, points, task-based, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  slug          VARCHAR(60)  NOT NULL,
  name          VARCHAR(120) NOT NULL,
  description   TEXT NULL,
  sort_order    INT NOT NULL DEFAULT 100,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_category_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- sources  (where we ingested data from — for attribution + dedupe)
-- ============================================================
CREATE TABLE IF NOT EXISTS sources (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  slug          VARCHAR(60)  NOT NULL,
  name          VARCHAR(120) NOT NULL,
  url           VARCHAR(500) NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_source_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- airdrops  (the main table)
-- ============================================================
CREATE TABLE IF NOT EXISTS airdrops (
  id                          INT AUTO_INCREMENT PRIMARY KEY,
  slug                        VARCHAR(120) NOT NULL,
  name                        VARCHAR(180) NOT NULL,
  token_symbol                VARCHAR(20)  NULL,
  logo_url                    VARCHAR(500) NULL,
  short_description           VARCHAR(280) NULL,
  description_md              MEDIUMTEXT NOT NULL DEFAULT '',
  eligibility_md              MEDIUMTEXT NOT NULL DEFAULT '',
  how_to_claim_md             MEDIUMTEXT NOT NULL DEFAULT '',

  status                      ENUM('confirmed','potential','snapshot','live','ended')
                                NOT NULL DEFAULT 'potential',
  chain_id                    INT NULL,
  category_id                 INT NULL,
  primary_source_id           INT NULL,

  kyc_required                TINYINT(1) NOT NULL DEFAULT 0,
  funding_raised_usd          BIGINT NULL,
  estimated_value_usd_min     INT NULL,
  estimated_value_usd_max     INT NULL,
  social_score                SMALLINT NULL,        -- 0-100 normalized

  project_url                 VARCHAR(500) NULL,
  twitter_url                 VARCHAR(500) NULL,
  discord_url                 VARCHAR(500) NULL,

  primary_cta_visit_code      VARCHAR(20) NULL,

  started_at                  DATETIME NULL,
  snapshot_date               DATETIME NULL,
  end_date                    DATETIME NULL,

  created_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at                  DATETIME NULL,

  UNIQUE KEY uniq_airdrop_slug (slug),
  KEY idx_chain      (chain_id),
  KEY idx_category   (category_id),
  KEY idx_status     (status),
  KEY idx_end_date   (end_date),
  KEY idx_updated    (updated_at),
  CONSTRAINT fk_airdrop_chain    FOREIGN KEY (chain_id)         REFERENCES chains(id)     ON DELETE SET NULL,
  CONSTRAINT fk_airdrop_category FOREIGN KEY (category_id)      REFERENCES categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_airdrop_source   FOREIGN KEY (primary_source_id) REFERENCES sources(id)   ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- tags + airdrop_tags  (many-to-many free-form tagging)
-- ============================================================
CREATE TABLE IF NOT EXISTS tags (
  id    INT AUTO_INCREMENT PRIMARY KEY,
  slug  VARCHAR(60) NOT NULL,
  name  VARCHAR(120) NOT NULL,
  UNIQUE KEY uniq_tag_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS airdrop_tags (
  airdrop_id INT NOT NULL,
  tag_id     INT NOT NULL,
  PRIMARY KEY (airdrop_id, tag_id),
  CONSTRAINT fk_at_airdrop FOREIGN KEY (airdrop_id) REFERENCES airdrops(id) ON DELETE CASCADE,
  CONSTRAINT fk_at_tag     FOREIGN KEY (tag_id)     REFERENCES tags(id)     ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- faqs  (per-airdrop FAQ entries, ordered)
-- ============================================================
CREATE TABLE IF NOT EXISTS faqs (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  airdrop_id  INT NOT NULL,
  position    SMALLINT NOT NULL DEFAULT 0,
  question    VARCHAR(280) NOT NULL,
  answer_md   MEDIUMTEXT NOT NULL,
  KEY idx_faq_airdrop (airdrop_id, position),
  CONSTRAINT fk_faq_airdrop FOREIGN KEY (airdrop_id) REFERENCES airdrops(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- visit_codes + click_log  (affiliate redirector at /visit/[code])
-- ============================================================
CREATE TABLE IF NOT EXISTS visit_codes (
  code          VARCHAR(20) NOT NULL PRIMARY KEY,
  target_url    VARCHAR(1000) NOT NULL,
  airdrop_id    INT NULL,
  source_label  VARCHAR(60) NULL,   -- e.g. "binance-ref", "internal-cta"
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_visit_airdrop (airdrop_id),
  CONSTRAINT fk_visit_airdrop FOREIGN KEY (airdrop_id) REFERENCES airdrops(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS click_log (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  code         VARCHAR(20) NOT NULL,
  ip_hash      CHAR(64) NOT NULL,    -- sha256
  referrer     VARCHAR(500) NULL,
  ua_hash      CHAR(64) NOT NULL,
  clicked_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_click_code (code, clicked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- newsletter_subscribers
-- ============================================================
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  email           VARCHAR(320) NOT NULL,
  source          VARCHAR(60)  NULL,   -- "/check", "footer", etc.
  ip_hash         CHAR(64)     NOT NULL,
  confirmed_at    DATETIME NULL,
  unsubscribed_at DATETIME NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_sub_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- known_airdrop_contracts  (seeds /check — verified claim targets)
-- ============================================================
CREATE TABLE IF NOT EXISTS known_airdrop_contracts (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  airdrop_id      INT NOT NULL,
  chain_id        INT NOT NULL,
  contract_addr   VARCHAR(64) NOT NULL,
  method          VARCHAR(40) NOT NULL,  -- e.g. "merkle-distributor", "balance-snapshot", "erc20-balance"
  snapshot_block  BIGINT NULL,
  claim_url       VARCHAR(500) NULL,
  notes           VARCHAR(500) NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_kac_chain_addr (chain_id, contract_addr),
  CONSTRAINT fk_kac_airdrop FOREIGN KEY (airdrop_id) REFERENCES airdrops(id) ON DELETE CASCADE,
  CONSTRAINT fk_kac_chain   FOREIGN KEY (chain_id)   REFERENCES chains(id)   ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- guides  (evergreen SEO content, Markdown body)
-- ============================================================
CREATE TABLE IF NOT EXISTS guides (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  slug          VARCHAR(160) NOT NULL,
  title         VARCHAR(240) NOT NULL,
  excerpt       VARCHAR(400) NULL,
  body_md       MEDIUMTEXT NOT NULL,
  cover_url     VARCHAR(500) NULL,
  published_at  DATETIME NULL,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_guide_slug (slug),
  KEY idx_guide_published (published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
