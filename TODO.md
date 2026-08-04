# Task: Fix 404 for `/clients/:id/add-emergency-contact`

**Problem:** Navigating to `/clients/:id/add-emergency-contact` shows a 404 because no route exists for it.

## Steps

- [x] 1. Analyze routes (`app.routes.ts`) and navigation logic (`client-detail.component.ts`)
- [x] 2. Confirm `ClientService` has emergency-contact CRUD methods ready
- [x] 3. Create `AddEmergencyContactComponent` (TS)
- [x] 4. Create `AddEmergencyContactComponent` template (HTML)
- [x] 5. Register route `clients/:id/add-emergency-contact` in `app.routes.ts`
- [x] 6. Verify build / compile

