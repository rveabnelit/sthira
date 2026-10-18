/**
 * Отправка писем. В MVP внешний провайдер не подключён: письмо печатается в лог,
 * а ссылка возвращается в ответе API только в демонстрационном режиме.
 * Для production достаточно заменить реализацию на выбранный сервис.
 */
export const DEMO_MODE = process.env.DEMO_MODE !== "false";

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  link?: string;
};

export async function sendEmail(message: EmailMessage): Promise<{ delivered: boolean; previewLink?: string }> {
  const lines = [
    "──────────────────────────────────────────────",
    `[email] to: ${message.to}`,
    `[email] subject: ${message.subject}`,
    message.text,
    message.link ? `[email] link: ${message.link}` : "",
    "──────────────────────────────────────────────",
  ].filter(Boolean);
  console.info(lines.join("\n"));
  return { delivered: false, previewLink: DEMO_MODE ? message.link : undefined };
}
