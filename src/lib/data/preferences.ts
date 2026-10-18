import { one, run } from "@/lib/db";

export type Preferences = {
  experienceLevel: string | null;
  goal: string | null;
  preferredDuration: string | null;
  preferredTime: string | null;
  timezone: string;
  remindersEnabled: boolean;
  onboardingCompletedAt: string | null;
};

type PrefRow = {
  experience_level: string | null;
  goal: string | null;
  preferred_duration: string | null;
  preferred_time: string | null;
  timezone: string;
  reminders_enabled: number;
  onboarding_completed_at: string | null;
};

export function getPreferences(userId: string): Preferences | null {
  const row = one<PrefRow>("SELECT * FROM user_preferences WHERE user_id = ?", userId);
  if (!row) return null;
  return {
    experienceLevel: row.experience_level,
    goal: row.goal,
    preferredDuration: row.preferred_duration,
    preferredTime: row.preferred_time,
    timezone: row.timezone,
    remindersEnabled: Number(row.reminders_enabled) === 1,
    onboardingCompletedAt: row.onboarding_completed_at,
  };
}

export function ensurePreferences(userId: string): Preferences {
  const existing = getPreferences(userId);
  if (existing) return existing;
  run(
    `INSERT INTO user_preferences (user_id, timezone, reminders_enabled, updated_at)
     VALUES (?, 'Europe/Moscow', 0, ?)`,
    userId,
    new Date().toISOString(),
  );
  return {
    experienceLevel: null,
    goal: null,
    preferredDuration: null,
    preferredTime: null,
    timezone: "Europe/Moscow",
    remindersEnabled: false,
    onboardingCompletedAt: null,
  };
}

export function updatePreferences(
  userId: string,
  patch: Partial<{
    experienceLevel: string | null;
    goal: string | null;
    preferredDuration: string | null;
    preferredTime: string | null;
    timezone: string;
    remindersEnabled: boolean;
    onboardingCompleted: boolean;
  }>,
): Preferences {
  const current = ensurePreferences(userId);
  const next = {
    experience_level: patch.experienceLevel !== undefined ? patch.experienceLevel : current.experienceLevel,
    goal: patch.goal !== undefined ? patch.goal : current.goal,
    preferred_duration:
      patch.preferredDuration !== undefined ? patch.preferredDuration : current.preferredDuration,
    preferred_time: patch.preferredTime !== undefined ? patch.preferredTime : current.preferredTime,
    timezone: patch.timezone ?? current.timezone,
    reminders_enabled:
      patch.remindersEnabled !== undefined ? Number(patch.remindersEnabled) : Number(current.remindersEnabled),
    onboarding_completed_at: patch.onboardingCompleted
      ? current.onboardingCompletedAt ?? new Date().toISOString()
      : current.onboardingCompletedAt,
  };
  run(
    `UPDATE user_preferences SET experience_level = ?, goal = ?, preferred_duration = ?, preferred_time = ?,
            timezone = ?, reminders_enabled = ?, onboarding_completed_at = ?, updated_at = ?
      WHERE user_id = ?`,
    next.experience_level,
    next.goal,
    next.preferred_duration,
    next.preferred_time,
    next.timezone,
    next.reminders_enabled,
    next.onboarding_completed_at,
    new Date().toISOString(),
    userId,
  );
  return {
    experienceLevel: next.experience_level,
    goal: next.goal,
    preferredDuration: next.preferred_duration,
    preferredTime: next.preferred_time,
    timezone: next.timezone,
    remindersEnabled: next.reminders_enabled === 1,
    onboardingCompletedAt: next.onboarding_completed_at,
  };
}
