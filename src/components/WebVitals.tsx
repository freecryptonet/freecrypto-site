"use client";

import { useReportWebVitals } from "next/web-vitals";

/**
 * Real-user Core Web Vitals → GA4. Lets us measure field LCP/CLS/INP instead of
 * guessing from lab audits, so we only optimise where real users actually feel it.
 * No-op until GA (gtag) is present.
 */
export function WebVitals() {
  useReportWebVitals((metric) => {
    const w = window as unknown as { gtag?: (...args: unknown[]) => void };
    if (typeof w.gtag !== "function") return;
    w.gtag("event", metric.name, {
      value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
      metric_id: metric.id,
      metric_value: metric.value,
      metric_rating: metric.rating,
      non_interaction: true,
    });
  });
  return null;
}
