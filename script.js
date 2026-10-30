'use strict';

const gadgets = [
    { name: 'Galaxy S24 Ultra', hours: 13 },
    { name: 'MacBook Pro 16', hours: 22 },
    { name: 'Sony WH-1000XM5', hours: 30 },
    { name: 'Steam Deck OLED', hours: 8 },
    { name: 'Планшет', hours: 10 },
    { name: 'Умные часы', hours: 36 },
    { name: 'Игровая консоль', hours: 4 }
];

const batteryHours = gadgets.map(gadget => gadget.hours);

const enteredName = prompt('Как вас зовут?');
const userName = enteredName && enteredName.trim()
    ? enteredName.trim()
    : 'Техногик';

alert(`Привет, ${userName}! Добро пожаловать в обзор автономности гаджетов.`);
console.log(`Пользователь: ${userName}`);

function findMaximum(numbers) {
    if (numbers.length === 0) {
        return null;
    }

    let maximum = numbers[0];

    for (let i = 1; i < numbers.length; i++) {
        if (numbers[i] > maximum) {
            maximum = numbers[i];
        }
    }

    return maximum;
}

function filterLongLivers(devices) {
    return devices.filter(device => device.hours > 8);
}

function calculateSum(numbers) {
    let sum = 0;

    for (const number of numbers) {
        sum += number;
    }

    return sum;
}

function countLowBattery(devices) {
    let count = 0;
    const lowBatteryDevices = [];

    for (let i = 0; i < devices.length; i++) {
        if (devices[i].hours <= 4) {
            count++;
            lowBatteryDevices.push(devices[i]);
        }
    }

    const share = devices.length === 0
        ? 0
        : (count / devices.length) * 100;

    return {
        count,
        share,
        devices: lowBatteryDevices
    };
}

const totalHours = calculateSum(batteryHours);
const averageHours = totalHours / batteryHours.length;
const longLivers = filterLongLivers(gadgets);
const maximumHours = findMaximum(batteryHours);
const lowBatteryResult = countLowBattery(gadgets);

const averageText = Number.isInteger(averageHours)
    ? String(averageHours)
    : averageHours.toFixed(1).replace('.', ',');

alert(
    `Среднее время работы – ${averageText} часов, ` +
    `${longLivers.length} устройств – долгожители.`
);

console.log('Время автономной работы:', batteryHours);
console.log('Максимальное время работы:', maximumHours, 'ч.');
console.log('Сумма часов:', totalHours, 'ч.');
console.log(
    'Устройства-долгожители (> 8 часов):',
    longLivers.map(device => `${device.name} — ${device.hours} ч.`)
);

console.log(
    'Устройств с малым временем работы (≤ 4 часов):',
    lowBatteryResult.count
);
console.log(
    'Доля устройств с малым временем работы:',
    `${lowBatteryResult.share.toFixed(1).replace('.', ',')}%`
);
console.log(
    'Эти устройства:',
    lowBatteryResult.devices.map(device => `${device.name} — ${device.hours} ч.`)
);

if (averageHours < 6) {
    console.log('Стоит обратить внимание на энергоэффективность');
} else {
    console.log('Среднее время работы не ниже 6 часов.');
}
