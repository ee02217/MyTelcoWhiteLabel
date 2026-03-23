# Tier 1 Telco-Grade Usage Page - Implementation Plan

## Executive Summary

Rebuild the Usage page to production telco standards using live backend APIs. Target: Verizon/T-Mobile level UX quality.

---

## 1. Backend API Analysis

### Existing APIs (already implemented)

**`GET /api/v1/customer/usage`**
- Query params: `view` (daily|billing-cycle), `lineId` (optional)
- Returns: `CustomerUsageResponse`
  - `view`, `periodStart`, `periodEnd`, `customerId`
  - `totals`: `{ dataMb, voiceMinutes, smsCount }`
  - `lines`: `[{ lineId, msisdn, nickname, usage: {dataMb, voiceMinutes, smsCount} }]`
  - `thresholdCrossings`: Alert data
  - `dataFreshness`: Cache staleness indicator

### Gaps to Address

1. **No roaming usage breakdown** - Roaming usage should be separate
2. **No usage projections** - Can't tell user "at this rate, you'll hit limit in X days"
3. **No historical comparison** - Previous period vs current
4. **No detailed daily breakdown API** - Only aggregate data

### Required Backend Extensions

```
New endpoints needed:
- GET /api/v1/customer/usage/daily - Granular daily usage
- GET /api/v1/customer/usage/projections - Rate-based predictions  
- GET /api/v1/customer/usage/history - Previous period comparison
```

---

## 2. Frontend Architecture

### Technology Stack
- React 18 + TypeScript
- TanStack Query (React Query) for server state
- Tailwind CSS for styling
- Recharts for data visualization
- date-fns for date handling

### Component Structure

```
UsagePage/
├── UsagePage.tsx              # Main container, handles routing
├── hooks/
│   ├── useUsageData.ts        # TanStack Query hook for /usage API
│   ├── useDailyUsage.ts       # Daily breakdown hook
│   └── useUsageProjections.ts # Projection calculations
├── components/
│   ├── BillingCycleSelector/  # Period selection dropdown
│   ├── UsageSummaryCards/     # Data/Voice/SMS summary cards
│   ├── UsageByLine/          # Per-line breakdown table
│   ├── UsageChart/            # Daily usage bar chart
│   ├── UsageProjections/      # "You'll hit limit by..." component
│   ├── ThresholdAlerts/       # Warning banners
│   └── UsageDetailsTable/     # Detailed breakdown table
├── types/
│   └── usage.ts              # TypeScript interfaces matching API
└── utils/
    ├── formatters.ts          # GB/min/sms formatting
    └── calculations.ts       # Projection math
```

---

## 3. UI/UX Design Specification

### Visual Design

**Color Palette**
- Primary: `#0066CC` (Telco blue)
- Secondary: `#1A1A1A` (Near black)
- Success: `#00A84F` (Green)
- Warning: `#FF9500` (Amber)
- Danger: `#FF3B30` (Red)
- Background: `#F5F5F7` (Light gray - Apple-style)
- Card Background: `#FFFFFF`

**Typography**
- Headings: SF Pro Display (Apple system font stack)
- Body: SF Pro Text
- Monospace numbers: SF Mono (for usage values)

**Spacing System**
- Base unit: 4px
- Card padding: 24px
- Section gap: 32px
- Component gap: 16px

### Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Header: "Usage Details" + Billing Cycle Selector + [?] Help│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │   DATA      │ │   VOICE     │ │    SMS      │          │
│  │  ⚠️ 8.2 GB │ │  342 min    │ │   87 msg    │          │
│  │  of 10 GB  │ │  of 500 min │ │  of 200    │          │
│  │  [████░░░] │ │  [███░░░░] │ │  [██░░░░]  │          │
│  │ 82% used   │ │  68% used   │ │  44% used   │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  "At your current rate, you'll hit your data limit  │   │
│  │   in 5 days (Mar 28)"              [Upgrade Plan →] │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  USAGE BY LINE                                      │   │
│  │  ┌───────────────────────────────────────────────┐  │   │
│  │  │ +351912345678  │ 5.2 GB │ 45% │ ████████░░ │  │   │
│  │  │ Primary        │ of 10  │      │             │  │   │
│  │  ├───────────────────────────────────────────────┤  │   │
│  │  │ +351923456789  │ 2.8 GB │ 28% │ █████░░░░░ │  │   │
│  │  │ Family         │ of 10  │      │             │  │   │
│  │  ├───────────────────────────────────────────────┤  │   │
│  │  │ +351934567890  │ 0.2 GB │ 2%  │ █░░░░░░░░░ │  │   │
│  │  │ Work           │ of 10  │      │             │  │   │
│  │  └───────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  DAILY USAGE                                         │   │
│  │  [Bar chart showing last 30 days]                    │   │
│  │                                                       │   │
│  │  Mar 15 ████████████████ 2.3 GB (Peak)            │   │
│  │  Mar 14 ██████████████░░ 2.0 GB                   │   │
│  │  Mar 13 ██████░░░░░░░░░░░ 0.9 GB                   │   │
│  │  ...                                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  USAGE DETAILS                          [Export CSV ↓] │   │
│  │  Tab: [All] [Data] [Voice] [SMS]                    │   │
│  │  ┌───────────────────────────────────────────────┐  │   │
│  │  │ Date       │ Type    │ Amount │ Running Total │  │   │
│  │  ├───────────────────────────────────────────────┤  │   │
│  │  │ Mar 22     │ Data    │ 1.2 GB │ 8.2 GB       │  │   │
│  │  │ Mar 22     │ Voice   │ 15 min│ 342 min      │  │   │
│  │  │ Mar 22     │ SMS     │ 3 msg │ 87 msg       │  │   │
│  │  └───────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Tier 1 Telco Features

