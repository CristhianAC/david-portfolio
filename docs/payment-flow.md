# Premium Payment Flow

## Overview

The site offers a recurring premium plan that is processed through Wompi. The front end prepares a checkout session, the user completes the payment inside the Wompi widget, and the server validates the transaction with Wompi before elevating the reader to premium. Cancellation is handled with a delayed revocation so that the user keeps access until the current billing cycle ends.

## Environment Variables

Set the following variables in `.env` and `.env.development`:

- `WOMPI_PUBLIC_KEY`: public key used by the widget.
- `WOMPI_PRIVATE_KEY`: secret key used by server routes to query Wompi.
- `WOMPI_SUBSCRIPTION_AMOUNT_IN_CENTS`: price expressed in cents (e.g. `99900`).
- `WOMPI_SUBSCRIPTION_CURRENCY`: currency code (e.g. `COP`).
- `WOMPI_SUBSCRIPTION_NAME`: plan label shown to customers.
- `WOMPI_REDIRECT_URL`: optional, only used when the widget needs a redirect.
- `SUPABASE_URL` / `SUPABASE_KEY`: service keys for the Supabase project.

## Step by Step Checkout

1. `ProfilePageManager` initializes when the profile page loads and requests a Wompi session id (`window.$wompi.initialize`).
2. When the user clicks **Actualizar**, the client calls `/api/payments/create-subscription-session` with the cached session id. That endpoint prepares a signed payload for WidgetCheckout (not modified in this task).
3. The Wompi widget opens with the prepared payload. After completion it returns a `transaction.id` and the status.
4. On status `APPROVED`, the client calls `/api/payments/confirm-subscription` using that transaction id.
5. The confirm route validates the transaction directly with Wompi, checks amount and currency, and then updates Supabase user metadata to activate the premium plan for one full month ahead.
6. The client reloads the page so the new metadata is reflected on the profile and article guards.

## Server Endpoints

- `POST /api/payments/create-subscription-session`: Generates Wompi checkout configuration. Requires the user session cookies.
- `POST /api/payments/confirm-subscription`: Verifies the approved transaction with Wompi, then marks the user as premium and sets `premium_active_until` one month into the future.
- `POST /api/payments/cancel-subscription`: Marks the user as `cancelling`, keeps `is_premium` true, and ensures `premium_active_until` is set to the next renewal so access remains valid.

## Client Components

- `src/components/profile/profilePageManager.ts`: Coordinates checkout script loading, session caching, toast notifications, and both upgrade and cancellation calls.
- `src/components/profile/AccountStatus.astro`: Displays premium state, next renewal date, and triggers the cancellation modal.
- `src/components/profile/PremiumUpgrade.astro`: Card that invites free members to upgrade (anchors the hash used in ProtectedContent).
- `src/components/ProtectedContent.astro`: Obfuscates premium articles and deep links to the profile upgrade section when access is denied.

## Error Handling

- Client toasts report widget cancellations, pending payments, and API errors.
- API routes return structured JSON `{ message }`; the client surfaces these errors in the toast system.
- Any session failure triggers a cookie cleanup and forces re-authentication.

## Local Testing Checklist

1. Fill `.env.development` with sandbox Wompi keys and run `npm run dev`.
2. Create a Supabase user and log in.
3. Trigger the upgrade flow; confirm that `premium_*` metadata fields appear in Supabase.
4. Visit a premium article to verify the guard disappears.
5. Use the cancellation button; the profile should show the "cancelling" state and premium access should continue until `premium_active_until` passes.
