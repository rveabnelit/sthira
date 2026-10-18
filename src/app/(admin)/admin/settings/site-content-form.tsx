"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export function SiteContentForm({ initial }: { initial: Record<string, string> }) {
  const [values, setValues] = useState(initial);
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const FIELDS: { key: string; label: string; type?: "text" | "textarea" }[] = [
    { key: "hero.title", label: "Главная: заголовок" },
    { key: "hero.subtitle", label: "Главная: подзаголовок", type: "textarea" },
    { key: "hero.cta", label: "Главная: кнопка" },
    { key: "teacher.name", label: "Имя преподавателя" },
    { key: "teacher.role", label: "Роль преподавателя" },
    { key: "teacher.short", label: "О преподавателе (кратко)", type: "textarea" },
    { key: "about.intro", label: "Страница «О школе»: вступление", type: "textarea" },
    { key: "about.credentials", label: "Квалификация (заполняется владельцем)", type: "textarea" },
    { key: "contacts.email", label: "Email поддержки" },
    { key: "contacts.telegram", label: "Telegram" },
    { key: "contacts.hours", label: "Режим ответа" },
    { key: "footer.note", label: "Примечание в подвале", type: "textarea" },
  ];

  async function save() {
    setPending(true);
    try {
      const response = await fetch("/api/v1/admin/site-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: values }),
      });
      if (!response.ok) {
        toast.push("Не удалось сохранить тексты.", "error");
        return;
      }
      toast.push("Тексты сайта обновлены.", "success");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="surface p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[13px] font-medium">Тексты публичного сайта</h2>
          <p className="mt-1 text-[10.5px] text-muted">Изменения применяются без перезапуска и правок кода.</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
            <label htmlFor={field.key} className="label">
              {field.label}
            </label>
            {field.type === "textarea" ? (
              <textarea
                id={field.key}
                className="textarea text-[12.5px]"
                rows={3}
                value={values[field.key] ?? ""}
                onChange={(event) => setValues((prev) => ({ ...prev, [field.key]: event.target.value }))}
              />
            ) : (
              <input
                id={field.key}
                className="input h-10 text-[12.5px]"
                value={values[field.key] ?? ""}
                onChange={(event) => setValues((prev) => ({ ...prev, [field.key]: event.target.value }))}
              />
            )}
          </div>
        ))}
      </div>
      <button type="button" onClick={save} disabled={pending} className="btn btn-primary btn-sm mt-4">
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
        Сохранить тексты
      </button>
    </section>
  );
}
