import Link from "next/link";
import { Eyebrow } from "@/components/ui/primitives";
import { PageHero } from "@/components/site/page-hero";

export type LegalSection = {
  id: string;
  title: string;
  blocks: (string | string[])[];
};

export function LegalDocument({
  eyebrow,
  title,
  description,
  updatedAt,
  sections,
  notice,
}: {
  eyebrow: string;
  title: string;
  description: string;
  updatedAt: string;
  sections: LegalSection[];
  notice?: string;
}) {
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} description={description}>
        <p className="text-[11.5px] text-muted">Редакция от {updatedAt}</p>
      </PageHero>

      <section className="container-app grid gap-10 pb-20 pt-10 lg:grid-cols-[240px_1fr] lg:gap-16">
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Содержание</p>
          <nav aria-label="Содержание документа" className="mt-3 space-y-0.5">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="block border-l border-line py-1.5 pl-3 text-[12.5px] leading-snug text-[#565950] transition-colors hover:border-forest hover:text-forest"
              >
                {section.title}
              </a>
            ))}
          </nav>
          <div className="mt-6 rounded-xl border border-line bg-paper p-4">
            <p className="text-[11.5px] leading-relaxed text-muted">
              Вопросы по документу —{" "}
              <Link href="/contacts" className="link-underline text-forest">
                через поддержку
              </Link>
              .
            </p>
          </div>
        </aside>

        <article className="prose-legal max-w-3xl">
          {notice ? (
            <div className="mb-8 rounded-xl border border-[#dccdb4] bg-[#f7f1e4] px-5 py-4 text-[12.5px] leading-relaxed text-[#6b5b42]">
              {notice}
            </div>
          ) : null}
          {sections.map((section) => (
            <section key={section.id} id={section.id}>
              <h2>{section.title}</h2>
              {section.blocks.map((block, index) =>
                Array.isArray(block) ? (
                  <ul key={index}>
                    {block.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p key={index}>{block}</p>
                ),
              )}
            </section>
          ))}

          <div className="mt-12 border-t border-line pt-6">
            <Eyebrow>Документ</Eyebrow>
            <p className="mt-2 text-[12px] leading-relaxed text-muted">
              Это шаблон документа для демонстрационного стенда. Перед запуском текст проверяется юристом с учётом
              страны регистрации оператора и требований к обработке персональных данных.
            </p>
          </div>
        </article>
      </section>
    </>
  );
}
