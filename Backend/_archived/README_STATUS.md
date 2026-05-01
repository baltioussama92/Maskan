# Backend Remaining Work

Last update: 2026-04-20

This file keeps only pending backend work.
Detailed admin API gap plan is in `Backend/ADMIN_WORKSPACE_BACKEND_GAPS.md`.

## Priority A

1. Reports and disputes module
- Implement real report/dispute storage and moderation endpoints.

2. Chat moderation module
- Implement flagged conversation retrieval and moderation actions.

3. Support center module
- Implement support tickets CRUD lifecycle (assign/escalate/resolve/close) and ticket message thread.

## Priority B

4. Finance module for admin workspace
- Add payouts/refunds/payment-history/invoice-download/export endpoints.

5. Analytics datasets
- Add endpoints for revenue/booking/user growth trends, top cities, conversion, complaints categories.

## Priority C

6. Platform settings persistence
- Add backend persistence and APIs for shared platform settings.

7. Content management persistence
- Add APIs for homepage banner, FAQ, terms, privacy, footer/contact.

8. Notifications module
- Add notification templates, send-now, schedule, and delivery history endpoints.

## Validation Still Required

1. End-to-end Postman coverage for all admin endpoints.
2. Integration tests for newly added admin modules.
3. UAT pass with frontend admin workspace after placeholders are replaced.
