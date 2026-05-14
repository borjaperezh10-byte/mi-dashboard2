// ============================================================
const GOOGLE_API_KEY = "AIzaSyDKKHKOiGqqTrQoRgDs06YeutloGJBmSrc";
const GOOGLE_CAL_ID  = "borjaperezh@gmail.com";
// ============================================================

const LAT = 40.4481;
const LON = -3.8138;

// --- RELOJ Y FECHA ---
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  document.getElementById('clock').textContent = h + ':' + m;

  const days   = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const months = ['enero','febrero','marzo','abril','mayo','junio',
                  'julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const now2 = new Date();
  document.getElementById('date').textContent =
    days[now2.getDay()] + ', ' + now2.getDate() + ' de ' +
    months[now2.getMonth()] + ' de ' + now2.getFullYear();
}

setInterval(updateClock, 1000);
updateClock();

// --- ICONOS Y DESCRIPCIONES ---
function weatherIcon(code) {
  if (code === 0)             return '☀️';
  if (code <= 2)              return '🌤️';
  if (code === 3)             return '☁️';
  if ([45,48].includes(code)) return '🌫️';
  if (code <= 57)             return '🌦️';
  if (code <= 67)             return '🌧️';
  if (code <= 77)             return '❄️';
  if (code <= 82)             return '🌦️';
  if (code <= 99)             return '⛈️';
  return '🌡️';
}

function weatherDesc(code) {
  if (code === 0)             return 'Despejado';
  if (code <= 2)              return 'Parcialmente nublado';
  if (code === 3)             return 'Nublado';
  if ([45,48].includes(code)) return 'Niebla';
  if (code <= 57)             return 'Llovizna';
  if (code <= 67)             return 'Lluvia';
  if (code <= 77)             return 'Nieve';
  if (code <= 82)             return 'Chubascos';
  if (code <= 99)             return 'Tormenta';
  return '–';
}

// --- CLIMA ---
async function loadWeather() {
  try {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + LAT + '&longitude=' + LON +
      '&current=temperature_2m,weathercode' +
      '&hourly=temperature_2m,weathercode,precipitation_probability' +
      '&daily=temperature_2m_max,temperature_2m_min,weathercode' +
      '&timezone=Europe%2FMadrid&forecast_days=7';

    const res  = await fetch(url);
    const data = await res.json();

    const cur = data.current;
    document.getElementById('w-icon').textContent = weatherIcon(cur.weathercode);
    document.getElementById('w-temp').textContent = Math.round(cur.temperature_2m) + '°';
    document.getElementById('w-desc').textContent = weatherDesc(cur.weathercode);

    const nowH   = new Date().getHours();
    const hourEl = document.getElementById('hourly');
    hourEl.innerHTML = '';
    for (let i = nowH; i < nowH + 24 && i < data.hourly.time.length; i++) {
      const t    = new Date(data.hourly.time[i]);
      const hh   = String(t.getHours()).padStart(2,'0');
      const card = document.createElement('div');
      card.className = 'hour-card';
      card.innerHTML =
        '<div class="h-time">' + hh + ':00</div>' +
        '<div class="h-icon">' + weatherIcon(data.hourly.weathercode[i]) + '</div>' +
        '<div class="h-temp">' + Math.round(data.hourly.temperature_2m[i]) + '°</div>' +
        '<div class="h-rain">' + data.hourly.precipitation_probability[i] + '%</div>';
      hourEl.appendChild(card);
    }

    const dayNames = ['dom','lun','mar','mié','jue','vie','sáb'];
    const weekEl   = document.getElementById('weekly');
    weekEl.innerHTML = '';
    data.daily.time.forEach(function(dateStr, i) {
      const d    = new Date(dateStr + 'T12:00:00');
      const card = document.createElement('div');
      card.className = 'day-card';
      card.innerHTML =
        '<div class="d-name">' + (i === 0 ? 'Hoy' : dayNames[d.getDay()]) + '</div>' +
        '<div class="d-icon">' + weatherIcon(data.daily.weathercode[i]) + '</div>' +
        '<div class="d-max">' + Math.round(data.daily.temperature_2m_max[i]) + '°</div>' +
        '<div class="d-min">' + Math.round(data.daily.temperature_2m_min[i]) + '°</div>';
      weekEl.appendChild(card);
    });

  } catch(e) {
    console.error('Error clima:', e);
  }
}

