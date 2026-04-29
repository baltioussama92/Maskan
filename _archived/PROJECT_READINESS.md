# Project Readiness (Backend + Frontend)

_Last update: 2026-04-13_

Ce document donne une vue rapide de ce qui est **prêt** et de ce qui reste **à préparer**.

## Vue globale

### ✅ Déjà prêt
- Plateforme core fonctionnelle: Auth, Listings, Bookings, Messages, Wishlist, Dashboards.
- Intégration API frontend-backend active via client API partagé.
- Flows Admin User Details connectés au backend (overview, history, messages, listings, bookings, earnings, security).
- Guest verification prête (frontend + backend).

### ⏳ Encore à préparer
- Intégration finale Host Verification côté frontend (soumission encore simulée selon l’état actuel).
- Nettoyage des derniers mocks/fallbacks admin (notamment host demands si encore présents).
- Décision produit/technique sur:
  - module paiements dédié,
  - module reports dédié,
  - persistance backend des settings admin.
- Validation E2E complète (Postman + scénarios front) après nettoyage final.

## Détails par côté
- Backend: voir [Backend/README_STATUS.md](Backend/README_STATUS.md)
- Frontend: voir [Frontend/README_STATUS.md](Frontend/README_STATUS.md)

## Priorités recommandées
1. Finaliser Host Verification frontend → endpoint réel `/api/verifications/host`.
2. Supprimer tout fallback mock restant dans les services admin.
3. Lancer une campagne de tests E2E (auth, booking, admin, verification).
4. Stabiliser la roadmap des modules optionnels (payments/reports/settings).
