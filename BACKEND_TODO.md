# Backend Remaining Work

**Last Updated:** 2026-04-29  
**Priority Order:** P1 (Blocking) → P2 (Important) → P3 (Nice to Have)

---

## 🔴 P1: Critical / Blocking

### 1. Reports & Disputes Module
- [ ] Create `Report` entity (id, reporterId, reportedUserId/listingId, type, description, status, createdAt)
- [ ] Create endpoints:
  - `POST /api/reports` - submit a report
  - `GET /api/admin/reports` - list reports (paginated, with filtering)
  - `GET /api/admin/reports/{id}` - report details
  - `PUT /api/admin/reports/{id}/status` - update report status (PENDING → RESOLVED/DISMISSED)
  - `POST /api/admin/reports/{id}/actions` - take moderation action (ban, warn, etc.)
- [ ] **Frontend depends on:** Admin Reports page to display real data

### 2. Chat Moderation Module  
- [ ] Create endpoints for flagged conversations:
  - `GET /api/admin/moderation/flagged-conversations` - list flagged chats
  - `POST /api/admin/moderation/actions/{conversationId}` - moderation action
  - `GET /api/admin/moderation/summary` - chat moderation stats
- [ ] **Frontend depends on:** Admin dashboard moderation widget

### 3. Support Center / Tickets Module
- [ ] Create `SupportTicket` entity (id, userId, title, description, status, priority, category, messages[], createdAt, updatedAt)
- [ ] Create `TicketMessage` entity (id, ticketId, userId, message, attachments, createdAt)
- [ ] Create endpoints:
  - `POST /api/support-tickets` - create support ticket
  - `GET /api/support-tickets/me` - user's tickets
  - `GET /api/support-tickets/{id}` - ticket details
  - `PUT /api/support-tickets/{id}` - update ticket (status, priority)
  - `POST /api/support-tickets/{id}/messages` - add message to ticket
  - `GET /api/admin/support-tickets` - admin list all tickets
- [ ] **Frontend depends on:** Support/help page for users and admin support dashboard

---

## 🟠 P2: Important / Feature Complete

### 4. Finance / Payments Admin Module
- [ ] Create `Payout` entity and endpoints:
  - `POST /api/admin/payouts` - request/create payout
  - `GET /api/admin/payouts` - list payouts (status: PENDING, COMPLETED, FAILED)
  - `PUT /api/admin/payouts/{id}/status` - update payout status
- [ ] Create `Refund` entity and endpoints:
  - `POST /api/admin/refunds` - create refund
  - `GET /api/admin/refunds` - list refunds
- [ ] Add financial analytics:
  - `GET /api/admin/finance/summary` - total revenue, pending payouts, refunds
  - `GET /api/admin/finance/history` - transaction history (payments, payouts, refunds)
  - `GET /api/admin/finance/exports` - export financial data (CSV/PDF)
- [ ] **Frontend depends on:** Admin Payments page real data (currently using mock data)

### 5. Analytics & Reporting Module
- [ ] Create analytics endpoints:
  - `GET /api/admin/analytics/revenue` - revenue trends (daily/weekly/monthly)
  - `GET /api/admin/analytics/bookings` - booking trends
  - `GET /api/admin/analytics/users` - user growth metrics
  - `GET /api/admin/analytics/top-cities` - popular destinations
  - `GET /api/admin/analytics/conversion` - booking conversion rates
  - `GET /api/admin/analytics/complaints` - complaint categories/trends
- [ ] **Frontend depends on:** Admin Dashboard real metrics (currently mock)

### 6. Platform Settings Persistence
- [ ] Create `PlatformSettings` entity (id, settingsKey, settingsValue, updatedAt, updatedBy)
- [ ] Create endpoints:
  - `GET /api/admin/settings` - get all platform settings
  - `PUT /api/admin/settings` - update platform settings (fees, taxes, policies)
  - `GET /api/admin/settings/{key}` - get specific setting
- [ ] **Frontend depends on:** Admin Settings page to persist changes to backend

### 7. Content Management Module
- [ ] Create `ContentPage` entity (id, pageType, content, updatedAt, updatedBy)
- [ ] Create endpoints for:
  - `GET /api/admin/content/homepage-banner` - homepage banner
  - `PUT /api/admin/content/homepage-banner` - update banner
  - `GET /api/admin/content/faq` - FAQ list
  - `PUT /api/admin/content/faq` - update FAQ
  - `GET /api/admin/content/terms` - terms of service
  - `PUT /api/admin/content/terms` - update terms
  - `GET /api/admin/content/privacy` - privacy policy
  - `PUT /api/admin/content/privacy` - update privacy
  - `GET /api/admin/content/footer` - footer content
  - `PUT /api/admin/content/footer` - update footer
- [ ] **Frontend depends on:** Admin Settings page to manage content

### 8. Notifications System Module
- [ ] Create `NotificationTemplate` entity
- [ ] Create `NotificationLog` entity
- [ ] Create endpoints:
  - `POST /api/admin/notifications/send` - send immediate notification
  - `POST /api/admin/notifications/schedule` - schedule notification
  - `GET /api/admin/notifications/history` - notification delivery history
  - `GET /api/admin/notifications/templates` - get available templates
- [ ] **Frontend depends on:** Admin Notifications page

---

## 🟡 P3: Nice to Have / Optimization

### 9. WebSocket Chat Integration
- [ ] Replace REST polling with WebSocket for real-time messaging
- [ ] Add connection management (connect, disconnect, reconnect)
- [ ] Implement message delivery confirmation

### 10. Real-Time Notifications
- [ ] Add push notifications for:
  - New bookings
  - Booking status changes
  - New messages
  - Admin alerts
- [ ] Consider WebSocket or WebPush API

### 11. Enhanced Search & Filtering
- [ ] Add property type filter to search endpoint
- [ ] Implement pagination (page, size, sort) for all list endpoints
- [ ] Add sorting options (price, rating, newest)

### 12. Review Validation
- [ ] Verify reviewer has completed booking before posting review
- [ ] Add rating/comment validation

---

## Testing & Validation

- [ ] Postman collection fully covers all new admin endpoints
- [ ] Integration tests written for new modules
- [ ] E2E tests validate admin workflows
- [ ] Load testing for analytics endpoints

---

**Start with P1 tasks** to unblock frontend admin page integration. Then move to P2 for feature completeness.
