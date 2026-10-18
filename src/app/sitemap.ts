import type { MetadataRoute } from "next";
import { listPractices } from "@/lib/data/practices";
import { listPrograms } from "@/lib/data/programs";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3100";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = ["", "/practice", "/programs", "/about", "/pricing", "/faq", "/contacts", "/terms", "/privacy", "/subscription-terms"].map(
    (path) => ({
      url: `${baseUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.7,
    }),
  );

  const practices = listPractices({ limit: 100 }).items.map((practice) => ({
    url: `${baseUrl}/practice/${practice.slug}`,
    lastModified: new Date(practice.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const programs = listPrograms({ limit: 50 }).map((program) => ({
    url: `${baseUrl}/programs/${program.slug}`,
    lastModified: new Date(program.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...practices, ...programs];
}
