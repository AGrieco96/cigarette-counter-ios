const STORAGE_KEY = "cigaretteCounterData.v3";
const DB_NAME = "cigaretteCounterDB";
const DB_STORE = "appState";
const DB_RECORD_ID = "state";

const defaultState = {
  entries: [],
  settings: {
    packCost: 6,
    packSize: 20,
    dailyGoal: 10,
  },
  cloud: {
    supabaseUrl: "",
    anonKey: "",
    profileId: "",
  },
  meta: {
    updatedAt: null,
  },
};

const elements = {
  addBtn: document.getElementById("add-cigarette"),
  undoBtn: document.getElementById("undo-cigarette"),
  packCost: document.getElementById("pack-cost"),
  packSize: document.getElementById("pack-size"),
  dailyGoal: document.getElementById("daily-goal"),
  exportBackupBtn: document.getElementById("export-backup"),
  importBackupBtn: document.getElementById("import-backup"),
  backupFileInput: document.getElementById("backup-file"),
  persistenceStatus: document.getElementById("persistence-status"),
  supabaseUrl: document.getElementById("supabase-url"),
  supabaseKey: document.getElementById("supabase-key"),
  profileId: document.getElementById("profile-id"),
  saveCloudBtn: document.getElementById("save-cloud"),
  loadCloudBtn: document.getElementById("load-cloud"),
  cloudStatus: document.getElementById("cloud-status"),
  todayCount: document.getElementById("today-count"),
  totalCount: document.getElementById("total-count"),
  avgWeek: document.getElementById("avg-week"),
  totalCost: document.getElementById("total-cost"),
  monthCost: document.getElementById("month-cost"),
  goalDays: document.getElementById("goal-days"),
  recentList: document.getElementById("recent-list"),
};

let state = structuredClone(defaultState);
let persistenceInfo = "Storage locale attivo.";
let cloudInfo = "Configura Supabase per attivare la sincronizzazione cloud.";

init();

async function init() {
  state = await loadState();
  hydrateInputs();
  bindEvents();
  render();
}

function bindEvents() {
  elements.addBtn.addEventListener("click", async () => {
    state.entries.push(new Date().toISOString());
    await persist();
    render();
  });

  elements.undoBtn.addEventListener("click", async () => {
    state.entries.pop();
    await persist();
    render();
  });

  [elements.packCost, elements.packSize, elements.dailyGoal].forEach((input) => {
    input.addEventListener("change", async () => {
      updateSettingsFromInputs();
      await persist();
      render();
    });
  });

  [elements.supabaseUrl, elements.supabaseKey, elements.profileId].forEach((input) => {
    input.addEventListener("change", async () => {
      updateCloudConfigFromInputs();
      await persist();
      render();
    });
  });

  elements.exportBackupBtn.addEventListener("click", exportBackup);
  elements.importBackupBtn.addEventListener("click", () => elements.backupFileInput.click());
  elements.backupFileInput.addEventListener("change", importBackup);

  elements.saveCloudBtn.addEventListener("click", saveToCloud);
  elements.loadCloudBtn.addEventListener("click", loadFromCloud);
}

function updateSettingsFromInputs() {
  state.settings.packCost = Math.max(0, toNumber(elements.packCost.value, 0));
  state.settings.packSize = Math.max(1, Math.round(toNumber(elements.packSize.value, 20)));
  state.settings.dailyGoal = Math.max(0, Math.round(toNumber(elements.dailyGoal.value, 10)));
}

function updateCloudConfigFromInputs() {
  state.cloud.supabaseUrl = normalizeUrl(elements.supabaseUrl.value);
  state.cloud.anonKey = elements.supabaseKey.value.trim();
  state.cloud.profileId = elements.profileId.value.trim();
  cloudInfo = "Configurazione cloud aggiornata localmente.";
}

