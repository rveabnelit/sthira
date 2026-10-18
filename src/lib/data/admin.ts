import { all, one } from "@/lib/db";
import type { SubscriptionStatus } from "@/lib/access";

export type Period = { from: Date; to: Date };

export function defaultPeriod(days = 30): Period {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return { from, to };
}

function range(period: Period) {
  return [period.from.toISOString(), period.to.toISOString()] as const;
}

export function adminOverview(period: Period = defaultPeriod(30)) {
  const [from, to] = range(period);
  const totalUsers = Number(one<{ c: number }>("SELECT count(*) AS c FROM users WHERE deleted_at IS NULL AND role = 'student'")?.c ?? 0);
  const newUsers = Number(
    one<{ c: number }>("SELECT count(*) AS c FROM users WHERE role = 'student' AND deleted_at IS NULL AND created_at BETWEEN ? AND ?", from, to)?.c ?? 0,
  );
  const activeSubs = Number(
    one<{ c: number }>(
      "SELECT count(*) AS c FROM subscriptions WHERE status IN ('active', 'canceled', 'past_due') AND current_period_end > ?",
      new Date().toISOString(),
    )?.c ?? 0,
  );
  const revenue = Number(
    one<{ s: number }>(
      "SELECT coalesce(sum(amount), 0) AS s FROM payments WHERE status = 'succeeded' AND paid_at BETWEEN ? AND ?",
      from,
      to,
    )?.s ?? 0,
  );
  const paymentsCount = Number(
    one<{ c: number }>(
      "SELECT count(*) AS c FROM payments WHERE status = 'succeeded' AND paid_at BETWEEN ? AND ?",
      from,
      to,
    )?.c ?? 0,
  );
  const pendingPayments = Number(
    one<{ c: number }>("SELECT count(*) AS c FROM payments WHERE status IN ('pending', 'failed')")?.c ?? 0,
  );
  const completions = Number(
    one<{ c: number }>("SELECT count(*) AS c FROM practice_completions WHERE completed_at BETWEEN ? AND ?", from, to)?.c ?? 0,
  );
  const activePractitioners = Number(
    one<{ c: number }>(
      "SELECT count(DISTINCT user_id) AS c FROM practice_completions WHERE completed_at BETWEEN ? AND ?",
      from,
      to,
    )?.c ?? 0,
  );
  const cancellations = Number(
    one<{ c: number }>("SELECT count(*) AS c FROM subscriptions WHERE canceled_at BETWEEN ? AND ?", from, to)?.c ?? 0,
  );
  const publishedPractices = Number(one<{ c: number }>("SELECT count(*) AS c FROM practices WHERE status = 'published'")?.c ?? 0);
  const draftPractices = Number(one<{ c: number }>("SELECT count(*) AS c FROM practices WHERE status <> 'published'")?.c ?? 0);
  const draftPrograms = Number(one<{ c: number }>("SELECT count(*) AS c FROM programs WHERE status <> 'published'")?.c ?? 0);
  const draftDocs = Number(one<{ c: number }>("SELECT count(*) AS c FROM guide_documents WHERE status <> 'published'")?.c ?? 0);
  const newMessages = Number(one<{ c: number }>("SELECT count(*) AS c FROM contact_messages WHERE status = 'new'")?.c ?? 0);

  const recentUsers = all<{ id: string; display_name: string; email: string; created_at: string }>(
    "SELECT id, display_name, email, created_at FROM users WHERE role = 'student' AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 5",
  );

  const recentEvents = all<{ name: string; created_at: string; display_name: string | null }>(
    `SELECT e.name, e.created_at, u.display_name
       FROM analytics_events e LEFT JOIN users u ON u.id = e.user_id
      ORDER BY e.created_at DESC LIMIT 8`,
  );

  return {
    totalUsers,
    newUsers,
    activeSubs,
    revenue,
    paymentsCount,
    pendingPayments,
    completions,
    activePractitioners,
    cancellations,
    publishedPractices,
    draftPractices,
    draftPrograms,
    draftDocs,
    newMessages,
    recentUsers,
    recentEvents,
    period,
  };
}

export type StudentRow = {
  id: string;
  displayName: string;
  email: string;
  role: string;
  createdAt: string;
  emailVerifiedAt: string | null;
  planName: string | null;
  planCode: string | null;
  subStatus: SubscriptionStatus | null;
  periodEnd: string | null;
  cancelAtPeriodEnd: number | null;
  lastActivity: string | null;
  completions: number;
  lessonsCompleted: number;
};

