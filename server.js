import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const requiredEnv = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing environment variable: ${key}`);
  }
}

const app = express();
const port = Number(process.env.PORT || 3000);

const supabaseAnon = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const supabaseService = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function sanitizeSettings(settings = {}) {
  return {
    packCost: Math.max(0, Number(settings.packCost) || 0),
    packSize: Math.max(1, Math.round(Number(settings.packSize) || 20)),
    dailyGoal: Math.max(0, Math.round(Number(settings.dailyGoal) || 10)),
  };
}

function sanitizeState(raw = {}) {
  return {
    entries: Array.isArray(raw.entries)
      ? raw.entries.filter((entry) => !Number.isNaN(new Date(entry).getTime()))
      : [],
    settings: sanitizeSettings(raw.settings),
    meta: {
      updatedAt: raw?.meta?.updatedAt ?? new Date().toISOString(),
    },
  };
}

async function requireUser(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Missing bearer token' });
    return;
  }

  const { data, error } = await supabaseService.auth.getUser(token);
  if (error || !data?.user) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  req.user = data.user;
  req.accessToken = token;
  next();
}

app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password || String(password).length < 8) {
    res.status(400).json({ error: 'Email and password (min 8 chars) are required' });
    return;
  }

  const { data, error } = await supabaseAnon.auth.signUp({ email, password });
  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.json({
    message: 'Registration completed. If email confirmation is enabled, verify your email before login.',
    user: data.user,
    session: data.session,
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    res.status(401).json({ error: error?.message || 'Invalid credentials' });
    return;
  }

  res.json({
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresAt: data.session.expires_at,
    user: data.user,
  });
});

app.get('/api/auth/me', requireUser, async (req, res) => {
  res.json({ user: req.user });
});

app.post('/api/auth/logout', requireUser, async (req, res) => {
  const { error } = await supabaseService.auth.admin.signOut(req.accessToken);
  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.json({ message: 'Logged out' });
});

app.get('/api/state', requireUser, async (req, res) => {
  const { data, error } = await supabaseService
    .from('cigarette_states')
    .select('payload,updated_at')
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({
    state: data?.payload ? sanitizeState(data.payload) : null,
    updatedAt: data?.updated_at ?? null,
  });
});

app.put('/api/state', requireUser, async (req, res) => {
  const sanitized = sanitizeState(req.body?.state);
  sanitized.meta.updatedAt = new Date().toISOString();

  const { error } = await supabaseService.from('cigarette_states').upsert(
    {
      user_id: req.user.id,
      payload: sanitized,
      updated_at: sanitized.meta.updatedAt,
    },
    { onConflict: 'user_id' },
  );

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ message: 'State saved', state: sanitized });
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use(express.static(__dirname));
app.get('/', (_req, res) => res.redirect('/login'));
app.get('/login', (_req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/app', (_req, res) => res.sendFile(path.join(__dirname, 'app.html')));

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
