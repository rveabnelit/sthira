import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Compass, Layers } from "lucide-react";
import { listPrograms } from "@/lib/data/programs";
import { PageHero } from "@/components/site/page-hero";
import { ProgramCard } from "@/components/cards/cards";
import { ButtonLink } from "@/components/ui/button";
import { Eyebrow, SectionHeading } from "@/components/ui/primitives";
import { formatMinutes } from "@/lib/format";

export const metadata: Metadata = {
  title: "Программы",
  description:
    "Структурированные программы STHIRA: «Первые шаги», «Мобильность и мягкое движение», «Регулярная домашняя практика» и «Глубже в практику».",
  alternates: { canonical: "/programs" },
};

export default function ProgramsPage() {
  const programs = listPrograms({ limit: 12 });

  return (
    <>
      <PageHero
        eyebrow="STHIRA Programs"
        title="Практика с направлением"
        description="Программа — это последовательность модулей и уроков с общей целью. В отличие от отдельной практики, она помогает не выбирать каждый раз заново, а двигаться по маршруту в своём темпе."
      >
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-[12.5px] text-muted">
          <span className="inline-flex items-center gap-2">
            <Layers className="h-4 w-4" />
            {programs.length} программы
          </span>
          <span className="inline-flex items-center gap-2">
            <Compass className="h-4 w-4" />
            Уроки не блокируются по расписанию
          </span>
          <span className="inline-flex items-center gap-2">
            <Check className="h-4 w-4" />
            Прогресс сохраняется автоматически
          </span>
        </div>
      </PageHero>

      <section className="container-app section">
        <div className="grid gap-6 md:grid-cols-2">
          {programs.map((program, index) => (
            <ProgramCard key={program.id} program={program} index={index} />
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-paper">
        <div className="container-app section grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <Eyebrow className="mb-4">Как устроена программа</Eyebrow>
            <h2 className="display-2">Программа → Модуль → Урок → Практика</h2>
            <p className="lede mt-4">
              Модуль объединяет уроки одной темы. Каждый урок — это конкретная видеопрактика с длительностью и
              уровнем. Вы всегда видите, где находитесь и что делать дальше.
            </p>
            <ul className="mt-7 space-y-3 text-[13.5px] text-[#4d5048]">
              {[
                "Текущий и следующий урок подсвечиваются в структуре",
                "Завершение урока сохраняется на сервере",
                "Пропуски не закрывают доступ к урокам",
                "Можно проходить в своём темпе — без дедлайнов",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6f7d68]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[20px] border border-line bg-ivory p-6">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Пример структуры · «Первые шаги»</p>
            <ol className="mt-5 space-y-4">
              {[
                { module: "Неделя 1 · Знакомство", lessons: ["Дыхание и опора · 15 мин", "Короткая пауза · 10 мин", "Утренняя мягкость · 20 мин"] },
                { module: "Неделя 2 · Регулярность", lessons: ["Сброс после сидячего дня · 12 мин", "Вечернее расслабление · 25 мин"] },
              ].map((group) => (
                <li key={group.module}>
                  <p className="text-[13px] font-medium text-ink">{group.module}</p>
                  <ul className="mt-2 space-y-1.5 border-l border-line pl-4">
                    {group.lessons.map((lesson) => (
                      <li key={lesson} className="text-[12.5px] text-[#5c5f56]">
                        {lesson}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
            <p className="mt-5 text-[11.5px] leading-relaxed text-muted">
              Структура и порядок уроков настраиваются администратором школы.
            </p>
          </div>
        </div>
      </section>

      <section className="container-app section">
        <SectionHeading
          title="Не знаешь, с чего начать?"
          description="Ответьте на четыре вопроса — платформа предложит стартовую программу и несколько практик, которые подходят под ваш уровень и время."
          action={
            <ButtonLink href="/signup">
              Подобрать маршрут
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          }
        />
        <p className="mt-4 text-[12px] text-muted">
          Уже есть аккаунт?{" "}
          <Link href="/app/programs" className="link-underline text-forest">
            Мои программы
          </Link>
        </p>
      </section>
    </>
  );
}
