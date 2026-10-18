"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import type { Plan } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { useToast } from "@/components/ui/toast";

export function PlansForm({ plans }: { plans: Plan[] }) {
  const [items, setItems] = useState(plans);
  const [pending, setPending] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();

  async function save(plan: Plan) {
    setPending(plan.code);
    try {
      const response = await fetch("/api/v1/admin/plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: plan.code,
          price: plan.price,
          isActive: plan.isActive,
          isRecommended: plan.isRecommended,
          description: plan.description,
        }),
      });
      if (!response.ok) {
        toast.push("Не удалось сохранить тариф.", "error");
        return;
      }
      toast.push(`Тариф ${plan.name} обновлён.`, "success");
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="surface p-5">
      <h2 className="text-[13px] font-medium">Тарифы</h2>
      <p className="mt-1 text-[10.5px] leading-relaxed text-muted">
        Цены и доступность — бизнес-настройки. Изменение цены не влияет на уже оплаченный период.
      </p>
      <div className="mt-4 space-y-3">
        {items.map((plan, index) => (
          <div key={plan.code} className="rounded-xl border border-line bg-[#faf7f0] p-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-serif text-[1.05rem]">{plan.name}</p>
              <span className="text-[10.5px] text-muted">{formatPrice(plan.price)} / мес</span>
              <label className="ml-auto flex items-center gap-1.5 text-[10.5px] text-muted">
                <input
                  type="checkbox"
                  checked={plan.isActive}
                  onChange={(event) =>
                    setItems((prev) =>
                      prev.map((item, i) => (i === index ? { ...item, isActive: event.target.checked } : item)),
                    )
                  }
                  className="h-3.5 w-3.5 accent-forest"
                />
                доступен
              </label>
              <label className="flex items-center gap-1.5 text-[10.5px] text-muted">
                <input
                  type="checkbox"
                  checked={plan.isRecommended}
                  onChange={(event) =>
                    setItems((prev) =>
                      prev.map((item, i) => (i === index ? { ...item, isRecommended: event.target.checked } : item)),
                    )
                  }
                  className="h-3.5 w-3.5 accent-forest"
                />
                рекомендуемый
              </label>
            </div>
            <div className="mt-2.5 flex flex-wrap items-end gap-2">
              <div className="w-32">
                <label htmlFor={`price-${plan.code}`} className="label text-[10px]">
                  Цена, ₽
                </label>
                <input
                  id={`price-${plan.code}`}
                  type="number"
                  min={0}
                  className="input h-9 text-[12px]"
                  value={plan.price}
                  onChange={(event) =>
                    setItems((prev) =>
                      prev.map((item, i) => (i === index ? { ...item, price: Number(event.target.value) } : item)),
                    )
                  }
                />
              </div>
              <div className="min-w-[180px] flex-1">
                <label htmlFor={`desc-${plan.code}`} className="label text-[10px]">
                  Описание
                </label>
                <input
                  id={`desc-${plan.code}`}
                  className="input h-9 text-[11.5px]"
                  value={plan.description}
                  onChange={(event) =>
                    setItems((prev) =>
                      prev.map((item, i) => (i === index ? { ...item, description: event.target.value } : item)),
                    )
                  }
                />
              </div>
              <button type="button" onClick={() => save(plan)} disabled={pending === plan.code} className="btn btn-secondary btn-sm h-9">
                {pending === plan.code ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                Сохранить
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
