import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { listPrograms } from "@/lib/data/programs";
import { difficultyLabel } from "@/lib/format";
import { AdminHeader, AdminTable, AdminTd, AdminTh } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Программы",
  robots: { index: false, follow: false },
};

export default function AdminProgramsPage() {
  const programs = listPrograms({ status: ["published", "draft", "archived"], limit: 100 });

  return (
    <div>
      <AdminHeader
        title="Программы"
        description="Модули и уроки, порядок занятий, доступность по тарифу и публикация. Черновики скрыты от учеников."
        badge={<Badge>{programs.length}</Badge>}
        action={
          <Link href="/admin/programs/new" className={buttonClass("primary", "sm")}>
            <Plus className="h-3.5 w-3.5" />
            Создать программу
          </Link>
        }
      />

      <div className="mt-5">
        <AdminTable>
          <thead>
            <tr>
              <AdminTh>Программа</AdminTh>
              <AdminTh>Длительность</AdminTh>
              <AdminTh>Уроков</AdminTh>
              <AdminTh>Уровень</AdminTh>
              <AdminTh>Тариф</AdminTh>
              <AdminTh>Статус</AdminTh>
              <AdminTh />
            </tr>
          </thead>
          <tbody>
            {programs.map((program) => (
              <tr key={program.id}>
                <AdminTd>
                  <Link href={`/admin/programs/${program.id}/edit`} className="font-medium text-ink hover:text-forest">
                    {program.title}
                  </Link>
                  <p className="text-[10.5px] text-muted">/programs/{program.slug}</p>
                </AdminTd>
                <AdminTd>{program.estimatedDuration}</AdminTd>
                <AdminTd>{program.lessonsCount ?? 0}</AdminTd>
                <AdminTd>{difficultyLabel(program.difficulty)}</AdminTd>
                <AdminTd>{program.requiredPlan}</AdminTd>
                <AdminTd>
                  <Badge tone={program.status === "published" ? "success" : program.status === "draft" ? "sand" : "default"}>
                    {program.status === "published" ? "Опубликована" : program.status === "draft" ? "Черновик" : "Архив"}
                  </Badge>
                </AdminTd>
                <AdminTd>
                  <Link href={`/admin/programs/${program.id}/edit`} className="text-[11px] text-forest hover:underline">
                    Изменить
                  </Link>
                </AdminTd>
              </tr>
            ))}
          </tbody>
        </AdminTable>

        <div className="space-y-2 md:hidden">
          {programs.map((program) => (
            <Link key={program.id} href={`/admin/programs/${program.id}/edit`} className="surface block p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] font-medium">{program.title}</p>
                <Badge tone={program.status === "published" ? "success" : "sand"}>{program.status}</Badge>
              </div>
              <p className="mt-1 text-[11px] text-muted">
                {program.estimatedDuration} · {program.lessonsCount} уроков · {program.requiredPlan}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
