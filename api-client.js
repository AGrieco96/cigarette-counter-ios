export const STORAGE_KEY = 'cigaretteCounterData.v6';
export const API_BASE = '/api';

export function loadSession() {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}.session`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function persistSession(session) {
  localStorage.setItem(`${STORAGE_KEY}.session`, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(`${STORAGE_KEY}.session`);
}

export async function api(path, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { error: payload.error || `HTTP ${response.status}` };
    }
    return payload;
  } catch {
    return { error: 'Errore rete o backend non raggiungibile' };
  }
}
