'use strict';
 
const dayNames = ['', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
const shortDays = ['', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
let activeDay = 1,
  lessons = [];
 
const list = document.querySelector('#lesson-list'),
  tabs = document.querySelector('#day-tabs'),
  dialog = document.querySelector('#lesson-dialog'),
  form = document.querySelector('#lesson-form');
 
async function api(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Ошибка сервера');
  return data;
}
 
function showNotice(text, error = false) {
  const el = document.querySelector('#notice');
  el.textContent = text;
  el.style.color = error ? '#ffaaa0' : '#8ed8c4';
}
 
function renderTabs() {
  tabs.replaceChildren();
  for (let day = 1; day <= 7; day++) {
    const button = document.createElement('button');
    button.className = 'day-tab' + (day === activeDay ? ' active' : '');
    button.type = 'button';
    button.setAttribute('aria-pressed', String(day === activeDay));
 
    const name = document.createElement('span');
    name.textContent = shortDays[day];
 
    const number = document.createElement('strong');
    number.textContent = String(day).padStart(2, '0');
 
    button.append(name, number);
    button.addEventListener('click', () => {
      activeDay = day;
      renderTabs();
      loadSchedule();
    });
    tabs.append(button);
  }
}
 
function renderLesson(item) {
  const article = document.createElement('article');
  article.className = 'lesson';
 
  const time = document.createElement('div');
  time.className = 'time';
  time.textContent = item.start_time;
 
  const end = document.createElement('small');
  end.textContent = 'до ' + item.end_time;
  time.append(end);
 
  const info = document.createElement('div');
 
  const title = document.createElement('h3');
  title.textContent = item.subject;
 
  const teacher = document.createElement('p');
  teacher.textContent = item.teacher + ' · ' + item.room;
  info.append(title, teacher);
 
  const actions = document.createElement('div');
  actions.className = 'lesson-actions';
 
  const edit = document.createElement('button');
  edit.type = 'button';
  edit.textContent = 'Изменить';
  edit.addEventListener('click', () => openEditor(item));
 
  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'delete';
  del.textContent = 'Удалить';
  del.addEventListener('click', async () => {
    if (!confirm('Удалить занятие из расписания?')) return;
    try {
      await api('/api/schedule/' + item.id, { method: 'DELETE' });
      showNotice('Занятие удалено');
      loadSchedule();
    } catch (e) {
      showNotice(e.message, true);
    }
  });
 
  actions.append(edit, del);
  article.append(time, info, actions);
  return article;
}
 
async function updateWeekSummary() {
  try {
    const allLessons = await api('/api/schedule');
    const minutes = allLessons.reduce(
      (sum, item) => sum + toMinutes(item.end_time) - toMinutes(item.start_time),
      0
    );
    document.querySelector('#week-count').textContent = allLessons.length + ' занятий за неделю';
    document.querySelector('#total-hours').textContent = (minutes / 60).toFixed(1) + ' ч';
  } catch (e) {
    showNotice(e.message, true);
  }
}
 
async function loadSchedule() {
  list.replaceChildren();
  try {
    lessons = await api('/api/schedule?day=' + activeDay);
    if (!lessons.length) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = 'На этот день занятий пока нет. Добавь первую пару!';
      list.append(empty);
    } else lessons.forEach(item => list.append(renderLesson(item)));
    await updateWeekSummary();
  } catch (e) {
    showNotice(e.message, true);
  }
}
 
function toMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}
 
function openEditor(item = null) {
  form.reset();
  document.querySelector('#form-error').textContent = '';
  document.querySelector('#lesson-id').value = item ? item.id : '';
  document.querySelector('#dialog-title').textContent = item ? 'Редактировать занятие' : 'Новое занятие';
  document.querySelector('#subject').value = item?.subject || '';
  document.querySelector('#teacher').value = item?.teacher || '';
  document.querySelector('#room').value = item?.room || '';
  document.querySelector('#day').value = String(item?.day || activeDay);
  document.querySelector('#start-time').value = item?.start_time || '09:30';
  document.querySelector('#end-time').value = item?.end_time || '11:00';
  dialog.showModal();
}
 
document.querySelector('#add-lesson').addEventListener('click', () => openEditor());
 
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
 
dialog.addEventListener('click', event => {
  if (event.target === dialog) dialog.close();
});
 
form.addEventListener('submit', async event => {
  event.preventDefault();
  const id = document.querySelector('#lesson-id').value;
  const payload = {
    subject: document.querySelector('#subject').value,
    teacher: document.querySelector('#teacher').value,
    room: document.querySelector('#room').value,
    day: Number(document.querySelector('#day').value),
    start_time: document.querySelector('#start-time').value,
    end_time: document.querySelector('#end-time').value
  };
  if (payload.start_time >= payload.end_time) {
    document.querySelector('#form-error').textContent = 'Время начала должно быть раньше времени окончания.';
    return;
  }
  try {
    await api(id ? '/api/schedule/' + id : '/api/schedule', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(payload)
    });
    activeDay = payload.day;
    renderTabs();
    dialog.close();
    showNotice(id ? 'Изменения сохранены' : 'Занятие добавлено');
    loadSchedule();
  } catch (e) {
    document.querySelector('#form-error').textContent = e.message;
  }
});
 
renderTabs();
loadSchedule();
 
