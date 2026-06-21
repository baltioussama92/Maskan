# Backend — Analyse complète (architecture, sécurité, routes, intégration Frontend)

Ce document résume le backend du projet PFE-2k26 pour relecture rapide: stack technique, rôle de chaque dossier, logique métier, endpoints, protections et pont avec le frontend.

---

## 1) Langage, framework et stack utilisée

- **Langage principal**: Java 17
- **Framework**: Spring Boot 3.2.5
- **Build tool**: Maven (`pom.xml`, `mvnw`, `mvnw.cmd`)
- **Base de données**: MongoDB (Spring Data MongoDB)
- **Sécurité**: Spring Security + JWT (JJWT)
- **Validation**: Jakarta Validation (`@Valid`, contraintes DTO/Entity)
- **Utilitaires**: Lombok

### Dépendances clés (`pom.xml`)
- `spring-boot-starter-web`
- `spring-boot-starter-data-mongodb`
- `spring-boot-starter-security`
- `spring-boot-starter-validation`
- `io.jsonwebtoken:jjwt-*`
- `spring-boot-starter-test`, `spring-security-test`

---

## 2) Vue d’ensemble de l’architecture backend

Le backend suit une architecture Spring classique en couches:

1. **Controller**: expose les routes REST `/api/**`
2. **Service**: logique métier
3. **Repository**: accès MongoDB
4. **Entity**: modèle persistant MongoDB
5. **DTO**: contrats d’échange API (requêtes/réponses)
6. **Security/Config/Exception**: cross-cutting (auth, CORS, erreurs)

Point d’entrée: `com.example.houserental.HouseRentalApplication`
- scan des packages `com.maskan.api`
- activation des repositories Mongo `com.maskan.api.repository`

---

## 3) Rôle de chaque dossier/fichier principal

## Racine `Backend/`
- `pom.xml`: configuration Maven + dépendances
- `mvnw`, `mvnw.cmd`, `.mvn/wrapper/`: exécution Maven sans installation globale
- `README.md`, `API_DOCUMENTATION.md`, etc.: documentation fonctionnelle
- `uploads/`: stockage local des fichiers uploadés (images/verification)
- `target/`: artefacts de build Maven (classes compilées, rapports de tests)

## `src/main/java/com/maskan/api/`

### `config/`
- `WebConfig`: 
  - configure CORS pour `/api/**`
  - expose les fichiers locaux `uploads` via `/uploads/**`
- `DatabaseChecker`: log au démarrage pour vérifier la connexion Mongo

### `security/`
- `SecurityConfig`:
  - désactive CSRF (API stateless)
  - active CORS
  - session `STATELESS`
  - autorise publiquement:
    - `/api/auth/**`
    - `/uploads/**`
    - `/api/listings/**`
    - `/api/reviews/**`
  - exige auth pour le reste
  - insère `JwtAuthenticationFilter`
- `JwtAuthenticationFilter`:
  - lit `Authorization: Bearer <token>`
  - valide le JWT
  - charge l’utilisateur et son rôle
  - bloque l’accès si user ban (`403`)
- `JwtService`:
  - génère token
  - extrait username/expiration
  - valide signature/expiration
- `CustomUserDetailsService`:
  - charge user par email
  - map `Role` en authorities Spring (`ROLE_ADMIN`, `ROLE_HOST`, `ROLE_GUEST`)
  - ajoute alias:
    - `HOST` => `ROLE_PROPRIETOR`
    - `GUEST` => `ROLE_TENANT`

### `controller/`
- Contrôleurs REST (auth, users, listings, bookings, messages, admin, etc.)

### `service/` + `service/impl/`
- Interfaces métier + implémentations
- Toute la logique applicative est dans `impl`

### `repository/`
- Interfaces MongoRepository (requêtes par convention Spring Data)

### `entity/`
- Modèles MongoDB:
  - `User`, `Property`, `Booking`, `Message`, `Review`, `ConnectionRequest`
  - enums: `Role`, `BookingStatus`, `ConnectionStatus`

### `dto/`
- Contrats de transport API (requests/responses)
- Sépare le modèle exposé de l’entity base de données

### `exception/`
- `GlobalExceptionHandler`: mapping erreurs -> réponses HTTP JSON
- `NotFoundException`: erreurs 404 métier

## `src/main/resources/`
- `application.properties`:
  - URI MongoDB
  - secret/expiration JWT
  - origine CORS
  - port serveur
  - limites upload multipart

## `src/test/java/`
- test de démarrage Spring (`HouseRentalApplicationTests`)

---

## 4) Modèle de données (MongoDB)

## `User`
- identité: `id`, `name`, `email`, `password`, `role`
- sécurité/statut: `banned`, `isVerified`
- wishlist: `wishlistListingIds`
- vérification guest: `emailVerified`, `phoneVerified`, `identityStatus`, `verificationLevel`, pièces uploadées

## `Property`
- infos annonce: titre, description, location, `pricePerNight`, images
- propriétaire: `hostId`
- filtres: type, bedrooms, bathrooms, area, amenities
- modération: `pendingApproval`

