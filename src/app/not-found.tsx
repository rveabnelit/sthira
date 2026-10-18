import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-ivory">
      <header className="border-b border-line">
        <div className="container-app flex h-16 items-center">
          <Logo />
        </div>
      </header>
      <main id="main" className="container-app flex flex-1 items-center py-16">
        <div className="max-w-xl">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Ошибка 404</p>
          <h1 className="display-1 mt-4 text-[clamp(2.4rem,1.8rem+3vw,4rem)]">Страница не нашлась</h1>
          <p className="lede mt-5">
            Возможно, адрес изменился или ссылка устарела. Практики и программы школы доступны из каталога.
          </p>
          <div className="mt-8 flex flex-col gap-2 sm:flex-row">
            <Link href="/" className="btn btn-primary">
              На главную
            </Link>
            <Link href="/practice" className="btn btn-secondary">
              К практикам
            </Link>
            <Link href="/contacts" className="btn btn-secondary">
              Написать в поддержку
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
