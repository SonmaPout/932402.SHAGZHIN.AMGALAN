'use strict';

const express = require('express');
const path = require('path');
const { run, get, all, initDatabase } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const DAYS = [1, 2, 3, 4, 5, 6, 7];

app.use(express.json());

// Логирование HTTP-запросов.
app.use((req, res, next) => {
    console.log('[' + new Date().toISOString() + '] ' + req.method + ' ' + req.url);
    next();
});

// Раздача клиентских файлов из папки public.
app.use(express.static(path.join(__dirname, 'public')));

// Проверка данных занятия перед сохранением.
function validateLesson(body) {
    const { subject, teacher, room, day, start_time, end_time } = body;

    if (typeof subject !== 'string' || !subject.trim()) {
        return 'Укажите название предмета';
    }

    if (typeof teacher !== 'string' || !teacher.trim()) {
        return 'Укажите преподавателя';
    }

    if (typeof room !== 'string' || !room.trim()) {
        return 'Укажите аудиторию';
    }

    if (!Number.isInteger(day) || !DAYS.includes(day)) {
        return 'День должен быть числом от 1 до 7';
    }

    const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

    if (
        typeof start_time !== 'string' ||
        typeof end_time !== 'string' ||
        !timePattern.test(start_time) ||
        !timePattern.test(end_time)
    ) {
        return 'Время должно быть в формате ЧЧ:ММ';
    }

    if (start_time >= end_time) {
        return 'Время начала должно быть раньше времени окончания';
    }

    return null;
}

// Проверка пересечения с другим занятием в тот же день.
// При редактировании текущая запись исключается из проверки.
async function hasConflict(lesson, excludeId = null) {
    const params = [lesson.day, lesson.end_time, lesson.start_time];

    let sql =
        'SELECT id, subject, room, start_time, end_time ' +
        'FROM schedule ' +
        'WHERE day = ? AND start_time < ? AND end_time > ?';

    if (excludeId !== null) {
        sql += ' AND id <> ?';
        params.push(excludeId);
    }

    return get(sql + ' LIMIT 1', params);
}

// GET: всё расписание или занятия выбранного дня.
app.get('/api/schedule', async (req, res, next) => {
    try {
        let sql = 'SELECT * FROM schedule';
        const params = [];

        if (req.query.day !== undefined) {
            const day = Number(req.query.day);

            if (!DAYS.includes(day)) {
                return res.status(400).json({
                    error: 'day должен быть числом от 1 до 7'
                });
            }

            sql += ' WHERE day = ?';
            params.push(day);
        }

        sql += ' ORDER BY day, start_time';

        const lessons = await all(sql, params);
        res.json(lessons);
    } catch (error) {
        next(error);
    }
});

// POST: добавление нового занятия.
app.post('/api/schedule', async (req, res, next) => {
    try {
        const validationError = validateLesson(req.body);

        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        const lesson = {
            ...req.body,
            subject: req.body.subject.trim(),
            teacher: req.body.teacher.trim(),
            room: req.body.room.trim()
        };

        const conflict = await hasConflict(lesson);

        if (conflict) {
            return res.status(409).json({
                error:
                    'Пересечение с занятием «' + conflict.subject +
                    '» (' + conflict.start_time + '–' +
                    conflict.end_time + ')'
            });
        }

        const result = await run(
            'INSERT INTO schedule ' +
            '(subject, teacher, room, day, start_time, end_time) ' +
            'VALUES (?, ?, ?, ?, ?, ?)',
            [
                lesson.subject,
                lesson.teacher,
                lesson.room,
                lesson.day,
                lesson.start_time,
                lesson.end_time
            ]
        );

        const createdLesson = await get(
            'SELECT * FROM schedule WHERE id = ?',
            [result.id]
        );

        res.status(201).json(createdLesson);
    } catch (error) {
        next(error);
    }
});

// PUT: изменение существующего занятия.
app.put('/api/schedule/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({ error: 'Некорректный ID' });
        }

        const existingLesson = await get(
            'SELECT id FROM schedule WHERE id = ?',
            [id]
        );

        if (!existingLesson) {
            return res.status(404).json({ error: 'Занятие не найдено' });
        }

        const validationError = validateLesson(req.body);

        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        const lesson = {
            ...req.body,
            subject: req.body.subject.trim(),
            teacher: req.body.teacher.trim(),
            room: req.body.room.trim()
        };

        const conflict = await hasConflict(lesson, id);

        if (conflict) {
            return res.status(409).json({
                error:
                    'Пересечение с занятием «' + conflict.subject +
                    '» (' + conflict.start_time + '–' +
                    conflict.end_time + ')'
            });
        }

        await run(
            'UPDATE schedule SET ' +
            'subject = ?, teacher = ?, room = ?, day = ?, ' +
            'start_time = ?, end_time = ? WHERE id = ?',
            [
                lesson.subject,
                lesson.teacher,
                lesson.room,
                lesson.day,
                lesson.start_time,
                lesson.end_time,
                id
            ]
        );

        const updatedLesson = await get(
            'SELECT * FROM schedule WHERE id = ?',
            [id]
        );

        res.json(updatedLesson);
    } catch (error) {
        next(error);
    }
});

// DELETE: удаление занятия.
app.delete('/api/schedule/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({ error: 'Некорректный ID' });
        }

        const result = await run(
            'DELETE FROM schedule WHERE id = ?',
            [id]
        );

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Занятие не найдено' });
        }

        res.json({ message: 'Занятие удалено' });
    } catch (error) {
        next(error);
    }
});

// Ответ для неизвестных маршрутов.
app.use((req, res) => {
    res.status(404).json({ error: 'Маршрут не найден' });
});

// Общий обработчик ошибок сервера.
app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

// Сначала инициализируем SQLite, затем запускаем сервер.
initDatabase()
    .then(() => {
        app.listen(PORT, () => {
            console.log('Server started on port ' + PORT);
        });
    })
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
