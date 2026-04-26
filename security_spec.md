# Security Specification: Codex Omega (Delivery Cercano)

## 1. Data Invariants
- A **Store** must have an owner who is an authenticated user.
- An **Order** must have a valid `storeId` and `customerId`.
- Only the **Owner** or **Admin** can modify sensitive user profile data (email, role).
- **Ratings** must be between 1 and 5.
- **RFC** must be 13 characters.
- **CLABE** must be 18 digits.
- **CreatedAt** and **UpdatedAt** must strictly use server-side timestamps.

## 2. The "Dirty Dozen" Payloads (Attacks)
Below are 12 payloads designed to test vulnerabilities:

1.  **Identity Spoofing (Create User):** User A tries to create a profile for User B.
2.  **Privilege Escalation:** User A tries to set `role: 'ADMIN'` during registration.
3.  **Shadow Field Injection:** User A tries to update their profile with `{ isAdmin: true }`.
4.  **Orphaned Order:** User A tries to create an order for a non-existent `storeId`.
5.  **Relational Bypass:** User A tries to read an order belonging to User B and Store C (where A is neither customer, driver, nor owner).
6.  **Immutable field update:** User A tries to change `ownerId` of a Store they own.
7.  **Resource Poisoning (Long ID):** Attacker sends a 1MB string as a document ID.
8.  **Status Shortcut:** Customer tries to move an order from `PENDING` directly to `DELIVERED`.
9.  **Self-Assigned Driver:** User A tries to update an order with `{ driverId: 'UserA' }` without it being in a state ready for assignment.
10. **Terminal State Lock Break:** User tries to update an order that is already in `CANCELLED` status.
11. **PII Blanket Read:** Unauthenticated user tries to list all emails from the `/users` collection.
12. **Timestamp Fraud:** User sends a backdated `createdAt` timestamp (1 year ago).

## 3. Test Runner (Draft Logic)
The `firestore.rules.test.ts` will verify that all 12 payloads result in `PERMISSION_DENIED`.
