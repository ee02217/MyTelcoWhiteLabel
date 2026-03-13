# TMF-Compatible Facade (F-09.1)

## Scope (MVP subset)

This implementation adds a pragmatic TMF-style facade in `customer-bff` under `/api/v1/customer/tmf` for four priority domains:

- **Catalog**: `GET /productOffering/{id}`
- **Order**: `POST /productOrder`, `GET /productOrder/{id}`
- **Account**: `GET /account/{id}`
- **Billing**: `GET /bill/{id}`

The goal is interoperability-oriented payload shape compatibility (TMF-like fields, naming, and resource model) without full TM Forum API surface completeness.

## Mapping assumptions and known gaps

- Source-of-truth remains existing internal BFF models/services (`CatalogService`, `CustomerOrderService`, `CustomerAggregationService`).
- Facade mapping is intentionally lightweight and explicit in `TmfFacadeMappingService`.
- `href` values are facade-local URI references (not externally resolvable catalog links).
- Order state/action are mapped from internal order orchestration state machine and may not include full TMF lifecycle granularity.
- Billing endpoint currently returns a **bill summary** projection based on dashboard billing aggregates, not full itemized bill details.
- MVP excludes TMF pagination/filtering conventions and partial update semantics.

These are deliberate MVP debt items and should be expanded if third-party TMF clients require stricter conformance.

## Versioning and extensibility strategy

- Facade remains namespaced under `/api/v1/customer/tmf` to isolate compatibility layer evolution from internal APIs.
- Contract stability is enforced by dedicated controller contract tests (`TmfFacadeControllerContractTest`).
- OpenAPI contracts are published per domain in `docs/apis/`:
  - `tmf-catalog.openapi.yaml`
  - `tmf-order.openapi.yaml`
  - `tmf-account.openapi.yaml`
  - `tmf-billing.openapi.yaml`
- Future extension pattern:
  1. Add internal model changes behind mapping service only.
  2. Expand OpenAPI schema first.
  3. Add contract tests for any new mandatory fields/statuses.

## Validation notes

- Java module compile/tests executed on `bff/customer-bff`.
- OpenAPI YAML files validated via parser script (`js-yaml`) for syntax correctness.
- Prettier run across changed docs/yaml files.
