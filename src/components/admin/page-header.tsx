import Link from "next/link";

export function AdminHeader({
  title,
  description,
  action,
  badge,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-serif text-[1.9rem] leading-tight">{title}</h1>
          {badge}
        </div>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function AdminTabs({
  items,
  active,
}: {
  items: { href: string; label: string; count?: number }[];
  active: string;
}) {
  return (
    <div className="scrollbar-hide flex gap-1 overflow-x-auto rounded-lg border border-line bg-paper p-1">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`shrink-0 rounded-md px-3 py-1.5 text-[11.5px] transition-colors ${
            active === item.href ? "bg-forest text-ivory" : "text-[#565950] hover:text-forest"
          }`}
        >
          {item.label}
          {typeof item.count === "number" ? <span className="ml-1.5 opacity-60">{item.count}</span> : null}
        </Link>
      ))}
    </div>
  );
}

export function AdminTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="hidden overflow-hidden rounded-[12px] border border-line bg-paper md:block">
      <table className="w-full border-collapse text-[12px]">{children}</table>
    </div>
  );
}

export function AdminTh({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      className={`border-b border-line bg-[#f7f3ea] px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-muted ${className ?? ""}`}
    >
      {children}
    </th>
  );
}

export function AdminTd({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={`border-b border-line px-4 py-3 align-middle last:border-0 ${className ?? ""}`}>{children}</td>;
}
