import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export default function PaymentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-ivory">
      <header className="border-b border-line">
        <div className="container-app flex h-16 items-center justify-between">
          <Logo />
          <span className="badge badge-sand">Тестовый платёжный режим</span>
        </div>
      </header>
      <main id="main" className="flex-1">
        {children}
      </main>
      <footer className="border-t border-line py-5">
        <div className="container-app flex flex-col items-center justify-between gap-2 text-[11px] text-muted sm:flex-row">
          <p>STHIRA · оплата обрабатывается платёжным провайдером</p>
          <div className="flex gap-4">
            <Link href="/subscription-terms" className="hover:text-forest">
              Условия подписки
            </Link>
            <Link href="/contacts" className="hover:text-forest">
              Поддержка
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
