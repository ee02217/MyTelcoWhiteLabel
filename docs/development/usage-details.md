# Usage Details (F-05.2)

## Endpoint Contract

`GET /api/v1/customer/usage?view=daily|billing-cycle&lineId=<optional>`

### Query params

- `view` (optional): `daily` (default) or `billing-cycle`
- `lineId` (optional): when provided, filters response to one line

### Response shape

```json
{
  "view": "daily",
  "periodStart": "2026-03-12",
  "periodEnd": "2026-03-12",
  "customerId": "12345",
  "totals": {
    "dataMb": 2070,
    "voiceMinutes": 55,
    "smsCount": 13
  },
  "lines": [
    {
      "lineId": "LINE-001",
      "msisdn": "+351910000001",
      "nickname": "Primary",
      "usage": {
        "dataMb": 1250,
        "voiceMinutes": 34,
        "smsCount": 8
      }
    }
  ],
  "dataFreshness": {
    "asOf": "2026-03-12T11:55:00Z",
    "sla": "Updated every 15 minutes (SLA <= 15m)"
  }
}
```

## Semantics: Daily vs Billing-cycle

- `daily`: usage accumulated for the current UTC day (`periodStart == periodEnd == today`).
- `billing-cycle`: usage accumulated from first day of current cycle month until now.
- `totals` always reflect the currently returned lines (all lines or filtered line).

## Freshness SLA definition and display

- Backend returns:
  - `dataFreshness.asOf`: timestamp of most recent synchronized usage snapshot
  - `dataFreshness.sla`: human-readable SLA statement
- MVP SLA: **<= 15 minutes latency** between source and BFF exposure.
- UI rule: always display both timestamp and SLA text near usage totals.

## Performance / payload notes

- `customer.usage.details.endpoint` and `customer.usage.details.aggregation` timers are emitted via Micrometer.
- Current payload is unpaginated and intended for small multi-line households.
- For larger accounts, introduce `limit` + cursor pagination and compact service summaries.

## Future BSS integration notes

- Replace `UsageProvider` stub with integration-layer/BSS call.
- Preserve response contract to avoid breaking web/mobile clients.
- Add BSS outage fallback strategy (last-known snapshot + staleness indicator).
