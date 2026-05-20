# MASKAN Final Thesis Chapter

## 1. Updated System Architecture & Tech Stack

Maskan has been implemented as a **full-stack client-server application** built around a **REST API** and a **stateless authentication model based on JWT**. The system separates the presentation layer from the business layer, which improves maintainability, testability, and deployment flexibility. The frontend communicates with the backend exclusively through HTTP requests, while real-time features are handled through a dedicated WebSocket channel secured with the same JWT-based identity model.

At the architectural level, the solution follows three complementary layers:

- **Presentation layer**: the web client renders the user experience, handles routing, and manages local UI state.
- **Application layer**: the Spring Boot backend exposes domain services, security rules, booking logic, notification orchestration, and administrative operations.
- **Persistence layer**: MongoDB stores users, properties, bookings, verifications, notifications, messages, and related documents as native JSON-like records.

### Frontend Stack

The frontend is a modern single-page application built with **React** and **Vite**. The current workspace declares **React 18.3.1** in the package manifest, and the codebase is already structured with the same modern React patterns typically used in React 19-oriented projects, including component-level lazy loading, memoized derived state, and Suspense-based route boundaries.

The main frontend technologies are:

- **React** for component-driven UI composition.
- **Vite** for fast development startup and optimized production bundling.
- **Tailwind CSS** for utility-first styling.
- **Framer Motion** for animated page transitions, entrance effects, and polished micro-interactions.
- **SockJS and STOMP client support** for real-time communication.
- **Axios** and custom API clients for typed and centralized HTTP access.

The UI also includes a dedicated **theme subsystem** that supports both light and dark modes. Theme state is persisted locally and applied globally through the document root, making the interface compatible with dark-mode usage without duplicating component logic.

### Backend Stack

The backend is based on **Spring Boot 3.2.5** running on **Java 17**. The server-side ecosystem includes:

- **Spring Web** for REST endpoints.
- **Spring Security** for authentication and authorization.
- **JWT** for stateless bearer-token sessions.
- **Spring Data MongoDB** for document persistence.
- **Spring WebSocket** for real-time messaging.
- **Spring Validation** for request constraints and input integrity.
- **Spring Mail** for SMTP-based email delivery.
- **Spring Cache** for targeted read optimization.

The backend is organized around a service-oriented design. Controllers are thin, while the main business rules are implemented in service classes such as booking, payment, admin, verification, and notification services. This separation is especially important in a graduation project because it makes the domain logic readable and easier to justify in an architectural defense.

### Database Stack

The persistence layer is based on **MongoDB**, which is well aligned with the application domain because Maskan manipulates heterogeneous records: users, listings, bookings, KYC documents, notifications, and chat messages. MongoDB is used not only as a document store, but also as a performance enabler through field indexes and compound indexes on the most frequently queried attributes.

The main collections include:

- **users**
- **properties**
- **bookings**
- **host_verifications**
- **notifications**
- **messages**
- **email_verification_tokens**

### Security Model

Authentication is fully **stateless**. After login, the client stores a JWT and sends it as a Bearer token on each API request. The backend validates the token on every call, reconstructs the user identity, and authorizes access based on the embedded role and the current security context. This design avoids server-side session storage and supports horizontal scalability.

For WebSocket connections, the client also sends the JWT in the STOMP connection headers. The server authenticates the socket session during the CONNECT phase, which keeps real-time messaging aligned with the same identity rules as the REST API.

---

## 2. Core Workflows & Logic Specification

### 2.1 The Double-Payment & Handshake Workflow

This workflow is the most critical transactional path in the platform because it links payment, check-in verification, booking finalization, and payout readiness.

#### A. Booking creation phase

1. The guest submits a booking request with check-in and check-out dates, number of guests, and a payment method.
2. The backend validates that the check-out date is strictly after the check-in date.
3. The system loads the target property and resolves the authenticated guest.
4. The booking engine checks that the guest does not already have an active confirmed booking that conflicts with the requested period.
5. The system checks whether the property is already reserved for overlapping dates in one of the blocking statuses: **PENDING**, **CONFIRMED**, **AWAITING_PAYMENT**, **AWAITING_CHECKIN**, or **PAID_AWAITING_CHECKIN**.
6. A new booking record is created with status **PENDING**.
7. If no payment method is explicitly provided, the booking defaults to **CARD**.
8. The booking is stored in MongoDB and an internal notification is sent to the host to inform them that a new request has arrived.

#### B. Host decision phase

1. The host or administrator reviews the booking.
2. When the host confirms the booking, the system branches according to the payment method.

#### C. CARD flow

