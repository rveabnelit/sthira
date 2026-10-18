import Link from "next/link";
import { Logo } from "@/components/brand/logo";

const COLUMNS = [
  {
    title: "Платформа",
    links: [
      { href: "/practice", label: "Практики" },
      { href: "/programs", label: "Программы" },
      { href: "/pricing", label: "Тарифы" },
      { href: "/#guide", label: "STHIRA Guide" },
    ],
  },
  {
    title: "Школа",
    links: [
      { href: "/about", label: "О Марии" },
      { href: "/faq", label: "Вопросы и ответы" },
      { href: "/contacts", label: "Контакты" },
      { href: "/login", label: "Вход" },
    ],
  },
  {
    title: "Документы",
    links: [
      { href: "/terms", label: "Пользовательское соглашение" },
      { href: "/privacy", label: "Политика конфиденциальности" },
      { href: "/subscription-terms", label: "Условия подписки" },
    ],
  },
];

export function SiteFooter({ contacts, note }: { contacts: { email: string; telegram: string; hours: string }; note: string }) {
  return (
    <footer className="border-t border-line bg-ivory">
      <div className="container-app py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-[13px] leading-relaxed text-muted">
              Авторская школа хатха-йоги Марии Васильевой. Практика с понятным маршрутом и уважением к
              вашему темпу.
            </p>
            <p className="mt-5 text-[13px] text-[#565950]">
              <a href={`mailto:${contacts.email}`} className="link-underline">
                {contacts.email}
              </a>
            </p>
            <p className="mt-1 text-[13px] text-muted">{contacts.telegram} · {contacts.hours}</p>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="text-[11px] uppercase tracking-[0.16em] text-muted">{column.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-[13px] text-[#4d5048] transition-colors hover:text-forest">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-[11.5px] leading-relaxed text-muted md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} STHIRA. Все права защищены.</p>
          <p className="max-w-xl md:text-right">{note}</p>
        </div>
      </div>
    </footer>
  );
}
