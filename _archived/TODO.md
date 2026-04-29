# Maskan – Travail Restant

## Frontend - Admin Dashboard (Implemented)

- [x] Built feature-based admin module under `Frontend/src/admin/` with `pages`, `components`, `services`, and `hooks`.
- [x] Added protected admin routes: `/admin/dashboard`, `/admin/users`, `/admin/listings`, `/admin/bookings`, `/admin/payments`, `/admin/reports`, `/admin/settings`.
- [x] Added `useAdminAuth()` route protection and redirect to `/` for non-admin users.
- [x] Added reusable admin UI components: `AdminLayout`, `Sidebar`, `Topbar`, `Table`, `Card`, `Modal`.
- [x] Implemented mock API layer (`adminApi.ts`) with async fake data and actions.
- [x] Implemented loading states, empty states, confirmation modals, and toast notifications across admin pages.
- [x] Updated frontend navbar admin links to use the new `/admin/*` navigation.

## Frontend – Ce qu'il reste à faire

### Pages & Fonctionnalités manquantes
- [ ] **Page Favoris (Wishlist)** – La page existe mais ne persiste rien. Brancher sur un endpoint backend quand il sera créé.
- [ ] **Changement de mot de passe** – Le formulaire dans SettingsPage existe mais n'envoie rien au backend (pas d'endpoint).
- [ ] **Profil utilisateur complet** – Les champs bio, téléphone, avatar, ville ne sont pas sauvegardés (le backend ne les supporte pas encore).
- [ ] **Recherche par type de propriété** – Le filtre type existe côté UI mais le backend ne supporte pas ce paramètre dans `/api/listings/search`.
- [ ] **Avis (Reviews)** – La page PropertyDetails n'affiche pas encore les avis. Brancher sur `GET /api/reviews/listing/{id}` et ajouter un formulaire pour poster un avis.
- [ ] **Upload d'images** – AddPropertyPage utilise des images de démo. Implémenter un vrai upload quand le backend aura un endpoint dédié.
- [ ] **Notifications** – Aucun système de notifications en temps réel (nouvelles réservations, messages, changements de statut).
- [ ] **Dashboard Admin** – Les vues admin (AdminView.jsx) utilisent des données mockées. Brancher sur les endpoints admin.
- [ ] **Messagerie temps réel** – Actuellement en polling REST (inbox/outbox). Passer en WebSocket quand le backend le supportera.

### Améliorations techniques
- [ ] **Gestion d'erreurs globale** – Ajouter des toasts/notifications d'erreur quand les appels API échouent.
- [ ] **Loading states** – Certaines pages affichent un spinner, d'autres pas encore (WishlistPage, SettingsPage, ProfilePage).
- [ ] **Pagination** – Le bouton "Voir plus de propriétés" dans PropertyGrid ne fait rien. Implémenter la pagination quand le backend la supportera.
- [ ] **Validation formulaires** – Renforcer la validation côté client (dates, prix, champs obligatoires).
- [ ] **Code splitting** – Le bundle fait 552 KB. Utiliser `React.lazy()` et `import()` dynamiques pour les routes.

---

## Backend – Ce qu'il faut implémenter / corriger

### CRITIQUE (bloquant)

| # | Tâche | Détail |
|---|-------|--------|
| 1 | **Ajouter le port 5174 au CORS** | `WebConfig.java` autorise `5173, 3000–3002` mais Vite tourne souvent sur **5174**. Ajouter ce port ou utiliser un wildcard en dev. |
| 2 | **Enrichir l'entité Property** | `Property.java` n'a que `id, title, description, location, pricePerNight, images, hostId, createdAt`. **Il manque** : `bedrooms`, `bathrooms`, `area`, `type`, `rating`, `amenities`, `available`, `currency`, `badge`. Mettre à jour `PropertyRequest` et `PropertyResponse` aussi. |
| 3 | **Endpoint upload d'images** | Les propriétés acceptent des URLs mais il n'y a aucun endpoint pour uploader des fichiers et obtenir des URLs. Ajouter `POST /api/upload` ou `POST /api/listings/{id}/images`. |
| 4 | **Enrichir BookingResponse** | `BookingResponse` ne retourne que `id, listingId, guestId, checkInDate, checkOutDate, status`. **Il manque** : `totalPrice`, titre/image/localisation de la propriété, `guestCount`, `createdAt`. Le frontend doit faire N+1 appels pour résoudre les infos propriétés. |
| 5 | **Endpoint "mes propriétés" pour les hôtes** | Actuellement le seul moyen est `GET /api/listings` (retourne TOUT) puis filtrer côté client par `hostId`. Ajouter `GET /api/listings/mine`. |
| 6 | **AuthController utilise `UserDto` au lieu de `RegisterRequest`** | `RegisterRequest.java` existe avec un champ `name` mais le controller prend `UserDto` (qui a `fullName`). Standardiser. |

### IMPORTANT (fonctionnalités essentielles manquantes)

| # | Tâche | Détail |
|---|-------|--------|
| 7 | **Profil utilisateur étendu** | L'entité `User` ne stocke que `name, email, password, role`. **Il manque** : `phone`, `bio`, `avatar`, `username`, `city`. |
| 8 | **`UpdateUserProfileRequest` trop limité** | Ne permet de mettre à jour que `fullName`. Ajouter les autres champs profil. |
| 9 | **Endpoint changement de mot de passe** | Ajouter `PUT /api/users/me/password` avec vérification de l'ancien mot de passe. |
| 10 | **Fonctionnalité Favoris/Wishlist** | Aucune entité ni endpoint pour les favoris. Créer `Favorite` (userId, listingId) + endpoints CRUD. |
| 11 | **Prix sur les réservations** | Le backend ne stocke aucun prix sur les bookings. Le frontend calcule `prix × nuits` mais ce n'est ni persisté ni validé côté serveur. Ajouter `totalPrice` à `Booking`. |
| 12 | **Nombre de voyageurs** | `BookingRequest` et `Booking` n'ont pas de champ `guests`. |
| 13 | **Timestamp `createdAt` sur Booking** | Impossible de montrer quand une réservation a été faite. |
| 14 | **Statuts manquants dans BookingStatus** | L'enum n'a que `PENDING, CONFIRMED, CANCELLED`. Ajouter `COMPLETED` et `REJECTED` pour que l'hôte puisse marquer une réservation terminée ou la refuser. |

### NICE TO HAVE

| # | Tâche | Détail |
|---|-------|--------|
| 15 | **Messagerie WebSocket** | Les messages utilisent du REST polling. Ajouter un support WebSocket pour le chat en temps réel. |
| 16 | **Notifications** | Notifications push/in-app pour nouvelles réservations, messages, changements de statut. |
| 17 | **Validation avis ↔ réservation** | N'importe qui peut poster un avis. Vérifier que le reviewer a une réservation terminée. |
| 18 | **Données dashboard admin** | `AdminController` peut lister/bannir des utilisateurs et lister les réservations mais ne fournit aucune statistique (revenus, croissance, etc.). |
| 19 | **Champ `available` sur Property** | Pas de moyen de marquer une propriété comme indisponible/masquée. |
| 20 | **Recherche par type** | `GET /api/listings/search` ne supporte que `location, minPrice, maxPrice, available`. Ajouter un filtre `type`. |
| 21 | **Pagination & tri** | Les endpoints liste retournent tout sans pagination. Ajouter `page`, `size`, `sort` sur `/api/listings` et `/api/bookings/*`. |
