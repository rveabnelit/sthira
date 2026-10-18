import { z } from "zod";

export const practiceInputSchema = z.object({
  title: z.string().trim().min(3, "Название — минимум 3 символа.").max(120),
  slug: z.string().trim().max(80).optional(),
  description: z.string().trim().min(10, "Добавьте описание.").max(4000),
  teacherNote: z.string().trim().max(1000).optional().nullable(),
  thumbnailUrl: z.string().trim().max(500).optional().nullable(),
  coverTone: z.enum(["sand", "sage", "forest", "clay", "ivory"]).default("sand"),
  videoProvider: z.enum(["mock", "external"]).default("mock"),
  videoUrl: z.string().trim().max(1000).optional().nullable(),
  videoAssetId: z.string().trim().max(120).optional().nullable(),
  durationMinutes: z.number().int().min(3, "Минимум 3 минуты.").max(180),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  goal: z.enum(["start", "habit", "movement", "deepen"]),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  requiredPlan: z.enum(["practice", "guide", "live"]).default("practice"),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
});

export const programLessonInput = z.object({
  title: z.string().trim().min(1).max(120),
  practiceId: z.string().min(1),
});

export const programModuleInput = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional().nullable(),
  lessons: z.array(programLessonInput).min(1, "В модуле должен быть хотя бы один урок."),
});

export const programInputSchema = z.object({
  title: z.string().trim().min(3).max(120),
  slug: z.string().trim().max(80).optional(),
  shortDescription: z.string().trim().min(5).max(240),
  description: z.string().trim().min(20).max(6000),
  coverTone: z.enum(["sand", "sage", "forest", "clay", "ivory"]).default("sage"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  estimatedDuration: z.string().trim().min(2).max(60),
  lessonsPerWeek: z.number().int().min(1).max(7),
  audience: z.string().trim().max(500).optional().nullable(),
  outcomes: z.array(z.string().trim().min(1).max(200)).max(8).default([]),
  requiredPlan: z.enum(["practice", "guide", "live"]).default("practice"),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  modules: z.array(programModuleInput).min(1, "Добавьте хотя бы один модуль."),
});

export const guideDocSchema = z.object({
  title: z.string().trim().min(3).max(160),
  category: z.string().trim().min(2).max(60),
  content: z.string().trim().min(30, "Материал слишком короткий.").max(12000),
  status: z.enum(["draft", "published"]).default("draft"),
});

export const liveSessionSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(2000),
  startsAt: z.string().min(10),
  durationMinutes: z.number().int().min(10).max(240),
  capacity: z.number().int().min(1).max(500),
  joinUrl: z.string().trim().max(500).optional().nullable(),
  status: z.enum(["scheduled", "canceled", "completed"]).default("scheduled"),
});

export const siteContentSchema = z.object({
  entries: z.record(z.string().max(120), z.string().max(4000)),
});

export const planUpdateSchema = z.object({
  code: z.enum(["practice", "guide", "live"]),
  price: z.number().int().min(0).max(1000000),
  isActive: z.boolean().optional(),
  isRecommended: z.boolean().optional(),
  description: z.string().trim().min(5).max(500).optional(),
});
