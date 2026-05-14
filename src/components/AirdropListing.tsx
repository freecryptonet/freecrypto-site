import Link from "next/link";
import type { AirdropListItem } from "@/lib/db";
import { AirdropCard, SponsoredCard } from "@/components/AirdropCard";
import { AAds } from "@/components/AAds";

interface AirdropListingProps {
  airdrops: AirdropListItem[];
}

export function AirdropListing({ airdrops }: AirdropListingProps) {
  if (airdrops.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="text-h2 font-semibold mb-2">No airdrops here yet</div>
        <p className="text-text-dim text-sm max-w-md mx-auto">
          New airdrops are added daily. Check back tomorrow, or browse all
          active drops on the home page.
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center px-3 py-1.5 rounded-btn border border-edge text-sm hover:bg-edge/50"
        >
          Browse all
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {airdrops.map((a, i) => (
        <SlotWithAd key={a.id} index={i}>
          <AirdropCard a={a} />
        </SlotWithAd>
      ))}
    </div>
  );
}

function SlotWithAd({ index, children }: { index: number; children: React.ReactNode }) {
  if (index > 0 && (index + 1) % 6 === 0) {
    return (
      <>
        {children}
        <SponsoredCard>
          <AAds zone="inline" />
        </SponsoredCard>
      </>
    );
  }
  return <>{children}</>;
}
