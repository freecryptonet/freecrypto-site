export type CashbackKind = "percent" | "sats" | "discount" | "unknown";

export interface ParsedCashback {
  /** Verbatim label as shown by the source, for display. */
  text: string;
  kind: CashbackKind;
  /** Numeric value: percent (2.7), whole sats (38280), or discount amount (5). null if unparseable. */
  value: number | null;
}

function firstNumber(s: string, stripThousands: boolean): number | null {
  const m = s.match(/\d[\d.,]*/);
  if (!m) return null;
  let n = m[0];
  if (stripThousands) n = n.replace(/[.,]/g, ""); // "38.280" -> "38280"
  const parsed = stripThousands ? parseInt(n, 10) : parseFloat(n.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseCashback(raw: string): ParsedCashback {
  const text = (raw ?? "").trim();
  if (!text) return { text, kind: "unknown", value: null };
  const lower = text.toLowerCase();
  const isDiscount = lower.includes("discount") || lower.includes("free") || lower.includes("€");

  if (lower.includes("%")) {
    return { text, kind: isDiscount ? "discount" : "percent", value: firstNumber(text, false) };
  }
  if (lower.includes("sats") || lower.includes("sat ")) {
    return { text, kind: "sats", value: firstNumber(text, true) };
  }
  if (isDiscount) {
    return { text, kind: "discount", value: firstNumber(text, false) };
  }
  return { text, kind: "unknown", value: null };
}
