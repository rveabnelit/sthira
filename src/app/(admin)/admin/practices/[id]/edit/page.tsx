import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getPracticeById } from "@/lib/data/practices";
import { AdminHeader } from "@/components/admin/page-header";
import { PracticeForm } from "../../practice-form";

export const metadata: Metadata = {
  title: "Редактирование практики",
  robots: { index: false, follow: false },
};

export default async function EditPracticePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const practice = getPracticeById(id);
  if (!practice) notFound();

  return (
    <div>
      <AdminHeader
        title={practice.title}
        description={`Практика · ${practice.status === "published" ? "опубликована" : practice.status === "draft" ? "черновик" : "архив"}`}
        action={
          <Link href={`/practice/${practice.slug}`} target="_blank" className="btn btn-secondary btn-sm">
            <ExternalLink className="h-3.5 w-3.5" />
            Открыть на сайте
          </Link>
        }
      />
      <div className="mt-6">
        <PracticeForm practice={practice} />
      </div>
    </div>
  );
}
