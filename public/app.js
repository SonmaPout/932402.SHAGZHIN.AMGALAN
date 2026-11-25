'use strict';

const grid = document.querySelector('#tickets');
const message = document.querySelector('#message');
const filter = document.querySelector('#event-filter');
const ticketForm = document.querySelector('#ticket-form');

// Сообщения выводятся на странице и остаются видимыми.
function notify(text, isError = false) {
    message.textContent = text;
    message.classList.toggle('error', isError);
}

// Общая функция для HTTP-запросов к серверу.
async function api(url, options = {}) {
    const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...options
    });
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Ошибка запроса');
    }

    return data;
}

// Создание карточки категории билетов.
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

    // Поле для выбора количества покупаемых билетов.
    const quantityLabel = document.createElement('label');
    quantityLabel.className = 'quantity-label';
    quantityLabel.textContent = 'Количество билетов';

    const quantityInput = document.createElement('input');
    quantityInput.className = 'quantity-input';
    quantityInput.type = 'number';
    quantityInput.min = '1';
    quantityInput.max = String(ticket.remaining);
    quantityInput.step = '1';
    quantityInput.value = ticket.remaining > 0 ? '1' : '';
    quantityInput.disabled = ticket.remaining === 0;
    quantityInput.setAttribute('aria-label', 'Количество билетов для покупки');
    quantityLabel.append(quantityInput);

    const actions = document.createElement('div');
    actions.className = 'actions';

    const buyButton = document.createElement('button');
    buyButton.type = 'button';
    buyButton.className = 'primary';
    buyButton.textContent = 'Купить';
    buyButton.disabled = ticket.remaining === 0;

    // Покупка указанного количества билетов.
    buyButton.addEventListener('click', async () => {
        const quantity = Number(quantityInput.value);

        if (!Number.isInteger(quantity) || quantity < 1) {
            notify('Укажите целое количество билетов — не меньше 1.', true);
            quantityInput.focus();
            return;
        }

        if (quantity > ticket.remaining) {
            notify(
                'Нельзя купить ' + quantity + ' билетов. Доступно: ' +
                ticket.remaining + '.',
                true
            );
            quantityInput.focus();
            return;
        }

        buyButton.disabled = true;
        quantityInput.disabled = true;

        try {
            const result = await api('/api/tickets/' + ticket.id + '/purchase', {
                method: 'POST',
                body: JSON.stringify({ quantity })
            });

            notify(
                'Покупка успешна: ' + quantity +
                ' билет(ов). Осталось: ' + result.ticket.remaining + '.'
            );
            await loadTickets();
        } catch (error) {
            notify(error.message, true);
            buyButton.disabled = false;
            quantityInput.disabled = false;
        }
    });

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'danger';
    deleteButton.textContent = 'Удалить';

    deleteButton.addEventListener('click', async () => {
        if (!confirm('Удалить категорию билетов?')) {
            return;
        }

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

// Загрузка билетов из SQLite через API.
async function loadTickets() {
    grid.replaceChildren();

    try {
        const query = filter.value
            ? '?event_id=' + encodeURIComponent(filter.value)
            : '';

        const tickets = await api('/api/tickets' + query);

        if (tickets.length === 0) {
            grid.textContent = 'Билетов пока нет.';
            return;
        }

        tickets.forEach(ticket => {
            grid.append(ticketCard(ticket));
        });
    } catch (error) {
        notify(error.message, true);
    }
}

// Обновляем каталог при смене фильтра.
filter.addEventListener('change', loadTickets);

// Добавление новой категории билетов.
ticketForm.addEventListener('submit', async event => {
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
        ticketForm.reset();
        await loadTickets();
    } catch (error) {
        notify(error.message, true);
    }
});

// Первоначальная загрузка каталога.
loadTickets();
