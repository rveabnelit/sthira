import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, MailWarning } from "lucide-react";
import { requireUser } from "@/lib/auth/guard";
import { getPreferences } from "@/lib/data/preferences";
import { getSubscription } from "@/lib/data/subscriptions";
import { subscriptionStatusLabel } from "@/lib/access";
import { formatDate } from "@/lib/format";
import { Badge, Eyebrow, KeyValue } from "@/components/ui/primitives";
import { ProfileForm, PreferencesForm, PasswordForm, DeleteAccount, ResendVerification } from "./settings-forms";

export const metadata: Metadata = {
  title: "Профиль и настройки",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const user = await requireUser("/app/settings");
  const prefs = getPreferences(user.id);
  const subscription = getSubscription(user.id);

  return (
    <div className="mx-auto max-w-3xl">
      <header>
        <Eyebrow>Аккаунт</Eyebrow>
        <h1 className="display-2 mt-2 text-[clamp(1.9rem,1.5rem+1.6vw,2.6rem)]">Профиль и настройки</h1>
        <p className="mt-1.5 text-[13.5px] text-muted">
          Данные аккаунта, предпочтения практики и безопасность. Изменения сохраняются на сервере.
        </p>
      </header>

      <section className="surface mt-6 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="display-4">Личные данные</h2>
            <p className="mt-1 text-[11.5px] text-muted">Имя видно только вам в личном кабинете.</p>
          </div>
          <span className="grid h-11 w-11 place-items-center rounded-full bg-sage-soft font-serif text-[1rem] text-forest">
            {user.displayName.slice(0, 2).toUpperCase()}
          </span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="label">Email</p>
            <div className="flex h-12 items-center justify-between gap-2 rounded-xl border border-line bg-[#f7f3ea] px-3.5">
              <span className="truncate text-[13px] text-[#4d5048]">{user.email}</span>
              {user.emailVerifiedAt ? (
                <Badge tone="success">
                  <BadgeCheck className="h-3 w-3" />
                  Подтверждён
                </Badge>
              ) : (
                <Badge tone="sand">
                  <MailWarning className="h-3 w-3" />
                  Не подтверждён
                </Badge>
              )}
            </div>
            <p className="mt-1.5 text-[10.5px] leading-relaxed text-muted">
              Изменение email требует повторного подтверждения и в MVP выполняется через поддержку.
            </p>
          </div>

          <div>
            <p className="label">Дата регистрации</p>
            <div className="flex h-12 items-center rounded-xl border border-line bg-[#f7f3ea] px-3.5 text-[13px] text-[#4d5048]">
              {formatDate(user.createdAt)}
            </div>
          </div>
        </div>

        {!user.emailVerifiedAt ? <ResendVerification /> : null}

        <div className="mt-5 border-t border-line pt-5">
          <ProfileForm initialName={user.displayName} />
        </div>
      </section>

      <section className="surface mt-4 p-5">
        <h2 className="display-4">Предпочтения практики</h2>
        <p className="mt-1 text-[11.5px] text-muted">
          По этим ответам платформа подбирает практики и программы. Можно менять в любой момент.
        </p>
        <div className="mt-5">
          <PreferencesForm
            initial={{
              goal: prefs?.goal ?? null,
              experienceLevel: prefs?.experienceLevel ?? null,
              preferredDuration: prefs?.preferredDuration ?? null,
              preferredTime: prefs?.preferredTime ?? null,
              timezone: prefs?.timezone ?? "Europe/Moscow",
              remindersEnabled: prefs?.remindersEnabled ?? false,
            }}
          />
        </div>
      </section>

      <section className="surface mt-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="display-4">Подписка</h2>
            <p className="mt-1 text-[11.5px] text-muted">Тариф и дата следующего списания.</p>
          </div>
          <Link href="/app/subscription" className="inline-flex items-center gap-1 text-[11.5px] text-forest hover:underline">
            Управлять
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <dl className="mt-4">
          <KeyValue label="Тариф">{subscription?.planName ?? "Нет подписки"}</KeyValue>
          <KeyValue label="Статус">{subscriptionStatusLabel(subscription)}</KeyValue>
          <KeyValue label="Доступ до">{formatDate(subscription?.periodEnd ?? null)}</KeyValue>
          <KeyValue label="История платежей">
            <Link href="/app/payments" className="text-forest hover:underline">
              Открыть
            </Link>
          </KeyValue>
        </dl>
      </section>

      <section className="surface mt-4 p-5">
        <h2 className="display-4">Безопасность</h2>
        <p className="mt-1 text-[11.5px] text-muted">
          Пароль хранится в виде необратимого хеша. Смена пароля завершает сессии на других устройствах.
        </p>
        <div className="mt-5">
          <PasswordForm />
        </div>
      </section>

      <section className="mt-4 rounded-[16px] border border-[#e3c8c0] bg-[#fbf7f4] p-5">
        <h2 className="display-4 text-[1.25rem]">Удаление аккаунта</h2>
        <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">
          Аккаунт и персональные данные удаляются. Платёжные документы сохраняются в объёме, требуемом для
          бухгалтерского учёта. Действие необратимо.
        </p>
        <div className="mt-4">
          <DeleteAccount />
        </div>
      </section>

      <p className="mt-6 text-[10.5px] leading-relaxed text-muted">
        Настройки уведомлений в MVP управляют только внутренними напоминаниями. Email-рассылки не подключены.
        Вопросы по данным —{" "}
        <Link href="/privacy" className="link-underline text-forest">
          политика конфиденциальности
        </Link>
        .
      </p>
    </div>
  );
}
