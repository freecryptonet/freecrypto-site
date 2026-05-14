-- One-shot cleanup: delete the noisy DefiLlama ingest results from the
-- first run (CEXes, bridges, wrapped assets, stablecoin issuers).
--
-- Safe: only deletes rows whose primary_source_id maps to the 'defillama'
-- source — editorial rows are untouched.
--
-- After running, re-trigger the GitHub Actions cron workflow to re-ingest
-- with the tightened filter.

SET @defillama_id = (SELECT id FROM sources WHERE slug = 'defillama' LIMIT 1);

-- Delete by name pattern (matches what's in NAME_DENY_PATTERNS in defillama.ts)
DELETE FROM airdrops
WHERE primary_source_id = @defillama_id
  AND (
    LOWER(name) LIKE '%binance%'
    OR LOWER(name) LIKE '%bybit%'
    OR LOWER(name) LIKE '%coinbase%'
    OR LOWER(name) LIKE '%okx%'
    OR LOWER(name) LIKE '%kraken%'
    OR LOWER(name) LIKE '%bitfinex%'
    OR LOWER(name) LIKE '%bitget%'
    OR LOWER(name) LIKE '%bitstamp%'
    OR LOWER(name) LIKE '%bingx%'
    OR LOWER(name) LIKE '%mexc%'
    OR LOWER(name) LIKE '%kucoin%'
    OR LOWER(name) LIKE '%huobi%'
    OR LOWER(name) LIKE '%htx%'
    OR LOWER(name) LIKE '%upbit%'
    OR LOWER(name) LIKE '%gate.io%'
    OR LOWER(name) LIKE '%gemini%'
    OR LOWER(name) LIKE '%crypto.com%'
    OR LOWER(name) LIKE '%bitmex%'
    OR LOWER(name) LIKE '%deribit%'
    OR LOWER(name) LIKE '%phemex%'
    OR LOWER(name) LIKE '%bittrex%'
    OR LOWER(name) LIKE '%robinhood%'
    OR LOWER(name) LIKE '%revolut%'
    OR LOWER(name) LIKE '%figure markets%'
    OR LOWER(name) LIKE '%bridge%'
    OR LOWER(name) LIKE '%wrapped%'
    OR LOWER(name) LIKE '%staked eth%'
    OR LOWER(name) LIKE '%staked sol%'
    OR LOWER(name) LIKE '%staked btc%'
    OR LOWER(name) LIKE '%liquid staking%'
    OR LOWER(name) LIKE '%lst%'
    OR LOWER(name) LIKE '%usdt0%'
    OR LOWER(name) LIKE '%usyc%'
    OR LOWER(name) LIKE '%usdc.%'
  );

-- For a fully clean slate before re-ingest, also remove all remaining
-- DefiLlama-source rows so the tightened filter re-runs from scratch.
DELETE FROM airdrops WHERE primary_source_id = @defillama_id;
