# Лабораторная работа №8 — итоговый мини-проект

**Вариант 12. Расписание занятий**  
Автор: Шагжин Амгалан · Группа 932402

## Описание

Адаптивное веб-приложение для ведения учебного расписания. Реализованы CRUD занятий, просмотр по дням недели, модальное окно добавления и редактирования, цветовое выделение карточек и проверка пересечений времени.

## Стек технологий

- HTML5 и CSS3 (Grid/Flexbox);
- JavaScript ES6+ (fetch, async/await);
- Node.js и Express;
- SQLite.

## Структура проекта

- `server.js` — Express API, проверка входных данных и конфликтов расписания.
- `db.js` — подключение к SQLite и инициализация таблицы.
- `schedule.db` — файл базы данных, создаётся автоматически при запуске.
- `public/index.html` — структура интерфейса и модальное окно.
- `public/styles.css` — адаптивные стили.
- `public/app.js` — переключение дней, CRUD-запросы и отображение расписания.

## Схема базы данных

Таблица `schedule` содержит следующие поля:

| Поле | Назначение |
|---|---|
| `id` | Уникальный идентификатор занятия |
| `subject` | Название предмета |
| `teacher` | Преподаватель |
| `room` | Аудитория |
| `day` | День недели: от 1 до 7 |
| `start_time` | Время начала |
| `end_time` | Время окончания |

Ограничения базы данных:

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

Дни недели: 1 — понедельник, ..., 7 — воскресенье. Время хранится в формате `HH:MM`.

## API

| Метод | URL | Назначение |
|---|---|---|
| GET | `/api/schedule` | Получить все занятия |
| GET | `/api/schedule?day=1` | Получить занятия выбранного дня |
| POST | `/api/schedule` | Добавить занятие |
| PUT | `/api/schedule/:id` | Изменить занятие |
| DELETE | `/api/schedule/:id` | Удалить занятие |

Пример тела запроса POST/PUT:

```json
{
    "subject": "Веб-разработка",
    "teacher": "Петров И.С.",
    "room": "ауд. 305",
    "day": 1,
    "start_time": "11:20",
    "end_time": "12:50"
}
```

## Проверка пересечений

Сервер проверяет обязательные поля, день недели, формат времени и условие, что время начала раньше времени окончания.

Пересечение существует, если занятия относятся к одному дню и выполняется условие:

```text
newStart < existingEnd AND newEnd > existingStart
```

При конфликте сервер возвращает статус **409 Conflict**. Некорректные данные дают статус 400, отсутствующая запись — 404.

## Запуск проекта

Установить зависимости:

```bash
npm install
```

Запустить сервер:

```bash
npm start
```

Открыть в браузере: http://localhost:3000

Для режима разработки:

```bash
npm run dev
```

## Примеры запросов

Получить всё расписание:

```bash
curl http://localhost:3000/api/schedule
```

Получить расписание понедельника:

```bash
curl "http://localhost:3000/api/schedule?day=1"
```

Добавить занятие:

```bash
curl -X POST http://localhost:3000/api/schedule \
  -H "Content-Type: application/json" \
  -d '{"subject":"Веб-разработка","teacher":"Петров И.С.","room":"305","day":1,"start_time":"11:20","end_time":"12:50"}'
```

Изменить занятие:

```bash
curl -X PUT http://localhost:3000/api/schedule/1 \
  -H "Content-Type: application/json" \
  -d '{"subject":"Алгоритмы","teacher":"Сидоров А.В.","room":"410","day":2,"start_time":"12:00","end_time":"13:30"}'
```

Удалить занятие:

```bash
curl -X DELETE http://localhost:3000/api/schedule/1
```
