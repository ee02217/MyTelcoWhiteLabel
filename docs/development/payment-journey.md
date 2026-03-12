# Payment Journey (F-06.2 / Issue #35)

## Scope

MVP customer payment journey for web and mobile through `customer-bff`.

### Acceptance Criteria Coverage

- Payment method registration and tokenized checkout are supported.
- Payment success and failure states are handled gracefully.
- Idempotency key prevents double charges.

## API Contract (customer-bff)

Base path: `/api/v1/customer/payments`

### 1) Register payment method

`POST /methods`

Request:

```json
{
  "cardHolder": "Jane Doe",
  "cardLast4": "4242",
  "cardBrand": "VISA",
  "expiry": "12/30"
}
```

Response:

```json
{
  "paymentMethodId": "pm_xxx",
  "token": "tok_xxx",
  "status": "REGISTERED"
}
```

### 2) Tokenized checkout

`POST /checkout`

Required header:

- `Idempotency-Key: <unique-key-per-intent>`

Request:

```json
{
  "paymentMethodToken": "tok_xxx",
  "amount": 39.9,
  "currency": "EUR",
  "billReference": "INV-35"
}
```

Response:

```json
{
  "transactionId": "tx_xxx",
  "status": "SUCCESS",
  "message": "Payment processed successfully",
  "idempotencyKey": "web-idem-success-35"
}
```

Failure response example:

```json
{
  "transactionId": "tx_xxx",
  "status": "FAILED",
  "message": "Payment declined by provider simulator",
  "idempotencyKey": "mobile-idem-fail-35"
}
```

## Idempotency Semantics

- The first request for an `Idempotency-Key` is processed and persisted in-memory.
- Replays with the same key return the exact same `CheckoutResponse` and do not trigger a second charge.
- This MVP uses in-memory storage for deterministic local development behaviour.

## Web/Mobile Baseline Integration

- `web-portal/src/App.tsx`
  - Registers payment method
  - Runs success checkout, failure checkout, and idempotency replay flows
- `mobile-app/App.tsx`
  - Equivalent journey with baseline UI buttons and status rendering

## Validation

- Unit tests in customer-bff cover idempotency and success/failure paths.
- Controller tests validate endpoint behavior and required idempotency header handling.

## Known MVP Debt

1. In-memory idempotency store is volatile and node-local.
2. Provider integration is simulated (no external PSP webhook flow).
3. Payment method tokenization is demo-safe metadata only.

These must be replaced with persistent idempotency storage + real PSP adapter before production rollout.
