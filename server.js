'use strict';
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Фиктивные учебные курсы за семь дней, не актуальные биржевые котировки.
const weeklyRates = {
  USD: [90, 91, 92, 93, 94, 95, 96],
  EUR: [98, 99, 100, 101, 102, 103, 104],
  CNY: [12.4, 12.5, 12.6, 12.7, 12.8, 12.9, 13.0]
};

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'public', 'about.html')));

// Query-параметры игнорируются согласно условию варианта 12.
app.get('/api/rates/:currency', (req, res) => {
  const currency = req.params.currency.toUpperCase();
  const rates = weeklyRates[currency];
  if (!rates) return res.status(404).json({ error: 'Currency not supported' });

  const avg = Number((rates.reduce((sum, rate) => sum + rate, 0) / rates.length).toFixed(2));
  return res.json({ currency, rates, avg });
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));