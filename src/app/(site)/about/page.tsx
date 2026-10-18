import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, HeartHandshake, Leaf, ShieldCheck } from "lucide-react";
import { getSiteContent } from "@/lib/content";
import { Breadcrumbs, PageHero } from "@/components/site/page-hero";
import { ButtonLink } from "@/components/ui/button";
import { Eyebrow, SectionHeading } from "@/components/ui/primitives";
import { FaqAccordion } from "@/components/site/faq-accordion";

export const metadata: Metadata = {
  title: "О Марии",
  description:
    "Мария Васильева — преподаватель хатха-йоги и автор школы STHIRA. Подход, принципы преподавания и структура занятий.",
  alternates: { canonical: "/about" },
};

const faq = [
  {
    q: "Нужен ли опыт, чтобы начать?",
    a: "Нет. Уровень «начальный» предполагает, что вы впервые на коврике. В занятиях есть упрощённые варианты, а темп задаёт дыхание.",
  },
  {
    q: "Что если у меня ограничения по здоровью?",
    a: "Сначала обсудите нагрузку с врачом. В карточке ученика можно отметить ограничения, а на занятиях выбирайте более мягкие практики и не доводите движение до боли.",
  },
  {
    q: "Можно ли заниматься во время беременности?",
    a: "В MVP нет отдельной программы для беременности. Мы рекомендуем индивидуальные занятия с преподавателем, имеющим соответствующую подготовку.",
  },
  {
    q: "Проводит ли Мария личные консультации?",
    a: "В рамках тарифа Live предусмотрены групповые онлайн-занятия и вопросы в прямом эфире. Индивидуальный формат в MVP не предусмотрен.",
  },
];

export default function AboutPage() {
  const content = getSiteContent();

  return (
    <>
      <PageHero
        eyebrow="О школе"
        title="Устойчивость — это не про идеальную асану"
        description={content["about.intro"]}
      />

      <section className="container-app pt-10">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-16">
          <div className="relative overflow-hidden rounded-[24px] border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/studio.jpg"
              alt="Пространство для практики: свет из окна и коврик"
              className="aspect-[4/5] h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-forest/70 to-transparent p-6 pt-16">
              <p className="font-serif text-[1.6rem] leading-tight text-ivory">Мария Васильева</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-ivory/70">{content["teacher.role"]}</p>
            </div>
          </div>

          <div className="lg:pt-6">
            <Eyebrow className="mb-4">Подход</Eyebrow>
            <h2 className="display-2">Спокойствие без пассивности</h2>
            <div className="prose-app mt-5 max-w-xl">
              <p>{content["teacher.short"]}</p>
              <p>
                Занятия строятся вокруг трёх вещей: дыхания, опоры и внимания. Мы не торопимся к сложным асанам и
                не измеряем прогресс гибкостью. Вместо этого — регулярность, которая выдерживает реальную жизнь.
              </p>
              <p>
                Название школы — STHIRA — переводится как «устойчивость». Это качество мы тренируем на коврике:
                умение оставаться в асане, возвращаться после перерыва и не сравнивать себя с другими.
              </p>
            </div>

            <div className="mt-8 grid gap-3">
              {[
                { icon: Leaf, title: "Без эзотерических клише", text: "Никаких чакр, мандал и обещаний исцеления. Только практика и её реальный эффект." },
                { icon: ShieldCheck, title: "Безопасность важнее глубины", text: "Комфортная амплитуда, понятные упрощения и честные границы компетенции." },
                { icon: HeartHandshake, title: "Без чувства вины", text: "Пропуски — часть жизни. Мы не наказываем за них и не сравниваем учеников." },
              ].map((item) => (
                <div key={item.title} className="flex gap-3 rounded-xl border border-line bg-paper p-4">
                  <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-[#6f7d68]" />
                  <div>
                    <p className="text-[13px] font-medium text-ink">{item.title}</p>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container-app section">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              title: "Как устроено занятие",
              text: "Разминка, основная последовательность и завершение. Каждая часть имеет понятную задачу — разогреть, поработать, восстановить дыхание.",
            },
            {
              title: "Что важно в практике",
              text: "Регулярность важнее интенсивности. Короткое занятие, которое вы сделали, полезнее длинного, которое осталось в планах.",
            },
            {
              title: "Для кого эта школа",
              text: "Для взрослых, которым нужна домашняя практика с понятной структурой: без гонки, сравнений и сложных настроек.",
            },
          ].map((item, index) => (
            <div key={item.title} className="border-t border-line pt-5">
              <span className="font-serif text-[13px] tracking-[0.14em] text-sage">0{index + 1}</span>
              <h3 className="mt-3 text-[1.1rem] font-medium">{item.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-[#5c5f56]">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-paper">
        <div className="container-app section grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <Eyebrow className="mb-4">Квалификация</Eyebrow>
            <h2 className="display-2">Прозрачно о профессиональном пути</h2>
            <p className="prose-app mt-4 max-w-lg">{content["about.credentials"]}</p>
            <p className="mt-4 max-w-lg text-[13px] leading-relaxed text-muted">
              Мы не публикуем неподтверждённые регалии и медицинские компетенции. Преподаватель не ставит диагнозы
              и не назначает лечение.
            </p>
            <ul className="mt-6 space-y-2 text-[13px] text-[#4d5048]">
              {[
                "Занятия ведёт автор школы",
                "Методика опирается на классическую хатха-йогу",
                "Онлайн-занятия проходят в прямом эфире",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6f7d68]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {["/images/linen-soft.jpg", "/images/dune.jpg", "/images/light-wall.jpg", "/images/leaves.jpg"].map((src) => (
              <div key={src} className="overflow-hidden rounded-[16px] border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="aspect-square h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-app section">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Eyebrow className="mb-4">Вопросы</Eyebrow>
            <h2 className="display-2">О практике и школе</h2>
            <p className="mt-4 text-[13.5px] leading-relaxed text-muted">
              Если остались вопросы — напишите нам. Мы отвечаем в рабочие дни.
            </p>
            <Link href="/contacts" className="btn-ghost mt-5 inline-flex items-center gap-1.5 pb-1 text-[13px]">
              Написать в поддержку
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <FaqAccordion items={faq} />
        </div>
      </section>

      <section className="relative overflow-hidden bg-forest text-ivory">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{ backgroundImage: "url(/images/linen.jpg)", backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div className="container-app section-tight relative">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="display-2 max-w-xl text-ivory">Познакомьтесь с практикой</h2>
              <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-ivory/70">
                Начните с короткого занятия на десять минут — без обязательств и сложных настроек.
              </p>
            </div>
            <ButtonLink href="/practice" className="bg-ivory text-forest hover:bg-white" size="lg">
              Смотреть практики
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
