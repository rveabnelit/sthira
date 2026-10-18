import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Lock, MessageSquare, Plus, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth/guard";
import { getSubscription } from "@/lib/data/subscriptions";
import { canAccessPlan } from "@/lib/access";
import { getConversation, guideMessagesLeft, listConversations, GUIDE_DAILY_LIMIT } from "@/lib/guide";
import { formatDate } from "@/lib/format";
import { GuideChat } from "./guide-chat";
import { GuidePreview } from "@/components/site/guide-preview";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Eyebrow } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "STHIRA Guide",
  robots: { index: false, follow: false },
};

export default async function GuidePage({
  searchParams,
}: {
  searchParams: Promise<{ conversation?: string; q?: string }>;
}) {
  const params = await searchParams;
  const user = await requireUser("/app/guide");
  const subscription = getSubscription(user.id);
  const hasGuide = canAccessPlan(subscription, "guide");
  const conversations = listConversations(user.id);
  const active = params.conversation ? getConversation(user.id, params.conversation) : conversations[0] ? getConversation(user.id, conversations[0].id) : null;

  return (
    <div>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted">STHIRA Guide</p>
          <h1 className="display-2 mt-2 text-[clamp(1.9rem,1.5rem+1.6vw,2.6rem)]">Твой проводник в практике</h1>
          <p className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed text-muted">
            Помогает выбрать практику, объясняет структуру программ и подсказывает следующий урок. Опирается на
            утверждённые материалы школы.
          </p>
        </div>
        {hasGuide ? (
          <div className="flex items-center gap-2">
            <Badge tone="sage">
              <Sparkles className="h-3 w-3" />
              {guideMessagesLeft(user.id)} из {GUIDE_DAILY_LIMIT} сообщений
            </Badge>
          </div>
        ) : (
          <Badge tone="sand">
            <Lock className="h-3 w-3" />
            Тариф Guide
          </Badge>
        )}
      </header>

      {!hasGuide ? (
        <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="surface p-6">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-sage-soft text-forest">
              <Sparkles className="h-5 w-5" />
            </span>
            <h2 className="display-3 mt-4">Наставник доступен на тарифе Guide</h2>
            <p className="mt-2 max-w-lg text-[13px] leading-relaxed text-muted">
              Guide отвечает по утверждённым материалам школы, подбирает практики и помогает вернуться к
              регулярности. На тарифах Practice и Live без Guide этот раздел закрыт.
            </p>
            <ul className="mt-5 space-y-2 text-[12.5px] text-[#4d5048]">
              {[
                "Подбор практики под время и состояние",
                "Следующий урок в вашей программе",
                "Объяснение терминов и структуры программ",
                "Возвращение после перерыва",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-sage" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-2">
              <ButtonLink href="/pricing">
                Сравнить тарифы
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href="/app/practice" variant="secondary">
                Пока в библиотеку
              </ButtonLink>
            </div>
            <p className="mt-4 text-[10.5px] leading-relaxed text-muted">
              Guide не ставит диагнозы и не заменяет преподавателя или медицинскую консультацию.
            </p>
          </div>
          <GuidePreview compact />
        </div>
      ) : (
        <div className="mt-6 grid gap-5 lg:grid-cols-[260px_1fr]">
          <aside className="hidden lg:block">
            <div className="surface p-3">
              <Link
                href="/app/guide"
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[12.5px] font-medium text-forest transition-colors hover:bg-[#f5f1e8]"
              >
                <Plus className="h-3.5 w-3.5" />
                Новый диалог
              </Link>
              <div className="my-2 h-px bg-line" />
              <p className="px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-muted">История</p>
              {conversations.length === 0 ? (
                <p className="px-3 py-2 text-[11.5px] leading-relaxed text-muted">Диалогов пока нет.</p>
              ) : (
                <ul className="mt-1">
                  {conversations.map((conversation) => (
                    <li key={conversation.id}>
                      <Link
                        href={`/app/guide?conversation=${conversation.id}`}
                        className={`flex items-start gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-[#f5f1e8] ${
                          active?.id === conversation.id ? "bg-[#f0ece3]" : ""
                        }`}
                      >
                        <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" />
                        <span className="min-w-0">
                          <span className="block truncate text-[11.5px] text-ink">{conversation.title}</span>
                          <span className="block text-[10px] text-muted">
                            {formatDate(conversation.updatedAt, { day: "numeric", month: "short" })}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-4 rounded-xl border border-line bg-[#f7f3ea] p-4">
              <p className="text-[11px] font-medium text-ink">Границы компетенции</p>
              <p className="mt-1.5 text-[10.5px] leading-relaxed text-muted">
                Guide не консультирует по здоровью. При боли, травме или медицинском вопросе обратитесь к врачу.
              </p>
              <Link href="/contacts" className="link-underline mt-2 inline-block text-[10.5px] text-forest">
                Написать преподавателю
              </Link>
            </div>
          </aside>

          <GuideChat
            conversationId={params.conversation ?? active?.id ?? null}
            initialMessages={(params.conversation ? active?.messages : active?.messages) ?? []}
            initialLimit={guideMessagesLeft(user.id)}
            dailyLimit={GUIDE_DAILY_LIMIT}
            prefill={params.q ?? ""}
          />
        </div>
      )}
    </div>
  );
}
