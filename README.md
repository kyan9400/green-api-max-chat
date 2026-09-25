# MAX Chat · GREEN-API

Веб-интерфейс для отправки и получения текстовых сообщений в мессенджере **MAX** через [GREEN-API](https://green-api.com/max). Внешний вид по мотивам [web.max.ru](https://web.max.ru/).

Тестовое задание на позицию «Фронтенд разработчик React».

## Возможности

- Вход по учётным данным инстанса GREEN-API (`idInstance`, `apiTokenInstance`) с проверкой, что инстанс авторизован.
- Создание чата по номеру телефона получателя.
- Отправка текстовых сообщений — метод [SendMessage](https://green-api.com/v3/docs/api/sending/SendMessage/).
- Получение сообщений — [HTTP API](https://green-api.com/v3/docs/api/receiving/technology-http-api/): `ReceiveNotification` → обработка → `DeleteNotification` в цикле.
- Статусы исходящих сообщений (отправлено / доставлено / прочитано).
- Входящие от новых собеседников автоматически создают чат; счётчик непрочитанных.
- История чатов сохраняется в браузере (localStorage) для каждого инстанса.
- Адаптивная вёрстка (на телефоне — список чатов и чат на отдельных экранах), тёмная тема по системной настройке.
- **Демо-режим** без аккаунта GREEN-API: кнопка «Попробовать демо» на экране входа. Эмулирует ту же очередь уведомлений, что и реальный API.

## Как это работает

| Шаг | Метод GREEN-API |
|---|---|
| Вход | `GET /waInstance{id}/getStateInstance/{token}` — ожидается `authorized` |
| Новый чат | `POST /waInstance{id}/checkAccount/{token}` `{ phoneNumber }` → `chatId` (в MAX это числовой идентификатор, а не номер телефона) |
| Отправка | `POST /waInstance{id}/sendMessage/{token}` `{ chatId, message }` |
| Получение | `GET /waInstance{id}/receiveNotification/{token}?receiveTimeout=5`, затем `DELETE /waInstance{id}/deleteNotification/{token}/{receiptId}` |

Обрабатываемые уведомления: `incomingMessageReceived` (ответ собеседника), `outgoingMessageReceived` (сообщение, отправленное с телефона), `outgoingAPIMessageReceived` (эхо отправленного через API — дедуплицируется по `idMessage`), `outgoingMessageStatus`. Остальные уведомления тоже удаляются из очереди, чтобы она не «застревала».

## Локальный запуск

Требуется Node.js 20+.

```bash
git clone https://github.com/kyan9400/green-api-max-chat.git
cd green-api-max-chat
npm install
npm run dev
```

Откройте http://localhost:5173 и введите `idInstance` и `apiTokenInstance` из [личного кабинета GREEN-API](https://console.green-api.com/) (инстанс MAX должен быть авторизован). Либо нажмите «Попробовать демо».

Проверка сценария из задания:
1. Войдите с данными инстанса.
2. Нажмите «+», введите номер получателя (например `+7 999 123-45-67`) и «Создать».
3. Напишите сообщение и нажмите Enter.
4. Ответьте с телефона получателя в MAX — ответ появится в чате.

Другие команды:

```bash
npm test          # юнит-тесты (Vitest)
npm run build     # проверка типов и production-сборка в dist/
npm run lint      # oxlint
```

## Структура

```
src/
  lib/
    greenApi.ts          клиент GREEN-API (fetch) + интерфейс MessengerClient
    notifications.ts     разбор уведомлений в события чата, нормализация номера
    chatState.ts         reducer состояния чатов (дедупликация, статусы, непрочитанные)
    useNotifications.ts  цикл ReceiveNotification / DeleteNotification
    demoClient.ts        офлайн-эмуляция API для демо-режима
    storage.ts           localStorage
  components/            LoginForm, Sidebar, ChatWindow, Avatar
```

Стек: React 19, TypeScript, Vite, Vitest. Без UI-библиотек и сторонних SDK — только `fetch`.

## Автор

Алхассан Аль Фарран — Telegram [@hassan775775](https://t.me/hassan775775), [портфолио](https://alhassan-portfolio-sigma.vercel.app/)