export function listStudents(opts: { q?: string; status?: string; sort?: string; limit?: number } = {}): StudentRow[] {
  const params: unknown[] = [];
  const conditions: string[] = ["u.role = 'student'", "u.deleted_at IS NULL"];
  const nowIso = new Date().toISOString();
  if (opts.q) {
    conditions.push("(lower(u.display_name) LIKE ? OR lower(u.email) LIKE ?)");
    const like = `%${opts.q.toLowerCase()}%`;
    params.push(like, like);
  }
  if (opts.status === "active") {
    conditions.push("l.status IN ('active','canceled')");
    conditions.push("l.current_period_end > ?");
    params.push(nowIso);
  } else if (opts.status === "none") {
    conditions.push("l.status IS NULL");
  } else if (opts.status === "expired") {
    conditions.push("(l.status = 'expired' OR (l.current_period_end IS NOT NULL AND l.current_period_end <= ?))");
    params.push(nowIso);
  } else if (opts.status === "past_due") {
    conditions.push("l.status = 'past_due'");
  }

  const sort =
    opts.sort === "activity"
      ? "last_activity DESC NULLS LAST"
      : opts.sort === "name"
        ? "display_name ASC"
        : "created_at DESC";

  const rows = all<{
    id: string;
    display_name: string;
    email: string;
    role: string;
    created_at: string;
    email_verified_at: string | null;
    plan_name: string | null;
    plan_code: string | null;
    sub_status: SubscriptionStatus | null;
    period_end: string | null;
    cancel_at_period_end: number | null;
    last_activity: string | null;
    completions: number;
    lessons_completed: number;
  }>(
    `WITH latest AS (
       SELECT s.*, row_number() OVER (PARTITION BY s.user_id ORDER BY s.created_at DESC) AS rn
         FROM subscriptions s
     )
     SELECT u.id, u.display_name, u.email, u.role, u.created_at, u.email_verified_at,
            pl.name AS plan_name, pl.code AS plan_code, l.status AS sub_status,
            l.current_period_end AS period_end, l.cancel_at_period_end,
            (SELECT max(c.completed_at) FROM practice_completions c WHERE c.user_id = u.id) AS last_activity,
            (SELECT count(*) FROM practice_completions c WHERE c.user_id = u.id) AS completions,
            (SELECT count(DISTINCT c.program_lesson_id) FROM practice_completions c WHERE c.user_id = u.id AND c.program_lesson_id IS NOT NULL) AS lessons_completed
       FROM users u
       LEFT JOIN latest l ON l.user_id = u.id AND l.rn = 1
       LEFT JOIN plans pl ON pl.id = l.plan_id
       WHERE ${conditions.join(" AND ")}
       ORDER BY ${sort}
       LIMIT ?`,
    ...params,
    opts.limit ?? 100,
  );

  return rows.map((row) => ({
    id: row.id,
    displayName: row.display_name,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
    emailVerifiedAt: row.email_verified_at,
    planName: row.plan_name,
    planCode: row.plan_code,
    subStatus: row.sub_status,
    periodEnd: row.period_end,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    lastActivity: row.last_activity,
    completions: Number(row.completions),
    lessonsCompleted: Number(row.lessons_completed),
  }));
}

export function getStudentDetail(userId: string) {
  const user = one<{
    id: string;
    email: string;
    display_name: string;
    role: string;
    created_at: string;
    email_verified_at: string | null;
    deleted_at: string | null;
  }>("SELECT id, email, display_name, role, created_at, email_verified_at, deleted_at FROM users WHERE id = ?", userId);
  if (!user) return null;
  const prefs = one<{
    experience_level: string | null;
    goal: string | null;
    preferred_duration: string | null;
    preferred_time: string | null;
    onboarding_completed_at: string | null;
  }>("SELECT experience_level, goal, preferred_duration, preferred_time, onboarding_completed_at FROM user_preferences WHERE user_id = ?", userId);
  const subscription = one<{
    id: string;
    status: SubscriptionStatus;
    plan_name: string;
    period_end: string | null;
    cancel_at_period_end: number;
  }>(
    `SELECT s.id, s.status, p.name AS plan_name, s.current_period_end AS period_end, s.cancel_at_period_end
       FROM subscriptions s JOIN plans p ON p.id = s.plan_id
      WHERE s.user_id = ? ORDER BY s.created_at DESC LIMIT 1`,
    userId,
  );
  const payments = all<{ id: string; amount: number; status: string; paid_at: string | null; plan_name: string | null; provider_payment_id: string }>(
    `SELECT pay.id, pay.amount, pay.status, pay.paid_at, pl.name AS plan_name, pay.provider_payment_id
       FROM payments pay LEFT JOIN plans pl ON pl.id = pay.plan_id
      WHERE pay.user_id = ? ORDER BY pay.created_at DESC LIMIT 20`,
    userId,
  );
  const completions = all<{ id: string; title: string; completed_at: string; duration_seconds: number | null }>(
    `SELECT c.id, p.title, c.completed_at, c.duration_seconds
       FROM practice_completions c JOIN practices p ON p.id = c.practice_id
      WHERE c.user_id = ? ORDER BY c.completed_at DESC LIMIT 20`,
    userId,
  );
  return { user, prefs, subscription, payments, completions };
}