1. **Smart Projections**
   - Calculate daily average usage rate
   - Predict date of limit breach
   - Show "X days remaining" prominently

2. **Threshold Alerts**
   - 50%, 80%, 90%, 100% thresholds
   - Visual warning banners
   - Upgrade prompts at appropriate times

3. **Line-Level Granularity**
   - Per-line usage breakdown
   - Line nickname/label display
   - Sort by usage amount

4. **Historical Comparison**
   - vs. previous billing cycle
   - Percentage change indicators
   - Trend arrows (↑↓)

5. **Data Export**
   - CSV download of usage data
   - Date range selection

6. **Accessibility**
   - WCAG 2.1 AA compliance
   - Screen reader support
   - High contrast mode support

---

## 4. Implementation Phases

### Phase 1: API Integration (Foundation)
- Create TypeScript types matching backend APIs
- Set up TanStack Query hooks
- Create UsageSummaryCards with real data
- Implement BillingCycleSelector

### Phase 2: Core Features
- Build UsageByLine component
- Implement UsageChart with Recharts
- Add threshold alert banners
- Connect projections logic

### Phase 3: Polish & Tier-1 Features
- Add detailed usage table with tabs
- Implement CSV export
- Historical comparison UI
- Loading skeletons & error states
- Mobile responsive optimization

---

## 5. API Contract

### Request
```
GET /api/v1/customer/usage?view=billing-cycle
Authorization: Bearer <token>
```

### Response
```json
{
  "view": "billing-cycle",
  "periodStart": "2026-03-01",
  "periodEnd": "2026-03-31",
  "customerId": "cust_123",
  "totals": {
    "dataMb": 8192,
    "voiceMinutes": 342,
    "smsCount": 87
  },
  "lines": [
    {
      "lineId": "line_1",
      "msisdn": "+351912345678",
      "nickname": "Primary",
      "usage": {
        "dataMb": 5120,
        "voiceMinutes": 280,
        "smsCount": 65
      }
    }
  ],
  "thresholdCrossings": [
    {
      "serviceType": "DATA",
      "thresholdPercent": 80,
      "message": "You've used 80% of your data allowance"
    }
  ],
  "dataFreshness": {
    "source": "REAL_TIME",
    "lastUpdated": "2026-03-23T20:00:00Z",
    "staleness": "FRESH"
  }
}
```

---

## 6. File Changes Summary

### Backend (customer-bff)
```
Modified:
- CustomerDashboardController.java (add projection endpoint)
- AggregationService.java (add projection calculations)

New:
- UsageProjectionResponse.java
- DailyUsageResponse.java
```

### Frontend (web-portal)
```
Modified:
- Usage.tsx (complete rewrite)
- App.tsx (add usage routes)

New:
- components/usage/BillingCycleSelector.tsx
- components/usage/UsageSummaryCards.tsx
- components/usage/UsageByLine.tsx
- components/usage/UsageChart.tsx
- components/usage/UsageProjections.tsx
- components/usage/ThresholdAlerts.tsx
- components/usage/UsageDetailsTable.tsx
- hooks/useUsageData.ts
- hooks/useDailyUsage.ts
- types/usage.ts
- utils/formatters.ts
- utils/calculations.ts
```

---

## 7. Success Metrics

- Page load time: < 2s on 4G
- All API errors handled gracefully
- Mobile: < 320px width supported
- Accessibility: Lighthouse score > 90
- Zero console errors in production
