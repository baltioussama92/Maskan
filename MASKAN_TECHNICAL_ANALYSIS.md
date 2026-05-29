# Maskan Technical Analysis

## 1. Technologies & Architecture (Global Overview)

### Tech Stack
- Frontend:
  - Language: JavaScript (ESM)
  - Framework: React 18 + React Router
  - Build tool: Vite 5
  - Styling: Tailwind CSS 3 + PostCSS + Autoprefixer
  - UI/UX libs: Framer Motion, Lucide React
  - Maps: MapLibre GL + react-map-gl
  - QR: @yudiel/react-qr-scanner, qrcode.react
  - HTTP: Axios (with auth interceptor)
- Backend:
  - Language: Java 17
  - Framework: Spring Boot 3.2
  - Security: Spring Security + JWT (JJWT) + BCrypt
  - Validation: Jakarta Validation
  - Email: Spring Boot Mail
  - Build tool: Maven
- Database:
  - MongoDB (Spring Data MongoDB)

### Architecture Pattern
- Client-Server architecture with a RESTful API.
- Backend layered structure: Controller -> Service -> Repository -> MongoDB.
- Stateless authentication using JWT Bearer tokens.
- Role-Based Access Control (RBAC) enforced with `@PreAuthorize`.
- CORS configured for frontend dev origins.
- Local file storage for uploads (property images and verification docs) served via `/uploads/**`.

## 2. Actors & Use Cases (For "Use Case Diagrams")

### Actors
- Guest (Tenant)
- Host (Proprietor)
- Admin
- System (notifications, security, verification, scheduled/automated actions)

### Guest / Tenant Use Cases
- Register and Login
- Browse and search listings (simple and advanced filters)
- View listing details
- Request a booking
- Pay for booking (checkout)
- Receive check-in QR secret
- View bookings and booking status
- Cancel booking (if guest)
- Verify eligibility and submit reviews
- Manage wishlist
- Send/receive messages (when booking relationship exists)
- Submit KYC: email OTP + identity document upload
- Open support tickets
- Manage profile, password, and preferences

### Host / Proprietor Use Cases
- Submit host verification request
- Create, update, delete listings
- View own listings
- Accept or reject booking requests
- Validate check-in (QR handshake)
- View owner bookings and guest details
- Communicate with guests
- Manage profile and preferences

### Admin Use Cases
- List and manage users (block/ban/delete/update/reset password)
- Review user history, messages, listings, bookings, earnings
- Approve/reject guest verification
- Approve/reject host demands
- Moderate pending listings
- View global bookings and growth metrics
- Manage reports and moderation actions
- Manage support tickets
- Manage finance dashboards and exports
- Manage site settings, content, and notification templates

### System Use Cases
- Issue JWT on auth
- Enforce RBAC and session statelessness
- Send internal notifications
- Generate payment intent and QR secret
- Store uploaded files and serve via `/uploads/**`

## 3. Domain Model & Entities (For "Class Diagrams")

### Core Entities (MongoDB)

#### User
- Attributes: `id`, `name`, `username`, `email`, `password`, `role`, `createdAt`, `isVerified`, `banned`, `avatar`, `phone`, `bio`, `city`, `wishlistListingIds`, `preferences`, `emailVerified`, `phoneVerified`, `identityStatus`, `verificationLevel`, `rejectionReason`, `governmentIdFiles`, `otherAttachmentFiles`, `selfieFile`, `identitySubmittedAt`.
- Relationships:
  - User (Host) owns many Properties (via `hostId`).
  - User (Guest) owns many Bookings (via `guestId`).
  - User has many Messages (sender or receiver).
  - User has many Notifications (recipient).
  - User has many ConnectionRequests (requester or receiver).
  - User has many PaymentMethods.
  - User has many SupportTickets (requester).

#### UserPreferences (embedded)
- Attributes: `language`, `currency`, `notifications` (bookings, messages, marketing, news), `privacy` (showProfile, showActivity, allowMessages).

#### Property
- Attributes: `id`, `title`, `description`, `location`, `latitude`, `longitude`, `pricePerNight`, `currency`, `images`, `hostId`, `createdAt`, `available`, `type`, `badge`, `bedrooms`, `bathrooms`, `area`, `houseRules`, `amenities`, `rating`, `reviewCount`, `pendingApproval`.
- Relationships:
  - Property belongs to User (Host) via `hostId`.
  - Property has many Bookings.
  - Property has many Reviews.

#### Booking
- Attributes: `id`, `listingId`, `guestId`, `checkInDate`, `checkOutDate`, `status`, `guests`, `createdAt`, `totalPrice`, `stripePaymentIntentId`, `checkInSecretCode`.
- Relationships:
  - Booking belongs to one Property (`listingId`).
  - Booking belongs to one User (Guest) (`guestId`).
