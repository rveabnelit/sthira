# API STHIRA (v1)

Базовый префикс: `/api/v1`. Формат ошибок единый:

```json
{ "error": { "code": "validation_error", "message": "Проверьте заполнение полей.", "details": {} } }
```

Успешный ответ: `{ "data": { ... } }`.

Аутентификация — cookie `sthira_session` (HttpOnly, SameSite=Lax, Secure в production).
Все проверки прав выполняются на сервере. Клиентские проверки не являются защитой.

## Авторизация

| Метод | Endpoint | Описание |
|---|---|---|
| POST | `/auth/register` | Регистрация. Создаёт сессию, выдаёт токен подтверждения email. Лимит 5/15 мин на IP. |
| POST | `/auth/login` | Вход. Лимит 25/15 мин на IP и 6/15 мин на email+IP. |
| POST | `/auth/logout` | Выход, удаление серверной сессии. |
| POST | `/auth/forgot-password` | Запрос восстановления. Ответ не раскрывает наличие аккаунта. |
| POST | `/auth/reset-password` | Новый пароль по одноразовому токену. Завершает все сессии. |
| POST | `/auth/verify-email` | Подтверждение email по одноразовому токену. |
| GET/POST | `/auth/resend-verification` | Статус/повторная отправка письма (нужна сессия). |

В демо-режиме (`DEMO_MODE=true`) ссылки подтверждения и восстановления возвращаются в поле `previewUrl`.

## Профиль

| Метод | Endpoint | Описание |
|---|---|---|
| GET | `/users/me` | Профиль и предпочтения. |
| PATCH | `/users/me` | Изменение отображаемого имени. |
| DELETE | `/users/me` | Запрос удаления аккаунта (тело: `{ "confirm": "УДАЛИТЬ" }`). Платёжные документы сохраняются. |
| GET/PATCH | `/users/me/preferences` | Предпочтения практики, часовой пояс, напоминания, завершение онбординга. |
| POST | `/users/me/password` | Смена пароля (текущий + новый). Завершает остальные сессии. |
| GET | `/users/me/notifications` | Список уведомлений и количество непрочитанных. |
| POST | `/users/me/notifications` | Отметить все прочитанными. |
| GET | `/users/me/completions` | История завершений и агрегированная статистика. |
| PATCH | `/completions/:id` | Самочувствие после практики (только владелец). |

## Практики

| Метод | Endpoint | Описание |
|---|---|---|
| GET | `/practices` | Каталог. Параметры: `q`, `goal`, `difficulty`, `duration`, `tag`, `sort`, `limit`, `offset`. Скрытые и черновики не отдаются. |
| GET | `/practices/:id` | Практика + `locked` по текущей подписке. |
| POST | `/practices/:id/complete` | Завершение. Тело: `programLessonId?`, `durationSeconds?`, `mood?`. Повтор не создаёт дубликат. Требует доступа по тарифу. |
| PUT | `/practices/:id/progress` | Сохранение позиции просмотра. |

## Программы

| Метод | Endpoint | Описание |
|---|---|---|
| GET | `/programs` | Опубликованные программы. |
| GET | `/programs/:id` | Программа, модули, уроки, прогресс пользователя. |
| GET | `/users/me/programs` | Программы с прогрессом текущего пользователя. |

## Избранное

| Метод | Endpoint | Описание |
|---|---|---|
| GET/POST | `/users/me/favorites/:practiceId` | Статус/добавление. Повторное добавление идемпотентно. |
| DELETE | `/users/me/favorites/:practiceId` | Удаление. |

## Подписка и платежи

| Метод | Endpoint | Описание |
|---|---|---|
| GET | `/plans` | Тарифы и текущий тариф пользователя. |
| GET | `/users/me/subscription` | Подписка, её статус, доступ и платежи. |
| POST | `/checkout/session` | Создание заказа и платёжной сессии. Тело: `{ "plan": "practice" \| "guide" \| "live" }`. |
| POST | `/subscriptions/cancel` | Отмена автопродления. Доступ сохраняется до конца периода. |
| POST | `/subscriptions/resume` | Возобновление автопродления. |
| GET | `/users/me/payments` | История платежей. |
| POST | `/webhooks/payment-provider` | Webhook провайдера. Требует HMAC-подпись `x-sthira-signature`. Идемпотентен по `event_id`. |
| POST | `/payments/mock/confirm` | Только демо: имитация подтверждения на тестовой платёжной форме (подпись формируется сервером). |

**Правила активации:** подписка включается только после проверки подписи webhook, совпадения суммы и
валюты с заказом. Повторный webhook не активирует заказ повторно и не создаёт повторное списание.

## STHIRA Guide

| Метод | Endpoint | Описание |
|---|---|---|
| POST | `/guide/messages` | Сообщение наставнику. Требует тариф Guide+. Лимит 10/мин и дневной лимит `GUIDE_DAILY_LIMIT`. |
| GET | `/guide/conversations` | Список диалогов (или `?id=` — конкретный). |
| GET | `/guide/conversations/:id` | Диалог с сообщениями и цитатами. |

Ответ содержит `citations` (документы/практики/программы со ссылками), `practices` (подходящие занятия),
`safety` (сработал ли guardrail по медицинским вопросам).

## Администрирование

Все endpoints требуют роль `admin` (проверка на сервере) и пишут запись в журнал действий.

| Метод | Endpoint | Описание |
|---|---|---|
| POST | `/admin/practices` | Создание практики. |
| PATCH/DELETE | `/admin/practices/:id` | Обновление / архивирование. |
| POST | `/admin/programs` | Создание программы с модулями и уроками. |
| PATCH/DELETE | `/admin/programs/:id` | Обновление структуры (полная замена) / архивирование. |
| POST | `/admin/guide-documents` | Материал базы знаний. |
| PATCH/DELETE | `/admin/guide-documents/:id` | Обновление / исключение из базы. |
| POST | `/admin/guide/test` | Тестовый вопрос без сохранения в историю. |
| POST | `/admin/live-sessions` | Создание онлайн-занятия. |
| PATCH | `/admin/live-sessions/:id` | Изменение занятия. |
| POST | `/admin/live-sessions/:id/cancel` | Отмена. |
| PATCH | `/admin/plans` | Цена, доступность, рекомендация тарифа. |
| PUT | `/admin/site-content` | Тексты публичного сайта. |
| POST | `/admin/webhooks/replay` | Повторная обработка события (проверка идемпотентности). |

## Коды ошибок

`validation_error`, `invalid_credentials`, `email_taken`, `unauthorized`, `forbidden`,
`subscription_required`, `rate_limited`, `invalid_token`, `order_not_found`, `invalid_signature`,
`amount_mismatch`, `limit_reached`, `guide_unavailable`, `not_found`.
