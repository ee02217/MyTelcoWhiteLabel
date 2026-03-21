# Family roles & permissions (F-12.1)

This delivery introduces the first step in the **Family & multi-line** experience by embedding a canonical role/permission matrix.

## Backend

- Added `FamilyRoleService` that maintains assignments per customer through the existing `AccountProvider`. It auto-assigns the primary line as `OWNER`, keeps audit history, enforces owner-ship rules (at least one owner remains), and publishes events to `EventTopic.FAMILY`.
- Permission matrix:
  | Role | Permissions |
  | --- | --- |
  | OWNER | view usage, manage plans, payments, SIM/eSIM/roaming, manage roles |
  | MANAGER | view usage, manage plans/payments/SIM/eSIM/roaming |
  | MEMBER | view usage |
- Added `FamilyRolesController` endpoints under `/api/v1/customer/family/roles` to retrieve assignments, update a line's role, and read the audit trail. The controller forwards the acting line ID via the `X-Family-Acting-Line-ID` header before delegating to the service.
- The BFF controllers for catalog, payments, orders, SIM/eSIM, and roaming now enforce the relevant permissions via `FamilyRoleService.requirePermission(...)` so role escalations are honored before performing an action.

## Frontend

- `FamilyRolesPanel` is embedded on the customer portal home page. It fetches `/api/v1/customer/family/roles`, shows assignments (line ID, nickname, role), and allows owners/managers to change roles (with optional notes). The permission matrix is also exposed for UI reference.
- The panel issues `PATCH /family/roles/{lineId}` with a JSON payload `{ role, note }` and automatically reloads after successful saves.

## QA & automation

- Family role endpoints are covered by dedicated Spring MVC tests (`FamilyRolesControllerTest`) and service-level tests (`FamilyRoleServiceTest`).
- Controls for catalog checkout, payments, SIM actions, eSIM activation, roaming purchases, and order creation/listing now include family permission guards.
- Documentation stays in sync with the new endpoint, and the new panel is described in the portal's `App.tsx` routes.
