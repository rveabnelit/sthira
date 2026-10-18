import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { DEMO_MODE } from "@/lib/email";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Вход",
  description: "Вход в личный кабинет STHIRA.",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/app");
  const { next } = await searchParams;

  const hintMode =
    process.env.SHOW_DEMO_HINTS === "false"
      ? "false"
      : process.env.SHOW_DEMO_HINTS === "student"
        ? "student"
        : DEMO_MODE
          ? "all"
          : "false";

  return (
    <AuthShell
      title="Вход в STHIRA"
      description="Личный кабинет, практики, программы и прогресс — в одном месте."
      footer={
        <>
          Нет аккаунта?{" "}
          <Link href="/signup" className="link-underline text-forest">
            Зарегистрироваться
          </Link>
        </>
      }
    >
      <LoginForm nextPath={next && next.startsWith("/") ? next : "/app"} hintMode={hintMode} />
    </AuthShell>
  );
}
