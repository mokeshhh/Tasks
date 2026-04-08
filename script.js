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
    html += `<tr>
      <td class="timing-cell"><span class="timing-badge" style="background:${tc.bg};color:${tc.color}">${TIMINGS[h]}</span></td>
      <td class="habit-name-cell"><input class="habit-name-input" data-m="${m}" data-h="${h}" value="${escHtml(hname)}" placeholder="Add habit…"></td>`;
    for (let d = 1; d <= days; d++) {
      const wk = weekOfDay(d);
      const checked = loadData(`h_${m}_day_${h}_${d}`, false);
      const isToday = (TODAY_Y === 2026 && TODAY_M === m && TODAY_D === d);
      let todayStyle = '';
      if (isToday) {
        const bb = isLastRow ? `border-bottom:2px solid ${TODAY_RING};border-radius:0 0 3px 3px;` : '';
        todayStyle = ` style="background:${TODAY_BG}33;border-left:2px solid ${TODAY_RING};border-right:2px solid ${TODAY_RING};${bb}"`;
      }
      html += `<td class="${cellClass[wk]}"${todayStyle}><input type="checkbox" class="day-cb ${cbClass[wk]}" data-m="${m}" data-h="${h}" data-d="${d}" ${checked ? 'checked' : ''}></td>`;
    }
    html += '</tr>';
  }
  return html;
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

  return `
  <div class="page" id="page-${m}">
    <div class="top-section">
      <div class="left-panel">
        <div class="month-title-box">
          <h2>${mn}</h2><p>HABIT TRACKER</p>
          <div class="month-meta">
            <span>MONTH</span><input value="${mn}" readonly>
            <span>YEAR</span><input value="2026" readonly>
          </div>
        </div>
        <div class="affirmation-box">
          <label>✦ VISUAL AFFIRMATION</label>
          <textarea placeholder="Write your affirmation…" onchange="saveData('aff_${m}',this.value)">${escHtml(affirmText)}</textarea>
          <input class="iam-input" placeholder="I am… focused, intentional, ready." value="${escHtml(iamText)}" onchange="saveData('iam_${m}',this.value)">
        </div>
      </div>
      <div class="chart-panel"><canvas id="barChart-${m}"></canvas></div>
      <div class="right-panel">
        <div class="progress-summary-box">
          <div class="labels"><span>DAILY PROGRESS</span><span>HABITS</span></div>
          <div class="values">
            <span class="big-val" id="dpPct-${m}">0.00%</span>
            <span class="big-val" id="dpFrac-${m}">0 / 0</span>
          </div>
        </div>
        <div class="top10-box">
          <div class="hdr"><span>TOP 10 HABITS</span><span>progress</span></div>
          <div id="top10-${m}">
            ${Array.from({length:10},(_,i)=>`<div class="top10-row"><span class="num">${i+1}</span><span class="name" id="t10n-${m}-${i}">—</span><span class="pct" id="t10p-${m}-${i}">—</span></div>`).join('')}
          </div>
          <div class="top10-footer" id="top10Footer-${m}">Over 100% on 0 habits — keep going! 🚀</div>
        </div>
      </div>
    </div>

    <div class="daily-habits-section">
      <div class="habits-table-wrap">
        <div class="habits-section-hdr">DAILY HABITS <span class="pct-mini" id="dHdrPct-${m}">0 / 0 completed</span></div>
        <div style="overflow-x:auto">
          <table class="habits-table">
            <thead>${wkHdrs}</thead>
            <tbody>${buildCheckAllRow(m,days)}${habRows}</tbody>
          </table>
        </div>
      </div>
      <div class="daily-progress-panel">
        <div class="dp-hdr">DAILY PROGRESS</div>
        <div class="dp-summary" id="dpSummary-${m}">0 / 0 completed</div>
        <div class="dp-col-hdrs"><span>goal</span><span>%</span><span>count</span><span>streak</span></div>
        <div id="dpRows-${m}">
          ${Array.from({length:TOTAL_HABITS},(_,h)=>`
          <div class="dp-row" id="dpRow-${m}-${h}">
            <input class="dp-goal-input" value="${days}" data-m="${m}" data-h="${h}" onchange="updateStats(${m})">
            <div class="dp-bar-wrap"><div class="dp-bar-fill" id="dpBar-${m}-${h}" style="width:0%"></div></div>
            <div class="dp-count" id="dpCount-${m}-${h}">0/${days}</div>
            <div class="dp-streak" id="dpStreak-${m}-${h}">0</div>
          </div>`).join('')}
        </div>
      </div>
    </div>

    <div class="week-circles">
      ${[0,1,2,3,4].map(wk=>`
      <div class="week-circle-card wc${wk+1}">
        <div class="wlabel">week ${wk+1}</div>
        <div class="circle-wrap">
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="#eee" stroke-width="7"/>
            <circle cx="40" cy="40" r="34" fill="none" stroke="${WEEK_COLORS[wk]}" stroke-width="7"
              stroke-linecap="round" stroke-dasharray="213.6" stroke-dashoffset="213.6"
              id="wcArc-${m}-${wk}" style="transition:stroke-dashoffset .6s"/>
          </svg>
          <div class="pct-text" id="wcPct-${m}-${wk}">0%</div>
        </div>
      </div>`).join('')}
    </div>

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
    pagesEl.innerHTML += buildPage(m);
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
  updateStats(m);
  buildCharts(m);
}

// ════════════════════════════════════════════════════════════
//  STATS & CHARTS
// ════════════════════════════════════════════════════════════

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
  const pctVal = totalPoss > 0 ? (totalDone / totalPoss * 100).toFixed(2) + '%' : '0.00%';
  const fracVal = `${totalDone} / ${totalPoss}`;
  document.getElementById(`dpPct-${m}`).textContent = pctVal;
  document.getElementById(`dpFrac-${m}`).textContent = fracVal;
  document.getElementById(`dpSummary-${m}`).textContent = fracVal + ' completed';
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
  } else if (t.matches('.habit-name-input')) {
    const { m, h } = t.dataset;
    saveData(`h_${m}_name_${h}`, t.value);
    updateStats(+m);
  }
});

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

init();