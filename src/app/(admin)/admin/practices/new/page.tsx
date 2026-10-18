import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/page-header";
import { PracticeForm } from "../practice-form";

export const metadata: Metadata = {
  title: "Новая практика",
  robots: { index: false, follow: false },
};

export default function NewPracticePage() {
  return (
    <div>
      <AdminHeader
        title="Новая практика"
        description="Заполните поля и сохраните черновик. Практика появится в каталоге только после публикации."
      />
      <div className="mt-6">
        <PracticeForm />
      </div>
    </div>
  );
}
