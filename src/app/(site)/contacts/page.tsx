import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Mail, MessageCircle, ShieldCheck } from "lucide-react";
import { getSiteContent } from "@/lib/content";
import { PageHero } from "@/components/site/page-hero";
import { ContactForm } from "./contact-form";
import { Eyebrow } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Контакты",
  description: "Связаться со школой STHIRA: вопросы о подписке, практике и технической работе платформы.",
  alternates: { canonical: "/contacts" },
};

export default function ContactsPage() {
  const content = getSiteContent();

  return (
    <>
      <PageHero
        eyebrow="Поддержка"
        title="Напишите нам"
        description="Ответим на вопросы о подписке, доступе и технической работе платформы. Вопросы о здоровье лучше адресовать врачу — школа не даёт медицинских рекомендаций."
      />

      <section className="container-app grid gap-10 pb-20 pt-10 lg:grid-cols-[1fr_360px] lg:gap-14">
        <ContactForm />

        <aside className="space-y-4">
          <div className="surface p-5">
            <Eyebrow>Контакты</Eyebrow>
            <ul className="mt-4 space-y-4 text-[13px]">
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                <div>
                  <p className="text-muted">Email</p>
                  <a href={`mailto:${content["contacts.email"]}`} className="link-underline text-ink">
                    {content["contacts.email"]}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                <div>
                  <p className="text-muted">Telegram</p>
                  <p className="text-ink">{content["contacts.telegram"]}</p>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                <div>
                  <p className="text-muted">Режим ответа</p>
                  <p className="text-ink">{content["contacts.hours"]}</p>
                </div>
              </li>
            </ul>
            <p className="mt-4 text-[11px] leading-relaxed text-muted">
              Реквизиты и юридический адрес будут добавлены владельцем школы перед запуском.
            </p>
          </div>

          <div className="surface p-5">
            <p className="flex items-center gap-2 text-[13px] font-medium text-ink">
              <ShieldCheck className="h-4 w-4 text-[#6f7d68]" />
              Данные и документы
            </p>
            <ul className="mt-3 space-y-2 text-[12.5px]">
              <li>
                <Link href="/privacy" className="link-underline text-[#4d5048]">
                  Политика конфиденциальности
                </Link>
              </li>
              <li>
                <Link href="/terms" className="link-underline text-[#4d5048]">
                  Пользовательское соглашение
                </Link>
              </li>
              <li>
                <Link href="/subscription-terms" className="link-underline text-[#4d5048]">
                  Условия подписки
                </Link>
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-line bg-[#f7f3ea] p-5">
            <p className="text-[12px] font-medium text-ink">Для вопросов о здоровье</p>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">
              Мы не консультируем по медицинским вопросам. При боли, травме или хроническом состоянии
              обратитесь к врачу, а нагрузку обсудите с преподавателем.
            </p>
          </div>
        </aside>
      </section>
    </>
  );
}
