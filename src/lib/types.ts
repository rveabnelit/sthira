import type { CoverTone, Difficulty, Goal, PlanCode } from "@/content/catalog";

export type UserRole = "student" | "admin";

export type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  emailVerifiedAt: string | null;
  createdAt: string;
};

export type Practice = {
  id: string;
  slug: string;
  title: string;
  description: string;
  teacherNote: string | null;
  thumbnailUrl: string | null;
  coverTone: CoverTone;
  videoProvider: string;
  videoAssetId: string | null;
  videoUrl: string | null;
  durationMinutes: number;
  difficulty: Difficulty;
  goal: Goal;
  tags: string[];
  requiredPlan: PlanCode;
  status: "draft" | "published" | "archived";
  createdAt: string;
  updatedAt: string;
};

export type Program = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  thumbnailUrl: string | null;
  coverTone: CoverTone;
  difficulty: Difficulty;
  estimatedDuration: string;
  lessonsPerWeek: number;
  audience: string | null;
  outcomes: string[];
  requiredPlan: PlanCode;
  status: "draft" | "published" | "archived";
  createdAt: string;
  updatedAt: string;
  lessonsCount?: number;
};

export type ProgramLesson = {
  id: string;
  moduleId: string;
  moduleTitle: string;
  modulePosition: number;
  practiceId: string;
  practiceSlug: string;
  practiceDuration: number;
  practiceDifficulty: Difficulty;
  title: string;
  description: string | null;
  position: number;
};

export type ProgramModule = {
  id: string;
  title: string;
  description: string | null;
  position: number;
  lessons: ProgramLesson[];
};

export type Completion = {
  id: string;
  practiceId: string;
  practiceTitle: string;
  practiceSlug: string;
  programLessonId: string | null;
  completedAt: string;
  durationSeconds: number | null;
  mood: string | null;
  tone: CoverTone;
};

export type Plan = {
  id: string;
  code: PlanCode;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingPeriod: string;
  features: string[];
  isActive: boolean;
  isRecommended: boolean;
};

export type Payment = {
  id: string;
  amount: number;
  currency: string;
  status: "pending" | "succeeded" | "failed" | "refunded";
  paidAt: string | null;
  createdAt: string;
  planName: string | null;
  providerPaymentId: string;
  failureReason: string | null;
};

export type LessonProgress = ProgramLesson & {
  completed: boolean;
  completedAt: string | null;
  locked: boolean;
  state: "completed" | "current" | "next" | "upcoming" | "locked";
};

export type ProgramProgress = {
  program: Program;
  modules: (Omit<ProgramModule, "lessons"> & { lessons: LessonProgress[]; completedCount: number })[];
  completedCount: number;
  totalCount: number;
  percent: number;
  currentLesson: LessonProgress | null;
  nextLesson: LessonProgress | null;
};

export type LiveSession = {
  id: string;
  title: string;
  description: string;
  teacherName: string;
  startsAt: string;
  durationMinutes: number;
  capacity: number;
  joinUrl: string | null;
  coverUrl: string | null;
  requiredPlan: PlanCode;
  status: "scheduled" | "canceled" | "completed";
  registered?: boolean;
  registrationCount?: number;
};

export type GuideMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations: GuideCitation[];
  createdAt: string;
};

export type GuideCitation = {
  type: "document" | "practice" | "program";
  title: string;
  href: string;
};

export type GuideConversation = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages?: GuideMessage[];
};

export type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

export type SiteContent = Record<string, string>;
