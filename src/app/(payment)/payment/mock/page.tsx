import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Lock, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth/guard";
import { DEMO_MODE } from "@/lib/email";
import { one } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { MockConfirmButtons } from "./confirm-buttons";

export const metadata: Metadata = {
  title: "Оплата",
  robots: { index: false, follow: false },
};

export default async function MockPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; payment?: string; amount?: string; plan?: string }>;
}) {
  const params = await searchParams;
  // Тестовая платёжная форма существует только на демонстрационном стенде.
  if (!DEMO_MODE) notFound();
  const user = await requireUser("/app/subscription");
  if (!params.order || !params.payment) notFound();

  const order = one<{
    id: string;
    user_id: string;
    amount: number;
    currency: string;
    status: string;
    plan_name: string;
  }>(
    `SELECT o.id, o.user_id, o.amount, o.currency, o.status, p.name AS plan_name
       FROM checkout_orders o JOIN plans p ON p.id = o.plan_id
      WHERE o.id = ?`,
    params.order,
  );
  if (!order || order.user_id !== user.id) notFound();
  if (order.status === "paid") redirect(`/payment/success?order=${order.id}`);

  return (
    <div className="container-app flex max-w-xl flex-col py-12">
      <div className="surface overflow-hidden">
        <div className="border-b border-line bg-[#f7f3ea] px-6 py-4">
          <p className="text-[10.5px] uppercase tracking-[0.16em] text-muted">STHIRA Pay · sandbox</p>
          <p className="mt-1 text-[13px] text-[#4d5048]">Тестовая платёжная форма. Реальные деньги не списываются.</p>
        </div>

        <div className="p-6">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted">К оплате</p>
          <p className="mt-2 font-serif text-[2.2rem] leading-none">{formatPrice(order.amount, order.currency)}</p>
          <p className="mt-2 text-[13px] text-muted">
            Тариф {order.plan_name} · месяц · автопродление
          </p>

          <dl className="mt-6 space-y-2 border-t border-line pt-4 text-[12.5px]">
            <div className="flex justify-between">
              <dt className="text-muted">Заказ</dt>
              <dd className="font-mono text-[11px] text-[#4d5048]">{order.id.slice(0, 18)}…</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Платёж</dt>
              <dd className="font-mono text-[11px] text-[#4d5048]">{params.payment.slice(0, 18)}…</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Плательщик</dt>
              <dd className="text-[#4d5048]">{user.email}</dd>
            </div>
          </dl>

          <MockConfirmButtons orderId={order.id} paymentId={params.payment} />

          <div className="mt-5 flex items-start gap-2 rounded-lg border border-line bg-[#fbfaf7] p-3">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6f7d68]" />
            <p className="text-[11px] leading-relaxed text-muted">
              После подтверждения провайдер отправит подписанное уведомление. Подписка активируется только после
              проверки подписи и суммы заказа на сервере.
            </p>
          </div>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-[10.5px] text-muted">
            <Lock className="h-3 w-3" />
            Данные карты не запрашиваются
          </p>
        </div>
      </div>

      <Link href="/app/subscription" className="mt-6 text-center text-[12px] text-muted hover:text-forest">
        Отменить и вернуться в кабинет
      </Link>
    </div>
  );
}
