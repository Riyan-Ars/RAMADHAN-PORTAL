/* =====================================================
   MAIN.JS — Dark Mode, Navbar, Toast, Shared Utils
   Ramadhan Portal
   ===================================================== */
'use strict';

// Dark Mode 
const THEME_KEY = 'rp_theme';

function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    setTheme(saved || preferred);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    const btn = document.getElementById('dark-toggle');
    if (btn) {
        btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        btn.setAttribute('aria-pressed', theme === 'dark');
    }
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
}

// Navbar
function initNavbar() {
    const navbar = document.querySelector('.navbar');
    const burger = document.querySelector('.hamburger');
    const mobileMenu = document.querySelector('.nav-mobile');

    // Scroll shadow
    window.addEventListener('scroll', () => {
        navbar?.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });

    // Mobile toggle
    burger?.addEventListener('click', () => {
        const open = burger.classList.toggle('open');
        if (mobileMenu) {
            mobileMenu.classList.toggle('open', open);
        }
        burger.setAttribute('aria-expanded', open);
        burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });

    // Close mobile menu on link click
    mobileMenu?.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            burger?.classList.remove('open');
            mobileMenu.classList.remove('open');
        });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (mobileMenu?.classList.contains('open')
            && !mobileMenu.contains(e.target)
            && !burger?.contains(e.target)) {
            burger?.classList.remove('open');
            mobileMenu.classList.remove('open');
        }
    });

    // Active link highlight
    highlightActiveNav();
}

function highlightActiveNav() {
    const page = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link[data-page]').forEach(link => {
        link.classList.toggle('active', link.dataset.page === page);
    });
}

// Toast Notifications
let toastContainer;

function getToastContainer() {
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.setAttribute('role', 'status');
        toastContainer.setAttribute('aria-live', 'polite');
        document.body.appendChild(toastContainer);
    }
    return toastContainer;
}

/**
 * @param {string} message
 * @param {'success'|'warning'|'danger'|'default'} type
 * @param {number} duration ms
 */
function showToast(message, type = 'default', duration = 3500) {
    const container = getToastContainer();
    const icons = {
        success: '✅',
        warning: '⚠️',
        danger: '❌',
        default: '🔔',
    };

    const toast = document.createElement('div');
    toast.className = `toast${type !== 'default' ? ` toast-${type}` : ''}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
    container.appendChild(toast);

    // Auto-remove
    setTimeout(() => {
        toast.classList.add('hiding');
        toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, duration);
}

// Smooth Scroll
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                e.preventDefault();
                const top = target.getBoundingClientRect().top + window.scrollY - (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 68);
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });
}

// Intersection Observer Animations
function initRevealAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// Live Clock 
function initClock() {
    const el = document.getElementById('live-clock');
    if (!el) return;
    const update = () => {
        const now = new Date();
        el.textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };
    update();
    setInterval(update, 1000);
}

// Hijri Date (approx.)
function gregorianToHijri(date) {
    // Simple Hijri conversion (Umm Al-Qura approximation)
    const jd = Math.floor((14 + date.getMonth() + 1) / 12);
    const y = date.getFullYear() + 4800 - jd;
    const m = date.getMonth() + 1 + 12 * jd - 3;
    let jdn = date.getDate() + Math.floor((153 * m + 2) / 5) + 365 * y
        + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    const l = jdn - 1948440 + 10632;
    const n = Math.floor((l - 1) / 10631);
    const ll = l - 10631 * n + 354;
    const j_ = Math.floor((10985 - ll) / 5316) * Math.floor((50 * ll) / 17719)
        + Math.floor(ll / 5670) * Math.floor((43 * ll) / 15238);
    const ii = ll - Math.floor((30 - j_) / 15) * Math.floor((17719 * j_) / 50)
        - Math.floor(j_ / 16) * Math.floor((15238 * j_) / 43) + 29;
    const month = Math.floor((24 * ii) / 709);
    const day = ii - Math.floor((709 * month) / 24);
    const year = 30 * n + j_ - 30;
    return { day, month, year };
}

const HIJRI_MONTHS = [
    'Muharram', 'Safar', 'Rabi\' al-Awwal', 'Rabi\' al-Akhir',
    'Jumada al-Awwal', 'Jumada al-Akhir', 'Rajab', 'Sha\'ban',
    'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
];

function displayHijriDate() {
    const el = document.getElementById('hijri-date');
    if (!el) return;
    const h = gregorianToHijri(new Date());
    el.textContent = `${h.day} ${HIJRI_MONTHS[h.month - 1]} ${h.year} H`;
}

// Motivational Messages
const MOTIVATIONAL = [
    'Semoga ibadahmu di bulan Ramadhan penuh berkah! 🌙',
    'Setiap kebaikan di bulan ini dilipatgandakan pahalanya. ✨',
    'Ramadhan adalah kesempatan emas untuk mendekatkan diri kepada Allah. 🤲',
    'Puasa bukan hanya menahan lapar, tapi juga menahan hawa nafsu. 💪',
    'Jadikan Ramadhan momentum untuk menjadi pribadi yang lebih baik. 🌟',
    'Setiap saat di bulan Ramadhan adalah istimewa. Manfaatkan sebaik-baiknya! 📿',
    'Doa di bulan Ramadhan memiliki kekuatan yang luar biasa. 🙏',
];

function showMotivationalMessage(containerEl) {
    if (!containerEl) return;
    const msg = MOTIVATIONAL[Math.floor(Math.random() * MOTIVATIONAL.length)];
    containerEl.textContent = msg;
}

// Format Time 
function formatTime(timeStr) {
    if (!timeStr) return '--:--';
    const [h, m] = timeStr.split(':');
    const hr = parseInt(h);
    const min = m.substring(0, 2);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    const h12 = hr % 12 || 12;
    return `${h12}:${min} ${ampm}`;
}

// Local Storage Helper
const Store = {
    get(key, fallback = null) {
        try {
            const v = localStorage.getItem(key);
            return v !== null ? JSON.parse(v) : fallback;
        } catch { return fallback; }
    },
    set(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch { }
    },
    remove(key) {
        try { localStorage.removeItem(key); } catch { }
    }
};

// Page Enter Animation
function initPageAnimation() {
    document.querySelector('main')?.classList.add('page-enter');
}

// Init All
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNavbar();
    initSmoothScroll();
    initRevealAnimations();
    initClock();
    displayHijriDate();
    initPageAnimation();

    // Wire dark toggle
    document.getElementById('dark-toggle')?.addEventListener('click', toggleTheme);

    // Reveal motivational message
    showMotivationalMessage(document.getElementById('motivational'));
});

// Export for other scripts
window.RP = { showToast, Store, formatTime, gregorianToHijri, showMotivationalMessage };
