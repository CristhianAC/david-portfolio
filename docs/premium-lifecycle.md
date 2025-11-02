# Premium Lifecycle and Metadata

## Overview
Premium access is derived from the Supabase user metadata. The client never trusts the old `is_premium` flag alone; instead it checks whether the user still has time remaining in `premium_active_until`. The additional fields store bookkeeping information for support and audit purposes.

## Metadata Fields
| Field | Type | Purpose |
|-------|------|---------|
| `is_premium` | boolean | Legacy flag retained for backward compatibility. Still set to `true` while the plan is active or finishing its paid period. |
| `premium_since` | ISO string | Timestamp of the last successful conversion (overwritten on each renewal). |
| `premium_active_until` | ISO string | Cutoff date for premium access; the viewer is considered premium when this value is in the future. |
| `premium_cancelled_at` | ISO string or null | Timestamp of the latest cancellation request. Reset to `null` when the subscription is reactivated. |
| `premium_status` | string | Human readable state (`inactive`, `active`, `cancelling`). |
| `premium_provider` | string | Payment processor code (`wompi`). |
| `premium_transaction_id` | string | Wompi transaction id tied to the approval. Useful for support inquiries. |
| `premium_reference` | string | Merchant reference sent during checkout. |
| `premium_payment_method` | string or null | Payment method type reported by Wompi (card, pse, etc.). |

## Activation Flow
1. User completes checkout and Wompi reports `APPROVED`.
2. `/api/payments/confirm-subscription` confirms the transaction.
3. Metadata updates: `premium_status` is set to `active`, `premium_cancelled_at` is cleared, and `premium_active_until` is computed as now + 1 month.
4. Front end reloads and the profile reflects the premium badge and next renewal date.

## Cancellation Flow
1. User opens the confirmation modal from the profile page.
2. Client posts to `/api/payments/cancel-subscription` without any body payload (cookies carry the session).
3. Server ensures `premium_active_until` is at least one month ahead, sets `premium_status` to `cancelling`, and stamps `premium_cancelled_at`.
4. The retry toast shows the final access date, the modal closes, and the page reloads to reveal the "cancelling" badge.
5. Once `premium_active_until` is in the past, the client stops treating the user as premium and premium pages render the paywall.

## Client Checks
- `ProfilePageManager` reloads the page after activation or cancellation so metadata is refreshed in Astro SSR.
- `src/pages/article/[slug].astro` treats the reader as premium when `premium_active_until` is a valid future date or when only the legacy `is_premium` flag is present.
- `ProtectedContent.astro` links back to the profile upgrade section and shows the plan name sourced from `WOMPI_SUBSCRIPTION_NAME`.

## Adding New Plans
If you introduce new plans or billing cadences:
1. Extend `premium_status` values (e.g. `trial`, `grace`).
2. Adjust the next billing computation inside `/api/payments/confirm-subscription` and `/api/payments/cancel-subscription` to reflect the correct duration.
3. Update UI copy in `AccountStatus.astro` so the messaging matches the new flow.
4. Keep backwards compatibility by accepting the old metadata fields or write a migration that normalizes existing users.
