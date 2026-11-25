'use strict';

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, 'schedule.db'));

function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (error) {
            if (error) reject(error);
            else resolve({ id: this.lastID, changes: this.changes });
        });
    });
}

function get(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (error, row) => {
            if (error) reject(error);
            else resolve(row);
        });
    });
}

function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (error, rows) => {
            if (error) reject(error);
            else resolve(rows);
        });
    });
}

// Создаём таблицу расписания и добавляем начальные примеры, если она пуста.
async function initDatabase() {
    await run(
        'CREATE TABLE IF NOT EXISTS schedule (' +
        'id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
        'subject TEXT NOT NULL, ' +
        'teacher TEXT NOT NULL, ' +
        'room TEXT NOT NULL, ' +
        'day INTEGER NOT NULL CHECK(day BETWEEN 1 AND 7), ' +
        'start_time TEXT NOT NULL, ' +
        'end_time TEXT NOT NULL, ' +
        'CHECK(start_time < end_time))'
    );

    const result = await get('SELECT COUNT(*) AS count FROM schedule');
    if (result.count === 0) {
        const demoLessons = [
            ['Математический анализ', 'Иванова М.А.', 'ауд. 214', 1, '09:30', '11:00'],
            ['Веб-разработка', 'Петров И.С.', 'ауд. 305', 1, '11:20', '12:50'],
            ['Алгоритмы и структуры данных', 'Сидоров А.В.', 'ауд. 410', 2, '09:30', '11:00'],
            ['Математическая статистика', 'Иванова М.А.', 'ауд. 214', 3, '13:30', '15:00'],
            ['Иностранный язык', 'Смирнова Е.В.', 'ауд. 118', 4, '11:20', '12:50'],
            ['Базы данных', 'Петров И.С.', 'ауд. 305', 5, '09:30', '11:00']
        ];
        for (const lesson of demoLessons) {
            await run(
                'INSERT INTO schedule(subject, teacher, room, day, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)',
                lesson
            );
        }
    }
}

module.exports = { db, run, get, all, initDatabase };