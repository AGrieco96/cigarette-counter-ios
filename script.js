const STORAGE_KEY = "cigaretteCounterData.v4";
const DB_NAME = "cigaretteCounterDB";
const DB_STORE = "appState";
const DB_RECORD_ID = "state";

const defaultState = {
  entries: [],
  settings: { packCost: 6, packSize: 20, dailyGoal: 10 },
  cloud: { supabaseUrl: "", anonKey: "", email: "" },
  meta: { updatedAt: null },
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
  cloudEmail: document.getElementById("cloud-email"),
  cloudLogin: document.getElementById("cloud-login"),
  cloudSyncUp: document.getElementById("cloud-sync-up"),
  cloudSyncDown: document.getElementById("cloud-sync-down"),
  cloudLogout: document.getElementById("cloud-logout"),
  cloudUser: document.getElementById("cloud-user"),
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
let cloudInfo = "Configura Supabase e fai login via email.";
let supabaseClient = null;
let currentUser = null;

init();

async function init() {
  state = await loadState();
  hydrateInputs();
  bindEvents();
  await initCloudClient();
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

  [elements.supabaseUrl, elements.supabaseKey, elements.cloudEmail].forEach((input) => {
    input.addEventListener("change", async () => {
      updateCloudConfigFromInputs();
      await persist();
      await initCloudClient();
      render();
    });
  });

  elements.exportBackupBtn.addEventListener("click", exportBackup);
  elements.importBackupBtn.addEventListener("click", () => elements.backupFileInput.click());
  elements.backupFileInput.addEventListener("change", importBackup);

  elements.cloudLogin.addEventListener("click", requestMagicLink);
  elements.cloudSyncUp.addEventListener("click", syncCloudUp);
  elements.cloudSyncDown.addEventListener("click", syncCloudDown);
  elements.cloudLogout.addEventListener("click", cloudLogout);
}

function updateSettingsFromInputs() {
  state.settings.packCost = Math.max(0, toNumber(elements.packCost.value, 0));
  state.settings.packSize = Math.max(1, Math.round(toNumber(elements.packSize.value, 20)));
  state.settings.dailyGoal = Math.max(0, Math.round(toNumber(elements.dailyGoal.value, 10)));
}

function updateCloudConfigFromInputs() {
  state.cloud.supabaseUrl = normalizeUrl(elements.supabaseUrl.value);
  state.cloud.anonKey = elements.supabaseKey.value.trim();
  state.cloud.email = elements.cloudEmail.value.trim();
  cloudInfo = "Configurazione cloud aggiornata localmente.";
}

function hydrateInputs() {
  elements.packCost.value = state.settings.packCost;
  elements.packSize.value = state.settings.packSize;
  elements.dailyGoal.value = state.settings.dailyGoal;
  elements.supabaseUrl.value = state.cloud.supabaseUrl;
  elements.supabaseKey.value = state.cloud.anonKey;
  elements.cloudEmail.value = state.cloud.email;
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
    if (dayCount <= state.settings.dailyGoal) goalDays += 1;
  }

  elements.todayCount.textContent = String(todayCount);
  elements.totalCount.textContent = String(totalCount);
  elements.avgWeek.textContent = avgWeek.toFixed(1);
  elements.totalCost.textContent = euro(totalCost);
  elements.monthCost.textContent = euro(monthCost);
  elements.goalDays.textContent = String(goalDays);
  elements.persistenceStatus.textContent = buildPersistenceStatus();
  elements.cloudStatus.textContent = cloudInfo;
  elements.cloudUser.textContent = currentUser
    ? `Utente cloud: ${currentUser.email ?? currentUser.id}`
    : "Utente cloud: non autenticato";

  renderRecentEntries(entries);
}

function renderRecentEntries(entries) {
  elements.recentList.innerHTML = "";
  const latest = [...entries].sort((a, b) => b - a).slice(0, 10);
  if (!latest.length) {
    const li = document.createElement("li");
    li.textContent = "Nessuna registrazione per ora.";
    elements.recentList.appendChild(li);
    return;
  }

  latest.forEach((date) => {
    const li = document.createElement("li");
    li.textContent = new Intl.DateTimeFormat("it-IT", { dateStyle: "short", timeStyle: "short" }).format(date);
    elements.recentList.appendChild(li);
  });
}

