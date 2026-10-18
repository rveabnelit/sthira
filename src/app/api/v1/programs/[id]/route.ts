import { fail, ok } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/session";
import { getProgramById, getProgramModules, buildProgramProgress } from "@/lib/data/programs";
import { getSubscription } from "@/lib/data/subscriptions";
import { canAccessPlan } from "@/lib/access";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const program = getProgramById(id);
  if (!program) return fail("not_found", "Программа не найдена.", 404);
  const user = await getCurrentUser();
  const subscription = user ? getSubscription(user.id) : null;
  const hasAccess = canAccessPlan(subscription, program.requiredPlan);
  const modules = getProgramModules(program.id);
  const progress = buildProgramProgress(program, modules, user?.id ?? null, hasAccess);
  return ok({ program, modules: progress.modules, progress: { percent: progress.percent, completed: progress.completedCount, total: progress.totalCount }, hasAccess });
}

export const dynamic = "force-dynamic";
