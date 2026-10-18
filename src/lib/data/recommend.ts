import { all } from "@/lib/db";
import { canAccessPlan, type SubscriptionView } from "@/lib/access";
import { listPractices, type PracticeListItem } from "@/lib/data/practices";
import { getPreferences, type Preferences } from "@/lib/data/preferences";
import { goalLabel } from "@/lib/format";

const DURATION_BUCKETS: Record<string, [number, number]> = {
  "10-15": [8, 16],
  "20-30": [18, 32],
  "40+": [35, 90],
};

const LEVEL_TARGETS: Record<string, string[]> = {
  new: ["beginner"],
  some: ["beginner", "intermediate"],
  regular: ["intermediate", "advanced"],
};

const TIME_TAGS: Record<string, string[]> = {
  morning: ["утро"],
  day: ["в течение дня", "12 минут", "10 минут"],
  evening: ["вечер", "перед сном"],
};

export type Recommendation = {
  practice: PracticeListItem;
  reason: string;
  score: number;
};

export type RecommendOptions = {
  userId?: string | null;
  subscription: SubscriptionView | null;
  prefs?: Preferences | null;
  limit?: number;
  goalOverride?: string | null;
  durationOverride?: string | null;
  levelOverride?: string | null;
  allowLocked?: boolean;
};

export function recommendPractices(options: RecommendOptions): Recommendation[] {
  const limit = options.limit ?? 4;
  const prefs = options.prefs ?? (options.userId ? getPreferences(options.userId) : null);
  const goal = options.goalOverride ?? prefs?.goal ?? null;
  const durationPref = options.durationOverride ?? prefs?.preferredDuration ?? null;
  const experience = options.levelOverride ?? prefs?.experienceLevel ?? null;
  const timePref = prefs?.preferredTime ?? null;

  const candidates = listPractices({ userId: options.userId ?? null, limit: 100 }).items;
  const recentIds = options.userId
    ? new Set(
        all<{ practice_id: string }>(
          "SELECT DISTINCT practice_id FROM practice_completions WHERE user_id = ? AND completed_at > ?",
          options.userId,
          new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        ).map((row) => row.practice_id),
      )
    : new Set<string>();

  const scored = candidates.map((practice, index) => {
    let score = 0;
    let reason = "";

    if (goal && practice.goal === goal) {
      score += 5;
      reason = `Подходит под вашу цель: ${goalLabel(goal).toLowerCase()}`;
    }

    if (durationPref && DURATION_BUCKETS[durationPref]) {
      const [min, max] = DURATION_BUCKETS[durationPref];
      if (practice.durationMinutes >= min && practice.durationMinutes <= max) {
        score += 3;
        if (!reason) reason = `Комфортная длительность — ${practice.durationMinutes} минут`;
      } else {
        const distance = practice.durationMinutes < min ? min - practice.durationMinutes : practice.durationMinutes - max;
        score -= Math.min(2, distance / 15);
      }
    }

    if (experience && LEVEL_TARGETS[experience]) {
      if (LEVEL_TARGETS[experience].includes(practice.difficulty)) {
        score += 2;
        if (!reason) reason = "Соответствует вашему уровню";
      } else if (practice.difficulty === "advanced" && experience === "new") {
        score -= 3;
      }
    }

    if (timePref && TIME_TAGS[timePref]) {
      if (practice.tags.some((tag) => TIME_TAGS[timePref].includes(tag))) {
        score += 1.5;
        if (!reason) reason = "Хорошо подходит для выбранного времени";
      }
    }

    if (!practice.isCompleted) score += 0.8;
    if (recentIds.has(practice.id)) score -= 2.5;
    score -= index * 0.02;

    if (!reason) reason = practice.isCompleted ? "Можно повторить в спокойном темпе" : "Ещё не пробовали эту практику";

    return { practice, reason, score };
  });

  const accessible = scored.filter(
    (item) => options.allowLocked || canAccessPlan(options.subscription, item.practice.requiredPlan),
  );

  if (accessible.length === 0) {
    return scored.filter((item) => options.allowLocked).slice(0, limit);
  }

  return accessible
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Стартовая рекомендация для онбординга: 3 практики под ответы. */
export function onboardingRecommendations(answers: {
  goal?: string | null;
  experience?: string | null;
  duration?: string | null;
  time?: string | null;
}): Recommendation[] {
  return recommendPractices({
    userId: null,
    subscription: null,
    limit: 3,
    allowLocked: true,
    goalOverride: answers.goal ?? null,
    durationOverride: answers.duration ?? null,
    levelOverride: answers.experience === "new" ? "new" : answers.experience === "regular" ? "regular" : "some",
    prefs: {
      experienceLevel: answers.experience ?? null,
      goal: answers.goal ?? null,
      preferredDuration: answers.duration ?? null,
      preferredTime: answers.time ?? null,
      timezone: "Europe/Moscow",
      remindersEnabled: false,
      onboardingCompletedAt: null,
    },
  });
}
