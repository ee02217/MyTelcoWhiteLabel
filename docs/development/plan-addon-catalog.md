# Plan/Add-on Catalog (F-07.1)

## Endpoints

### GET `/api/v1/customer/catalog?lineId=<id>&operatorId=<id>[&type=plan|addon]`

Returns eligible and ineligible catalog offers for the line/operator context.

Offer payload fields:

- `offerId`, `name`, `type`
- `eligible` + `eligibilityReason`
- `pricing.amount` + `pricing.currency`
- `effectiveDate` (ISO date)
- `terms.summary` + `terms.reference`

### POST `/api/v1/customer/catalog/confirm-selection`

Request:

- `lineId`, `operatorId`
- `selectedOfferIds[]`
- `termsAccepted`, `termsReference`

Response:

- `totalPrice` (sum of selected eligible offers)
- `selectedItems[]`
- `termsAcknowledgement` (`accepted`, `reference`, `acceptedAt`)

## Eligibility model (MVP)

`CatalogEligibilityService` applies explicit line/operator rules:

1. `plan-premium-unlimited` only eligible for `vodafone-pt`.
2. `addon-5g-boost` requires even-numbered line IDs.
3. `addon-roaming-weekly` is ineligible for `mvno-lite`.

Rules are deterministic, testable, and isolated from controller code.

## Pricing and effective date semantics

- Pricing is exposed per offer as fixed monthly EUR amount for MVP.
- `effectiveDate` indicates when the selected change starts billing.
- Confirmation total is computed from selected **eligible** offers only.

## Confirmation and terms handling

- Confirmation endpoint returns total + selected items + terms ack metadata.
- Terms are explicitly surfaced in catalog preview and confirmation flow (web/mobile).
- UI requires confirmation step before submission to backend.
