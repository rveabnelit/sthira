import type { DatabaseSync } from "node:sqlite";
import { hashPassword } from "../auth/password";
import { plans, practices, programs, guideDocs, reviews, siteDefaults } from "../../content/catalog";

/**
 * Первичное наполнение базы. Выполняется один раз для пустой базы.
 * Демонстрационные аккаунты создаются только в demo-режиме (SEED_DEMO_DATA !== "false").
 */

function insertRow(db: DatabaseSync, table: string, data: Record<string, unknown>) {
  const keys = Object.keys(data);
  const sql = `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${keys.map(() => "?").join(", ")})`;
  db.prepare(sql).run(...(keys.map((key) => data[key]) as never[]));
}

const DAY = 24 * 60 * 60 * 1000;

function iso(d: Date) {
  return d.toISOString();
}

function daysFrom(base: Date, days: number, hour = 9, minute = 0) {
  const d = new Date(base.getTime() + days * DAY);
  if (hour !== null) {
    d.setUTCHours(hour, minute, 0, 0);
  }
  return d;
}

/** Ближайший день недели (0=вс) в указанный час по Москве (UTC+3). */
function nextWeekday(base: Date, weekday: number, hourMsk: number, minuteMsk = 0) {
  const d = new Date(base);
  const targetHourUtc = hourMsk - 3;
  for (let i = 0; i < 14; i++) {
    const candidate = new Date(d.getTime() + i * DAY);
    candidate.setUTCHours(((targetHourUtc % 24) + 24) % 24, minuteMsk, 0, 0);
    const mskDay = new Date(candidate.getTime() + 3 * 60 * 60 * 1000).getUTCDay();
    if (mskDay === weekday && candidate.getTime() > base.getTime() + 12 * 60 * 60 * 1000) {
      return candidate;
    }
  }
  return daysFrom(base, 3, 6);
}

