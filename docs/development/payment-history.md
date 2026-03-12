# Payment History (F-06.3)

## Scope

MVP payment history capability for customer channels (web + mobile) and customer-bff APIs.

## API Contracts

### 1) Get payment history

`GET /api/v1/customer/payments/history?months=12`

- Query param `months` is optional.
- Default window: `12` months.
- Maximum window: `12` months (values above 12 are capped).

Response:

```json
{
  "months": 12,
  "payments": [
    {
      "paymentId": "pay_001",
      "paymentDate": "2026-03-01T10:30:00Z",
      "amount": 49.99,
      "currency": "EUR",
      "methodSummary": "Visa •••• 4242",
      "status": "SUCCESS",
      "referenceId": "INV-2026-002"
    }
  ]
}
```

### 2) Download receipt

`GET /api/v1/customer/payments/receipt/{paymentId}/download`

- Returns static/sample PDF receipt for the payment.
- Headers:
  - `Content-Type: application/pdf`
  - `Content-Disposition: attachment; filename="receipt-{referenceId}.pdf"`

### 3) Retry failed payment

`POST /api/v1/customer/payments/{paymentId}/retry`

- One-click retry flow for failed payments.
- Optional `Idempotency-Key` request header.
- If omitted, backend derives deterministic key `retry-{paymentId}`.
- Repeat with same idempotency key replays previous response (no duplicate retry processing).

Response:

```json
{
  "paymentId": "pay_002",
  "status": "SUCCESS",
  "outcome": "Retry accepted and payment completed",
  "idempotencyKey": "web-retry-pay_002"
}
```

## Behavior Notes

- History endpoint excludes items older than requested window.
- Failed items can transition to `SUCCESS` after retry.
- Receipt handling is intentionally static for MVP; replace with provider-backed receipts in next iteration.

## Frontend Integration

- Web: payment history section in `web-portal/src/App.tsx` with receipt download + retry button for failed rows.
- Mobile: payment history section in `mobile-app/App.tsx` with receipt download/share and retry action.
