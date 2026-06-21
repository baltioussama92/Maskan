# Maskan - API Documentation (Spring Boot + MongoDB)

## API Base
- Base URL (local): `https://maskan-xzpw.onrender.com/api`
- Auth: JWT Bearer token via `Authorization: Bearer <token>` for protected endpoints
- Roles used in RBAC: `TENANT` (`GUEST` alias), `PROPRIETOR` (`HOST` alias), `ADMIN`

## Comprehensive Endpoint Table

| Domain | HTTP Method | Endpoint URL | Description | Required Role / Auth | Expected Status |
|---|---|---|---|---|---|
| Authentication | POST | `/auth/register` | Register new account and return JWT | Public | `201 Created` |
| Authentication | POST | `/auth/login` | Authenticate user and return JWT | Public | `200 OK` |
| Authentication | GET | `/auth/me` | Return current authenticated user profile | Authenticated | `200 OK` |
| Users / Profile | GET | `/users/me` | Get connected user profile details | Authenticated | `200 OK` |
| Users / Profile | PUT | `/users/me` | Update connected user profile | Authenticated | `200 OK` |
| Properties | GET | `/listings` | Get all properties | Public | `200 OK` |
| Properties | GET | `/listings/{id}` | Get property by ID | Public | `200 OK` |
| Properties | POST | `/listings` | Create property | `PROPRIETOR` | `201 Created` |
| Properties | PUT | `/listings/{id}` | Update property (owner/admin) | `PROPRIETOR` / `ADMIN` | `200 OK` |
| Properties | DELETE | `/listings/{id}` | Delete property (owner/admin) | `PROPRIETOR` / `ADMIN` | `204 No Content` |
| Properties | GET | `/listings/owner/me` | Get current proprietor properties | `PROPRIETOR` / `ADMIN` | `200 OK` |
| Properties / Search | GET | `/listings/search` | Search by location, price range, availability + optional advanced params | Public | `200 OK` |
| Properties / Search | GET | `/listings/search/advanced` | Advanced search (location + dates + price + type + bedrooms + amenities) | Public | `200 OK` |
| Uploads | POST | `/uploads/images` | Upload property image (multipart file) and return public URL | `PROPRIETOR` / `ADMIN` | `201 Created` |
| Bookings | POST | `/bookings` | Create reservation | `TENANT` | `200 OK` |
| Bookings | GET | `/bookings/me` | Get tenant reservations | `TENANT` | `200 OK` |
| Bookings | GET | `/bookings/owner` | Get proprietor reservations on own listings | `PROPRIETOR` / `ADMIN` | `200 OK` |
| Bookings | PUT | `/bookings/{id}/status` | Update booking status (`CONFIRMED`, `REJECTED`, etc.) | `PROPRIETOR` / `ADMIN` | `200 OK` |
| Bookings | DELETE | `/bookings/{id}` | Cancel reservation | `TENANT` / `ADMIN` | `204 No Content` |
| Reviews | POST | `/reviews` | Add a property review | `TENANT` | `200 OK` |
| Reviews | GET | `/reviews/listing/{listingId}` | List reviews by property | Public | `200 OK` |
| Messaging | POST | `/messages` | Send a message to another user | Authenticated | `200 OK` |
| Messaging | GET | `/messages/inbox` | List received messages | Authenticated | `200 OK` |
| Messaging | GET | `/messages/sent` | List sent messages | Authenticated | `200 OK` |
| Messaging | GET | `/messages/conversations` | List conversation summaries (last message per contact) | Authenticated | `200 OK` |
| Messaging | GET | `/messages/conversations/{userId}` | Get full conversation with user | Authenticated | `200 OK` |
| Wishlist | GET | `/wishlist` | Get wishlist properties | Authenticated | `200 OK` |
| Wishlist | POST | `/wishlist/{listingId}` | Add property to wishlist | Authenticated | `200 OK` |
| Wishlist | DELETE | `/wishlist/{listingId}` | Remove property from wishlist | Authenticated | `200 OK` |
| Dashboard | GET | `/dashboard/tenant/summary` | Tenant dashboard aggregates | `TENANT` | `200 OK` |
| Dashboard | GET | `/dashboard/host/summary` | Proprietor dashboard aggregates | `PROPRIETOR` / `ADMIN` | `200 OK` |
| Dashboard | GET | `/dashboard/admin/summary` | Admin global dashboard summary | `ADMIN` | `200 OK` |
| Admin | GET | `/admin/users` | List all users | `ADMIN` | `200 OK` |
| Admin | PUT | `/admin/users/{id}/ban` | Ban a user account | `ADMIN` | `200 OK` |
| Admin | GET | `/admin/bookings` | List all bookings | `ADMIN` | `200 OK` |
| Admin | GET | `/admin/pending-listings` | List properties pending approval | `ADMIN` | `200 OK` |
| Admin | GET | `/admin/growth-metrics` | Get growth and platform metrics | `ADMIN` | `200 OK` |
| Admin | GET | `/admin/stats` | Alias endpoint for admin stats dashboards | `ADMIN` | `200 OK` |

## Missing Links Identified During Frontend Audit

The following backend links were identified as commonly needed by a real-estate React frontend and are now covered by the API:

1. **Image Upload (Multipart)**
   - Added: `POST /api/uploads/images`
   - Supports `multipart/form-data` (`file` field)

2. **Complex Search Filters (single query endpoint)**
   - Added/extended: `GET /api/listings/search` and `GET /api/listings/search/advanced`
   - Supports combining: `location`, `checkInDate`, `checkOutDate`, `minPrice`, `maxPrice`, `type`, `bedrooms`, `amenities`, `available`

3. **Admin Dashboard Stats Endpoint**
   - Existing metric endpoint: `GET /api/admin/growth-metrics`
   - Added compatibility alias: `GET /api/admin/stats`

4. **Real-time Conversations Structure (REST polling compatible)**
   - Added: `GET /api/messages/conversations`
   - Added: `GET /api/messages/conversations/{userId}`

## Notes for Report (PFE)
- API is RESTful with plural resources and standard HTTP verbs.
- RBAC is enforced with `@PreAuthorize`.
- Role names in frontend (`TENANT`, `PROPRIETOR`) are mapped to backend persisted roles (`GUEST`, `HOST`) through authority aliases.
- Uploaded files are served under `/uploads/**`.
