import { getDb } from "@/lib/db";
import { verifyUnsubscribeToken } from "@/lib/email";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ email?: string; t?: string }>;
}

export default async function UnsubscribePage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const email = (sp.email ?? "").toString().trim().toLowerCase();
  const token = (sp.t ?? "").toString();

  let status: "ok" | "invalid" | "error" = "invalid";

  if (email && token && verifyUnsubscribeToken(email, token)) {
    const sql = getDb();
    if (sql) {
      try {
        await sql`
          UPDATE newsletter_subscribers
             SET unsubscribed_at = NOW()
           WHERE email = ${email}
        `;
        status = "ok";
      } catch {
        status = "error";
      }
    } else {
      status = "error";
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      {status === "ok" ? (
        <>
          <h1 className="text-h1-page font-bold">You&apos;re unsubscribed.</h1>
          <p className="mt-3 text-text-dim">
            <span className="font-mono">{email}</span> has been removed from
            the freecrypto.net mailing list. No further emails will be sent.
          </p>
        </>
      ) : status === "error" ? (
        <>
          <h1 className="text-h1-page font-bold">Something went wrong.</h1>
          <p className="mt-3 text-text-dim">
            We couldn&apos;t process the unsubscribe right now. Try the link
            again from a recent email, or reply to any of our emails to be
            removed manually.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-h1-page font-bold">Invalid unsubscribe link.</h1>
          <p className="mt-3 text-text-dim">
            This link is missing or has expired. Open a recent email from us
            and use the link in its footer.
          </p>
        </>
      )}
    </div>
  );
}

export const metadata = {
  robots: { index: false, follow: false },
};
