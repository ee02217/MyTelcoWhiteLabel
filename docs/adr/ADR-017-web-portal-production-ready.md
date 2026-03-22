# ADR-017: Web Portal Production-Ready Re-engineering

## Status: Proposed

## Context

The current web portal has two views:
1. **Home** (`/`) - Customer dashboard with account overview
2. **Lab** (`/lab`) - Engineering debug interface with 12 feature areas

The Lab view is NOT production-ready:
- Named "Self-Care Lab" - sounds like dev tool
- All features visible simultaneously (no navigation)
- Debug UI: "401 from protected API", "No payment attempt yet"
- Hardcoded references: `lineId: line-22`, `operatorId: vodafone-pt`
- Raw API status exposed to users
- Engineering-only buttons: "Replay idempotency key", "Submit failing order"

We need to transform this into a proper customer-facing self-care portal.

---

## Architecture

### Tech Stack (Unchanged)
- Frontend: React + TypeScript
- Styling: Tailwind CSS (via design-system)
- Build: Vite
- Auth: OpenID Connect (Keycloak)
- API: REST via Kong gateway

### New Directory Structure

```
web-portal/src/
├── main.tsx                    # Entry point
├── App.tsx                     # Router + providers
├── app/
│   ├── AppShell.tsx            # Sidebar + header
│   ├── routes.ts               # Route definitions
│   └── routes/
│       ├── Dashboard.tsx       # Account overview
│       ├── Usage.tsx           # Usage details
│       ├── Billing.tsx         # Payments & history
│       ├── Lines.tsx           # Manage lines
│       ├── LineDetail.tsx      # Single line (SIM, eSIM)
│       ├── Roaming.tsx         # Roaming packs
│       ├── Support.tsx         # Support cases
│       ├── Notifications.tsx  # Message center
│       ├── Catalog.tsx         # Product catalog
│       ├── Orders.tsx          # Order history
│       └── Settings.tsx        # Account settings
├── components/
│   ├── common/
│   │   ├── PageHeader.tsx
│   │   ├── LoadingSkeleton.tsx
│   │   ├── ErrorMessage.tsx
│   │   ├── EmptyState.tsx
│   │   └── ConfirmDialog.tsx
│   ├── dashboard/
│   │   ├── AccountCard.tsx
│   │   ├── UsageSummary.tsx
│   │   └── QuickActions.tsx
│   ├── billing/
│   │   ├── PaymentMethodCard.tsx
│   │   ├── PaymentHistoryList.tsx
│   │   └── PayNowButton.tsx
│   ├── lines/
│   │   ├── LineCard.tsx
│   │   ├── LineActions.tsx
│   │   ├── SIMStatusBadge.tsx
│   │   └── eSIMQRCode.tsx
│   └── support/
│       ├── CaseCard.tsx
│       ├── CaseTimeline.tsx
│       └── CreateCaseForm.tsx
├── services/
│   ├── api.ts                  # Typed fetch wrapper
│   ├── useAccount.ts           # Account data hook
│   ├── useUsage.ts             # Usage data hook
│   ├── useBilling.ts           # Billing hook
│   ├── useLines.ts             # Lines hook
│   └── useAuth.ts              # Auth hook (refactor auth-oidc.ts)
├── types/
│   └── api.ts                  # Shared API types
└── utils/
    ├── format.ts               # Currency, dates
    └── validation.ts            # Form validation
```

---

## Page Specifications

### 1. Dashboard (`/`)
**Purpose:** Account overview at a glance

**Sections:**
- Account summary card (plan, status, type)
- Usage widget (data/voice/SMS with progress bars)
- Billing widget (balance, due date, auto-pay status)
- Quick actions: "View usage", "Pay bill", "Manage lines"
- Notifications badge

**Data:** `/api/v1/customer/dashboard` + `/api/v1/customer/account-overview`

---

### 2. Usage (`/usage`)
**Purpose:** Detailed usage breakdown

**Sections:**
- Billing cycle selector
- Data: used/limit, daily average, peak days
- Voice: used/limit, international calls
- SMS: used/limit
- Usage chart (daily/weekly/monthly)
- Out-of-cycle charges warning

**Data:** `/api/v1/customer/usage`

---

### 3. Billing (`/billing`)
**Purpose:** Payments and payment methods

**Tabs:**
- **Summary**: Current balance, due date, auto-pay
- **Payment methods**: List + add new
- **Payment history**: Last 12 months with receipts
- **Pay now**: One-click pay

**Data:** 
- `/api/v1/customer/billing/summary`
- `/api/v1/customer/payment-methods`
- `/api/v1/customer/payment-history`

---

### 4. Lines (`/lines`)
**Purpose:** Manage all lines

**List View:**
- Line cards showing: number, nickname, status, plan
- Actions: Rename, Set as primary, View details

**Data:** `/api/v1/customer/lines`

---

### 5. Line Detail (`/lines/:lineId`)
**Purpose:** Single line management

**Tabs:**
- **Overview**: Number, plan, status
- **SIM**: SIM number, status, block/unblock
- **eSIM**: QR code, install status, reinstall
- **Usage**: Line-specific usage

**Actions:**
- Block SIM (with confirmation)
- Unblock SIM
- Switch to eSIM
- Rename line

**Data:** `/api/v1/customer/lines/:lineId`

---

### 6. Roaming (`/roaming`)
**Purpose:** Manage roaming

**Sections:**
- Current roaming status (on/off)
- Available packs for current location
- Active packs with usage
- Add pack flow (wizard)

**Data:** 
- `/api/v1/customer/roaming/status`
- `/api/v1/customer/roaming/packs`

---

### 7. Support (`/support`)
**Purpose:** Support cases

