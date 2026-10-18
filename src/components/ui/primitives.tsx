import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "soft" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  soft: "btn-soft",
  ghost: "btn-ghost",
  danger: "btn-danger",
};

const SIZES: Record<Size, string> = {
  sm: "btn-sm",
  md: "",
  lg: "btn-lg",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn("btn", VARIANTS[variant], SIZES[size], className);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return (
    <button className={buttonClass(variant, size, className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}

export function Badge({
  children,
  tone = "default",
  className,
}: {
  children: ReactNode;
  tone?: "default" | "forest" | "sage" | "sand" | "success" | "danger";
  className?: string;
}) {
  const tones = {
    default: "",
    forest: "badge-forest",
    sage: "badge-sage",
    sand: "badge-sand",
    success: "badge-success",
    danger: "badge-danger",
  };
  return <span className={cn("badge", tones[tone], className)}>{children}</span>;
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("eyebrow", className)}>{children}</span>;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" && "items-center text-center",
        action && "md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow ? <Eyebrow className="mb-4">{eyebrow}</Eyebrow> : null}
        <h2 className="display-2">{title}</h2>
        {description ? <p className="lede mt-4">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function Progress({
  value,
  max = 100,
  className,
  tone = "forest",
  label,
}: {
  value: number;
  max?: number;
  className?: string;
  tone?: "forest" | "sage" | "sand";
  label?: string;
}) {
  const percent = Math.max(0, Math.min(100, Math.round((value / Math.max(1, max)) * 100)));
  const tones = { forest: "bg-forest", sage: "bg-sage", sand: "bg-sand" };
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-[#e8e3d8]", className)}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? "Прогресс"}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500", tones[tone])}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-sage-soft font-serif text-forest"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden="true"
    >
      {initials || "S"}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("surface flex flex-col items-center px-6 py-14 text-center", className)}>
      {icon ? (
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-sage-soft text-forest">
          {icon}
        </div>
      ) : null}
      <h3 className="display-4">{title}</h3>
      {description ? <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "default" | "forest";
}) {
  return (
    <div className={cn("surface p-5", tone === "forest" && "border-forest bg-forest text-ivory")}>
      <p className={cn("text-[11px] uppercase tracking-[0.16em]", tone === "forest" ? "text-ivory/70" : "text-muted")}>
        {label}
      </p>
      <p className={cn("mt-2 font-serif text-[2rem] leading-none", tone === "forest" ? "text-ivory" : "text-ink")}>
        {value}
      </p>
      {hint ? (
        <p className={cn("mt-2 text-xs", tone === "forest" ? "text-ivory/70" : "text-muted")}>{hint}</p>
      ) : null}
    </div>
  );
}

export function KeyValue({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-line py-3 last:border-0">
      <dt className="text-xs uppercase tracking-[0.12em] text-muted">{label}</dt>
      <dd className="text-right text-sm font-medium text-ink">{children}</dd>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden="true" />;
}
