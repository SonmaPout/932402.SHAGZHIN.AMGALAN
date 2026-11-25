'use strict';

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, 'tickets.db'));

// Выполнение SQL-команд, которые изменяют данные.
function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (error) {
            if (error) reject(error);
            else resolve({ id: this.lastID, changes: this.changes });
        });
    });
}

// Получение одной строки из таблицы.
function get(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (error, row) => {
            if (error) reject(error);
            else resolve(row);
        });
    });
}

// Получение массива строк.
function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (error, rows) => {
            if (error) reject(error);
            else resolve(rows);
        });
    });
}

// Создание таблицы и первоначальное заполнение тестовыми данными.
async function initDatabase() {
    await run(
        "CREATE TABLE IF NOT EXISTS tickets (" +
        "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
        "event_id INTEGER NOT NULL, " +
        "type TEXT NOT NULL CHECK(type IN ('general', 'vip')), " +
        "price REAL NOT NULL CHECK(price >= 0), " +
        "remaining INTEGER NOT NULL CHECK(remaining >= 0))"
    );

    const result = await get('SELECT COUNT(*) AS count FROM tickets');
    if (result.count === 0) {
        const demoTickets = [
            [7, 'general', 1500, 120],
            [7, 'vip', 3500, 25],
            [8, 'general', 900, 80],
            [8, 'vip', 2200, 12],
            [9, 'general', 1200, 60]
        ];
        for (const ticket of demoTickets) {
            await run(
                'INSERT INTO tickets(event_id, type, price, remaining) VALUES (?, ?, ?, ?)',
                ticket
            );
        }
    }
}

module.exports = { db, run, get, all, initDatabase };