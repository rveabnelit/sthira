import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export type FaqItem = { q: string; a: string };

export function FaqAccordion({ items, className }: { items: FaqItem[]; className?: string }) {
  return (
    <div className={cn("divide-y divide-line border-y border-line", className)}>
      {items.map((item) => (
        <details key={item.q} className="group py-1">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-4 text-left [&::-webkit-details-marker]:hidden">
            <span className="text-[15px] font-medium leading-snug text-ink">{item.q}</span>
            <ChevronDown
              className="mt-0.5 h-4 w-4 shrink-0 text-muted transition-transform duration-300 group-open:rotate-180"
              strokeWidth={1.7}
            />
          </summary>
          <div className="max-w-2xl pb-5 pr-8 text-[14px] leading-relaxed text-[#5c5f56]">{item.a}</div>
        </details>
      ))}
    </div>
  );
}
