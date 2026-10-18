import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/site/page-hero";
import { FaqAccordion } from "@/components/site/faq-accordion";
import { faqGroups } from "@/content/catalog";

export const metadata: Metadata = {
  title: "Вопросы и ответы",
  description:
    "Ответы на вопросы о практике, подписке и оплате, программах, AI-наставнике и технической работе платформы STHIRA.",
  alternates: { canonical: "/faq" },
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-zа-я0-9-]/gi, "");
}

export default function FaqPage() {
  return (
    <>
      <PageHero
        eyebrow="Поддержка"
        title="Вопросы и ответы"
        description="Собрали то, о чём спрашивают чаще всего. Если ответа нет — напишите нам, мы отвечаем в рабочие дни."
      />

      <section className="container-app grid gap-12 pb-20 pt-10 lg:grid-cols-[220px_1fr] lg:gap-16">
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Темы</p>
          <nav aria-label="Темы вопросов" className="mt-4 space-y-1">
            {faqGroups.map((group) => (
              <a
                key={group.title}
                href={`#${slugify(group.title)}`}
                className="block rounded-lg px-3 py-2 text-[13px] text-[#565950] transition-colors hover:bg-paper hover:text-forest"
              >
                {group.title}
              </a>
            ))}
          </nav>
          <div className="mt-6 rounded-xl border border-line bg-paper p-4">
            <p className="text-[12px] leading-relaxed text-muted">
              Не нашли ответ?{" "}
              <Link href="/contacts" className="link-underline text-forest">
                Напишите в поддержку
              </Link>
              .
            </p>
          </div>
        </aside>

        <div className="max-w-3xl space-y-12">
          {faqGroups.map((group) => (
            <section key={group.title} id={slugify(group.title)} className="scroll-mt-24">
              <h2 className="display-3">{group.title}</h2>
              <FaqAccordion items={group.items} className="mt-4" />
            </section>
          ))}

          <div className="rounded-[18px] border border-line bg-forest p-6 text-ivory">
            <p className="font-serif text-[1.5rem] leading-tight">Остались вопросы?</p>
            <p className="mt-2 max-w-md text-[13px] leading-relaxed text-ivory/70">
              Напишите нам — мы ответим в рабочие дни. Для вопросов о здоровье лучше обратиться к врачу: школа не
              даёт медицинских рекомендаций.
            </p>
            <Link
              href="/contacts"
              className="mt-5 inline-flex h-10 items-center rounded-[10px] bg-ivory px-4 text-[12.5px] font-medium text-forest transition-colors hover:bg-white"
            >
              Написать в поддержку
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
