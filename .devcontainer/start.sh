#!/usr/bin/env bash
# Запуск STHIRA в Codespaces: сборка уже выполнена в postCreateCommand.
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

nohup pnpm start > /tmp/sthira.log 2>&1 &

for _ in $(seq 1 40); do
  if curl -fsS http://127.0.0.1:3100/ >/dev/null 2>&1; then
    echo "STHIRA запущена: http://localhost:3100 (порт 3100 → Public в Codespaces)"
    exit 0
  fi
  sleep 1
done

echo "Не удалось запустить STHIRA. Лог:"
tail -n 60 /tmp/sthira.log
exit 1
