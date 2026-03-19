# SIM/eSIM + roaming basic (F-07.3)

## Endpoints

### Step-up auth

- `POST /api/v1/customer/step-up/challenges`
  - Request: `{ "lineId": "line-1", "action": "SIM_BLOCK|SIM_UNBLOCK" }`
  - Response: challenge id, expiry, masked destination.
- `POST /api/v1/customer/step-up/verify`
  - Request: `{ "challengeId": "...", "code": "<otp>" }`
  - Response: verification token (short-lived).
  - Error responses include explicit `code` values:
    - `CHALLENGE_NOT_FOUND` (404)
    - `CHALLENGE_EXPIRED` (400)
    - `INVALID_CHALLENGE_CODE` (400)
    - `CHALLENGE_LOCKED` (429)
    - `CHALLENGE_ALREADY_USED` (409)

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
2. Backend generates per-challenge OTP and sends through configured delivery adapter.
3. User verifies the code.
4. API returns verification token.
5. Token is required for SIM block/unblock and action-scoped.

## Step-up security controls

- OTP is generated per challenge (no hardcoded global code).
- Max failed attempts and lockout window are configurable.
- Challenge replay is blocked once a challenge is consumed.
- Security audit events are emitted for issue/failure/lock/verify.

## Runtime configuration

Step-up controls are environment-driven under `mytelco.step-up`:

- `MYTELCO_STEP_UP_CHALLENGE_TTL` (default `PT5M`)
- `MYTELCO_STEP_UP_TOKEN_TTL` (default `PT10M`)
- `MYTELCO_STEP_UP_MAX_ATTEMPTS` (default `3`)
- `MYTELCO_STEP_UP_LOCKOUT_DURATION` (default `PT15M`)
- `MYTELCO_STEP_UP_OTP_LENGTH` (default `6`)
- `MYTELCO_STEP_UP_DELIVERY_PROVIDER` (`stub` | `webhook`)
- `MYTELCO_STEP_UP_DELIVERY_CHANNEL` (default `SMS`)
- `MYTELCO_STEP_UP_MASKED_DESTINATION` (default `+*** *** *42`)
- `MYTELCO_STEP_UP_DELIVERY_WEBHOOK_URL` (required when provider=`webhook`)

## Delivery adapters

- `stub` (default): logs challenge delivery locally for non-production/dev runs.
- `webhook`: posts challenge payload to an external delivery endpoint.

## eSIM QR/status lifecycle

- Activation call creates QR payload/reference and `QR_GENERATED` state.
- Status endpoint progresses state to `ACTIVATION_IN_PROGRESS`, then `ACTIVATED`.
- This models explicit transitions via service/provider layers.

## Roaming purchase semantics

- Pack purchase accumulates line allowance in MVP state store.
- Validity starts at purchase date and ends after configured pack duration.
- Purchase response is the source for updated allowance and validity display.

## MVP limitations and production hardening

- In-memory state/provider (non-persistent, single-instance only).
- No fraud/risk scoring or device binding.
- Production must add persistent storage, auditable challenge store retention, and external operator orchestration.
