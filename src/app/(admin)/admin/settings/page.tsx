import type { Metadata } from "next";
import { listAuditLog } from "@/lib/data/admin";
import { listPlans } from "@/lib/data/subscriptions";
import { getSiteContent } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { AdminHeader } from "@/components/admin/page-header";
import { Eyebrow } from "@/components/ui/primitives";
import { SiteContentForm } from "./site-content-form";
import { PlansForm } from "./plans-form";

export const metadata: Metadata = {
  title: "Настройки",
  robots: { index: false, follow: false },
};

export default function AdminSettingsPage() {
  const content = getSiteContent();
  const plans = listPlans(true);
  const audit = listAuditLog(12);

  return (
    <div>
      <AdminHeader
        title="Настройки платформы"
        description="Тексты сайта, тарифы и журнал административных действий. Секреты и платёжные данные в журнал не попадают."
      />

      <div className="mt-5 space-y-4">
        <SiteContentForm initial={content} />
        <PlansForm plans={plans} />

        <section className="surface p-5">
          <Eyebrow>Внешние сервисы</Eyebrow>
          <div className="mt-3 grid gap-3 text-[12px] sm:grid-cols-2">
            <div className="rounded-lg border border-line bg-[#faf7f0] p-3">
              <p className="font-medium text-ink">Платёжный провайдер</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">
                Mock-провайдер «STHIRA Pay sandbox». Webhook: <code className="text-[10.5px]">/api/v1/webhooks/payment-provider</code>{" "}
                с HMAC-подписью. Секрет — в переменной PAYMENT_WEBHOOK_SECRET.
              </p>
            </div>
            <div className="rounded-lg border border-line bg-[#faf7f0] p-3">
              <p className="font-medium text-ink">Видео</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">
                В MVP — демо-плеер и поддержка прямой ссылки на mp4/HLS. Для production подключается видеохостинг
                с подписанными ссылками.
              </p>
            </div>
            <div className="rounded-lg border border-line bg-[#faf7f0] p-3">
              <p className="font-medium text-ink">AI-наставник</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">
                Демо-провайдер: ответы собираются по базе знаний локально. Для подключения внешней модели
                используется переменная окружения и серверный слой интеграции.
              </p>
            </div>
            <div className="rounded-lg border border-line bg-[#faf7f0] p-3">
              <p className="font-medium text-ink">Email</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">
                Провайдер не подключён: письма попадают в лог сервера, а ссылки показываются в демо-режиме.
                Подтверждение email и восстановление пароля работают end-to-end.
              </p>
            </div>
          </div>
        </section>

        <section className="surface p-5">
          <Eyebrow>Журнал действий</Eyebrow>
          <div className="mt-3 overflow-hidden rounded-lg border border-line">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-line bg-[#f7f3ea] text-left text-[10px] uppercase tracking-[0.1em] text-muted">
                  <th className="px-3 py-2 font-medium">Время</th>
                  <th className="px-3 py-2 font-medium">Действие</th>
                  <th className="px-3 py-2 font-medium">Автор</th>
                  <th className="px-3 py-2 font-medium">Сущность</th>
                  <th className="px-3 py-2 font-medium">Результат</th>
                </tr>
              </thead>
              <tbody>
                {audit.map((entry) => (
                  <tr key={entry.id} className="border-b border-line last:border-0">
                    <td className="px-3 py-2 text-muted">
                      {formatDate(entry.created_at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-3 py-2 font-mono text-[10px]">{entry.action}</td>
                    <td className="px-3 py-2 text-muted">{entry.actor_email ?? "system"}</td>
                    <td className="px-3 py-2 text-muted">
                      {entry.entity_type}
                      {entry.entity_id ? ` · ${entry.entity_id.slice(0, 8)}` : ""}
                    </td>
                    <td className="px-3 py-2">{entry.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
