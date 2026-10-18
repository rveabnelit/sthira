export type EmailTemplateKind = "verify" | "password_reset";

const TEMPLATES: Record<EmailTemplateKind, { subject: string; text: (link: string) => string }> = {
  verify: {
    subject: "Подтвердите email — STHIRA",
    text: (link) =>
      `Здравствуйте!\n\nПодтвердите адрес электронной почты, чтобы завершить регистрацию в STHIRA.\n\n${link}\n\nСсылка действует 24 часа. Если вы не регистрировались, просто проигнорируйте письмо.`,
  },
  password_reset: {
    subject: "Восстановление доступа — STHIRA",
    text: (link) =>
      `Здравствуйте!\n\nМы получили запрос на восстановление пароля. Чтобы задать новый пароль, перейдите по ссылке:\n\n${link}\n\nСсылка действует 1 час. Если запрос был не от вас, просто проигнорируйте письмо — пароль останется прежним.`,
  },
};

export function emailTemplate(kind: EmailTemplateKind, link: string) {
  const template = TEMPLATES[kind];
  return { subject: template.subject, text: template.text(link) };
}
