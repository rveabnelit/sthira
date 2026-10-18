import type { Metadata } from "next";
import { listRegistrations, listSessionsForAdmin } from "@/lib/data/live";
import { formatDate, formatTime } from "@/lib/format";
import { AdminHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/primitives";
import { NewSessionForm } from "./new-session";
import { CancelSession } from "./cancel-session";

export const metadata: Metadata = {
  title: "Расписание",
  robots: { index: false, follow: false },
};

export default function AdminSchedulePage() {
  const sessions = listSessionsForAdmin();

  return (
    <div>
      <AdminHeader
        title="Онлайн-занятия"
        description="Расписание прямых эфиров, лимит участников и список записавшихся. Время хранится в UTC и отображается по Москве."
        badge={<Badge>{sessions.length}</Badge>}
      />

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {sessions.map((session) => {
            const registrations = listRegistrations(session.id);
            return (
              <div key={session.id} className="surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-medium">{session.title}</p>
                      <Badge tone={session.status === "scheduled" ? "success" : session.status === "canceled" ? "danger" : "default"}>
                        {session.status === "scheduled" ? "запланировано" : session.status === "canceled" ? "отменено" : "завершено"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-[11px] text-muted">
                      {formatDate(session.startsAt, { weekday: "long", day: "numeric", month: "long" })} ·{" "}
                      {formatTime(session.startsAt)} МСК · {session.durationMinutes} мин
                    </p>
                    <p className="mt-1 text-[10.5px] text-muted">
                      Записано {registrations.length} из {session.capacity}
                      {registrations.length ? `: ${registrations.map((item) => item.display_name).join(", ")}` : ""}
                    </p>
                  </div>
                  {session.status === "scheduled" ? <CancelSession sessionId={session.id} title={session.title} /> : null}
                </div>
              </div>
            );
          })}
          {sessions.length === 0 ? (
            <p className="rounded-xl border border-line bg-paper p-6 text-center text-[12.5px] text-muted">
              Занятий пока нет. Создайте первое занятие в форме справа.
            </p>
          ) : null}
        </div>

        <aside>
          <NewSessionForm />
        </aside>
      </div>
    </div>
  );
}
