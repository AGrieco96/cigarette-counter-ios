# Supabase Guide (SmokeLess)

Questa guida spiega **tutti i passi**, in dettaglio, per configurare Supabase per il progetto `smoke-counter`.

---

## 1) Prerequisiti

- Account Supabase: https://supabase.com
- Repository con questa struttura:
  - `supabase/schema.sql`
  - `supabase/rls.sql`
- Node.js installato per il frontend locale.

---

## 2) Crea il progetto Supabase

1. Accedi a Supabase.
2. Clicca **New project**.
3. Scegli Organization.
4. Inserisci:
   - **Name**: es. `smoke-counter`
   - **Database Password**: usa una password robusta (salvala in un password manager)
   - **Region**: scegli la più vicina agli utenti
5. Clicca **Create new project**.
6. Attendi provisioning (1–2 minuti circa).

---

## 3) Recupera URL e chiavi (per frontend)

Nel progetto Supabase:

1. Vai in **Project Settings** → **API**.
2. Copia:
   - **Project URL** (serve per `VITE_SUPABASE_URL`)
   - **anon / public key** (serve per `VITE_SUPABASE_ANON_KEY`)
3. Non committare queste chiavi in git.

Nel frontend (`web`):

```bash
cp .env.example .env
```

Compila `.env`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

---

## 4) Esegui SQL schema + trigger

1. In Supabase vai su **SQL Editor**.
2. Apri `supabase/schema.sql`.
3. Incolla tutto il contenuto nella query.
4. Esegui con **Run**.

Cosa crea `schema.sql`:
- estensione `pgcrypto`
- tabella `public.profiles`
- tabella `public.smoke_events`
- indici su `smoke_events`
- trigger `profiles_set_updated_at`
- funzione/trigger `handle_new_user` su `auth.users` (autocreazione profilo)

---

## 5) Esegui SQL RLS + policy

1. Sempre in **SQL Editor**.
2. Apri `supabase/rls.sql`.
3. Esegui lo script completo.

Cosa fa `rls.sql`:
- abilita RLS su `profiles` e `smoke_events`
- crea policy separate per `SELECT/INSERT/UPDATE/DELETE`
  - `profiles`: `auth.uid() = id`
  - `smoke_events`: `auth.uid() = user_id`

---

## 6) Configura Authentication (email/password)

1. Vai su **Authentication** → **Providers**.
2. Abilita provider **Email**.
3. Lascia attivo **Email + Password**.
4. (Opzionale) Disabilita magic link se vuoi solo password classica.

### Conferma email (consigliato)
- In **Authentication** → **Settings**:
  - lascia conferma email attiva per maggiore sicurezza.
- Se in sviluppo vuoi onboarding immediato, puoi disattivarla temporaneamente.

---

## 7) Configura URL applicazione e redirect reset password

Vai su **Authentication** → **URL Configuration** e imposta:

- **Site URL**:
  - locale: `http://localhost:5173`
  - produzione Pages: `https://<username>.github.io/smoke-counter/`

- **Redirect URLs** (aggiungi entrambe):
  - `http://localhost:5173/auth/reset`
  - `https://<username>.github.io/smoke-counter/auth/reset`

> Nota: con GitHub Pages la base è `/smoke-counter/`; mantieni coerente anche `web/vite.config.ts`.

---

## 8) Verifica tabelle e trigger

### Verifica creazione profilo automatica
1. Crea un utente (signup dalla web app oppure da Authentication Users).
2. Apri **Table Editor** → `profiles`.
3. Controlla che esista riga con `id = user.id`.

### Verifica eventi fumo
1. Login con utente test.
2. Nella pagina Today clicca `+1`.
3. In `smoke_events` verifica inserimento riga:
   - `user_id` corretto
   - `smoked_at` valorizzato
   - `count = 1`

---

## 9) Test rapido policy RLS (consigliato)

### Scenario A (utente autenticato)
- Utente A può leggere/aggiornare solo il proprio `profiles`.
- Utente A può CRUD solo sui propri `smoke_events`.

### Scenario B (utente diverso)
- Utente B **non** deve vedere/modificare dati di Utente A.

### Scenario C (anonimo)
- Chiamate dirette a tabelle protette senza sessione devono fallire/ritornare vuoto secondo policy.

Per test pratico:
1. Crea due utenti distinti.
2. Esegui login alternato nel frontend.
3. Verifica isolamento dati su Today/Stats/History/Profile.

---

## 10) Integrazione con GitHub Pages

Nel repository GitHub:

1. **Settings** → **Pages** → Source: `GitHub Actions`.
2. **Settings** → **Secrets and variables**:
   - **Variables**: `VITE_SUPABASE_URL`
   - **Secrets**: `VITE_SUPABASE_ANON_KEY`
3. Fai push su branch `main`.
4. Workflow `.github/workflows/deploy-pages.yml` builda e deploya.

---

## 11) Troubleshooting

### Errore: “Missing Supabase env vars”
- Verifica `.env` locale.
- Verifica `vars/secrets` nel repo GitHub.

### Reset password non apre la pagina giusta
- Controlla `Redirect URLs` in Supabase.
- Controlla che route `/auth/reset` esista nel frontend.
- Su Pages verifica path corretto con repo name.

### Dati non visibili in app
- Verifica login effettivo (sessione valida).
- Verifica policy RLS presenti e abilitate.
- Verifica che `user_id` negli eventi corrisponda a `auth.uid()`.

### Inserimento evento fallisce con errore RLS
- Controlla policy `smoke_events_insert_own`.
- Controlla che la insert invii `user_id` corretto oppure che default DB sia compatibile.

---

## 12) Checklist finale

- [ ] Progetto Supabase creato
- [ ] `schema.sql` eseguito con successo
- [ ] `rls.sql` eseguito con successo
- [ ] Email/password attivo
- [ ] Redirect reset configurati (localhost + Pages)
- [ ] `.env` locale configurato
- [ ] Signup crea `profiles` automaticamente
- [ ] `+1` su Today inserisce record in `smoke_events`
- [ ] RLS verificato con 2 utenti
- [ ] Variabili/segreti GitHub configurati per deploy

---

Se vuoi, nel prossimo step posso aggiungere anche una versione **operativa “click-by-click con screenshot”** (sezione per sezione della dashboard Supabase) direttamente nello stesso file.
