# Contatore Sigarette Web

Web app statica (HTML/CSS/JS) deployabile su **GitHub Pages** per monitorare:

- sigarette fumate oggi e in totale;
- media giornaliera (7 giorni);
- spesa stimata totale e mensile;
- giorni sotto obiettivo negli ultimi 30 giorni;
- ultime registrazioni.

## Persistenza dati

- Salvataggio locale ridondante: **IndexedDB + localStorage**.
- Backup manuale: **Esporta/Importa JSON**.

## Backend gratuito (opzionale): Supabase Free

Sì: puoi collegare un backend gratuito tramite **Supabase Free Tier**.

### 1) Crea progetto Supabase
- Vai su [supabase.com](https://supabase.com) e crea un progetto gratuito.
- Recupera da Project Settings:
  - `Project URL`
  - `anon public key`

### 2) Crea tabella SQL
Nel SQL Editor esegui:

```sql
create table if not exists public.cigarette_backups (
  profile_id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);
```

### 3) Policy minima (demo)
Per test veloce da app client puoi consentire accesso anonimo alla tabella:

```sql
alter table public.cigarette_backups enable row level security;

create policy "anon read/write backups"
on public.cigarette_backups
for all
to anon
using (true)
with check (true);
```

> Per uso reale è meglio usare autenticazione Supabase Auth e policy per utente.

### 4) Configura la web app
Nella sezione **Backend gratuito (opzionale)** inserisci:
- Supabase URL
- Supabase Anon Key
- Profilo ID (es. `mario-iphone`)

Poi usa:
- **Salva su cloud**
- **Carica da cloud**

## Avvio locale
Apri `index.html` nel browser oppure usa un server statico.

## Deploy su GitHub Pages
1. Push su GitHub.
2. Repository → **Settings → Pages**.
3. Source: `Deploy from a branch`, branch `main`, folder `/ (root)`.
4. Attendi pubblicazione.
