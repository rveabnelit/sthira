import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="STHIRA — на главную"
      className={`inline-flex items-center gap-2.5 text-forest ${className ?? ""}`}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 21V10.5a7 7 0 0 1 14 0V21" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" />
        <path d="M2.5 21h19" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" />
      </svg>
      {!compact ? (
        <span className="font-serif text-[1.2rem] font-medium tracking-[0.2em] leading-none">STHIRA</span>
      ) : null}
    </Link>
  );
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <Link href="/" className={`group inline-flex items-baseline gap-1.5 ${className ?? ""}`}>
      <span className="font-serif text-lg tracking-[0.2em] text-forest">STHIRA</span>
      <ArrowUpRight className="h-3 w-3 text-muted transition-transform group-hover:-translate-y-0.5" />
    </Link>
  );
}
