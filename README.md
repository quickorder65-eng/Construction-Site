# Velora Build — демо-сайт ремонтной компании

Демо-версия landing page для **Velora Build** / velorabuild.kz.

Основная цель сайта — собирать **заявки на расчёт сметы** через квиз.
После прохождения квиза ответы клиента сохраняются в таблицу / CRM через `/api/save-lead`.

## Запуск

Открыть `index.html` в браузере — всё работает без сборки.
Для работы API (`/api/save-lead`) нужен Vercel или аналогичный serverless хостинг.

## Файлы

```
index.html          — HTML-структура сайта
style.css           — Стили и адаптив
script.js           — Квиз, чат, аналитика, отправка заявок
api/save-lead.js    — Serverless endpoint для сохранения заявок на смету
api/send-telegram.js — Удалён (возвращает 410)
README.md           — Эта инструкция
```

## Контакты

- Телефон: +7 700 000 00 00
- WhatsApp: https://wa.me/77000000000

## Изображения

Изображения заменены на дизайнерские плейсхолдеры.
Реальные фото нужно добавить вручную после передачи клиенту.

## Отзывы

Отзывы являются **демо-примерами** и должны быть заменены на реальные после запуска.

## Логика заявки на расчёт сметы

1. Пользователь проходит квиз (6 шагов)
2. Оставляет имя и телефон
3. Вызывается `sendLeadToCRM(data)` с `source: 'quiz_estimate_request'`
4. Данные уходят на `/api/save-lead`
5. Endpoint сохраняет в Google Sheets (если задан `GOOGLE_SHEETS_WEBHOOK_URL`) или работает в demo mode

Sources заявок:
- `quiz_estimate_request` — из квиза
- `final_estimate_request` — из финальной формы
- `chat_estimate_request` — из чат-помощника

## Подключение Google Sheets

Добавить в Vercel → Settings → Environment Variables:

```
GOOGLE_SHEETS_WEBHOOK_URL = https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

Если переменная не задана, заявки работают в demo mode (только console.log) — сайт не ломается.

Секреты и токены нельзя хранить в frontend-коде.

## Telegram

Telegram-интеграция удалена. `/api/send-telegram` возвращает 410 Gone.

## Чат-помощник

Называется "Помощник по смете". Защита от повторной отправки заявки через чат встроена.

## Структура данных заявки

```json
{
  "name": "",
  "phone": "",
  "source": "quiz_estimate_request",
  "objectType": "",
  "area": "",
  "repairType": "",
  "packageType": "",
  "startTime": "",
  "priority": "",
  "message": "",
  "pageUrl": "",
  "createdAt": "",
  "utmSource": "",
  "utmMedium": "",
  "utmCampaign": ""
}
```
