import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { listStudents } from "@/lib/data/admin";
import { getSubscription } from "@/lib/data/subscriptions";
import { subscriptionStatusLabel } from "@/lib/access";
import { formatDate, relativeDays } from "@/lib/format";
import { AdminHeader, AdminTable, AdminTd, AdminTh } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Ученики",
  robots: { index: false, follow: false },
};

const STATUS_TABS = [
  { value: "", label: "Все" },
  { value: "active", label: "Активные" },
  { value: "none", label: "Без подписки" },
  { value: "expired", label: "Истёкшие" },
  { value: "past_due", label: "Ошибка платежа" },
];

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const students = listStudents({ q: params.q, status: params.status, sort: params.sort });

  return (
    <div>
      <AdminHeader
        title="Ученики"
        description="Поиск по имени и email, статус подписки и последняя активность. Платёжные данные не отображаются."
        badge={<Badge>{students.length}</Badge>}
      />

      <form className="mt-5 flex flex-col gap-2 sm:flex-row" action="/admin/students">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            name="q"
            defaultValue={params.q}
            placeholder="Имя или email"
            aria-label="Поиск учеников"
            className="input h-10 pl-9 text-[12.5px]"
          />
        </div>
        <div className="flex gap-2">
          <select name="status" defaultValue={params.status ?? ""} className="select h-10 w-auto text-[12px]" aria-label="Статус подписки">
            {STATUS_TABS.map((tab) => (
              <option key={tab.value} value={tab.value}>
                {tab.label}
              </option>
            ))}
          </select>
          <select name="sort" defaultValue={params.sort ?? "new"} className="select h-10 w-auto text-[12px]" aria-label="Сортировка">
            <option value="new">Сначала новые</option>
            <option value="activity">По активности</option>
            <option value="name">По имени</option>
          </select>
          <button type="submit" className="btn btn-primary btn-sm h-10">
            Применить
          </button>
        </div>
      </form>

      <div className="mt-4">
        <AdminTable>
          <thead>
            <tr>
              <AdminTh>Ученик</AdminTh>
              <AdminTh>Регистрация</AdminTh>
              <AdminTh>Тариф</AdminTh>
              <AdminTh>Статус</AdminTh>
              <AdminTh>Последняя активность</AdminTh>
              <AdminTh>Занятий</AdminTh>
              <AdminTh />
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
              const subscription = getSubscription(student.id);
              return (
                <tr key={student.id}>
                  <AdminTd>
                    <Link href={`/admin/students/${student.id}`} className="font-medium text-ink hover:text-forest">
                      {student.displayName}
                    </Link>
                    <p className="text-[10.5px] text-muted">{student.email}</p>
                  </AdminTd>
                  <AdminTd className="text-[11px] text-muted">{formatDate(student.createdAt, { day: "numeric", month: "short", year: "numeric" })}</AdminTd>
                  <AdminTd>{student.planName ?? "—"}</AdminTd>
                  <AdminTd>
                    <Badge
                      tone={
                        subscription?.status === "active"
                          ? "success"
                          : subscription?.status === "canceled"
                            ? "sand"
                            : subscription?.status === "past_due"
                              ? "danger"
                              : "default"
                      }
                    >
                      {subscriptionStatusLabel(subscription)}
                    </Badge>
                  </AdminTd>
                  <AdminTd className="text-[11px] text-muted">
                    {student.lastActivity ? relativeDays(student.lastActivity) : "не занимался"}
                  </AdminTd>
                  <AdminTd className="text-[11px]">{student.completions}</AdminTd>
                  <AdminTd>
                    <Link href={`/admin/students/${student.id}`} className="text-[11px] text-forest hover:underline">
                      Открыть
                    </Link>
                  </AdminTd>
                </tr>
              );
            })}
          </tbody>
        </AdminTable>

        <div className="space-y-3 md:hidden">
          {students.map((student) => {
            const subscription = getSubscription(student.id);
            return (
              <Link key={student.id} href={`/admin/students/${student.id}`} className="surface block p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-medium">{student.displayName}</p>
                    <p className="text-[11px] text-muted">{student.email}</p>
                  </div>
                  <Badge tone={subscription?.status === "active" ? "success" : "default"}>
                    {subscriptionStatusLabel(subscription)}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
                  <span>{student.planName ?? "Без тарифа"}</span>
                  <span>{student.completions} занятий</span>
                </div>
              </Link>
            );
          })}
        </div>

        {students.length === 0 ? (
          <p className="mt-6 rounded-xl border border-line bg-paper p-6 text-center text-[12.5px] text-muted">
            По этому запросу учеников нет.
          </p>
        ) : null}
      </div>
    </div>
  );
}
