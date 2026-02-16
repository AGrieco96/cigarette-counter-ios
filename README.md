# SmokeLess (`smoke-counter`)

App web mobile-first per contare sigarette con auth Supabase e insight statistici.

## Struttura

- `supabase/`: SQL schema, trigger, RLS.
- `web/`: frontend React + Vite + TypeScript.

## Setup Supabase

1. Crea un nuovo progetto su Supabase.
2. Esegui SQL in ordine:
   1. `supabase/schema.sql`
   2. `supabase/rls.sql`
3. In Authentication > URL Configuration imposta redirect URL per reset password:
   - `http://localhost:5173/auth/reset`
   - `https://<username>.github.io/<repo>/auth/reset`

## Setup frontend

```bash
cd web
cp .env.example .env
# inserisci VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm install
# genera automaticamente le icone PNG richieste
npm run dev
```

## GitHub Pages deploy

Il progetto calcola automaticamente il `base` per GitHub Pages (usando `GITHUB_REPOSITORY` in CI), con fallback a `/` in locale.
Puoi forzarlo con `VITE_BASE_PATH` se vuoi un path custom.

1. In GitHub repository settings:
   - Pages -> Source: **GitHub Actions**.
2. Configura:
   - Repository Variable: `VITE_SUPABASE_URL`
   - Repository Secret: `VITE_SUPABASE_ANON_KEY`
3. Push su `main` per triggerare `.github/workflows/deploy-pages.yml`.

## PWA

Manifest configurato con nome `SmokeLess`, modalità `standalone`, icone standard e maskable in `web/public/icons`.

Le icone PNG vengono generate automaticamente da `web/scripts/generate-icons.mjs` (script testuale, utile in ambienti dove i file binari non sono accettati in PR).

## Sicurezza

Non committare `.env` o chiavi sensibili. Usa solo `.env.example` come template.
