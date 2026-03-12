# API Versioning Policy

## Overview

This document defines the API versioning strategy for the MyTelcoWhiteLabel platform. All APIs must follow these guidelines to ensure consistent versioning, backward compatibility, and smooth deprecation transitions.

## Versioning Strategy

### URL-Based Versioning

We use **URL path versioning** for all APIs:

```
https://api.example.com/api/v1/{resource}
https://api.example.com/api/v2/{resource}
```

**Why URL versioning?**

- Clear and explicit
- Easy to understand for API consumers
- Works well with load balancers and API gateways (Kong)
- Simple to route to different backend implementations

### Version Format

- **Major version**: `v1`, `v2`, etc. - Incremented for breaking changes
- **No minor/patch in URL**: Minor versions are handled through backward-compatible additions
- **Default**: When no version is specified, the latest stable version is served (configure at gateway level)

## Version Lifecycle

```
┌─────────┐     ┌─────────┐     ┌─────────────┐
│  Beta   │ ──► │ Stable  │ ──► │ Deprecated  │
└─────────┘     └─────────┘     └─────────────┘
     │               │                │
     │               │                │
  - No SLA        - Full SLA      - Security
  - May change    - Backward      - patches only
  - Internal      - compatible    - 12 month
    testing                         notice
```

### Stage Definitions

| Stage      | Description                                  | Duration   |
| ---------- | -------------------------------------------- | ---------- |
| Beta       | Initial release for testing and feedback     | 1-3 months |
| Stable     | Production-ready with backward compatibility | 12+ months |
| Deprecated | Still available but not recommended          | 12 months  |

## Backward Compatibility

### What Constitutes a Breaking Change?

The following are considered **breaking changes** and require a major version bump:

1. **URL path changes** - Removing or renaming endpoints
2. **HTTP method changes** - Changing GET to POST, etc.
3. **Response structure changes** - Removing fields from response bodies
4. **Required fields** - Making optional fields required
5. **Error code changes** - Adding new error codes or changing existing ones
6. **Authentication changes** - Modifying auth requirements

### What Is NOT a Breaking Change?

These changes are backward-compatible and can be made without version bump:

1. Adding new **optional** fields to requests/responses
2. Adding new **endpoints**
3. Adding new **error codes** (clients should ignore unknown codes)
4. Changing field **order** in responses (JSON objects are unordered)
5. Adding new **headers**

## Deprecation Policy

### Announcement Requirements

When deprecating a version or endpoint:

1. **12 months notice**: All deprecations must be announced at least 12 months in advance
2. **Deprecation header**: Include `Deprecation` header in responses
3. **Sunset header**: Include `Sunset` header with the deprecation date
4. **Documentation**: Update API docs with deprecation notices

### Example Headers

```
Deprecation: Sun, 01 Jan 2027 00:00:00 GMT
Sunset: Sat, 01 Jan 2027 00:00:00 GMT
Link: <https://api.example.com/api/v2/users>; rel="successor-version"
```

### Migration Path

1. **Announce deprecation** with timeline
2. **Provide migration guide** for new version
3. **Monitor usage** of deprecated version
4. **Disable deprecated version** after sunset date

## Kong Gateway Integration

### Versioned Routes

Kong routes are configured with versioned paths:

```yaml
# Customer API v1
- name: customer-api-v1
  paths:
    - /api/v1/customer

# Admin API v1
- name: admin-api-v1
  paths:
    - /api/v1/admin
```

### Version Negotiation

Clients should specify the version in the URL path:

```
GET /api/v1/customers
GET /api/v1/bills
GET /api/v1/usage
```

### Gateway Configuration

See [`infra/kong/kong.yml`](../../infra/kong/kong.yml) for the declarative Kong configuration.

### Rate Limiting by Version

- Rate limits are applied per version
- Operators can override limits via Kong annotations
- Default: 100 req/min for customer APIs, 50 req/min for admin APIs

## Change Management

### For API Developers

1. **Before making changes**:
   - Review if it's a breaking change
   - If breaking, increment major version
   - Update this document

2. **Documentation updates required**:
   - Update OpenAPI/Swagger specs
   - Add changelog entry
   - Notify API consumers

3. **Testing requirements**:
   - Backward compatibility tests
   - Migration path testing

### For API Consumers

1. **Always specify version** in requests
2. **Handle deprecation headers** gracefully
3. **Subscribe to API change notifications**
4. **Test with new versions** before production switch

## Examples

### Adding a New Endpoint (Non-Breaking)

```yaml
# v1 addition - no version bump needed
paths:
  /api/v1/customers:
    get:
      summary: List customers
  /api/v1/customers/{id}/usage: # NEW - backward compatible
    get:
      summary: Get customer usage
```

### Breaking Change (Requires v2)

```yaml
# v1 - current
paths:
  /api/v1/customers:
    get:
      response:
        - code: 200
          body:
            fields:
              - id
              - name

# v2 - new version with breaking change
paths:
  /api/v2/customers:
    get:
      response:
        - code: 200
          body:
            fields:
              - id
              - fullName  # Renamed - breaking!
              - accountStatus  # New required field - breaking!
```

## References

- [Kong Gateway Configuration](../../infra/kong/kong.yml)
- [GitHub Workflow](../development/github-workflow.md)
- [TMF API Guidelines](https://www.tmforum.org/) - Industry standards for telco APIs