export function listBillingPayments(opts: { q?: string; status?: string } = {}) {
  const params: unknown[] = [];
  let where = "WHERE 1 = 1";
  if (opts.q) {
    where += " AND (lower(u.email) LIKE ? OR lower(u.display_name) LIKE ?)";
    const like = `%${opts.q.toLowerCase()}%`;
    params.push(like, like);
  }
  if (opts.status && opts.status !== "all") {
    where += " AND pay.status = ?";
    params.push(opts.status);
  }
  return all<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    paid_at: string | null;
    created_at: string;
    provider_payment_id: string;
    plan_name: string | null;
    user_email: string;
    user_name: string;
    user_id: string;
  }>(
    `SELECT pay.id, pay.amount, pay.currency, pay.status, pay.paid_at, pay.created_at,
            pay.provider_payment_id, pl.name AS plan_name,
            u.email AS user_email, u.display_name AS user_name, u.id AS user_id
       FROM payments pay
       JOIN users u ON u.id = pay.user_id
       LEFT JOIN plans pl ON pl.id = pay.plan_id
       ${where}
      ORDER BY pay.created_at DESC LIMIT 100`,
    ...params,
  );
}

export function listBillingSubscriptions() {
  return all<{
    id: string;
    status: SubscriptionStatus;
    plan_name: string;
    email: string;
    display_name: string;
    current_period_end: string | null;
    cancel_at_period_end: number;
    created_at: string;
  }>(
    `SELECT s.id, s.status, p.name AS plan_name, u.email, u.display_name,
            s.current_period_end, s.cancel_at_period_end, s.created_at
       FROM subscriptions s
       JOIN users u ON u.id = s.user_id
       JOIN plans p ON p.id = s.plan_id
      ORDER BY s.created_at DESC LIMIT 100`,
  );
}

