'use strict';
const currencyInfo={USD:{name:'Доллар США',symbol:'$'},EUR:{name:'Евро',symbol:'€'},CNY:{name:'Китайский юань',symbol:'¥'}};
async function requestRates(currency){
  const response=await fetch(`/api/rates/${encodeURIComponent(currency)}`);
  if(!response.ok){const data=await response.json();throw new Error(data.error||'Не удалось получить данные')}
  return response.json();
}
function createCurrencyCard(data){
  const info=currencyInfo[data.currency],card=document.createElement('article');card.className='currency-card';
  const top=document.createElement('div');top.className='currency-top';
  const titleBlock=document.createElement('div'),title=document.createElement('h3');title.className='currency-code';title.textContent=data.currency;
  const name=document.createElement('p');name.className='currency-name';name.textContent=info.name;titleBlock.append(title,name);
  const symbol=document.createElement('span');symbol.className='currency-symbol';symbol.textContent=info.symbol;top.append(titleBlock,symbol);
  const average=document.createElement('p');average.className='average';average.textContent=data.avg.toLocaleString('ru-RU');
  const small=document.createElement('small');small.textContent=' среднее за неделю';average.appendChild(small);
  const bars=document.createElement('div');bars.className='rate-bars';const min=Math.min(...data.rates),max=Math.max(...data.rates);
  data.rates.forEach((rate,index)=>{const bar=document.createElement('div');bar.className='rate-bar';bar.style.height=`${max===min?100:28+((rate-min)/(max-min))*72}%`;bar.title=`День ${index+1}: ${rate}`;bars.appendChild(bar)});
  const days=document.createElement('div');days.className='days';for(let day=1;day<=7;day++){const label=document.createElement('span');label.textContent=day;days.appendChild(label)}
  card.append(top,average,bars,days);return card;
}
async function loadCurrencyCards(){
  const grid=document.querySelector('#currency-grid');if(!grid)return;grid.replaceChildren();
  for(const currency of Object.keys(currencyInfo)){try{grid.appendChild(createCurrencyCard(await requestRates(currency)))}catch(error){const p=document.createElement('p');p.textContent=`${currency}: ${error.message}`;grid.appendChild(p)}}
}
function setupApiForm(){
  const form=document.querySelector('#currency-form'),input=document.querySelector('#currency-input'),output=document.querySelector('#api-result');if(!form||!input||!output)return;
  form.addEventListener('submit',async event=>{event.preventDefault();const currency=input.value.trim().toUpperCase();if(!currency){output.textContent='Введите код валюты.';return}
    output.textContent='Загрузка...';try{output.textContent=JSON.stringify(await requestRates(currency),null,2)}catch(error){output.textContent=JSON.stringify({error:error.message},null,2)}});
}
async function registerServiceWorker(){
  if('serviceWorker'in navigator){try{await navigator.serviceWorker.register('/service-worker.js');console.log('Service Worker зарегистрирован.')}catch(error){console.error('Ошибка регистрации Service Worker:',error)}}
}
document.addEventListener('DOMContentLoaded',()=>{loadCurrencyCards();setupApiForm();registerServiceWorker()});