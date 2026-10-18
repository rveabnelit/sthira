/**
 * Публичная ссылка на локально запущенную платформу.
 *
 *   node scripts/share.mjs              # SSH-туннель localhost.run (без предупреждающей страницы)
 *   node scripts/share.mjs --serveo     # резервный вариант serveo.net
 *   node scripts/share.mjs --cloudflared# если установлен cloudflared (CLOUDFLARED_PATH или .tools/)
 *
 * Ссылка живёт, пока запущены приложение и этот процесс. Для постоянного адреса
 * разверните проект по инструкции docs/DEPLOYMENT.md (Dockerfile + docker-compose.yml).
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const APP_PORT = process.env.PORT || "3100";
const LOCAL_URL = `http://127.0.0.1:${APP_PORT}`;
const mode = process.argv.includes("--serveo")
  ? "serveo"
  : process.argv.includes("--cloudflared")
    ? "cloudflared"
    : "localhost.run";

function lanAddress() {
  for (const addresses of Object.values(os.networkInterfaces())) {
    for (const address of addresses ?? []) {
      if (address.family === "IPv4" && !address.internal) return address.address;
    }
  }
  return null;
}

function findCloudflared() {
  const local = path.join(process.cwd(), ".tools", process.platform === "win32" ? "cloudflared.exe" : "cloudflared");
  if (fs.existsSync(local)) return local;
  return process.env.CLOUDFLARED_PATH || null;
}

async function checkServer() {
  try {
    const response = await fetch(LOCAL_URL, { signal: AbortSignal.timeout(5000) });
    return response.ok;
  } catch {
    return false;
  }
}

function start(command, args, onUrl, onExit) {
  const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
  let buffer = "";

  const handle = (chunk) => {
    const text = chunk.toString();
    buffer += text;
    const clean = text.replace(/\x1b\[[0-9;]*m/g, "");
    process.stdout.write(clean);
    const match =
      buffer.match(/https:\/\/[a-z0-9-]+\.lhr\.life/i) ??
      buffer.match(/https:\/\/[a-z0-9-]+\.serveousercontent\.com/i) ??
      buffer.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
    if (match) onUrl(match[0]);
  };

  child.stdout.on("data", handle);
  child.stderr.on("data", handle);
  child.on("exit", (code) => onExit(code));
  return child;
}

async function main() {
  if (!(await checkServer())) {
    console.error(`Приложение не отвечает на ${LOCAL_URL}. Сначала запустите: pnpm build && pnpm start`);
    process.exit(1);
  }

  const lan = lanAddress();
  console.log(`\nЛокально:  ${LOCAL_URL}`);
  if (lan) console.log(`В сети:    http://${lan}:${APP_PORT}  (если сервер слушает 0.0.0.0 и порт открыт в файрволе)`);
  console.log(`Туннель:   ${mode}\n`);

  let url = null;
  const onUrl = (value) => {
    if (url) return;
    url = value;
    console.log("\n==================================================");
    console.log(`Публичная ссылка: ${url}`);
    console.log("Она работает, пока запущены приложение и этот процесс.");
    console.log("==================================================\n");
  };

  const sshArgs = (host) => [
    "-o",
    "StrictHostKeyChecking=no",
    "-o",
    "UserKnownHostsFile=NUL",
    "-o",
    "ServerAliveInterval=30",
    "-o",
    "ExitOnForwardFailure=yes",
    "-R",
    `80:127.0.0.1:${APP_PORT}`,
    host,
  ];

  if (mode === "cloudflared") {
    const binary = findCloudflared();
    if (!binary) {
      console.error("cloudflared не найден. Укажите CLOUDFLARED_PATH или положите файл в .tools/");
      process.exit(1);
    }
    start(binary, ["tunnel", "--url", LOCAL_URL, "--no-autoupdate", "--protocol", "http2"], onUrl, (code) => {
      console.error(`cloudflared завершился с кодом ${code}.`);
      process.exit(code ?? 1);
    });
  } else {
    const host = mode === "serveo" ? "serveo.net" : "nokey@localhost.run";
    start("ssh", sshArgs(host), onUrl, (code) => {
      console.error(`SSH-туннель завершился с кодом ${code}. Проверьте доступ к порту 22 на ${host}.`);
      process.exit(code ?? 1);
    });
  }

  process.on("SIGINT", () => {
    console.log("\nОстанавливаем туннель.");
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("Не удалось поднять туннель:", error);
  process.exit(1);
});
