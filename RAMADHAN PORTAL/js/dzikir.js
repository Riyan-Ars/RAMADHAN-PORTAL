
   //DZIKIR.JS — Digital Counter with Local Storage  Ramadhan Portal

'use strict';

const STORE_KEY = 'rp_dzikir';

const DZIKIR_LIST = [
    {
        id: 'subhanallah',
        title: 'Subhanallah',
        arabic: 'سُبْحَانَ اللهِ',
        latin: 'Subḥānallāh',
        meaning: 'Maha Suci Allah',
        defaultTarget: 33,
        color: '#1a6b4a'
    },
    {
        id: 'alhamdulillah',
        title: 'Alhamdulillah',
        arabic: 'الْحَمْدُ للهِ',
        latin: 'Al-ḥamdu lillāh',
        meaning: 'Segala Puji Bagi Allah',
        defaultTarget: 33,
        color: '#c9952a'
    },
    {
        id: 'allahuakbar',
        title: 'Allahu Akbar',
        arabic: 'اَللهُ أَكْبَرُ',
        latin: 'Allāhu Akbar',
        meaning: 'Allah Maha Besar',
        defaultTarget: 34,
        color: '#0284c7'
    },
    {
        id: 'lailahailallah',
        title: 'Laa Ilaaha Illallah',
        arabic: 'لَا إِلَٰهَ إِلَّا اللهُ',
        latin: 'Lā ilāha illallāh',
        meaning: 'Tiada Tuhan selain Allah',
        defaultTarget: 100,
        color: '#7c3aed'
    },
    {
        id: 'istighfar',
        title: 'Istighfar',
        arabic: 'أَسْتَغْفِرُ اللهَ',
        latin: 'Astaghfirullāh',
        meaning: 'Aku Memohon Ampun kepada Allah',
        defaultTarget: 100,
        color: '#dc2626'
    },
];

let state = {
    activeDzikirId: 'subhanallah',
    counts: {},
    targets: {},
};

// LoadState
function loadState() {
    const saved = window.RP?.Store.get(STORE_KEY, null);
    if (saved) {
        state.counts = saved.counts || {};
        state.targets = saved.targets || {};
    }
    // Fill defaults
    DZIKIR_LIST.forEach(d => {
        if (state.counts[d.id] === undefined) state.counts[d.id] = 0;
        if (state.targets[d.id] === undefined) state.targets[d.id] = d.defaultTarget;
    });
}

function saveState() {
    window.RP?.Store.set(STORE_KEY, { counts: state.counts, targets: state.targets });
}

// DOM
const dzikirTabs = document.getElementById('dzikir-tabs');
const countDisplay = document.getElementById('count-display');
const targetDisplay = document.getElementById('target-display');
const btnIncrement = document.getElementById('btn-increment');
const btnReset = document.getElementById('btn-reset');
const targetSelect = document.getElementById('target-select');
const customTarget = document.getElementById('custom-target');
const arabicText = document.getElementById('dzikir-arabic');
const latinText = document.getElementById('dzikir-latin');
const meaningText = document.getElementById('dzikir-meaning');
const progressRing = document.getElementById('progress-ring-circle');
const progressPct = document.getElementById('progress-pct');
const completionMsg = document.getElementById('completion-msg');

// Ring SVG 
const RING_R = 90;
const RING_C = 2 * Math.PI * RING_R;

function updateRing(count, target) {
    if (!progressRing) return;
    const pct = Math.min(count / target, 1);
    progressRing.style.strokeDashoffset = RING_C * (1 - pct);
    if (progressPct) progressPct.textContent = Math.round(pct * 100) + '%';
}

// Render Active Dzikir 
function renderActiveDzikir() {
    const d = DZIKIR_LIST.find(x => x.id === state.activeDzikirId);
    if (!d) return;

    const count = state.counts[d.id];
    const target = state.targets[d.id];

    if (countDisplay) {
        countDisplay.textContent = count.toLocaleString();
    }
    if (targetDisplay) targetDisplay.textContent = target;
    if (arabicText) arabicText.textContent = d.arabic;
    if (latinText) latinText.textContent = d.latin;
    if (meaningText) meaningText.textContent = `"${d.meaning}"`;

    updateRing(count, target);
    updateTargetSelect(d);
    renderCompletionMessage(count, target, d);
    renderDzikirTabs();
}

function updateTargetSelect(d) {
    if (!targetSelect) return;
    const t = state.targets[d.id];
    const presets = [33, 34, 100];
    if (presets.includes(t)) {
        targetSelect.value = t;
        if (customTarget) { customTarget.style.display = 'none'; customTarget.value = ''; }
    } else {
        targetSelect.value = 'custom';
        if (customTarget) { customTarget.style.display = 'block'; customTarget.value = t; }
    }
}

function renderCompletionMessage(count, target, d) {
    if (!completionMsg) return;
    if (count >= target) {
        completionMsg.style.display = 'flex';
        completionMsg.innerHTML = `
      <span style="font-size:2.5rem">🎉</span>
      <div>
        <p style="font-weight:700;color:var(--clr-primary);font-size:1.1rem">Alhamdulillah!</p>
        <p style="font-size:.875rem;color:var(--clr-text-muted)">Kamu telah menyelesaikan ${d.title} sebanyak ${target}×</p>
      </div>`;
    } else {
        completionMsg.style.display = 'none';
    }
}

function renderDzikirTabs() {
    if (!dzikirTabs) return;
    dzikirTabs.innerHTML = DZIKIR_LIST.map(d => `
    <button
      class="dzikir-tab${d.id === state.activeDzikirId ? ' active' : ''}"
      data-id="${d.id}"
      aria-pressed="${d.id === state.activeDzikirId}"
      title="${d.title}"
    >
      <span class="tab-title">${d.title}</span>
      <span class="tab-count">${state.counts[d.id]}/${state.targets[d.id]}</span>
    </button>`).join('');

    dzikirTabs.querySelectorAll('.dzikir-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            state.activeDzikirId = btn.dataset.id;
            renderActiveDzikir();
        });
    });
}

// Increment
function increment() {
    const d = DZIKIR_LIST.find(x => x.id === state.activeDzikirId);
    if (!d) return;
    const target = state.targets[d.id];

    if (state.counts[d.id] >= target) {
        window.RP?.showToast('Dzikir sudah selesai! Klik Reset untuk mulai lagi.', 'warning');
        return;
    }

    state.counts[d.id]++;
    saveState();
    renderActiveDzikir();

    // Bump animation
    if (countDisplay) {
        countDisplay.classList.remove('bump');
        void countDisplay.offsetWidth; // reflow
        countDisplay.classList.add('bump');
    }

    // Haptic feedback
    if ('vibrate' in navigator) navigator.vibrate(30);

    // Completion check
    if (state.counts[d.id] === target) {
        window.RP?.showToast(`Alhamdulillah! ${d.title} selesai ${target}×!`, 'success');
    }
}

// Reset
function resetCounter() {
    const d = DZIKIR_LIST.find(x => x.id === state.activeDzikirId);
    if (!d) return;
    state.counts[d.id] = 0;
    saveState();
    renderActiveDzikir();
    window.RP?.showToast('Counter direset.', 'default');
}

// Target Change
function onTargetChange() {
    const d = DZIKIR_LIST.find(x => x.id === state.activeDzikirId);
    if (!d || !targetSelect) return;

    if (targetSelect.value === 'custom') {
        if (customTarget) customTarget.style.display = 'block';
        return;
    }

    state.targets[d.id] = parseInt(targetSelect.value);
    if (customTarget) customTarget.style.display = 'none';
    saveState();
    renderActiveDzikir();
}

function onCustomTargetChange() {
    const d = DZIKIR_LIST.find(x => x.id === state.activeDzikirId);
    if (!d || !customTarget) return;
    const val = parseInt(customTarget.value);
    if (val > 0) {
        state.targets[d.id] = val;
        saveState();
        renderActiveDzikir();
    }
}

// Keyboard Support
function initKeyboard() {
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
        if (e.code === 'Space' || e.code === 'Enter') {
            e.preventDefault();
            increment();
        }
        if (e.code === 'KeyR') resetCounter();
    });
}

// Total Stats
function renderTotalStats() {
    const totalEl = document.getElementById('total-count');
    if (!totalEl) return;
    const total = Object.values(state.counts).reduce((a, b) => a + b, 0);
    totalEl.textContent = total.toLocaleString();
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    renderActiveDzikir();
    renderTotalStats();
    initKeyboard();

    btnIncrement?.addEventListener('click', increment);
    btnReset?.addEventListener('click', resetCounter);
    targetSelect?.addEventListener('change', onTargetChange);
    customTarget?.addEventListener('input', onCustomTargetChange);
});
