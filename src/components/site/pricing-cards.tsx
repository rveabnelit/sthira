import { Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type PricingPlan = {
  code: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  features: string[];
  isRecommended: boolean;
  isActive: boolean;
};

export function PricingCards({
  plans,
  currentPlanCode,
  ctaHref = (code) => `/checkout?plan=${code}`,
  compact = false,
}: {
  plans: PricingPlan[];
  currentPlanCode?: string | null;
  ctaHref?: (code: string) => string;
  compact?: boolean;
}) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-3", compact && "gap-3")}>
      {plans
        .filter((plan) => plan.isActive)
        .map((plan) => {
          const current = currentPlanCode === plan.code;
          return (
            <div
              key={plan.code}
              className={cn(
                "relative flex flex-col rounded-[18px] border p-6",
                plan.isRecommended
                  ? "border-forest/25 bg-paper shadow-[0_24px_60px_-50px_rgba(36,57,47,0.6)]"
                  : "border-line bg-paper/70",
              )}
            >
              {plan.isRecommended ? (
                <span className="absolute -top-2.5 left-6 inline-flex items-center gap-1 rounded-full bg-forest px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-ivory">
                  <Sparkles className="h-3 w-3" />
                  Рекомендуем
                </span>
              ) : null}
              <div className="flex items-baseline justify-between">
                <h3 className="font-serif text-[1.55rem]">{plan.name}</h3>
                {current ? <span className="badge badge-sage">Ваш тариф</span> : null}
              </div>
              <p className="mt-1.5 min-h-[2.6rem] text-[13px] leading-relaxed text-muted">{plan.description}</p>
              <p className="mt-5 flex items-baseline gap-1">
                <span className="font-serif text-[2.4rem] leading-none">{formatPrice(plan.price, plan.currency)}</span>
                <span className="text-xs text-muted">/ месяц</span>
              </p>
              <ul className="mt-6 space-y-2.5 border-t border-line pt-5 text-[13px] leading-relaxed">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2.5">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6f7d68]" strokeWidth={2} />
                    <span className="text-[#4d5048]">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-6">
                {current ? (
                  <Link href="/app/subscription" className={buttonClass("secondary", "md", "w-full")}>
                    Управлять подпиской
                  </Link>
                ) : (
                  <Link
                    href={ctaHref(plan.code)}
                    className={buttonClass(plan.isRecommended ? "primary" : "secondary", "md", "w-full")}
                  >
                    Выбрать тариф
                  </Link>
                )}
              </div>
            </div>
          );
        })}
    </div>
  );
}
