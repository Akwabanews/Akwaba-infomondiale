# Security Specification - Akwaba Info

## Data Invariants
1. **User Identity**: Users can only create or modify their own profile data. `uid` and `email` are immutable once created.
2. **Admin Supremacy**: The designated admin (`akwabanewsinfo@gmail.com`) can manage all content.
3. **Relational Integrity**: Notifications and support messages must reference existing users.
4. **Temporal Integrity**: All state-changing operations must record accurate server-side timestamps (`request.time`).
5. **Content Safety**: Articles, comments, and classifieds have strict size limits to prevent resource exhaustion.

## The "Dirty Dozen" Payloads (Denial Tests)

1. **Identity Spoofing**: Attempt to create a user profile with `uid` != `request.auth.uid`.
2. **Email Hijacking**: Attempt to update a user profile's `email` field.
3. **Privilege Escalation**: Attempt to set `isAdmin: true` on a user profile.
4. **Shadow Field Injection**: Attempt to create an article with a hidden `shadowField`.
5. **Timestamp Faking**: Attempt to set `date: "2000-01-01"` on a new article (bypassing `request.time`).
6. **Relational Orphan**: Attempt to create a notification for a non-existent user.
7. **Resource Poisoning**: Attempt to inject a 1MB string into a `category` field.
8. **Unauthorized Deletion**: A regular user attempting to delete another user's comment.
9. **Query Scraping**: Attempting to list all users without an owner-based filter.
10. **State Corruption**: Attempting to update an article's `views` count without being an admin.
11. **ID Poisoning**: Attempting to use a 1KB string as a `docId`.
12. **Status Shortcutting**: Attempting to update a classified ad's `status` to `sold` without being the owner.

## Test Runner Verification
(Tested via logic verification and helper alignment)