1. If the booking is marked for **CARD**, the host confirmation changes the booking state to **AWAITING_PAYMENT**.
2. The guest is then redirected to the payment checkout process.
3. During checkout, the payment service generates a simulated Stripe-like payment intent identifier and a **checkInSecretCode**.
4. The booking is persisted with status **PAID_AWAITING_CHECKIN**.
5. The response returned to the client contains the booking identifier, the generated payment intent, and the QR secret code.

#### D. CASH flow

1. If the booking is marked for **CASH**, host confirmation does not require online payment.
2. The booking state is moved directly to **AWAITING_CHECKIN**.
3. If the booking does not yet have a secret check-in code, the backend generates one.
4. The code is used later as the digital proof that the guest physically arrived and that the host validated the stay.

#### E. Check-in handshake phase

1. At check-in time, the host scans or receives the guest’s QR code value, which corresponds to the **checkInSecretCode**.
2. The backend verifies that the booking is eligible for handover, meaning that the booking must be in either **AWAITING_CHECKIN** or **PAID_AWAITING_CHECKIN**.
3. The server compares the submitted secret with the stored one.
4. If the secret matches, the booking state is updated to **COMPLETED**.
5. This transition acts as the final immutable receipt of the stay.

#### F. Database impact

The workflow mutates the following booking fields in MongoDB:

- **status**: transitions from PENDING to AWAITING_PAYMENT, AWAITING_CHECKIN, PAID_AWAITING_CHECKIN, and finally COMPLETED.
- **stripePaymentIntentId**: set for paid bookings.
- **checkInSecretCode**: set at payment time or, for cash bookings, at confirmation time when needed.

The important architectural point is that the **checkInSecretCode** behaves as the digital handshake token. It is not a cosmetic field: it is the concrete proof used to close the lifecycle of the booking.

### 2.2 The Host KYC Automated Upgrade

The host verification process is designed as a two-document lifecycle: one document captures the uploaded evidence, while the other reflects the user’s identity and role state.

#### A. Submission phase

1. The authenticated user submits identity documents and ownership proof through the host verification endpoint.
2. The backend stores the uploaded files under a user-specific path in the local upload directory.
3. The user record is updated to mark the identity status as **pending**.
4. The system creates or updates a **HostVerification** document.
5. In this implementation, the verification document reuses the user identifier as its own document identifier, which keeps the administration workflow aligned with the user lifecycle.

#### B. Administrative approval phase

1. The administrator opens the host demand list.
2. The backend loads the corresponding host verification document from the **host_verifications** collection.
3. The verification status is changed to **APPROVED**.
4. The associated user record is loaded from the **users** collection.
5. The user role is promoted from **GUEST** to **HOST**.
6. The user identity status becomes **approved**.
7. The verification level is raised to the highest level used by the application.
8. The verification and user documents are saved.
9. An internal notification is sent to the user to confirm the approval.

#### C. Operational meaning

This workflow is not only a back-office moderation feature. It is a role upgrade pipeline. The business effect is that an approved guest becomes capable of publishing properties, participating as a host, and accessing host-specific dashboards and workflows.

#### D. Database impact

The approval operation writes to two MongoDB documents in a coordinated manner:

- **HostVerification.status** becomes APPROVED.
- **HostVerification.reviewedAt** is timestamped.
- **User.role** becomes HOST.
- **User.identityStatus** becomes approved.
- **User.verificationLevel** becomes 3.
- **User.isVerified** becomes true.

The backend also emits a message reminding that the user should log in again so the JWT role claims can be refreshed. This is a realistic detail for a stateless authentication system, because role changes do not automatically rewrite already-issued tokens.

### 2.3 The Event-Driven Notification Engine

Maskan uses an application-level notification engine that combines **internal notifications** stored in MongoDB and **external HTML emails** sent asynchronously. The result is a system that is responsive for the end user and still rich enough to support operational alerts.

#### A. Internal notifications

1. Domain services call the notification service when significant business events occur.
2. The notification service writes a notification document into MongoDB.
3. Notifications are later retrieved by the recipient through the notification API.
4. Users can mark notifications as read individually or in bulk.

Typical triggers include:

- new booking request,
- booking accepted or rejected,
- payment confirmation,
- password reset or password change alert,
- KYC approval or rejection,
- administrative updates.

#### B. Email notifications

1. For security-sensitive or user-facing events, the backend also sends HTML emails.
2. Email delivery is delegated to methods annotated with **@Async**.
3. The controller thread returns immediately, without waiting for SMTP to finish.
4. The email content is rendered as HTML, which allows branded, readable, and mobile-friendly notification messages.

#### C. Why this design matters