function daySeries(rows: { day: string; value: number }[], period: Period): { day: string; value: number }[] {
  const map = new Map(rows.map((row) => [row.day, Number(row.value)]));
  const series: { day: string; value: number }[] = [];
  const cursor = new Date(period.from);
  cursor.setUTCHours(0, 0, 0, 0);
  while (cursor <= period.to) {
    const key = cursor.toISOString().slice(0, 10);
    series.push({ day: key, value: map.get(key) ?? 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return series;
}

export function adminAnalytics(period: Period = defaultPeriod(30)) {
  const [from, to] = range(period);
  const registrations = all<{ day: string; value: number }>(
    "SELECT substr(created_at, 1, 10) AS day, count(*) AS value FROM users WHERE role = 'student' AND created_at BETWEEN ? AND ? GROUP BY day",
    from,
    to,
  );
  const revenue = all<{ day: string; value: number }>(
    "SELECT substr(paid_at, 1, 10) AS day, coalesce(sum(amount), 0) AS value FROM payments WHERE status = 'succeeded' AND paid_at BETWEEN ? AND ? GROUP BY day",
    from,
    to,
  );
  const newSubs = Number(
    one<{ c: number }>("SELECT count(*) AS c FROM subscriptions WHERE created_at BETWEEN ? AND ?", from, to)?.c ?? 0,
  );
  const cancelled = Number(
    one<{ c: number }>("SELECT count(*) AS c FROM subscriptions WHERE canceled_at BETWEEN ? AND ?", from, to)?.c ?? 0,
  );
  const activeSubs = Number(
    one<{ c: number }>("SELECT count(*) AS c FROM subscriptions WHERE status IN ('active','canceled','past_due') AND current_period_end > ?", new Date().toISOString())?.c ?? 0,
  );
  const popular = all<{ title: string; slug: string; count: number }>(
    `SELECT p.title, p.slug, count(c.id) AS count
       FROM practice_completions c JOIN practices p ON p.id = c.practice_id
      WHERE c.completed_at BETWEEN ? AND ?
      GROUP BY p.id ORDER BY count DESC LIMIT 6`,
    from,
    to,
  );
  const lessonCompletions = Number(
    one<{ c: number }>("SELECT count(*) AS c FROM practice_completions WHERE program_lesson_id IS NOT NULL AND completed_at BETWEEN ? AND ?", from, to)?.c ?? 0,
  );

  const signups = Number(one<{ c: number }>("SELECT count(*) AS c FROM analytics_events WHERE name = 'signup_completed' AND created_at BETWEEN ? AND ?", from, to)?.c ?? 0);
  const onboardings = Number(one<{ c: number }>("SELECT count(*) AS c FROM analytics_events WHERE name = 'onboarding_completed' AND created_at BETWEEN ? AND ?", from, to)?.c ?? 0);
  const firstPractices = Number(one<{ c: number }>("SELECT count(*) AS c FROM analytics_events WHERE name = 'practice_completed' AND created_at BETWEEN ? AND ?", from, to)?.c ?? 0);
  const pricingViews = Number(one<{ c: number }>("SELECT count(*) AS c FROM analytics_events WHERE name = 'pricing_viewed' AND created_at BETWEEN ? AND ?", from, to)?.c ?? 0);
  const checkouts = Number(one<{ c: number }>("SELECT count(*) AS c FROM analytics_events WHERE name = 'checkout_started' AND created_at BETWEEN ? AND ?", from, to)?.c ?? 0);
  const paid = Number(one<{ c: number }>("SELECT count(*) AS c FROM analytics_events WHERE name = 'payment_succeeded' AND created_at BETWEEN ? AND ?", from, to)?.c ?? 0);

  const programCompletion = all<{ program_id: string; title: string; total: number; completed: number }>(
    `SELECT p.id AS program_id, p.title,
            (SELECT count(*) FROM program_modules m JOIN program_lessons l ON l.module_id = m.id WHERE m.program_id = p.id) AS total,
            (SELECT count(DISTINCT c.program_lesson_id) FROM program_lessons l
               JOIN program_modules m ON m.id = l.module_id
               JOIN practice_completions c ON c.program_lesson_id = l.id
              WHERE m.program_id = p.id AND c.completed_at BETWEEN ? AND ?) AS completed
       FROM programs p WHERE p.status = 'published'`,
    from,
    to,
  );

  return {
    period,
    registrations: daySeries(registrations, period),
    revenue: daySeries(revenue, period),
    registrationsTotal: Number(
      one<{ c: number }>("SELECT count(*) AS c FROM users WHERE role = 'student' AND created_at BETWEEN ? AND ?", from, to)?.c ?? 0,
    ),
    revenueTotal: Number(
      one<{ s: number }>("SELECT coalesce(sum(amount), 0) AS s FROM payments WHERE status = 'succeeded' AND paid_at BETWEEN ? AND ?", from, to)?.s ?? 0,
    ),
    newSubs,
    cancelled,
    activeSubs,
    popular,
    lessonCompletions,
    funnel: {
      signups,
      onboardings,
      firstPractices,
      pricingViews,
      checkouts,
      paid,
      onboardingRate: signups ? Math.round((onboardings / signups) * 100) : null,
      firstPracticeRate: signups ? Math.round((firstPractices / signups) * 100) : null,
      pricingToPaid: pricingViews ? Math.round((paid / pricingViews) * 100) : null,
      checkoutToPaid: checkouts ? Math.round((paid / checkouts) * 100) : null,
    },
    programCompletion,
  };
}

export function listAuditLog(limit = 30) {
  return all<{
    id: string;
    actor_email: string | null;
    action: string;
    entity_type: string;
    entity_id: string | null;
    result: string;
    created_at: string;
    meta: string;
  }>("SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?", limit);
}

export function listContactMessages() {
  return all<{
    id: string;
    name: string;
    email: string;
    topic: string;
    message: string;
    status: string;
    created_at: string;
  }>("SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 100");
}