- Status lifecycle: `PENDING -> AWAITING_PAYMENT -> PAID_AWAITING_CHECKIN -> COMPLETED` (with `REJECTED`, `CANCELLED` as terminal branches).

#### Review
- Attributes: `id`, `listingId`, `guestId`, `authorId`, `authorRole`, `rating`, `comment`, `targetType`, `createdAt`.
- Relationships:
  - Review belongs to one Property (`listingId`).
  - Review belongs to one User (`guestId`, `authorId`).

#### Message
- Attributes: `id`, `senderId`, `receiverId`, `content`, `createdAt`.
- Relationships:
  - Message links two Users.

#### Notification
- Attributes: `id`, `recipientId`, `title`, `message`, `type`, `isRead`, `createdAt`.
- Relationships:
  - Notification belongs to one User (`recipientId`).

#### ConnectionRequest
- Attributes: `id`, `requesterId`, `receiverId`, `status`, `createdAt`, `respondedAt`.
- Relationships:
  - ConnectionRequest links two Users.

#### PaymentMethod
- Attributes: `id`, `userId`, `cardholderName`, `brand`, `last4`, `expMonth`, `expYear`, `isDefault`, `createdAt`.
- Relationships:
  - PaymentMethod belongs to one User (`userId`).

#### SupportTicket
- Attributes: `id`, `requesterId`, `subject`, `priority`, `status`, `assigneeId`, `createdAt`, `updatedAt`, `messages` (embedded).
- Relationships:
  - SupportTicket belongs to one User (`requesterId`).

### Admin Domain Entities
- AdminSettings: platform configs (commission, currency, language, toggles, branding, email config).
- AdminReport: user reports with evidence, internal notes, decision metadata.
- AdminNotificationTemplate: templates for admin broadcast.
- AdminNotificationHistory: audit of admin notifications.
- AdminContent: CMS-like content (home banner, FAQ, terms, privacy policy).
- AdminChatModerationAction: moderation actions on conversations.

## 4. Core Business Logic & Workflows (For "Activity Diagrams")

### A) Booking and Payment Process (to `PAID_AWAITING_CHECKIN`)
1. Guest selects dates in React UI and submits a booking request.
2. Frontend calls `POST /api/bookings` with `listingId`, `checkInDate`, `checkOutDate`, and optional `guests`.
3. `BookingController.create` delegates to `BookingServiceImpl.createBooking`.
4. Service checks:
   - `checkOutDate` must be after `checkInDate`.
   - Guest has no active confirmed booking (`ensureGuestHasNoActiveConfirmedBooking`).
   - No overlapping booking exists for statuses: `PENDING`, `CONFIRMED`, `AWAITING_PAYMENT`, `PAID_AWAITING_CHECKIN`.
5. Service computes `totalPrice = pricePerNight * days * guests`.
6. Booking is stored with `status = PENDING`.
7. System sends an internal notification to the Host using `sendInternalNotification`.
8. Host accepts booking via `PATCH /api/bookings/{id}/status` with status `CONFIRMED`.
9. Service converts `CONFIRMED` to `AWAITING_PAYMENT` and notifies guest.
10. Guest pays via `POST /api/payments/checkout/{bookingId}`.
11. `PaymentServiceImpl.checkout` validates guest ownership and status `AWAITING_PAYMENT`.
12. Payment is simulated (creates `stripePaymentIntentId`) and generates `checkInSecretCode`.
13. Booking status becomes `PAID_AWAITING_CHECKIN`.

### B) QR Code Handshake / Check-in Validation (Escrow release)
1. After payment, guest receives `checkInSecretCode` from checkout response.
2. Guest presents QR code/secret at check-in.
3. Host submits verification via `POST /api/bookings/{id}/verify-checkin` with `secretCode`.
4. `BookingServiceImpl.verifyCheckIn` verifies:
   - Host role and ownership of listing.
   - Booking status is `PAID_AWAITING_CHECKIN`.
   - Secret matches `checkInSecretCode`.
5. Booking status becomes `COMPLETED`.
6. Response indicates payout triggered (logical escrow release).

### C) KYC Verification Process (Email OTP + Document Upload)
#### Email OTP
1. Guest requests OTP via `POST /api/verifications/email/send-otp`.
2. `EmailVerificationController.sendOtp` verifies user identity and email match.
3. A new OTP token is stored in `email_verification_tokens` with 15-minute expiry.
4. `EmailService.sendOtpHtmlEmail` sends the OTP by email.
5. Guest submits OTP via `POST /api/verifications/email/verify-otp`.
6. Token validity is checked, then `emailVerified = true` and `verificationLevel` updated.

