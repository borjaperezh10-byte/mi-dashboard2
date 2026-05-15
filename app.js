// ============================================================
const GOOGLE_API_KEY = "AIzaSyDKKHKOiGqqTrQoRgDs06YeutloGJBmSrc";
const GOOGLE_CAL_ID  = "borjaperezh@gmail.com";
// ============================================================

const LAT = 40.4481;
const LON = -3.8138;

// Colores de Google Calendar → CSS
const GCOLOR_MAP = {
  '1':  '#a4bdfc', // Lavanda
  '2':  '#7ae28c', // Salvia
  '3':  '#dbadff', // Uva
  '4':  '#ff887c', // Flamingo
  '5':  '#fbd75b', // Plátano
  '6':  '#ffb878', // Mandarina
  '7':  '#46d6db', // Pavo real
  '8':  '#e1e1e1', // Grafito
  '9':  '#5484ed', // Arándano
  '10': '#51b749', // Albahaca
  '11': '#dc2127', // Tomate
};

// Color por defecto si el evento no tiene colorId
const DEFAULT_COLOR = '#4285f4';

function getEventColor(ev) {
  if (ev.colorId && GCOLOR_MAP[ev.colorId]) return GCOLOR_MAP[ev.colorId];
  return DEFAULT_COLOR;
}

function colorToLight(hex) {
  // Convierte el color sólido a una versión muy suave para el fondo
  return hex + '22';
}

// --- RELOJ Y FECHA ---
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  document.getElementById('clock').textContent = h + ':' + m;

  const days   = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const months = ['enero','febrero','marzo','abril','mayo','junio',
                  'julio','agosto','septiembre','octubre','noviembre','diciembre'];
  document.getElementById('date').textContent =
    days[now.getDay()] + ', ' + now.getDate() + ' de ' +
    months[now.getMonth()] + ' de ' + now.getFullYear();
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
var allWeekData = [];

async function loadWeather() {
  try {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + LAT + '&longitude=' + LON +
      '&current=temperature_2m,weathercode' +
      '&hourly=temperature_2m,weathercode,precipitation_probability' +
      '&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max' +
      '&timezone=Europe%2FMadrid&forecast_days=14';

    const res  = await fetch(url);
    const data = await res.json();

    // Clima actual
    const cur = data.current;
    document.getElementById('w-icon').textContent = weatherIcon(cur.weathercode);
    document.getElementById('w-temp').textContent = Math.round(cur.temperature_2m) + '°';
    document.getElementById('w-desc').textContent = weatherDesc(cur.weathercode);

    // Horas
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

    // Guardar datos semanales y renderizar semana actual
    allWeekData = data.daily;
    currentWeekStart = 0;
    renderWeek();

  } catch(e) {
    console.error('Error clima:', e);
  }
}

// --- SEMANA CON SWIPE ---
var currentWeekStart = 0;

function renderWeek() {
  const dayNames = ['dom','lun','mar','mié','jue','vie','sáb'];
  const weekEl   = document.getElementById('weekly');
  weekEl.innerHTML = '';

  const end = Math.min(currentWeekStart + 7, allWeekData.time.length);
  for (let i = currentWeekStart; i < end; i++) {
    const d    = new Date(allWeekData.time[i] + 'T12:00:00');
    const card = document.createElement('div');
    card.className = 'day-card';
    card.innerHTML =
      '<div class="d-name">' + (i === 0 ? 'Hoy' : dayNames[d.getDay()]) + '</div>' +
      '<div class="d-icon">' + weatherIcon(allWeekData.weathercode[i]) + '</div>' +
      '<div class="d-max">' + Math.round(allWeekData.temperature_2m_max[i]) + '°</div>' +
      '<div class="d-min">' + Math.round(allWeekData.temperature_2m_min[i]) + '°</div>' +
      '<div class="d-rain">' + (allWeekData.precipitation_probability_max[i] || 0) + '%</div>';
    weekEl.appendChild(card);
  }
}

function initWeekSwipe() {
  const wrapper = document.getElementById('weekly-wrapper');
  let startX = 0;
  wrapper.addEventListener('touchstart', function(e) {
    startX = e.changedTouches[0].screenX;
  }, { passive: true });
  wrapper.addEventListener('touchend', function(e) {
    const diff = startX - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentWeekStart + 7 < allWeekData.time.length) {
        currentWeekStart += 7;
        renderWeek();
      } else if (diff < 0 && currentWeekStart > 0) {
        currentWeekStart -= 7;
        renderWeek();
      }
    }
  }, { passive: true });
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
    const dayStr  = year + '-' + String(month + 1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
    const cell    = document.createElement('div');
    const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    cell.className = 'cal-day' + (isToday ? ' today' : '');
    cell.innerHTML = '<div class="cal-num">' + d + '</div>';

    (allEvents[dayStr] || []).slice(0, 3).forEach(function(ev) {
      const color   = ev.color;
      const evEl    = document.createElement('div');
      evEl.className = 'cal-event';
      evEl.style.background   = colorToLight(color);
      evEl.style.color        = color;
      evEl.style.borderLeft   = '2px solid ' + color;

      let label = ev.title;
      if (ev.time) label = ev.time + ' ' + label;
      evEl.textContent = label;
      cell.appendChild(evEl);
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

function initCalSwipe() {
  const wrapper = document.getElementById('calendar-wrapper');
  let startX = 0;
  wrapper.addEventListener('touchstart', function(e) {
    startX = e.changedTouches[0].screenX;
  }, { passive: true });
  wrapper.addEventListener('touchend', function(e) {
    const diff = startX - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 50) changeMonth(diff > 0 ? 1 : -1);
  }, { passive: true });
}

async function loadCalendar() {
  const now   = new Date();
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

      // Hora del evento
      let time = null;
      if (ev.start.dateTime) {
        const d = new Date(ev.start.dateTime);
        time = String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
      }

      allEvents[dayStr].push({
        title: ev.summary || 'Evento',
        color: getEventColor(ev),
        time:  time
      });
    });

    renderCalendar(currentCalYear, currentCalMonth);
    initCalSwipe();

  } catch(e) {
    console.error('Error calendario:', e);
    document.getElementById('calendar').innerHTML =
      '<div class="loading">Error al cargar el calendario.</div>';
  }
}

// --- INICIAR ---
loadWeather();
loadCalendar();
initWeekSwipe();
setInterval(loadWeather,  15 * 60 * 1000);
setInterval(loadCalendar, 30 * 60 * 1000);
