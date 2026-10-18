import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProgramById, getProgramModules } from "@/lib/data/programs";
import { listPractices } from "@/lib/data/practices";
import { AdminHeader } from "@/components/admin/page-header";
import { ProgramForm } from "../../program-form";

export const metadata: Metadata = {
  title: "Редактирование программы",
  robots: { index: false, follow: false },
};

export default async function EditProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const program = getProgramById(id);
  if (!program) notFound();
  const modules = getProgramModules(id);

  const practices = listPractices({ status: ["published", "draft"], limit: 100 }).items.map((practice) => ({
    id: practice.id,
    title: practice.title,
    durationMinutes: practice.durationMinutes,
    difficulty: practice.difficulty,
  }));

  return (
    <div>
      <AdminHeader title={program.title} description={`Программа · ${program.status === "published" ? "опубликована" : "черновик"}`} />
      <div className="mt-6">
        <ProgramForm
          program={program}
          practices={practices}
          initialModules={modules.map((module) => ({
            title: module.title,
            description: module.description,
            lessons: module.lessons.map((lesson) => ({ title: lesson.title, practiceId: lesson.practiceId })),
          }))}
        />
      </div>
    </div>
  );
}
