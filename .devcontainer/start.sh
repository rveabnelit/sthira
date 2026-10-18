#!/usr/bin/env bash
# Запуск STHIRA в Codespaces. Идемпотентно: если сервер уже работает, ничего не делает.
set -e
cd "$(dirname "$0")/.."

if curl -fsS http://127.0.0.1:3100/ >/dev/null 2>&1; then
  echo "STHIRA уже запущена на порту 3100"
  exit 0
fi

if [ ! -d .next ]; then
  echo "Сборка не найдена, запускаем pnpm build…"
  pnpm build
fi

# setsid отвязывает процесс от сессии lifecycle-скрипта Codespaces,
# иначе сервер может быть остановлен после завершения postStartCommand.
setsid -f bash -c 'exec pnpm start > /tmp/sthira.log 2>&1 < /dev/null'

for _ in $(seq 1 60); do
  if curl -fsS http://127.0.0.1:3100/ >/dev/null 2>&1; then
    echo "STHIRA запущена: http://localhost:3100"
    exit 0
  fi
  sleep 1
done

echo "Не удалось запустить STHIRA. Лог:"
tail -n 80 /tmp/sthira.log
exit 1
