# MASKAN Final Thesis Chapter

## 1. General Introduction and System Architecture

Maskan is a secure, full-stack real-time property rental marketplace designed for the Tunisian context. The platform addresses the practical needs of digital accommodation discovery, host onboarding, identity verification, booking coordination, and structured communication between guests and hosts. From an architectural perspective, the system was deliberately organized as a multi-layer web application in order to separate concerns, improve maintainability, and support future evolution without destabilizing the existing business logic.

Note: the implementation uses concrete technologies and versions documented in the repository: React 18, Vite 5, Tailwind CSS 3, Java 17, Spring Boot 3.2, MongoDB, and related libraries (JJWT for JWT handling, BCrypt for password hashing, Spring Mail for email, Spring Data MongoDB, Spring WebSocket/STOMP).

The solution follows a classical three-tier arrangement. The presentation layer is implemented in React and is responsible for the interactive user experience, routing, and responsive rendering. The application layer is implemented in Spring Boot and concentrates all domain services, security decisions, workflow orchestration, and administrative operations. The persistence layer is based on MongoDB and stores heterogeneous domain documents in a form that matches the flexibility required by a marketplace platform.

### 1.1 Frontend Architecture

The frontend is a single-page application built around reusable components, route-based composition, and context-driven state management. Its architecture is intentionally modular so that authentication, property discovery, booking flows, messaging, notifications, and profile management can evolve independently.

The frontend stack is centered on React, Vite, Tailwind CSS, and Framer Motion. React provides the component-driven user interface, Vite ensures fast local development and efficient bundling, Tailwind CSS establishes a utility-based design system, and Framer Motion is used to deliver premium animations, subtle transitions, and polished page entrances. The frontend also integrates mapping (MapLibre GL + react-map-gl), QR scanning/encoding libraries (used for check-in flows), and an Axios HTTP client configured with authentication interceptors.

Frontend performance was treated as a design objective: route-level lazy loading, memoization of expensive views, and optimized asset handling keep the UI responsive on large property lists and dashboards.

### 1.2 Backend Architecture

The backend stack is based on Spring Boot 3.2, Spring Security, Spring Web, Jakarta Validation, Spring Data MongoDB, Spring WebSocket (STOMP), Spring Mail, and asynchronous service execution (@Async). Authentication uses signed JWT tokens (JJWT) and BCrypt for password hashing. Together, these modules support the application’s public APIs, protected endpoints, real-time messaging, verification flows, and notification delivery. The backend was structured around thin controllers and expressive services so that the core business rules remain readable and easy to defend academically.

Security is stateless: JWTs are validated on every request and are also used to authenticate WebSocket (STOMP) sessions, ensuring a coherent identity model across REST and real-time traffic.

### 1.3 Data Architecture

MongoDB is used as the persistence engine because the project manipulates multiple document categories with different lifecycles: users, properties, bookings, host verification requests, messages, reviews, notifications, and verification tokens. The repository contains seed scripts and example data to populate realistic Tunisian locations for demonstrations.

Collections are arranged to reflect domain boundaries and to support selective denormalization (e.g., aggregated rating values stored on property documents for fast reads).

## 2. Deep-Dive Functional Workflows and Technical Logic

### 2.1 Host Verification and KYC Automated Lifecycle

The host verification workflow is one of the most important administrative processes in Maskan because it governs who can publish properties and act as a host. The implementation follows a controlled KYC-style lifecycle in which the user first submits verification evidence and the administrator later validates the request.

When a user submits a host verification request, the backend stores the uploaded documents under `Backend/uploads/verifications/<userId>/`, records the request in the `host_verifications` collection, and marks the user identity state as pending. The approval phase is handled by an administrator action that atomically updates the verification status and the user's role.

Implementation note: email OTP endpoints and multipart identity upload endpoints are implemented; phone OTP endpoints exist but are currently disabled in the backend and return a controlled error response. The design includes an omnichannel WhatsApp/Twilio sandbox integration for phone-based OTP delivery when enabled.

### 2.2 Double-Payment and Check-in Handshake Workflow

The booking lifecycle in Maskan is intentionally designed as a transactional pipeline rather than a simple reservation record. The platform supports a CARD flow (online payment, escrow-like intent stored) and a CASH flow (reservation without immediate online settlement). Both converge at the check-in handshake which is validated using a `checkInSecretCode` (QR or code exchange).