async function initCloudClient() {
  updateCloudConfigFromInputs();
  const { supabaseUrl, anonKey } = state.cloud;
  if (!supabaseUrl || !anonKey) {
    supabaseClient = null;
    currentUser = null;
    return;
  }

  if (!window.supabase?.createClient) {
    cloudInfo = "Libreria Supabase non caricata.";
    return;
  }

  supabaseClient = window.supabase.createClient(supabaseUrl, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });

  const { data, error } = await supabaseClient.auth.getUser();
  if (error) {
    currentUser = null;
    cloudInfo = `Cloud pronto ma login non valido: ${error.message}`;
    return;
  }

  currentUser = data.user ?? null;
  if (currentUser) {
    cloudInfo = "Login cloud attivo.";
    await autoRecoverFromCloud();
  }
}

async function requestMagicLink() {
  if (!supabaseClient) {
    cloudInfo = "Inserisci URL e Anon Key Supabase prima di fare login.";
    render();
    return;
  }

  const email = state.cloud.email.trim();
  if (!email) {
    cloudInfo = "Inserisci la tua email per ricevere il magic link.";
    render();
    return;
  }

  const { error } = await supabaseClient.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.href.split("#")[0] },
  });

  cloudInfo = error
    ? `Errore invio magic link: ${error.message}`
    : "Magic link inviato. Apri la mail sullo stesso dispositivo e conferma.";
  render();
}

async function cloudLogout() {
  if (!supabaseClient) return;
  await supabaseClient.auth.signOut();
  currentUser = null;
  cloudInfo = "Logout cloud eseguito.";
  render();
}

async function syncCloudUp() {
  if (!currentUser || !supabaseClient) {
    cloudInfo = "Fai login cloud prima della sincronizzazione.";
    render();
    return;
  }

  try {
    const payload = structuredClone(state);
    payload.meta.updatedAt = new Date().toISOString();

    const { error } = await supabaseClient.from("cigarette_states").upsert(
      { user_id: currentUser.id, payload, updated_at: payload.meta.updatedAt },
      { onConflict: "user_id" },
    );

    if (error) throw error;
    state = payload;
    await persist();
    cloudInfo = "Sync cloud completata (upload).";
  } catch (error) {
    cloudInfo = `Errore sync upload: ${error.message}`;
  }
  render();
}

async function syncCloudDown() {
  if (!currentUser || !supabaseClient) {
    cloudInfo = "Fai login cloud prima della sincronizzazione.";
    render();
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from("cigarette_states")
      .select("payload,updated_at")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (error) throw error;

    if (!data?.payload) {
      cloudInfo = "Nessun dato cloud trovato per questo utente.";
      render();
      return;
    }

    const localTs = Date.parse(state?.meta?.updatedAt ?? "") || 0;
    const remoteTs = Date.parse(data.updated_at ?? "") || 0;

    if (remoteTs >= localTs) {
      state = sanitizeState(data.payload);
      await persist();
      hydrateInputs();
      cloudInfo = "Sync cloud completata (download, remoto più recente).";
    } else {
      cloudInfo = "Cloud più vecchio del locale: nessuna sovrascrittura.";
    }
  } catch (error) {
    cloudInfo = `Errore sync download: ${error.message}`;
  }

  render();
}

async function autoRecoverFromCloud() {
  if (!currentUser || !supabaseClient) return;

  try {
    const { data, error } = await supabaseClient
      .from("cigarette_states")
      .select("payload,updated_at")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (error || !data?.payload) return;

    const localTs = Date.parse(state?.meta?.updatedAt ?? "") || 0;
    const remoteTs = Date.parse(data.updated_at ?? "") || 0;
    if (remoteTs > localTs) {
      state = sanitizeState(data.payload);
      await persist();
      hydrateInputs();
      cloudInfo = "Ripristino automatico da cloud: dati più recenti caricati.";
    }
  } catch {
    // fallback silenzioso
  }
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
  const payload = { exportedAt: new Date().toISOString(), app: "cigarette-counter", version: 3, data: state };
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
    const parsed = JSON.parse(await file.text());
    state = sanitizeState(parsed?.data ?? parsed);
    hydrateInputs();
    await persist();
    cloudInfo = "Backup importato con successo.";
  } catch {
    cloudInfo = "Backup non valido: impossibile importare il file selezionato.";
  } finally {
    elements.backupFileInput.value = "";
    render();
  }
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
      email: typeof raw?.cloud?.email === "string" ? raw.cloud.email : "",
    },
    meta: { updatedAt: raw?.meta?.updatedAt ?? null },
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
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

function euro(value) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value);
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
      if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE, { keyPath: "id" });
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
      const request = tx.objectStore(DB_STORE).get(DB_RECORD_ID);
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
    tx.objectStore(DB_STORE).put({ id: DB_RECORD_ID, payload });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("Errore scrittura IndexedDB"));
  });
  db.close();
}
