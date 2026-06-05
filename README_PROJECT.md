# Maskan — Project Overview

Objectif: fournir une description synthétique et les décisions techniques clés pour toute personne qui découvre le projet.

1) Ce que propose Maskan
- Plateforme de location entre particuliers (guest/host) adaptée au marché tunisien.
- Fonctionnalités principales: découverte de biens, réservation, paiements (card/cash), QR check-in, KYC (email OTP + documents), messagerie temps-réel, administration et modération.

2) Pourquoi ce design
- Séparation des responsabilités (SPA frontend + API backend) pour scalabilité et maintenabilité.
- Stateless security (JWT) pour faciliter intégration et montée en charge.
- MongoDB choisi pour la flexibilité des documents (listings, verifications, messages).

3) Où commencer (contribution / démonstration)
- Lancer MongoDB local (ou via Docker), démarrer Backend puis Frontend.
- Voir `ARCHITECTURE.md` pour la vue globale et `MASKAN_TECHNICAL_ANALYSIS.md` pour les détails techniques approfondis.

4) Composants importants
- `Frontend/`: UI, logique client, appels API, routes.
- `Backend/`: API REST, sécurité, services métier, persistance.
- `Backend/uploads/`: stockage local des documents et images.

5) Demandes courantes
- Vous voulez une démo locale ? Je peux générer un `docker-compose.yml` pour lancer MongoDB + backend + frontend.
- Vous voulez déployer ? Documenter les variables d'environnement (SMTP, JWT keys, Stripe, Twilio) est la prochaine priorité.

**Required fixes (urgent)**
- **Remove hard-coded secrets:** `Backend/src/main/resources/application.properties` and `target/classes/application.properties` contain default secrets (JWT secret, SMTP username/password, Mocean keys). Move all secrets to environment variables and create a `.env.example` listing required names. Rotate any exposed credentials immediately.
- **Do not commit build artifacts or secrets:** Ensure `/target/` and any `.env` files are ignored in `.gitignore`.
- **Use secure logging:** Replace `System.out.println` and `printStackTrace()` with SLF4J (`Logger`) and avoid logging sensitive data (OTP codes, tokens, passwords). Mask PII in logs.
- **Frontend debug removal:** Remove `console.log`, `alert()` debug messages and avoid embedding API keys or secrets in frontend bundles. Use Vite env vars (prefixed `VITE_`) for runtime config and restrict CORS origin.
- **Harden authentication and OTPs:** Do not log OTPs; add rate-limiting on verification endpoints; rotate JWT secret and ensure it is strong.
- **Secure file uploads:** Validate file types and sizes server-side, store uploads outside webroot, and scan or sanitize files where possible.
- **Document environment and run steps:** Add `.env.example`, update `Backend/README_RUN.md` and `Frontend/README_RUN.md` with required env vars and examples for local development and production.

Follow these steps first: rotate exposed credentials, add a `.env.example` (no real secrets), add `.gitignore` entries for `.env` and `target/`, and then remove debug prints from frontend and backend.
