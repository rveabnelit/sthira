import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Eyebrow } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

export function PageHero({
  eyebrow,
  title,
  description,
  children,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <section className={cn("border-b border-line bg-paper", className)}>
      <div className="container-app pb-10 pt-10 md:pb-14 md:pt-14">
        <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center")}>
          {eyebrow ? <Eyebrow className="mb-4">{eyebrow}</Eyebrow> : null}
          <h1 className="display-1 text-[clamp(2.4rem,1.6rem+3.4vw,4rem)]">{title}</h1>
          {description ? <p className="lede mt-5 max-w-2xl">{description}</p> : null}
        </div>
        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </section>
  );
}

export function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Хлебные крошки" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-[11.5px] text-muted">
        <li>
          <Link href="/" className="transition-colors hover:text-forest">
            Главная
          </Link>
        </li>
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-1.5">
            <ChevronRight className="h-3 w-3 text-[#b9b6ad]" />
            {item.href ? (
              <Link href={item.href} className="transition-colors hover:text-forest">
                {item.label}
              </Link>
            ) : (
              <span className="text-[#565950]">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function InfoNote({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-line bg-[#f6f2e9] px-4 py-3 text-[12.5px] leading-relaxed text-[#5c5f56]", className)}>
      {children}
    </div>
  );
}
