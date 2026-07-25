-- freecrypto.net — 008: allow faqs to belong to a store instead of an airdrop.
-- 007 added faqs.store_id but airdrop_id was still NOT NULL, so store FAQs
-- (store_id set, airdrop_id NULL) failed to insert. Make airdrop_id nullable.
-- The existing FK (fk_faq_airdrop, ON DELETE CASCADE) permits NULL.
SET NAMES utf8mb4;

ALTER TABLE faqs MODIFY COLUMN airdrop_id INT NULL;
