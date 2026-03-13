# Guided Troubleshooting (F-08.1)

## Scope

MVP guided troubleshooting for top customer support issues in customer self-care channels.

## Flow catalog

`GET /api/v1/customer/troubleshooting/flows`

Current seeded flows (5):

1. `no-data` (NO_DATA)
2. `slow-speed` (SLOW_SPEED)
3. `no-calls` (NO_CALLS)
4. `no-sms` (NO_SMS)
5. `roaming-issues` (ROAMING_ISSUES)

Each flow exposes a step list used by web/mobile wizard UIs.

## Session lifecycle

### Start session

`POST /api/v1/customer/troubleshooting/session/start`

Request:

```json
{
  "flowId": "no-data",
  "lineId": "line-40",
  "deviceInfo": "iPhone 15 iOS 18.1",
  "location": "Lisbon/PT"
}
```

Response returns `sessionId`, flow metadata, captured context, and `IN_PROGRESS` status.

### Record step progression

`POST /api/v1/customer/troubleshooting/session/{sessionId}/step`

Request:

```json
{ "stepId": "airplane-mode-check", "notes": "toggle done" }
```

Response returns updated `completedSteps`.

### Resolve session

`POST /api/v1/customer/troubleshooting/session/{sessionId}/resolve`

Request:

```json
{ "outcome": "resolved", "notes": "data restored" }
```

Allowed outcomes:

- `resolved`
- `escalated`
- `unresolved`

Response returns final outcome with `RESOLVED` session state.

## Captured context schema

Context is persisted in in-memory session store for the session lifetime:

- `lineId` (required)
- `deviceInfo` (required)
- `location` (optional, coarse text)
- `timestamp` (server-side capture at session creation)

## Analytics events

On resolve endpoint, one outcome event is published to `TroubleshootingAnalyticsService` (MVP in-memory sink):

- `sessionId`
- `flowId`
- `issueType`
- `outcome` (`RESOLVED|ESCALATED|UNRESOLVED`)
- context metadata (`lineId`, `deviceInfo`, `location`, `timestamp`)

This is intentionally lightweight and can be replaced by a broker/event bus publisher in a later increment.

## MVP limitations

- In-memory store only (session data/event history lost on restart).
- No persistence, deduplication, or cross-channel session handoff.
- Basic optimistic UI wizard without full accessibility/i18n hardening.
- Mobile baseline integrates outcome path; step-level progression can be expanded in next iteration.
