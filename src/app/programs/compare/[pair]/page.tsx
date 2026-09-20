import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AAds } from "@/components/AAds";
import { ProgramLogo, ScoreNumber } from "@/components/ProgramCards";
import {
  getOpportunity,
  overallScore,
  getScores,
  getPros,
  officialUrl,
  CATEGORY_META,
  SCORE_CRITERIA,
  COMPARE_PAIRS,
  type Opportunity,
} from "@/lib/opportunities";
import { siteUrl, breadcrumbJsonLd, faqJsonLd, jsonLdScript } from "@/lib/seo";

export const dynamic = "force-static";

export function generateStaticParams() {
  return Object.keys(COMPARE_PAIRS).map((pair) => ({ pair }));
}

function resolve(pair: string): [Opportunity, Opportunity] | null {
  const p = COMPARE_PAIRS[pair];
  if (!p) return null;
  const a = getOpportunity(p[0]);
  const b = getOpportunity(p[1]);
  if (!a || !b) return null;
  return [a, b];
}

export async function generateMetadata(
  { params }: { params: Promise<{ pair: string }> },
): Promise<Metadata> {
  const { pair } = await params;
  const r = resolve(pair);
  if (!r) return {};
  const [a, b] = r;
  const title = `${a.name} vs ${b.name} (2026): Which is better?`;
  const description = `${a.name} vs ${b.name} compared on reward, ease, trust, terms and region — with transparent 0–10 scores and an honest verdict on which to pick.`;
  return { title, description, alternates: { canonical: `/programs/compare/${pair}` } };
}

