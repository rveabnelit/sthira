import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { getSiteContent } from "@/lib/content";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

export const metadata: Metadata = {
  title: "STHIRA — йога, которая знает, что тебе делать сегодня",
  description:
    "Персональный путь в хатха-йоге: практики под твою цель, понятная система занятий и поддержка на каждом этапе. Авторская школа Марии Васильевой.",
};

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [user, content] = await Promise.all([getCurrentUser(), Promise.resolve(getSiteContent())]);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-forest focus:px-4 focus:py-2 focus:text-sm focus:text-ivory"
      >
        К содержанию
      </a>
      <SiteHeader user={user ? { displayName: user.displayName, role: user.role } : null} />
      <main id="main">{children}</main>
      <SiteFooter
        contacts={{
          email: content["contacts.email"],
          telegram: content["contacts.telegram"],
          hours: content["contacts.hours"],
        }}
        note={content["footer.note"]}
      />
    </>
  );
}
