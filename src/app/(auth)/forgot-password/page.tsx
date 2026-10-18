import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "./forgot-form";

export const metadata: Metadata = {
  title: "Восстановление доступа",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Восстановление доступа"
      description="Укажите email аккаунта — мы отправим ссылку для сброса пароля. Ссылка действует один час."
      footer={
        <>
          Вспомнили пароль?{" "}
          <Link href="/login" className="link-underline text-forest">
            Вернуться ко входу
          </Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
