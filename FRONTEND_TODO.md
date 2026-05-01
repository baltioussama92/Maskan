# Frontend Remaining Work

**Last Updated:** 2026-04-29  
**Priority Order:** P1 (Blocking) → P2 (Important) → P3 (Nice to Have)

---

## 🔴 P1: Critical / Blocking

### 1. Connect Admin Pages to Real Backend APIs

#### Reports Page
- [ ] Replace mock report data in `src/admin/pages/Reports.tsx`
- [ ] Connect to `GET /api/admin/reports` (wait for backend: P1 task #1)
- [ ] Implement report filtering, search, status updates
- [ ] Implement moderation actions

#### Support Tickets Page
- [ ] Create support tickets management page (or update existing if present)
- [ ] Connect to support ticket endpoints (wait for backend: P1 task #3)
- [ ] Display ticket list with status, priority, category
- [ ] Implement ticket detail view and messaging

#### Chat Moderation Page
- [ ] Create/update moderation page for flagged conversations
- [ ] Connect to chat moderation endpoints (wait for backend: P1 task #2)
- [ ] Show flagged conversation list with actions

---

## 🟠 P2: Important / Feature Complete

### 2. Replace Admin Placeholder Data with Real APIs

#### Admin Dashboard
- [ ] Replace hardcoded dashboard metrics
- [ ] Connect to `GET /api/admin/analytics/summary` (when backend ready)
- [ ] Display real revenue, bookings, users, complaints data
- [ ] Add date range filtering for analytics

#### Admin Payments Page
- [ ] Replace mock payout list with real data from `GET /api/admin/payouts`
- [ ] Replace mock refund list with real data from `GET /api/admin/refunds`
- [ ] Implement payout/refund status updates
- [ ] Add financial export functionality (CSV/PDF)

#### Admin Settings Page  
- [ ] Connect to `GET/PUT /api/admin/settings` (wait for backend: P2 task #6)
- [ ] Implement platform settings form persistence
- [ ] Add content management (banners, FAQ, terms, privacy, footer)
- [ ] Show validation/success messages on save

#### Admin Analytics Dashboard
- [ ] Add dedicated analytics page with charts
- [ ] Connect to analytics endpoints (wait for backend: P2 task #5)
- [ ] Display revenue trends, booking trends, user growth, top cities, conversion rates

### 3. User-Facing Features

#### Host Verification Flow
- [ ] Verify full submission flow against real backend
- [ ] Test upload validation and error handling
- [ ] Ensure all required fields are captured and sent to backend

#### Final Host Verification Integration
- [ ] Ensure host verification fully integrates with backend verification flow
- [ ] Test verification document uploads
- [ ] Validate error states and user feedback

---

## 🟡 P3: Nice to Have / Optimization

### 4. Code Cleanup & Refactoring

#### Admin API Service Cleanup
- [ ] Rename legacy mock method names:
  - `updateUserProfileFrontendOnly` → `updateUserProfile`
  - `changeUserPasswordFrontendOnly` → `changeUserPassword`
  - `deleteUserFrontendOnly` → `deleteUser`
- [ ] Location: `src/admin/services/adminApi.ts`

#### Improve State Management
- [ ] Add consistent loading/error/empty states for all admin pages
- [ ] Improve error handling and user feedback
- [ ] Add retry logic for failed API calls

### 5. Performance Optimization

#### Code Splitting
- [ ] Implement lazy loading for admin routes
- [ ] Use `React.lazy()` and `import()` for route-based code splitting
- [ ] Target: reduce main bundle size (currently ~552 KB)

#### Pagination
- [ ] Implement pagination for all list pages (reports, tickets, payments, users, listings)
- [ ] Connect to backend pagination parameters (page, size, sort)

### 6. Enhanced UX

#### Real-Time Updates
- [ ] Add WebSocket support for real-time notifications
- [ ] Show live status updates for bookings, messages, reports
- [ ] Implement chat moderation real-time alerts

#### Admin Dashboard
- [ ] Add filters and sorting for all data tables
- [ ] Implement search across admin pages
- [ ] Add export functionality (CSV/PDF) for data

#### Notifications
- [ ] Implement notification system for:
  - New bookings/cancellations
  - New messages
  - Admin alerts
  - Verification status updates

---

## Dependency Chain

**Blocked by Backend:**
- Reports page ← Backend P1 task #1 (Reports module)
- Chat moderation ← Backend P1 task #2 (Chat moderation)
- Support tickets ← Backend P1 task #3 (Support center)
- Payments page ← Backend P2 task #4 (Finance module)
- Analytics ← Backend P2 task #5 (Analytics)
- Settings page ← Backend P2 task #6 (Platform settings)
- Content management ← Backend P2 task #7 (Content management)

**Ready to implement now:**
- Code cleanup (P3 task #4)
- Code splitting (P3 task #5)
- State management improvements (P3 task #4)

---

## Testing & Validation

- [ ] End-to-end regression test (user + host + admin flows)
- [ ] Admin workflow validation after backend integration
- [ ] Cross-browser testing
- [ ] Mobile responsiveness verification

---

**Start with independent tasks (code cleanup, code splitting) while waiting for backend delivery of P1 features.**  
**Then implement integration tasks as backend features become available.**
