import type { MetadataRoute } from "next";

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? process.env.RENDER_EXTERNAL_URL ?? "http://localhost:3100";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/practice", "/programs", "/about", "/pricing", "/faq", "/contacts", "/terms", "/privacy"],
        disallow: ["/app", "/admin", "/checkout", "/payment", "/api"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
