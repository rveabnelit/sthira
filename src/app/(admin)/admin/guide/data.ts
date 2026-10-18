import { all } from "@/lib/db";
import { guideAdminStats } from "@/lib/guide";

export function adminAnalyticsData() {
  const documents = all<{
    id: string;
    slug: string;
    title: string;
    category: string;
    content: string;
    status: "draft" | "published";
    updated_at: string;
  }>("SELECT id, slug, title, category, content, status, updated_at FROM guide_documents ORDER BY category, title");
  return { documents, stats: guideAdminStats() };
}
