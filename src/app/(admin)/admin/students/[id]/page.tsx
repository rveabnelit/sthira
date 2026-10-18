import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail } from "lucide-react";
import { getStudentDetail } from "@/lib/data/admin";
import { getSubscription, listPayments } from "@/lib/data/subscriptions";
import { listCompletions } from "@/lib/data/progress";
import { listUserPrograms } from "@/lib/data/programs";
import { canAccessPlan, subscriptionStatusLabel } from "@/lib/access";
import { formatDate, formatMinutes, formatPrice } from "@/lib/format";
import { Badge, Eyebrow, KeyValue, Progress, Stat } from "@/components/ui/primitives";
import { AdminHeader } from "@/components/admin/page-header";

export const metadata: Metadata = {
  title: "Карточка ученика",
  robots: { index: false, follow: false },
};

export default async function AdminStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = getStudentDetail(id);
  if (!detail) notFound();

  const subscription = getSubscription(id);
  const payments = listPayments(id);
  const completions = listCompletions(id, 20).items;
  const programs = listUserPrograms(id, canAccessPlan(subscription, "practice"));

  return (
    <div>
      <Link href="/admin/students" className="inline-flex items-center gap-1.5 text-[11.5px] text-muted hover:text-forest">
        <ArrowLeft className="h-3.5 w-3.5" />
        Ученики
      </Link>

      <div className="mt-3">
        <AdminHeader
          title={detail.user.display_name}
          description={detail.user.email}
          badge={
            <Badge tone={subscription?.status === "active" ? "success" : "default"}>
              {subscriptionStatusLabel(subscription)}
            </Badge>
          }
          action={
            <a href={`mailto:${detail.user.email}`} className="btn btn-secondary btn-sm">
              <Mail className="h-3.5 w-3.5" />
              Написать
            </a>
          }
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Регистрация" value={formatDate(detail.user.created_at, { day: "numeric", month: "short", year: "numeric" })} />
        <Stat label="Занятий завершено" value={detail.completions.length} hint={detail.completions[0] ? `последнее ${formatDate(detail.completions[0].completed_at, { day: "numeric", month: "short" })}` : "пока нет"} />
        <Stat label="Подписка" value={subscription?.planName ?? "—"} hint={subscription ? `до ${formatDate(subscription.periodEnd)}` : "не оформлена"} />
        <Stat label="Email" value={detail.user.email_verified_at ? "Подтверждён" : "Не подтверждён"} hint={detail.user.email_verified_at ? formatDate(detail.user.email_verified_at) : "требуется подтверждение"} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-4">
          <section className="surface p-5">
            <Eyebrow>Подписка</Eyebrow>
            {subscription ? (
              <dl className="mt-3">
                <KeyValue label="Тариф">{subscription.planName}</KeyValue>
                <KeyValue label="Статус">{subscriptionStatusLabel(subscription)}</KeyValue>
                <KeyValue label="Период">{formatDate(subscription.periodStart)} — {formatDate(subscription.periodEnd)}</KeyValue>
                <KeyValue label="Автопродление">{subscription.cancelAtPeriodEnd ? "отключено" : "включено"}</KeyValue>
                <KeyValue label="Провайдер">{subscription.provider}</KeyValue>
                <KeyValue label="ID подписки провайдера">{subscription.providerSubscriptionId ?? "—"}</KeyValue>
              </dl>
            ) : (
              <p className="mt-2 text-[12px] text-muted">Подписка не оформлена.</p>
            )}
          </section>

          <section className="surface p-5">
            <div className="flex items-center justify-between">
              <Eyebrow>История занятий</Eyebrow>
              <span className="text-[11px] text-muted">{completions.length} записей</span>
            </div>
            {completions.length === 0 ? (
              <p className="mt-3 text-[12px] text-muted">Ученик ещё не завершил ни одной практики.</p>
            ) : (
              <ul className="mt-2">
                {completions.slice(0, 8).map((completion) => (
                  <li key={completion.id} className="flex items-center justify-between gap-3 border-b border-line py-2.5 last:border-0">
                    <span className="text-[12px] text-ink">{completion.practiceTitle}</span>
                    <span className="text-[10.5px] text-muted">
                      {formatDate(completion.completedAt, { day: "numeric", month: "short" })}
                      {completion.durationSeconds ? ` · ${formatMinutes(Math.round(completion.durationSeconds / 60))}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="surface p-5">
            <Eyebrow>Платежи</Eyebrow>
            <div className="mt-3 overflow-hidden rounded-lg border border-line">
              <table className="w-full text-[11.5px]">
                <thead>
                  <tr className="border-b border-line bg-[#f7f3ea] text-left text-[10px] uppercase tracking-[0.1em] text-muted">
                    <th className="px-3 py-2 font-medium">Дата</th>
                    <th className="px-3 py-2 font-medium">Тариф</th>
                    <th className="px-3 py-2 font-medium">Сумма</th>
                    <th className="px-3 py-2 font-medium">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-line last:border-0">
                      <td className="px-3 py-2">{formatDate(payment.paidAt ?? payment.createdAt, { day: "numeric", month: "short" })}</td>
                      <td className="px-3 py-2">{payment.planName ?? "—"}</td>
                      <td className="px-3 py-2">{formatPrice(payment.amount, payment.currency)}</td>
                      <td className="px-3 py-2 text-muted">
                        {payment.status === "succeeded" ? "оплачен" : payment.status === "failed" ? "ошибка" : payment.status}
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-center text-muted">
                        Платежей нет
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <section className="surface p-5">
            <Eyebrow>Предпочтения</Eyebrow>
            <dl className="mt-3">
              <KeyValue label="Уровень">{detail.prefs?.experience_level ?? "—"}</KeyValue>
              <KeyValue label="Цель">{detail.prefs?.goal ?? "—"}</KeyValue>
              <KeyValue label="Длительность">{detail.prefs?.preferred_duration ?? "—"}</KeyValue>
              <KeyValue label="Время">{detail.prefs?.preferred_time ?? "—"}</KeyValue>
              <KeyValue label="Онбординг">{detail.prefs?.onboarding_completed_at ? "пройден" : "не пройден"}</KeyValue>
            </dl>
          </section>

          <section className="surface p-5">
            <Eyebrow>Программы</Eyebrow>
            <div className="mt-3 space-y-3">
              {programs.slice(0, 3).map((item) => (
                <div key={item.program.id}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[11.5px] text-ink">{item.program.title}</span>
                    <span className="text-[10.5px] text-muted">{item.percent}%</span>
                  </div>
                  <Progress value={item.percent} className="mt-1.5" />
                </div>
              ))}
            </div>
          </section>

          <div className="rounded-[12px] border border-line bg-[#f7f3ea] p-4">
            <p className="text-[11px] font-medium text-ink">Ограничения прав</p>
            <p className="mt-1.5 text-[10.5px] leading-relaxed text-muted">
              Администратор видит прогресс и платежи, но не может изменить платёж вручную: возвраты выполняются
              только через платёжного провайдера. Действия фиксируются в журнале.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
