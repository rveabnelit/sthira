/**
 * Визуальная проверка страниц: снимки через Chrome DevTools Protocol.
 * Требует запущенного приложения и установленного Chrome.
 *
 *   node scripts/visual-check.mjs
 *   BASE_URL=http://127.0.0.1:3100 node scripts/visual-check.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3100";
const OUT = path.join(process.cwd(), ".tmp", "shots");
const CHROME =
  process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9223;

const PAGES = [
  { name: "home", path: "/", height: 4200 },
  { name: "practice", path: "/practice", height: 2200 },
  { name: "practice-detail", path: "/practice/utrennyaya-myagkost", height: 1800 },
  { name: "programs", path: "/programs", height: 2200 },
  { name: "pricing", path: "/pricing", height: 2400 },
  { name: "about", path: "/about", height: 2600 },
  { name: "login", path: "/login", height: 900 },
  { name: "app", path: "/app", height: 1600, auth: true },
  { name: "checkout", path: "/checkout?plan=guide", height: 1200, auth: true },
  { name: "app-library", path: "/app/practice", height: 1800, auth: true },
  { name: "app-player", path: "/app/practice/pr_utrennyaya-myagkost", height: 1400, auth: true },
  { name: "app-progress", path: "/app/progress", height: 1800, auth: true },
  { name: "app-guide", path: "/app/guide", height: 1100, auth: true },
  { name: "app-subscription", path: "/app/subscription", height: 2200, auth: true },
  { name: "admin", path: "/admin", height: 1700, auth: true },
  { name: "admin-students", path: "/admin/students", height: 1000, auth: true },
  { name: "admin-practices", path: "/admin/practices", height: 1400, auth: true },
  { name: "admin-analytics", path: "/admin/analytics", height: 1800, auth: true },
  { name: "admin-guide", path: "/admin/guide", height: 1400, auth: true },
  { name: "mobile-home", path: "/", height: 1600, mobile: true },
  { name: "mobile-app", path: "/app", height: 1500, auth: true, mobile: true },
];

async function waitForChrome() {
  for (let i = 0; i < 40; i++) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (response.ok) return await response.json();
    } catch {
      /* ещё не поднялся */
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Chrome DevTools не отвечает");
}

async function login(email, password) {
  const response = await fetch(`${BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const setCookie = response.headers.get("set-cookie");
  if (!response.ok || !setCookie) throw new Error(`Не удалось войти как ${email}`);
  return setCookie.split(";")[0];
}

class Cdp {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.id = 0;
    this.pending = new Map();
    this.events = [];
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);
      if (data.id && this.pending.has(data.id)) {
        const { resolve, reject } = this.pending.get(data.id);
        this.pending.delete(data.id);
        if (data.error) reject(new Error(data.error.message));
        else resolve(data.result);
      } else if (data.method) {
        this.events.push(data);
      }
    });
  }

  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  waitFor(method, timeout = 15000) {
    return new Promise((resolve, reject) => {
      const started = Date.now();
      const timer = setInterval(() => {
        const index = this.events.findIndex((event) => event.method === method);
        if (index >= 0) {
          const [event] = this.events.splice(index, 1);
          clearInterval(timer);
          resolve(event);
        } else if (Date.now() - started > timeout) {
          clearInterval(timer);
          reject(new Error(`Не дождались ${method}`));
        }
      }, 50);
    });
  }

  close() {
    this.socket.close();
  }
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const chrome = spawn(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--no-first-run",
      "--no-default-browser-check",
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${path.join(process.cwd(), ".tmp", "chrome-cdp")}`,
      "--window-size=1440,1200",
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  try {
    await waitForChrome();
    const target = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" }).then((r) => r.json());
    const cdp = new Cdp(target.webSocketDebuggerUrl);
    await cdp.open();
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Network.enable");

    const adminCookie = await login("admin@sthira.school", "Admin12345!");
    const studentCookie = await login("student@sthira.school", "Student12345!");

    const only = process.env.ONLY ? process.env.ONLY.split(",").map((item) => item.trim()) : null;
    for (const page of PAGES) {
      if (only && !only.includes(page.name)) continue;
      const width = page.mobile ? 390 : 1440;
      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width,
        height: page.height,
        deviceScaleFactor: 1,
        mobile: Boolean(page.mobile),
      });
      await cdp.send("Network.clearBrowserCookies");
      if (page.auth) {
        const cookie = page.path.startsWith("/admin") ? adminCookie : studentCookie;
        const [name, value] = cookie.split("=");
        await cdp.send("Network.setCookie", { name, value, url: BASE, path: "/" });
      }
      cdp.events = [];
      await cdp.send("Page.navigate", { url: `${BASE}${page.path}` });
      await cdp.waitFor("Page.loadEventFired");
      await new Promise((resolve) => setTimeout(resolve, 900));
      const metrics = await cdp.send("Runtime.evaluate", {
        expression: "JSON.stringify({ sw: document.documentElement.scrollWidth, iw: window.innerWidth })",
        returnByValue: true,
      });
      const measured = JSON.parse(metrics.result.value);
      if (measured.sw > measured.iw + 1) {
        console.warn(`  ! горизонтальная прокрутка на ${page.name}: ${measured.sw} > ${measured.iw}`);
      }
      const shot = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
      const file = path.join(OUT, `${page.name}.png`);
      fs.writeFileSync(file, Buffer.from(shot.data, "base64"));
      console.log(`saved ${path.relative(process.cwd(), file)}`);
    }

    cdp.close();
  } finally {
    chrome.kill();
  }
}

main().catch((error) => {
  console.error("VISUAL CHECK FAILED:", error);
  process.exit(1);
});