export default async function ComparePage(
  { params }: { params: Promise<{ pair: string }> },
) {
  const { pair } = await params;
  const r = resolve(pair);
  if (!r) notFound();
  const [a, b] = r;

  const sa = overallScore(a.slug) ?? 0;
  const sb = overallScore(b.slug) ?? 0;
  const winner = sa === sb ? null : sa > sb ? a : b;
  const tone = CATEGORY_META[a.category].tone;
  const accentText = tone === "shop" ? "text-accent-warm" : "text-accent-alt";

  const scoresA = getScores(a.slug);
  const scoresB = getScores(b.slug);

  // Where each side wins, biggest gap first — powers the honest "choose X if…" block.
  const diffs = SCORE_CRITERIA.map((c) => ({
    label: c.label.toLowerCase(),
    va: scoresA?.[c.key] ?? 0,
    vb: scoresB?.[c.key] ?? 0,
  }));
  const aWins = diffs.filter((d) => d.va > d.vb).sort((x, y) => (y.va - y.vb) - (x.va - x.vb));
  const bWins = diffs.filter((d) => d.vb > d.va).sort((x, y) => (y.vb - y.va) - (x.vb - x.va));

  const faqs = [
    {
      question: `Is ${a.name} or ${b.name} better?`,
      answer_md: winner
        ? `On our transparent 0–10 score, ${winner.name} comes out ahead (${overallScore(winner.slug)?.toFixed(1)} vs ${overallScore((winner.slug === a.slug ? b : a).slug)?.toFixed(1)}). But "better" depends on what you want — see the criteria breakdown above; the two programs win on different things.`
        : `They score evenly overall (${sa.toFixed(1)} each) — the right pick depends on which criteria matter most to you. Check the breakdown above.`,
    },
    {
      question: `What's the catch with each?`,
      answer_md: `${a.name}: ${a.catch} ${b.name}: ${b.catch}`,
    },
  ];
  const faq = faqJsonLd(faqs);

  return (
    <div className="mx-auto max-w-page px-4 py-12">
      <nav className="font-mono text-xs text-text-faint mb-6" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-text-dim">Home</Link> /{" "}
        <Link href="/programs" className="hover:text-text-dim">Programs</Link> / {a.name} vs {b.name}
      </nav>

      <header className="max-w-2xl">
        <div className={`h-[3px] w-11 rounded mb-4 ${tone === "shop" ? "bg-accent-warm" : "bg-accent"}`} />
        <h1 className="text-h1-page">{a.name} vs {b.name}: which should you pick?</h1>
        <p className="mt-3 text-lg text-text-dim">
          Both compared on the same five criteria, with transparent scores and the honest catch.
          {winner ? ` Our pick: ${winner.name}.` : " It's a close call."}
        </p>
        <p className="mt-2 font-mono text-xs text-text-faint">
          Reviewed by the freecrypto.net editorial team · scored on fixed criteria · last checked Sep 2026
        </p>
      </header>

      {/* Side by side */}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {[a, b].map((o) => (
          <div key={o.slug} className={`card p-6 ${winner?.slug === o.slug ? (tone === "shop" ? "border-2 border-accent-warm/60" : "border-2 border-accent/60") : ""}`}>
            {winner?.slug === o.slug && (
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-chip text-ink ${tone === "shop" ? "bg-accent-warm" : "bg-accent"} font-mono text-[11px] font-bold uppercase tracking-[0.08em] mb-4`}>
                ★ Our pick
              </div>
            )}
            <div className="flex items-center gap-4">
              <ProgramLogo slug={o.slug} name={o.name} tone={tone} size="lg" />
              <div>
                <h2 className="text-h2 leading-tight">{o.name}</h2>
                <div className={`font-mono text-sm font-bold ${accentText}`}>{o.reward}</div>
              </div>
              <div className="ml-auto"><ScoreNumber slug={o.slug} tone={tone} /></div>
            </div>
            <p className="mt-4 text-sm text-text-dim">{o.blurb}</p>
            <ul className="mt-4 space-y-1.5">
              {getPros(o.slug).map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm">
                  <span className={`${accentText} font-bold`}>✓</span>
                  <span className="text-text-dim">{p}</span>
                </li>
              ))}
              <li className="flex items-start gap-2 text-sm">
                <span className="text-accent-warm font-bold">⚠</span>
                <span className="text-text-dim"><span className="font-semibold text-text">Catch:</span> {o.catch}</span>
              </li>
            </ul>
            {officialUrl(o.slug) && (
              <a
                href={officialUrl(o.slug)!}
                target="_blank"
                rel="sponsored nofollow noopener"
                className={`mt-5 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-btn text-sm font-bold text-ink ${tone === "shop" ? "bg-accent-warm" : "bg-accent"} hover:opacity-90 transition-opacity`}
              >
                Visit {o.name} ↗
              </a>
            )}
            <div className="mt-1.5 text-[10px] text-text-faint">18+ · T&amp;Cs apply · availability varies · affiliate link</div>
          </div>
        ))}
      </div>

      <div className="my-10 flex justify-center"><AAds zone="leaderboard" /></div>

      {/* Criteria head-to-head */}
      {scoresA && scoresB && (
        <section>
          <h2 className="text-h2 mb-4">Score breakdown, criterion by criterion</h2>
          <div className="overflow-x-auto card !p-0">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="bg-ink-muted border-b border-edge text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-text-dim">
                  <th className="py-3 px-4">Criterion</th>
                  <th className="py-3 px-4 text-center">{a.name}</th>
                  <th className="py-3 px-4 text-center">{b.name}</th>
                  <th className="py-3 px-4">Winner</th>
                </tr>
              </thead>
              <tbody>
                {SCORE_CRITERIA.map((c) => {
                  const va = scoresA[c.key];
                  const vb = scoresB[c.key];
                  const w = va === vb ? "Tie" : va > vb ? a.name : b.name;
                  return (
                    <tr key={c.key} className="border-b border-edge last:border-0 even:bg-ink-muted/40">
                      <td className="py-3 px-4 font-medium">{c.label}</td>
                      <td className={`py-3 px-4 text-center font-mono font-bold tabular-nums ${va >= vb ? accentText : "text-text-faint"}`}>{va}</td>
                      <td className={`py-3 px-4 text-center font-mono font-bold tabular-nums ${vb >= va ? accentText : "text-text-faint"}`}>{vb}</td>
                      <td className="py-3 px-4 text-text-dim">{w}</td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-edge font-bold">
                  <td className="py-3 px-4">Overall</td>
                  <td className={`py-3 px-4 text-center font-mono tabular-nums ${sa >= sb ? accentText : "text-text-faint"}`}>{sa.toFixed(1)}</td>
                  <td className={`py-3 px-4 text-center font-mono tabular-nums ${sb >= sa ? accentText : "text-text-faint"}`}>{sb.toFixed(1)}</td>
                  <td className="py-3 px-4">{winner ? winner.name : "Tie"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Which should you choose? */}
      <section className="mt-10 grid gap-4 md:grid-cols-2">
        <div className="card p-6">
          <h3 className="text-h3">Choose {a.name} if…</h3>
          <p className="mt-2 text-sm text-text-dim">
            {aWins.length ? (
              <>you care most about <strong className="text-text">{aWins[0].label}</strong> (it scores {aWins[0].va} vs {aWins[0].vb}){aWins[1] ? <> or <strong className="text-text">{aWins[1].label}</strong></> : null}. {a.blurb}</>
            ) : (
              <>{a.name} matches {b.name} on every criterion — decide on price and country availability. {a.blurb}</>
            )}
          </p>
          <Link href={`/programs/${a.slug}`} className="mt-3 inline-flex text-sm font-bold text-accent hover:underline">Full {a.name} review →</Link>
        </div>
        <div className="card p-6">
          <h3 className="text-h3">Choose {b.name} if…</h3>
          <p className="mt-2 text-sm text-text-dim">
            {bWins.length ? (
              <>you value <strong className="text-text">{bWins[0].label}</strong> more (it scores {bWins[0].vb} vs {bWins[0].va}){bWins[1] ? <> or <strong className="text-text">{bWins[1].label}</strong></> : null}. {b.blurb}</>
            ) : (
              <>{b.name} matches {a.name} across the board — go by fees and where you live. {b.blurb}</>
            )}
          </p>
          <Link href={`/programs/${b.slug}`} className="mt-3 inline-flex text-sm font-bold text-accent hover:underline">Full {b.name} review →</Link>
        </div>
      </section>

      <section className="mt-6 card p-5 bg-ink-muted">
        <p className="text-sm text-text-dim">
          <strong className="text-text">The verdict:</strong>{" "}
          {winner
            ? <>{winner.name} edges it overall ({(winner.slug === a.slug ? sa : sb).toFixed(1)} vs {(winner.slug === a.slug ? sb : sa).toFixed(1)}), but the two win on different criteria — pick by what matters to you.</>
            : <>it&apos;s a genuine tie ({sa.toFixed(1)} each) — decide on the single criterion you care about most.</>}{" "}
          Every score follows the same <Link href="/methodology" className="text-accent hover:underline">5-criteria method</Link>.
        </p>
      </section>

      {/* FAQ */}
      <section className="mt-10 max-w-2xl">
        <h2 className="text-h2 mb-4">Questions</h2>
        <div className="space-y-3">
          {faqs.map((f) => (
            <details key={f.question} className="card p-4">
              <summary className="font-semibold cursor-pointer">{f.question}</summary>
              <p className="mt-2 text-sm text-text-dim">{f.answer_md}</p>
            </details>
          ))}
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbJsonLd([
              { name: "Home", url: siteUrl("/") },
              { name: "Programs", url: siteUrl("/programs") },
              { name: `${a.name} vs ${b.name}`, url: siteUrl(`/programs/compare/${pair}`) },
            ]),
          ),
        }}
      />
      {faq && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(faq) }} />}
    </div>
  );
}
