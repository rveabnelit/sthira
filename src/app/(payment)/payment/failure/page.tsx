import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/auth/guard";
import { one } from "@/lib/db";
import { getSubscription } from "@/lib/data/subscriptions";
import { formatDate, formatPrice } from "@/lib/format";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Платёж не прошёл",
  robots: { index: false, follow: false },
};

export default async function PaymentFailurePage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order: orderId } = await searchParams;
  const user = await requireUser("/app/subscription");
  const subscription = getSubscription(user.id);

  const order = orderId
    ? one<{
        id: string;
        status: string;
        amount: number;
        currency: string;
        plan_name: string;
        plan_code: string;
        failure_reason: string | null;
        created_at: string;
      }>(
        `SELECT o.id, o.status, o.amount, o.currency, p.name AS plan_name, p.code AS plan_code,
                (SELECT failure_reason FROM payments pay WHERE pay.order_id = o.id ORDER BY pay.created_at DESC LIMIT 1) AS failure_reason,
                o.created_at
           FROM checkout_orders o JOIN plans p ON p.id = o.plan_id
          WHERE o.id = ? AND o.user_id = ?`,
        orderId,
        user.id,
      )
    : null;

  return (
    <div className="container-app flex max-w-xl flex-col py-14">
      <div className="surface p-7 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#f3e3de] text-[#8a3d2f]">
          <AlertTriangle className="h-6 w-6" />
        </span>
        <h1 className="display-3 mt-5">Платёж не прошёл</h1>
        <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-muted">
          Провайдер не подтвердил оплату. Деньги не списаны, доступ к платным материалам не изменился.
        </p>

        {order ? (
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
              <dt className="text-muted">Дата попытки</dt>
              <dd className="font-medium">{formatDate(order.created_at)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Причина</dt>
              <dd className="max-w-[60%] text-right text-[#8a3d2f]">
                {order.failure_reason ?? "Тестовый платёж отклонён"}
              </dd>
            </div>
          </dl>
        ) : null}

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <ButtonLink href={order ? `/checkout?plan=${order.plan_code}` : "/pricing"}>
            Попробовать снова
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
          <ButtonLink href="/app/subscription" variant="secondary">
            Управление подпиской
          </ButtonLink>
        </div>

        {subscription && subscription.status !== "expired" ? (
          <p className="mt-5 rounded-lg border border-line bg-[#f7f3ea] px-3 py-2 text-[11.5px] leading-relaxed text-[#5c5f56]">
            Текущий доступ по тарифу {subscription.planName} сохраняется до {formatDate(subscription.periodEnd)}.
          </p>
        ) : null}
      </div>

      <p className="mt-6 text-center text-[11.5px] leading-relaxed text-muted">
        Если проблема повторяется, напишите в{" "}
        <Link href="/contacts" className="link-underline text-forest">
          поддержку
        </Link>
        , указав дату и сумму платежа.
      </p>
    </div>
  );
}
