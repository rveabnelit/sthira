import { all, run } from "@/lib/db";
import { siteDefaults } from "@/content/catalog";

/** Тексты сайта: значения по умолчанию + правки администратора. */
export function getSiteContent(): Record<string, string> {
  const rows = all<{ key: string; value: string }>("SELECT key, value FROM site_content");
  const overrides = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  return { ...siteDefaults, ...overrides };
}

export function getSiteValue(key: string): string {
  const content = getSiteContent();
  return content[key] ?? "";
}

export function updateSiteContent(entries: Record<string, string>) {
  const now = new Date().toISOString();
  for (const [key, value] of Object.entries(entries)) {
    run(
      `INSERT INTO site_content (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      key,
      value,
      now,
    );
  }
}
