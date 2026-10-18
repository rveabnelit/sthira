import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "./reset-form";

export const metadata: Metadata = {
  title: "Новый пароль",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;

  return (
    <AuthShell
      title="Новый пароль"
      description="Придумайте пароль длиной не менее 8 символов. После смены пароля все активные сессии будут завершены."
      footer={
        <Link href="/login" className="link-underline text-forest">
          Вернуться ко входу
        </Link>
      }
    >
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div>
          <p className="rounded-xl border border-[#e3c8c0] bg-[#fbf1ee] p-4 text-[12.5px] leading-relaxed text-[#8a3d2f]">
            Ссылка не содержит токен восстановления. Запросите новое письмо.
          </p>
          <Link href="/forgot-password" className="btn btn-primary mt-5 w-full">
            Запросить ссылку
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
