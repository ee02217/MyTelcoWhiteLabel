# Bill Explorer (F-06.1)

## Scope

MVP bill explorer for customer surfaces (web + mobile) with category grouping, period comparison, and invoice PDF download.

## Endpoints

### `GET /api/v1/customer/billing/explorer?period=<YYYY-MM>`

Returns bill details for requested period and a comparison against previous month.

#### Response contract (high-level)

```json
{
  "customerId": "12345",
  "period": "2026-03",
  "periodStart": "2026-03-01",
  "periodEnd": "2026-03-31",
  "groupedLineItems": [
    {
      "category": "plan",
      "items": [
        {
          "itemId": "ITEM-PLAN-1",
          "description": "Unlimited Max Plan",
          "amount": 34.99,
          "category": "plan"
        }
      ],
      "total": 34.99
    }
  ],
  "totalsByCategory": {
    "plan": 34.99,
    "add-ons": 4.99,
    "overages": 3.5,
    "taxes": 9.99
  },
  "grandTotal": 53.47,
  "comparison": {
    "previous": { "period": "2026-02", "grandTotal": 48.56 },
    "deltaAbsolute": 4.91,
    "deltaPercentage": 10.11
  },
  "invoice": {
    "invoiceId": "INV-202603-12345",
    "fileName": "INV-202603-12345.pdf",
    "downloadUrl": "/api/v1/customer/billing/invoice/INV-202603-12345/download"
  }
}
```

### `GET /api/v1/customer/billing/invoice/{invoiceId}/download`

Downloads invoice as PDF stream.

- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="<invoiceId>.pdf"`

MVP implementation serves a sample PDF from classpath resources.

## Category model

Supported/required bill categories:

- `plan`
- `add-ons`
- `overages`
- `taxes`

The API guarantees all categories exist in `groupedLineItems` even when empty for deterministic UI rendering.

## Period comparison semantics

- `previous.period` = requested period minus one month.
- `deltaAbsolute` = `current.grandTotal - previous.grandTotal`.
- `deltaPercentage` = `deltaAbsolute / previous.grandTotal * 100` (rounded to 2 decimals).
- Division-by-zero guard: if previous total is zero, percentage returns `0.00`.

## Invoice download behavior and security notes

- Download endpoint is customer-authenticated via existing BFF security rules.
- For production hardening:
  - validate invoice ownership (`invoiceId` must map to requesting customer)
  - prefer signed/short-lived download tokens for downstream object storage
  - audit download attempts and failures
  - enforce anti-caching policy where regulation requires
