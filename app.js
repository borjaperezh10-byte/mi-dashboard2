// ============================================================
const GOOGLE_API_KEY = "AIzaSyDKKHKOiGqqTrQoRgDs06YeutloGJBmSrc";
const GOOGLE_CAL_ID  = "borjaperezh@gmail.com";
const RECIPES_CSV    = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS88YCiOw3KwsPZkH41VdF4To3rlnG0th4wGMTHNKYz46P8RCCd3p9DCCwCSLN5M5trytKoGDYONW8n/pub?gid=0&single=true&output=csv";
// ============================================================

const LAT = 40.4481;
const LON = -3.8138;

// --- COLORES GOOGLE CALENDAR ---
const GCOLOR_MAP = {
  '1':'#a4bdfc','2':'#7ae28c','3':'#dbadff','4':'#ff887c',
  '5':'#fbd75b','6':'#ffb878','7':'#46d6db','8':'#e1e1e1',
  '9':'#5484ed','10':'#51b749','11':'#dc2127'
};
const DEFAULT_COLOR = '#4285f4';

function getEventColor(ev) {
  if (ev.colorId && GCOLOR_MAP[ev.colorId]) return GCOLOR_MAP[ev.colorId];
  return DEFAULT_COLOR;
}
function colorToLight(hex) { return hex + '22'; }

// ============================================================
// NAVEGACIÓN ENTRE VISTAS
// ============================================================
function showView(id) {
  document.querySelectorAll('.view').forEach(function(v) {
    v.classList.remove('active');
  });
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

// ============================================================
// RELOJ Y FECHA
// ============================================================
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

// ============================================================
// CLIMA
// ============================================================
function weatherIcon(code) {
  if (code === 0)              return '☀️';
  if (code <= 2)               return '🌤️';
  if (code === 3)              return '☁️';
  if ([45,48].includes(code))  return '🌫️';
  if (code <= 57)              return '🌦️';
  if (code <= 67)              return '🌧️';
  if (code <= 77)              return '❄️';
  if (code <= 82)              return '🌦️';
  if (code <= 99)              return '⛈️';
  return '🌡️';
}
function weatherDesc(code) {
  if (code === 0)              return 'Despejado';
  if (code <= 2)               return 'Parcialmente nublado';
  if (code === 3)              return 'Nublado';
  if ([45,48].includes(code))  return 'Niebla';
  if (code <= 57)              return 'Llovizna';
  if (code <= 67)              return 'Lluvia';
  if (code <= 77)              return 'Nieve';
  if (code <= 82)              return 'Chubascos';
  if (code <= 99)              return 'Tormenta';
  return '–';
}

var allWeekData      = [];
var currentWeekStart = 0;

async function loadWeather() {
  try {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + LAT + '&longitude=' + LON +
      '&current=temperature_2m,weathercode' +
      '&hourly=temperature_2m,weathercode,precipitation_probability' +
      '&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max' +
      '&timezone=Europe%2FMadrid&forecast_days=14';
    const res  = await fetch(url);
    const data = await res.json();

    const cur = data.current;
    document.getElementById('w-icon').textContent = weatherIcon(cur.weathercode);
    document.getElementById('w-temp').textContent = Math.round(cur.temperature_2m) + '°';
    document.getElementById('w-desc').textContent = weatherDesc(cur.weathercode);

    // Horas
    const nowH   = new Date().getHours();
    const hourEl = document.getElementById('hourly');
    hourEl.innerHTML = '';
    for (let i = nowH; i < nowH + 24 && i < data.hourly.time.length; i++) {
      const t  = new Date(data.hourly.time[i]);
      const hh = String(t.getHours()).padStart(2,'0');
      const card = document.createElement('div');
      card.className = 'hour-card';
      card.innerHTML =
        '<div class="h-time">' + hh + ':00</div>' +
        '<div class="h-icon">' + weatherIcon(data.hourly.weathercode[i]) + '</div>' +
        '<div class="h-temp">' + Math.round(data.hourly.temperature_2m[i]) + '°</div>' +
        '<div class="h-rain">' + data.hourly.precipitation_probability[i] + '%</div>';
      hourEl.appendChild(card);
    }

    allWeekData      = data.daily;
    currentWeekStart = 0;
    renderWeek();
    initWeekSwipe();

  } catch(e) { console.error('Error clima:', e); }
}

function renderWeek() {
  const dayNames = ['dom','lun','mar','mié','jue','vie','sáb'];
  const weekEl   = document.getElementById('weekly');
  weekEl.innerHTML = '';
  const end = Math.min(currentWeekStart + 7, allWeekData.time.length);
  for (let i = currentWeekStart; i < end; i++) {
    const d = new Date(allWeekData.time[i] + 'T12:00:00');
    const card = document.createElement('div');
    card.className = 'day-card';
    card.innerHTML =
      '<div class="d-name">' + (i === 0 ? 'Hoy' : dayNames[d.getDay()]) + '</div>' +
      '<div class="d-icon">' + weatherIcon(allWeekData.weathercode[i]) + '</div>' +
      '<div class="d-max">'  + Math.round(allWeekData.temperature_2m_max[i]) + '°</div>' +
      '<div class="d-min">'  + Math.round(allWeekData.temperature_2m_min[i]) + '°</div>' +
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
        currentWeekStart += 7; renderWeek();
      } else if (diff < 0 && currentWeekStart > 0) {
        currentWeekStart -= 7; renderWeek();
      }
    }
  }, { passive: true });
}

