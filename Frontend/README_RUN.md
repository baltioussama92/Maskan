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

- Environment & build notes
- Use Vite environment variables for runtime configuration. Prefix keys with `VITE_` (example: `VITE_API_BASE_URL=https://api.example.com`).
- The project expects `VITE_API_BASE_URL` (no trailing slash). Default used in code: `https://maskan-xzpw.onrender.com`.
- Never embed secrets or private API keys in the frontend bundle. Keep sensitive keys server-side.
- Create a `.env.local` (ignored by git) or CI environment variables for production builds.

Frontend fixes checklist
- Remove `console.log`, `alert()` and temporary debugging code before production builds.
 - Ensure API endpoints are read from `import.meta.env.VITE_API_BASE_URL` (or equivalent) and not hardcoded.
- Verify CORS origin in backend (`APP_CORS_ALLOWED_ORIGIN`) matches the deployed frontend origin.
- Validate user input and sanitize any HTML before rendering; avoid `dangerouslySetInnerHTML` where possible.

Notes opérationnelles
- Map components require MapLibre token/config if used.
- QR scanning requires camera permissions when running in browser.
