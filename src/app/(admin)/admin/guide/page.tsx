import type { Metadata } from "next";
import { adminAnalyticsData } from "./data";
import { GuideAdmin } from "./guide-admin";

export const metadata: Metadata = {
  title: "База знаний Guide",
  robots: { index: false, follow: false },
};

export default async function AdminGuidePage() {
  const { documents, stats } = adminAnalyticsData();
  return <GuideAdmin documents={documents} stats={stats} />;
}