Typical implemented lifecycle: `PENDING -> CONFIRMED -> AWAITING_PAYMENT -> PAID_AWAITING_CHECKIN -> COMPLETED` (terminal states include `CANCELLED` and `REJECTED`). For demo purposes the `stripePaymentIntentId` is simulated in code; replacing with a live payment gateway is straightforward given the stored intent abstraction.

### 2.3 Real-Time WebSocket Messaging Pipeline

The messaging subsystem uses Spring WebSocket + STOMP to enable persistent bidirectional connections and low-latency communication. Messages are persisted to MongoDB for history and audit. JWT authentication is re-used to authenticate socket sessions and enforce permissions.

### 2.4 Omnichannel WhatsApp Verification Gateway

Phone verification is designed to use WhatsApp (Twilio sandbox) to deliver OTPs efficiently in the Tunisian market (+216). This reduces SMS costs and leverages a channel widely adopted by target users.

### 2.5 Event-Driven Notification Engine

Maskan persists internal notification records and sends HTML email notifications asynchronously using Spring Mail. Email dispatch is decoupled from request threads via `@Async` so that API responsiveness is not impacted by external mail latency.

### 2.6 Interactive Review and Star Rating System

Review creation updates property aggregates (average rating and review count) eagerly to enable O(1) display of ratings on property cards and lists. This design optimizes read-heavy exploration pages at the cost of slightly more expensive writes, which is appropriate for the application's access patterns.

## 3. Technical Optimizations and Database Engineering

### 3.1 Performance Architecture

Indexes are applied to common query fields (location coordinates, price ranges, availability, host ownership, booking state) to ensure scalable discovery performance. Frontend lazy loading, route splitting, and memoization complement database indexing to deliver a smooth UX.

### 3.2 Robustness and Validation

OTP tokens are treated as strings to preserve leading zeros. Inputs are sanitized and validated early to prevent malformed data from reaching backend flows.

### 3.3 Seeded Production Data

Seed scripts and sample data provide realistic Tunisian locations (La Marsa, Les Berges du Lac, Sidi Bou Saïd, Hammamet, Sousse) to support demonstrations and jury evaluation. See `Backend/scripts/` and helper PowerShell `seed-admin.ps1`.

## 4. Implementation Conclusion and Next Steps

Maskan was developed as a complete full-stack platform that combines secure authentication, marketplace discovery, host onboarding, verification workflows, messaging, booking lifecycle management, notifications, and database optimization. From a methodological point of view, the implementation relied on a layered architecture, domain-driven service decomposition, stateless security, asynchronous event handling, and document-oriented persistence.

Future work could extend Maskan with automated financial ledgers for advanced reconciliation, machine-learning-based recommendation, reputation scoring, fraud detection, and richer analytics dashboards. These evolutions would build naturally on the current architecture.

## 5. Project inventory, scripts and how to run (practical)

- **Backend:** `Backend/` — Maven wrapper included (`mvnw`, `mvnw.cmd`). Java 17 / Spring Boot 3.2.
  - Run: `./mvnw spring-boot:run` (Linux/macOS) or `mvnw.cmd spring-boot:run` (Windows).
  - Tests: `./mvnw test`.
- **Frontend:** `Frontend/` — Node + npm, Vite 5.
  - `cd Frontend`
  - `npm install`
  - `npm run dev`
- **Seeds & uploads:** `Backend/scripts/`, `Backend/uploads/`, `seed-admin.ps1` exist to create demo data and an admin account.
- **Configuration:** Backend properties in `src/main/resources/application.properties` (and `target/classes/application.properties` after build). CORS is configured for local dev origins used by the frontend.

## 6. Notable implementation details and limitations

- OTP values stored as strings (no integer coercion).
- Phone OTP endpoints are present but disabled in current code; WhatsApp/Twilio integration is the designed channel.
- Payment intents are simulated for demos (`stripePaymentIntentId` placeholder). Replace with Stripe SDK for production.
- Uploaded files are stored locally under `Backend/uploads/` and served via `/uploads/**`.

## 7. Small editorial and documentation updates made

- Added explicit technology versions and key libraries used.
- Documented practical run instructions and seed utilities.
- Noted implemented booking state machine and demo payment behaviour.

---

Si vous souhaitez, je peux:
- ajouter un `README_RUN.md` par service avec commandes détaillées,
- ou bien créer un `docker-compose.yml` pour monter MongoDB + backend + frontend pour une démo reproductible.

Lequel préférez-vous pour la prochaine étape ?
