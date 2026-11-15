'use strict';
const sqlite3=require('sqlite3').verbose();
const path=require('path');
const db=new sqlite3.Database(path.join(__dirname,'tickets.db'));
function run(sql,params=[]){return new Promise((resolve,reject)=>db.run(sql,params,function(e){if(e)reject(e);else resolve({id:this.lastID,changes:this.changes})}))}
function get(sql,params=[]){return new Promise((resolve,reject)=>db.get(sql,params,(e,row)=>e?reject(e):resolve(row)))}
function all(sql,params=[]){return new Promise((resolve,reject)=>db.all(sql,params,(e,rows)=>e?reject(e):resolve(rows)))}
async function initDatabase(){
 await run(`CREATE TABLE IF NOT EXISTS tickets(id INTEGER PRIMARY KEY AUTOINCREMENT,event_id INTEGER NOT NULL,type TEXT NOT NULL CHECK(type IN ('general','vip')),price REAL NOT NULL CHECK(price>=0),remaining INTEGER NOT NULL CHECK(remaining>=0))`);
 const count=await get('SELECT COUNT(*) AS count FROM tickets');
 if(!count.count)for(const row of [[7,'general',1500,120],[7,'vip',3500,25],[8,'general',900,80],[8,'vip',2200,12],[9,'general',1200,60]])await run('INSERT INTO tickets(event_id,type,price,remaining) VALUES(?,?,?,?)',row);
}
module.exports={db,run,get,all,initDatabase};