// ============================================================
// CALENDARIO
// ============================================================
var currentCalYear  = new Date().getFullYear();
var currentCalMonth = new Date().getMonth();
var allEvents       = {};

function diaSemanaLunes(fecha) {
  const d = fecha.getDay();
  return d === 0 ? 6 : d - 1;
}

function renderCalendar(year, month) {
  const months = ['enero','febrero','marzo','abril','mayo','junio',
                  'julio','agosto','septiembre','octubre','noviembre','diciembre'];
  document.getElementById('cal-month-label').textContent =
    months[month].charAt(0).toUpperCase() + months[month].slice(1) + ' ' + year;

  const today       = new Date();
  const firstDay    = diaSemanaLunes(new Date(year, month, 1));
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calEl       = document.getElementById('calendar');
  calEl.innerHTML   = '';

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
      const evEl = document.createElement('div');
      evEl.className = 'cal-event';
      evEl.style.background  = colorToLight(ev.color);
      evEl.style.color       = ev.color;
      evEl.style.borderLeft  = '2px solid ' + ev.color;
      evEl.textContent       = (ev.time ? ev.time + ' ' : '') + ev.title;
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
      let time = null;
      if (ev.start.dateTime) {
        const d = new Date(ev.start.dateTime);
        time = String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
      }
      allEvents[dayStr].push({ title: ev.summary || 'Evento', color: getEventColor(ev), time: time });
    });

    renderCalendar(currentCalYear, currentCalMonth);
    initCalSwipe();
  } catch(e) {
    console.error('Error calendario:', e);
    document.getElementById('calendar').innerHTML = '<div class="loading">Error al cargar el calendario.</div>';
  }
}

// ============================================================
// RECETAS
// ============================================================
var allRecipes        = [];
var activeCategory    = 'Todas';

// Parsea una línea CSV respetando campos entre comillas
function parseCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i+1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

async function loadRecipes() {
  try {
    const res  = await fetch(RECIPES_CSV);
    const text = await res.text();
    const lines = text.trim().split('\n');
    // Fila 0 = cabeceras, ignorar
    allRecipes = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const cols = parseCSVLine(lines[i]);
      allRecipes.push({
        nombre:       cols[0] || '',
        categoria:    cols[1] || 'Sin categoría',
        ingredientes: cols[2] || '',
        pasos:        cols[3] || ''
      });
    }
    renderRecipeFilters();
    renderRecipeList('Todas');
  } catch(e) {
    console.error('Error recetas:', e);
    document.getElementById('recipes-list').innerHTML =
      '<div class="loading">Error al cargar las recetas.</div>';
  }
}

function renderRecipeFilters() {
  const cats = ['Todas'];
  allRecipes.forEach(function(r) {
    if (r.categoria && cats.indexOf(r.categoria) === -1) cats.push(r.categoria);
  });
  const filtersEl = document.getElementById('cat-filters');
  filtersEl.innerHTML = '';
  cats.forEach(function(cat) {
    const btn = document.createElement('button');
    btn.className = 'cat-btn' + (cat === activeCategory ? ' active' : '');
    btn.textContent = cat;
    btn.onclick = function() {
      activeCategory = cat;
      document.querySelectorAll('.cat-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      renderRecipeList(cat);
    };
    filtersEl.appendChild(btn);
  });
}

function renderRecipeList(cat) {
  const listEl = document.getElementById('recipes-list');
  const filtered = cat === 'Todas'
    ? allRecipes
    : allRecipes.filter(function(r) { return r.categoria === cat; });

  if (filtered.length === 0) {
    listEl.innerHTML = '<div class="loading">No hay recetas en esta categoría.</div>';
    return;
  }

  listEl.innerHTML = '';
  filtered.forEach(function(recipe, idx) {
    const realIdx = allRecipes.indexOf(recipe);
    const card = document.createElement('div');
    card.className = 'recipe-card';
    card.innerHTML =
      '<div class="recipe-card-cat">' + recipe.categoria + '</div>' +
      '<div class="recipe-card-name">' + recipe.nombre + '</div>' +
      '<div class="recipe-card-arrow">›</div>';
    card.onclick = function() { showRecipeDetail(realIdx); };
    listEl.appendChild(card);
  });
}

function showRecipeDetail(idx) {
  const r = allRecipes[idx];
  document.getElementById('detail-title').textContent = r.nombre;
  document.getElementById('detail-meta').textContent  = r.categoria;

  // Ingredientes
  const ingList = document.getElementById('detail-ingredients');
  ingList.innerHTML = '';
  r.ingredientes.split('|').forEach(function(ing) {
    if (!ing.trim()) return;
    const li = document.createElement('li');
    li.textContent = ing.trim();
    ingList.appendChild(li);
  });

  // Pasos
  const stepsList = document.getElementById('detail-steps');
  stepsList.innerHTML = '';
  r.pasos.split('|').forEach(function(paso) {
    if (!paso.trim()) return;
    const li = document.createElement('li');
    li.textContent = paso.trim();
    stepsList.appendChild(li);
  });

  showView('view-recipe-detail');
}

// ============================================================
// ARRANQUE
// ============================================================
loadWeather();
loadCalendar();
loadRecipes();
setInterval(loadWeather,  15 * 60 * 1000);
setInterval(loadCalendar, 30 * 60 * 1000);
setInterval(loadRecipes,  60 * 60 * 1000);
