/**
 * Source adapter contract. Each external feed (DefiLlama, AirdropAlert,
 * CryptoRank, CMC, etc.) implements this interface. The cron entrypoint
 * walks every enabled source, normalizes the rows, and upserts them.
 *
 * Convention: never let an adapter throw past its boundary. On failure,
 * return [] and log — never crash the cron mid-pipeline.
 */
import type { AirdropStatus } from "@/lib/db";

export interface NormalizedAirdrop {
  /**
   * Stable identifier derived from the source. Combined with the source slug,
   * this is what we hash to detect dupes across sources.
   *   "ingest-defillama-zircuit"   (DefiLlama protocol id)
   *   "ingest-airdropalert-12345"  (AirdropAlert RSS guid)
   * Different sources reporting the same project keep separate external_ids
   * but should resolve to the same suggested_slug after fuzzy-match.
   */
  external_id: string;

  /** Source-recommended slug (we'll fuzzy-match against existing rows). */
  suggested_slug: string;

  /** Human name as reported. */
  name: string;

  token_symbol?: string | null;
  logo_url?: string | null;
  short_description?: string | null;
  description_md?: string | null;
  eligibility_md?: string | null;
  how_to_claim_md?: string | null;

  /** Chain slug as we know it; null if source's chain isn't mapped. */
  chain_slug?: string | null;
  /** Category slug we infer; defaults to "potential" cohort upstream. */
  category_slug?: string | null;

  status?: AirdropStatus;
  kyc_required?: boolean;
  funding_raised_usd?: number | null;
  estimated_value_usd_min?: number | null;
  estimated_value_usd_max?: number | null;
  social_score?: number | null;

  project_url?: string | null;
  twitter_url?: string | null;
  discord_url?: string | null;

  started_at?: Date | null;
  snapshot_date?: Date | null;
  end_date?: Date | null;
}

export interface SourceAdapter {
  /** Matches sources.slug in the DB. */
  slug: string;
  /** Human label for log output. */
  name: string;
  /** Fetch + normalize. Return [] on any non-fatal failure. */
  fetch(): Promise<NormalizedAirdrop[]>;
}

export interface IngestStats {
  source: string;
  fetched: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
  durationMs: number;
}
