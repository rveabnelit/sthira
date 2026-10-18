import { z } from "zod";
import { fail, ok, parseBody, requireApiUser } from "@/lib/api";
import { getPreferences, updatePreferences } from "@/lib/data/preferences";
import { trackEvent } from "@/lib/analytics";

const schema = z.object({
  experienceLevel: z.enum(["new", "some", "regular"]).nullable().optional(),
  goal: z.enum(["start", "habit", "movement", "deepen"]).nullable().optional(),
  preferredDuration: z.enum(["10-15", "20-30", "40+"]).nullable().optional(),
  preferredTime: z.enum(["morning", "day", "evening", "none"]).nullable().optional(),
  timezone: z.string().max(64).optional(),
  remindersEnabled: z.boolean().optional(),
  onboardingCompleted: z.boolean().optional(),
});

export async function GET() {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  return ok({ preferences: getPreferences(auth.user.id) });
}

export async function PATCH(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  const parsed = await parseBody(request, schema);
  if (!parsed.success) return parsed.response;
  const preferences = updatePreferences(auth.user.id, parsed.data);
  if (parsed.data.onboardingCompleted) {
    trackEvent("onboarding_completed", { userId: auth.user.id });
  }
  return ok({ preferences });
}

export async function POST(request: Request) {
  return PATCH(request);
}

export const dynamic = "force-dynamic";