## `Booking`
- lien annonce/invité: `listingId`, `guestId`
- dates: `checkInDate`, `checkOutDate`
- état: `PENDING|AWAITING_PAYMENT|PAID_AWAITING_CHECKIN|CONFIRMED|CANCELLED|REJECTED|COMPLETED`
- paiement/sécurité: `stripePaymentIntentId`, `checkInSecretCode`, `paymentStatus`

## `Message`
- messagerie privée: `senderId`, `receiverId`, `content`, `createdAt`

## `Review`
- avis logement: `listingId`, `guestId`, `rating`, `comment`

## `ConnectionRequest`
- relation sociale/messagerie: `requesterId`, `receiverId`, `status`

---

## 5) Sécurité des routes (comment elles sont protégées)

La sécurité est **en 2 niveaux**:

1. **Niveau global (`SecurityConfig`)**
   - Certaines routes sont publiques (`/api/auth/**`, `/api/listings/**`, `/api/reviews/**`, `/uploads/**`)
   - Le reste exige un JWT valide

2. **Niveau méthode (`@PreAuthorize`)**
   - Contrôle fin par rôle
   - Exemples:
     - `hasRole('ADMIN')`
     - `hasAnyRole('HOST','PROPRIETOR','ADMIN')`
     - `hasAnyRole('GUEST','TENANT')`
     - `isAuthenticated()`

### Rôles utilisés
- `ADMIN`
- `HOST` (alias security: `PROPRIETOR`)
- `GUEST` (alias security: `TENANT`)

---

## 6) Endpoints créés (par module)

> Préfixe API: `/api`

## Auth (`/api/auth`)
- `POST /register` (public)
- `POST /login` (public)
- `GET /me` (JWT requis via sécurité globale)

## Users (`/api/users`)
- `GET /me` (`isAuthenticated`)
- `PUT /me` (`isAuthenticated`)
- `GET /search?q=...` (`isAuthenticated`)

## Listings / Properties (`/api/listings`)
- `GET /` (public)
- `GET /search` (public)
- `GET /search/advanced` (public)
- `GET /{id}` (public)
- `GET /owner/me` (`HOST|PROPRIETOR|ADMIN`)
- `POST /` (`HOST|PROPRIETOR`)
- `PUT /{id}` (`HOST|PROPRIETOR|ADMIN`)
- `DELETE /{id}` (`HOST|PROPRIETOR|ADMIN`)

## Bookings (`/api/bookings` et alias `/api/reservations`)
- `POST /` (`GUEST|TENANT`)
- `PATCH /{id}/status` (`HOST|PROPRIETOR|ADMIN`)
- `POST /{id}/verify-checkin` (`HOST|PROPRIETOR`)
- `DELETE /{id}` (`GUEST|TENANT|ADMIN`)
- `GET /me` (`GUEST|TENANT`)
- `GET /owner` (`HOST|PROPRIETOR|ADMIN`)
- `GET /listing/{listingId}/unavailable-dates` (public)

## Payments (`/api/payments`)
- `POST /checkout/{bookingId}` (`GUEST|TENANT`)

## Reviews (`/api/reviews`)
- `POST /` (`GUEST|TENANT|HOST`)
- `GET /listing/{listingId}` (public)

## Wishlist (`/api/wishlist`)
- `GET /` (auth)
- `POST /{listingId}` (auth)
- `DELETE /{listingId}` (auth)

## Connections (`/api/connections`)
- `POST /request` (auth)
- `PATCH /{id}/accept` (auth)
- `GET /pending` (auth)
- `GET /` (auth)

## Messages (`/api/messages`)
- `POST /` (auth)
- `GET /inbox` (auth)
- `GET /sent` (auth)
- `GET /conversations` (auth)
- `GET /conversations/{userId}` (auth)

## Dashboard (`/api/dashboard`)
- `GET /tenant/summary` (`GUEST|TENANT`)
- `GET /host/summary` (`HOST|PROPRIETOR|ADMIN`)
- `GET /admin/summary` (`ADMIN`)

## Verifications Guest (`/api/verifications/guest`)
- `GET /status` (auth)
- `POST /email/send-otp` (auth)
- `POST /email/verify-otp` (auth)
- `POST /phone/send-otp` (auth)
- `POST /phone/verify-otp` (auth)
- `POST /identity` (auth, multipart)

## Verifications Host (`/api/verifications`)
- `POST /host` (auth, multipart)
- `GET /me?type=HOST` (auth)

## Uploads (`/api/uploads`)
- `POST /images` (`HOST|PROPRIETOR|ADMIN`, multipart)

## Admin (`/api/admin`) — **classe entière `hasRole('ADMIN')`**
- Users: list, ban/block, overview, history, messages, listings, bookings, earnings, update profile/password, delete, permissions
- Listings: pending + verify
- Bookings: list
- Growth metrics / stats
- Guest verification approve/reject
- Host demands list/detail/approve/reject

---

## 7) Logique métier importante par module

