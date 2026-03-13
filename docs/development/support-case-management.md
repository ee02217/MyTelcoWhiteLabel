# Support Case Management (F-08.2)

This document describes the MVP support-case management baseline delivered in issue #41.

## Endpoint contracts (customer-bff)

Base path: `/api/v1/customer/support/cases`

### 1) Create case

- **POST** `/api/v1/customer/support/cases`
- Request body:

```json
{
  "category": "TECHNICAL",
  "subject": "Intermittent data",
  "description": "Data drops every 15 minutes",
  "priority": "HIGH",
  "attachments": [
    {
      "fileName": "signal.png",
      "contentType": "image/png",
      "sizeBytes": 48123,
      "url": "https://cdn.example/signal.png"
    }
  ]
}
```

- Response includes generated `caseId`, `status`, `slaTarget`, `expectedResponseAt`, and initial timeline entry.

### 2) List cases

- **GET** `/api/v1/customer/support/cases`
- Returns support cases sorted by `createdAt` descending.

### 3) Case detail

- **GET** `/api/v1/customer/support/cases/{caseId}`
- Returns full case with timeline entries sorted by timestamp ascending.

### 4) Append timeline message

- **POST** `/api/v1/customer/support/cases/{caseId}/messages`
- Request body:

```json
{
  "actor": "customer-1",
  "actorType": "CUSTOMER",
  "message": "Any update?"
}
```

- Appends timeline event of type `MESSAGE` with timestamp and actor metadata.

## Case lifecycle and timeline model

- MVP status model: `OPEN`, `IN_PROGRESS`, `WAITING_CUSTOMER`, `RESOLVED`, `CLOSED`.
- Created cases are initialized as `OPEN`.
- Timeline is append-only and includes:
  - `entryId`
  - `timestamp`
  - `actor`
  - `actorType`
  - `type` (`CASE_CREATED`, `MESSAGE`)
  - `message`

## Attachment handling (MVP)

- Attachments are metadata-only in this MVP (`fileName`, `contentType`, `sizeBytes`, optional `url`).
- No binary upload pipeline is included yet; API contract is intentionally upload-ready for a future resource-backed storage integration.

## SLA target and expected response semantics

SLA is calculated at case creation based on category/priority defaults:

- Priority `HIGH`/`P1`: **2h** first response target.
- Category `OUTAGE`: **4h**.
- Category `TECHNICAL`: **6h**.
- Category `BILLING`: **8h**.
- Default fallback: **12h**.

Response projection fields:

- `slaTarget`: human-readable string (e.g., `First response within 6h`).
- `expectedResponseAt`: ISO timestamp derived from `createdAt + target duration`.

## Frontend baseline (web + mobile)

Both web and mobile include baseline support-case views:

- Create case (with category + attachment metadata)
- Case list
- Case detail with timeline rendering
- SLA target + expected response display

These baseline panels are wired to the support-case API and intended to evolve into dedicated routed screens in later increments.
