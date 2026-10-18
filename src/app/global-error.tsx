"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ru">
      <body style={{ background: "#f3f0e8", color: "#292b27", fontFamily: "Georgia, serif" }}>
        <div style={{ maxWidth: 560, margin: "18vh auto", padding: "0 24px", textAlign: "center" }}>
          <p style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#85877f" }}>
            STHIRA · техническая ошибка
          </p>
          <h1 style={{ fontSize: 40, marginTop: 16, lineHeight: 1.1 }}>Что-то пошло не так</h1>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, lineHeight: 1.7, color: "#5c5f56" }}>
            Приложение столкнулось с непредвиденной ошибкой. Попробуйте обновить страницу или вернуться позже.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 24,
              padding: "12px 20px",
              borderRadius: 12,
              background: "#24392f",
              color: "#f3f0e8",
              border: 0,
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
              fontSize: 14,
            }}
          >
            Обновить страницу
          </button>
        </div>
      </body>
    </html>
  );
}
