# Security Specification - Cenotvůrce

## Data Invariants
1. An Offer must always belong to a `userId` that matches the authenticated user's UID.
2. Timestamps (`createdAt`, `updatedAt`) must be server-validated.
3. User settings are private and can only be accessed/modified by the owner.
4. Offer IDs and Number strings must be reasonably sized and sanitized.

## The Dirty Dozen Payloads

1. **Identity Spoofing**: Attempting to create an offer with a `userId` of another user.
2. **PII Blanket Read**: Attempting to list all users' profiles.
3. **Stateless Injection**: Attempting to save an offer with missing required fields (e.g., no total price logic can be bypass if items array is invalid).
4. **Denial of Wallet (ID Poisoning)**: Creating an offer with a 1MB string as a document ID.
5. **Timestamp Backdating**: Attempting to set `createdAt` to a point in the far past manually.
6. **Role Escalation**: Attempting to set `isAdmin: true` on a user document (if we used an admin role).
7. **Negative Values**: Setting `quantity` or `pricePerUnit` to negative numbers to flip calculation logic.
8. **Shadow Field Injection**: Adding `isVerified: true` to an offer to attempt to bypass business logic checks.
9. **Settings Overwrite**: A user trying to write to another user's `settings/current` document.
10. **Resource Exhaustion (Array Size)**: Attempting to save an offer with 50,000 items in the `items` array.
11. **Malicious Regex**: Sending a document ID like `../../../root` to attempt path traversal (handled by Firestore, but good to specify).
12. **Status Skipping**: Attempting to update an offer from a "terminal" state if we had statuses (e.g. "Sent").

## Test Runner (firestore.rules)
I will implement these checks in the `firestore.rules` file to ensure PERMISSION_DENIED for all malicious attempts.
