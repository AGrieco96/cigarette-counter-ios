import { STORAGE_KEY, api, loadSession, clearSession } from './api-client.js';

const defaultState = {
  entries: [],
  settings: { packCost: 6, packSize: 20, dailyGoal: 10 },
  meta: { updatedAt: null },
};

const elements = {
  authUser: document.getElementById('auth-user'),
  authStatus: document.getElementById('auth-status'),
  logoutBtn: document.getElementById('logout-btn'),
  syncBtn: document.getElementById('sync-btn'),
  addBtn: document.getElementById('add-cigarette'),
  undoBtn: document.getElementById('undo-cigarette'),
  packCost: document.getElementById('pack-cost'),
  packSize: document.getElementById('pack-size'),
  dailyGoal: document.getElementById('daily-goal'),
  todayCount: document.getElementById('today-count'),
  totalCount: document.getElementById('total-count'),
  avgWeek: document.getElementById('avg-week'),
  totalCost: document.getElementById('total-cost'),
  monthCost: document.getElementById('month-cost'),
  goalDays: document.getElementById('goal-days'),
  recentList: document.getElementById('recent-list'),
};

let session = loadSession();
let state = loadLocalState();
let status = 'Dashboard pronta.';

init();

async function init() {
  if (!session?.accessToken) {
    window.location.href = '/login';
    return;
  }

  const me = await api('/auth/me', { token: session.accessToken });
  if (me.error) {
    clearSession();
    window.location.href = '/login';
    return;
  }

  session.user = me.user;
  bindEvents();
  hydrateInputs();
  await syncFromServerIfNewer();
  render();
}

function bindEvents() {
  elements.logoutBtn.addEventListener('click', logout);
  elements.syncBtn.addEventListener('click', manualSync);

  elements.addBtn.addEventListener('click', async () => {
    state.entries.push(new Date().toISOString());
    persistLocalState();
    await saveServerState();
    render();
  });

  elements.undoBtn.addEventListener('click', async () => {
    state.entries.pop();
    persistLocalState();
    await saveServerState();
    render();
  });

  [elements.packCost, elements.packSize, elements.dailyGoal].forEach((input) => {
    input.addEventListener('change', async () => {
      state.settings = sanitizeSettings({
        packCost: elements.packCost.value,
        packSize: elements.packSize.value,
        dailyGoal: elements.dailyGoal.value,
      });
      persistLocalState();
      await saveServerState();
      render();
    });
  });
}

async function logout() {
  await api('/auth/logout', { method: 'POST', token: session.accessToken });
  clearSession();
  window.location.href = '/login';
}

async function manualSync() {
  await saveServerState();
  await syncFromServerIfNewer();
  status = 'Sincronizzazione completata.';
  render();
}

async function saveServerState() {
  state.meta.updatedAt = new Date().toISOString();
  persistLocalState();

  const result = await api('/state', {
    method: 'PUT',
    token: session.accessToken,
    body: { state },
  });

  if (result.error) {
    status = `Errore salvataggio cloud: ${result.error}`;
  }
}

async function syncFromServerIfNewer() {
  const result = await api('/state', { token: session.accessToken });
  if (result.error) {
    status = `Errore lettura cloud: ${result.error}`;
    return;
  }

  if (!result.state) {
    await saveServerState();
    return;
  }

  const localTs = Date.parse(state?.meta?.updatedAt || '') || 0;
  const remoteTs = Date.parse(result.updatedAt || '') || 0;
  if (remoteTs > localTs) {
    state = sanitizeState(result.state);
    persistLocalState();
    hydrateInputs();
    status = 'Ripristinati dati cloud più recenti.';
  }
}

function render() {
  const entries = state.entries.map((iso) => new Date(iso)).filter((date) => !Number.isNaN(date));
  const now = new Date();
  const todayCount = entries.filter((date) => isSameDay(date, now)).length;
  const totalCount = entries.length;

  const weekCounts = [];
  for (let i = 0; i < 7; i += 1) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    weekCounts.push(entries.filter((date) => isSameDay(date, day)).length);
  }
  const avgWeek = weekCounts.reduce((sum, value) => sum + value, 0) / 7;

  const perCigaretteCost = state.settings.packCost / state.settings.packSize;
  const totalCost = totalCount * perCigaretteCost;

  const thisMonthCount = entries.filter(
    (date) => date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear(),
  ).length;
  const monthCost = thisMonthCount * perCigaretteCost;

  let goalDays = 0;
  for (let i = 0; i < 30; i += 1) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    const dayCount = entries.filter((date) => isSameDay(date, day)).length;
    if (dayCount <= state.settings.dailyGoal) goalDays += 1;
  }

  elements.todayCount.textContent = String(todayCount);
  elements.totalCount.textContent = String(totalCount);
  elements.avgWeek.textContent = avgWeek.toFixed(1);
  elements.totalCost.textContent = euro(totalCost);
  elements.monthCost.textContent = euro(monthCost);
  elements.goalDays.textContent = String(goalDays);
  elements.authUser.textContent = `Utente: ${session.user?.email ?? 'sconosciuto'}`;
  elements.authStatus.textContent = status;

  renderRecentEntries(entries);
}

function renderRecentEntries(entries) {
  elements.recentList.innerHTML = '';
  const latest = [...entries].sort((a, b) => b - a).slice(0, 10);
  if (!latest.length) {
    const li = document.createElement('li');
    li.textContent = 'Nessuna registrazione per ora.';
    elements.recentList.appendChild(li);
    return;
  }

  latest.forEach((date) => {
    const li = document.createElement('li');
    li.textContent = new Intl.DateTimeFormat('it-IT', { dateStyle: 'short', timeStyle: 'short' }).format(date);
    elements.recentList.appendChild(li);
  });
}

function sanitizeSettings(settings) {
  return {
    packCost: Math.max(0, toNumber(settings.packCost, 6)),
    packSize: Math.max(1, Math.round(toNumber(settings.packSize, 20))),
    dailyGoal: Math.max(0, Math.round(toNumber(settings.dailyGoal, 10))),
  };
}

function sanitizeState(raw) {
  return {
    entries: Array.isArray(raw?.entries)
      ? raw.entries.filter((entry) => !Number.isNaN(new Date(entry).getTime()))
      : [],
    settings: sanitizeSettings(raw?.settings ?? {}),
    meta: { updatedAt: raw?.meta?.updatedAt ?? null },
  };
}

function hydrateInputs() {
  elements.packCost.value = state.settings.packCost;
  elements.packSize.value = state.settings.packSize;
  elements.dailyGoal.value = state.settings.dailyGoal;
}

function loadLocalState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? sanitizeState(JSON.parse(raw)) : structuredClone(defaultState);
  } catch {
    return structuredClone(defaultState);
  }
}

function persistLocalState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function toNumber(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function isSameDay(a, b) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

function euro(value) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
}
