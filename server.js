'use strict';

const express = require('express');
const path = require('path');
const { run, get, all, initDatabase } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use((req, res, next) => {
    console.log('[' + new Date().toISOString() + '] ' + req.method + ' ' + req.url);
    next();
});
app.use(express.static(path.join(__dirname, 'public')));

// GET: список билетов с необязательным фильтром по событию.
app.get('/api/tickets', async (req, res, next) => {
    try {
        let sql = 'SELECT id, event_id, type, price, remaining FROM tickets';
        const params = [];
        if (req.query.event_id !== undefined) {
            const eventId = Number(req.query.event_id);
            if (!Number.isInteger(eventId) || eventId < 1) {
                return res.status(400).json({ error: 'event_id должен быть положительным целым числом' });
            }
            sql += ' WHERE event_id = ?';
            params.push(eventId);
        }
        sql += ' ORDER BY event_id, price';
        res.json(await all(sql, params));
    } catch (error) { next(error); }
});

// POST: создание категории билетов.
app.post('/api/tickets', async (req, res, next) => {
    try {
        const { event_id, type, price, remaining } = req.body;
        if (!Number.isInteger(event_id) || event_id < 1) {
            return res.status(400).json({ error: 'Некорректный event_id' });
        }
        if (!['general', 'vip'].includes(type)) {
            return res.status(400).json({ error: 'type должен быть general или vip' });
        }
        if (typeof price !== 'number' || !Number.isFinite(price) || price < 0) {
            return res.status(400).json({ error: 'price должен быть неотрицательным числом' });
        }
        if (!Number.isInteger(remaining) || remaining < 0) {
            return res.status(400).json({ error: 'remaining должен быть неотрицательным целым числом' });
        }
        const result = await run(
            'INSERT INTO tickets(event_id, type, price, remaining) VALUES (?, ?, ?, ?)',
            [event_id, type, price, remaining]
        );
        res.status(201).json(await get('SELECT * FROM tickets WHERE id = ?', [result.id]));
    } catch (error) { next(error); }
});

// POST: покупка нескольких билетов одной операцией.
app.post('/api/tickets/:id/purchase', async (req, res, next) => {
    const id = Number(req.params.id);
    const quantity = req.body.quantity === undefined ? 1 : req.body.quantity;
    if (!Number.isInteger(id) || id < 1 || !Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ error: 'Некорректный ID или количество билетов' });
    }
    try {
        // Транзакция не позволяет двум покупкам списать один и тот же остаток.
        await run('BEGIN IMMEDIATE');
        const result = await run(
            'UPDATE tickets SET remaining = remaining - ? WHERE id = ? AND remaining >= ?',
            [quantity, id, quantity]
        );
        if (result.changes === 0) {
            const exists = await get('SELECT id FROM tickets WHERE id = ?', [id]);
            await run('ROLLBACK');
            return res.status(exists ? 400 : 404).json({
                error: exists ? 'Недостаточно билетов' : 'Запись не найдена'
            });
        }
        const ticket = await get('SELECT * FROM tickets WHERE id = ?', [id]);
        await run('COMMIT');
        res.json({ message: 'Покупка оформлена', ticket });
    } catch (error) {
        try { await run('ROLLBACK'); } catch (rollbackError) { /* транзакция уже могла завершиться */ }
        next(error);
    }
});

// DELETE: удаление категории.
app.delete('/api/tickets/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({ error: 'Некорректный ID' });
        }
        const result = await run('DELETE FROM tickets WHERE id = ?', [id]);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Запись не найдена' });
        }
        res.json({ message: 'Запись удалена' });
    } catch (error) { next(error); }
});

app.use((req, res) => res.status(404).json({ error: 'Маршрут не найден' }));
app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

initDatabase()
    .then(() => app.listen(PORT, () => console.log('Server started on port ' + PORT)))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });