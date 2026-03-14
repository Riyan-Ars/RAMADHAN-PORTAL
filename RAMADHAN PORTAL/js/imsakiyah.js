
//IMSAKIYAH.JS — Prayer Times via Aladhan API Ramadhan Portal
   
'use strict';

const API_BASE = 'https://api.aladhan.com/v1';

// Ramadan 2025 approximate dates (used for table range)
const RAMADAN_YEAR = 2025;
const RAMADAN_MONTH = 3; // March 2025

const PRAYER_NAMES = ['Imsak', 'Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const PRAYER_ICONS = ['🌙', '🌅', '☀️', '🌤️', '🌇', '🌃'];
const PRAYER_KEYS = ['Imsak', 'Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

const CITIES = [
    { name: 'Jakarta', lat: -6.2088, lon: 106.8456 },
    { name: 'Bandung', lat: -6.9175, lon: 107.6191 },
    { name: 'Surabaya', lat: -7.2575, lon: 112.7521 },
    { name: 'Yogyakarta', lat: -7.7971, lon: 110.3688 },
    { name: 'Medan', lat: 3.5952, lon: 98.6722 },
    { name: 'Makassar', lat: -5.1477, lon: 119.4327 },
    { name: 'Semarang', lat: -6.9932, lon: 110.4203 },
    { name: 'Palembang', lat: -2.9761, lon: 104.7754 },
    { name: 'Malang', lat: -7.9666, lon: 112.6326 },
    { name: 'Bali', lat: -8.4095, lon: 115.1889 },
    { name: 'Aceh', lat: 4.6951, lon: 96.7494 },
    { name: 'Pontianak', lat: -0.0263, lon: 109.3425 },
    { name: 'Manado', lat: 1.4748, lon: 124.8421 },
    { name: 'Ambon', lat: -3.6954, lon: 128.1814 },
    { name: 'Jayapura', lat: -2.5337, lon: 140.7181 },
];

let monthData = [];
let selectedCity = CITIES[0];

// DOM Refs
const citySelect = document.getElementById('city-select');
const monthSelect = document.getElementById('month-select');
const yearSelect = document.getElementById('year-select');
const fetchBtn = document.getElementById('fetch-btn');
const tableBody = document.getElementById('prayer-table-body');
const tableWrap = document.getElementById('table-wrap');
const skeletonWrap = document.getElementById('skeleton-wrap');
const errorWrap = document.getElementById('error-wrap');
const errorMsg = document.getElementById('error-msg');
const todayCards = document.getElementById('today-cards');

// Init 
function init() {
    populateCitySelect();
    populateDateSelects();
    bindEvents();
    fetchPrayerTimes();
}

function populateCitySelect() {
    CITIES.forEach((city, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = city.name;
        citySelect.appendChild(opt);
    });
}

function populateDateSelects() {
    if (!monthSelect || !yearSelect) return;
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    months.forEach((m, i) => {
        const opt = document.createElement('option');
        opt.value = i + 1;
        opt.textContent = m;
        monthSelect.appendChild(opt);
    });

    const now = new Date();
    monthSelect.value = now.getMonth() + 1;

    // Year options
    for (let y = now.getFullYear(); y <= now.getFullYear() + 2; y++) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        yearSelect.appendChild(opt);
    }
    yearSelect.value = now.getFullYear();
}

function bindEvents() {
    citySelect?.addEventListener('change', () => {
        selectedCity = CITIES[parseInt(citySelect.value)];
    });
    fetchBtn?.addEventListener('click', fetchPrayerTimes);
}

// API Fetch
async function fetchPrayerTimes() {
    const month = monthSelect?.value || (new Date().getMonth() + 1);
    const year = yearSelect?.value || new Date().getFullYear();
    cityIdx = parseInt(citySelect?.value || 0);
    selectedCity = CITIES[cityIdx] || CITIES[0];

    showSkeleton(true);
    showError(false);
    hideTable(true);

    try {
        const url = `${API_BASE}/calendar?latitude=${selectedCity.lat}&longitude=${selectedCity.lon}&method=11&month=${month}&year=${year}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (json.code !== 200) throw new Error(json.status || 'API Error');

        monthData = json.data;
        renderTable(monthData);
        renderTodayCards(monthData);
    } catch (err) {
        showError(true, err.message);
        if (window.RP) window.RP.showToast('Gagal memuat jadwal. Periksa koneksi internet.', 'danger');
    } finally {
        showSkeleton(false);
    }
}

let cityIdx = 0;

// Render Today Cards
function renderTodayCards(data) {
    if (!todayCards) return;
    const today = new Date();
    const todayEntry = data.find(d => {
        const [day] = d.date.gregorian.date.split('-');
        return parseInt(day) === today.getDate();
    }) || data[0];

    if (!todayEntry) return;
    const timings = todayEntry.timings;

    todayCards.innerHTML = PRAYER_KEYS.map((key, i) => {
        const rawTime = timings[key] || '--:--';
        const time = rawTime.split(' ')[0]; // strip timezone
        return `
      <div class="prayer-time-card" id="ptc-${key}">
        <div class="pt-icon">${PRAYER_ICONS[i]}</div>
        <div class="pt-name">${PRAYER_NAMES[i]}</div>
        <div class="pt-time">${time}</div>
      </div>`;
    }).join('');

    // Highlight current prayer
    highlightCurrentPrayer(timings);
}

function highlightCurrentPrayer(timings) {
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();

    let activePrayer = null;
    const times = PRAYER_KEYS.map(key => {
        const [h, m] = (timings[key] || '00:00').split(':').map(Number);
        return { key, min: h * 60 + (m || 0) };
    });

    for (let i = times.length - 1; i >= 0; i--) {
        if (nowMin >= times[i].min) { activePrayer = times[i].key; break; }
    }

    document.querySelectorAll('.prayer-time-card').forEach(c => c.classList.remove('active-prayer'));
    if (activePrayer) document.getElementById(`ptc-${activePrayer}`)?.classList.add('active-prayer');
}

// Render Table 
function renderTable(data) {
    if (!tableBody) return;

    const today = new Date();
    const todayDay = today.getDate();
    const todayM = today.getMonth() + 1;
    const todayY = today.getFullYear();

    const selectedMonth = parseInt(monthSelect?.value || todayM);
    const selectedYear = parseInt(yearSelect?.value || todayY);
    const isCurrentMonth = selectedMonth === todayM && selectedYear === todayY;

    tableBody.innerHTML = data.map(day => {
        const greg = day.date.gregorian;
        const hijri = day.date.hijri;
        const dayNum = parseInt(greg.date.split('-')[0]);
        const isToday = isCurrentMonth && dayNum === todayDay;
        const t = day.timings;

        const fmt = v => (v || '--:--').split(' ')[0];

        return `
      <tr class="${isToday ? 'today' : ''}">
        <td>
          <strong>${dayNum}</strong>
          <span style="display:block;font-size:.7rem;color:var(--clr-text-muted)">${greg.weekday.en}</span>
        </td>
        <td>${hijri.day} ${hijri.month.en}</td>
        <td><strong>${fmt(t.Imsak)}</strong></td>
        <td>${fmt(t.Fajr)}</td>
        <td>${fmt(t.Sunrise)}</td>
        <td>${fmt(t.Dhuhr)}</td>
        <td>${fmt(t.Asr)}</td>
        <td><strong style="color:var(--clr-accent)">${fmt(t.Maghrib)}</strong></td>
        <td>${fmt(t.Isha)}</td>
      </tr>`;
    }).join('');

    hideTable(false);

    // Scroll to today
    if (isCurrentMonth) {
        setTimeout(() => {
            tableWrap?.querySelector('tr.today')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
    }
}

// UI State Helpers 
function showSkeleton(show) {
    if (skeletonWrap) skeletonWrap.style.display = show ? 'block' : 'none';
}

function showError(show, message = '') {
    if (errorWrap) errorWrap.style.display = show ? 'block' : 'none';
    if (errorMsg) errorMsg.textContent = message;
}

function hideTable(hide) {
    if (tableWrap) tableWrap.style.display = hide ? 'none' : 'block';
}

// Boot 
document.addEventListener('DOMContentLoaded', init);
