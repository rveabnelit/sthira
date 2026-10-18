import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export function AuthShell({
  title,
  description,
  children,
  footer,
  quote,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  quote?: { text: string; author: string };
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_0.9fr]">
      <div className="flex flex-col px-5 py-7 md:px-12 md:py-9">
        <Logo />
        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-10">
          <h1 className="display-2 text-[clamp(1.9rem,1.5rem+1.6vw,2.6rem)]">{title}</h1>
          {description ? <p className="mt-3 text-[13.5px] leading-relaxed text-muted">{description}</p> : null}
          <div className="mt-8">{children}</div>
          {footer ? <div className="mt-6 text-[13px] text-muted">{footer}</div> : null}
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-muted">
          <Link href="/terms" className="hover:text-forest">
            Соглашение
          </Link>
          <Link href="/privacy" className="hover:text-forest">
            Конфиденциальность
          </Link>
          <Link href="/subscription-terms" className="hover:text-forest">
            Условия подписки
          </Link>
          <span className="ml-auto">© {new Date().getFullYear()} STHIRA</span>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-forest lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/linen-soft.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest via-forest/40 to-forest/10" />
        <div className="absolute inset-x-0 bottom-0 p-10 text-ivory">
          <p className="font-serif text-[2rem] leading-tight">
            «{quote?.text ?? "Практика начинается не с гибкости, а с внимания к себе"}»
          </p>
          <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-ivory/60">
            {quote?.author ?? "Мария Васильева · автор школы"}
          </p>
        </div>
        <div className="absolute left-10 top-10 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ivory/60">
          <span className="h-px w-8 bg-ivory/40" />
          STHIRA
        </div>
      </div>
    </div>
  );
}
