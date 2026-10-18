import { all, one, run } from "@/lib/db";
import { canAccessPlan, type SubscriptionView } from "@/lib/access";
import { listPractices, type PracticeListItem } from "@/lib/data/practices";
import { getCompletedLessonIds, getProgramModules, listPrograms, listUserPrograms } from "@/lib/data/programs";
import { recommendPractices } from "@/lib/data/recommend";
import type { GuideCitation, GuideConversation, GuideMessage } from "@/lib/types";
import { trackEvent } from "@/lib/analytics";
import { ApiError } from "@/lib/errors";

export const GUIDE_DAILY_LIMIT = Number(process.env.GUIDE_DAILY_LIMIT ?? 30);
export const GUIDE_MAX_MESSAGE_LENGTH = 1000;

const STOP_WORDS = new Set([
  "и", "в", "во", "не", "что", "он", "на", "я", "с", "со", "как", "а", "то", "все", "она", "так",
  "его", "но", "да", "ты", "к", "у", "же", "вы", "за", "бы", "по", "только", "ее", "мне", "было",
  "вот", "от", "меня", "еще", "нет", "о", "из", "ему", "теперь", "когда", "даже", "ну", "вдруг",
  "ли", "если", "уже", "или", "ни", "быть", "был", "него", "до", "вас", "нибудь", "опять", "уж",
  "вам", "ведь", "там", "потом", "себя", "ничего", "ей", "может", "они", "тут", "где", "есть",
  "надо", "ней", "для", "мы", "тебя", "их", "чем", "была", "сам", "чтоб", "без", "будто", "чего",
  "раз", "тоже", "себе", "под", "будет", "ж", "тогда", "кто", "этот", "того", "потому", "этого",
  "какой", "совсем", "ним", "здесь", "этом", "один", "почти", "мой", "тем", "чтобы", "нее",
  "были", "куда", "зачем", "всех", "никогда", "можно", "при", "наконец", "два", "об", "другой",
  "хоть", "после", "над", "больше", "тот", "через", "эти", "нас", "про", "всего", "них", "какая",
  "много", "разве", "три", "эту", "моя", "впрочем", "хорошо", "свою", "этой", "перед", "иногда",
  "лучше", "чуть", "том", "нельзя", "такой", "им", "более", "всегда", "конечно", "всю", "между",
]);

const ENDINGS = [
  "иями", "ями", "ами", "ов", "ев", "ие", "ия", "ий", "ый", "ой", "ей", "ая", "яя", "ое", "ее",
  "ые", "ие", "ых", "их", "ому", "ему", "ыми", "ими", "у", "ю", "а", "я", "ы", "и", "е", "о", "ь",
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stem(word: string): string {
  if (word.length <= 4) return word;
  for (const ending of ENDINGS) {
    if (word.endsWith(ending) && word.length - ending.length >= 4) {
      return word.slice(0, word.length - ending.length);
    }
  }
  return word;
}

function tokens(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word))
    .map(stem);
}

type DocRow = { slug: string; title: string; category: string; content: string };

export function listGuideDocuments(includeDrafts = false): DocRow[] {
  return all<DocRow>(
    `SELECT slug, title, category, content FROM guide_documents
      ${includeDrafts ? "" : "WHERE status = 'published'"} ORDER BY category, title`,
  );
}

export function getGuideDocument(slug: string): DocRow | null {
  return (
    one<DocRow>("SELECT slug, title, category, content FROM guide_documents WHERE slug = ?", slug) ?? null
  );
}

type ScoredDoc = { doc: DocRow; score: number; matched: string[] };