export function seedDatabase(db: DatabaseSync) {
  const now = new Date();
  const seedDemo = process.env.SEED_DEMO_DATA !== "false";

  // ─── Тарифы ────────────────────────────────────────────────────────────────
  const planIds: Record<string, string> = {};
  plans.forEach((plan, index) => {
    const planId = `plan_${plan.code}`;
    planIds[plan.code] = planId;
    insertRow(db, "plans", {
      id: planId,
      code: plan.code,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      currency: "RUB",
      billing_period: "month",
      features: JSON.stringify(plan.features),
      is_active: 1,
      is_recommended: plan.recommended ? 1 : 0,
      sort_order: index,
      created_at: iso(now),
      updated_at: iso(now),
    });
  });

  // ─── Практики ──────────────────────────────────────────────────────────────
  const practiceIds: Record<string, string> = {};
  practices.forEach((practice, index) => {
    const practiceId = `pr_${practice.slug}`;
    practiceIds[practice.slug] = practiceId;
    insertRow(db, "practices", {
      id: practiceId,
      slug: practice.slug,
      title: practice.title,
      description: practice.description,
      teacher_note: practice.teacherNote,
      thumbnail_url: null,
      cover_tone: practice.tone,
      video_provider: "mock",
      video_asset_id: `demo_${practice.slug}`,
      video_url: null,
      duration_minutes: practice.durationMinutes,
      difficulty: practice.difficulty,
      goal: practice.goal,
      tags: JSON.stringify(practice.tags),
      required_plan: practice.requiredPlan,
      status: practice.status ?? "published",
      created_at: iso(new Date(now.getTime() - (30 - index) * DAY)),
      updated_at: iso(now),
    });
  });

  // ─── Программы, модули, уроки ──────────────────────────────────────────────
  programs.forEach((program, programIndex) => {
    const programId = `pg_${program.slug}`;
    insertRow(db, "programs", {
      id: programId,
      slug: program.slug,
      title: program.title,
      short_description: program.shortDescription,
      description: program.description,
      thumbnail_url: null,
      cover_tone: program.tone,
      difficulty: program.difficulty,
      estimated_duration: program.estimatedDuration,
      lessons_per_week: program.lessonsPerWeek,
      audience: program.audience,
      outcomes: JSON.stringify(program.outcomes),
      required_plan: program.requiredPlan,
      status: "published",
      created_at: iso(new Date(now.getTime() - (30 - programIndex) * DAY)),
      updated_at: iso(now),
    });

    program.modules.forEach((module, moduleIndex) => {
      const moduleId = `pm_${program.slug}_${moduleIndex + 1}`;
      insertRow(db, "program_modules", {
        id: moduleId,
        program_id: programId,
        title: module.title,
        description: module.description,
        position: moduleIndex + 1,
      });
      module.lessons.forEach((lesson, lessonIndex) => {
        insertRow(db, "program_lessons", {
          id: `ls_${program.slug}_${moduleIndex + 1}_${lessonIndex + 1}`,
          module_id: moduleId,
          practice_id: practiceIds[lesson.practice],
          title: lesson.title,
          description: lesson.note ?? null,
          position: lessonIndex + 1,
        });
      });
    });
  });

  // ─── База знаний Guide ─────────────────────────────────────────────────────
  guideDocs.forEach((doc, index) => {
    insertRow(db, "guide_documents", {
      id: `kb_${doc.slug}`,
      slug: doc.slug,
      title: doc.title,
      category: doc.category,
      content: doc.content,
      status: "published",
      created_at: iso(new Date(now.getTime() - (20 - index) * DAY)),
      updated_at: iso(new Date(now.getTime() - index * DAY)),
    });
  });

  // ─── Отзывы ────────────────────────────────────────────────────────────────
  reviews.forEach((review, index) => {
    insertRow(db, "reviews", {
      id: `rv_${index + 1}`,
      author_name: review.name,
      author_note: review.note,
      text: review.text,
      rating: 5,
      status: "published",
      created_at: iso(new Date(now.getTime() - (40 - index * 5) * DAY)),
    });
  });

  // ─── Онлайн-занятия ────────────────────────────────────────────────────────
  const liveSpecs = [
    {
      title: "Утренняя практика в прямом эфире",
      description:
        "Спокойное начало дня: мягкая разминка, стоячие асаны и короткое расслабление. Подходит для любого уровня — можно выполнять упрощённые варианты.",
      weekday: 2,
      hour: 8,
      minute: 0,
      duration: 45,
      capacity: 24,
      cover: "/images/live-morning.jpg",
    },
    {
      title: "Вечерняя практика: дыхание и relaxation",
      description:
        "Вечернее занятие с акцентом на дыхание и расслабление. Завершаем день без экрана и спешки.",
      weekday: 4,
      hour: 19,
      minute: 30,
      duration: 60,
      capacity: 18,
      cover: "/images/live-evening.jpg",
    },
    {
      title: "Разбор практики: стоячие асаны",
      description:
        "Отвечаем на вопросы по технике стоячих асан, разбираем типичные ошибки и упрощённые варианты.",
      weekday: 6,
      hour: 11,
      minute: 0,
      duration: 50,
      capacity: 16,
      cover: "/images/light-wall.jpg",
    },
    {
      title: "Мягкая практика для спины",
      description:
        "Занятие для тех, кто много сидит: подвижность позвоночника, шея и плечи. С дополнительными вариантами для чувствительной спины.",
      weekday: 0,
      hour: 10,
      minute: 30,
      duration: 40,
      capacity: 20,
      cover: "/images/linen.jpg",
    },
  ];

  const liveIds: string[] = [];
  liveSpecs.forEach((spec, index) => {
    const starts = nextWeekday(now, spec.weekday, spec.hour, spec.minute);
    const liveId = `live_${index + 1}`;
    liveIds.push(liveId);
    insertRow(db, "live_sessions", {
      id: liveId,
      title: spec.title,
      description: spec.description,
      teacher_name: "Мария Васильева",
      starts_at: iso(starts),
      duration_minutes: spec.duration,
      capacity: spec.capacity,
      join_url: "https://meet.example.com/sthira-live",
      cover_url: spec.cover,
      required_plan: "live",
      status: "scheduled",
      created_at: iso(new Date(now.getTime() - 10 * DAY)),
      updated_at: iso(now),
    });
  });

  // ─── Контент сайта ─────────────────────────────────────────────────────────
  Object.entries(siteDefaults).forEach(([key, value]) => {
    insertRow(db, "site_content", { key, value, updated_at: iso(now) });
  });

  // ─── Демонстрационные аккаунты ─────────────────────────────────────────────
  if (!seedDemo) return;

  const adminId = "usr_admin";
  const studentId = "usr_student";
  const newbieId = "usr_newbie";

  insertRow(db, "users", {
    id: adminId,
    email: "admin@sthira.school",
    password_hash: hashPassword("Admin12345!"),
    display_name: "Мария Васильева",
    role: "admin",
    email_verified_at: iso(new Date(now.getTime() - 60 * DAY)),
    created_at: iso(new Date(now.getTime() - 60 * DAY)),
    updated_at: iso(now),
  });
  insertRow(db, "users", {
    id: studentId,
    email: "student@sthira.school",
    password_hash: hashPassword("Student12345!"),
    display_name: "Анна",
    role: "student",
    email_verified_at: iso(new Date(now.getTime() - 34 * DAY)),
    created_at: iso(new Date(now.getTime() - 34 * DAY)),
    updated_at: iso(now),
  });
  insertRow(db, "users", {
    id: newbieId,
    email: "new@sthira.school",
    password_hash: hashPassword("Student12345!"),
    display_name: "Новый ученик",
    role: "student",
    email_verified_at: iso(new Date(now.getTime() - 1 * DAY)),
    created_at: iso(new Date(now.getTime() - 1 * DAY)),
    updated_at: iso(now),
  });

  insertRow(db, "user_preferences", {
    user_id: adminId,
    experience_level: "regular",
    goal: "deepen",
    preferred_duration: "40+",
    preferred_time: "morning",
    timezone: "Europe/Moscow",
    reminders_enabled: 1,
    onboarding_completed_at: iso(new Date(now.getTime() - 59 * DAY)),
    updated_at: iso(now),
  });
  insertRow(db, "user_preferences", {
    user_id: studentId,
    experience_level: "some",
    goal: "habit",
    preferred_duration: "20-30",
    preferred_time: "morning",
    timezone: "Europe/Moscow",
    reminders_enabled: 1,
    onboarding_completed_at: iso(new Date(now.getTime() - 33 * DAY)),
    updated_at: iso(now),
  });
  insertRow(db, "user_preferences", {
    user_id: newbieId,
    experience_level: null,
    goal: null,
    preferred_duration: null,
    preferred_time: null,
    timezone: "Europe/Moscow",
    reminders_enabled: 0,
    onboarding_completed_at: null,
    updated_at: iso(now),
  });

  // Подписки и платежи
  const studentSubId = "sub_student";
  insertRow(db, "subscriptions", {
    id: studentSubId,
    user_id: studentId,
    plan_id: planIds.guide,
    provider: "mock",
    provider_subscription_id: "mock_sub_student",
    status: "active",
    started_at: iso(new Date(now.getTime() - 12 * DAY)),
    current_period_start: iso(new Date(now.getTime() - 12 * DAY)),
    current_period_end: iso(new Date(now.getTime() + 18 * DAY)),
    cancel_at_period_end: 0,
    created_at: iso(new Date(now.getTime() - 12 * DAY)),
    updated_at: iso(now),
  });

  const adminSubId = "sub_admin";
  insertRow(db, "subscriptions", {
    id: adminSubId,
    user_id: adminId,
    plan_id: planIds.live,
    provider: "mock",
    provider_subscription_id: "mock_sub_admin",
    status: "active",
    started_at: iso(new Date(now.getTime() - 40 * DAY)),
    current_period_start: iso(new Date(now.getTime() - 10 * DAY)),
    current_period_end: iso(new Date(now.getTime() + 20 * DAY)),
    cancel_at_period_end: 0,
    created_at: iso(new Date(now.getTime() - 40 * DAY)),
    updated_at: iso(now),
  });

  const paymentSpecs = [
    {
      id: "pay_student_2",
      user: studentId,
      sub: studentSubId,
      plan: planIds.guide,
      amount: 1490,
      paidAt: new Date(now.getTime() - 12 * DAY),
      pid: "mock_pay_student_2",
    },
    {
      id: "pay_student_1",
      user: studentId,
      sub: null,
      plan: planIds.practice,
      amount: 790,
      paidAt: new Date(now.getTime() - 42 * DAY),
      pid: "mock_pay_student_1",
    },
    {
      id: "pay_admin_1",
      user: adminId,
      sub: adminSubId,
      plan: planIds.live,
      amount: 3490,
      paidAt: new Date(now.getTime() - 10 * DAY),
      pid: "mock_pay_admin_1",
    },
  ];
  paymentSpecs.forEach((p) => {
    insertRow(db, "checkout_orders", {
      id: `ord_${p.id}`,
      user_id: p.user,
      plan_id: p.plan,
      amount: p.amount,
      currency: "RUB",
      status: "paid",
      provider: "mock",
      provider_order_id: `mock_ord_${p.id}`,
      created_at: iso(new Date(p.paidAt.getTime() - 5 * 60 * 1000)),
      paid_at: iso(p.paidAt),
      payment_id: p.id,
    });
    insertRow(db, "payments", {
      id: p.id,
      user_id: p.user,
      subscription_id: p.sub,
      order_id: `ord_${p.id}`,
      plan_id: p.plan,
      provider: "mock",
      provider_payment_id: p.pid,
      amount: p.amount,
      currency: "RUB",
      status: "succeeded",
      paid_at: iso(p.paidAt),
      created_at: iso(new Date(p.paidAt.getTime() - 5 * 60 * 1000)),
    });
  });

  // История занятий демо-ученика
  const history: { days: number; slug: string; lesson?: string; minutes: number; mood?: string }[] = [
    { days: 20, slug: "dyhanie-i-opora", lesson: "ls_pervye-shagi_1_1", minutes: 15, mood: "спокойно" },
    { days: 18, slug: "korotkaya-pauza", lesson: "ls_pervye-shagi_1_2", minutes: 10 },
    { days: 16, slug: "utrennyaya-myagkost", lesson: "ls_pervye-shagi_1_3", minutes: 20, mood: "легко" },
    { days: 13, slug: "sbros-posle-sidyachego-dnya", lesson: "ls_pervye-shagi_2_1", minutes: 12 },
    { days: 11, slug: "vechernee-rasslablenie", lesson: "ls_pervye-shagi_2_2", minutes: 25, mood: "спокойно" },
    { days: 9, slug: "utrennyaya-myagkost", lesson: "ls_pervye-shagi_2_3", minutes: 20 },
    { days: 7, slug: "balans-i-vnimanie", lesson: "ls_pervye-shagi_3_1", minutes: 20, mood: "бодро" },
    { days: 6, slug: "podvizhnost-pozvonochnika", minutes: 30 },
    { days: 4, slug: "korotkaya-pauza", minutes: 10 },
    { days: 3, slug: "utrenniy-tonus", minutes: 15, mood: "бодро" },
    { days: 2, slug: "vechernee-rasslablenie", minutes: 25, mood: "спокойно" },
    { days: 1, slug: "dyhanie-i-opora", minutes: 15 },
  ];
  history.forEach((item, index) => {
    insertRow(db, "practice_completions", {
      id: `cmp_student_${index + 1}`,
      user_id: studentId,
      practice_id: practiceIds[item.slug],
      program_lesson_id: item.lesson ?? null,
      completed_at: iso(daysFrom(now, -item.days, 7 + (index % 4), 15)),
      duration_seconds: item.minutes * 60,
      mood: item.mood ?? null,
      created_at: iso(daysFrom(now, -item.days, 7 + (index % 4), 20)),
    });
  });

  // Избранное
  ["vechernee-rasslablenie", "raskrytie-taza", "glubokoe-vytyazhenie"].forEach((slug, index) => {
    insertRow(db, "favorites", {
      user_id: studentId,
      practice_id: practiceIds[slug],
      created_at: iso(daysFrom(now, -(10 - index), 12, 0)),
    });
  });

  // Регистрации на онлайн-занятия
  insertRow(db, "live_registrations", {
    user_id: studentId,
    session_id: liveIds[0],
    created_at: iso(daysFrom(now, -2, 12, 0)),
  });
  insertRow(db, "live_registrations", {
    user_id: adminId,
    session_id: liveIds[0],
    created_at: iso(daysFrom(now, -3, 12, 0)),
  });

  // Уведомления
  const notifications = [
    {
      type: "live",
      title: "Напоминание об онлайн-занятии",
      body: "«Утренняя практика в прямом эфире» — за 30 минут до начала придёт ссылка на трансляцию.",
      href: "/app/schedule",
      days: 0,
    },
    {
      type: "content",
      title: "Новая практика в библиотеке",
      body: "Добавили «Короткую паузу» — 10 минут, чтобы вернуться в тело среди дня.",
      href: "/app/practice",
      days: 2,
    },
    {
      type: "subscription",
      title: "Подписка Guide активна",
      body: "Следующее списание — через 18 дней. Управлять подпиской можно в разделе «Подписка».",
      href: "/app/subscription",
      days: 5,
    },
  ];
  notifications.forEach((n, index) => {
    insertRow(db, "notifications", {
      id: `ntf_${index + 1}`,
      user_id: studentId,
      type: n.type,
      title: n.title,
      body: n.body,
      href: n.href,
      read_at: index === 2 ? iso(daysFrom(now, -4, 9, 0)) : null,
      created_at: iso(daysFrom(now, -n.days, 9, 0)),
    });
  });

  // Диалог с Guide
  const convId = "cnv_demo_1";
  insertRow(db, "guide_conversations", {
    id: convId,
    user_id: studentId,
    title: "С чего вернуться после перерыва",
    created_at: iso(daysFrom(now, -3, 18, 20)),
    updated_at: iso(daysFrom(now, -3, 18, 24)),
  });
  insertRow(db, "guide_messages", {
    id: "msg_demo_1",
    conversation_id: convId,
    role: "user",
    content: "Я пропустила неделю. С чего лучше вернуться?",
    citations: "[]",
    created_at: iso(daysFrom(now, -3, 18, 20)),
  });
  insertRow(db, "guide_messages", {
    id: "msg_demo_2",
    conversation_id: convId,
    role: "assistant",
    content:
      "После перерыва не нужно возвращаться к прежнему объёму. Начните с одной короткой практики на 10–15 минут — например, «Короткая пауза» или «Дыхание и опора». Две практики в неделю в течение двух недель — достаточный минимум, чтобы вернуть ритм. Если появилась скованность, добавьте «Сброс после сидячего дня».",
    citations: JSON.stringify([
      { type: "document", title: "Как вернуться после перерыва", href: "/app/guide" },
      { type: "practice", title: "Короткая пауза", href: "/app/practice/pr_korotkaya-pauza" },
    ]),
    created_at: iso(daysFrom(now, -3, 18, 24)),
  });

  // Демонстрационные обращения
  insertRow(db, "contact_messages", {
    id: "cnt_1",
    name: "Елена",
    email: "elena@example.com",
    topic: "Подписка",
    message: "Подскажите, можно ли перейти с Practice на Guide в середине месяца?",
    status: "new",
    created_at: iso(daysFrom(now, -1, 11, 40)),
    user_id: null,
  });
  insertRow(db, "contact_messages", {
    id: "cnt_2",
    name: "Сергей",
    email: "sergey@example.com",
    topic: "Технический вопрос",
    message: "На планшете не запускается видео в полноэкранном режиме. Что проверить?",
    status: "in_progress",
    created_at: iso(daysFrom(now, -3, 16, 10)),
    user_id: null,
  });

  // События аналитики (демо-данные)
  const eventNames = [
    "signup_started",
    "signup_completed",
    "onboarding_completed",
    "practice_opened",
    "practice_started",
    "practice_completed",
    "program_opened",
    "program_lesson_completed",
    "pricing_viewed",
    "checkout_started",
    "payment_succeeded",
  ];
  const demoUsers = [studentId, newbieId];
  let eventIndex = 0;
  for (let day = 30; day >= 0; day--) {
    const count = day % 7 === 0 ? 4 : 2;
    for (let i = 0; i < count; i++) {
      const name = eventNames[(day + i) % eventNames.length];
      const user = demoUsers[(day + i) % demoUsers.length];
      insertRow(db, "analytics_events", {
        user_id: user,
        name,
        props: JSON.stringify({ source: "seed" }),
        path: name.startsWith("practice") ? "/app/practice" : "/pricing",
        created_at: iso(daysFrom(now, -day, 8 + (i % 10), (i * 13) % 60)),
      });
      eventIndex++;
    }
  }

  insertRow(db, "audit_log", {
    id: crypto.randomUUID(),
    actor_id: null,
    actor_email: "system",
    action: "seed_database",
    entity_type: "system",
    entity_id: null,
    meta: JSON.stringify({ practices: practices.length, programs: programs.length, events: eventIndex }),
    result: "success",
    created_at: iso(now),
  });
}
