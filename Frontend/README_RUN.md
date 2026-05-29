# Frontend — Run & Dev Notes

Emplacement: `Frontend/` — application React 18 + Vite 5.

Prérequis
- Node.js (16+) et npm

Commandes

```bash
cd Frontend
npm install
npm run dev
```

Build de production

```bash
npm run build
npx serve dist
```

Configuration
- API base URL: configurée dans le code client (rechercher `api` ou `BASE_URL`), CORS doit autoriser l'origine du frontend côté backend.

Notes opérationnelles
- Map components require MapLibre token/config if used.
- QR scanning requires camera permissions when running in browser.