// --- CALENDARIO CON SWIPE ---
var currentCalYear  = new Date().getFullYear();
var currentCalMonth = new Date().getMonth();
var allEvents = {};

function diaSemanaLunes(fecha) {
  const d = fecha.getDay();
  return d === 0 ? 6 : d - 1;
}

function renderCalendar(year, month) {
  const months = ['enero','febrero','marzo','abril','mayo','junio',
                  'julio','agosto','septiembre','octubre','noviembre','diciembre'];
  document.getElementById('cal-month-label').textContent =
    months[month].charAt(0).toUpperCase() + months[month].slice(1) + ' ' + year;

  const today        = new Date();
  const firstDay     = diaSemanaLunes(new Date(year, month, 1));
  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const calEl        = document.getElementById('calendar');
  calEl.innerHTML    = '';

  ['lun','mar','mié','jue','vie','sáb','dom'].forEach(function(d) {
    const h = document.createElement('div');
    h.className = 'cal-header';
    h.textContent = d;
    calEl.appendChild(h);
  });

  for (let i = 0; i < firstDay; i++) {
    const e = document.createElement('div');
    e.className = 'cal-day empty';
    calEl.appendChild(e);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = year + '-' + String(month + 1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
    const cell   = document.createElement('div');
    const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    cell.className = 'cal-day' + (isToday ? ' today' : '');
    cell.innerHTML = '<div class="cal-num">' + d + '</div>';
    (allEvents[dayStr] || []).slice(0, 2).forEach(function(name) {
      const ev = document.createElement('div');
      ev.className = 'cal-event';
      ev.textContent = name;
      cell.appendChild(ev);
    });
    calEl.appendChild(cell);
  }
}

function changeMonth(delta) {
  currentCalMonth += delta;
  if (currentCalMonth > 11) { currentCalMonth = 0;  currentCalYear++; }
  if (currentCalMonth < 0)  { currentCalMonth = 11; currentCalYear--; }
  renderCalendar(currentCalYear, currentCalMonth);
}

// Swipe táctil
var touchStartX = 0;
function initSwipe() {
  const wrapper = document.getElementById('calendar-wrapper');
  wrapper.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  wrapper.addEventListener('touchend', function(e) {
    const diff = touchStartX - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 50) {
      changeMonth(diff > 0 ? 1 : -1);
    }
  }, { passive: true });
}

async function loadCalendar() {
  // Cargamos 3 meses para tener margen al deslizar
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const end   = new Date(now.getFullYear(), now.getMonth() + 3, 0, 23, 59).toISOString();

  try {
    const url = 'https://www.googleapis.com/calendar/v3/calendars/' +
      encodeURIComponent(GOOGLE_CAL_ID) + '/events' +
      '?key=' + GOOGLE_API_KEY +
      '&timeMin=' + encodeURIComponent(start) +
      '&timeMax=' + encodeURIComponent(end) +
      '&singleEvents=true&orderBy=startTime&maxResults=200';

    const res    = await fetch(url);
    const data   = await res.json();
    const events = data.items || [];

    allEvents = {};
    events.forEach(function(ev) {
      const dayStr = (ev.start.dateTime || ev.start.date).substring(0, 10);
      if (!allEvents[dayStr]) allEvents[dayStr] = [];
      allEvents[dayStr].push(ev.summary || 'Evento');
    });

    renderCalendar(currentCalYear, currentCalMonth);
    initSwipe();

  } catch(e) {
    console.error('Error calendario:', e);
    document.getElementById('calendar').innerHTML =
      '<div class="loading">Error al cargar el calendario.</div>';
  }
}

// --- INICIAR ---
loadWeather();
loadCalendar();
setInterval(loadWeather,   15 * 60 * 1000);
setInterval(loadCalendar,  30 * 60 * 1000);
