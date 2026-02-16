const STORAGE_KEY = "cigaretteCounterData.v1";

const defaultState = {
  entries: [],
  settings: {
    packCost: 6,
    packSize: 20,
    dailyGoal: 10,
  },
};

const elements = {
  addBtn: document.getElementById("add-cigarette"),
  undoBtn: document.getElementById("undo-cigarette"),
  packCost: document.getElementById("pack-cost"),
  packSize: document.getElementById("pack-size"),
  dailyGoal: document.getElementById("daily-goal"),
  todayCount: document.getElementById("today-count"),
  totalCount: document.getElementById("total-count"),
  avgWeek: document.getElementById("avg-week"),
  totalCost: document.getElementById("total-cost"),
  monthCost: document.getElementById("month-cost"),
  goalDays: document.getElementById("goal-days"),
  recentList: document.getElementById("recent-list"),
};

let state = loadState();

init();

function init() {
  hydrateSettingsInputs();
  bindEvents();
  render();
}

function bindEvents() {
  elements.addBtn.addEventListener("click", () => {
    state.entries.push(new Date().toISOString());
    persist();
    render();
  });

  elements.undoBtn.addEventListener("click", () => {
    state.entries.pop();
    persist();
    render();
  });

  [elements.packCost, elements.packSize, elements.dailyGoal].forEach((input) => {
    input.addEventListener("change", updateSettingsFromInputs);
  });
}

function updateSettingsFromInputs() {
  state.settings.packCost = toNumber(elements.packCost.value, 0);
  state.settings.packSize = Math.max(1, Math.round(toNumber(elements.packSize.value, 20)));
  state.settings.dailyGoal = Math.max(0, Math.round(toNumber(elements.dailyGoal.value, 10)));
  persist();
  render();
}

function hydrateSettingsInputs() {
  elements.packCost.value = state.settings.packCost;
  elements.packSize.value = state.settings.packSize;
  elements.dailyGoal.value = state.settings.dailyGoal;
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
  const avgWeek = weekCounts.reduce((sum, v) => sum + v, 0) / 7;

  const perCigaretteCost = state.settings.packCost / state.settings.packSize;
  const totalCost = totalCount * perCigaretteCost;

  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const thisMonthCount = entries.filter(
    (date) => date.getMonth() === currentMonth && date.getFullYear() === currentYear,
  ).length;
  const monthCost = thisMonthCount * perCigaretteCost;

  let goalDays = 0;
  for (let i = 0; i < 30; i += 1) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    const dayCount = entries.filter((date) => isSameDay(date, day)).length;
    if (dayCount <= state.settings.dailyGoal) {
      goalDays += 1;
    }
  }

  elements.todayCount.textContent = String(todayCount);
  elements.totalCount.textContent = String(totalCount);
  elements.avgWeek.textContent = avgWeek.toFixed(1);
  elements.totalCost.textContent = euro(totalCost);
  elements.monthCost.textContent = euro(monthCost);
  elements.goalDays.textContent = String(goalDays);

  renderRecentEntries(entries);
}

function renderRecentEntries(entries) {
  elements.recentList.innerHTML = "";

  const latest = [...entries].sort((a, b) => b - a).slice(0, 10);
  if (latest.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Nessuna registrazione per ora.";
    elements.recentList.appendChild(li);
    return;
  }

  latest.forEach((date) => {
    const li = document.createElement("li");
    li.textContent = new Intl.DateTimeFormat("it-IT", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(date);
    elements.recentList.appendChild(li);
  });
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultState);

    const parsed = JSON.parse(raw);
    return {
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
      settings: {
        packCost: toNumber(parsed?.settings?.packCost, defaultState.settings.packCost),
        packSize: Math.max(1, Math.round(toNumber(parsed?.settings?.packSize, defaultState.settings.packSize))),
        dailyGoal: Math.max(0, Math.round(toNumber(parsed?.settings?.dailyGoal, defaultState.settings.dailyGoal))),
      },
    };
  } catch {
    return structuredClone(defaultState);
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function toNumber(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function isSameDay(a, b) {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

function euro(value) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}
