/* =====================================================
   TRACKER.JS — Ramadan To-Do Tracker
   Ramadhan Portal
   ===================================================== */
'use strict';

const STORE_KEY = 'rp_tracker_v2';
const TODAY_KEY = 'rp_tracker_date';

// ─── Data Definitions ─────────────────────────────────
const PRAYERS = [
    { id: 'fajr', label: 'Subuh', icon: '🌅', time: '04:30' },
    { id: 'dhuhr', label: 'Dzuhur', icon: '☀️', time: '12:00' },
    { id: 'asr', label: 'Ashar', icon: '🌤️', time: '15:30' },
    { id: 'maghrib', label: 'Maghrib', icon: '🌇', time: '18:00' },
    { id: 'isha', label: 'Isya', icon: '🌃', time: '19:30' },
    { id: 'tahajud', label: 'Tahajud', icon: '🌙', time: '03:00' },
    { id: 'tarawih', label: 'Tarawih', icon: '📿', time: '20:00' },
];

const QURAN_TARGETS = [1, 2, 3, 5];

// ─── State ────────────────────────────────────────────
let state = {
    prayers: {},       // { fajr: true/false, … }
    fasting: {},       // { 1: true, 2: false, … } 30 days
    quranJuz: 0,       // completed juz today
    quranTarget: 1,    // juz/day target
    notes: '',
    lastDate: '',
};

// ─── Load ─────────────────────────────────────────────
function loadState() {
    const saved = window.RP?.Store.get(STORE_KEY, null);
    if (saved) {
        state = { ...state, ...saved };
    }

    // Reset daily prayers if new day
    const today = new Date().toDateString();
    const lastDate = window.RP?.Store.get(TODAY_KEY, '');
    if (today !== lastDate) {
        state.prayers = {};
        state.quranJuz = 0;
        window.RP?.Store.set(TODAY_KEY, today);
        saveState();
    }

    // Fill missing days in fasting
    for (let i = 1; i <= 30; i++) {
        if (state.fasting[i] === undefined) state.fasting[i] = false;
    }
}

function saveState() {
    window.RP?.Store.set(STORE_KEY, state);
}

// ─── DOM ──────────────────────────────────────────────
const prayerList = document.getElementById('prayer-list');
const fastingGrid = document.getElementById('fasting-grid');
const quranProgress = document.getElementById('quran-progress');
const quranBar = document.getElementById('quran-bar');
const quranCount = document.getElementById('quran-count');
const quranTargetSel = document.getElementById('quran-target');
const overallPct = document.getElementById('overall-pct');
const overallBar = document.getElementById('overall-bar');
const motivationalEl = document.getElementById('motivational-msg');
const notesEl = document.getElementById('tracker-notes');
const fastingCount = document.getElementById('fasting-count');
const totalPrayerEl = document.getElementById('total-prayers-done');
const resetBtn = document.getElementById('btn-reset-tracker');

// ─── Render Prayers ───────────────────────────────────
function renderPrayers() {
    if (!prayerList) return;
    prayerList.innerHTML = PRAYERS.map(p => {
        const checked = state.prayers[p.id] || false;
        return `
      <div class="check-item" onclick="togglePrayer('${p.id}')">
        <input
          type="checkbox"
          id="prayer-${p.id}"
          ${checked ? 'checked' : ''}
          aria-label="${p.label}"
          onchange="togglePrayer('${p.id}')"
          onclick="event.stopPropagation()"
        >
        <label for="prayer-${p.id}" style="display:flex;align-items:center;gap:8px">
          <span>${p.icon}</span>
          <span>${p.label}</span>
          <span style="margin-left:auto;font-size:.75rem;color:var(--clr-text-light)">${p.time}</span>
        </label>
      </div>`;
    }).join('');
}

function togglePrayer(id) {
    state.prayers[id] = !state.prayers[id];
    saveState();
    renderPrayers();
    updateOverall();

    const p = PRAYERS.find(x => x.id === id);
    if (state.prayers[id] && p) {
        window.RP?.showToast(`${p.icon} ${p.label} tercatat!`, 'success');
    }
    updatePrayerStats();
}

window.togglePrayer = togglePrayer;

// ─── Render Fasting Calendar ──────────────────────────
function renderFastingGrid() {
    if (!fastingGrid) return;

    // Determine today's Ramadan day (approximate)
    const todayHijri = window.RP?.gregorianToHijri(new Date());
    let todayRamadan = 0;
    if (todayHijri && todayHijri.month === 9) { // Ramadan is month 9
        todayRamadan = todayHijri.day;
    }

    fastingGrid.innerHTML = '';
    for (let d = 1; d <= 30; d++) {
        const fasted = state.fasting[d] || false;
        const isToday = d === todayRamadan;

        const btn = document.createElement('button');
        btn.className = `fasting-day${fasted ? ' fasted' : ''}${isToday ? ' today-day' : ''}`;
        btn.setAttribute('aria-label', `Hari ${d} ${fasted ? '(puasa)' : '(belum)'}`);
        btn.setAttribute('aria-pressed', fasted);
        btn.innerHTML = `<span class="day-num">${d}</span><span class="day-icon">${fasted ? '✅' : '○'}</span>`;
        btn.addEventListener('click', () => toggleFasting(d));
        fastingGrid.appendChild(btn);
    }
    updateFastingStats();
}

