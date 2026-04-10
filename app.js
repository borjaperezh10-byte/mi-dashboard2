// ============================================================
const GOOGLE_API_KEY   = "AIzaSyDKKHKOiGqqTrQoRgDs06YeutloGJBmSrc";
const GOOGLE_CAL_ID    = "borjaperezh@gmail.com";
// ============================================================

const LAT = 40.4481;  // Pozuelo de Alarcón, Madrid
const LON = -3.8138;

// --- RELOJ Y FECHA ---
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  document.getElementById('clock').textContent = `${h}:${m}`;

  const days   = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const months = ['enero','febrero','marzo','abril','mayo','junio',
                  'julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const d = now;
  document.getElementById('date').textContent =
    `${days[d.getDay()]}, ${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
}

setInterval(updateClock, 1000);
updateClock();

// --- ICONOS DEL TIEMPO ---
function weatherIcon(code) {
  if (code === 0)            return '☀️';
  if (code <= 2)             return '🌤️';
  if (code === 3)            return '☁️';
  if ([45,48].includes(code))return '🌫️';
  if (code <= 57)            return '🌦️';
  if (code <= 67)            return '🌧️';
  if (code <= 77)            return '❄️';
  if (code <= 82)            return '🌦️';
  if (code <= 99)            return '⛈️';
  return '🌡️';
}

function weatherDesc(code) {
  if (code === 0)            return 'Despejado';
  if (code <= 2)             return 'Parcialmente nublado';
  if (code === 3)            return 'Nublado';
  if ([45,48].includes(code))return 'Niebla';
  if (code <= 57)            return 'Llovizna';
  if (code <= 67)            return 'Lluvia';
  if (code <= 77)            return 'Nieve';
  if (code <= 82)            return 'Chubascos';
  if (code <= 99)            return 'Tormenta';
  return '–';
}

// --- CLIMA (Open-Meteo, sin API key) ---
async function loadWeather() {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
      `&current=temperature_2m,weathercode` +
      `&hourly=temperature_2m,weathercode,precipitation_probability` +
      `&daily=temperature_2m_max,temperature_2m_min,weathercode` +
      `&timezone=Europe%2FMadrid&forecast_days=7`;

    const res  = await fetch(url);
    const data = await res.json();

    // Clima actual
    const cur = data.current;
    document.getElementById('w-icon').textContent = weatherIcon(cur.weathercode);
    document.getElementById('w-temp').textContent = `${Math.round(cur.temperature_2m)}°`;
    document.getElementById('w-desc').textContent = weatherDesc(cur.weathercode);

    // Por horas (próximas 24h desde ahora)
    const nowH    = new Date().getHours();
    const hourEl  = document.getElementById('hourly');
    hourEl.innerHTML = '';
    for (let i = nowH; i < nowH + 24 && i < data.hourly.time.length; i++) {
      const t    = new Date(data.hourly.time[i]);
      const hh   = String(t.getHours()).padStart(2,'0');
      const card = document.createElement('div');
      card.className = 'hour-card';
      card.innerHTML = `
        <div class="h-time">${hh}:00</div>
        <div class="h-icon">${weatherIcon(data.hourly.weathercode[i])}</div>
        <div class="h-temp">${Math.round(data.hourly.temperature_2m[i])}°</div>
        <div class="h-rain">${data.hourly.precipitation_probability[i]}%</div>`;
      hourEl.appendChild(card);
    }

    // Próximos 7 días
    const dayNames = ['dom','lun','mar','mié','jue','vie','sáb'];
    const weekEl   = document.getElementById('weekly');
    weekEl.innerHTML = '';
    data.daily.time.forEach((dateStr, i) => {
      const d    = new Date(dateStr + 'T12:00:00');
      const card = document.createElement('div');
      card.className = 'day-card';
      card.innerHTML = `
        <div class="d-name">${i === 0 ? 'Hoy' : dayNames[d.getDay()]}</div>
        <div class="d-icon">${weatherIcon(data.daily.weathercode[i])}</div>
        <div class="d-max">${Math.round(data.daily.temperature_2m_max[i])}°</div>
        <div class="d-min">${Math.round(data.daily.temperature_2m_min[i])}°</div>`;
      weekEl.appendChild(card);
    });

  } catch (e) {
    console.error('Error clima:', e);
  }
}

// --- GOOGLE CALENDAR ---
async function loadCalendar() {
  if (!GOOGLE_API_KEY || GOOGLE_API_KEY === 'AQUI_TU_CLAVE_GOOGLE') {
    document.getElementById('calendar').innerHTML =
      '<div class="loading">Configura tu clave de Google Calendar en app.js</div>';
    return;
  }

  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59).toISOString();

  try {
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(GOOGLE_CAL_ID)}/events` +
      `?key=${GOOGLE_API_KEY}&timeMin=${start}&timeMax=${end}&singleEvents=true&orderBy=startTime&maxResults=50`;

    const res    = await fetch(url);
    const data   = await res.json();
    const events = data.items || [];

    // Agrupar eventos por día
    const byDay = {};
    events.forEach(ev => {
      const dayStr = (ev.start.dateTime || ev.start.date).substring(0, 10);
      if (!byDay[dayStr]) byDay[dayStr] = [];
      byDay[dayStr].push(ev.summary || 'Evento');
    });

    // Renderizar cuadrícula del mes
    const year  = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0=dom
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const calEl = document.getElementById('calendar');
    calEl.innerHTML = '';

    // Cabeceras
    ['lun','mar','mié','jue','vie','sáb','dom'].forEach(d => {
      const h = document.createElement('div');
      h.className = 'cal-header';
      h.textContent = d;
      calEl.appendChild(h);
    });

    // Ajuste: en España la semana empieza en lunes (1), no domingo (0)
    let startPad = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = 0; i < startPad; i++) {
      const e = document.createElement('div');
      e.className = 'cal-day empty';
      calEl.appendChild(e);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const cell   = document.createElement('div');
      cell.className = 'cal-day' + (d === today ? ' today' : '');
      cell.innerHTML = `<div class="cal-num">${d}</div>`;
      (byDay[dayStr] || []).slice(0, 2).forEach(name => {
        const ev = document.createElement('div');
        ev.className = 'cal-event';
        ev.textContent = name;
        cell.appendChild(ev);
      });
      calEl.appendChild(cell);
    }

  } catch (e) {
    console.error('Error calendario:', e);
    document.getElementById('calendar').innerHTML =
      '<div class="loading">Error al cargar el calendario. Revisa la clave API.</div>';
  }
}

// --- INICIAR ---
loadWeather();
loadCalendar();
setInterval(loadWeather, 15 * 60 * 1000);  // actualiza clima cada 15 min
setInterval(loadCalendar, 30 * 60 * 1000); // actualiza calendar cada 30 min