import { api, persistSession, loadSession } from './api-client.js';

const elements = {
  email: document.getElementById('auth-email'),
  password: document.getElementById('auth-password'),
  registerBtn: document.getElementById('register-btn'),
  loginBtn: document.getElementById('login-btn'),
  status: document.getElementById('auth-status'),
};

init();

async function init() {
  const session = loadSession();
  if (session?.accessToken) {
    const me = await api('/auth/me', { token: session.accessToken });
    if (!me.error) {
      window.location.href = '/app';
      return;
    }
  }

  elements.registerBtn.addEventListener('click', register);
  elements.loginBtn.addEventListener('click', login);
  elements.status.textContent = 'Inserisci credenziali per registrarti o accedere.';
}

async function register() {
  const email = elements.email.value.trim();
  const password = elements.password.value;
  const result = await api('/auth/register', { method: 'POST', body: { email, password } });

  elements.status.textContent = result.error
    ? `Registrazione fallita: ${result.error}`
    : 'Registrazione completata. Ora fai login.';
}

async function login() {
  const email = elements.email.value.trim();
  const password = elements.password.value;
  const result = await api('/auth/login', { method: 'POST', body: { email, password } });

  if (result.error) {
    elements.status.textContent = `Login fallito: ${result.error}`;
    return;
  }

  persistSession({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    user: result.user,
    expiresAt: result.expiresAt,
  });
  window.location.href = '/app';
}
