// ════════════════════════════════════════════════════════════
//  HABIT TRACKER 2026 — Cloud Sync via JSONBin.io
//
//  SETUP (one-time, 2 minutes):
//  1. Go to https://jsonbin.io → sign up free
//  2. Click "New Bin" → paste {} → Save
//  3. Copy the Bin ID from the URL bar
//  4. Go to API Keys → create one → copy it
//  5. Paste both below ↓
// ════════════════════════════════════════════════════════════

const JSONBIN_ID  = '69d6088daaba882197d6570d';   // ← paste Bin ID here
const JSONBIN_KEY = '$2a$10$N0lToJB/qEWt7mh1x9KRc.BhHOePcBetbJj9ne8Sm7011LKb4fC3O';  // ← paste API key here

const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_ID}`;

// ── In-memory master store ────────────────────────────────────
let STORE = {};
let syncTimer = null;
let isSyncing = false;
let pendingSync = false;

// ════════════════════════════════════════════════════════════
//  CLOUD SYNC
// ════════════════════════════════════════════════════════════

async function loadFromCloud() {
  showSyncStatus('loading');
  try {
    const res = await fetch(JSONBIN_URL + '/latest', {
      headers: { 'X-Access-Key': JSONBIN_KEY }
    });
    if (!res.ok) throw new Error('fetch failed');
    const json = await res.json();
    STORE = json.record || {};
    localStorage.setItem('habit_store_cache', JSON.stringify(STORE));
    showSyncStatus('synced');
  } catch (err) {
    console.warn('Cloud load failed, using localStorage cache:', err);
    const cached = localStorage.getItem('habit_store_cache');
    STORE = cached ? JSON.parse(cached) : {};
    showSyncStatus('offline');
  }
}

async function saveToCloud() {
  if (isSyncing) { pendingSync = true; return; }
  isSyncing = true;
  showSyncStatus('saving');
  try {
    const res = await fetch(JSONBIN_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Access-Key': JSONBIN_KEY
      },
      body: JSON.stringify(STORE)
    });
    if (!res.ok) throw new Error('save failed');
    localStorage.setItem('habit_store_cache', JSON.stringify(STORE));
    showSyncStatus('synced');
  } catch (err) {
    console.warn('Cloud save failed:', err);
    localStorage.setItem('habit_store_cache', JSON.stringify(STORE));
    showSyncStatus('offline');
  }
  isSyncing = false;
  if (pendingSync) { pendingSync = false; saveToCloud(); }
}

// Debounce: waits 800ms after last change before pushing to cloud
function scheduleSave() {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(saveToCloud, 800);
}

function showSyncStatus(state) {
  const el = document.getElementById('syncStatus');
  if (!el) return;
  const states = {
    loading: { text: '⟳ Loading…', color: '#999' },
    saving:  { text: '⟳ Saving…',  color: '#f5a623' },
    synced:  { text: '☁ Synced',   color: '#3aa882' },
    offline: { text: '⚠ Offline',  color: '#e07090' },
  };
  const s = states[state] || states.synced;
  el.textContent = s.text;
  el.style.color = s.color;
}

// ════════════════════════════════════════════════════════════
//  STORAGE HELPERS
// ════════════════════════════════════════════════════════════

function saveData(key, val) {
  STORE[key] = val;
  scheduleSave();
  showToast();
}

function loadData(key, def) {
  const v = STORE[key];
  if (v === undefined || v === null) return def;
  return v;
}

// ════════════════════════════════════════════════════════════
//  APP CONSTANTS
// ════════════════════════════════════════════════════════════

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTH_DAYS = [31,28,31,30,31,30,31,31,30,31,30,31];
const WEEKDAYS_ABBR = ["S","M","T","W","T","F","S"];
const JAN1_DOW = 4;

const TODAY   = new Date();
const TODAY_M = TODAY.getMonth();
const TODAY_D = TODAY.getDate();
const TODAY_Y = TODAY.getFullYear();

const TODAY_BG   = '#f5c842';
const TODAY_TEXT = '#5a3e00';
const TODAY_RING = '#e8a800';

const DEFAULT_HABITS = [
  "☀️ Rise & Shine","📈 Market Trading","🍳 Breakfast & Reset","📚 Deep Study",
  "🧘 Midday Recharge","🥗 Lunch Break","✏️ Focused Study","🚿 Freshen Up",
  "🍎 Evening Snack","📖 Study / Wind Down","🌙 Evening Routine",
  "🍽️ Dinner & Relax","🔖 Night Study","😴 Wind Down & Sleep",
];
const SPECIAL_HABITS = ["💧 3L Water Intake","🥦 Diet Followed"];
const TOTAL_HABITS = 16;

const TIMINGS = [
  "8:00 AM","9:00–10:00","10:00–11:00","11:00–12:00",
  "12:00–1:30","1:30–2:30","2:30–3:30","3:30–4:30",
  "4:30–5:30","5:30–7:30","7:30–8:30","8:30–9:30",
  "9:30–10:30","10:30–11:30","DAILY","DAILY"
];

const TIMING_COLORS = [
  {bg:"#eef6fc",color:"#5a9abf"},{bg:"#feecf0",color:"#d9607a"},
  {bg:"#e0f5ee",color:"#3aa882"},{bg:"#fef6da",color:"#c49a00"},
  {bg:"#f0eafb",color:"#8856c8"},{bg:"#eef6fc",color:"#5a9abf"},
  {bg:"#feecf0",color:"#d9607a"},{bg:"#e0f5ee",color:"#3aa882"},
  {bg:"#fef6da",color:"#c49a00"},{bg:"#f0eafb",color:"#8856c8"},
  {bg:"#eef6fc",color:"#5a9abf"},{bg:"#feecf0",color:"#d9607a"},
  {bg:"#e0f5ee",color:"#3aa882"},{bg:"#fef6da",color:"#c49a00"},
  {bg:"#d0f0ff",color:"#0077aa"},{bg:"#d6f5dc",color:"#1a7a3a"},
];

const WEEK_COLORS = ['#b8d4e8','#f9c0cb','#a8e0d0','#f4b8a0','#c8b0e8'];
let charts = {};

// ════════════════════════════════════════════════════════════
//  UI HELPERS
// ════════════════════════════════════════════════════════════

let toastTimer;
function showToast() {
  const t = document.getElementById('toast');
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1200);
}

function escHtml(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function getDayOfWeek(mi, day) {
  let total = 0;
  for (let i = 0; i < mi; i++) total += MONTH_DAYS[i];
  return (JAN1_DOW + total + day - 1) % 7;
}
function weekOfDay(d) { return Math.min(Math.floor((d - 1) / 7), 4); }

// ════════════════════════════════════════════════════════════
//  TABLE BUILDERS
// ════════════════════════════════════════════════════════════

function buildWeekHeaders(m, days) {
  const ranges = {};
  for (let d = 1; d <= days; d++) {
    const wk = weekOfDay(d);
    if (!ranges[wk]) ranges[wk] = { s: d, e: d };
    else ranges[wk].e = d;
  }
  let r1 = '<tr class="week-header-row"><th style="min-width:90px"></th><th style="min-width:130px"></th>';
  for (let d = 1; d <= days; d++) {
    const wk = weekOfDay(d);
    if (ranges[wk] && ranges[wk].s === d) {
      const span = ranges[wk].e - ranges[wk].s + 1;
      r1 += `<th class="wh${wk+1}" colspan="${span}">week ${wk+1}</th>`;
    }
  }
  r1 += '</tr>';
  let r2 = '<tr class="day-hdr-row"><th style="background:var(--blue-box);font-size:9px;letter-spacing:1px">TIMING</th><th style="background:var(--blue-box);text-align:left;padding-left:8px;font-size:9px;letter-spacing:1px">HABIT NAME</th>';
  for (let d = 1; d <= days; d++) {
    const wk = weekOfDay(d);
    const abbr = WEEKDAYS_ABBR[getDayOfWeek(m, d)];
    const isToday = (TODAY_Y === 2026 && TODAY_M === m && TODAY_D === d);
    if (isToday) {
      r2 += `<th class="dh${wk+1}" style="background:${TODAY_BG};color:${TODAY_TEXT};border-radius:6px 6px 0 0;font-weight:700;position:relative;padding:4px 2px;">${abbr}<br><span style="font-size:11px;font-weight:800">${d}</span><div style="position:absolute;bottom:-2px;left:0;right:0;height:2px;background:${TODAY_RING};"></div></th>`;
    } else {
      r2 += `<th class="dh${wk+1}">${abbr}<br><span style="font-size:9px;font-weight:400">${d}</span></th>`;
    }
  }
  r2 += '</tr>';
  return r1 + r2;
}

function buildCheckAllRow(m, days) {
  const cellClass = ['day-cell-w1','day-cell-w2','day-cell-w3','day-cell-w4','day-cell-w5'];
  let html = '<tr class="check-all-row">';
  html += '<td class="timing-cell"><span class="check-all-label">✦ CHECK ALL</span></td>';
  html += '<td class="habit-name-cell" style="font-size:9px;color:var(--text-light);padding-left:6px;">tap a day →</td>';
  for (let d = 1; d <= days; d++) {
    const wk = weekOfDay(d);
    const isToday = (TODAY_Y === 2026 && TODAY_M === m && TODAY_D === d);
    const todayStyle = isToday ? `background:${TODAY_BG};border-left:2px solid ${TODAY_RING};border-right:2px solid ${TODAY_RING};` : '';
    html += `<td class="${cellClass[wk]} check-all-cell" style="${todayStyle}">
      <button class="check-all-btn" data-m="${m}" data-d="${d}">✓</button>
    </td>`;
  }
  html += '</tr>';
  return html;
}

function buildHabitRows(m, days) {
  const cbClass = ['cb-w1','cb-w2','cb-w3','cb-w4','cb-w5'];
  const cellClass = ['day-cell-w1','day-cell-w2','day-cell-w3','day-cell-w4','day-cell-w5'];
  let html = '';
  for (let h = 0; h < TOTAL_HABITS; h++) {
    const defaultName = h < 14 ? DEFAULT_HABITS[h] : SPECIAL_HABITS[h - 14];
    const hname = loadData(`h_${m}_name_${h}`, defaultName);
    const tc = TIMING_COLORS[h];
    const isLastRow = (h === TOTAL_HABITS - 1);
    const isFirstSpecial = (h === 14);
    if (isFirstSpecial) {
      html += `<tr><td colspan="999" style="background:#e8f8e8;padding:2px 8px;font-size:9px;font-weight:700;letter-spacing:1.5px;color:#1a7a3a;">✦ DAILY GOALS</td></tr>`;
    }
    const isWater = (h === 14);
    const isDiet  = (h === 15);
    const wval = isWater ? loadData(`h_${m}_water_0`, 0) : 0; // just for reference, not used here
    html += `<tr>
      <td class="timing-cell"><span class="timing-badge" style="background:${tc.bg};color:${tc.color}">${TIMINGS[h]}</span></td>
      <td class="habit-name-cell" style="${isWater||isDiet?'display:flex;align-items:center;gap:6px;flex-wrap:wrap;':''}"">
        <input class="habit-name-input" data-m="${m}" data-h="${h}" value="${escHtml(hname)}" placeholder="Add habit…" style="flex:1;min-width:80px;">
        ${isWater ? `<span class="cdh-pill-group tbl-inline-pills">${[1,2,3].map(v=>`<span class="cdh-pill water-pill" data-v="${v}" data-m="${m}" data-d="ALL" style="font-size:9px;padding:2px 5px;">${v}L</span>`).join('')}</span>` : ''}
        ${isDiet  ? `<span class="cdh-pill-group tbl-inline-pills">${[1,2,3].map(v=>`<span class="cdh-pill diet-pill"  data-v="${v}" data-m="${m}" data-d="ALL" style="font-size:9px;padding:2px 5px;">${v}</span>`).join('')}</span>` : ''}
      </td>`;
    for (let d = 1; d <= days; d++) {
      const wk = weekOfDay(d);
      const isToday = (TODAY_Y === 2026 && TODAY_M === m && TODAY_D === d);
      let todayStyle = '';
      if (isToday) {
        const bb = isLastRow ? `border-bottom:2px solid ${TODAY_RING};border-radius:0 0 3px 3px;` : '';
        todayStyle = ` style="background:${TODAY_BG}33;border-left:2px solid ${TODAY_RING};border-right:2px solid ${TODAY_RING};${bb}"`;
      }

      if (h === 14) {
        // 💧 Water — result box (filled when selected)
        const wval = loadData(`h_${m}_water_${d}`, 0);
        html += `<td class="${cellClass[wk]}"${todayStyle}>
          <div class="tbl-result-box water-result${wval?' tbl-res-filled':''}" id="wRes-${m}-${d}">${wval ? wval+'L' : ''}</div>
        </td>`;

      } else if (h === 15) {
        // 🥦 Diet — result box (filled when selected)
        const dval = loadData(`h_${m}_diet_${d}`, 0);
        html += `<td class="${cellClass[wk]}"${todayStyle}>
          <div class="tbl-result-box diet-result${dval?' tbl-res-filled':''}" id="dRes-${m}-${d}">${dval ? dval : ''}</div>
        </td>`;
      } else {
        const checked = loadData(`h_${m}_day_${h}_${d}`, false);
        html += `<td class="${cellClass[wk]}"${todayStyle}><input type="checkbox" class="day-cb ${cbClass[wk]}" data-m="${m}" data-h="${h}" data-d="${d}" ${checked ? 'checked' : ''}></td>`;
      }
    }
    html += '</tr>';
  }
  return html;
}
// ════════════════════════════════════════════════════════════
//  CALENDAR BUILDER
// ════════════════════════════════════════════════════════════

function buildCalendar(m) {
  const days = MONTH_DAYS[m];
  const mn = MONTHS[m];
  // First day of month DOW
  const firstDow = getDayOfWeek(m, 1);

  // Build day cells
  let cells = '';
  // Empty cells before first day
  for (let i = 0; i < firstDow; i++) {
    cells += `<div class="cal-day empty"></div>`;
  }
  for (let d = 1; d <= days; d++) {
    const isToday = (TODAY_Y === 2026 && TODAY_M === m && TODAY_D === d);
    const wk = weekOfDay(d);
    // Completion data
    let done = 0;
    for (let h = 0; h < TOTAL_HABITS; h++) {
      if (h === 14) { done += loadData(`h_${m}_water_${d}`, 0) / 3; }
      else if (h === 15) { done += loadData(`h_${m}_diet_${d}`, 0) / 3; }
      else { if (loadData(`h_${m}_day_${h}_${d}`, false)) done++; }
    }
    const pct = done / TOTAL_HABITS;
    let cls = 'cal-day';
    if (isToday) cls += ' today';
    else if (pct >= 1) cls += ' done-full';
    else if (pct >= 0.5) cls += ' done-partial';
    else if (pct > 0) cls += ' has-data';
    const heat = (!isToday && done > 0) ? `<div class="cal-heat" style="opacity:${0.3 + pct*0.7};background:${WEEK_COLORS[wk]}"></div>` : '';
    const pctLabel = (!isToday && done > 0) ? `<div class="cal-day-pct-mini">${Math.round(pct*100)}%</div>` : '';
    cells += `<div class="${cls}" data-m="${m}" data-d="${d}" title="${d} ${mn}: ${done}/${TOTAL_HABITS} habits">${d}${heat}${pctLabel}</div>`;
  }

  return `
  <div class="mini-calendar-wrap" id="cal-${m}">
    <div class="cal-header">
      <div class="cal-month-name">${mn}</div>
      <div class="cal-year">HABIT TRACKER 2026</div>
      <div class="cal-progress-bar"><div class="cal-progress-fill" id="calFill-${m}" style="width:0%"></div></div>
      <div class="cal-progress-label" id="calPctLabel-${m}">0% month complete</div>
    </div>
    <div class="cal-grid-wrap">
      <div class="cal-weekdays">
        ${['S','M','T','W','T','F','S'].map(d=>`<div class="cal-wd">${d}</div>`).join('')}
      </div>
      <div class="cal-days-grid" id="calGrid-${m}">${cells}</div>
    </div>
    <div class="cal-legend">
      <div class="cal-legend-item"><div class="cal-legend-dot" style="background:#f5c842;box-shadow:0 0 0 1px #e8a800"></div>Today</div>
      <div class="cal-legend-item"><div class="cal-legend-dot" style="background:var(--w1)"></div>Full day</div>
      <div class="cal-legend-item"><div class="cal-legend-dot" style="background:var(--w1l)"></div>Partial</div>
      <div class="cal-legend-item"><div class="cal-legend-dot" style="background:#eee"></div>None</div>
    </div>
    <div class="cal-stats-row">
      <div class="cal-stat"><div class="cal-stat-val" id="calStat1-${m}">0</div><div class="cal-stat-key">DONE</div></div>
      <div class="cal-stat"><div class="cal-stat-val" id="calStat2-${m}">0</div><div class="cal-stat-key">STREAK</div></div>
      <div class="cal-stat"><div class="cal-stat-val" id="calStat3-${m}">0%</div><div class="cal-stat-key">AVG/DAY</div></div>
    </div>
  </div>`;
}

function updateCalendar(m) {
  const days = MONTH_DAYS[m];
  const grid = document.getElementById(`calGrid-${m}`);
  if (!grid) return;

  let daysWithAny = 0, totalDone = 0, currentStreak = 0, streakRunning = true;
  // Recalculate from last day backwards for streak
  for (let d = days; d >= 1; d--) {
    let done = 0;
    for (let h = 0; h < TOTAL_HABITS; h++) {
      if (h === 14) { done += loadData(`h_${m}_water_${d}`, 0) / 3; }
      else if (h === 15) { done += loadData(`h_${m}_diet_${d}`, 0) / 3; }
      else { if (loadData(`h_${m}_day_${h}_${d}`, false)) done++; }
    }
    const pct = done / TOTAL_HABITS;
    if (streakRunning && d <= (TODAY_M === m ? TODAY_D : days)) {
      if (pct >= 0.5) currentStreak++;
      else if (d <= (TODAY_M === m ? TODAY_D : days)) streakRunning = false;
    }
  }

  let checkedDays = 0;
  for (let d = 1; d <= days; d++) {
    let done = 0;
    for (let h = 0; h < TOTAL_HABITS; h++) {
      if (h === 14) { done += loadData(`h_${m}_water_${d}`, 0) / 3; }
      else if (h === 15) { done += loadData(`h_${m}_diet_${d}`, 0) / 3; }
      else { if (loadData(`h_${m}_day_${h}_${d}`, false)) done++; }
    }
    totalDone += done;
    if (done > 0) daysWithAny++;
    if (done >= TOTAL_HABITS * 0.5) checkedDays++;

    const isToday = (TODAY_Y === 2026 && TODAY_M === m && TODAY_D === d);
    const cells = grid.querySelectorAll('.cal-day:not(.empty)');
    const cell = cells[d - 1];
    if (!cell) continue;

    const pct = done / TOTAL_HABITS;
    const wk = weekOfDay(d);
    cell.className = 'cal-day';
    if (isToday) cell.classList.add('today');
    else if (pct >= 1) cell.classList.add('done-full');
    else if (pct >= 0.5) cell.classList.add('done-partial');
    else if (pct > 0) cell.classList.add('has-data');

    // update heat dot
    let heat = cell.querySelector('.cal-heat');
    if (!heat && !isToday && done > 0) {
      heat = document.createElement('div');
      heat.className = 'cal-heat';
      cell.appendChild(heat);
    }
    if (heat) {
      if (isToday || done === 0) { heat.remove(); }
      else { heat.style.opacity = 0.3 + pct * 0.7; heat.style.background = WEEK_COLORS[wk]; }
    }
  }

  const relevantDays = (TODAY_M === m && TODAY_Y === 2026) ? TODAY_D : days;
  const monthPct = relevantDays > 0 ? (checkedDays / relevantDays * 100) : 0;
  const fillEl = document.getElementById(`calFill-${m}`);
  const lblEl = document.getElementById(`calPctLabel-${m}`);
  if (fillEl) fillEl.style.width = monthPct.toFixed(1) + '%';
  if (lblEl) lblEl.textContent = monthPct.toFixed(0) + '% month complete';

  const avgPct = daysWithAny > 0 ? Math.round(totalDone / daysWithAny / TOTAL_HABITS * 100) : 0;
  const s1 = document.getElementById(`calStat1-${m}`);
  const s2 = document.getElementById(`calStat2-${m}`);
  const s3 = document.getElementById(`calStat3-${m}`);
  if (s1) s1.textContent = daysWithAny;
  if (s2) s2.textContent = currentStreak + '🔥';
  if (s3) s3.textContent = avgPct + '%';
}

// ════════════════════════════════════════════════════════════
//  VIEW SWITCHER STATE
// ════════════════════════════════════════════════════════════
let viewMode = {}; // m -> 'calendar' | 'table'

function switchView(m, mode) {
  viewMode[m] = mode;
  const calCol = document.getElementById(`calCol-${m}`);
  const calDayPanel = document.getElementById(`calDayPanel-${m}`);
  const tableCol = document.getElementById(`tableCol-${m}`);
  const row2 = document.getElementById(`row2-${m}`);
  const btnCal = document.getElementById(`vbCal-${m}`);
  const btnTbl = document.getElementById(`vbTbl-${m}`);

  if (mode === 'calendar') {
    if (calCol) calCol.style.display = 'block';
    if (calDayPanel) calDayPanel.style.display = 'flex';
    if (tableCol) tableCol.style.display = 'none';
    if (row2) row2.className = 'row2-habits-cal';
    if (btnCal) btnCal.classList.add('active');
    if (btnTbl) btnTbl.classList.remove('active');
    updateCalendar(m);
    // Auto-show today's habits if it's the current month, else show day 1
    const autoDay = (TODAY_Y === 2026 && TODAY_M === m) ? TODAY_D : 1;
    setTimeout(() => buildCalDayPanel(m, autoDay), 50);
  } else {
    if (calCol) calCol.style.display = 'none';
    if (calDayPanel) calDayPanel.style.display = 'none';
    if (tableCol) tableCol.style.display = 'block';
    if (row2) row2.className = 'row2-habits';
    if (btnCal) btnCal.classList.remove('active');
    if (btnTbl) btnTbl.classList.add('active');
  }
}

// ════════════════════════════════════════════════════════════
//  PAGE BUILDER
// ════════════════════════════════════════════════════════════

function buildPage(m) {
  const days = MONTH_DAYS[m];
  const mn = MONTHS[m];
  const affirmText = loadData(`aff_${m}`, '');
  const iamText = loadData(`iam_${m}`, 'Focused, intentional, and ready for the month ahead.');
  const reflText = loadData(`refl_${m}`, '');
  const wkHdrs = buildWeekHeaders(m, days);
  const habRows = buildHabitRows(m, days);
  const calHtml = buildCalendar(m);

  return `
  <div class="page" id="page-${m}">

    <!-- ROW 1: Month/Year title bar -->
    <div class="row1-title">
      <div class="r1-month">
        <h2>${mn}</h2>
        <span class="r1-sub">HABIT TRACKER 2026</span>
      </div>
      <div class="r1-meta">
        <div class="r1-meta-item"><span class="r1-key">MONTH</span><span class="r1-val">${mn}</span></div>
        <div class="r1-meta-item"><span class="r1-key">YEAR</span><span class="r1-val">2026</span></div>
      </div>
      <div class="r1-affirmation">
        <label>✦ AFFIRMATION</label>
        <textarea placeholder="Write your affirmation or quote here…" onchange="saveData('aff_${m}',this.value)">${escHtml(affirmText)}</textarea>
      </div>
      <div class="r1-progress">
        <div class="r1-prog-label">DAILY PROGRESS</div>
        <div class="r1-prog-val" id="dpPct-${m}">0.00%</div>
        <div class="r1-prog-frac" id="dpFrac-${m}">0 / 0</div>
      </div>
    </div>

    <!-- VIEW SWITCHER -->
    <div class="view-switcher">
      <button class="view-btn active" id="vbCal-${m}" onclick="switchView(${m},'calendar')">📅 Calendar</button>
      <button class="view-btn" id="vbTbl-${m}" onclick="switchView(${m},'table')">📋 Table</button>
    </div>

    <!-- ROW 2: Calendar + Daily habits table + progress panel -->
    <div class="row2-habits-cal" id="row2-${m}">
      <!-- Calendar column (shown in calendar mode) -->
      <div id="calCol-${m}">
        ${calHtml}
      </div>
      <!-- Single-day habits panel (calendar mode only) -->
      <div class="cal-day-habits-panel" id="calDayPanel-${m}">
        <div class="cal-day-habits-hdr">
          <span class="cal-day-habits-title" id="calDayTitle-${m}">— SELECT A DAY —</span>
          <button class="cal-check-all-btn" id="calCheckAll-${m}" data-m="${m}" data-d="">✓ ALL</button>
          <span class="cal-day-pct" id="calDayPct-${m}">0%</span>
        </div>
        <div class="cal-day-habits-list" id="calDayList-${m}">
          <div class="cal-day-placeholder">← Tap a day on the calendar</div>
        </div>
      </div>
      <!-- Habits table column (table mode only) -->
      <div class="habits-table-wrap" id="tableCol-${m}">
        <div class="habits-section-hdr">DAILY HABITS <span class="pct-mini" id="dHdrPct-${m}">0 / 0 completed</span></div>
        <div style="overflow-x:auto">
          <table class="habits-table">
            <thead>${wkHdrs}</thead>
            <tbody>${buildCheckAllRow(m,days)}${habRows}</tbody>
          </table>
        </div>
      </div>
      <!-- Daily progress panel -->
      <div class="daily-progress-panel">
        <div class="dp-hdr">DAILY PROGRESS</div>
        
        <div class="dp-col-hdrs"><span>goal</span><span>%</span><span>count</span><span>streak</span></div>
        <div id="dpRows-${m}">
          ${Array.from({length:TOTAL_HABITS},(_,h)=>{
            if (h === 14) return `
            <div class="dp-specials-pair">
              <div class="dp-bottle-wrap">
                <div class="dp-bottle-label" style="color:#0077aa;">💧 Water</div>
                <svg viewBox="0 0 120 240" width="70" height="140" xmlns="http://www.w3.org/2000/svg">
                  <!-- Bottle body background (empty state) -->
                  <path d="M34 28 Q34 22 44 22 L76 22 Q86 22 86 28 L90 38 Q96 48 96 60 L96 230 L24 230 L24 60 Q24 48 30 38 Z" fill="#eaf7ff"/>
                  <!-- FILL: same path, scaleY from bottom via JS transform — no clipPath needed -->
                  <path id="dpBar-${m}-14"
                    d="M34 28 Q34 22 44 22 L76 22 Q86 22 86 28 L90 38 Q96 48 96 60 L96 230 L24 230 L24 60 Q24 48 30 38 Z"
                    fill="#5ac8fa" transform="translate(0,230) scale(1,0) translate(0,-230)"/>
                   <!-- Bottle outline on top -->
                  <path d="M34 28 Q34 22 44 22 L76 22 Q86 22 86 28 L90 38 Q96 48 96 60 L96 230 L24 230 L24 60 Q24 48 30 38 Z" fill="none" stroke="#6a7580" stroke-width="2.5"/>
                  <!-- Cap -->
                  <rect x="43" y="5" width="34" height="18" rx="7" fill="none" stroke="#101619" stroke-width="2"/>
                  <rect x="47" y="9" width="26" height="10" rx="4" fill="#656565"/>
                  <!-- Tick marks -->
                  <line x1="82" y1="90"  x2="90" y2="90"  stroke="rgba(90,200,250,0.6)" stroke-width="1.5"/>
                  <line x1="85" y1="120" x2="90" y2="120" stroke="rgba(90,200,250,0.6)" stroke-width="1.5"/>
                  <line x1="82" y1="150" x2="90" y2="150" stroke="rgba(90,200,250,0.6)" stroke-width="1.5"/>
                  <line x1="85" y1="180" x2="90" y2="180" stroke="rgba(90,200,250,0.6)" stroke-width="1.5"/>
                  <!-- Shine -->
                  <rect x="32" y="45" width="6" height="80" rx="3" fill="white" opacity="0."/>
                </svg>
                <div class="dp-bottle-count" style="color:#0077aa;" id="dpCount-${m}-14">0/${days*3}L</div>
                <div class="dp-bottle-streak" id="dpStreak-${m}-14">streak: 0</div>
              </div>
              <div class="dp-bottle-wrap">
                <div class="dp-bottle-label" style="color:#1a7a3a;">🥦 Diet</div>
                <svg viewBox="0 0 120 120" width="100" height="100" xmlns="http://www.w3.org/2000/svg">
                  <!-- Background ring -->
                  <circle cx="60" cy="60" r="46" fill="none" stroke="#d0f0d8" stroke-width="12"/>
                  <!-- Progress ring — stroke-dashoffset controlled by JS -->
                  <circle id="dpBar-${m}-15" cx="60" cy="60" r="46"
                    fill="none" stroke="#3aa862" stroke-width="12"
                    stroke-linecap="round"
                    stroke-dasharray="289"
                    stroke-dashoffset="289"
                    transform="rotate(-90 60 60)"/>
                  <!-- Center icon -->
                  <text x="60" y="52" text-anchor="middle" font-size="26" font-family="sans-serif">🥦</text>
                  <!-- Center percent text -->
                  <text id="dpBarPct-${m}-15" x="60" y="76" text-anchor="middle" font-size="13" font-weight="700" fill="#1a7a3a" font-family="DM Sans, sans-serif">0%</text>
                </svg>
                <div class="dp-bottle-count" style="color:#1a7a3a;" id="dpCount-${m}-15">0/${days*3}</div>
                <div class="dp-bottle-streak" id="dpStreak-${m}-15">streak: 0</div>
              </div>
            </div>`;
            if (h === 15) return '';
            return `
            <div class="dp-row" id="dpRow-${m}-${h}">
              <input class="dp-goal-input" value="${days}" data-m="${m}" data-h="${h}" onchange="updateStats(${m})">
              <div style="position:relative;height:6px;background:#e8e8e8;border-radius:4px;overflow:hidden;flex:1;">
                <div id="dpBar-${m}-${h}" style="width:0%;height:100%;background:linear-gradient(90deg,var(--w1),#7ab0d0);border-radius:4px;transition:width .4s;"></div>
              </div>
              <div class="dp-count" id="dpCount-${m}-${h}">0/${days}</div>
              <div class="dp-streak" id="dpStreak-${m}-${h}">0</div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>

    <!-- ROW 3: Week circles | Bar chart | Top 10 -->
    <div class="row3-stats">
      <div class="r3-weeks">
        ${[0,1,2,3,4].map(wk=>`
        <div class="week-circle-card wc${wk+1}">
          <div class="wlabel">W${wk+1}</div>
          <div class="circle-wrap">
            <svg width="64" height="64" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="#eee" stroke-width="7"/>
              <circle cx="40" cy="40" r="34" fill="none" stroke="${WEEK_COLORS[wk]}" stroke-width="7"
                stroke-linecap="round" stroke-dasharray="213.6" stroke-dashoffset="213.6"
                id="wcArc-${m}-${wk}" style="transition:stroke-dashoffset .6s"/>
            </svg>
            <div class="pct-text" id="wcPct-${m}-${wk}">0%</div>
          </div>
        </div>`).join('')}
      </div>
      <div class="r3-chart">
        <div class="chart-panel"><canvas id="barChart-${m}"></canvas></div>
      </div>
      <div class="r3-top10">
        <div class="top10-box">
          <div class="hdr"><span>TOP 10 HABITS</span><span>progress</span></div>
          <div id="top10-${m}">
            ${Array.from({length:10},(_,i)=>`<div class="top10-row"><span class="num">${i+1}</span><span class="name" id="t10n-${m}-${i}">—</span><span class="pct" id="t10p-${m}-${i}">—</span></div>`).join('')}
          </div>
          <div class="top10-footer" id="top10Footer-${m}">Over 100% on 0 habits — keep going! 🚀</div>
        </div>
      </div>
    </div>

    <!-- MONTHLY REFLECTION -->
    <div class="reflection-section">
      <div class="section-title">📝 MONTHLY REFLECTION</div>
      <textarea placeholder="This month, I felt…&#10;&#10;I'm proud of…&#10;&#10;Next month I want to…" onchange="saveData('refl_${m}',this.value)">${escHtml(reflText)}</textarea>
    </div>

  </div>`;
}
// ════════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════════

async function init() {
  await loadFromCloud();
  const pagesEl = document.getElementById('pages');
  const tabsEl  = document.getElementById('monthTabs');
  MONTHS.forEach((mn, m) => {
    pagesEl.insertAdjacentHTML('beforeend', buildPage(m));
    const tab = document.createElement('button');
    tab.className = 'month-tab' + (m === 0 ? ' active' : '');
    tab.textContent = mn.slice(0, 3);
    tab.onclick = () => switchMonth(m);
    tabsEl.appendChild(tab);
  });
  const startMonth = (TODAY_Y === 2026) ? TODAY_M : 0;
  switchMonth(startMonth);
}

function switchMonth(m) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.month-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(`page-${m}`).classList.add('active');
  document.getElementById('monthTabs').children[m].classList.add('active');
  // Default to calendar view if not yet set
  if (!viewMode[m]) {
    viewMode[m] = 'calendar';
    // calendar is already shown by default from HTML, just update it
  }
  switchView(m, viewMode[m]);
  updateStats(m);
  buildCharts(m);
}

// ════════════════════════════════════════════════════════════
//  STATS & CHARTS
// ════════════════════════════════════════════════════════════

// ── Bottle/bowl fill animation ──
// Uses scaleY transform anchored at bottom — NO clipPath needed at all.
// anchor = bottom y coord of the shape in its viewBox (230 for bottle, 100 for bowl)
function animateBottle(el, targetPct, anchor) {
  anchor = anchor || 230;
  const startScale = parseFloat(el.dataset.scale || '0');
  const endScale   = Math.min(1, Math.max(0, targetPct));
  el.dataset.scale = endScale;
  const duration = 900;
  const start = performance.now();
  function ease(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }
  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    const e = ease(t);
    const s = startScale + (endScale - startScale) * e;
    el.setAttribute('transform', 'translate(0,' + anchor + ') scale(1,' + s.toFixed(4) + ') translate(0,' + (-anchor) + ')');
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function updateStats(m) {
  const days = MONTH_DAYS[m];
  let totalDone = 0, totalPoss = 0;
  const counts = [], names = [];
  for (let h = 0; h < TOTAL_HABITS; h++) {
    const name = document.querySelector(`.habit-name-input[data-m="${m}"][data-h="${h}"]`)?.value || '';
    names.push(name);
    let done = 0;
    for (let d = 1; d <= days; d++) {
      const cb = document.querySelector(`.day-cb[data-m="${m}"][data-h="${h}"][data-d="${d}"]`);
      if (cb && cb.checked) done++;
    }
    totalDone += done; totalPoss += days; counts.push(done);
    const pct = done / days;
    const barEl = document.getElementById(`dpBar-${m}-${h}`);
    const cntEl = document.getElementById(`dpCount-${m}-${h}`);
    const strkEl = document.getElementById(`dpStreak-${m}-${h}`);
    if (barEl) barEl.style.width = (pct * 100).toFixed(1) + '%';
    if (cntEl) cntEl.textContent = `${done}/${days}`;
    if (strkEl) strkEl.textContent = done;
  }

  // Water progress bar (max = days × 3L)
  const wDays = MONTH_DAYS[m];
  let wTotal = 0;
  for (let dd = 1; dd <= wDays; dd++) wTotal += loadData(`h_${m}_water_${dd}`, 0);
  const wMax = wDays * 3;
  const wBar = document.getElementById(`dpBar-${m}-14`);
  const wCnt = document.getElementById(`dpCount-${m}-14`);
  const wStrk = document.getElementById(`dpStreak-${m}-14`);
  if (wBar) animateBottle(wBar, Math.min(1, wTotal / wMax));
  if (wCnt) wCnt.textContent = `${wTotal} / ${wMax}L`;
  if (wStrk) wStrk.textContent = `streak: ${wTotal}`;

  // Diet progress bar (max = days × 3)
  let dTotal = 0;
  for (let dd = 1; dd <= wDays; dd++) dTotal += loadData(`h_${m}_diet_${dd}`, 0);
  const dMax = wDays * 3;
  const dBar = document.getElementById(`dpBar-${m}-15`);
  const dCnt = document.getElementById(`dpCount-${m}-15`);
  const dStrk = document.getElementById(`dpStreak-${m}-15`);
  if (dBar) {
    const dPct = Math.min(1, dTotal / dMax);
    const circumference = 289;
    const offset = circumference - dPct * circumference;
    dBar.style.transition = 'stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1)';
    dBar.setAttribute('stroke-dashoffset', offset.toFixed(2));
    const pctEl = document.getElementById('dpBarPct-' + m + '-15');
    if (pctEl) pctEl.textContent = Math.round(dPct * 100) + '%';
  }
  if (dCnt) dCnt.textContent = `${dTotal} / ${dMax}`;
  if (dStrk) dStrk.textContent = `streak: ${dTotal}`;

  const pctVal = totalPoss > 0 ? (totalDone / totalPoss * 100).toFixed(2) + '%' : '0.00%';
  const fracVal = `${totalDone} / ${totalPoss}`;
  document.getElementById(`dpPct-${m}`).textContent = pctVal;
  document.getElementById(`dpFrac-${m}`).textContent = fracVal;
  const dpSummaryEl = document.getElementById(`dpSummary-${m}`);
  if (dpSummaryEl) {
    dpSummaryEl.textContent = fracVal + ' completed';
  }
  document.getElementById(`dHdrPct-${m}`).textContent = fracVal + ' completed';
  for (let wk = 0; wk < 5; wk++) {
    let wDone = 0, wPoss = 0;
    for (let d = 1; d <= days; d++) {
      if (weekOfDay(d) !== wk) continue;
      for (let h = 0; h < TOTAL_HABITS; h++) {
        const cb = document.querySelector(`.day-cb[data-m="${m}"][data-h="${h}"][data-d="${d}"]`);
        if (cb) { wPoss++; if (cb.checked) wDone++; }
      }
    }
    const wp = wPoss > 0 ? wDone / wPoss : 0;
    const arc = document.getElementById(`wcArc-${m}-${wk}`);
    const pctEl = document.getElementById(`wcPct-${m}-${wk}`);
    if (arc) arc.setAttribute('stroke-dashoffset', (213.6 * (1 - wp)).toFixed(1));
    if (pctEl) pctEl.textContent = (wp * 100).toFixed(1) + '%';
  }
  const named = counts.map((c,i)=>({c,name:names[i],pct:c/days})).filter(x=>x.name.trim()).sort((a,b)=>b.pct-a.pct).slice(0,10);
  let over100 = 0;
  for (let r = 0; r < 10; r++) {
    const item = named[r];
    const nEl = document.getElementById(`t10n-${m}-${r}`);
    const pEl = document.getElementById(`t10p-${m}-${r}`);
    if (nEl) nEl.textContent = item ? item.name : '—';
    if (pEl) { pEl.textContent = item ? (item.pct*100).toFixed(1)+'%' : '—'; if (item && item.pct > 1) over100++; }
  }
  const foot = document.getElementById(`top10Footer-${m}`);
  if (foot) foot.textContent = `Over 100% on ${over100} habits — keep going! 🚀`;
  buildCharts(m);
  updateCalendar(m);
  // Refresh cal day panel if a day is selected
  const selectedDay = document.querySelector(`#calGrid-${m} .cal-day-selected`);
  if (selectedDay && selectedDay.dataset.d) buildCalDayPanel(m, +selectedDay.dataset.d);
}

function buildCharts(m) {
  const days = MONTH_DAYS[m];
  const barId = `barChart-${m}`;
  const canvas = document.getElementById(barId);
  if (!canvas) return;
  const data = [], colors = [], borderColors = [];
  for (let d = 1; d <= days; d++) {
    let done = 0;
    for (let h = 0; h < TOTAL_HABITS; h++) {
      const cb = document.querySelector(`.day-cb[data-m="${m}"][data-h="${h}"][data-d="${d}"]`);
      if (cb && cb.checked) done++;
    }
    data.push(Math.round(done / TOTAL_HABITS * 100));
    const isToday = (TODAY_Y === 2026 && TODAY_M === m && TODAY_D === d);
    colors.push(isToday ? TODAY_BG : WEEK_COLORS[weekOfDay(d)] + 'cc');
    borderColors.push(isToday ? TODAY_RING : 'transparent');
  }
  if (charts[barId]) charts[barId].destroy();
  charts[barId] = new Chart(canvas, {
    type: 'bar',
    data: { labels: Array.from({length:days},(_,i)=>i+1), datasets: [{ data, backgroundColor: colors, borderColor: borderColors, borderWidth: 1.5, borderRadius: 3, borderSkipped: false }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { font: { size: 8 } } }, y: { display: false, min: 0, max: 100 } } }
  });
}

// ════════════════════════════════════════════════════════════
//  EVENTS
// ════════════════════════════════════════════════════════════

document.addEventListener('change', e => {
  const t = e.target;
  if (t.matches('.day-cb')) {
    const { m, h, d } = t.dataset;
    saveData(`h_${m}_day_${h}_${d}`, t.checked);
    updateStats(+m);
    buildCalDayPanel(+m, +d);
  } else if (t.matches('.habit-name-input')) {
    const { m, h } = t.dataset;
    saveData(`h_${m}_name_${h}`, t.value);
    updateStats(+m);
  }
});

// ── Water pill handler ───────────────────────────────────────
document.addEventListener('click', e => {
  const pill = e.target.closest('.water-pill');
  if (!pill) return;
  const {m, v} = pill.dataset;
  const d = pill.dataset.d;
  const mn = +m, vn = +v;

  if (d === 'ALL') {
    // Table inline pill — apply to TODAY only
    const dn = (TODAY_Y === 2026 && TODAY_M === mn) ? TODAY_D : 1;
    const cur = loadData(`h_${mn}_water_${dn}`, 0);
    const newVal = cur === vn ? 0 : vn;
    saveData(`h_${mn}_water_${dn}`, newVal);
    const wRes = document.getElementById(`wRes-${mn}-${dn}`);
    if (wRes) { wRes.textContent = newVal ? newVal+'L' : ''; wRes.classList.toggle('tbl-res-filled', !!newVal); }
    document.querySelectorAll(`.water-pill[data-m="${mn}"][data-d="ALL"]`).forEach(p => {
      p.classList.toggle('wp-sel', +p.dataset.v === newVal);
    });
  } else {
    const dn = +d;
    const cur = loadData(`h_${mn}_water_${dn}`, 0);
    const newVal = cur === vn ? 0 : vn;
    saveData(`h_${mn}_water_${dn}`, newVal);
    const wRes = document.getElementById(`wRes-${mn}-${dn}`);
    if (wRes) { wRes.textContent = newVal ? newVal+'L' : ''; wRes.classList.toggle('tbl-res-filled', !!newVal); }
    const badge = document.getElementById(`wBadge-${mn}-${dn}`);
    if (badge) badge.textContent = newVal ? newVal+'L' : '';
    document.querySelectorAll(`.water-pill[data-m="${mn}"][data-d="${dn}"]`).forEach(p => {
      p.classList.toggle('wp-sel', +p.dataset.v === newVal);
    });
  }
  showToast(); updateStats(mn);
  const _wDayRefresh = (d === 'ALL') ? ((TODAY_Y === 2026 && TODAY_M === mn) ? TODAY_D : 1) : +d;
  buildCalDayPanel(mn, _wDayRefresh);
});
document.addEventListener('click', e => {
  const pill = e.target.closest('.diet-pill');
  if (!pill) return;
  const {m, v} = pill.dataset;
  const d = pill.dataset.d;
  const mn = +m, vn = +v;

  if (d === 'ALL') {
    // Table inline pill — apply to TODAY only
    const dn = (TODAY_Y === 2026 && TODAY_M === mn) ? TODAY_D : 1;
    const cur = loadData(`h_${mn}_diet_${dn}`, 0);
    const newVal = cur === vn ? 0 : vn;
    saveData(`h_${mn}_diet_${dn}`, newVal);
    const dRes = document.getElementById(`dRes-${mn}-${dn}`);
    if (dRes) { dRes.textContent = newVal ? newVal : ''; dRes.classList.toggle('tbl-res-filled', !!newVal); }
    document.querySelectorAll(`.diet-pill[data-m="${mn}"][data-d="ALL"]`).forEach(p => {
      p.classList.toggle('dp-sel', +p.dataset.v === newVal);
    });
  } else {
    const dn = +d;
    const cur = loadData(`h_${mn}_diet_${dn}`, 0);
    const newVal = cur === vn ? 0 : vn;
    saveData(`h_${mn}_diet_${dn}`, newVal);
    const dRes = document.getElementById(`dRes-${mn}-${dn}`);
    if (dRes) { dRes.textContent = newVal ? newVal : ''; dRes.classList.toggle('tbl-res-filled', !!newVal); }
    const dbadge = document.getElementById(`dBadge-${mn}-${dn}`);
    if (dbadge) dbadge.textContent = newVal ? newVal : '';
    document.querySelectorAll(`.diet-pill[data-m="${mn}"][data-d="${dn}"]`).forEach(p => {
      p.classList.toggle('dp-sel', +p.dataset.v === newVal);
    });
  }
  showToast(); updateStats(mn);
  const _dDayRefresh = (d === 'ALL') ? ((TODAY_Y === 2026 && TODAY_M === mn) ? TODAY_D : 1) : +d;
  buildCalDayPanel(mn, _dDayRefresh);
});

// ── Diet arc drag handler ────────────────────────────────────
(function() {
  let dragging = null;
  function getAngle(wrap, x, y) {
    const rect = wrap.getBoundingClientRect();
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    let angle = Math.atan2(y - cy, x - cx) * 180 / Math.PI + 90;
    if (angle < 0) angle += 360;
    return angle;
  }
  function applyDiet(wrap, pct) {
    const m = wrap.dataset.m, d = wrap.dataset.d;
    const arc = wrap.querySelector('.diet-arc');
    const lbl = document.getElementById(`dietLbl-${m}-${d}`);
    const r = 9, circ = 2 * Math.PI * r;
    if (arc) arc.setAttribute('stroke-dashoffset', (circ - (pct/100)*circ).toFixed(2));
    if (lbl) lbl.textContent = pct > 0 ? pct + '%' : '';
    saveData(`h_${m}_diet_${d}`, pct);
  }
  document.addEventListener('pointerdown', e => {
    const wrap = e.target.closest('.diet-arc-wrap');
    if (!wrap) return;
    dragging = wrap;
    wrap.setPointerCapture(e.pointerId);
    applyDiet(wrap, Math.min(100, Math.max(0, Math.round(getAngle(wrap, e.clientX, e.clientY) / 360 * 100))));
  });
  document.addEventListener('pointermove', e => {
    if (!dragging) return;
    applyDiet(dragging, Math.min(100, Math.max(0, Math.round(getAngle(dragging, e.clientX, e.clientY) / 360 * 100))));
  });
  document.addEventListener('pointerup', () => { dragging = null; });
})();

// ── Check-all click handler ───────────────────────────────────
document.addEventListener('click', e => {
  const btn = e.target.closest('.check-all-btn');
  if (!btn) return;
  const m = +btn.dataset.m;
  const d = +btn.dataset.d;
  const allCbs = [];
  for (let h = 0; h < TOTAL_HABITS; h++) {
    const cb = document.querySelector(`.day-cb[data-m="${m}"][data-h="${h}"][data-d="${d}"]`);
    if (cb) allCbs.push(cb);
  }
  const allChecked = allCbs.every(cb => cb.checked);
  allCbs.forEach(cb => {
    cb.checked = !allChecked;
    saveData(`h_${m}_day_${cb.dataset.h}_${d}`, !allChecked);
  });
  btn.classList.toggle('all-done', !allChecked);
  updateStats(m);
});

// ── Calendar check-all button ─────────────────────────────────
document.addEventListener('click', e => {
  const btn = e.target.closest('.cal-check-all-btn');
  if (!btn || !btn.dataset.d) return;
  const m = +btn.dataset.m;
  const d = +btn.dataset.d;

  // Check if everything is currently done
  let allDone = true;
  for (let h = 0; h < 14; h++) { if (!loadData(`h_${m}_day_${h}_${d}`, false)) { allDone = false; break; } }
  if (loadData(`h_${m}_water_${d}`, 0) !== 3) allDone = false;
  if (loadData(`h_${m}_diet_${d}`, 0) !== 3) allDone = false;

  const newState = !allDone;

  // Set all 14 regular habits
  for (let h = 0; h < 14; h++) {
    saveData(`h_${m}_day_${h}_${d}`, newState);
    const cb = document.querySelector(`.day-cb[data-m="${m}"][data-h="${h}"][data-d="${d}"]`);
    if (cb) cb.checked = newState;
  }

  // Set water and diet to 3 (or 0 if unchecking)
  const specialVal = newState ? 3 : 0;
  saveData(`h_${m}_water_${d}`, specialVal);
  saveData(`h_${m}_diet_${d}`, specialVal);

  btn.classList.toggle('cal-all-done', newState);
  updateStats(m);
  buildCalDayPanel(m, d);
});

// ── Calendar day click → show single-day habits ──────────────
document.addEventListener('click', e => {
  const day = e.target.closest('.cal-day:not(.empty)');
  if (!day) return;
  const m = +day.dataset.m;
  const d = +day.dataset.d;
  if (isNaN(m) || isNaN(d)) return;
  buildCalDayPanel(m, d);
});

function buildCalDayPanel(m, d) {
  const listEl = document.getElementById(`calDayList-${m}`);
  const titleEl = document.getElementById(`calDayTitle-${m}`);
  const pctEl = document.getElementById(`calDayPct-${m}`);
  if (!listEl) return;

  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const dow = getDayOfWeek(m, d);
  titleEl.textContent = `${dayNames[dow]} ${d}`;

  let done = 0;
  let html = '';
  for (let h = 0; h < TOTAL_HABITS; h++) {
    const defaultName = h < 14 ? DEFAULT_HABITS[h] : SPECIAL_HABITS[h - 14];
    const hname = loadData(`h_${m}_name_${h}`, defaultName);
    const tc = TIMING_COLORS[h];
    const timing = TIMINGS[h];
    const isDaily = (h >= 14);

    if (isDaily && h === 14) {
      html += `<div class="cdh-section-label">✦ DAILY GOALS</div>`;
    }

    if (h === 14) {
      const wval = loadData(`h_${m}_water_${d}`, 0);
      done += wval / 3;
      html += `<div class="cdh-row">
        <span class="cdh-sel-badge water-sel-badge" id="wBadge-${m}-${d}">${wval ? wval+'L' : ''}</span>
        <span class="cdh-name">${escHtml(hname)}</span>
        <span class="cdh-timing cdh-pill-group">
          ${[1,2,3].map(v=>`<span class="cdh-pill water-pill${wval===v?' wp-sel':''}" data-v="${v}" data-m="${m}" data-d="${d}">${v}L</span>`).join('')}
        </span>
      </div>`;
    } else if (h === 15) {
      const dval = loadData(`h_${m}_diet_${d}`, 0);
      done += dval / 3;
      html += `<div class="cdh-row">
        <span class="cdh-sel-badge diet-sel-badge" id="dBadge-${m}-${d}">${dval ? dval : ''}</span>
        <span class="cdh-name">${escHtml(hname)}</span>
        <span class="cdh-timing cdh-pill-group">
          ${[1,2,3].map(v=>`<span class="cdh-pill diet-pill${dval===v?' dp-sel':''}" data-v="${v}" data-m="${m}" data-d="${d}">${v}</span>`).join('')}
        </span>
      </div>`;
    } else {
      const checked = loadData(`h_${m}_day_${h}_${d}`, false);
      if (checked) done++;
      const wk = weekOfDay(d);
      const cbClass = h >= 14 ? 'cb-w1' : ['cb-w1','cb-w2','cb-w3','cb-w4','cb-w5'][wk];
      html += `<div class="cdh-row">
        <input type="checkbox" class="day-cb ${cbClass} cdh-cb" data-m="${m}" data-h="${h}" data-d="${d}" ${checked ? 'checked' : ''}>
        <span class="cdh-name">${escHtml(hname)}</span>
        <span class="cdh-timing" style="background:${tc.bg};color:${tc.color}">${timing}</span>
      </div>`;
    }
  }
  listEl.innerHTML = html;
  const pct = Math.round(done / TOTAL_HABITS * 100);
  pctEl.textContent = pct + '%';

  // Immediately update the calendar grid cell % label for this day
  const gridCells = document.querySelectorAll(`#calGrid-${m} .cal-day:not(.empty)`);
  const thisCell = gridCells[d - 1];
  if (thisCell) {
    let miniLabel = thisCell.querySelector('.cal-day-pct-mini');
    if (done > 0) {
      if (!miniLabel) {
        miniLabel = document.createElement('div');
        miniLabel.className = 'cal-day-pct-mini';
        thisCell.appendChild(miniLabel);
      }
      miniLabel.textContent = pct + '%';
    } else if (miniLabel) {
      miniLabel.remove();
    }
  }

  // Sync the check-all button for this day
  const calCheckAllBtn = document.getElementById(`calCheckAll-${m}`);
  if (calCheckAllBtn) {
    calCheckAllBtn.dataset.d = d;
    // Figure out if all habits are done for this day
    let allDone = true;
    for (let h = 0; h < 14; h++) { if (!loadData(`h_${m}_day_${h}_${d}`, false)) { allDone = false; break; } }
    if (loadData(`h_${m}_water_${d}`, 0) !== 3) allDone = false;
    if (loadData(`h_${m}_diet_${d}`, 0) !== 3) allDone = false;
    calCheckAllBtn.classList.toggle('cal-all-done', allDone);
  }

  // Highlight the selected day
  document.querySelectorAll(`#calGrid-${m} .cal-day`).forEach(el => el.classList.remove('cal-day-selected'));
  const cells = document.querySelectorAll(`#calGrid-${m} .cal-day:not(.empty)`);
  if (cells[d - 1]) cells[d - 1].classList.add('cal-day-selected');
}

init();