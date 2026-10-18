import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { requireUser } from "@/lib/auth/guard";
import { getSubscription } from "@/lib/data/subscriptions";
import { canAccessPlan } from "@/lib/access";
import { getGuideDocument, listGuideDocuments } from "@/lib/guide";
import { Badge, Eyebrow } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Материалы школы",
  robots: { index: false, follow: false },
};

export default async function KnowledgePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser(`/app/guide/knowledge/${slug}`);
  const subscription = getSubscription(user.id);
  if (!canAccessPlan(subscription, "guide")) notFound();

  const document = getGuideDocument(slug);
  if (!document) notFound();
  const others = listGuideDocuments().filter((item) => item.slug !== slug);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/app/guide" className="inline-flex items-center gap-1.5 text-[12px] text-muted hover:text-forest">
        <ArrowLeft className="h-3.5 w-3.5" />
        STHIRA Guide
      </Link>

      <article className="mt-5">
        <div className="flex items-center gap-2">
          <Badge tone="sage">{document.category}</Badge>
          <Badge>Материал школы</Badge>
        </div>
        <h1 className="display-2 mt-3 text-[clamp(1.8rem,1.4rem+1.6vw,2.5rem)]">{document.title}</h1>
        <div className="prose-app mt-6">
          {document.content.split(/\n+/).map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </article>

      <div className="mt-8 rounded-[16px] border border-line bg-[#f7f3ea] p-4">
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Источник</p>
        <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">
          Материал входит в утверждённую базу знаний школы. Guide использует его при ответах. Материал не заменяет
          консультацию преподавателя или врача.
        </p>
      </div>

      {others.length ? (
        <section className="mt-10 border-t border-line pt-6">
          <Eyebrow>Другие материалы</Eyebrow>
          <ul className="mt-3 space-y-2">
            {others.slice(0, 6).map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/app/guide/knowledge/${item.slug}`}
                  className="flex items-center gap-2.5 text-[12.5px] text-[#4d5048] transition-colors hover:text-forest"
                >
                  <FileText className="h-3.5 w-3.5 text-muted" />
                  {item.title}
                  <span className="text-[10.5px] text-muted">· {item.category}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