This architecture protects API responsiveness. The HTTP response does not remain blocked while SMTP sends the message. In practice, this means that the application can deliver alerts for security, messaging, support, and platform updates without introducing unnecessary latency in the critical request path.

#### D. Database and runtime impact

- MongoDB persists notification records for traceability and in-app retrieval.
- The mail subsystem sends rich HTML emails for external reach.
- The asynchronous boundary isolates slow I/O from the domain transaction.

---

## 3. Technical Optimizations & Quality Assurance

### Performance

Several engineering decisions were introduced to ensure production-level responsiveness.

#### MongoDB indexing

The data model applies indexes on high-frequency search and filter fields. This is especially important for property discovery and booking management, where the system frequently filters by location, price, availability, host, and booking status.

Examples of indexed attributes include:

- **Property.location**
- **Property.pricePerNight**
- **Property.available**
- **Property.type**
- **Property.bedrooms**
- **Booking.listingId**
- **Booking.guestId**
- **Booking.checkInDate**
- **Booking.checkOutDate**
- **Booking.status**

Compound indexes further improve the performance of booking overlap detection and guest booking retrieval. This is particularly important in a rental marketplace because date conflicts are one of the most expensive consistency checks in the system.

#### React rendering optimization

On the frontend, route-based **lazy loading** is used extensively. Less frequently visited pages are loaded only when needed, which reduces the initial bundle cost and improves first paint behavior.

The UI also uses **useMemo** and **useCallback** in contexts and data-heavy pages to stabilize derived values and avoid unnecessary recomputation. This is especially visible in list filtering, theme handling, notification handling, and administrative dashboards.

In the property browsing experience, paginated loading and client-side normalization keep the browsing flow lightweight while preserving a responsive interface.

### Data Integrity & UX

#### Robust phone number sanitization

The registration modal normalizes Tunisian phone numbers by removing spaces and enforcing the international **+216** prefix. The user input is validated before submission with a strict regular expression. This prevents inconsistent phone formatting across profiles, verification flows, and host onboarding.

At the profile-verification level, the phone verification modal also trims the value and restricts OTP submission to a numeric four-digit format.

#### Strict String-based OTP handling

OTP values are handled as **strings**, not integers. This choice is deliberate and important. Treating OTPs as strings avoids the accidental loss of leading zeros and eliminates parsing-related anomalies that can otherwise surface as **400 Bad Request** errors.

The backend validates the OTP using request-level constraints and exact string comparison against the stored verification token.

#### Comprehensive global error handling

A centralized **@ControllerAdvice** class standardizes API errors into predictable JSON responses. This improves frontend reliability and makes the system easier to test and document.

The handler covers:

- validation failures,
- illegal arguments,
- authentication errors,
- authorization errors,
- not found cases,
- email delivery failures,
- file upload overflow,
- unexpected server exceptions.

This layer is essential in a final-year project because it transforms raw exceptions into a consistent, defense-ready contract between the client and the API.

### Additional QA characteristics

- Request payloads are validated with Jakarta validation annotations.
- Sensitive actions are guarded by role checks.
- The booking and KYC flows are protected against inconsistent state transitions.
- The frontend includes a reusable error boundary to prevent a single runtime failure from collapsing the whole application.
- The theme system persists user preference and adapts the layout for dark mode automatically.

---

## 4. Implementation Conclusion & Deployment Summary

Maskan now stands as a complete **property rental marketplace** tailored to a Tunisian usage context, with a coherent booking lifecycle, secured authentication, real-time communication, administrative moderation, KYC validation, and user-facing notifications. The platform demonstrates the key qualities expected from a production-oriented system: modularity, traceable state transitions, secure access control, and a user experience that remains stable in both light and dark modes.

From an engineering perspective, the project achieves the following outcomes:

- a **functional** end-to-end rental workflow,
- a **secure** JWT-based authentication layer,
- a **real-time** messaging and notification layer,
- a **production-oriented** MongoDB schema with indexing,
- a **responsive** frontend optimized with lazy loading and memoized state,
- a **maintainable** separation between controllers, services, and persistence.

The final seed dataset further validates the platform’s readiness by using realistic market references in Tunisia, including **Les Berges du Lac 2**, **Sidi Bou Saïd**, **Hammamet Nord**, and **Port El Kantaoui, Sousse**. These locations are not synthetic placeholders: they provide a credible spatial and economic context for testing search, pricing, booking conflicts, and geographic discovery.

In conclusion, the final version of Maskan is not merely a prototype. It is a coherent digital marketplace that integrates business rules, administrative governance, and user experience into a single deployable solution. For a graduation defense, this implementation can be presented as a complete case study of full-stack architecture, domain-driven workflow design, and practical software hardening.