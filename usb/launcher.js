/**
 * Локальный запуск STHIRA с флешки (Windows/macOS/Linux).
 * Не требует интернета: все ассеты и шрифты лежат рядом.
 */
const fs = require("node:fs");
const path = require("node:path");
const net = require("node:net");
const http = require("node:http");
const { spawn } = require("node:child_process");

const appDir = __dirname;
process.chdir(appDir);

const dataDir = path.join(appDir, "data");
fs.mkdirSync(dataDir, { recursive: true });

process.env.DATABASE_PATH = path.join(dataDir, "sthira.db");
process.env.DEMO_MODE = "true";
process.env.SEED_DEMO_DATA = "true";
process.env.SHOW_DEMO_HINTS = "student";
process.env.PAYMENT_WEBHOOK_SECRET = "sthira-usb-local";
process.env.NEXT_TELEMETRY_DISABLED = "1";
process.env.NODE_ENV = "production";

function findFreePort(start, end) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => {
      if (start >= end) resolve(start);
      else resolve(findFreePort(start + 1, end));
    });
    server.once("listening", () => server.close(() => resolve(start)));
    server.listen(start, "127.0.0.1");
  });
}

function openBrowser(url) {
  const platform = process.platform;
  const command = platform === "win32" ? "cmd" : platform === "darwin" ? "open" : "xdg-open";
  const args = platform === "win32" ? ["/c", "start", "", url] : [url];
  try {
    const child = spawn(command, args, { detached: true, stdio: "ignore" });
    child.unref();
  } catch {
    /* браузер можно открыть вручную */
  }
}

function waitForServer(port, attempt = 0) {
  http
    .get({ host: "127.0.0.1", port, path: "/" }, (response) => {
      response.resume();
      if (response.statusCode && response.statusCode < 500) {
        if (process.env.STHIRA_NO_BROWSER !== "1") openBrowser(`http://127.0.0.1:${port}`);
        console.log("");
        console.log("==========================================================");
        console.log(`  STHIRA запущена: http://127.0.0.1:${port}`);
        console.log("  Браузер должен открыться сам. Если нет — откройте адрес вручную.");
        console.log("  Чтобы остановить — закройте это окно или нажмите Ctrl+C.");
        console.log("==========================================================");
        console.log("");
        console.log("  Демо-доступ: student@sthira.school / Student12345!");
        console.log("  Администратор: admin@sthira.school / Admin12345!");
        console.log("");
        return;
      }
      retry();
    })
    .on("error", retry);

  function retry() {
    if (attempt > 80) {
      console.error("Не удалось дождаться запуска сервера.");
      return;
    }
    setTimeout(() => waitForServer(port, attempt + 1), 250);
  }
}

(async () => {
  const port = await findFreePort(3100, 3200);
  process.env.PORT = String(port);
  process.env.HOSTNAME = "127.0.0.1";
  process.env.NEXT_PUBLIC_APP_URL = `http://127.0.0.1:${port}`;

  console.log("");
  console.log("  STHIRA — авторская школа хатха-йоги");
  console.log(`  Запускаем локальный сервер на порту ${port}…`);
  console.log("");

  require("./server.js");
  waitForServer(port);
})();
