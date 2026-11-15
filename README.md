# Лабораторная работа №7 — SQLite и CRUD

**Вариант 12. Билеты на мероприятие (остаток мест)**  
Автор: Шагжин Амгалан · Группа 932402

## Цель
Создать SQLite-базу, реализовать CRUD-функции и подключить их к REST API на Express.

## Структура
- `server.js` — Express-маршруты и валидация.
- `db.js` — подключение SQLite, Promise-обёртки и инициализация таблицы.
- `tickets.db` — файл БД создаётся автоматически при первом запуске.
- `public/` — клиентский интерфейс и запросы к API.

## Схема БД
```sql
CREATE TABLE tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('general','vip')),
  price REAL NOT NULL CHECK(price >= 0),
  remaining INTEGER NOT NULL CHECK(remaining >= 0)
);
```

## API
| Метод | URL | Назначение |
|---|---|---|
| GET | `/api/tickets` | Список, необязательный фильтр `?event_id=7` |
| POST | `/api/tickets` | Создание категории |
| POST | `/api/tickets/:id/purchase` | Покупка, уменьшение остатка |
| DELETE | `/api/tickets/:id` | Удаление категории |

Пример создания:
```json
{"event_id":7,"type":"vip","price":3500,"remaining":20}
```
Пример покупки:
```json
{"quantity":2}
```

Покупка выполняется транзакцией SQLite: `BEGIN IMMEDIATE`, условный `UPDATE ... WHERE remaining >= ?`, затем `COMMIT`. Если билетов недостаточно, транзакция откатывается (`ROLLBACK`) и сервер возвращает 400. Неизвестная запись — 404, некорректные данные — 400.

## Запуск
```bash
npm install
npm start
``
Откройте http://localhost:3000. Для разработки: `npm run dev`.

## Проверка
```bash
curl http://localhost:3000/api/tickets
curl "http://localhost:3000/api/tickets?event_id=7"
curl -X POST http://localhost:3000/api/tickets/1/purchase -H "Content-Type: application/json" -d '{"quantity":2}'
```
При первом старте добавляются демонстрационные записи. Данные сохраняются в локальном файле SQLite.
