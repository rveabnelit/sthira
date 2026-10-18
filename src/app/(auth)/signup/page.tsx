import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Регистрация",
  description: "Создайте аккаунт STHIRA и получите стартовый маршрут практики.",
  robots: { index: false, follow: false },
};

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect("/app");
  const { next } = await searchParams;

  return (
    <AuthShell
      title="Начать практику"
      description="Четыре коротких вопроса после регистрации — и мы соберём стартовый маршрут из реальных практик школы."
      footer={
        <>
          Уже есть аккаунт?{" "}
          <Link href="/login" className="link-underline text-forest">
            Войти
          </Link>
        </>
      }
      quote={{ text: "Устойчивость не появляется за неделю. Но появляется — если возвращаться.", author: "Мария Васильева" }}
    >
      <SignupForm nextPath={next && next.startsWith("/") ? next : "/app/onboarding"} />
    </AuthShell>
  );
}
