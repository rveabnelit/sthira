import { run } from "@/lib/db";

export const ANALYTICS_EVENTS = [
  "signup_started",
  "signup_completed",
  "onboarding_completed",
  "practice_opened",
  "practice_started",
  "practice_completed",
  "program_opened",
  "program_lesson_completed",
  "pricing_viewed",
  "checkout_started",
  "payment_succeeded",
  "payment_failed",
  "subscription_cancelled",
  "guide_message_sent",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

/**
 * События складываются в собственную таблицу. Внешний аналитический сервис
 * не является обязательным: его недоступность не влияет на работу платформы.
 */
export function trackEvent(
  name: AnalyticsEventName | string,
  options: { userId?: string | null; props?: Record<string, unknown>; path?: string | null } = {},
) {
  try {
    run(
      "INSERT INTO analytics_events (user_id, name, props, path, created_at) VALUES (?, ?, ?, ?, ?)",
      options.userId ?? null,
      name,
      JSON.stringify(options.props ?? {}),
      options.path ?? null,
      new Date().toISOString(),
    );
  } catch (error) {
    console.error("[analytics] не удалось записать событие", name, error);
  }
}
