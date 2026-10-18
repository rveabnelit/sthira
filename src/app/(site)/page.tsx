import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarCheck,
  Check,
  Compass,
  Lock,
  Play,
  Sparkles,
} from "lucide-react";
import { listPractices } from "@/lib/data/practices";
import { listPrograms } from "@/lib/data/programs";
import { listPlans } from "@/lib/data/subscriptions";
import { listReviews } from "@/lib/data/site";
import { getSiteContent } from "@/lib/content";
import { faqGroups, siteDefaults } from "@/content/catalog";
import { PracticeCard, ProgramCard, ReviewCard } from "@/components/cards/cards";
import { GuidePreview } from "@/components/site/guide-preview";
import { PricingCards } from "@/components/site/pricing-cards";
import { FaqAccordion } from "@/components/site/faq-accordion";
import { ButtonLink } from "@/components/ui/button";
import { Eyebrow, SectionHeading } from "@/components/ui/primitives";
import { formatPrice, goalLabel } from "@/lib/format";

export default function HomePage() {
  const content = { ...siteDefaults, ...getSiteContent() };
  const practiceResult = listPractices({ limit: 4, sort: "recommended" });
  const practices = practiceResult.items;
  const programs = listPrograms({ limit: 3 });
  const plans = listPlans();
  const reviews = listReviews(4);
  const homeFaq = [faqGroups[0].items[0], faqGroups[1].items[1], faqGroups[2].items[0], faqGroups[3].items[0], faqGroups[4].items[0]];

  const problems = [
    {
      title: "Непонятно, с чего начать",
      text: "Десятки видео, разные уровни и стили. Не ясно, какое занятие подойдёт именно сейчас.",
    },
    {
      title: "Трудно выбрать",
      text: "Поиск по названиям и уровням занимает больше времени, чем сама практика.",
    },
    {
      title: "Регулярность ускользает",
      text: "Одно занятие в неделю не создаёт привычку, а расписание всё время сдвигается.",
    },
    {
      title: "Не с кем сверить",
      text: "Появляются вопросы по технике, дыханию и нагрузке — ответить некому.",
    },
  ];

  return (
    <>
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section className="container-app pb-16 pt-10 md:pb-24 md:pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16">
          <div className="max-w-xl">
            <Eyebrow className="mb-5">Авторская школа хатха-йоги</Eyebrow>
            <h1 className="display-1 text-ink">{content["hero.title"]}</h1>
            <p className="lede mt-6 max-w-lg">{content["hero.subtitle"]}</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <ButtonLink href="/practice" size="lg">
                {content["hero.cta"]}
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href="/about" variant="secondary" size="lg">
                Познакомиться со школой
              </ButtonLink>
            </div>

            <dl className="mt-12 grid max-w-md grid-cols-3 gap-4 border-t border-line pt-6">
              {[
                { value: `${practiceResult.total}`, label: "видеопрактик" },
                { value: `${programs.length}`, label: "программы" },
                { value: "24/7", label: "к библиотеке" },
              ].map((item) => (
                <div key={item.label}>
                  <dt className="font-serif text-2xl leading-none text-forest">{item.value}</dt>
                  <dd className="mt-1.5 text-[11px] uppercase tracking-[0.14em] text-muted">{item.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative mb-12 lg:mb-0">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[24px] border border-line bg-sand-soft">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/hero-light.jpg"
                alt="Спокойный свет в пространстве для домашней практики"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest/35 via-transparent to-transparent" />
              <div className="absolute left-5 top-5 rounded-full border border-white/40 bg-white/60 px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-forest backdrop-blur">
                Сегодня · 20 минут
              </div>
            </div>

            <div className="surface absolute -bottom-10 left-4 right-4 z-10 p-4 shadow-lift sm:left-6 sm:right-auto sm:w-[310px] sm:p-5">
              <div className="flex items-center justify-between">
                <Eyebrow>Рекомендация на сегодня</Eyebrow>
                <Sparkles className="h-3.5 w-3.5 text-sage" />
              </div>
              <h2 className="mt-3 font-serif text-[1.45rem] leading-tight text-ink">Утренняя мягкость</h2>
              <p className="mt-1 text-[12.5px] text-muted">20 минут · начальный уровень · спина</p>
              <p className="mt-3 text-[12.5px] leading-relaxed text-[#5c5f56]">
                Мягкое начало дня без резких движений — подойдёт, если вы только начинаете.
              </p>
              <Link
                href="/practice/utrennyaya-myagkost"
                className="mt-4 flex h-10 items-center justify-center gap-2 rounded-[10px] bg-forest text-[13px] font-medium text-ivory transition-colors hover:bg-forest-deep"
              >
                <Play className="h-3.5 w-3.5 fill-ivory" />
                Начать практику
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Проблема ─────────────────────────────────────────────────────── */}
      <section className="border-y border-line bg-paper">
        <div className="container-app section-tight">
          <div className="max-w-2xl">
            <Eyebrow className="mb-4">Знакомая ситуация</Eyebrow>
            <h2 className="display-2">Сложно начать. Ещё сложнее — продолжать.</h2>
          </div>
          <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {problems.map((problem, index) => (
              <div key={problem.title} className="border-t border-line pt-5">
                <span className="font-serif text-[13px] tracking-[0.14em] text-sage">0{index + 1}</span>
                <h3 className="mt-3 text-[1.05rem] font-medium leading-snug text-ink">{problem.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-[#5c5f56]">{problem.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Решение ──────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="container-app section">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:gap-20">
          <SectionHeading
            eyebrow="Как это работает"
            title="Не просто видео. Понятный путь"
            description="STHIRA не заставляет выбирать из бесконечной ленты. Сначала — короткий разговор о вашей цели, затем маршрут и занятия, которые его поддерживают."
          />
          <div className="hidden justify-end lg:flex">
            <ButtonLink href="/signup" variant="secondary">
              Пройти подбор
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        </div>
        <ol className="mt-10 grid gap-px overflow-hidden rounded-[18px] border border-line bg-line sm:grid-cols-3">
            {[
              {
                title: "Расскажите о цели",
                text: "Четыре коротких вопроса: запрос, опыт, доступное время и удобный ритм.",
                icon: Compass,
              },
              {
                title: "Получите маршрут",
                text: "Платформа подбирает практики и программу по характеристикам занятий, а не случайно.",
                icon: Sparkles,
              },
              {
                title: "Занимайтесь в своём ритме",
                text: "Прогресс сохраняется на сервере. Пропуски не закрывают доступ к урокам.",
                icon: CalendarCheck,
              },
            ].map((step, index) => (
              <li key={step.title} className="bg-paper p-6">
                <div className="flex items-center justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-sage-soft text-forest">
                    <step.icon className="h-4 w-4" strokeWidth={1.7} />
                  </span>
                  <span className="font-serif text-[13px] tracking-[0.12em] text-sage">0{index + 1}</span>
                </div>
                <h3 className="mt-5 text-[1.05rem] font-medium leading-snug">{step.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
      </section>

      {/* ─── Персональная практика ────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-forest text-ivory">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage: "url(/images/leaves.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            mixBlendMode: "luminosity",
          }}
        />
        <div className="container-app section relative grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="max-w-lg">
            <Eyebrow className="mb-5 text-ivory/60">Персональная практика</Eyebrow>
            <h2 className="display-2 text-ivory">Сегодня тебе подойдёт мягкая практика на 20 минут</h2>
            <p className="mt-5 text-[15px] leading-relaxed text-ivory/75">
              Рекомендация учитывает цель, уровень и историю занятий. Если состояние изменилось — можно
              выбрать другое занятие без потери прогресса.
            </p>
            <ul className="mt-8 space-y-3 text-[13.5px] text-ivory/80">
              {[
                "Подбор по длительности, уровню и цели",
                "Продолжение незавершённой практики",
                "Понятный следующий шаг в программе",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sage" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-9">
              <ButtonLink href="/practice" variant="secondary" className="border-ivory/30 text-ivory hover:bg-ivory/10">
                Смотреть практики
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="rounded-[20px] border border-ivory/20 bg-paper p-5 text-ink shadow-lift">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.16em] text-muted">На сегодня</span>
                <span className="badge badge-sage">Рекомендовано</span>
              </div>
              <div className="mt-4 flex gap-4">
                <div className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-xl bg-sand-soft">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/linen.jpg" alt="" className="h-full w-full object-cover" />
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-paper/90 text-forest">
                      <Play className="ml-0.5 h-4 w-4 fill-forest" />
                    </span>
                  </span>
                </div>
                <div>
                  <h3 className="font-serif text-[1.35rem] leading-tight">Утренняя мягкость</h3>
                  <p className="mt-1.5 text-[12px] text-muted">20 минут · начальный · {goalLabel("start")}</p>
                  <p className="mt-2 text-[12px] leading-relaxed text-[#5c5f56]">
                    Совпадает с вашей целью и удобной длительностью.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-2">
                <span className="flex h-10 flex-1 items-center justify-center rounded-[10px] bg-forest text-[13px] font-medium text-ivory">
                  Начать занятие
                </span>
                <span className="flex h-10 items-center rounded-[10px] border border-line px-3 text-[12px] text-muted">
                  Другое
                </span>
              </div>
            </div>
            <p className="mt-4 text-center text-[11px] text-ivory/50">
              Пример интерфейса личного кабинета
            </p>
          </div>
        </div>
      </section>

      {/* ─── Библиотека ───────────────────────────────────────────────────── */}
      <section className="container-app section">
        <SectionHeading
          eyebrow="STHIRA Practice"
          title="Библиотека, в которой не теряются"
          description="Фильтры по цели, длительности и уровню. Каждая практика — с описанием, рекомендацией преподавателя и понятной нагрузкой."
          action={
            <Link href="/practice" className="btn-ghost inline-flex items-center gap-1.5 pb-1 text-[13px]">
              Все практики
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
        <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {practices.map((practice, index) => (
            <PracticeCard key={practice.id} practice={practice} index={index} showFavorite={false} />
          ))}
        </div>
      </section>

      {/* ─── Программы ────────────────────────────────────────────────────── */}
      <section className="border-y border-line bg-paper">
        <div className="container-app section">
          <SectionHeading
            eyebrow="STHIRA Programs"
            title="От первых шагов к устойчивой практике"
            description="Программа — это не набор видео, а последовательность с целью, модулями и уроками. Её можно проходить в своём темпе."
            action={
              <Link href="/programs" className="btn-ghost inline-flex items-center gap-1.5 pb-1 text-[13px]">
                Все программы
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {programs.map((program, index) => (
              <ProgramCard key={program.id} program={program} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Мария ────────────────────────────────────────────────────────── */}
      <section className="container-app section">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-16">
          <div className="relative">
            <div className="relative aspect-[5/6] overflow-hidden rounded-[24px] border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/teacher.jpg"
                alt="Светлое пространство школы STHIRA"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest/30 via-transparent to-transparent" />
              <span className="pointer-events-none absolute inset-0 grid select-none place-items-center font-serif text-[7rem] leading-none text-forest/15">
                МВ
              </span>
            </div>
            <div className="surface absolute -bottom-6 left-5 right-5 flex items-center justify-between gap-4 px-4 py-3 shadow-card sm:right-auto sm:min-w-[260px]">
              <div>
                <p className="font-serif text-[1.05rem] leading-tight text-ink">{content["teacher.name"]}</p>
                <p className="mt-0.5 text-[10.5px] uppercase tracking-[0.12em] text-muted">Преподаватель школы</p>
              </div>
              <Sparkles className="h-4 w-4 text-sage" />
            </div>
          </div>

          <div className="max-w-xl">
            <Eyebrow className="mb-5">О преподавателе</Eyebrow>
            <h2 className="display-2">Практика без спешки и без обещаний чудес</h2>
            <p className="lede mt-5">{content["teacher.short"]}</p>
            <blockquote className="mt-8 border-l border-sage pl-5 font-serif text-[1.35rem] italic leading-snug text-forest">
              «Устойчивость не появляется за неделю. Но появляется — если возвращаться».
            </blockquote>
            <div className="mt-8">
              <ButtonLink href="/about" variant="ghost" className="text-[13px]">
                Познакомиться с Марией
                <ArrowRight className="h-3.5 w-3.5" />
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Guide ────────────────────────────────────────────────────────── */}
      <section id="guide" className="border-y border-line bg-paper">
        <div className="container-app section grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
          <div className="max-w-lg">
            <Eyebrow className="mb-5">STHIRA Guide</Eyebrow>
            <h2 className="display-2">Наставник, который знает материалы школы</h2>
            <p className="lede mt-5">
              Guide помогает выбрать практику, объяснить структуру программы и подсказать следующий урок.
              Он опирается на утверждённые материалы — и честно говорит, когда ответа нет.
            </p>
            <ul className="mt-8 grid gap-3 text-[13.5px] text-[#4d5048] sm:grid-cols-2">
              {[
                "Подбор практики под состояние дня",
                "Следующий урок в программе",
                "Объяснение терминов из урока",
                "Возвращение после перерыва",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6f7d68]" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <ButtonLink href="/app/guide">
                Попробовать Guide
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <span className="text-[11.5px] text-muted">Доступно на тарифе Guide и выше</span>
            </div>
          </div>
          <GuidePreview />
        </div>
      </section>

      {/* ─── Отзывы ───────────────────────────────────────────────────────── */}
      <section className="container-app section">
        <SectionHeading
          eyebrow="Отзывы"
          title="Как это выглядит в жизни"
          description="Небольшие истории учеников — без обещаний результата и сравнений."
        />
        <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} name={review.author_name} note={review.author_note} text={review.text} />
          ))}
        </div>
      </section>

      {/* ─── Тарифы ───────────────────────────────────────────────────────── */}
      <section id="pricing" className="border-y border-line bg-paper">
        <div className="container-app section">
          <SectionHeading
            eyebrow="Подписка"
            title="Три способа заниматься"
            description="Все тарифы включают личный кабинет, прогресс и библиотеку. Разница — в рекомендациях, наставнике и онлайн-занятиях."
            align="center"
          />
          <div className="mx-auto mt-10 max-w-4xl">
            <PricingCards plans={plans} />
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-[11.5px] leading-relaxed text-muted">
            Отмена автопродления — в разделе «Подписка». Доступ сохраняется до конца оплаченного периода.
            Цены указаны для демонстрационного стенда.
          </p>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="container-app section">
        <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
          <div>
            <Eyebrow className="mb-4">Вопросы</Eyebrow>
            <h2 className="display-2">Коротко о главном</h2>
            <p className="mt-4 text-[14px] leading-relaxed text-muted">
              Если ответа нет — напишите нам, мы отвечаем в рабочие дни.
            </p>
            <Link href="/faq" className="btn-ghost mt-6 inline-flex items-center gap-1.5 pb-1 text-[13px]">
              Все вопросы
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <FaqAccordion items={homeFaq} />
        </div>
      </section>

      {/* ─── Финальный CTA ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-forest text-ivory">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{ backgroundImage: "url(/images/dune-dark.jpg)", backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div className="container-app section text-center">
          <Eyebrow className="mb-5 justify-center text-ivory/60">Первый шаг</Eyebrow>
          <h2 className="display-2 mx-auto max-w-3xl text-ivory">Начните с одной практики сегодня</h2>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-ivory/70">
            Двадцать минут, спокойный темп и понятная последовательность. Дальше станет яснее, что делать.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/signup" size="lg" className="bg-ivory text-forest hover:bg-white">
              Создать аккаунт
            </ButtonLink>
            <ButtonLink
              href="/pricing"
              variant="secondary"
              size="lg"
              className="border-ivory/30 text-ivory hover:bg-ivory/10"
            >
              Сравнить тарифы
            </ButtonLink>
          </div>
          <p className="mt-8 text-[11px] text-ivory/45">
            {plans[2] ? `Подписка от ${formatPrice(plans[0].price)} в месяц · отмена в любой момент` : ""}
          </p>
        </div>
      </section>
    </>
  );
}

