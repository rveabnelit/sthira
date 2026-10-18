import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check, Lock, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth/guard";
import { getPlanByCode, getSubscription, listPlans } from "@/lib/data/subscriptions";
import { formatPrice } from "@/lib/format";
import { PricingCards } from "@/components/site/pricing-cards";
import { StartPaymentButton } from "./start-payment";
import { Eyebrow } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Оформление подписки",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan: planCode } = await searchParams;
  const user = await requireUser(`/checkout${planCode ? `?plan=${planCode}` : ""}`);
  const subscription = getSubscription(user.id);
  const plans = listPlans();
  const plan = planCode ? getPlanByCode(planCode) : null;

  if (!plan || !plan.isActive) {
    return (
      <div className="container-app max-w-3xl pb-20 pt-12">
        <Eyebrow className="mb-4">Подписка</Eyebrow>
        <h1 className="display-1 text-[clamp(2.1rem,1.7rem+2.2vw,3.2rem)]">Выберите тариф</h1>
        <p className="lede mt-4">
          Выберите подходящий вариант — следующий шаг покажет состав подписки и итоговую сумму.
        </p>
        <div className="mt-8">
          <PricingCards plans={plans} currentPlanCode={subscription?.planCode ?? null} />
        </div>
        <Link href="/pricing" className="mt-8 inline-flex items-center gap-1.5 text-[13px] text-forest">
          <ArrowLeft className="h-3.5 w-3.5" />
          Вернуться к сравнению тарифов
        </Link>
      </div>
    );
  }

  return (
    <div className="container-app pb-20 pt-10">
      <Link href="/pricing" className="inline-flex items-center gap-1.5 text-[12px] text-muted hover:text-forest">
        <ArrowLeft className="h-3.5 w-3.5" />
        Тарифы
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-14">
        <div>
          <Eyebrow className="mb-3">Шаг 1 из 2</Eyebrow>
          <h1 className="display-1 text-[clamp(2.1rem,1.7rem+2.2vw,3.2rem)]">Оформление подписки</h1>
          <p className="lede mt-3 max-w-xl">
            Подписка активируется после подтверждения платежа платёжным провайдером. Доступ откроется автоматически.
          </p>

          <div className="mt-8 space-y-4">
            <section className="surface p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-medium uppercase tracking-[0.12em] text-muted">Аккаунт</h2>
                <Link href="/app/settings" className="text-[11.5px] text-forest hover:underline">
                  Изменить
                </Link>
              </div>
              <p className="mt-3 text-[14px] font-medium text-ink">{user.displayName}</p>
              <p className="text-[13px] text-muted">{user.email}</p>
              {!user.emailVerifiedAt ? (
                <p className="mt-3 rounded-lg border border-[#dccdb4] bg-[#f7f1e4] px-3 py-2 text-[11.5px] leading-relaxed text-[#6b5b42]">
                  Email не подтверждён. Доступ к подписке откроется, но подтвердите адрес, чтобы не потерять
                  доступ к восстановлению пароля.
                </p>
              ) : null}
            </section>

            <section className="surface p-5">
              <h2 className="text-[13px] font-medium uppercase tracking-[0.12em] text-muted">Способ оплаты</h2>
              <div className="mt-3 flex items-start gap-3 rounded-xl border border-line bg-[#f7f3ea] p-4">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-paper text-forest">
                  <Lock className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[13px] font-medium text-ink">STHIRA Pay · тестовый режим</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted">
                    Платёж проходит на стороне провайдера. В демонстрационном режиме реальные деньги не
                    списываются, данные банковской карты не запрашиваются и не хранятся.
                  </p>
                </div>
              </div>
              <p className="mt-3 flex items-start gap-2 text-[11.5px] leading-relaxed text-muted">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6f7d68]" />
                Подписка включается только после проверки подписи уведомления провайдера. Возврат на страницу
                успеха сам по себе доступ не открывает.
              </p>
            </section>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="surface p-5">
            <Eyebrow>Ваш заказ</Eyebrow>
            <div className="mt-4 flex items-baseline justify-between">
              <p className="font-serif text-[1.5rem]">{plan.name}</p>
              <p className="font-serif text-[1.5rem]">{formatPrice(plan.price, plan.currency)}</p>
            </div>
            <p className="mt-1 text-[11.5px] uppercase tracking-[0.12em] text-muted">За месяц · автопродление</p>

            <ul className="mt-5 space-y-2 border-t border-line pt-4 text-[12.5px]">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6f7d68]" />
                  <span className="text-[#4d5048]">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 space-y-2 border-t border-line pt-4 text-[12.5px]">
              <div className="flex justify-between">
                <span className="text-muted">Сумма сегодня</span>
                <span className="font-medium">{formatPrice(plan.price, plan.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Следующее списание</span>
                <span className="text-[#4d5048]">
                  через 30 дней
                </span>
              </div>
            </div>

            <StartPaymentButton planCode={plan.code} />

            <p className="mt-3 text-center text-[10.5px] leading-relaxed text-muted">
              Нажимая «Перейти к оплате», вы принимаете{" "}
              <Link href="/subscription-terms" className="link-underline text-forest">
                условия подписки
              </Link>{" "}
              и{" "}
              <Link href="/terms" className="link-underline text-forest">
                соглашение
              </Link>
              .
            </p>
          </div>

          {subscription ? (
            <div className="mt-4 rounded-xl border border-line bg-[#f7f3ea] p-4 text-[11.5px] leading-relaxed text-muted">
              Сейчас у вас тариф <span className="font-medium text-ink">{subscription.planName}</span>. При оплате
              новый тариф заменит текущий, доступ откроется сразу после подтверждения платежа.
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
