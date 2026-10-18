import type { Metadata } from "next";
import { listPractices } from "@/lib/data/practices";
import { AdminHeader } from "@/components/admin/page-header";
import { ProgramForm } from "../program-form";

export const metadata: Metadata = {
  title: "Новая программа",
  robots: { index: false, follow: false },
};

export default function NewProgramPage() {
  const practices = listPractices({
    status: ["published", "draft"],
    limit: 100,
    includeArchived: false,
  }).items.map((practice) => ({
    id: practice.id,
    title: practice.title,
    durationMinutes: practice.durationMinutes,
    difficulty: practice.difficulty,
  }));

  return (
    <div>
      <AdminHeader
        title="Новая программа"
        description="Соберите модули и уроки. Урок — это конкретная практика из библиотеки."
      />
      <div className="mt-6">
        <ProgramForm practices={practices} />
      </div>
    </div>
  );
}
