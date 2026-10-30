'use strict';

const STORAGE_KEYS = {
    gadgets: 'lab5-gadgets',
    theme: 'lab5-theme',
    hidden: 'lab5-list-hidden'
};

const defaultGadgets = [
    {
        name: 'Galaxy S24 Ultra',
        specs: ['Экран: 6,8 дюйма Dynamic AMOLED', 'Камера: 200 Мп', 'Аккумулятор: 5000 мА·ч']
    },
    {
        name: 'MacBook Pro 16',
        specs: ['Процессор: Apple M3 Pro', 'Экран: Liquid Retina XDR', 'Память: 18 ГБ']
    },
    {
        name: 'Sony WH-1000XM5',
        specs: ['Тип: беспроводные наушники', 'Шумоподавление: активное', 'Автономность: до 30 часов']
    },
    {
        name: 'Steam Deck OLED',
        specs: ['Экран: 7,4 дюйма OLED', 'Память: 512 ГБ', 'Частота обновления: до 90 Гц']
    }
];

function getElementByIdChecked(id) {
    const element = document.getElementById(id);

    if (!element) {
        console.error(`Элемент не найден: #${id}`);
        return null;
    }

    return element;
}

function readStoredGadgets() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.gadgets);
        return saved ? JSON.parse(saved) : defaultGadgets;
    } catch (error) {
        console.error('Не удалось прочитать список гаджетов:', error);
        return defaultGadgets;
    }
}

let gadgets = readStoredGadgets();

function saveGadgets() {
    try {
        localStorage.setItem(STORAGE_KEYS.gadgets, JSON.stringify(gadgets));
        const status = document.querySelector('#save-status');
        if (status) status.textContent = 'Изменения сохранены';
    } catch (error) {
        console.error('Не удалось сохранить список гаджетов:', error);
    }
}

function createGadgetCard(gadget, index) {
    const article = document.createElement('article');
    article.classList.add('gadget-card');

    const header = document.createElement('div');
    header.classList.add('gadget-card-header');

    const title = document.createElement('h3');
    title.textContent = gadget.name;

    const number = document.createElement('span');
    number.classList.add('gadget-index');
    number.textContent = `#${String(index + 1).padStart(2, '0')}`;

    header.appendChild(title);
    header.appendChild(number);
    article.appendChild(header);

    const list = document.createElement('ul');
    list.classList.add('gadget-specs');

    gadget.specs.forEach(specification => {
        const item = document.createElement('li');
        item.textContent = specification;
        list.appendChild(item);
    });

    article.appendChild(list);

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.classList.add('button', 'delete-gadget');
    deleteButton.textContent = 'Удалить';
    deleteButton.addEventListener('click', () => {
        gadgets.splice(index, 1);
        saveGadgets();
        renderGadgets();
    });

    article.appendChild(deleteButton);
    return article;
}

function renderGadgets() {
    const container = document.querySelector('#gadget-list');
    const countElement = getElementByIdChecked('gadget-count');
    const emptyMessage = getElementByIdChecked('empty-message');

    if (!container || !countElement || !emptyMessage) {
        console.error('Не удалось отобразить каталог: необходимые элементы отсутствуют.');
        return;
    }

    container.replaceChildren();

    gadgets.forEach((gadget, index) => {
        container.appendChild(createGadgetCard(gadget, index));
    });

    countElement.textContent = `${gadgets.length} устройств`;
    emptyMessage.hidden = gadgets.length !== 0;
}

function addGadget() {
    const name = prompt('Введите название гаджета:');

    if (name === null) return;
    if (!name.trim()) {
        alert('Название гаджета не может быть пустым.');
        return;
    }

    const specifications = prompt('Введите характеристики через запятую:');

    if (specifications === null) return;

    const specs = specifications
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);

    if (specs.length === 0) {
        alert('Добавьте хотя бы одну характеристику.');
        return;
    }

    gadgets.push({ name: name.trim(), specs });
    saveGadgets();
    renderGadgets();
}

function removeLastGadget() {
    const cards = document.querySelectorAll('#gadget-list .gadget-card');

    if (cards.length === 0) {
        alert('Список гаджетов пуст.');
        console.log('Нет гаджетов для удаления.');
        return;
    }

    gadgets.pop();
    saveGadgets();
    renderGadgets();
}

function toggleTheme() {
    const body = document.body;
    const themeButton = getElementByIdChecked('toggle-theme');

    if (!body || !themeButton) {
        console.error('Не удалось переключить тему: элемент не найден.');
        return;
    }

    const isLight = body.classList.toggle('theme-light');
    body.classList.toggle('theme-dark', !isLight);
    themeButton.textContent = isLight ? 'Тёмная тема' : 'Светлая тема';

    try {
        localStorage.setItem(STORAGE_KEYS.theme, isLight ? 'light' : 'dark');
    } catch (error) {
        console.error('Не удалось сохранить тему:', error);
    }
}

function toggleListVisibility() {
    const container = document.querySelector('#gadget-list');
    const emptyMessage = getElementByIdChecked('empty-message');
    const button = getElementByIdChecked('toggle-list');

    if (!container || !emptyMessage || !button) {
        console.error('Не удалось изменить видимость списка: элемент не найден.');
        return;
    }

    const isHidden = !container.hidden;
    container.hidden = isHidden;
    emptyMessage.hidden = isHidden || gadgets.length !== 0;
    button.textContent = isHidden ? 'Показать список' : 'Скрыть список';

    try {
        localStorage.setItem(STORAGE_KEYS.hidden, String(isHidden));
    } catch (error) {
        console.error('Не удалось сохранить состояние списка:', error);
    }
}

function restorePreferences() {
    const body = document.body;
    const themeButton = getElementByIdChecked('toggle-theme');
    const list = document.querySelector('#gadget-list');
    const listButton = getElementByIdChecked('toggle-list');

    if (!body || !themeButton || !list || !listButton) {
        console.error('Не удалось восстановить настройки страницы.');
        return;
    }

    let savedTheme = 'dark';
    let savedHidden = false;

    try {
        savedTheme = localStorage.getItem(STORAGE_KEYS.theme) || 'dark';
        savedHidden = localStorage.getItem(STORAGE_KEYS.hidden) === 'true';
    } catch (error) {
        console.error('Не удалось прочитать настройки страницы:', error);
    }

    body.classList.toggle('theme-light', savedTheme === 'light');
    body.classList.toggle('theme-dark', savedTheme !== 'light');
    themeButton.textContent = savedTheme === 'light' ? 'Тёмная тема' : 'Светлая тема';

    list.hidden = savedHidden;
    listButton.textContent = savedHidden ? 'Показать список' : 'Скрыть список';
}

function initializePage() {
    const addButton = getElementByIdChecked('add-gadget');
    const removeButton = getElementByIdChecked('remove-last');
    const themeButton = getElementByIdChecked('toggle-theme');
    const visibilityButton = getElementByIdChecked('toggle-list');

    if (!addButton || !removeButton || !themeButton || !visibilityButton) {
        console.error('Инициализация остановлена: отсутствуют элементы управления.');
        return;
    }

    addButton.addEventListener('click', addGadget);
    removeButton.addEventListener('click', removeLastGadget);
    themeButton.addEventListener('click', toggleTheme);
    visibilityButton.addEventListener('click', toggleListVisibility);

    renderGadgets();
    restorePreferences();
}

initializePage();