Note: Phone OTP endpoints exist under `/api/verifications/guest/phone/*` but are currently disabled and return an error.

#### Document Upload (Guest Identity)
1. Guest uploads government ID + selfie via `POST /api/verifications/guest/identity` (multipart).
2. Files are stored under `uploads/verifications/<userId>/`.
3. User identity fields updated: `identityStatus = pending`, files stored, `identitySubmittedAt` set.
4. Verification level is recalculated.
5. Admin later approves or rejects:
   - Approve: `PATCH /api/admin/guest-verifications/{userId}/approve`
   - Reject: `PATCH /api/admin/guest-verifications/{userId}/reject`

## 5. System Interactions (For "Sequence Diagrams")

### Sequence: Guest Books a Property
1. React UI collects booking details and calls Axios client.
2. Axios sends `POST /api/bookings` with JWT in `Authorization: Bearer <token>`.
3. Spring Security filter chain:
   - `JwtAuthenticationFilter` extracts and validates JWT.
   - `SecurityConfig` enforces authentication and role checks.
4. `BookingController.create` receives request.
5. `BookingServiceImpl.createBooking`:
   - Validates dates and overlap.
   - Computes total price.
   - Saves Booking in MongoDB via `BookingRepository`.
   - Sends internal notification to host.
6. MongoDB returns saved Booking.
7. Controller returns `BookingResponse`.
8. Frontend updates local state (booking list, status, UI confirmation).

### Key Methods Referenced in Flows
- Booking: `createBooking`, `updateStatus`, `verifyCheckIn`, `getUnavailableDateRangesForListing`.
- Payment: `checkout`.
- Reviews: `canUserReviewProperty`, `createReview`.
- Notifications: `sendInternalNotification`, `markAsRead`, `markAllAsRead`.
- Verification: `sendOtp`, `verifyOtp`, `submitIdentity`.
- Messaging: `send`, `conversation`, `conversations`.

## 6. Project inventory, scripts and how to run (practical)

- **Backend:** located in the `Backend/` folder. Uses Maven (wrapper included: `mvnw`, `mvnw.cmd`) and targets Java 17 / Spring Boot 3.2.
  - Run locally (Windows PowerShell):

    ```powershell
    .\Backend\mvnw.cmd spring-boot:run
    ```

  - Or package and run the jar:

    ```powershell
    .\Backend\mvnw.cmd -DskipTests package
    java -jar Backend\target\*.jar
    ```

- **Frontend:** located in the `Frontend/` folder. Uses Node + npm and Vite 5.
  - Run locally:

    ```bash
    cd Frontend
    npm install
    npm run dev
    ```

- **Seed data & uploads:** seed scripts and sample data live under `Backend/scripts/` and `Backend/uploads/`. Use `Backend/seed-admin.ps1` to create an admin account and demo data.
- **Configuration:** backend properties in `Backend/src/main/resources/application.properties`. CORS is configured for typical dev origins used by the frontend.
- **Tests:** backend unit/integration tests under `Backend/src/test`. Run:

  ```powershell
  .\Backend\mvnw.cmd test
  ```

## 7. Notable implementation details and limitations

- **OTP handling:** OTP tokens are stored and compared as strings to preserve leading zeros and avoid conversion errors.
- **Phone OTP:** phone OTP endpoints exist but are intentionally disabled in the current codebase; a WhatsApp/Twilio sandbox integration is included in the design and can be enabled when credentials are provided.
- **Payments:** `stripePaymentIntentId` is currently simulated for demo/testing; the code generates a `checkInSecretCode` used by the QR handshake. Integrate a live payment gateway (Stripe) by replacing the simulated payment provider implementation.
- **File storage:** uploaded files are stored locally under `Backend/uploads/` and are served via `/uploads/**` static mapping in the backend.
- **WebSocket auth:** STOMP sessions authenticate using the same JWT used by REST calls; message persistence is stored in MongoDB for chat history and auditing.
- **Seed realism:** seeded data includes Tunisian locations (La Marsa, Les Berges du Lac, Sidi Bou Saïd, Hammamet, Sousse) to support realistic demos.

## 8. Suggested documentation improvements (quick wins)

- Add `README_RUN.md` files to both `Backend/` and `Frontend/` with the commands above, environment variable descriptions, and expected ports.
- Add a `docker-compose.yml` to orchestrate MongoDB + Backend + Frontend for reproducible demos.
- Document any environment variables expected by the backend (SMTP, JWT signing key, Twilio credentials, Stripe keys) in a `.env.example` or in the `Backend/README_RUN.md`.

---

Si vous voulez, je peux générer automatiquement le `README_RUN.md` pour chaque service ou créer un `docker-compose.yml` pour lancer une démo complète. Laquelle préférez-vous ?