function hydrateInputs() {
  elements.packCost.value = state.settings.packCost;
  elements.packSize.value = state.settings.packSize;
  elements.dailyGoal.value = state.settings.dailyGoal;

  elements.supabaseUrl.value = state.cloud.supabaseUrl;
  elements.supabaseKey.value = state.cloud.anonKey;
  elements.profileId.value = state.cloud.profileId;
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

  elements.persistenceStatus.textContent = buildPersistenceStatus();
  elements.cloudStatus.textContent = cloudInfo;

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

async function loadState() {
  const fromIndexedDB = await readFromIndexedDB();
  if (fromIndexedDB) {
    persistenceInfo = "Dati ripristinati da IndexedDB + localStorage.";
    return sanitizeState(fromIndexedDB);
  }

  const fromLocalStorage = readFromLocalStorage();
  if (fromLocalStorage) {
    persistenceInfo = "Dati ripristinati da localStorage.";
    return sanitizeState(fromLocalStorage);
  }

  persistenceInfo = "Nessun dato precedente trovato. Nuovo archivio creato.";
  return structuredClone(defaultState);
}

function readFromLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function persist() {
  state.meta.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  try {
    await writeToIndexedDB(state);
    persistenceInfo = "Salvato su IndexedDB + localStorage.";
  } catch {
    persistenceInfo = "Salvato su localStorage (IndexedDB non disponibile).";
  }
}

function buildPersistenceStatus() {
  const updatedAt = state?.meta?.updatedAt;
  if (!updatedAt) return `${persistenceInfo} Ultimo salvataggio: mai.`;

  return `${persistenceInfo} Ultimo salvataggio: ${new Intl.DateTimeFormat("it-IT", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(updatedAt))}.`;
}

function exportBackup() {
  const payload = {
    exportedAt: new Date().toISOString(),
    app: "cigarette-counter",
    version: 2,
    data: state,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const fileName = `cigarette-backup-${new Date().toISOString().slice(0, 10)}.json`;

  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();

  URL.revokeObjectURL(url);
}

async function importBackup(event) {
  const [file] = event.target.files ?? [];
  if (!file) return;

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const candidate = parsed?.data ?? parsed;
    state = sanitizeState(candidate);
    hydrateInputs();
    await persist();
    cloudInfo = "Backup importato con successo.";
    render();
  } catch {
    cloudInfo = "Backup non valido: impossibile importare il file selezionato.";
    render();
  } finally {
    elements.backupFileInput.value = "";
  }
}

async function saveToCloud() {
  updateCloudConfigFromInputs();
  const config = getCloudConfigOrFail();
  if (!config) {
    render();
    return;
  }

  try {
    await pushStateToSupabase(config, state);
    cloudInfo = "Dati salvati su Supabase con successo.";
  } catch (error) {
    cloudInfo = `Errore salvataggio cloud: ${error.message}`;
  }

  await persist();
  render();
}

async function loadFromCloud() {
  updateCloudConfigFromInputs();
  const config = getCloudConfigOrFail();
  if (!config) {
    render();
    return;
  }

  try {
    const remoteState = await pullStateFromSupabase(config);
    if (!remoteState) {
      cloudInfo = "Nessun dato cloud trovato per questo Profilo ID.";
    } else {
      state = sanitizeState(remoteState);
      hydrateInputs();
      await persist();
      cloudInfo = "Dati caricati da Supabase con successo.";
    }
  } catch (error) {
    cloudInfo = `Errore caricamento cloud: ${error.message}`;
  }

  render();
}

function getCloudConfigOrFail() {
  const supabaseUrl = normalizeUrl(state.cloud.supabaseUrl);
  const anonKey = state.cloud.anonKey.trim();
  const profileId = state.cloud.profileId.trim();

  if (!supabaseUrl || !anonKey || !profileId) {
    cloudInfo = "Compila URL, Anon Key e Profilo ID per usare il backend gratuito.";
    return null;
  }

  return { supabaseUrl, anonKey, profileId };
}

async function pushStateToSupabase(config, payload) {
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/cigarette_backups?on_conflict=profile_id`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify([
        {
          profile_id: config.profileId,
          payload,
          updated_at: new Date().toISOString(),
        },
      ]),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status} ${text}`);
  }
}

async function pullStateFromSupabase(config) {
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/cigarette_backups?profile_id=eq.${encodeURIComponent(config.profileId)}&select=payload&limit=1`,
    {
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
      },
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status} ${text}`);
  }

  const rows = await response.json();
  return rows[0]?.payload ?? null;
}

function sanitizeState(raw) {
  return {
    entries: Array.isArray(raw?.entries)
      ? raw.entries.filter((entry) => !Number.isNaN(new Date(entry).getTime()))
      : [],
    settings: {
      packCost: Math.max(0, toNumber(raw?.settings?.packCost, defaultState.settings.packCost)),
      packSize: Math.max(1, Math.round(toNumber(raw?.settings?.packSize, defaultState.settings.packSize))),
      dailyGoal: Math.max(0, Math.round(toNumber(raw?.settings?.dailyGoal, defaultState.settings.dailyGoal))),
    },
    cloud: {
      supabaseUrl: normalizeUrl(raw?.cloud?.supabaseUrl ?? ""),
      anonKey: typeof raw?.cloud?.anonKey === "string" ? raw.cloud.anonKey : "",
      profileId: typeof raw?.cloud?.profileId === "string" ? raw.cloud.profileId : "",
    },
    meta: {
      updatedAt: raw?.meta?.updatedAt ?? null,
    },
  };
}

function normalizeUrl(value) {
  return String(value ?? "").trim().replace(/\/$/, "");
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

function openDB() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB non supportato"));
      return;
    }

    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Errore apertura IndexedDB"));
  });
}

async function readFromIndexedDB() {
  try {
    const db = await openDB();

    const result = await new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, "readonly");
      const store = tx.objectStore(DB_STORE);
      const request = store.get(DB_RECORD_ID);

      request.onsuccess = () => resolve(request.result?.payload ?? null);
      request.onerror = () => reject(request.error || new Error("Errore lettura IndexedDB"));
    });

    db.close();
    return result;
  } catch {
    return null;
  }
}

async function writeToIndexedDB(payload) {
  const db = await openDB();

  await new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite");
    const store = tx.objectStore(DB_STORE);
    store.put({ id: DB_RECORD_ID, payload });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("Errore scrittura IndexedDB"));
  });

  db.close();
}
