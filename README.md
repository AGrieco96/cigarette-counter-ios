# Contatore Sigarette – Full Stack (Frontend + Backend + Supabase)

Hai ragione: ora l'app è strutturata in modo classico e professionale, **non più single-page**:

- `/login` → pagina login/registrazione utenti
- `/app` → pagina dashboard protetta (contatore + statistiche)
- Backend Express che espone API (`/api/...`)
- Supabase usato come **database + autenticazione**

---

## Flusso completo (alto livello)

1. Utente apre `/login`
2. Si registra o fa login (email/password)
3. Frontend riceve token da backend e lo salva in sessione locale
4. Utente entra in `/app`
5. Dashboard salva/legge i dati tramite backend
6. Backend valida token utente con Supabase Auth
7. Backend salva/legge lo stato in tabella `cigarette_states` (una riga per utente)

---

## Cosa devi fare su Supabase (passo passo, da zero)

## 1) Crea account e progetto

1. Vai su https://supabase.com
2. Clicca **Start your project**
3. Crea Organization (se richiesta)
4. Crea un nuovo Project (nome + password DB + region)
5. Aspetta provisioning (1-2 minuti)

## 2) Recupera le chiavi

In Supabase vai su **Project Settings → API** e copia:

- `Project URL` → `SUPABASE_URL`
- `anon public key` → `SUPABASE_ANON_KEY`
- `service_role key` → `SUPABASE_SERVICE_ROLE_KEY` (solo backend, mai frontend)

## 3) Crea la tabella applicativa

Vai su **SQL Editor** e lancia:

```sql
create table if not exists public.cigarette_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);
```

## 4) Configura Auth Email/Password

Vai su **Authentication → Providers → Email**:

- abilita provider Email
- abilita login via password (default normalmente già attivo)
- opzionale: conferma email obbligatoria

## 5) Configura il progetto locale

1. Crea `.env` partendo da `.env.example`:

```bash
cp .env.example .env
```

2. Inserisci i valori Supabase nel file `.env`.

## 6) Avvia l'app

```bash
npm install
npm run dev
```

Apri: `http://localhost:3000/login`

---

## Struttura pagine (non SPA)

- `login.html`: sola autenticazione (registrazione + login)
- `app.html`: dashboard utente autenticato
- Se non autenticato, `/app` reindirizza a `/login` lato frontend

---

## API backend disponibili

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/state`
- `PUT /api/state`
- `GET /api/health`

---

## Deploy consigliato

- Backend su Render/Railway/Fly.io
- Supabase Free per DB/Auth
- Imposta le env var sul provider backend:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

---

## Nota sicurezza

La `SERVICE_ROLE_KEY` deve restare solo sul backend. Non inserirla mai in file frontend o variabili pubbliche.
