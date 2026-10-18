import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { listContactMessages } from "@/lib/data/admin";
import { formatDate } from "@/lib/format";
import { AdminHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Обращения",
  robots: { index: false, follow: false },
};

export default function AdminMessagesPage() {
  const messages = listContactMessages();
  const newCount = messages.filter((message) => message.status === "new").length;

  return (
    <div>
      <AdminHeader
        title="Обращения"
        description="Сообщения из формы на сайте. Отвечайте на указанный email — переписка не хранится в платформе."
        badge={<Badge>{newCount} новых</Badge>}
      />

      <div className="mt-5 space-y-3">
        {messages.map((message) => (
          <article key={message.id} className="surface p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[13px] font-medium">
                  {message.name} <span className="font-normal text-muted">· {message.topic}</span>
                </p>
                <p className="mt-0.5 text-[11px] text-muted">
                  {message.email} · {formatDate(message.created_at, { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={message.status === "new" ? "sand" : "default"}>
                  {message.status === "new" ? "новое" : message.status === "in_progress" ? "в работе" : "закрыто"}
                </Badge>
                <a href={`mailto:${message.email}?subject=Re: ${encodeURIComponent(message.topic)}`} className="btn btn-secondary btn-sm h-8">
                  <Mail className="h-3 w-3" />
                  Ответить
                </a>
              </div>
            </div>
            <p className="mt-3 rounded-lg bg-[#faf7f0] px-3 py-2.5 text-[12.5px] leading-relaxed text-[#4d5048]">
              {message.message}
            </p>
          </article>
        ))}
        {messages.length === 0 ? (
          <p className="rounded-xl border border-line bg-paper p-6 text-center text-[12.5px] text-muted">
            Обращений пока нет.
          </p>
        ) : null}
      </div>
    </div>
  );
}