## Auth
- inscription interdit role `ADMIN`
- mot de passe hashé BCrypt
- retour d’un JWT + infos user

## Property
- recherche simple + avancée
- filtre disponibilité avec exclusion des logements ayant réservation en chevauchement (`PENDING`/`CONFIRMED`)

## Booking
- validation des dates
- calcul `totalPrice = pricePerNight * nbJours * guests`
- owner/admin peut changer statut (`CONFIRMED` est converti en `AWAITING_PAYMENT`)
- guest effectue le checkout via `/api/payments/checkout/{bookingId}` (état `PAID_AWAITING_CHECKIN` + génération `checkInSecretCode`)
- host valide le check-in via secret code pour clôturer en `COMPLETED`
- guest/admin peut annuler

## Review
- guest: avis autorisé uniquement avec booking `COMPLETED`
- host: avis autorisé sur son propre logement s’il existe une réservation `CONFIRMED`

## Messaging
- message autorisé si:
  - utilisateurs connectés (request acceptée), **ou**
  - relation host/guest via bookings

## 7.5 Sécurité des Transactions : Modèle Escrow & Handshake QR

- **Concept d'Escrow**: le paiement du Guest est encaissé mais **séquestré** (état pending côté plateforme). Les fonds ne sont transférés au Propriétaire qu'après validation physique de la remise des clés.

- **Handshake Cryptographique (QR Code)**:
  - Une fois le paiement effectué, le backend génère un UUID unique et sécurisé (QR Code) côté Guest.
  - Ce code sert de **Preuve de Présence**.

- **Validation du Check-in**:
  - Le Propriétaire doit scanner le QR Code du Guest via l'application.
  - Le backend vérifie la correspondance du hash. Si valide, le statut du Booking passe à `COMPLETED` et le virement (payout) est déclenché vers le compte du Propriétaire.

- **Anti-Scam**: ce processus garantit que le Propriétaire ne reçoit l'argent que si le Guest est réellement devant la porte avec les clés, et que le Guest ne peut pas prétendre ne pas avoir reçu les clés s'il a présenté son code.

## Verification
- OTP de démo codé (`123456`)
- upload pièces d’identité dans `uploads/verifications/<userId>/`
- niveau de vérification calculé (0 à 3)
- ajout d’un flux de vérification host (`POST /api/verifications/host`) avec documents (government ID, selfie, proof, images)

## Payment
- checkout protégé: seul le guest du booking peut payer
- paiement simulé (`pi_sim_*`) + génération d’un `checkInSecretCode` UUID
- transition d’état: `AWAITING_PAYMENT` → `PAID_AWAITING_CHECKIN` avant validation check-in

## Admin
- modération globale utilisateurs/logements
- tableaux de bord + agrégations
- gestion vérification guest et demandes host

---

## 8) Gestion des erreurs et réponses API

`GlobalExceptionHandler` renvoie des payloads JSON cohérents:
- `400` validation et erreurs métier (`IllegalArgumentException`)
- `401` identifiants invalides
- `403` accès refusé
- `404` ressource non trouvée
- `500` erreur inattendue

Pour upload trop gros: message explicite (max 10MB par fichier côté config).

---

## 9) Pont backend ↔ frontend (bridge)

Le bridge est clair et standardisé:

1. **Base URL côté frontend**
   - `Frontend/src/api/apiClient.ts`
   - `baseURL = ${VITE_API_BASE_URL}/api` (par défaut `https://maskan-xzpw.onrender.com/api`)

2. **Token JWT**
   - stocké dans `localStorage` (`authToken`)
   - envoyé automatiquement dans `Authorization: Bearer <token>` via interceptor Axios

3. **CORS backend**
   - autorise les origins frontend locales (5173, 3000, 3001, 3002)
   - credentials autorisés

4. **Contrats d’API partagés**
   - frontend centralise les chemins dans `Frontend/src/api/endpoints.ts`
   - ces chemins correspondent aux `@RequestMapping` backend

5. **Gestion des erreurs auth côté frontend**
   - en `401/403`, le frontend purge token+session et redirige vers login

6. **Uploads**
   - frontend envoie `multipart/form-data`
   - backend sert les fichiers via `/uploads/**`

---

## 10) Variables de configuration importantes

Dans `application.properties`:
- `SPRING_DATA_MONGODB_URI`
- `SPRING_DATA_MONGODB_DATABASE`
- `JWT_SECRET`
- `JWT_EXPIRATION_MS`
- `APP_CORS_ALLOWED_ORIGIN`
- `SERVER_PORT`

---

## 11) Résumé final

Le backend est un **monolithe Spring Boot REST sécurisé JWT**, adossé à MongoDB, avec une séparation claire Controller/Service/Repository. Il couvre les domaines Auth, Users, Listings, Bookings, Payments, Reviews, Messaging, Connections, Verification (guest + host) et Admin. La communication frontend/backend est proprement structurée (endpoints centralisés, token Bearer, CORS configuré, upload multipart, réponses JSON cohérentes).