function toggleFasting(day) {
    state.fasting[day] = !state.fasting[day];
    saveState();
    renderFastingGrid();
    updateOverall();
}

// ─── Quran Progress ────────────────────────────────────
function renderQuranProgress() {
    const juz = state.quranJuz;
    const target = state.quranTarget;
    const pct = Math.min(Math.round((juz / target) * 100), 100);

    if (quranCount) quranCount.textContent = `${juz} / ${target} Juz`;
    if (quranBar) quranBar.style.width = pct + '%';
    if (quranProgress) quranProgress.setAttribute('aria-valuenow', pct);
}

function initQuranControls() {
    // Juz +/– buttons
    document.getElementById('quran-plus')?.addEventListener('click', () => {
        if (state.quranJuz < 30) {
            state.quranJuz++;
            saveState();
            renderQuranProgress();
            updateOverall();
        }
    });

    document.getElementById('quran-minus')?.addEventListener('click', () => {
        if (state.quranJuz > 0) {
            state.quranJuz--;
            saveState();
            renderQuranProgress();
            updateOverall();
        }
    });

    // Target select
    quranTargetSel?.addEventListener('change', () => {
        state.quranTarget = parseInt(quranTargetSel.value);
        saveState();
        renderQuranProgress();
        updateOverall();
    });

    if (quranTargetSel) quranTargetSel.value = state.quranTarget;
}

// ─── Overall Completion ───────────────────────────────
function updateOverall() {
    const prayerDone = Object.values(state.prayers).filter(Boolean).length;
    const prayerTotal = PRAYERS.length;
    const prayerPct = (prayerDone / prayerTotal) * 100;

    const fastingDone = Object.values(state.fasting).filter(Boolean).length;
    const fastingPct = (fastingDone / 30) * 100;

    const quranPct = Math.min((state.quranJuz / state.quranTarget) * 100, 100);

    const overall = Math.round((prayerPct + fastingPct + quranPct) / 3);

    if (overallPct) overallPct.textContent = overall + '%';
    if (overallBar) overallBar.style.width = overall + '%';

    updateMotivationalMessage(overall);
}

function updateMotivationalMessage(pct) {
    if (!motivationalEl) return;
    const msgs = [
        { min: 0, max: 20, msg: 'Mulai dengan bismillah — setiap langkah kecil bernilai! 🌱' },
        { min: 20, max: 40, msg: 'Awal yang baik! Terus semangat ibadahmu hari ini. 💪' },
        { min: 40, max: 60, msg: 'Separuh jalan sudah! Jangan berhenti, terus lanjutkan. 🌙' },
        { min: 60, max: 80, msg: 'Mashaa Allah! Ibadahmu hari ini sangat luar biasa! ✨' },
        { min: 80, max: 95, msg: 'Hampir sempurna! Lengkapi ibadahmu hari ini. 🏆' },
        { min: 95, max: 101, msg: 'Alhamdulillah! Hari yang luar biasa sempurna! 🎉' },
    ];
    const found = msgs.find(m => pct >= m.min && pct < m.max);
    if (found) motivationalEl.textContent = found.msg;
}

// ─── Stats Updates ─────────────────────────────────────
function updatePrayerStats() {
    const done = Object.values(state.prayers).filter(Boolean).length;
    if (totalPrayerEl) totalPrayerEl.textContent = `${done} / ${PRAYERS.length}`;
}

function updateFastingStats() {
    const done = Object.values(state.fasting).filter(Boolean).length;
    if (fastingCount) fastingCount.textContent = `${done} / 30 hari`;
}

// ─── Notes ────────────────────────────────────────────
function initNotes() {
    if (!notesEl) return;
    notesEl.value = state.notes || '';
    notesEl.addEventListener('input', () => {
        state.notes = notesEl.value;
        saveState();
    });
}

// ─── Reset ────────────────────────────────────────────
function resetTracker() {
    if (!confirm('Reset semua data tracker? Ini tidak bisa dibatalkan.')) return;
    state = {
        prayers: {},
        fasting: {},
        quranJuz: 0,
        quranTarget: 1,
        notes: '',
        lastDate: '',
    };
    for (let i = 1; i <= 30; i++) state.fasting[i] = false;
    saveState();
    render();
    window.RP?.showToast('Tracker direset.', 'warning');
}

// ─── Full Render ──────────────────────────────────────
function render() {
    renderPrayers();
    renderFastingGrid();
    renderQuranProgress();
    updateOverall();
    updatePrayerStats();
    initNotes();
}

// ─── Boot ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    render();
    initQuranControls();
    resetBtn?.addEventListener('click', resetTracker);
});
