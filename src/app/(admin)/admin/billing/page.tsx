import type { Metadata } from "next";
import Link from "next/link";
import { listBillingPayments, listBillingSubscriptions } from "@/lib/data/admin";
import { listWebhookEvents } from "@/lib/payments/service";
import { formatDate, formatPrice } from "@/lib/format";
import { subscriptionStatusLabel } from "@/lib/access";
import { AdminHeader, AdminTable, AdminTd, AdminTh } from "@/components/admin/page-header";
import { Badge, Eyebrow } from "@/components/ui/primitives";
import { WebhookReplay } from "./webhook-replay";

export const metadata: Metadata = {
  title: "Платежи",
  robots: { index: false, follow: false },
};

const STATUSES = [
  { value: "all", label: "Все" },
  { value: "succeeded", label: "Оплаченные" },
  { value: "failed", label: "С ошибкой" },
  { value: "pending", label: "Ожидают" },
  { value: "refunded", label: "Возвраты" },
];

export default async function AdminBillingPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const payments = listBillingPayments({ q: params.q, status: params.status });
  const subscriptions = listBillingSubscriptions();
  const webhooks = listWebhookEvents(12);
  const confirmed = payments.filter((p) => p.status === "succeeded");
  const revenue = confirmed.reduce((acc, payment) => acc + Number(payment.amount), 0);

  return (
    <div>
      <AdminHeader
        title="Платежи и подписки"
        description="Только просмотр. Возвраты и изменения платежей выполняются через платёжного провайдера с необходимыми правами."
        badge={<Badge>{payments.length}</Badge>}
      />

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="surface p-4">
          <p className="text-[10px] uppercase tracking-[0.12em] text-muted">Подтверждённая выручка</p>
          <p className="mt-1.5 font-serif text-[1.5rem]">{formatPrice(revenue)}</p>
        </div>
        <div className="surface p-4">
          <p className="text-[10px] uppercase tracking-[0.12em] text-muted">Платежей</p>
          <p className="mt-1.5 font-serif text-[1.5rem]">{confirmed.length}</p>
        </div>
        <div className="surface p-4">
          <p className="text-[10px] uppercase tracking-[0.12em] text-muted">Подписок</p>
          <p className="mt-1.5 font-serif text-[1.5rem]">{subscriptions.length}</p>
        </div>
        <div className="surface p-4">
          <p className="text-[10px] uppercase tracking-[0.12em] text-muted">Событий webhook</p>
          <p className="mt-1.5 font-serif text-[1.5rem]">{webhooks.length}</p>
        </div>
      </div>

      <form className="mt-5 flex flex-col gap-2 sm:flex-row" action="/admin/billing">
        <input name="q" defaultValue={params.q} placeholder="Поиск по ученику или email" className="input h-10 flex-1 text-[12.5px]" aria-label="Поиск платежей" />
        <select name="status" defaultValue={params.status ?? "all"} className="select h-10 w-auto text-[12px]" aria-label="Статус платежа">
          {STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-primary btn-sm h-10">
          Применить
        </button>
      </form>

      <div className="mt-4">
        <AdminTable>
          <thead>
            <tr>
              <AdminTh>Ученик</AdminTh>
              <AdminTh>Тариф</AdminTh>
              <AdminTh>Сумма</AdminTh>
              <AdminTh>Дата</AdminTh>
              <AdminTh>Статус</AdminTh>
              <AdminTh>ID платежа провайдера</AdminTh>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id}>
                <AdminTd>
                  <Link href={`/admin/students/${payment.user_id}`} className="font-medium text-ink hover:text-forest">
                    {payment.user_name}
                  </Link>
                  <p className="text-[10.5px] text-muted">{payment.user_email}</p>
                </AdminTd>
                <AdminTd>{payment.plan_name ?? "—"}</AdminTd>
                <AdminTd className="font-medium">{formatPrice(payment.amount, payment.currency)}</AdminTd>
                <AdminTd className="text-[11px] text-muted">
                  {formatDate(payment.paid_at ?? payment.created_at, { day: "numeric", month: "short", year: "numeric" })}
                </AdminTd>
                <AdminTd>
                  <Badge tone={payment.status === "succeeded" ? "success" : payment.status === "failed" ? "danger" : "sand"}>
                    {payment.status === "succeeded" ? "Оплачен" : payment.status === "failed" ? "Ошибка" : payment.status}
                  </Badge>
                </AdminTd>
                <AdminTd className="max-w-[200px] truncate font-mono text-[10px] text-muted">{payment.provider_payment_id}</AdminTd>
              </tr>
            ))}
          </tbody>
        </AdminTable>

        {payments.length === 0 ? (
          <p className="mt-6 rounded-xl border border-line bg-paper p-6 text-center text-[12.5px] text-muted">
            Платежей по этому фильтру нет.
          </p>
        ) : null}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <section className="surface p-5">
          <Eyebrow>Подписки</Eyebrow>
          <div className="mt-3 overflow-hidden rounded-lg border border-line">
            <table className="w-full text-[11.5px]">
              <thead>
                <tr className="border-b border-line bg-[#f7f3ea] text-left text-[10px] uppercase tracking-[0.1em] text-muted">
                  <th className="px-3 py-2 font-medium">Ученик</th>
                  <th className="px-3 py-2 font-medium">Тариф</th>
                  <th className="px-3 py-2 font-medium">Статус</th>
                  <th className="px-3 py-2 font-medium">Доступ до</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.slice(0, 12).map((subscription) => (
                  <tr key={subscription.id} className="border-b border-line last:border-0">
                    <td className="px-3 py-2">{subscription.display_name}</td>
                    <td className="px-3 py-2">{subscription.plan_name}</td>
                    <td className="px-3 py-2 text-muted">
                      {subscriptionStatusLabel({
                        status: subscription.status,
                        cancelAtPeriodEnd: Number(subscription.cancel_at_period_end) === 1,
                        periodEnd: subscription.current_period_end,
                        id: subscription.id,
                        planCode: "practice",
                        planName: subscription.plan_name,
                        price: 0,
                        periodStart: null,
                        provider: "mock",
                        providerSubscriptionId: null,
                      })}
                    </td>
                    <td className="px-3 py-2 text-muted">{formatDate(subscription.current_period_end, { day: "numeric", month: "short" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="surface p-5">
          <Eyebrow>Webhook-события</Eyebrow>
          <p className="mt-2 text-[10.5px] leading-relaxed text-muted">
            Повторная обработка не должна повторно активировать заказ. Нажмите «Повторить», чтобы проверить
            идемпотентность.
          </p>
          <ul className="mt-3 space-y-2">
            {webhooks.map((event) => (
              <li key={event.external_id} className="rounded-lg border border-line bg-paper p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-mono text-[10px] text-[#4d5048]">{event.external_id}</span>
                  <WebhookReplay externalId={event.external_id} />
                </div>
                <p className="mt-1 text-[10px] text-muted">
                  {formatDate(event.received_at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} ·{" "}
                  {event.signature_valid ? "подпись ок" : "подпись неверна"} · {event.result?.slice(0, 60) ?? "без результата"}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
