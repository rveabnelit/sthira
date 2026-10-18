import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarClock, CreditCard, Info, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth/guard";
import { getSubscription, listPayments, listPlans } from "@/lib/data/subscriptions";
import { daysLeft, isAccessActive, subscriptionStatusLabel } from "@/lib/access";
import { formatDate, formatPrice } from "@/lib/format";
import { PricingCards } from "@/components/site/pricing-cards";
import { Badge, Eyebrow, KeyValue, Progress } from "@/components/ui/primitives";
import { SubscriptionActions } from "./subscription-actions";

export const metadata: Metadata = {
  title: "Подписка",
  robots: { index: false, follow: false },
};

export default async function SubscriptionPage() {
  const user = await requireUser("/app/subscription");
  const subscription = getSubscription(user.id);
  const plans = listPlans();
  const payments = listPayments(user.id).slice(0, 4);
  const left = daysLeft(subscription?.periodEnd ?? null);
  const active = isAccessActive(subscription);
  const plan = plans.find((item) => item.code === subscription?.planCode);
  const statusBadgeTone =
    subscription?.status === "active"
      ? "success"
      : subscription?.status === "expired"
        ? "danger"
        : subscription?.status === "past_due"
          ? "danger"
          : "sand";

  return (
    <div className="mx-auto max-w-4xl">
      <header>
        <Eyebrow>Подписка</Eyebrow>
        <h1 className="display-2 mt-2 text-[clamp(1.9rem,1.5rem+1.6vw,2.6rem)]">Управление подпиской</h1>
        <p className="mt-1.5 text-[13.5px] text-muted">
          Статус, дата следующего списания и история платежей. Отмена автопродления не лишает доступа до конца
          оплаченного периода.
        </p>
      </header>

      {subscription ? (
        <section className="surface mt-6 overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-line p-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-serif text-[1.8rem] leading-none">{subscription.planName}</p>
                <Badge tone={statusBadgeTone}>{subscriptionStatusLabel(subscription)}</Badge>
              </div>
              <p className="mt-2 text-[12.5px] text-muted">
                {formatPrice(subscription.price)} в месяц ·{" "}
                {subscription.cancelAtPeriodEnd ? "продление отключено" : "автопродление включено"}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-[10.5px] uppercase tracking-[0.14em] text-muted">
                {subscription.cancelAtPeriodEnd ? "Доступ до" : "Следующее списание"}
              </p>
              <p className="mt-1 text-[13.5px] font-medium">{formatDate(subscription.periodEnd)}</p>
              {left !== null ? (
                <p className="mt-0.5 text-[11px] text-muted">
                  {left === 0 ? "последний день" : `${left} дн.`}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-6 p-5 sm:grid-cols-2">
            <div>
              <Eyebrow>Период</Eyebrow>
              <dl className="mt-3">
                <KeyValue label="Начало">{formatDate(subscription.periodStart)}</KeyValue>
                <KeyValue label="Окончание">{formatDate(subscription.periodEnd)}</KeyValue>
                <KeyValue label="Провайдер">STHIRA Pay · sandbox</KeyValue>
              </dl>
            </div>
            <div>
              <Eyebrow>Что входит</Eyebrow>
              <ul className="mt-3 space-y-1.5 text-[12.5px] text-[#4d5048]">
                {(plan?.features ?? []).slice(0, 5).map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-sage" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {active ? (
            <div className="border-t border-line bg-[#faf7f0] px-5 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11.5px] leading-relaxed text-muted">
                  {subscription.cancelAtPeriodEnd
                    ? `Автопродление отменено. После ${formatDate(subscription.periodEnd)} доступ к платным материалам закроется.`
                    : "Отменить можно в любой момент — доступ сохранится до конца оплаченного периода."}
                </p>
                <SubscriptionActions
                  canceled={subscription.cancelAtPeriodEnd || subscription.status === "canceled"}
                  periodEnd={subscription.periodEnd}
                />
              </div>
            </div>
          ) : (
            <div className="border-t border-line bg-[#faf7f0] px-5 py-4">
              <p className="text-[11.5px] leading-relaxed text-muted">
                Подписка неактивна. Профиль и история платежей остаются доступными. Чтобы вернуть доступ к
                практике, выберите тариф ниже.
              </p>
            </div>
          )}
        </section>
      ) : (
        <section className="surface mt-6 p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sage-soft text-forest">
              <CreditCard className="h-4 w-4" />
            </span>
            <div>
              <p className="font-serif text-[1.4rem]">Подписки пока нет</p>
              <p className="mt-1.5 max-w-lg text-[12.5px] leading-relaxed text-muted">
                Оформите подписку, чтобы открыть библиотеку практик и программы. Первый платёж активирует доступ
                сразу после подтверждения провайдером.
              </p>
            </div>
          </div>
        </section>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <section className="surface p-5">
          <div className="flex items-center justify-between">
            <Eyebrow>История платежей</Eyebrow>
            <Link href="/app/payments" className="text-[11px] text-muted hover:text-forest">
              Вся история
            </Link>
          </div>
          {payments.length === 0 ? (
            <p className="mt-4 text-[12.5px] text-muted">Платежей пока нет.</p>
          ) : (
            <ul className="mt-2">
              {payments.map((payment) => (
                <li key={payment.id} className="flex items-center justify-between gap-4 border-b border-line py-3 last:border-0">
                  <div>
                    <p className="text-[12.5px] font-medium">{payment.planName ?? "Подписка"}</p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {formatDate(payment.paidAt ?? payment.createdAt, { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[12.5px] font-medium">{formatPrice(payment.amount, payment.currency)}</p>
                    <p className="mt-0.5 text-[10.5px] text-muted">
                      {payment.status === "succeeded"
                        ? "оплачен"
                        : payment.status === "failed"
                          ? "не прошёл"
                          : payment.status === "refunded"
                            ? "возврат"
                            : "ожидает"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-4">
          <div className="rounded-[16px] border border-line bg-[#f7f3ea] p-5">
            <p className="flex items-center gap-2 text-[12px] font-medium">
              <ShieldCheck className="h-4 w-4 text-[#6f7d68]" />
              Оплата и данные
            </p>
            <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
              Платёжные данные обрабатывает провайдер. Платформа хранит только идентификатор транзакции, сумму и
              статус. Карта не сохраняется.
            </p>
            <Link href="/subscription-terms" className="link-underline mt-3 inline-block text-[11.5px] text-forest">
              Условия подписки
            </Link>
          </div>

          <div className="rounded-[16px] border border-line bg-paper p-5">
            <p className="flex items-center gap-2 text-[12px] font-medium">
              <CalendarClock className="h-4 w-4 text-[#6f7d68]" />
              Продление
            </p>
            <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
              {subscription?.cancelAtPeriodEnd
                ? "Автопродление отключено. Повторное списание не произойдёт."
                : "Подписка продлевается автоматически раз в месяц. Напоминание придёт в уведомления."}
            </p>
          </div>
        </div>
      </div>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <h2 className="display-3">Сменить тариф</h2>
          <Link href="/pricing" className="text-[11.5px] text-muted hover:text-forest">
            Сравнить
          </Link>
        </div>
        <div className="mt-4">
          <PricingCards plans={plans} currentPlanCode={subscription?.planCode ?? null} />
        </div>
      </section>

      <div className="mt-8 rounded-[16px] border border-line bg-[#f7f3ea] p-5">
        <p className="flex items-center gap-2 text-[12px] font-medium">
          <Info className="h-4 w-4 text-[#6f7d68]" />
          Возврат средств
        </p>
        <p className="mt-2 max-w-2xl text-[11.5px] leading-relaxed text-muted">
          Возврат выполняется через платёжного провайдера по условиям оферты. Напишите в поддержку, указав email
          аккаунта и дату платежа — мы рассмотрим обращение.
        </p>
        <Link href="/contacts" className="link-underline mt-3 inline-flex items-center gap-1 text-[11.5px] text-forest">
          Написать в поддержку
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
