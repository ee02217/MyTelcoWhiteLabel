# SIM/eSIM + roaming basic (F-07.3)

## Endpoints

### Step-up auth (MVP stub)

- `POST /api/v1/customer/step-up/challenges`
  - Request: `{ "lineId": "line-1", "action": "SIM_BLOCK|SIM_UNBLOCK" }`
  - Response: challenge id, expiry, masked destination.
- `POST /api/v1/customer/step-up/verify`
  - Request: `{ "challengeId": "...", "code": "123456" }` (MVP stub code)
  - Response: verification token (short-lived).

### SIM controls

- `POST /api/v1/customer/sim/{lineId}/block`
- `POST /api/v1/customer/sim/{lineId}/unblock`
  - Request: `{ "stepUpVerificationToken": "...", "reason": "..." }`
  - Behaviour: reject with 403 when token is missing/invalid/wrong action.

### eSIM

- `POST /api/v1/customer/esim/{lineId}/activate`
  - Returns activation id + QR payload/reference + initial state `QR_GENERATED`.
- `GET /api/v1/customer/esim/{lineId}/status`
  - Returns lifecycle status (`QR_GENERATED -> ACTIVATION_IN_PROGRESS -> ACTIVATED`).

### Roaming packs

- `GET /api/v1/customer/roaming/packs?country=<code>&lineId=<id>`
  - Returns available packs for the destination country.
- `POST /api/v1/customer/roaming/packs/purchase`
  - Request: `{ "lineId": "...", "country": "PT", "packId": "pack-weekly-3gb" }`
  - Response includes updated allowance and validity (`validFrom`, `validUntil`).

## Step-up flow

1. Client requests challenge for action + line.
2. User verifies challenge code.
3. API returns verification token.
4. Token is required for SIM block/unblock and action-scoped.

## eSIM QR/status lifecycle

- Activation call creates QR payload/reference and `QR_GENERATED` state.
- Status endpoint progresses state to `ACTIVATION_IN_PROGRESS`, then `ACTIVATED`.
- This models explicit transitions via service/provider layers.

## Roaming purchase semantics

- Pack purchase accumulates line allowance in MVP state store.
- Validity starts at purchase date and ends after configured pack duration.
- Purchase response is the source for updated allowance and validity display.

## MVP limitations and production hardening

- OTP delivery is stubbed (`123456`), no real MFA channel integration.
- In-memory state/provider (non-persistent, single-instance only).
- No fraud/risk scoring, rate limiting, lockout, or device binding.
- Production must add persistent storage, auditable challenge store, replay protection, and external operator orchestration.
