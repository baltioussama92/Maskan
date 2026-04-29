# PFE-2k26 Remaining Work Only

Last updated: 2026-04-20

This file intentionally keeps only unfinished work.
Completed items were removed to avoid noise.

## Backend Remaining Work

Source of truth: `Backend/ADMIN_WORKSPACE_BACKEND_GAPS.md`

1. Reports and disputes APIs
- Add report/dispute entities and admin endpoints for list/details/status/actions.

2. Chat moderation APIs
- Add flagged conversations endpoints and moderation action endpoint.

3. Support ticket APIs
- Add ticket list/detail/update/message endpoints.

4. Finance operations APIs
- Add payout/refund/history/invoice/export endpoints for admin workspace.

5. Analytics data APIs
- Add trend/top-cities/conversion/complaints datasets for admin charts.

6. Platform settings persistence APIs
- Add `GET/PUT /api/admin/settings` and store shared platform settings.

7. Content management APIs
- Add `GET/PUT /api/admin/content` for banners/FAQ/terms/privacy/footer.

8. Notification APIs
- Add templates/send/schedule/history endpoints for admin notifications.

## Frontend Remaining Work

1. Replace placeholder admin data with real backend modules when available
- `Frontend/src/admin/pages/Reports.tsx`
- `Frontend/src/admin/pages/Payments.tsx`
- `Frontend/src/admin/pages/Settings.tsx`
- `Frontend/src/admin/pages/Dashboard.tsx`

2. Final host verification UX validation
- Verify host verification page submits fully against backend flow and handles all error states.

3. Optional cleanup
- Rename legacy method names ending in `FrontendOnly` in `Frontend/src/admin/services/adminApi.ts`.

## Verification Checklist (still pending)

1. Run full end-to-end Postman/API validation for all admin critical paths.
2. Add regression tests for newly delivered backend admin modules.
3. Perform production-like UAT on admin flows once placeholders are removed.