**Views:**
- **Open cases**: List with status, last update
- **Case detail**: Timeline, add message, attachments
- **New case**: Category, description, priority

**Data:**
- `/api/v1/customer/support/cases`
- `/api/v1/customer/support/cases/:id`

---

### 8. Notifications (`/notifications`)
**Purpose:** Message center

**Views:**
- Inbox: List of notifications
- Detail: Full message
- Preferences: Categories, channels

**Data:**
- `/api/v1/customer/notifications/inbox`
- `/api/v1/customer/notifications/preferences`

---

### 9. Catalog (`/catalog`)
**Purpose:** Browse products

**Features:**
- Category filters (add-ons, devices, roaming)
- Product cards with pricing
- Add to cart flow

**Data:** `/api/v1/customer/catalog`

---

### 10. Orders (`/orders`)
**Purpose:** Order history

**List:**
- Order cards: date, items, status
- Detail: Full order with timeline

**Data:** `/api/v1/customer/orders`

---

## Navigation

### App Shell

```
┌─────────────────────────────────────────────────────────┐
│  MyTelco                              [Notif] [Profile] │
├────────────┬────────────────────────────────────────────┤
│            │                                            │
│  Dashboard │           Page Content                     │
│  Usage     │                                            │
│  Billing   │                                            │
│  Lines     │                                            │
│  Roaming   │                                            │
│  Support   │                                            │
│            │                                            │
│  ─────────│                                            │
│  Catalog   │                                            │
│  Orders    │                                            │
│  Settings  │                                            │
│            │                                            │
└────────────┴────────────────────────────────────────────┘
```

### Route Map

| Path | Component | Access |
|------|-----------|--------|
| `/` | Dashboard | Customer |
| `/usage` | Usage | Customer |
| `/billing` | Billing | Customer |
| `/billing/pay` | PayNow | Customer |
| `/lines` | Lines | Customer |
| `/lines/:id` | LineDetail | Customer |
| `/roaming` | Roaming | Customer |
| `/support` | Support | Customer |
| `/support/:id` | CaseDetail | Customer |
| `/support/new` | CreateCase | Customer |
| `/notifications` | Notifications | Customer |
| `/catalog` | Catalog | Customer |
| `/orders` | Orders | Customer |
| `/orders/:id` | OrderDetail | Customer |
| `/settings` | Settings | Customer |

---

## API Layer Design

### Current Problem
Auth-oidc.ts exposes raw `authedFetch` - every component handles auth tokens directly.

### Solution: Service Layer

```typescript
// services/api.ts
class ApiClient {
  private baseUrl = '/api/v1/customer';
  
  async get<T>(path: string): Promise<T>
  async post<T>(path: string, body: unknown): Promise<T>
  async put<T>(path: string, body: unknown): Promise<T>
  async delete(path: string): Promise<void>
}

// services/useAccount.ts
export function useAccount() {
  const { authedFetch } = useAuth();
  
  return useQuery({
    queryKey: ['account'],
    queryFn: () => api.get('/account-overview'),
  });
}

// Usage in component
const { data: account, isLoading } = useAccount();
```

### Error Handling

```typescript
// services/api.ts
class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// All API calls go through error handler
async function api.get<T>(path: string): Promise<T> {
  const response = await authedFetch(path);
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new AuthError('Session expired');
    }
    if (response.status === 404) {
      throw new NotFoundError('Resource not found');
    }
    throw new ApiError(response.status, await response.text());
  }
  
  return response.json();
}
```

---

## State Management

### React Query for Server State

```typescript
// All data fetching uses React Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fetch
const { data, isLoading, error } = useQuery({
  queryKey: ['account'],
  queryFn: () => api.get('/account-overview'),
});

// Mutations with cache invalidation
const mutation = useMutation({
  mutationFn: (data) => api.post('/lines', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['lines'] });
  },
});
```

### Local UI State

- **Navigation**: URL + React Router
- **Forms**: React Hook Form
- **Dialogs**: React Context or local state
- **Sidebar**: Local state (expand/collapse)

---

## Implementation Priority

### Phase 1: Foundation (Week 1)
1. Create new directory structure
2. Implement AppShell with sidebar
3. Set up React Router
4. Create typed API client
5. Build common components (LoadingSkeleton, ErrorMessage)

### Phase 2: Core Pages (Week 2)
1. Dashboard (refactor existing)
2. Usage page
3. Billing page
4. Lines list + detail

### Phase 3: Self-Service (Week 3)
1. Roaming management
2. Support cases
3. Notifications

### Phase 4: Commerce (Week 4)
1. Catalog browsing
2. Order flow
3. Checkout

### Phase 5: Polish (Week 5)
1. Settings page
2. Edge cases
3. Accessibility
4. Performance

---

## Backward Compatibility

### During Transition
- Keep existing `/lab` route alongside new pages
- New pages take priority in navigation
- Lab becomes `/admin/debug` or is hidden behind feature flag

### After Launch
- Remove Lab route entirely
- Delete debug components

---

## Success Metrics

1. **User can navigate** to any page via sidebar
2. **Loading states** show skeletons, not raw text
3. **Errors** show user-friendly messages, not API dumps
4. **Mobile responsive** - sidebar becomes bottom nav or hamburger
5. **Accessibility** - keyboard nav, ARIA labels

---

## Open Questions

1. **Mobile-first?** Start with responsive or desktop-first?
2. **Admin features?** Do we need admin portal integration?
3. **Feature flags?** Use flags for gradual rollout?
4. **Analytics?** Track user flows for improvement?

---

## Related ADRs

- ADR-016: Mock Data Strategy (existing)
- ADR-015: Kong JWT Configuration (existing)
