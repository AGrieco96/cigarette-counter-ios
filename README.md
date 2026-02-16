# Contatore Sigarette Web

Web app statica deployabile su **GitHub Pages**, con:
- tracking sigarette e statistiche;
- persistenza locale ridondante (**IndexedDB + localStorage**);
- backup manuale JSON;
- cloud gratuito robusto con **Supabase + Auth (magic link email)**.

## Cloud gratuito robusto: cosa devi fare manualmente

Sì, è possibile avere backend gratuito. La soluzione più robusta (free) è Supabase con autenticazione email.

### 1) Crea progetto Supabase (free)
1. Registrati su https://supabase.com
2. Crea un nuovo progetto
3. Copia da `Project Settings -> API`:
   - `Project URL`
   - `anon public key`

### 2) Crea tabella cloud
Nel SQL Editor esegui:

```sql
create table if not exists public.cigarette_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);
```

### 3) Abilita sicurezza RLS (importante)

```sql
alter table public.cigarette_states enable row level security;

create policy "select own state"
on public.cigarette_states
for select
using (auth.uid() = user_id);

create policy "insert own state"
on public.cigarette_states
for insert
with check (auth.uid() = user_id);

create policy "update own state"
on public.cigarette_states
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

### 4) Configura Auth email
In Supabase:
- `Authentication -> Providers -> Email`: enabled.
- (Consigliato) imposta Site URL al dominio GitHub Pages.

### 5) Usa l'app
Nella sezione cloud inserisci:
- Supabase URL
- Supabase Anon Key
- Email

Poi:
1. `Invia magic link`
2. Apri la mail e conferma login
3. Usa `Sync Cloud ↑` per salvare
4. Usa `Sync Cloud ↓` per ripristinare

## Robustezza attuale
- Doppia persistenza locale (IndexedDB + localStorage)
- Recupero automatico sessione Supabase
- Download cloud solo se il dato remoto è più recente del locale
- Backup JSON manuale di emergenza

## Avvio locale
Apri `index.html` nel browser oppure usa server statico (`python3 -m http.server`).

## Deploy GitHub Pages
1. Push su GitHub
2. `Settings -> Pages`
3. Source: `Deploy from a branch`, branch `main`, folder `/ (root)`
