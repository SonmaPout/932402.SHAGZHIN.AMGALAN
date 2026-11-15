'use strict';
const sqlite3=require('sqlite3').verbose(),path=require('path');
const db=new sqlite3.Database(path.join(__dirname,'schedule.db'));
function run(sql,p=[]){return new Promise((resolve,reject)=>db.run(sql,p,function(e){e?reject(e):resolve({id:this.lastID,changes:this.changes})}))}
function get(sql,p=[]){return new Promise((resolve,reject)=>db.get(sql,p,(e,row)=>e?reject(e):resolve(row)))}
function all(sql,p=[]){return new Promise((resolve,reject)=>db.all(sql,p,(e,rows)=>e?reject(e):resolve(rows)))}
async function initDatabase(){
 await run(`CREATE TABLE IF NOT EXISTS schedule(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 subject TEXT NOT NULL,
 teacher TEXT NOT NULL,
 room TEXT NOT NULL,
 day INTEGER NOT NULL CHECK(day BETWEEN 1 AND 7),
 start_time TEXT NOT NULL,
 end_time TEXT NOT NULL,
 CHECK(start_time < end_time)
 )`);
 const count=await get('SELECT COUNT(*) AS count FROM schedule');
 if(!count.count)for(const row of [
 ['Математический анализ','Иванова М.А.','ауд. 214',1,'09:30','11:00'],
 ['Веб-разработка','Петров И.С.','ауд. 305',1,'11:20','12:50'],
 ['Алгоритмы и структуры данных','Сидоров А.В.','ауд. 410',2,'09:30','11:00'],
 ['Математическая статистика','Иванова М.А.','ауд. 214',3,'13:30','15:00'],
 ['Иностранный язык','Смирнова Е.В.','ауд. 118',4,'11:20','12:50'],
 ['Базы данных','Петров И.С.','ауд. 305',5,'09:30','11:00']
 ])await run('INSERT INTO schedule(subject,teacher,room,day,start_time,end_time) VALUES(?,?,?,?,?,?)',row);
}
module.exports={db,run,get,all,initDatabase};