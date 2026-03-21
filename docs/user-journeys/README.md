# User Journey Documentation

This document provides visual documentation of all user journeys implemented in the MyTelco White-Label platform.

---

## Table of Contents

1. [Mobile App - Customer Features](#mobile-app---customer-features)
   - [Profile & Account Management](#profile--account-management)
   - [Billing & Payment](#billing--payment)
   - [Line Lifecycle Management](#line-lifecycle-management)
   - [Settings & Preferences](#settings--preferences)
2. [Admin Portal - Operator Features](#admin-portal---operator-features)
   - [Analytics Dashboard](#analytics-dashboard)
   - [User Management](#user-management)
   - [Journey & Flow Management](#journey--flow-management)
   - [Audit Log](#audit-log)

---

## Mobile App - Customer Features

### Profile & Account Management

**Feature ID:** #155  
**Path:** Mobile App → Profile Tab

#### Journey Steps

| Step | Screen | Description |
|------|--------|-------------|
| 1 | **Profile View** | User sees their name, email, phone number with edit option |
| 2 | **Edit Profile** | Form to update name, email, phone number |
| 3 | **Notification Preferences** | Toggles for push, SMS, email, marketing notifications |
| 4 | **Active Sessions** | List of logged-in sessions with device info |
| 5 | **Session Management** | Option to log out individual sessions |
| 6 | **Data Export (GDPR)** | Request download of personal data |
| 7 | **Account Deletion** | Confirm and delete account with warnings |

#### Screen Descriptions

```
┌─────────────────────────────┐
│  👤 Profile                │
├─────────────────────────────┤
│  ┌─────────────────────┐   │
│  │   Avatar/Photo      │   │
│  └─────────────────────┘   │
│                             │
│  Name: John Doe            │
│  Email: john@example.com   │
│  Phone: +351912345678      │
│                             │
│  [Edit Profile]            │
│                             │
│  ── Notifications ──       │
│  Push    [Toggle: ON]      │
│  SMS     [Toggle: ON]      │
│  Email   [Toggle: ON]      │
│  Marketing[Toggle: OFF]    │
│                             │
│  ── Sessions ──            │
│  📱 iPhone 14 - Lisbon    │
│     Active now             │
│  💻 MacBook - Lisbon       │
│     2 hours ago            │
│                             │
│  [Export My Data]          │
│  [Delete Account]          │
└─────────────────────────────┘
```

#### API Endpoints

- `GET /api/v1/customer/profile` - Fetch profile
- `PUT /api/v1/customer/profile` - Update profile
- `GET /api/v1/customer/profile/notifications` - Notification prefs
- `PUT /api/v1/customer/profile/notifications` - Update prefs
- `GET /api/v1/customer/profile/sessions` - Active sessions
- `DELETE /api/v1/customer/profile/sessions/{id}` - Logout session
- `GET /api/v1/customer/profile/export` - Request data export
- `DELETE /api/v1/customer/profile` - Delete account

---

### Billing & Payment

**Feature ID:** #156  
**Path:** Mobile App → Billing Tab

#### Journey Steps

| Step | Screen | Description |
|------|--------|-------------|
| 1 | **Payment Methods** | View saved cards with brand, last 4 digits |
| 2 | **Add Card** | Form to add new payment method |
| 3 | **Set Default** | Mark a card as primary payment |
| 4 | **Delete Card** | Remove payment method |
| 5 | **Billing Addresses** | Manage billing addresses |
| 6 | **Add Address** | New billing address form |
| 7 | **Auto-Pay Setup** | Enable automatic payments |
| 8 | **Schedule Day** | Choose payment date (1st/5th/10th/15th/20th/25th) |
| 9 | **Invoices** | View billing history |
| 10 | **Download Invoice** | Get PDF receipt |

#### Screen Descriptions

```
┌─────────────────────────────┐
│  💳 Billing                │
├─────────────────────────────┤
│  [Cards] [Address]         │
│  [Auto-Pay] [Invoices]    │
├─────────────────────────────┤
│  Payment Methods           │
│  ─────────────────────────  │
│  ┌─────────────────────┐   │
│  │ 💳 VISA •••• 4242 │   │
│  │    Default         │   │
│  │ Exp: 12/2027       │   │
│  └─────────────────────┘   │
│  ┌─────────────────────┐   │
│  │ 💳 Mastercard •••• │   │
│  │    5555            │   │
│  │ Exp: 06/2026       │   │
│  └─────────────────────┘   │
│                             │
│  [+ Add New Card]          │
└─────────────────────────────┘
```

```
┌─────────────────────────────┐
│  📄 Invoices               │
├─────────────────────────────┤
│  ┌─────────────────────┐   │
│  │ INV-2026-001  €35.99│   │
│  │ Paid  •  Mar 15     │   │
│  │ [Download PDF]      │   │
│  └─────────────────────┘   │
│  ┌─────────────────────┐   │
│  │ INV-2026-002  €35.99│   │
│  │ Pending  •  Apr 15  │   │
│  │ [Download PDF]      │   │
│  └─────────────────────┘   │
└─────────────────────────────┘
```

#### API Endpoints

- `GET /api/v1/customer/billing/payment-methods` - List payment methods
- `POST /api/v1/customer/billing/payment-methods` - Add payment method
- `DELETE /api/v1/customer/billing/payment-methods/{id}` - Delete payment method
- `PUT /api/v1/customer/billing/payment-methods/{id}/default` - Set default
- `GET /api/v1/customer/billing/addresses` - List addresses
- `POST /api/v1/customer/billing/addresses` - Add address
- `DELETE /api/v1/customer/billing/addresses/{id}` - Delete address
- `GET /api/v1/customer/billing/autopay` - Get auto-pay config
- `PUT /api/v1/customer/billing/autopay` - Update auto-pay
- `GET /api/v1/customer/billing/invoices` - List invoices

---

### Line Lifecycle Management

**Feature ID:** #157  
**Path:** Mobile App → Lines Tab

#### Journey Steps

| Step | Screen | Description |
|------|--------|-------------|
| 1 | **Lines List** | View all phone lines (active, pending, cancelled) |
| 2 | **Line Details** | See phone number, plan, SIM type |
| 3 | **eSIM Activation** | Display QR code for eSIM setup |
| 4 | **SIM Delivery** | Track physical SIM delivery status |
| 5 | **Add New Line** | Get new number or port existing |
| 6 | **Plan Change** | Upgrade/downgrade with proration preview |
| 7 | **Cancel Line** | Cancel with retention offer |

#### Screen Descriptions

```
┌─────────────────────────────┐
│  📱 My Lines               │
├─────────────────────────────┤
│  [+ Add Line]              │
├─────────────────────────────┤
│  ┌─────────────────────┐   │
│  │ +351912345678      │   │
│  │ Premium 50GB • eSIM│   │
│  │ ● Active           │   │
│  │ [View Details]     │   │
│  └─────────────────────┘   │
│  ┌─────────────────────┐   │
│  │ +351912345679      │   │
│  │ Basic 10GB • SIM   │   │
│  │ ○ Shipped          │   │
│  │ Est. Delivery: Mar 25│
│  └─────────────────────┘   │
└─────────────────────────────┘
```

```
┌─────────────────────────────┐
│  📱 Line Details           │
├─────────────────────────────┤
│  ← Back                   │
│  +351912345678             │
│  Premium 50GB - €35.99/mo  │
├─────────────────────────────┤
│  📶 eSIM Activation        │
│  ─────────────────────────  │
│  ┌─────────────────────┐   │
│  │                    │   │
│  │   [QR CODE]       │   │
│  │                    │   │
│  └─────────────────────┘   │
│  Or enter: LMNK-ABCD-EFGH  │
│                             │
│  [Change Plan]             │
│  [Cancel Line]             │
└─────────────────────────────┘
```

#### API Endpoints

- `GET /api/v1/customer/lines` - List all lines
- `GET /api/v1/customer/lines/{id}` - Get line
- `GET /api/v1/customer/lines/{id}/details` - Line details with usage
- `POST /api/v1/customer/lines` - Add new line
- `POST /api/v1/customer/lines/{id}/cancel` - Cancel line
- `GET /api/v1/customer/lines/{id}/proration` - Proration preview
- `POST /api/v1/customer/lines/{id}/change-plan` - Change plan

---

### Settings & Preferences

**Feature ID:** #159  
**Path:** Mobile App → Settings Tab

#### Journey Steps

| Step | Screen | Description |
|------|--------|-------------|
| 1 | **Language** | Select locale (en-GB, pt-PT, es-ES, etc.) |
| 2 | **Theme** | Light/Dark/System theme toggle |
| 3 | **Experiments** | View active A/B tests |
| 4 | **Push Notifications** | Enable/disable push |
| 5 | **Usage Thresholds** | Configure alert percentages |

#### Screen Descriptions

```
┌─────────────────────────────┐
│  ⚙️ Settings               │
├─────────────────────────────┤
│  [Language] [Theme]        │
│  [Alerts] [Experiments]    │
├─────────────────────────────┤
│  Language                  │
│  ─────────────────────────  │
│  🇬🇧 English (UK)  ✓      │
│  🇵🇹 Portuguese (PT)      │
│  🇪🇸 Spanish (ES)         │
│  🇫🇷 French (FR)          │
├─────────────────────────────┤
│  Theme                     │
│  ─────────────────────────  │
│  ☀️ Light    ○            │
│  🌙 Dark     ●            │
│  💻 System   ○            │
└─────────────────────────────┘
```

---

## Admin Portal - Operator Features

### Analytics Dashboard

**Feature ID:** #158  
**Path:** Admin Portal → Analytics Tab

#### Journey Steps

| Step | Screen | Description |
|------|--------|-------------|
| 1 | **Overview KPIs** | Total users, revenue, ARPU, churn |
| 2 | **Revenue Trend** | Interactive chart with date range |
| 3 | **User Analytics** | Growth charts, top plans |
| 4 | **Usage Patterns** | Usage by hour heatmap |
| 5 | **Geographic** | Top countries by users |
| 6 | **Export** | Download reports (CSV/JSON) |

#### Screen Descriptions

```
┌─────────────────────────────────────────────────────────────┐
│  📊 Analytics Dashboard                    [7d|30d|90d]   │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ 12,458   │ │ 8,234    │ │€456,789  │ │ €36.72   │    │
│  │ Total    │ │ Active   │ │ Revenue   │ │ ARPU     │    │
│  │ Users 📈 │ │ Users 📈 │ │ Revenue 📈│ │          │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
├─────────────────────────────────────────────────────────────┤
│  Revenue Trend (Last 30 Days)                              │
│  ▁▂▃▅▆▇████████▅▆▅▃▂▁▂▃▅▆                               │
│  ──────────────────────────────────────                   │
│  ┌──────────────────┐ ┌──────────────────┐                │
│  │ Top Plans        │ │ Usage by Hour    │                │
│  │ ████ Premium 5K  │ │ ▃▃▅▅████▅▅▃▃    │                │
│  │ ███ Basic   4K   │ │ 00    12    24  │                │
│  └──────────────────┘ └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

---

### User Management

**Feature ID:** #158  
**Path:** Admin Portal → Users Tab

#### Journey Steps

| Step | Screen | Description |
|------|--------|-------------|
| 1 | **User List** | Searchable, filterable table |
| 2 | **Filters** | By role, status, date range |
| 3 | **Bulk Select** | Select multiple users |
| 4 | **Bulk Actions** | Activate, suspend, delete |
| 5 | **Invite User** | Send email invitation |
| 6 | **Export** | Download user list |

#### Screen Descriptions

```
┌─────────────────────────────────────────────────────────────┐
│  👥 User Management              [+Invite] [Export CSV]    │
├─────────────────────────────────────────────────────────────┤
│  [Search...] [Role▾] [Status▾] [Sort▾] [Table|Cards]      │
├─────────────────────────────────────────────────────────────┤
│  Stats: 125 Total | 98 Active | 5 Suspended | 12 Admins   │
├─────────────────────────────────────────────────────────────┤
│  ☐ │ Name         │ Role    │ Status  │ Created │ Login  │
│  ──┼──────────────┼─────────┼─────────┼─────────┼────────│
│  ☐ │ John Doe     │ Admin   │ Active  │ Jan 15  │ Today  │
│  ☐ │ Jane Smith   │ User    │ Active  │ Feb 01  │ Yesterday│
│  ☐ │ Bob Wilson   │ Operator│ Active  │ Mar 10  │ Mar 20 │
│  ──┴──────────────┴─────────┴─────────┴─────────┴────────│
│  [Activate] [Suspend] [Delete]  (2 selected)              │
└─────────────────────────────────────────────────────────────┘
```

---

### Journey & Flow Management

**Feature ID:** #158  
**Path:** Admin Portal → Journeys Tab

#### Journey Steps

| Step | Screen | Description |
|------|--------|-------------|
| 1 | **Journey List** | All journeys with status |
| 2 | **Journey Details** | Flow visualization |
| 3 | **Stats** | Triggered, completed, abandoned |
| 4 | **Create Journey** | Define trigger and steps |
| 5 | **Publish** | Activate journey |
| 6 | **Edit/Pause** | Manage active journeys |

#### Screen Descriptions

```
┌─────────────────────────────────────────────────────────────┐
│  🔀 Journeys & Flows                    [+Create Journey]  │
├─────────────────────────────────────────────────────────────┤
│  Stats: 3 Total | 2 Active | 1 Draft | 1,250 Triggered    │
├──────────────────────────────┬──────────────────────────────┤
│  All Journeys               │ Flow Visualization           │
│  ─────────────────────      │ ───────────────────────────   │
│  ┌────────────────────┐    │  ┌─────────────┐             │
│  │ Welcome Series     │    │  │  TRIGGER    │             │
│  │ ● Active  📧 4stp │    │  │ USER_CREATED│             │
│  │ [View Details]    │    │  └──────┬──────┘             │
│  └────────────────────┘    │         ↓                   │
│  ┌────────────────────┐    │  ┌─────────────┐             │
│  │ Churn Prevention   │    │  │  📧 Email   │             │
│  │ ● Active  ⚠️ 4stp │    │  │ Welcome!    │             │
│  └────────────────────┘    │  └──────┬──────┘             │
│  ┌────────────────────┐    │         ↓                   │
│  │ Plan Upgrade       │    │  ┌─────────────┐             │
│  │ ○ Draft    📈 3stp│    │  │  📱 SMS     │             │
│  └────────────────────┘    │  │ Verify      │             │
│                             │  └──────┬──────┘             │
│                             │         ↓                   │
│                             │  ┌─────────────┐             │
│                             │  │    END     │             │
│                             │  └─────────────┘             │
├──────────────────────────────┴──────────────────────────────┤
│  Triggered: 1,250 | Completed: 1,100 | Rate: 88%          │
│  [▶ Publish] [⏸ Pause] [✏️ Edit] [🗑 Delete]              │
└─────────────────────────────────────────────────────────────┘
```

---

### Audit Log

**Feature ID:** #158  
**Path:** Admin Portal → Audit Tab

#### Journey Steps

| Step | Screen | Description |
|------|--------|-------------|
| 1 | **Log View** | Paginated activity log |
| 2 | **Filters** | By action type, user, date |
| 3 | **Expand Details** | View full JSON changes |
| 4 | **Live Refresh** | Auto-refresh toggle |
| 5 | **Export** | Download audit logs |

#### Screen Descriptions

```
┌─────────────────────────────────────────────────────────────┐
│  📋 Audit Log                    [🔴 Live] [Export]         │
├─────────────────────────────────────────────────────────────┤
│  Stats: 1,247 Events | Today: 45 | Users: 12 | Types: 15  │
├─────────────────────────────────────────────────────────────┤
│  [Action▾] [User...] [Today|7d|30d]                        │
├─────────────────────────────────────────────────────────────┤
│  Time       │ Action       │ User      │ IP        │ Details│
│  ───────────┼──────────────┼───────────┼───────────┼────────│
│  10:30:45  │ USER_CREATE  │ admin     │ 192.168.x│  ▶     │
│  10:29:12  │ PLAN_CHANGE  │ operator1 │ 192.168.x│  ▶     │
│  10:28:33  │ LOGIN        │ user5     │ 192.168.x│  ▶     │
│  10:27:01  │ LINE_CANCEL  │ admin     │ 192.168.x│  ▶     │
├─────────────────────────────────────────────────────────────┤
│  Showing 20 of 1,247 | [← Prev] Page 1 [Next →]           │
├─────────────────────────────────────────────────────────────┤
│  Sidebar:                                                   │
│  Top Actions:           Most Active Users:                 │
│  • USER_CREATE (45)     1. admin (234)                    │
│  • PLAN_CHANGE (38)     2. operator1 (189)                │
│  • LINE_ADD (27)        3. support (156)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## API Summary

| Feature | Base Path | Methods |
|---------|-----------|---------|
| Profile | `/api/v1/customer/profile` | GET, PUT |
| Notifications | `/api/v1/customer/profile/notifications` | GET, PUT |
| Sessions | `/api/v1/customer/profile/sessions` | GET, DELETE |
| Billing | `/api/v1/customer/billing` | CRUD |
| Lines | `/api/v1/customer/lines` | CRUD |
| Analytics | `/api/v1/admin/analytics` | GET |
| Users | `/api/v1/admin/users` | GET, POST, Bulk |
| Journeys | `/api/v1/admin/journeys` | CRUD |
| Audit | `/api/v1/admin/audit` | GET |

---

## Screenshots Placeholder

To add actual screenshots:

1. Capture screenshots of each screen
2. Save as PNG files in `docs/user-journeys/screenshots/`
3. Reference in this document using:
   ```markdown
   ![Profile Screen](./screenshots/profile-screen.png)
   ```

---

*Last Updated: 2026-03-21*
*Document Version: 1.0*
