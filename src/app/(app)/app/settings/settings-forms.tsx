"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Loader2, MailCheck } from "lucide-react";
import { PREFERENCES, GOALS } from "@/content/catalog";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <p className="label">{label}</p>
      {children}
      {hint ? <p className="hint">{hint}</p> : null}
    </div>
  );
}

function OptionPills({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string | null;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={cn(
            "rounded-lg border px-3 py-2 text-left text-[12px] transition-colors",
            value === option.value
              ? "border-forest bg-forest text-ivory"
              : "border-line bg-paper text-[#565950] hover:border-[#c9c3b6]",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function SaveRow({ pending, saved }: { pending: boolean; saved: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        Сохранить
      </button>
      {saved ? (
        <span className="inline-flex items-center gap-1 text-[11px] text-[#3f5a43]">
          <Check className="h-3.5 w-3.5" />
          Сохранено
        </span>
      ) : null}
    </div>
  );
}

export function ProfileForm({ initialName }: { initialName: string }) {
  const [name, setName] = useState(initialName);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setError(json?.error?.message ?? "Не удалось сохранить имя.");
        return;
      }
      setSaved(true);
      toast.push("Имя обновлено.", "success");
      router.refresh();
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Нет соединения.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm">
      <label htmlFor="displayName" className="label">
        Отображаемое имя
      </label>
      <input
        id="displayName"
        className="input"
        value={name}
        onChange={(event) => setName(event.target.value)}
        minLength={2}
        maxLength={60}
        required
      />
      {error ? <p className="field-error">{error}</p> : null}
      <div className="mt-3">
        <SaveRow pending={pending} saved={saved} />
      </div>
    </form>
  );
}

const TIMEZONES = [
  "Europe/Kaliningrad",
  "Europe/Moscow",
  "Europe/Berlin",
  "Europe/Istanbul",
  "Asia/Tbilisi",
  "Asia/Yekaterinburg",
  "Asia/Almaty",
  "Asia/Novosibirsk",
  "Asia/Dubai",
];

export function PreferencesForm({
  initial,
}: {
  initial: {
    goal: string | null;
    experienceLevel: string | null;
    preferredDuration: string | null;
    preferredTime: string | null;
    timezone: string;
    remindersEnabled: boolean;
  };
}) {
  const [form, setForm] = useState(initial);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/users/me/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setError(json?.error?.message ?? "Не удалось сохранить предпочтения.");
        return;
      }
      setSaved(true);
      toast.push("Предпочтения обновлены. Рекомендации пересчитаны.", "success");
      router.refresh();
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Нет соединения.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Field label="Цель практики">
        <OptionPills
          options={GOALS.map((goal) => ({ value: goal.value, label: goal.label }))}
          value={form.goal}
          onChange={(value) => set("goal", value)}
        />
      </Field>

      <Field label="Опыт">
        <OptionPills options={PREFERENCES.experience} value={form.experienceLevel} onChange={(value) => set("experienceLevel", value)} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Удобная длительность">
          <select
            className="select"
            value={form.preferredDuration ?? ""}
            onChange={(event) => set("preferredDuration", event.target.value || null)}
          >
            <option value="">Не указана</option>
            {PREFERENCES.duration.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Удобное время">
          <select
            className="select"
            value={form.preferredTime ?? ""}
            onChange={(event) => set("preferredTime", event.target.value || null)}
          >
            <option value="">Не указано</option>
            {PREFERENCES.time.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Часовой пояс">
          <select className="select" value={form.timezone} onChange={(event) => set("timezone", event.target.value)}>
            {TIMEZONES.map((timezone) => (
              <option key={timezone} value={timezone}>
                {timezone}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Напоминания" hint="Внутренние напоминания в личном кабинете">
          <button
            type="button"
            role="switch"
            aria-checked={form.remindersEnabled}
            onClick={() => set("remindersEnabled", !form.remindersEnabled)}
            className={cn(
              "flex h-12 w-full items-center justify-between rounded-xl border px-3.5 text-[12.5px] transition-colors",
              form.remindersEnabled ? "border-forest bg-[#f1f4ec] text-forest" : "border-line bg-paper text-[#565950]",
            )}
          >
            {form.remindersEnabled ? "Включены" : "Выключены"}
            <span
              className={cn(
                "relative h-5 w-9 rounded-full transition-colors",
                form.remindersEnabled ? "bg-forest" : "bg-[#d9d4c8]",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all",
                  form.remindersEnabled ? "left-[18px]" : "left-0.5",
                )}
              />
            </span>
          </button>
        </Field>
      </div>

      {error ? <p className="field-error">{error}</p> : null}
      <SaveRow pending={pending} saved={saved} />
    </form>
  );
}

export function PasswordForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const toast = useToast();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (data.get("newPassword") !== data.get("confirm")) {
      setError("Новые пароли не совпадают.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/users/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: data.get("currentPassword"),
          newPassword: data.get("newPassword"),
        }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setError(json?.error?.message ?? "Не удалось изменить пароль.");
        return;
      }
      setDone(true);
      form.reset();
      toast.push("Пароль обновлён.", "success");
    } catch {
      setError("Нет соединения.");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <p className="flex items-center gap-2 text-[12.5px] text-[#3f5a43]">
        <Check className="h-4 w-4" />
        Пароль обновлён. Другие сессии завершены.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid max-w-lg gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label htmlFor="currentPassword" className="label">
          Текущий пароль
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className="input"
        />
      </div>
      <div>
        <label htmlFor="newPassword" className="label">
          Новый пароль
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="input"
        />
      </div>
      <div>
        <label htmlFor="confirm" className="label">
          Повторите пароль
        </label>
        <input id="confirm" name="confirm" type="password" required autoComplete="new-password" className="input" />
      </div>
      {error ? <p className="field-error sm:col-span-2">{error}</p> : null}
      <div className="sm:col-span-2">
        <button type="submit" className="btn btn-secondary btn-sm" disabled={pending}>
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Изменить пароль
        </button>
      </div>
    </form>
  );
}

export function ResendVerification() {
  const [pending, setPending] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const toast = useToast();

  async function resend() {
    setPending(true);
    try {
      const response = await fetch("/api/v1/auth/resend-verification", { method: "POST" });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        toast.push(json?.error?.message ?? "Не удалось отправить письмо.", "error");
        return;
      }
      setSent(true);
      setPreviewUrl(json?.data?.previewUrl ?? null);
      toast.push("Ссылка подтверждения подготовлена.", "success");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-[#dccdb4] bg-[#f7f1e4] p-3.5">
      <p className="flex items-center gap-2 text-[11.5px] font-medium text-[#6b5b42]">
        <MailCheck className="h-3.5 w-3.5" />
        Email не подтверждён
      </p>
      {sent ? (
        <p className="mt-1.5 text-[11.5px] leading-relaxed text-[#6b5b42]">
          Письмо подготовлено.{" "}
          {previewUrl ? (
            <Link href={previewUrl.replace(/^https?:\/\/[^/]+/, "")} className="underline underline-offset-2">
              Открыть ссылку подтверждения (демо)
            </Link>
          ) : (
            "Проверьте почту."
          )}
        </p>
      ) : (
        <button type="button" onClick={resend} disabled={pending} className="mt-1.5 text-[11.5px] underline underline-offset-2">
          {pending ? "Отправляем…" : "Отправить ссылку ещё раз"}
        </button>
      )}
    </div>
  );
}

export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function remove() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/users/me", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: value }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        setError(json?.error?.message ?? "Не удалось удалить аккаунт.");
        return;
      }
      router.push("/?deleted=1");
      router.refresh();
    } catch {
      setError("Нет соединения.");
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn btn-secondary btn-sm text-[#8a3d2f]">
        Запросить удаление аккаунта
      </button>
    );
  }

  return (
    <div className="max-w-md">
      <p className="text-[12px] leading-relaxed text-[#7a5045]">
        Введите <span className="font-medium">УДАЛИТЬ</span>, чтобы подтвердить. Это действие нельзя отменить.
      </p>
      <input
        className="input mt-2"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="УДАЛИТЬ"
        aria-label="Подтверждение удаления"
      />
      {error ? <p className="field-error">{error}</p> : null}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={remove}
          disabled={value !== "УДАЛИТЬ" || pending}
          className="btn btn-danger btn-sm"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Удалить аккаунт
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary btn-sm">
          Отмена
        </button>
      </div>
    </div>
  );
}
