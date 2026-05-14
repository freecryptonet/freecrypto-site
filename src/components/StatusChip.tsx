import { cn } from "@/lib/cn";

const LABEL: Record<string, string> = {
  confirmed: "Confirmed",
  potential: "Potential",
  snapshot:  "Snapshot",
  live:      "Live",
  ended:     "Ended",
};

const CLASS: Record<string, string> = {
  confirmed: "chip-confirmed",
  potential: "chip-potential",
  snapshot:  "chip-potential",
  live:      "chip-confirmed",
  ended:     "chip-ended",
};

export function StatusChip({ status }: { status: string }) {
  return (
    <span className={cn("chip", CLASS[status] ?? "")}>
      <span
        aria-hidden
        className="inline-block w-1.5 h-1.5 rounded-full bg-current opacity-80"
      />
      {LABEL[status] ?? status}
    </span>
  );
}

export function KycChip({ required }: { required: boolean }) {
  return (
    <span className={cn("chip", required ? "chip-kyc" : "chip-no-kyc")}>
      {required ? "KYC" : "No KYC"}
    </span>
  );
}
