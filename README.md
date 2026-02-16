# Contatore Sigarette Web

Applicazione web statica (HTML/CSS/JS) pronta per essere pubblicata su **GitHub Pages** per monitorare:

- sigarette fumate oggi e in totale;
- media giornaliera sugli ultimi 7 giorni;
- stima della spesa totale e mensile;
- numero di giorni sotto obiettivo negli ultimi 30 giorni;
- ultime registrazioni con data e ora.

## Persistenza dati (iPhone/Home Screen)

Per ridurre al minimo il rischio di perdita dati:

- la app salva in **doppia persistenza locale**: `IndexedDB` + `localStorage`;
- puoi usare **Esporta backup** per scaricare un file `.json` (consigliato salvarlo in File/iCloud);
- puoi usare **Importa backup** per ripristinare tutto in caso di reset del browser/dispositivo.

> Nota: una web app completamente statica, senza backend/account cloud, non può garantire una persistenza "assoluta" al 100% su ogni scenario di pulizia dati del sistema.

## Avvio locale

Apri `index.html` direttamente nel browser oppure usa un server statico (es. VS Code Live Server).

## Deploy su GitHub Pages

1. Esegui push del repository su GitHub.
2. Vai in **Settings → Pages**.
3. In **Build and deployment**, scegli:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` (o il branch desiderato)
   - **Folder**: `/ (root)`
4. Salva e attendi la pubblicazione.
