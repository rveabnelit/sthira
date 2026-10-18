"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app] ошибка страницы", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-ivory px-5 py-16">
      <div className="max-w-lg text-center">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Техническая ошибка</p>
        <h1 className="display-2 mt-4 text-[clamp(2rem,1.6rem+2vw,3rem)]">Что-то пошло не так</h1>
        <p className="lede mt-4">
          Мы записали ошибку и проверим её. Данные практики и прогресс не потеряны — попробуйте обновить страницу.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
          <button type="button" onClick={reset} className="btn btn-primary">
            Попробовать снова
          </button>
          <Link href="/app" className="btn btn-secondary">
            В личный кабинет
          </Link>
          <Link href="/contacts" className="btn btn-secondary">
            Поддержка
          </Link>
        </div>
        {error.digest ? <p className="mt-6 text-[10.5px] text-muted">Код ошибки: {error.digest}</p> : null}
      </div>
    </div>
  );
}
