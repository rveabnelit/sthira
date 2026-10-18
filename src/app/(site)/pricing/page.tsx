import type { Metadata } from "next";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getSubscription, listPlans } from "@/lib/data/subscriptions";
import { PricingCards } from "@/components/site/pricing-cards";
import { PageHero } from "@/components/site/page-hero";
import { FaqAccordion } from "@/components/site/faq-accordion";
import { Eyebrow } from "@/components/ui/primitives";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Тарифы",
  description:
    "Три тарифа STHIRA: Practice, Guide и Live. Прозрачное сравнение функций, условия подписки и отмены автопродления.",
  alternates: { canonical: "/pricing" },
};

const MATRIX = [
  { label: "Библиотека видеопрактик", values: [true, true, true] },
  { label: "Программы школы", values: [true, true, true] },
  { label: "Личный кабинет и прогресс", values: [true, true, true] },
  { label: "Избранное и история занятий", values: [true, true, true] },
  { label: "Персональные рекомендации", values: [false, true, true] },
  { label: "STHIRA Guide — AI-наставник", values: [false, true, true] },
  { label: "Групповые онлайн-занятия", values: [false, false, true] },
  { label: "Вопросы преподавателю в эфире", values: [false, false, true] },
];

const faq = [
  {
    q: "Как происходит оплата?",
    a: "Оплата проходит через платёжного провайдера. В демонстрационном режиме используется тестовая платёжная форма: реальные деньги не списываются. После подтверждения платежа провайдером подписка активируется автоматически.",
  },
  {
    q: "Когда спишутся деньги за следующий месяц?",
    a: "В дату окончания текущего оплаченного периода. Точная дата отображается в разделе «Подписка».",
  },
  {
    q: "Как отменить подписку?",
    a: "В личном кабинете: «Подписка» → «Отменить автопродление». Доступ сохранится до конца оплаченного периода, после чего продление не произойдёт.",
  },
  {
    q: "Можно ли перейти на другой тариф?",
    a: "Да, оформив новую подписку. Текущая подписка заменяется, доступ к функциям нового тарифа открывается после подтверждения оплаты.",
  },
  {
    q: "Что будет, если платёж не пройдёт?",
    a: "Подписка не продлится, а в личном кабинете появится сообщение с возможностью повторить оплату. Доступ сохранится до конца уже оплаченного периода.",
  },
  {
    q: "Есть ли годовая подписка и промокоды?",
    a: "В MVP доступна только месячная подписка. Годовые планы, промокоды и подарочные сертификаты запланированы после запуска.",
  },
];

export default async function PricingPage() {
  const plans = listPlans();
  const user = await getCurrentUser();
  const subscription = user ? getSubscription(user.id) : null;

  return (
    <>
      <PageHero
        eyebrow="Подписка"
        title="Три способа заниматься"
        description="Все тарифы включают библиотеку, программы и личный кабинет. Разница — в персональных рекомендациях, AI-наставнике и онлайн-занятиях. Оплата помесячная, автопродление можно отменить в любой момент."
      />

      <section className="container-app pt-10">
        <PricingCards plans={plans} currentPlanCode={subscription?.planCode ?? null} />
        <p className="mt-5 text-center text-[11.5px] leading-relaxed text-muted">
          Цены указаны для демонстрационного стенда и настраиваются администратором.{" "}
          <Link href="/subscription-terms" className="link-underline text-forest">
            Условия подписки
          </Link>
        </p>
      </section>

      <section className="container-app section">
        <div className="max-w-2xl">
          <Eyebrow className="mb-4">Сравнение</Eyebrow>
          <h2 className="display-2">Что входит в каждый тариф</h2>
        </div>

        <div className="mt-8 hidden overflow-hidden rounded-[18px] border border-line bg-paper md:block">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-line bg-[#f7f3ea]">
                <th scope="col" className="px-5 py-4 text-left text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
                  Возможности
                </th>
                {plans.map((plan) => (
                  <th key={plan.code} scope="col" className="px-5 py-4 text-center">
                    <span className="font-serif text-[1.15rem] font-medium text-ink">{plan.name}</span>
                    <span className="mt-0.5 block text-[11px] font-normal text-muted">
                      {formatPrice(plan.price, plan.currency)} / мес
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MATRIX.map((row) => (
                <tr key={row.label} className="border-b border-line last:border-0">
                  <th scope="row" className="px-5 py-3.5 text-left font-normal text-[#4d5048]">
                    {row.label}
                  </th>
                  {row.values.map((value, index) => (
                    <td key={index} className="px-5 py-3.5 text-center">
                      {value ? (
                        <Check className="mx-auto h-4 w-4 text-[#5c7a5f]" aria-label="Включено" />
                      ) : (
                        <Minus className="mx-auto h-4 w-4 text-[#c3c0b6]" aria-label="Не входит" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 grid gap-4 md:hidden">
          {plans.map((plan) => (
            <div key={plan.code} className="surface p-5">
              <p className="font-serif text-[1.35rem]">{plan.name}</p>
              <p className="mt-1 text-[12.5px] text-muted">{formatPrice(plan.price, plan.currency)} / месяц</p>
              <ul className="mt-4 space-y-2 text-[12.5px]">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#5c7a5f]" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-paper">
        <div className="container-app section grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <Eyebrow className="mb-4">Условия</Eyebrow>
            <h2 className="display-2">Прозрачно о подписке</h2>
            <ul className="mt-6 space-y-4 text-[13.5px] leading-relaxed text-[#4d5048]">
              <li className="border-t border-line pt-4">
                <strong className="font-medium text-ink">Оплата помесячная.</strong> Подписка продлевается
                автоматически на следующий месяц, если автопродление не отменено.
              </li>
              <li className="border-t border-line pt-4">
                <strong className="font-medium text-ink">Отмена — в личном кабинете.</strong> Доступ сохраняется до
                конца оплаченного периода. Деньги за неиспользованный период не списываются повторно.
              </li>
              <li className="border-t border-line pt-4">
                <strong className="font-medium text-ink">Активация только после подтверждения.</strong> Подписка
                включается после проверки подписи и подлинности уведомления платёжного провайдера, а не после
                возврата на страницу успеха.
              </li>
              <li className="border-t border-line pt-4">
                <strong className="font-medium text-ink">Данные карты не хранятся.</strong> Платёжные данные
                обрабатываются провайдером; платформа получает только идентификатор транзакции и статус.
              </li>
            </ul>
          </div>

          <div>
            <Eyebrow className="mb-4">Оплата</Eyebrow>
            <h2 className="display-2 mb-6">Вопросы об оплате и отмене</h2>
            <FaqAccordion items={faq} />
          </div>
        </div>
      </section>
    </>
  );
}
