import type { Metadata } from "next";
import Link from "next/link";
import { Check, Clock, RefreshCw } from "lucide-react";
import { requireUser } from "@/lib/auth/guard";
import { one } from "@/lib/db";
import { getSubscription } from "@/lib/data/subscriptions";
import { formatDate, formatPrice } from "@/lib/format";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Оплата",
  robots: { index: false, follow: false },
};

export default async function PaymentSuccessPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order: orderId } = await searchParams;
  const user = await requireUser();
  const subscription = getSubscription(user.id);

  const order = orderId
    ? one<{
        id: string;
        status: string;
        amount: number;
        currency: string;
        paid_at: string | null;
        plan_name: string;
        plan_code: string;
        payment_id: string | null;
        provider_payment_id: string | null;
      }>(
        `SELECT o.id, o.status, o.amount, o.currency, o.paid_at, p.name AS plan_name, p.code AS plan_code,
                o.payment_id, pay.provider_payment_id
           FROM checkout_orders o
           JOIN plans p ON p.id = o.plan_id
           LEFT JOIN payments pay ON pay.id = o.payment_id
          WHERE o.id = ? AND o.user_id = ?`,
        orderId,
        user.id,
      )
    : null;

  const paid = order?.status === "paid";

  return (
    <div className="container-app flex max-w-xl flex-col py-14">
      <div className="surface p-7 text-center">
        {paid ? (
          <>
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#e4ebe1] text-[#3f5a43]">
              <Check className="h-6 w-6" />
            </span>
            <h1 className="display-3 mt-5">Подписка активирована</h1>
            <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-muted">
              Платёж подтверждён провайдером. Доступ к материалам тарифа {order.plan_name} уже открыт.
            </p>

            <dl className="mx-auto mt-6 max-w-sm space-y-2 border-y border-line py-4 text-left text-[12.5px]">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Тариф</dt>
                <dd className="font-medium">{order.plan_name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Сумма</dt>
                <dd className="font-medium">{formatPrice(order.amount, order.currency)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Дата оплаты</dt>
                <dd className="font-medium">{formatDate(order.paid_at, { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</dd>
              </div>
              {subscription?.periodEnd ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Доступ до</dt>
                  <dd className="font-medium">{formatDate(subscription.periodEnd)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Транзакция</dt>
                <dd className="max-w-[60%] truncate font-mono text-[11px] text-[#4d5048]">
                  {order.provider_payment_id ?? order.payment_id}
                </dd>
              </div>
            </dl>

            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <ButtonLink href="/app">Перейти в кабинет</ButtonLink>
              <ButtonLink href="/app/practice" variant="secondary">
                К практикам
              </ButtonLink>
            </div>
          </>
        ) : (
          <>
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#f7f1e4] text-[#8a7251]">
              <Clock className="h-6 w-6" />
            </span>
            <h1 className="display-3 mt-5">Ожидаем подтверждение платежа</h1>
            <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-muted">
              Возврат на эту страницу не активирует подписку. Мы ждём подписанное уведомление от платёжного
              провайдера — обычно это занимает несколько секунд.
            </p>
            {/* Страница намеренно не активирует подписку: состояние берётся из базы после webhook. */}
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <Link href={`/payment/success${order ? `?order=${order.id}` : ""}`} className="btn btn-primary">
                <RefreshCw className="h-4 w-4" />
                Проверить снова
              </Link>
              <Link href="/app/subscription" className="btn btn-secondary">
                Управление подпиской
              </Link>
            </div>
            <p className="mt-5 text-[11px] leading-relaxed text-muted">
              Если статус не меняется дольше пяти минут, напишите в поддержку — мы проверим платёж.
            </p>
          </>
        )}
      </div>

      <Link href="/app/subscription" className="mt-6 text-center text-[12px] text-muted hover:text-forest">
        История платежей и управление подпиской
      </Link>
    </div>
  );
}
