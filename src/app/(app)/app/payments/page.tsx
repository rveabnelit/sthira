import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Download, Receipt } from "lucide-react";
import { requireUser } from "@/lib/auth/guard";
import { listPayments } from "@/lib/data/subscriptions";
import { formatDate, formatPrice } from "@/lib/format";
import { Badge, Eyebrow, EmptyState } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "История платежей",
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Record<string, string> = {
  succeeded: "Оплачен",
  failed: "Не прошёл",
  pending: "Ожидает",
  refunded: "Возврат",
};

export default async function PaymentsPage() {
  const user = await requireUser("/app/payments");
  const payments = listPayments(user.id);

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/app/subscription" className="inline-flex items-center gap-1.5 text-[12px] text-muted hover:text-forest">
        <ArrowLeft className="h-3.5 w-3.5" />
        Подписка
      </Link>

      <header className="mt-4">
        <Eyebrow>Документы</Eyebrow>
        <h1 className="display-2 mt-2 text-[clamp(1.9rem,1.5rem+1.6vw,2.6rem)]">История платежей</h1>
        <p className="mt-1.5 text-[13.5px] text-muted">
          Все операции по подписке. Чек формирует платёжный провайдер; в демо-режиме реальные списания не
          производятся.
        </p>
      </header>

      {payments.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<Receipt className="h-5 w-5" />}
            title="Платежей пока нет"
            description="После оформления подписки здесь появятся операции: дата, сумма, тариф и статус."
            action={
              <Link href="/pricing" className="btn btn-primary btn-sm">
                Выбрать тариф
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <div className="mt-6 hidden overflow-hidden rounded-[16px] border border-line bg-paper md:block">
            <table className="w-full border-collapse text-[12.5px]">
              <thead>
                <tr className="border-b border-line bg-[#f7f3ea] text-left text-[10.5px] uppercase tracking-[0.12em] text-muted">
                  <th className="px-5 py-3 font-medium">Дата</th>
                  <th className="px-5 py-3 font-medium">Тариф</th>
                  <th className="px-5 py-3 font-medium">Сумма</th>
                  <th className="px-5 py-3 font-medium">Статус</th>
                  <th className="px-5 py-3 font-medium">Транзакция</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-line last:border-0">
                    <td className="px-5 py-3.5 text-[#4d5048]">
                      {formatDate(payment.paidAt ?? payment.createdAt, { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3.5">{payment.planName ?? "—"}</td>
                    <td className="px-5 py-3.5 font-medium">{formatPrice(payment.amount, payment.currency)}</td>
                    <td className="px-5 py-3.5">
                      <Badge
                        tone={
                          payment.status === "succeeded"
                            ? "success"
                            : payment.status === "failed"
                              ? "danger"
                              : "sand"
                        }
                      >
                        {STATUS_LABEL[payment.status] ?? payment.status}
                      </Badge>
                    </td>
                    <td className="max-w-[180px] truncate px-5 py-3.5 font-mono text-[10.5px] text-muted">
                      {payment.providerPaymentId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 space-y-3 md:hidden">
            {payments.map((payment) => (
              <div key={payment.id} className="surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-medium">{payment.planName ?? "Подписка"}</p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {formatDate(payment.paidAt ?? payment.createdAt)}
                    </p>
                  </div>
                  <Badge
                    tone={
                      payment.status === "succeeded" ? "success" : payment.status === "failed" ? "danger" : "sand"
                    }
                  >
                    {STATUS_LABEL[payment.status] ?? payment.status}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                  <span className="text-[11px] text-muted">Сумма</span>
                  <span className="text-[13px] font-medium">{formatPrice(payment.amount, payment.currency)}</span>
                </div>
                <p className="mt-2 truncate font-mono text-[10px] text-muted">{payment.providerPaymentId}</p>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-6 flex items-start gap-3 rounded-[16px] border border-line bg-[#f7f3ea] p-4">
        <Download className="mt-0.5 h-4 w-4 shrink-0 text-[#6f7d68]" />
        <p className="text-[11.5px] leading-relaxed text-muted">
          Чеки и закрывающие документы предоставляются по запросу через поддержку. Платёжные документы хранятся в
          соответствии с требованиями бухгалтерского учёта и после удаления аккаунта.
        </p>
      </div>
    </div>
  );
}
