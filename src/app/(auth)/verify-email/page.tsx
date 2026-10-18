import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmail } from "./verify-client";

export const metadata: Metadata = {
  title: "Подтверждение email",
  robots: { index: false, follow: false },
};

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;

  return (
    <AuthShell
      title="Подтверждение email"
      description="Подтверждение нужно, чтобы восстановить доступ к аккаунту и получать сервисные уведомления."
      footer={
        <Link href="/app" className="link-underline text-forest">
          Перейти в личный кабинет
        </Link>
      }
    >
      <VerifyEmail token={token ?? null} />
    </AuthShell>
  );
}
