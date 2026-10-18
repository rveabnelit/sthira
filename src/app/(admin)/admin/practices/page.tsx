import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { listPractices } from "@/lib/data/practices";
import { difficultyLabel, formatMinutes, goalLabel } from "@/lib/format";
import { AdminHeader, AdminTable, AdminTd, AdminTh } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { PracticeStatusToggle } from "./status-toggle";

export const metadata: Metadata = {
  title: "Практики",
  robots: { index: false, follow: false },
};

const FILTERS = [
  { value: "", label: "Все" },
  { value: "published", label: "Опубликованные" },
  { value: "draft", label: "Черновики" },
  { value: "archived", label: "Архив" },
];

export default async function AdminPracticesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const status = params.status || undefined;
  const { items, total } = listPractices({
    q: params.q,
    status: status ? [status] : ["published", "draft", "archived"],
    limit: 100,
    includeArchived: true,
  });

  return (
    <div>
      <AdminHeader
        title="Практики"
        description="Создание, редактирование и публикация видеозанятий. Черновики не попадают в публичный каталог и API."
        badge={<Badge>{total}</Badge>}
        action={
          <Link href="/admin/practices/new" className={buttonClass("primary", "sm")}>
            <Plus className="h-3.5 w-3.5" />
            Создать практику
          </Link>
        }
      />

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {FILTERS.map((filter) => (
          <Link
            key={filter.value}
            href={filter.value ? `/admin/practices?status=${filter.value}` : "/admin/practices"}
            className={`rounded-full border px-3 py-1.5 text-[11.5px] transition-colors ${
              (params.status ?? "") === filter.value
                ? "border-forest bg-forest text-ivory"
                : "border-line bg-paper text-[#565950] hover:border-sage"
            }`}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      <div className="mt-4">
        <AdminTable>
          <thead>
            <tr>
              <AdminTh>Практика</AdminTh>
              <AdminTh>Длительность</AdminTh>
              <AdminTh>Уровень</AdminTh>
              <AdminTh>Цель</AdminTh>
              <AdminTh>Тариф</AdminTh>
              <AdminTh>Статус</AdminTh>
              <AdminTh>Действия</AdminTh>
            </tr>
          </thead>
          <tbody>
            {items.map((practice) => (
              <tr key={practice.id}>
                <AdminTd>
                  <Link href={`/admin/practices/${practice.id}/edit`} className="font-medium text-ink hover:text-forest">
                    {practice.title}
                  </Link>
                  <p className="text-[10.5px] text-muted">/practice/{practice.slug}</p>
                </AdminTd>
                <AdminTd>{formatMinutes(practice.durationMinutes)}</AdminTd>
                <AdminTd>{difficultyLabel(practice.difficulty)}</AdminTd>
                <AdminTd>{goalLabel(practice.goal)}</AdminTd>
                <AdminTd>
                  <Badge tone={practice.requiredPlan === "practice" ? "default" : "sand"}>
                    {practice.requiredPlan}
                  </Badge>
                </AdminTd>
                <AdminTd>
                  <Badge
                    tone={
                      practice.status === "published" ? "success" : practice.status === "draft" ? "sand" : "default"
                    }
                  >
                    {practice.status === "published" ? "Опубликована" : practice.status === "draft" ? "Черновик" : "Архив"}
                  </Badge>
                </AdminTd>
                <AdminTd>
                  <PracticeStatusToggle practice={practice} />
                </AdminTd>
              </tr>
            ))}
          </tbody>
        </AdminTable>

        <div className="space-y-2 md:hidden">
          {items.map((practice) => (
            <div key={practice.id} className="surface p-4">
              <div className="flex items-start justify-between gap-3">
                <Link href={`/admin/practices/${practice.id}/edit`} className="text-[13px] font-medium">
                  {practice.title}
                </Link>
                <Badge tone={practice.status === "published" ? "success" : "sand"}>{practice.status}</Badge>
              </div>
              <p className="mt-1 text-[11px] text-muted">
                {formatMinutes(practice.durationMinutes)} · {difficultyLabel(practice.difficulty)} · {practice.requiredPlan}
              </p>
              <div className="mt-3">
                <PracticeStatusToggle practice={practice} />
              </div>
            </div>
          ))}
        </div>

        {items.length === 0 ? (
          <p className="mt-6 rounded-xl border border-line bg-paper p-6 text-center text-[12.5px] text-muted">
            Практик с таким фильтром нет.
          </p>
        ) : null}
      </div>
    </div>
  );
}
