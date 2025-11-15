# Invoice-HUB Frontend Implementation Plan

**Version:** 1.0.0  
**Last Updated:** November 15, 2025  
**Status:** Planning Phase

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Backend API Analysis](#backend-api-analysis)
3. [Frontend Architecture Overview](#frontend-architecture-overview)
4. [System Admin Frontend](#system-admin-frontend)
5. [User Frontend](#user-frontend)
6. [Technology Stack](#technology-stack)
7. [Component Architecture](#component-architecture)
8. [Routing Structure](#routing-structure)
9. [State Management](#state-management)
10. [API Integration](#api-integration)
11. [Authentication & Authorization](#authentication--authorization)
12. [UI/UX Design Guidelines](#uiux-design-guidelines)
13. [Development Roadmap](#development-roadmap)
14. [Deployment Strategy](#deployment-strategy)

---

## Executive Summary

Invoice-HUB requires **two separate frontend applications** to serve different user personas:

1. **System Admin Frontend** - For system administrators managing the entire SaaS platform
2. **User Frontend** - For tenant users managing their invoicing operations

Both frontends will consume the same backend API but with different access levels and feature sets based on user roles and permissions.

### Key Requirements

- **Multi-tenant Architecture**: Each frontend must support tenant isolation
- **Role-Based Access Control (RBAC)**: Different views/features based on user roles
- **Real-time Updates**: WebSocket/webhook integration for live notifications
- **Responsive Design**: Mobile-first approach for accessibility
- **Polish VAT Compliance**: Specialized UI for Polish tax requirements
- **Performance**: Fast load times, optimized API calls, efficient rendering

---

## Backend API Analysis

### API Overview

The backend provides **80+ REST API endpoints** across 13 categories:

| Category | Endpoints | Purpose |
|----------|-----------|---------|
| **Authentication** | 4 | User registration, login, token refresh, logout |
| **Health & Monitoring** | 6 | System health checks, metrics, version info |
| **Companies** | 5 | Company CRUD operations |
| **Customers** | 8 | Customer management, search, merge |
| **Products** | 7 | Product catalog with VAT rates |
| **Invoices** | 15 | Full invoice lifecycle management |
| **Payments** | 7 | Payment recording, refunds, webhooks |
| **Templates** | 9 | Invoice template management |
| **Notifications** | 7 | In-app notification system |
| **Reports** | 6 | Dashboard, sales, tax, customer reports |
| **Webhooks** | 8 | Webhook subscriptions and delivery |
| **Scheduler** | 4 | Automated task management |
| **Allegro** | 6 | E-commerce marketplace integration |

### User Roles & Permissions

```typescript
enum UserRole {
  ADMIN = 'admin',        // Full tenant access, user management
  MANAGER = 'manager',    // Invoice approval, team management
  ACCOUNTANT = 'accountant', // Financial operations, reports
  USER = 'user'          // Basic invoice operations
}
```

### Subscription Tiers

```typescript
enum SubscriptionTier {
  FREE = 'free',              // 100 invoices/month
  BASIC = 'basic',            // 1,000 invoices/month
  PROFESSIONAL = 'professional', // 10,000 invoices/month
  ENTERPRISE = 'enterprise'    // Unlimited
}
```

### Key Backend Entities

1. **Tenant** - Multi-tenant organization with subscription management
2. **User** - Individual user within tenant with role-based permissions
3. **Company** - Seller/issuer of invoices (supports multiple per tenant)
4. **Customer** - Buyer/recipient of invoices with NIP validation
5. **Product** - Items/services catalog with Polish VAT rates (23%, 8%, 5%, 0%, exempt)
6. **Invoice** - Core business document with full lifecycle (draft → sent → paid)
7. **Payment** - Payment records and reconciliation
8. **Webhook** - Event subscriptions for integrations
9. **AllegroIntegration** - E-commerce marketplace connection
10. **Template** - Customizable invoice and email templates
11. **Notification** - In-app notification system

---

## Frontend Architecture Overview

### Separation of Concerns

We need **TWO distinct frontend applications**:

```
Invoice-HUB/
├── frontend-admin/          # System Admin Application
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard/      # Platform metrics
│   │   │   ├── Tenants/        # Tenant management
│   │   │   ├── Users/          # Cross-tenant user management
│   │   │   ├── Monitoring/     # System health & performance
│   │   │   ├── Billing/        # Subscription management
│   │   │   └── Settings/       # System configuration
│   │   ├── components/
│   │   ├── services/
│   │   ├── store/
│   │   └── utils/
│   ├── package.json
│   └── README.md
│
└── frontend-user/           # User Application (Tenant-scoped)
    ├── src/
    │   ├── pages/
    │   │   ├── Dashboard/      # Business metrics
    │   │   ├── Invoices/       # Invoice management
    │   │   ├── Customers/      # Customer management
    │   │   ├── Products/       # Product catalog
    │   │   ├── Payments/       # Payment tracking
    │   │   ├── Reports/        # Analytics & reports
    │   │   ├── Templates/      # Template management
    │   │   ├── Notifications/  # Notification center
    │   │   ├── Integrations/   # Allegro, webhooks
    │   │   └── Settings/       # Company & user settings
    │   ├── components/
    │   ├── services/
    │   ├── store/
    │   └── utils/
    ├── package.json
    └── README.md
```

### Why Two Separate Applications?

1. **Different User Personas**: Admins manage platform, users manage invoices
2. **Security Isolation**: Admin features require elevated permissions
3. **Performance**: Smaller bundle size for each app
4. **Scalability**: Independent deployment and scaling
5. **Maintenance**: Easier to maintain and update separately
6. **Clarity**: Clear separation of concerns

---

## System Admin Frontend

### Purpose

Platform administrators need tools to:
- Monitor and manage all tenants across the system
- View platform-wide metrics and analytics
- Handle subscription and billing management
- Monitor system health and performance
- Manage cross-tenant user accounts
- Configure system-wide settings and feature flags

### Key Features

#### 1. Platform Dashboard
**Metrics:**
- Total tenants (active, trial, suspended, cancelled)
- Total users across all tenants
- Total invoices generated (today, this month, all time)
- Revenue analytics (MRR, ARR, churn rate)
- System health indicators
- API response times and error rates

**Visualizations:**
- Tenant growth chart (over time)
- Revenue trends
- Top tenants by usage
- Geographic distribution
- Subscription tier breakdown

#### 2. Tenant Management

**Tenant List:**
- Searchable/filterable table with columns:
  - Tenant name
  - Subscription tier & status
  - User count
  - Invoice count this month
  - Quota usage (e.g., "850/1000")
  - Last active date
  - Actions (view, edit, suspend, delete)
- Filters: Status, tier, date created, search by name
- Bulk operations

**Tenant Details Page:**
- Organization information
- Subscription details and history
- User list (with roles)
- Invoice statistics and trends
- Feature flags for this tenant
- Settings and configuration
- Audit log of administrative actions
- Quick actions: Upgrade, suspend, extend trial

**Create New Tenant:**
- Manual tenant provisioning form
- Set initial subscription tier
- Create admin user
- Configure initial settings

#### 3. Cross-Tenant User Management

- View all users across the entire platform
- Search by email, name, tenant
- Filter by role, status, tenant
- Disable/enable accounts
- Reset passwords
- Impersonate user (for support purposes)
- View user activity logs

#### 4. System Monitoring

**Health Dashboard:**
- Service status (API, Database, Redis, Queue, Storage)
- Response time graphs (real-time)
- Error rate monitoring
- Active connections
- Queue depth and processing rate

**Performance Metrics:**
- Endpoint performance breakdown
- Slow query logs
- Cache hit/miss rates
- Database connection pool status
- Memory and CPU usage

#### 5. Billing & Subscriptions

- Subscription plan management
- Generate invoices for tenants
- Payment processing integration
- Usage-based billing calculations
- Quota enforcement and notifications
- Billing history and reports

#### 6. Audit Logs & Support

- System-wide audit log viewer
- Filter by tenant, user, action, date
- Error tracking and debugging tools
- Support ticket management (if applicable)

### Admin Routes

```
/admin
├── /login                  # Admin login (separate from user login)
├── /dashboard              # Platform overview
├── /tenants
│   ├── /list              # All tenants
│   ├── /create            # New tenant form
│   └── /:id               # Tenant details & management
├── /users                 # Cross-tenant user management
├── /monitoring
│   ├── /health            # System health dashboard
│   ├── /performance       # Performance metrics
│   └── /logs              # Audit logs viewer
├── /billing
│   ├── /subscriptions     # Manage subscriptions
│   ├── /invoices          # Platform billing invoices
│   └── /usage             # Usage analytics
└── /settings              # System-wide configuration
```

### Admin-Specific Requirements

- **Separate Authentication**: Admin users are not tenant-scoped
- **Super Admin Role**: Platform-wide access and permissions
- **Enhanced Security**: 2FA mandatory, IP whitelisting, audit logging
- **Different UI Theme**: Distinct from user frontend for clarity

---

## User Frontend

### Purpose

Tenant users need tools to:
- Manage their invoice lifecycle (create, send, track, export)
- Maintain customer and product databases
- Track payments and reconciliation
- Generate compliance reports (Polish VAT, JPK_FA)
- Integrate with external systems (Allegro, webhooks)
- Customize invoice templates and branding
- Monitor business metrics and analytics

### Key Features

#### 1. Business Dashboard

**Key Metrics (Tenant-scoped):**
- Revenue (current month vs last month, % change)
- Invoice count by status (draft, sent, paid, overdue)
- Outstanding amount (unpaid invoices)
- Overdue invoices count and total
- Customers added this month
- Products in catalog

**Visualizations:**
- Revenue trend chart (last 12 months)
- Invoice status pie chart
- Top 5 customers by revenue
- Top 5 products by sales
- Payment collection rate
- Monthly growth indicators

**Quick Actions:**
- Create new invoice
- Record payment
- View overdue invoices
- Generate report

#### 2. Invoice Management

**Invoice List:**
- Advanced table with sorting, filtering, pagination
- Columns: Invoice #, Customer, Date, Due Date, Total, Status, Actions
- Status indicators: Color-coded badges (draft=gray, sent=blue, paid=green, overdue=red)
- Quick filters: All, Draft, Sent, Paid, Overdue
- Search by invoice number, customer name
- Bulk operations: Send, export, delete
- Export to PDF, Excel, CSV

**Invoice Creation (Wizard or Form):**
1. **Company Selection** (if tenant has multiple companies)
2. **Customer Selection**
   - Autocomplete search
   - Quick add new customer inline
   - Recent customers list
3. **Invoice Details**
   - Invoice type (standard, proforma, corrective, advance, final)
   - Issue date, due date
   - Payment method
   - Currency (PLN, EUR, USD)
4. **Line Items**
   - Add products from catalog or manual entry
   - Columns: Description, Quantity, Unit Price, VAT Rate, Discount, Total
   - Automatic calculations
   - VAT rate selector (23%, 8%, 5%, 0%, exempt)
5. **Additional Information**
   - Notes (visible to customer)
   - Terms and conditions
   - Internal notes (not on invoice)
6. **Preview & Submit**
   - PDF preview
   - Edit before saving
   - Save as draft or approve immediately

**Invoice Detail View:**
- Full invoice display (PDF-like rendering)
- Timeline of actions (created, sent, viewed, paid)
- Quick actions:
  - Edit (if draft)
  - Send via email
  - Download PDF
  - Print
  - Record payment
  - Duplicate
  - Create correction invoice
  - Cancel
- Related documents (payments, corrections)
- Activity log

#### 3. Customer Management

**Customer List:**
- Searchable table
- Columns: Name, Email, Type (company/individual), NIP, Total Invoices, Outstanding Balance
- Filters: Customer type, has outstanding balance
- Quick add customer button
- Import from CSV

**Customer Profile:**
- Contact information (name, email, phone)
- Billing address
- NIP (Polish VAT number) with validation
- Customer type (company or individual)
- Invoice history table
- Payment history
- Total revenue from customer
- Average invoice value
- Notes and tags
- Custom fields

#### 4. Product Catalog

**Product List:**
- Table view: SKU, Name, Category, Price, VAT Rate, Unit
- Categories sidebar/filter
- Search by name or SKU
- Quick edit inline
- Bulk operations

**Product Details:**
- Full description
- SKU and barcode
- Base price
- VAT rate (with Polish VAT categories)
- Unit of measure (pcs, hours, kg, etc.)
- Category
- Active/inactive status
- Usage statistics (how many times sold)

#### 5. Payment Tracking

**Payment List:**
- Recent payments table
- Columns: Date, Invoice #, Customer, Amount, Payment Method, Status
- Filter by date range, payment method, status
- Link to related invoice

**Record Payment:**
- Select invoice (dropdown or search)
- Payment amount (can be partial)
- Payment date
- Payment method (bank transfer, cash, card, other)
- Reference number
- Upload receipt/proof (optional)
- Automatic invoice status update to "paid" when fully paid

#### 6. Reports & Analytics

**Sales Reports:**
- Date range selector
- Total revenue
- Invoice count
- Average invoice value
- Revenue by month chart
- Revenue by customer
- Revenue by product
- Export to Excel, PDF, CSV

**Tax Reports (JPK_FA - Polish VAT):**
- Period selection (quarterly, yearly)
- VAT summary by rate (23%, 8%, 5%, 0%, exempt)
- Total VAT collected
- Export to XML (for government submission)
- Print-friendly PDF

**Customer Reports:**
- Top customers by revenue
- Customer lifetime value
- Payment behavior analysis
- New vs returning customers

**Aging Report:**
- Outstanding invoices grouped by age
- 0-30 days, 31-60 days, 61-90 days, 90+ days
- Total outstanding by age bracket
- Priority collection list

**Dashboard Summary Report:**
- Combines key metrics
- Visual charts
- Exportable

#### 7. Template Management

**Template List:**
- Email templates (invoice sent, payment reminder, thank you)
- Invoice templates (PDF layout and styling)
- Create new, edit, delete
- Preview functionality

**Template Editor:**
- WYSIWYG editor for email templates
- HTML/CSS editor for advanced users
- Variable placeholders: {{invoiceNumber}}, {{customerName}}, {{total}}, etc.
- Conditional logic: {{#if isPaid}}...{{/if}}
- Loops for line items: {{#each items}}...{{/each}}
- Live preview
- Test send

**Branding:**
- Upload company logo
- Set primary and secondary colors
- Font selection
- Apply to invoice templates

#### 8. Notifications

**Notification Center:**
- Bell icon with unread count badge
- Dropdown list of recent notifications
- Types: Invoice paid, payment received, invoice overdue, Allegro order synced
- Mark as read/unread
- Filter: All, Unread, By type
- Link to related resource (invoice, payment)

**Notification Settings:**
- Enable/disable by type
- Email notifications
- In-app notifications
- SMS notifications (if integrated)

#### 9. Integrations

**Allegro Integration:**
- Connect account (OAuth flow)
- View connection status
- Automatic order sync configuration
- Sync history (date, orders synced, invoices created)
- Manual sync button
- Disconnect account

**Webhook Management:**
- Create new webhook
- Configure events (invoice.created, invoice.paid, etc.)
- Webhook URL
- Secret for signature verification
- Active/inactive status
- Delivery history with status (success, failed, retrying)
- Test webhook functionality
- Retry failed deliveries
- View payload and response

#### 10. Settings

**Company Settings:**
- Company information (name, NIP, address, bank account)
- Upload logo
- Invoice numbering format (e.g., INV-{YYYY}-{MM}-{####})
- Default invoice terms and conditions
- Default payment method
- Tax settings

**User Profile:**
- Personal information (name, email)
- Change password
- Two-factor authentication (2FA) setup
- Language preference (Polish/English)
- Time zone
- Email notifications

**Team Management** (Admin/Manager only):
- User list for this tenant
- Invite new user (email invitation)
- Assign roles (Admin, Manager, Accountant, User)
- Deactivate users
- View user activity

**Subscription & Billing:**
- Current plan
- Usage this month (invoices created / quota)
- Upgrade/downgrade plan
- Billing history
- Payment method

### User Routes

```
/:tenantId
├── /dashboard              # Business overview
├── /invoices
│   ├── /list              # All invoices
│   ├── /create            # Create invoice wizard
│   ├── /edit/:id          # Edit draft invoice
│   └── /view/:id          # Invoice detail view
├── /customers
│   ├── /list              # All customers
│   ├── /create            # Add customer
│   └── /view/:id          # Customer profile
├── /products
│   ├── /list              # Product catalog
│   ├── /create            # Add product
│   └── /edit/:id          # Edit product
├── /payments
│   ├── /list              # All payments
│   └── /record            # Record new payment
├── /reports
│   ├── /sales             # Sales reports
│   ├── /tax               # VAT/JPK reports
│   ├── /customers         # Customer analytics
│   ├── /aging             # Aging report
│   └── /dashboard         # Dashboard report
├── /templates
│   ├── /list              # All templates
│   ├── /create            # New template
│   └── /edit/:id          # Edit template
├── /notifications         # Notification center
├── /integrations
│   ├── /allegro           # Allegro integration
│   └── /webhooks          # Webhook management
└── /settings
    ├── /company           # Company settings
    ├── /profile           # User profile
    ├── /team              # Team management (Admin only)
    └── /billing           # Subscription & billing
```

### Role-Based Access

Different features based on user role:

| Feature | Admin | Manager | Accountant | User |
|---------|-------|---------|------------|------|
| View Dashboard | ✅ | ✅ | ✅ | ✅ |
| Create Invoice | ✅ | ✅ | ✅ | ✅ |
| Approve Invoice | ✅ | ✅ | ❌ | ❌ |
| Delete Invoice | ✅ | ✅ | ❌ | ❌ |
| Manage Customers | ✅ | ✅ | ✅ | ✅ |
| Manage Products | ✅ | ✅ | ✅ | ❌ |
| Record Payment | ✅ | ✅ | ✅ | ❌ |
| View Reports | ✅ | ✅ | ✅ | ❌ |
| Export Data | ✅ | ✅ | ✅ | ❌ |
| Manage Templates | ✅ | ✅ | ❌ | ❌ |
| Manage Team | ✅ | ❌ | ❌ | ❌ |
| Company Settings | ✅ | ❌ | ❌ | ❌ |
| Subscription | ✅ | ❌ | ❌ | ❌ |
| Webhooks | ✅ | ✅ | ❌ | ❌ |
| Allegro Integration | ✅ | ✅ | ❌ | ❌ |

---

## Technology Stack

### Core Technologies

**Frontend Framework:** React 18+ with TypeScript
- Component-based architecture
- Strong TypeScript support
- Large ecosystem
- Hooks for state and side effects
- Excellent performance with concurrent features

**Build Tool:** Vite 5+
- Lightning-fast HMR
- Optimized production builds
- Native ESM support
- Plugin ecosystem
- TypeScript out of the box

**Language:** TypeScript 5+
- Type safety
- Better IDE support
- Fewer runtime errors
- Self-documenting code

### UI & Styling

**Component Library:** Material-UI (MUI) v5
```bash
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material
```
- Professional design system
- Comprehensive components
- Themeable
- Accessibility built-in
- TypeScript support

**Alternative:** Ant Design
- Enterprise-focused
- Rich component set
- Excellent for data tables

### State Management

**Redux Toolkit** with RTK Query
```bash
npm install @reduxjs/toolkit react-redux
```
- Simplified Redux setup
- Built-in async with createAsyncThunk
- RTK Query for data fetching
- Excellent TypeScript support
- DevTools integration

### API & Data Fetching

**Axios**
```bash
npm install axios
```
- HTTP client
- Interceptors for auth
- Request/response transformation
- Better error handling

**RTK Query** (included with Redux Toolkit)
- Automatic caching
- Background refetching
- Generated hooks
- Optimistic updates

### Forms & Validation

**React Hook Form + Zod**
```bash
npm install react-hook-form zod @hookform/resolvers
```
- Performant (minimal re-renders)
- Easy validation
- TypeScript-first
- Great developer experience

### Routing

**React Router v6**
```bash
npm install react-router-dom
```
- Declarative routing
- Nested routes
- Code splitting support
- TypeScript support

### Date Handling

**date-fns**
```bash
npm install date-fns
```
- Lightweight
- Modular (tree-shakable)
- Polish locale support
- TypeScript support

### Charts & Visualization

**Chart.js + react-chartjs-2**
```bash
npm install chart.js react-chartjs-2
```
- Versatile charts
- Responsive
- Good performance
- Customizable

### PDF Handling

**react-pdf**
```bash
npm install react-pdf pdfjs-dist
```
- Display PDF invoices
- Print functionality

**For Generation:** Backend handles PDF generation

### Notifications

**react-toastify**
```bash
npm install react-toastify
```
- Toast notifications
- Customizable
- Position control
- Auto-dismiss

### Icons

**@mui/icons-material** (Material Icons)
- Included with MUI
- Consistent design
- Large icon set

### Internationalization

**react-i18next**
```bash
npm install react-i18next i18next i18next-browser-languagedetector
```
- Multi-language (Polish, English)
- Namespace support
- Language detection
- Translation management

### Testing

**Jest + React Testing Library**
```bash
npm install -D jest @testing-library/react @testing-library/jest-dom @testing-library/user-event
```
- Unit testing
- Component testing
- User-centric tests

**Cypress (E2E)**
```bash
npm install -D cypress
```
- End-to-end testing
- User flow testing
- Visual regression

### Code Quality

**ESLint + Prettier**
```bash
npm install -D eslint prettier eslint-config-prettier @typescript-eslint/eslint-plugin @typescript-eslint/parser
```
- Code linting
- Auto-formatting
- Consistent style

### Real-time Updates

**Socket.io Client**
```bash
npm install socket.io-client
```
- WebSocket connection
- Real-time notifications
- Invoice status updates

---

## Component Architecture

### Atomic Design Structure

```
src/components/
├── atoms/                  # Basic building blocks
│   ├── Button/
│   ├── Input/
│   ├── Badge/
│   ├── Icon/
│   └── Spinner/
├── molecules/              # Simple combinations
│   ├── FormField/
│   ├── SearchBar/
│   ├── StatusBadge/
│   ├── DatePicker/
│   └── AmountDisplay/
├── organisms/              # Complex components
│   ├── Header/
│   ├── Sidebar/
│   ├── DataTable/
│   ├── InvoiceCard/
│   ├── CustomerCard/
│   ├── InvoiceForm/
│   └── ChartCard/
├── templates/              # Page layouts
│   ├── MainLayout/
│   ├── AuthLayout/
│   └── EmptyLayout/
└── pages/                  # Full pages
    └── (organized by feature)
```

### Key Reusable Components

**DataTable** - Advanced table for lists
- Sortable columns
- Pagination
- Row selection
- Bulk actions
- Custom cell renderers

**StatCard** - Dashboard metric display
- Value with trend indicator
- Comparison with previous period
- Icon support
- Color customization

**InvoicePreview** - Display formatted invoice
- PDF-like rendering
- Print functionality
- Responsive design

**FormWizard** - Multi-step form
- Progress indicator
- Navigation (next, back, save draft)
- Validation per step

---

## Routing & Navigation

### Route Protection

```typescript
// ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !hasRequiredRole(user, requiredRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};
```

### Code Splitting

```typescript
// Lazy load routes for better performance
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Invoices = lazy(() => import('./pages/Invoices'));

// Wrap with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <Dashboard />
</Suspense>
```

---

## State Management

### Redux Store Structure

```typescript
// User Frontend Store
store/
├── index.ts                    # Store configuration
├── slices/
│   ├── authSlice.ts           # Authentication state
│   ├── invoicesSlice.ts       # Invoice data & filters
│   ├── customersSlice.ts      # Customer data
│   ├── productsSlice.ts       # Product catalog
│   ├── paymentsSlice.ts       # Payment records
│   ├── notificationsSlice.ts  # Notifications
│   ├── uiSlice.ts             # UI state (modals, sidebar)
│   └── settingsSlice.ts       # User preferences
└── api/
    └── apiSlice.ts            # RTK Query API
```

### RTK Query Setup

```typescript
// API service with automatic caching
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.accessToken;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Invoice', 'Customer', 'Product'],
  endpoints: (builder) => ({
    getInvoices: builder.query({
      query: ({ tenantId, ...params }) => ({
        url: `/${tenantId}/invoices`,
        params,
      }),
      providesTags: ['Invoice'],
    }),
    createInvoice: builder.mutation({
      query: ({ tenantId, data }) => ({
        url: `/${tenantId}/invoices`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Invoice'],
    }),
  }),
});

export const { useGetInvoicesQuery, useCreateInvoiceMutation } = api;
```

---

## API Integration

### Authentication Flow

```typescript
// Login and store tokens
const handleLogin = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  const { accessToken, refreshToken, user, tenant } = response.data;
  
  // Store tokens (consider httpOnly cookies for refresh token)
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  
  // Update Redux state
  dispatch(setAuth({ user, tenant, accessToken }));
  
  // Redirect to dashboard
  navigate(`/${tenant.id}/dashboard`);
};
```

### Automatic Token Refresh

```typescript
// Axios interceptor for token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refreshToken');
      const { data } = await axios.post('/auth/refresh', { refreshToken });
      
      localStorage.setItem('accessToken', data.accessToken);
      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      
      return axios(originalRequest);
    }

    return Promise.reject(error);
  }
);
```

---

## UI/UX Design Guidelines

### Color Scheme

**Status Colors:**
- Draft: `#9E9E9E` (Gray)
- Pending: `#FF9800` (Orange)
- Sent: `#2196F3` (Blue)
- Paid: `#4CAF50` (Green)
- Overdue: `#F44336` (Red)

**Semantic Colors:**
- Primary: `#1976D2` (Blue)
- Success: `#4CAF50` (Green)
- Warning: `#FF9800` (Orange)
- Error: `#F44336` (Red)
- Info: `#2196F3` (Light Blue)

### Responsive Breakpoints

```typescript
const breakpoints = {
  xs: 0,      // Mobile portrait
  sm: 600,    // Mobile landscape
  md: 900,    // Tablet portrait
  lg: 1200,   // Desktop
  xl: 1536,   // Large desktop
};
```

### Typography

- Primary Font: Inter or Roboto
- Headings: Bold, larger sizes
- Body: Regular, 14px
- Code: Monospace font

---

## Development Roadmap

### Phase 1: Setup (Week 1-2)
- [x] Project initialization (Vite + React + TypeScript)
- [x] Install dependencies (MUI, Redux, Axios)
- [x] Configure ESLint, Prettier
- [x] Set up folder structure
- [x] Configure routing
- [x] Set up Redux store
- [x] Create basic layouts

### Phase 2: Authentication (Week 3)
- [ ] Build login/register pages
- [ ] Implement auth service
- [ ] Token management
- [ ] Protected routes
- [ ] Password reset flow

### Phase 3: User Frontend Core (Week 4-8)
- [ ] Dashboard with metrics
- [ ] Invoice management (list, create, edit, view)
- [ ] Customer management
- [ ] Product catalog
- [ ] Payment tracking

### Phase 4: Advanced Features (Week 9-12)
- [ ] Reports & analytics
- [ ] Template management
- [ ] Notifications
- [ ] Integrations (Allegro, webhooks)
- [ ] Settings pages

### Phase 5: Admin Frontend (Week 13-14)
- [ ] Admin dashboard
- [ ] Tenant management
- [ ] System monitoring
- [ ] Billing management

### Phase 6: Polish & Testing (Week 15-16)
- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] Documentation
- [ ] Deployment preparation

**Total Estimated Time:** 16 weeks (4 months)

---

## Deployment Strategy

### Build Configuration

```bash
# Production build
npm run build

# Output directory: dist/
# Optimized, minified, tree-shaken
```

### Environment Variables

```env
# .env.production
VITE_API_URL=https://api.invoice-hub.com/api/v1
VITE_SOCKET_URL=wss://api.invoice-hub.com
VITE_ENV=production
```

### Hosting Options

**Option 1: Vercel** (Recommended)
- Zero-config deployment
- Automatic HTTPS
- CDN distribution
- Preview deployments

**Option 2: Netlify**
- Similar to Vercel
- Form handling
- Serverless functions

**Option 3: AWS S3 + CloudFront**
- Cost-effective at scale
- Full control
- Integrate with backend infrastructure

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy Frontend

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

---

## Testing Strategy

### Unit Tests

```typescript
// Component test example
import { render, screen } from '@testing-library/react';
import { InvoiceCard } from './InvoiceCard';

test('displays invoice number', () => {
  const invoice = { number: 'INV-001', total: 100 };
  render(<InvoiceCard invoice={invoice} />);
  expect(screen.getByText('INV-001')).toBeInTheDocument();
});
```

### Integration Tests

```typescript
// User flow test
test('creates invoice successfully', async () => {
  render(<App />);
  await userEvent.click(screen.getByText('New Invoice'));
  await userEvent.type(screen.getByLabelText('Customer'), 'Test Customer');
  await userEvent.click(screen.getByText('Create'));
  expect(screen.getByText('Invoice created')).toBeInTheDocument();
});
```

### E2E Tests (Cypress)

```typescript
describe('Invoice Creation', () => {
  it('completes full invoice flow', () => {
    cy.login();
    cy.visit('/dashboard');
    cy.contains('New Invoice').click();
    cy.get('[name="customer"]').type('Customer A');
    cy.contains('Create').click();
    cy.contains('Invoice created successfully');
  });
});
```

**Target Coverage:** 80%+

---

## Security Considerations

### XSS Prevention
- Sanitize user input
- Use React's built-in escaping
- Avoid dangerouslySetInnerHTML
- CSP headers

### CSRF Protection
- Use httpOnly cookies
- Implement CSRF tokens
- Verify origin headers

### Secure Token Storage
- Access tokens in memory or short-lived localStorage
- Refresh tokens in httpOnly cookies (ideal)
- Clear on logout

### Input Validation
- Frontend validation for UX
- Backend validation is source of truth
- Use Zod schemas

---

## Accessibility (WCAG 2.1 AA)

- Semantic HTML
- ARIA labels where needed
- Keyboard navigation
- Focus management
- Color contrast ≥ 4.5:1
- Alt text for images
- Screen reader support

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Quick search |
| `Ctrl+N` | New invoice |
| `Esc` | Close modal |
| `/` | Focus search bar |

---

## Internationalization

### Setup

```typescript
// i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: require('./locales/en.json') },
    pl: { translation: require('./locales/pl.json') },
  },
  lng: 'pl', // Default language
  fallbackLng: 'en',
});
```

### Translation Files

```json
// locales/pl.json
{
  "dashboard": {
    "title": "Panel główny",
    "revenue": "Przychody"
  },
  "invoice": {
    "create": "Utwórz fakturę",
    "paid": "Opłacona"
  }
}
```

### Usage

```typescript
import { useTranslation } from 'react-i18next';

const Dashboard = () => {
  const { t } = useTranslation();
  return <h1>{t('dashboard.title')}</h1>;
};
```

---

## Performance Optimization

### Code Splitting
- Lazy load routes
- Dynamic imports for heavy components
- Vendor bundle splitting

### Caching
- RTK Query automatic caching
- Service worker for offline support
- Browser caching headers

### Bundle Optimization
- Tree shaking
- Minification
- Compression (gzip/brotli)
- Image optimization

### Rendering Optimization
- React.memo for expensive components
- useMemo for calculations
- useCallback for functions
- Virtualization for long lists (react-window)

---

## Monitoring & Analytics

### Error Tracking

**Sentry**
```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'YOUR_DSN',
  environment: import.meta.env.MODE,
});
```

### Analytics

**Google Analytics / Plausible**
```typescript
// Track page views
useEffect(() => {
  gtag('event', 'page_view', { page_path: location.pathname });
}, [location]);

// Track events
const trackEvent = (category, action, label) => {
  gtag('event', action, { event_category: category, event_label: label });
};
```

### Performance Monitoring

- Web Vitals (LCP, FID, CLS)
- React Profiler
- Lighthouse CI

---

## Documentation

### Code Documentation
- JSDoc comments for complex functions
- README for each major feature
- Component Storybook

### User Documentation
- User guides
- Video tutorials
- FAQ section
- Contextual help in UI

### Developer Documentation
- Setup instructions
- Architecture overview
- API integration guide
- Contributing guidelines

---

## Summary

This comprehensive frontend implementation plan provides:

1. **Two Separate Applications:**
   - System Admin Frontend (platform management)
   - User Frontend (tenant operations)

2. **Complete Feature Set:**
   - Dashboard analytics
   - Invoice lifecycle management
   - Customer & product management
   - Payment tracking
   - Reports (sales, tax/JPK_FA, customer, aging)
   - Template management
   - Notifications
   - Integrations (Allegro, webhooks)
   - Settings & configuration

3. **Modern Technology Stack:**
   - React 18 + TypeScript
   - Vite build tool
   - Material-UI components
   - Redux Toolkit + RTK Query
   - React Hook Form + Zod
   - Comprehensive testing suite

4. **Production-Ready Features:**
   - Authentication & authorization
   - Role-based access control
   - Multi-tenant support
   - Internationalization (Polish, English)
   - Accessibility (WCAG 2.1 AA)
   - Performance optimization
   - Security best practices
   - Error tracking & analytics

5. **Clear Development Roadmap:**
   - 16-week implementation plan
   - Phased approach
   - Testing at each phase
   - Documentation throughout

---

## Next Steps

1. **Review & Approve** this plan
2. **Set up repositories** for frontend-admin and frontend-user
3. **Initialize projects** with Vite + React + TypeScript
4. **Install dependencies** from technology stack
5. **Create folder structure** as outlined
6. **Begin Phase 1** (Project Setup)
7. **Iterate through phases** following the roadmap
8. **Regular testing** and code reviews
9. **Continuous deployment** to staging environment
10. **Production deployment** after Phase 6

---

**Backend Status:** ✅ Complete (80+ endpoints, all tested)  
**Frontend Status:** 📋 Planning Complete, ready for implementation  
**Estimated Timeline:** 16 weeks  
**Team Recommendation:** 2-3 frontend developers  
**Priority:** Start with User Frontend (core business value)

---

**Document Version:** 1.0.0  
**Last Updated:** November 15, 2025  
**Status:** ✅ Ready for Implementation
