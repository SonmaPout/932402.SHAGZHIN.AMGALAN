'use strict';

const grid = document.querySelector('#tickets');
const message = document.querySelector('#message');
const filter = document.querySelector('#event-filter');

// Сообщение остаётся на странице, пока не будет заменено следующим.
function notify(text, isError = false) {
    message.textContent = text;
    message.classList.toggle('error', isError);
}

// Универсальная функция для HTTP-запросов к серверу.
async function api(url, options = {}) {
    const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...options
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Ошибка запроса');
    return data;
}

// Формирование карточки категории билетов.
function ticketCard(ticket) {
    const card = document.createElement('article');
    card.className = 'ticket';

    const top = document.createElement('div');
    top.className = 'ticket-top';
    top.textContent = 'EVENT #' + ticket.event_id;
    const type = document.createElement('span');
    type.textContent = ticket.type.toUpperCase();
    top.append(type);

    const title = document.createElement('h3');
    title.textContent = ticket.type === 'vip' ? 'VIP-доступ' : 'Общий вход';
    const price = document.createElement('p');
    price.className = 'price';
    price.textContent = ticket.price.toLocaleString('ru-RU') + ' ₽';
    const stock = document.createElement('p');
    stock.className = 'muted';
    stock.textContent = 'Осталось мест: ' + ticket.remaining;

    // Пользователь сам задаёт количество билетов для покупки.
    const quantityLabel = document.createElement('label');
    quantityLabel.className = 'quantity-label';
    quantityLabel.textContent = 'Количество билетов';
    const quantityInput = document.createElement('input');
    quantityInput.className = 'quantity-input';
    quantityInput.type = 'number';
    quantityInput.min = '1';
    quantityInput.max = String(ticket.remaining);
    quantityInput.value = ticket.remaining > 0 ? '1' : '0';
    quantityInput.disabled = ticket.remaining === 0;
    quantityLabel.append(quantityInput);

    const actions = document.createElement('div');
    actions.className = 'actions';
    const buyButton = document.createElement('button');
    buyButton.className = 'primary';
    buyButton.textContent = 'Купить';
    buyButton.disabled = ticket.remaining === 0;

    buyButton.addEventListener('click', async () => {
        const quantity = Number(quantityInput.value);
        if (!Number.isInteger(quantity) || quantity < 1) {
            notify('Укажите количество не меньше 1.', true);
            return;
        }
        if (quantity > ticket.remaining) {
            notify('Доступно только ' + ticket.remaining + ' билетов.', true);
            return;
        }
        buyButton.disabled = true;
        try {
            const result = await api('/api/tickets/' + ticket.id + '/purchase', {
                method: 'POST',
                body: JSON.stringify({ quantity })
            });
            notify('Покупка успешна: ' + quantity + ' билет(ов). Осталось: ' + result.ticket.remaining + '.');
            await loadTickets();
        } catch (error) {
            notify(error.message, true);
            buyButton.disabled = false;
        }
    });

    const deleteButton = document.createElement('button');
    deleteButton.className = 'danger';
    deleteButton.textContent = 'Удалить';
    deleteButton.addEventListener('click', async () => {
        if (!confirm('Удалить категорию билетов?')) return;
        try {
            await api('/api/tickets/' + ticket.id, { method: 'DELETE' });
            notify('Категория удалена.');
            await loadTickets();
        } catch (error) {
            notify(error.message, true);
        }
    });

    actions.append(buyButton, deleteButton);
    card.append(top, title, price, stock, quantityLabel, actions);
    return card;
}

// Загрузка списка категорий из SQLite через API.
async function loadTickets() {
    grid.replaceChildren();
    try {
        const query = filter.value ? '?event_id=' + encodeURIComponent(filter.value) : '';
        const tickets = await api('/api/tickets' + query);
        if (tickets.length === 0) {
            grid.textContent = 'Билетов пока нет.';
            return;
        }
        tickets.forEach(ticket => grid.append(ticketCard(ticket)));
    } catch (error) {
        notify(error.message, true);
    }
}

filter.addEventListener('change', loadTickets);

// Обработка формы добавления категории.
document.querySelector('#ticket-form').addEventListener('submit', async event => {
    event.preventDefault();
    const payload = {
        event_id: Number(document.querySelector('#event-id').value),
        type: document.querySelector('#ticket-type').value,
        price: Number(document.querySelector('#price').value),
        remaining: Number(document.querySelector('#remaining').value)
    };
    try {
        await api('/api/tickets', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        notify('Категория добавлена.');
        event.target.reset();
        await loadTickets();
    } catch (error) {
        notify(error.message, true);
    }
});

loadTickets();