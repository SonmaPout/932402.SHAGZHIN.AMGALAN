# Лабораторная работа №8 — итоговый мини-проект

**Вариант 12. Расписание занятий**  
Автор: Шагжин Амгалан · Группа 932402

## Описание
Адаптивное веб-приложение для ведения учебного расписания. Реализованы CRUD занятий, просмотр по дням недели, модальное окно добавления/редактирования, цветовое выделение карточек и проверка пересечений времени.

## Стек
HTML5, CSS3 (Grid/Flexbox), JavaScript ES6+ (fetch, async/await), Node.js, Express, SQLite.

## Структура
- `server.js` — Express API, проверка входных данных и конфликтов.
- `db.js` — SQLite и инициализация таблицы.
- `schedule.db` — создаётся автоматически.
- `public/index.html` — интерфейс и доступное модальное окно.
- `public/styles.css` — адаптивные стили.
- `public/app.js` — вкладки дней, CRUD через fetch и отображение расписания.

## Схема БД
```sql
CREATE TABLE schedule (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject TEXT NOT NULL,
  teacher TEXT NOT NULL,
  room TEXT NOT NULL,
  day INTEGER NOT NULL CHECK(day BETWEEN 1 AND 7),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  CHECK(start_time < end_time)
);
```
Дни недели: 1 — понедельник, ..., 7 — воскресенье. Время хранится в формате HH:MM.

## API
| Метод | URL | Назначение |
|---|---|---|
| GET | `/api/schedule` | Все занятия |
| GET | `/api/schedule?day=1` | Занятия выбранного дня |
| POST | `/api/schedule` | Добавить занятие |
| PUT | `/api/schedule/:id` | Изменить занятие |
| DELETE | `/api/schedule/:id` | Удалить занятие |

Пример тела POST/PUT:
```json
{"subject":"Веб-разработка","teacher":"Петров И.С.","room":"ауд. 305","day":1,"start_time":"11:20","end_time":"12:50"}
```

Сервер проверяет обязательные поля, день недели, формат времени и условие `start_time < end_time`. Пересечение существует, если у занятий одного дня `newStart < existingEnd AND newEnd > existingStart`. При конфликте возвращается **409 Conflict**. Неверные данные дают 400, отсутствующая запись — 404.

## Запуск
```bash
npm install
npm start
``
Откройте http://localhost:3000. Для разработки: `npm run dev`.

## Примеры запросов
```bash
curl http://localhost:3000/api/schedule
curl "http://localhost:3000/api/schedule?day=1"
curl -X POST http://localhost:3000/api/schedule -H "Content-Type: application/json" -d '{"subject":"Веб-разработка","teacher":"Петров И.С.","room":"305","day":1,"start_time":"11:20","end_time":"12:50"}'
curl -X PUT http://localhost:3000/api/schedule/1 -H "Content-Type: application/json" -d '{"subject":"Алгоритмы","teacher":"Сидоров А.В.","room":"410","day":2,"start_time":"12:00","end_time":"13:30"}'
curl -X DELETE http://localhost:3000/api/schedule/1
```
