/**
 * Smoke-тест критичных сценариев через HTTP.
 * Требует запущенного приложения: BASE_URL=http://127.0.0.1:3100 node scripts/smoke.mjs
 */
const BASE = process.env.BASE_URL || "http://127.0.0.1:3100";
const results = [];
let cookie = "";
let userId = null;
let practiceId = null;
let orderId = null;

function log(status, name, extra = "") {
  results.push({ status, name, extra });
  const mark = status === "PASS" ? "✓" : status === "SKIP" ? "○" : "✗";
  console.log(`${mark} ${name}${extra ? ` — ${extra}` : ""}`);
}

async function call(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
      ...(options.headers ?? {}),
    },
    redirect: "manual",
  });
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(";")[0];
  let json = null;
  const text = await response.text();
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 120) };
  }
  return { status: response.status, json, headers: response.headers };
}

function expect(name, condition, extra = "") {
  log(condition ? "PASS" : "FAIL", name, extra);
}

async function main() {
  console.log(`\nSTHIRA smoke test → ${BASE}\n`);

  const home = await call("/");
  expect("Главная страница отдаёт 200", home.status === 200, String(home.status));

  const unknown = await call("/definitely-not-a-page");
  expect("Несуществующий адрес отдаёт 404", unknown.status === 404, String(unknown.status));

  const email = `smoke_${Date.now()}@example.com`;
  const register = await call("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({ displayName: "Smoke Тест", email, password: "SmokeTest12345", consent: true }),
  });
  expect("Регистрация нового пользователя", register.status === 201, `${register.status} ${register.json?.error?.message ?? ""}`);
  userId = register.json?.data?.user?.id ?? null;

  const duplicate = await call("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({ displayName: "Smoke Тест", email, password: "SmokeTest12345", consent: true }),
  });
  expect("Повторная регистрация того же email запрещена", duplicate.status === 409, String(duplicate.status));

  const me = await call("/api/v1/users/me");
  expect("Сессия после регистрации активна", me.status === 200 && me.json?.data?.user?.email === email, String(me.status));

  const practices = await call("/api/v1/practices?limit=5");
  practiceId = practices.json?.data?.practices?.[0]?.id ?? null;
  expect("Каталог практик доступен", practices.status === 200 && Boolean(practiceId));

  const lockedComplete = await call(`/api/v1/practices/${practiceId}/complete`, {
    method: "POST",
    body: JSON.stringify({ durationSeconds: 600 }),
  });
  expect("Завершение практики без подписки запрещено", lockedComplete.status === 403, String(lockedComplete.status));

  const admin = await call("/api/v1/admin/site-content", {
    method: "PUT",
    body: JSON.stringify({ entries: { "hero.title": "hack" } }),
  });
  expect("Доступ к админ-API без роли запрещён", admin.status === 403, String(admin.status));

  const checkout = await call("/api/v1/checkout/session", {
    method: "POST",
    body: JSON.stringify({ plan: "guide" }),
  });
  expect("Создание платёжной сессии", checkout.status === 201, `${checkout.status} ${checkout.json?.error?.message ?? ""}`);
  orderId = checkout.json?.data?.orderId ?? null;
  const confirmationUrl = checkout.json?.data?.confirmationUrl ?? "";
  const paymentId = new URL(confirmationUrl, BASE).searchParams.get("payment");
  expect("Провайдер вернул платёжную форму", Boolean(orderId && paymentId));

  const beforePay = await call("/api/v1/users/me/subscription");
  expect("До оплаты подписка не активна", beforePay.json?.data?.hasAccess === false);

  const confirm = await call("/api/v1/payments/mock/confirm", {
    method: "POST",
    body: JSON.stringify({ orderId, paymentId, outcome: "succeeded" }),
  });
  expect("Подтверждение тестового платежа", confirm.status === 200, `${confirm.status} ${confirm.json?.error?.message ?? ""}`);

  const afterPay = await call("/api/v1/users/me/subscription");
  const subscription = afterPay.json?.data?.subscription;
  expect("Подписка активирована после webhook", afterPay.json?.data?.hasAccess === true && subscription?.status === "active");

  const repeatConfirm = await call("/api/v1/payments/mock/confirm", {
    method: "POST",
    body: JSON.stringify({ orderId, paymentId, outcome: "succeeded" }),
  });
  const afterRepeat = await call("/api/v1/users/me/subscription");
  expect(
    "Повторный webhook не продлевает и не активирует заказ заново",
    repeatConfirm.status === 200 &&
      repeatConfirm.json?.data?.alreadyPaid === true &&
      afterRepeat.json?.data?.subscription?.periodEnd === subscription?.periodEnd,
  );

  const forged = await call("/api/v1/webhooks/payment-provider", {
    method: "POST",
    headers: { "x-sthira-signature": "deadbeef" },
    body: JSON.stringify({
      event_id: `evt_forged_${Date.now()}`,
      type: "payment.succeeded",
      created_at: new Date().toISOString(),
      payment: {
        id: paymentId,
        order_id: orderId,
        amount: 1490,
        currency: "RUB",
        status: "succeeded",
        paid_at: new Date().toISOString(),
      },
    }),
  });
  expect("Webhook с неверной подписью отклоняется", forged.status === 401, String(forged.status));

  const complete = await call(`/api/v1/practices/${practiceId}/complete`, {
    method: "POST",
    body: JSON.stringify({ durationSeconds: 600 }),
  });
  expect("Завершение практики по подписке", complete.status === 200, String(complete.status));

  const duplicateComplete = await call(`/api/v1/practices/${practiceId}/complete`, {
    method: "POST",
    body: JSON.stringify({ durationSeconds: 600 }),
  });
  expect(
    "Повторное завершение не создаёт дубликат",
    duplicateComplete.status === 200 && duplicateComplete.json?.data?.created === false,
  );

  const favorite = await call(`/api/v1/users/me/favorites/${practiceId}`, { method: "POST" });
  const favoriteAgain = await call(`/api/v1/users/me/favorites/${practiceId}`, { method: "POST" });
  const unfavorite = await call(`/api/v1/users/me/favorites/${practiceId}`, { method: "DELETE" });
  expect("Избранное: добавление, идемпотентность, удаление", favorite.status === 201 && favoriteAgain.status === 201 && unfavorite.status === 200);

  const guide = await call("/api/v1/guide/messages", {
    method: "POST",
    body: JSON.stringify({ message: "Подбери практику на 15 минут" }),
  });
  expect("Guide отвечает на тарифе Guide", guide.status === 200 && Boolean(guide.json?.data?.messages?.length), String(guide.status));

  const safety = await call("/api/v1/guide/messages", {
    method: "POST",
    body: JSON.stringify({ message: "У меня болит колено, можно ли делать наклон?" }),
  });
  expect("Guide обозначает границы компетенции", safety.status === 200 && safety.json?.data?.safety === true);

  const cancel = await call("/api/v1/subscriptions/cancel", { method: "POST" });
  const afterCancel = await call("/api/v1/users/me/subscription");
  expect(
    "Отмена автопродления сохраняет доступ до конца периода",
    cancel.status === 200 && afterCancel.json?.data?.hasAccess === true && afterCancel.json?.data?.subscription?.cancelAtPeriodEnd === true,
  );

  const logout = await call("/api/v1/auth/logout", { method: "POST" });
  cookie = "";
  const afterLogout = await call("/api/v1/users/me");
  expect("Выход завершает сессию", logout.status === 200 && afterLogout.status === 401);

  const failed = results.filter((item) => item.status === "FAIL");
  console.log(`\nИтого: ${results.length - failed.length}/${results.length} проверок пройдено.`);
  if (failed.length) {
    console.log("Неуспешные проверки:");
    failed.forEach((item) => console.log(` - ${item.name} ${item.extra}`));
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("SMOKE FAILED:", error);
  process.exit(1);
});
