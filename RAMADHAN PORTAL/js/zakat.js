
// ZAKAT.JS — Zakat Calculator (Income & Gold) Ramadhan Portal
  
'use strict';

//  Constants 
// Nisab: 85 grams of gold
// Gold standard: approximate price per gram (IDR)
const DEFAULT_GOLD_PRICE = 1050000; // IDR per gram – user can update
const NISAB_GRAMS = 85;

// Zakat rate
const ZAKAT_INCOME_RATE = 0.025;
const ZAKAT_GOLD_RATE = 0.025;

// State
let state = {
    type: 'income',
    incomeMonth: 0,
    incomeOther: 0,
    goldOwned: 0,
    goldPrice: DEFAULT_GOLD_PRICE,
};

//  DOM 
const typeButtons = document.querySelectorAll('.zakat-type-btn');
const incomeForm = document.getElementById('income-form');
const goldForm = document.getElementById('gold-form');

const incomeMonthEl = document.getElementById('income-month');
const incomeOtherEl = document.getElementById('income-other');
const goldOwnedEl = document.getElementById('gold-owned');
const goldPriceEl = document.getElementById('gold-price');

const resultPanel = document.getElementById('result-panel');
const resultStatus = document.getElementById('result-status');
const resultAmount = document.getElementById('result-amount');
const resultNisab = document.getElementById('result-nisab');
const resultIncome = document.getElementById('result-income');
const resultRate = document.getElementById('result-rate');
const btnCalculate = document.getElementById('btn-calculate');
const btnReset = document.getElementById('btn-reset-calc');

//  Init 
function init() {
    bindTypeButtons();
    bindInputs();
    bindButtons();
    setGoldPrice(DEFAULT_GOLD_PRICE);
    renderType();
}

function bindTypeButtons() {
    typeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            state.type = btn.dataset.type;
            typeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderType();
            clearResult();
        });
    });
}

function renderType() {
    if (state.type === 'income') {
        incomeForm?.removeAttribute('hidden');
        goldForm?.setAttribute('hidden', '');
    } else {
        goldForm?.removeAttribute('hidden');
        incomeForm?.setAttribute('hidden', '');
    }
}

function bindInputs() {
    incomeMonthEl?.addEventListener('input', () => {
        state.incomeMonth = parseFloat(incomeMonthEl.value) || 0;
    });
    incomeOtherEl?.addEventListener('input', () => {
        state.incomeOther = parseFloat(incomeOtherEl.value) || 0;
    });
    goldOwnedEl?.addEventListener('input', () => {
        state.goldOwned = parseFloat(goldOwnedEl.value) || 0;
        updateNisabInfo();
    });
    goldPriceEl?.addEventListener('input', () => {
        state.goldPrice = parseFloat(goldPriceEl.value) || DEFAULT_GOLD_PRICE;
        updateNisabInfo();
    });
}

function bindButtons() {
    btnCalculate?.addEventListener('click', calculate);
    btnReset?.addEventListener('click', resetForm);
}

function setGoldPrice(price) {
    state.goldPrice = price;
    if (goldPriceEl) goldPriceEl.value = price;
}

function updateNisabInfo() {
    const nisabValueEl = document.getElementById('nisab-value-display');
    if (!nisabValueEl) return;
    const nisabIDR = NISAB_GRAMS * state.goldPrice;
    nisabValueEl.textContent = formatIDR(nisabIDR);
}

//  Calculate 
function calculate() {
    if (state.type === 'income') {
        calculateIncome();
    } else {
        calculateGold();
    }
}

function calculateIncome() {
    const totalIncome = state.incomeMonth * 12 + state.incomeOther;
    const nisabIDR = NISAB_GRAMS * state.goldPrice;
    const meetsNisab = totalIncome >= nisabIDR;
    const zakatAmount = meetsNisab ? totalIncome * ZAKAT_INCOME_RATE : 0;

    renderResult({
        meetsNisab,
        totalAsset: totalIncome,
        nisabIDR,
        zakatAmount,
        rate: '2.5%',
        label: 'Penghasilan Tahunan',
        assetLabel: 'Total Penghasilan',
    });
}

function calculateGold() {
    const goldValueIDR = state.goldOwned * state.goldPrice;
    const nisabIDR = NISAB_GRAMS * state.goldPrice;
    const meetsNisab = state.goldOwned >= NISAB_GRAMS;
    const zakatGrams = meetsNisab ? state.goldOwned * ZAKAT_GOLD_RATE : 0;
    const zakatAmount = zakatGrams * state.goldPrice;

    renderResult({
        meetsNisab,
        totalAsset: goldValueIDR,
        nisabIDR,
        zakatAmount,
        rate: `2.5% (${zakatGrams.toFixed(2)} gram)`,
        label: 'Nilai Emas',
        assetLabel: 'Nilai Emas Dimiliki',
        extraInfo: `Emas dimiliki: ${state.goldOwned} gram | Nisab: ${NISAB_GRAMS} gram`,
    });
}

//  Render Result 
function renderResult({ meetsNisab, totalAsset, nisabIDR, zakatAmount, rate, label, assetLabel, extraInfo }) {
    if (!resultPanel) return;

    resultPanel.style.display = 'block';
    resultPanel.className = `result-panel-inner ${meetsNisab ? 'wajib' : 'belum-wajib'}`;

    if (resultStatus) {
        resultStatus.innerHTML = meetsNisab
            ? `<span class="status-badge status-wajib">✅ Wajib Zakat</span>`
            : `<span class="status-badge status-belum">ℹ️ Belum Wajib Zakat</span>`;
    }

    if (resultAmount) {
        resultAmount.textContent = formatIDR(zakatAmount);
    }

    if (resultNisab) {
        resultNisab.textContent = `Nisab: ${formatIDR(nisabIDR)}`;
    }

    if (resultIncome) {
        resultIncome.textContent = `${assetLabel}: ${formatIDR(totalAsset)}`;
    }

    if (resultRate) {
        resultRate.textContent = `Tarif Zakat: ${rate}`;
    }

    const extraEl = document.getElementById('result-extra');
    if (extraEl) extraEl.textContent = extraInfo || '';

    if (!meetsNisab) {
        window.RP?.showToast('Aset belum mencapai nisab. Belum wajib membayar zakat.', 'warning');
    } else {
        window.RP?.showToast(`Zakat yang harus dibayar: ${formatIDR(zakatAmount)}`, 'success');
    }
}

function clearResult() {
    if (resultPanel) resultPanel.style.display = 'none';
}

//  Reset 
function resetForm() {
    state.incomeMonth = 0;
    state.incomeOther = 0;
    state.goldOwned = 0;
    state.goldPrice = DEFAULT_GOLD_PRICE;

    if (incomeMonthEl) incomeMonthEl.value = '';
    if (incomeOtherEl) incomeOtherEl.value = '';
    if (goldOwnedEl) goldOwnedEl.value = '';
    setGoldPrice(DEFAULT_GOLD_PRICE);
    clearResult();
    window.RP?.showToast('Form direset.', 'default');
}

//  Helpers 
function formatIDR(amount) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
}

//  Boot 
document.addEventListener('DOMContentLoaded', init);
