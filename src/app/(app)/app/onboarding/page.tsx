import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guard";
import { getPreferences } from "@/lib/data/preferences";
import { OnboardingWizard } from "./wizard";

export const metadata: Metadata = {
  title: "Настройка маршрута",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const user = await requireUser("/app/onboarding");
  const prefs = getPreferences(user.id);
  if (prefs?.onboardingCompletedAt) redirect("/app");

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Первый шаг</p>
      <h1 className="display-2 mt-2 text-[clamp(1.9rem,1.5rem+1.8vw,2.8rem)]">Соберём ваш маршрут</h1>
      <p className="mt-3 max-w-lg text-[13.5px] leading-relaxed text-muted">
        Четыре коротких вопроса. Мы используем ответы только для подбора практик — их можно изменить в
        настройках в любой момент.
      </p>

      <div className="mt-8">
        <OnboardingWizard
          initial={{
            goal: prefs?.goal ?? null,
            experienceLevel: prefs?.experienceLevel ?? null,
            preferredDuration: prefs?.preferredDuration ?? null,
            preferredTime: prefs?.preferredTime ?? null,
          }}
        />
      </div>
    </div>
  );
}