function searchDocuments(query: string, limit = 3): ScoredDoc[] {
  const docs = listGuideDocuments().map((doc) => ({
    doc,
    docTokens: new Set(tokens(`${doc.title} ${doc.category} ${doc.content}`)),
    titleTokens: new Set(tokens(doc.title)),
    categoryTokens: new Set(tokens(doc.category)),
  }));
  const queryTokens = [...new Set(tokens(query))];
  if (!queryTokens.length) return [];

  const df = new Map<string, number>();
  docs.forEach(({ docTokens }) => {
    queryTokens.forEach((token) => {
      if ([...docTokens].some((docToken) => docToken.startsWith(token))) {
        df.set(token, (df.get(token) ?? 0) + 1);
      }
    });
  });

  return docs
    .map(({ doc, docTokens, titleTokens, categoryTokens }) => {
      let score = 0;
      const matched: string[] = [];
      queryTokens.forEach((token) => {
        const idf = Math.log((docs.length + 1) / ((df.get(token) ?? 0) + 0.5));
        if ([...titleTokens].some((t) => t.startsWith(token))) {
          score += 3 * idf;
          matched.push(token);
        } else if ([...categoryTokens].some((t) => t.startsWith(token))) {
          score += 1.5 * idf;
          matched.push(token);
        } else if ([...docTokens].some((t) => t.startsWith(token))) {
          score += 1 * idf;
          matched.push(token);
        }
      });
      return { doc, score, matched };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function bestSentences(content: string, query: string, count = 2): string {
  const sentences = content
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  if (sentences.length <= count) return sentences.join(" ");
  const queryTokens = tokens(query);
  const scored = sentences.map((sentence, index) => {
    const sentenceTokens = tokens(sentence);
    const score = queryTokens.reduce(
      (acc, token) => acc + (sentenceTokens.some((st) => st.startsWith(token)) ? 1 : 0),
      0,
    );
    return { sentence, score, index };
  });
  return scored
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, count)
    .sort((a, b) => a.index - b.index)
    .map((item) => item.sentence)
    .join(" ");
}

const SAFETY_PATTERNS = [
  "болит",
  "боль",
  "боли",
  "травм",
  "травмпункт",
  "диагноз",
  "лечен",
  "лекарств",
  "таблетк",
  "врач",
  "операци",
  "беремен",
  "грыж",
  "протруз",
  "давлен",
  "головокруж",
  "онемен",
  "покалыва",
  "хруст",
  "симптом",
  "медицин",
];

const GREETING_PATTERNS = ["привет", "здравствуй", "добрый день", "добрый вечер", "доброе утро", "хай"];

const DURATION_PATTERNS: { seconds: number; test: RegExp }[] = [
  { seconds: 10, test: /(10|десять)\s*мин/ },
  { seconds: 15, test: /(15|пятнадцать)\s*мин/ },
  { seconds: 20, test: /(20|двадцать)\s*мин/ },
  { seconds: 30, test: /(30|тридцать)\s*мин/ },
  { seconds: 40, test: /(40|сорок)\s*мин/ },
  { seconds: 60, test: /(60|час)/ },
];

const GOAL_HINTS: { goal: string; patterns: string[] }[] = [
  { goal: "start", patterns: ["начать", "нович", "первый", "старт", "с нуля", "не занимал"] },
  { goal: "habit", patterns: ["регуляр", "привычк", "каждый день", "вернуть", "перерыв", "бросил"] },
  { goal: "movement", patterns: ["спин", "шея", "плеч", "таз", "мобильн", "растяж", "скован", "сидяч"] },
  { goal: "deepen", patterns: ["глубж", "сложн", "продвинут", "сила", "баланс", "долг"] },
];

export type GuideAnswer = {
  content: string;
  citations: GuideCitation[];
  practices: PracticeListItem[];
  safety: boolean;
  provider: "mock";
};

function practiceCitation(practice: PracticeListItem): GuideCitation {
  return { type: "practice", title: practice.title, href: `/app/practice/${practice.id}` };
}

function documentCitation(doc: DocRow): GuideCitation {
  return { type: "document", title: doc.title, href: `/app/guide/knowledge/${doc.slug}` };
}

export function generateGuideAnswer(input: {
  message: string;
  userId?: string | null;
  subscription: SubscriptionView | null;
}): GuideAnswer {
  const message = input.message.trim();
  const normalized = normalize(message);
  const subscription = input.subscription;

  // 1. Медицинские вопросы — граница компетенции.
  if (SAFETY_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    const safetyDoc = getGuideDocument("pravila-bezopasnosti");
    return {
      content:
        "Я не могу оценивать состояние здоровья, ставить диагнозы или назначать лечение — это вне моей компетенции. " +
        "Если вы чувствуете боль, головокружение, онемение или занимаетесь после травмы, остановите практику и обратитесь к врачу. " +
        "Подобрать занятие с учётом ограничений и обсудить нагрузку лучше с преподавателем: напишите через раздел «Контакты». " +
        "В материалах школы есть общие правила безопасности — они не заменяют консультацию специалиста.",
      citations: safetyDoc
        ? [documentCitation(safetyDoc), { type: "document", title: "Контакты и поддержка", href: "/contacts" }]
        : [{ type: "document", title: "Контакты и поддержка", href: "/contacts" }],
      practices: [],
      safety: true,
      provider: "mock",
    };
  }

  // 2. Приветствие.
  if (message.length < 40 && GREETING_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return {
      content:
        "Здравствуйте. Помогу выбрать практику, объяснить структуру программы и подсказать следующий шаг. " +
        "Расскажите, сколько у вас времени и что хочется сделать сегодня — например: «подбери практику на 15 минут» или «как вернуться после перерыва».",
      citations: [],
      practices: pickPractices({ userId: input.userId, subscription, message, limit: 2 }),
      safety: false,
      provider: "mock",
    };
  }

  // 3. «Что дальше в программе» — берём реальный следующий урок.
  if (/следующ|что дальше|продолж|программ/.test(normalized) && input.userId) {
    const userPrograms = listUserPrograms(input.userId, canAccessPlan(subscription, "practice"));
    const active = userPrograms.find((item) => item.started && !item.completed) ?? userPrograms[0];
    if (active) {
      const modules = getProgramModules(active.program.id);
      const completedIds = getCompletedLessonIds(
        input.userId,
        modules.flatMap((module) => module.lessons.map((item) => item.id)),
      );
      const lesson = modules
        .flatMap((module) => module.lessons.map((item) => ({ ...item, moduleTitle: module.title })))
        .find((item) => !completedIds.has(item.id));
      if (lesson) {
        const practice = listPractices({ userId: input.userId, limit: 1 }).items.find(
          (item) => item.id === lesson.practiceId,
        );
        return {
          content:
            `Ваша текущая программа — «${active.program.title}», пройдено ${active.completedCount} из ${active.totalCount} уроков. ` +
            `Следующий шаг: «${lesson.title}» из модуля «${lesson.moduleTitle}» (${lesson.practiceDuration} мин). ` +
            `После завершения отметьте урок на экране практики — прогресс сохранится автоматически.`,
          citations: [
            { type: "program", title: active.program.title, href: `/app/programs/${active.program.id}` },
            ...(practice ? [practiceCitation(practice)] : []),
          ],
          practices: practice ? [practice] : [],
          safety: false,
          provider: "mock",
        };
      }
    }
  }

  // 4. Программы в целом.
  if (/программ/.test(normalized)) {
    const programs = listPrograms({ limit: 4 });
    return {
      content:
        "В школе четыре программы. «Первые шаги» — три недели для спокойного старта. «Мобильность и мягкое движение» — две недели для позвоночника, таза и плеч. «Регулярная домашняя практика» — четыре недели, чтобы удержать ритм. «Глубже в практику» — для тех, кто уже практикует регулярно. " +
        "Программу можно проходить в своём темпе: уроки не блокируются по расписанию.",
      citations: programs.map((program) => ({
        type: "program",
        title: program.title,
        href: `/programs/${program.slug}`,
      })),
      practices: [],
      safety: false,
      provider: "mock",
    };
  }

  // 5. Поиск по базе знаний + подбор практик.
  const matches = searchDocuments(message, 2);
  const goal =
    GOAL_HINTS.find((hint) => hint.patterns.some((pattern) => normalized.includes(pattern)))?.goal ?? null;
  const duration = DURATION_PATTERNS.find((item) => item.test.test(normalized))?.seconds ?? null;
  const practices = pickPractices({
    userId: input.userId,
    subscription,
    message,
    goal,
    durationMinutes: duration,
    limit: 2,
  });

  if (!matches.length) {
    return {
      content:
        "В утверждённых материалах школы я не нашёл прямого ответа на этот вопрос. Могу помочь с выбором практики, структурой программ, дыханием и возвращением к регулярности. " +
        "Если вопрос про здоровье или ограничения — лучше обсудить его с преподавателем или врачом. Уточните, пожалуйста, что именно хотите разобрать?",
      citations: [{ type: "document", title: "Контакты и поддержка", href: "/contacts" }],
      practices,
      safety: false,
      provider: "mock",
    };
  }

  const top = matches[0];
  const secondary = matches[1];
  const lead =
    goal === "habit" || /перерыв|вернуться/.test(normalized)
      ? "Возвращение к практике лучше начинать с небольшого объёма."
      : goal === "start"
        ? "Для начала важнее регулярность, а не длительность занятия."
        : goal === "movement"
          ? "Для подвижности выбирайте спокойный темп и комфортную амплитуду."
          : `По материалам школы: «${top.doc.title}».`;

  const body = bestSentences(top.doc.content, message, 3);
  const extra = secondary && secondary.score > top.score * 0.5 ? ` ${bestSentences(secondary.doc.content, message, 1)}` : "";

  const practiceHint = practices.length
    ? ` Могу предложить ${practices.length === 1 ? "практику" : "практики"} ниже — они подходят по длительности и уровню.`
    : "";

  return {
    content: `${lead} ${body}${extra}${practiceHint}`.replace(/\s+/g, " ").trim(),
    citations: [
      documentCitation(top.doc),
      ...(secondary ? [documentCitation(secondary.doc)] : []),
      ...practices.map(practiceCitation),
    ],
    practices,
    safety: false,
    provider: "mock",
  };
}

function pickPractices(input: {
  userId?: string | null;
  subscription: SubscriptionView | null;
  message: string;
  goal?: string | null;
  durationMinutes?: number | null;
  limit: number;
}): PracticeListItem[] {
  const goal = input.goal ?? null;
  const durationPref =
    input.durationMinutes && input.durationMinutes <= 15
      ? "10-15"
      : input.durationMinutes && input.durationMinutes <= 30
        ? "20-30"
        : input.durationMinutes
          ? "40+"
          : null;

  const recommended = recommendPractices({
    userId: input.userId ?? null,
    subscription: input.subscription,
    limit: input.limit + 2,
    goalOverride: goal,
    durationOverride: durationPref,
    allowLocked: false,
  });

  let items = recommended.map((item) => item.practice);
  if (!items.length) {
    items = listPractices({ userId: input.userId ?? null, limit: input.limit }).items;
  }
  if (input.durationMinutes) {
    items = items
      .sort(
        (a, b) =>
          Math.abs(a.durationMinutes - input.durationMinutes!) - Math.abs(b.durationMinutes - input.durationMinutes!),
      )
      .slice(0, input.limit);
  }
  return items.slice(0, input.limit);
}

// ─── История диалогов ────────────────────────────────────────────────────────

type ConversationRow = { id: string; title: string; created_at: string; updated_at: string };

export function listConversations(userId: string): GuideConversation[] {
  return all<ConversationRow>(
    "SELECT id, title, created_at, updated_at FROM guide_conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT 30",
    userId,
  ).map((row) => ({
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

type MessageRow = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations: string;
  created_at: string;
};

function mapMessage(row: MessageRow): GuideMessage {
  let citations: GuideCitation[] = [];
  try {
    const parsed = JSON.parse(row.citations);
    if (Array.isArray(parsed)) citations = parsed;
  } catch {
    citations = [];
  }
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    citations,
    createdAt: row.created_at,
  };
}

export function getConversation(userId: string, conversationId: string): GuideConversation | null {
  const conversation = one<ConversationRow>(
    "SELECT id, title, created_at, updated_at FROM guide_conversations WHERE id = ? AND user_id = ?",
    conversationId,
    userId,
  );
  if (!conversation) return null;
  const messages = all<MessageRow>(
    "SELECT id, role, content, citations, created_at FROM guide_messages WHERE conversation_id = ? ORDER BY created_at ASC",
    conversationId,
  ).map(mapMessage);
  return {
    id: conversation.id,
    title: conversation.title,
    createdAt: conversation.created_at,
    updatedAt: conversation.updated_at,
    messages,
  };
}

function usedToday(userId: string): number {
  const day = new Date().toISOString().slice(0, 10);
  const row = one<{ messages: number }>("SELECT messages FROM guide_usage WHERE user_id = ? AND day = ?", userId, day);
  return Number(row?.messages ?? 0);
}

export function guideMessagesLeft(userId: string): number {
  return Math.max(0, GUIDE_DAILY_LIMIT - usedToday(userId));
}

export function sendGuideMessage(input: {
  userId: string;
  conversationId?: string | null;
  message: string;
  subscription: SubscriptionView | null;
}): { conversationId: string; messages: GuideMessage[]; answer: GuideAnswer } {
  const message = input.message.trim();
  if (!message) throw new ApiError("empty_message", "Введите вопрос.", 422);
  if (message.length > GUIDE_MAX_MESSAGE_LENGTH) {
    throw new ApiError("message_too_long", `Максимальная длина сообщения — ${GUIDE_MAX_MESSAGE_LENGTH} символов.`, 422);
  }
  if (usedToday(input.userId) >= GUIDE_DAILY_LIMIT) {
    throw new ApiError(
      "limit_reached",
      `Достигнут дневной лимит сообщений (${GUIDE_DAILY_LIMIT}). Лимит обновится завтра.`,
      429,
    );
  }

  let conversationId = input.conversationId ?? null;
  if (conversationId) {
    const owned = one<{ id: string }>(
      "SELECT id FROM guide_conversations WHERE id = ? AND user_id = ?",
      conversationId,
      input.userId,
    );
    if (!owned) throw new ApiError("conversation_not_found", "Диалог не найден.", 404);
  } else {
    conversationId = `cnv_${crypto.randomUUID()}`;
    run(
      "INSERT INTO guide_conversations (id, user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      conversationId,
      input.userId,
      message.slice(0, 60),
      new Date().toISOString(),
      new Date().toISOString(),
    );
  }

  const now = new Date();
  const userMessage: MessageRow = {
    id: `msg_${crypto.randomUUID()}`,
    role: "user",
    content: message,
    citations: "[]",
    created_at: now.toISOString(),
  };
  run(
    "INSERT INTO guide_messages (id, conversation_id, role, content, citations, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    userMessage.id,
    conversationId,
    "user",
    message,
    "[]",
    now.toISOString(),
  );

  const answer = generateGuideAnswer({
    message,
    userId: input.userId,
    subscription: input.subscription,
  });

  const assistantRow: MessageRow = {
    id: `msg_${crypto.randomUUID()}`,
    role: "assistant",
    content: answer.content,
    citations: JSON.stringify(answer.citations),
    created_at: new Date().toISOString(),
  };
  run(
    "INSERT INTO guide_messages (id, conversation_id, role, content, citations, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    assistantRow.id,
    conversationId,
    "assistant",
    answer.content,
    assistantRow.citations,
    assistantRow.created_at,
  );
  run("UPDATE guide_conversations SET updated_at = ? WHERE id = ?", new Date().toISOString(), conversationId);
  run(
    `INSERT INTO guide_usage (user_id, day, messages) VALUES (?, ?, 1)
     ON CONFLICT(user_id, day) DO UPDATE SET messages = messages + 1`,
    input.userId,
    new Date().toISOString().slice(0, 10),
  );

  trackEvent("guide_message_sent", {
    userId: input.userId,
    props: { safety: answer.safety, citations: answer.citations.length },
    path: "/app/guide",
  });

  return {
    conversationId,
    messages: [mapMessage(userMessage), mapMessage(assistantRow)],
    answer,
  };
}

export function guideAdminStats() {
  const totalMessages = Number(
    one<{ c: number }>("SELECT count(*) AS c FROM guide_messages WHERE role = 'user'")?.c ?? 0,
  );
  const today = Number(
    one<{ c: number }>("SELECT count(*) AS c FROM guide_messages WHERE role = 'user' AND created_at >= ?", new Date().toISOString().slice(0, 10))?.c ?? 0,
  );
  const conversations = Number(one<{ c: number }>("SELECT count(*) AS c FROM guide_conversations")?.c ?? 0);
  return { totalMessages, today, conversations };
}

