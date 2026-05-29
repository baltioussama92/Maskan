# Maskan — Architecture Overview

But: fournir une vue claire, technique et accessible de l'architecture, des composants, des workflows et des choix technologiques.

1) Résumé global
- Type: application web full-stack (Single Page App + REST + WebSocket)
- Objectif: marketplace de location (invite/host/admin) avec vérification KYC, messagerie temps réel, et workflows de réservation sécurisés.

2) Composants principaux
- Frontend (Frontend/): React 18 + Vite 5, UI: Tailwind CSS 3, Framer Motion, MapLibre GL, QR tools, Axios (auth interceptor).
- Backend (Backend/): Spring Boot 3.2, Spring Security (JWT via JJWT), Spring Data MongoDB, Spring WebSocket (STOMP), Spring Mail, Jakarta Validation.
- Database: MongoDB (collections: users, properties, bookings, host_verifications, messages, reviews, notifications, tokens).
- Static storage: fichiers uploadés stockés localement sous `Backend/uploads/` et servis via `/uploads/**`.

3) Patterns d'architecture
- Layered: Controller -> Service -> Repository.
- Security: stateless JWT, RBAC via annotations (`@PreAuthorize`).
- Real-time: WebSocket + STOMP pour messagerie; JWT repris pour auth socket.
- Async: `@Async` pour envoi d'emails et tâches non-blocantes.

4) Principaux workflows (logique métier)
- Auth: inscription/login -> JWT signé -> header `Authorization: Bearer <token>`.
- Booking:
  - Création: `PENDING` -> host `CONFIRMED` -> `AWAITING_PAYMENT` -> paiement -> `PAID_AWAITING_CHECKIN` -> check-in (QR) -> `COMPLETED`.
  - Cash flow: peut bypasser paiement en ligne.
- Verification (KYC): email OTP + upload de documents -> `pending` -> admin approve -> promotion rôle GUEST->HOST.
- Messaging: STOMP topics/queues, messages persistés en MongoDB.

5) Données et optimisation
- Certaines vues sont dénormalisées pour des lectures rapides (ex: rating/reviewCount sur la collection `properties`).
- Indexation sur champs de recherche: localisation, price, availability, bookingState.

6) Dépendances et external services
- Email: SMTP via Spring Mail (config dans `application.properties`).
- OTP via WhatsApp/Twilio (sandbox design — nécessite clés pour activer).
- Paiement: implémentation de démonstration (intent simulé). Remplacer par Stripe SDK en production.

7) Sécurité et limites connues
- JWT signature keys must be secured (env var). Do not commit secrets.
- Phone OTP disabled by default; enable only with credentials.
- Files stored on disk — consider cloud storage (S3) for production.

8) Fichiers clés à consulter
- Frontend: `Frontend/src/` (routes, services, api client).
- Backend: `Backend/src/main/java/` (controllers, services, repositories), `Backend/src/main/resources/application.properties`.
- Seeds: `Backend/scripts/`, helper `Backend/seed-admin.ps1`.

9) Prochaine étape recommandée
- Ajouter `docker-compose.yml` pour dev/demo (MongoDB + Backend + Frontend).
- Documenter variables d'environnement sensibles dans `.env.example`.

---
Fichier généré automatiquement pour expliquer l'architecture du projet.
