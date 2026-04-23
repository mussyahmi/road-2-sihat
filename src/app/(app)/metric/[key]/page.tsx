import { METRIC_CONFIGS } from "@/lib/types";
import { MetricDetailClient } from "./metric-detail-client";

export function generateStaticParams() {
  return METRIC_CONFIGS.map((m) => ({ key: m.key }));
}

export default function MetricDetailPage() {
  return <MetricDetailClient />;
}
