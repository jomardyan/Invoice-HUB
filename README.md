# Invoice-HUB

**Cloud-based invoicing platform for Polish e-commerce businesses**

Save 20+ hours per week by automating invoice creation, multi-channel delivery, and export processes with intelligent Allegro marketplace integration.

## 🚀 Features

### Core Capabilities
- ✅ **Multi-tenant SaaS Architecture** - Isolated data, white-label branding
- ✅ **Intelligent Allegro Integration** - Automatic order sync and invoice generation
- ✅ **BaseLinker Integration** - Sync orders from BaseLinker marketplace
- ✅ **Smart Invoice Management** - Complete lifecycle with state machine
- ✅ **Multi-Channel Delivery** - Email, SMS, in-app notifications
- ✅ **Powerful Export Engine** - PDF, Excel, XML (JPK_FA), JSON, EDI
- ✅ **Polish VAT Compliance** - 23%/8%/5%/0%, reverse charge, VIES validation
- ✅ **Database-Driven Intelligence** - Product catalog, customer management, tax engine
- ✅ **KSeF Integration** - National e-Invoicing System submission and tracking
- ✅ **Receipts & E-Receipts** - Fiscal and electronic receipt management with QR codes
- ✅ **Expense Management** - OCR-powered expense tracking with approval workflows
- ✅ **Warehouse Management** - Multi-warehouse inventory with stock tracking
- ✅ **Department Management** - Multi-department support with budget tracking

### Advanced Features
- 🔐 Role-based access control (Owner, Admin, Manager, Accountant, Viewer)
- 📊 Real-time analytics and reporting (Dashboard, Sales, Tax, Customer reports)
- 🎨 Customizable invoice templates (Handlebars-based with live preview)
- 🔄 Recurring invoice automation via scheduler
- 🌐 RESTful API with 120+ endpoints
- 🌍 Multi-language support (Polish, English)
- 💱 Multi-currency support (PLN, EUR, USD)
- 🔒 Enterprise-grade security (encryption, audit logs, rate limiting)
- 🔔 Real-time notifications (Email, SMS, In-app)
- 🔗 Webhook subscriptions for event-driven integrations
- 📤 Multiple export formats (PDF, Excel, CSV, XML/JPK_FA, JSON)
- 🏢 Warehouse & inventory management with low-stock alerts
- 💰 Expense tracking with OCR and approval workflows
- 🧾 Receipt management (standard, e-receipt, fiscal)
- 🏛️ KSeF integration for Polish e-invoicing compliance

## 📁 Project Structure

```
Invoice-HUB/
├── backend/                 # Node.js/TypeScript API
│   ├── src/
│   │   ├── config/         # Configuration
│   │   ├── entities/       # Database models
│   │   ├── services/       # Business logic
│   │   ├── controllers/    # API controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   └── utils/          # Utilities
│   ├── tests/              # Test files
│   ├── Dockerfile
│   └── package.json
│
├── frontend/               # React/TypeScript UI (coming soon)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── store/
│   └── package.json
│
├── docker-compose.yml      # Local development setup
├── DEVELOPMENT_PLAN.md     # Comprehensive technical spec
└── README.md              # This file
```

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **ORM**: TypeORM
- **Queue**: BullMQ
- **Testing**: Jest

### Frontend (Planned)
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **UI Library**: Material-UI / Tailwind CSS
- **State**: Redux Toolkit
- **Forms**: React Hook Form + Zod

### Infrastructure
- **Containerization**: Docker, Docker Compose
- **CI/CD**: GitHub Actions
- **Monitoring**: Winston (logging)
- **Email**: SendGrid / Amazon SES

## 🚦 Quick Start

### Prerequisites
- Docker & Docker Compose (auto-installed on Linux)
- Node.js 18+ (auto-installed on Linux)
- Git

### Option 1: Automated Startup (Recommended)

```bash
# Clone repository
git clone https://github.com/jomardyan/Invoice-HUB.git
cd Invoice-HUB

# Start all services (auto-installs dependencies)
bash run-app.sh

# Or with full testing
bash run-tests.sh
```

The scripts will automatically:
- ✅ Install Node.js, Docker, and dependencies (if needed)
- ✅ Start PostgreSQL and Redis containers
- ✅ Launch Backend API (port 3000)
- ✅ Launch Admin Frontend (port 5174)
- ✅ Launch User Frontend (port 5173)
- ✅ Run comprehensive health checks

**Access URLs:**
- Backend API: `http://localhost:3000`
- API Docs: `http://localhost:3000/api-docs`
- Admin Dashboard: `http://localhost:5174`
- User App: `http://localhost:5173`

**Script Commands:**
```bash
# View help
bash run-app.sh help

# Check service health
bash run-app.sh health

# View logs
bash run-app.sh logs backend
bash run-app.sh logs admin-frontend
bash run-app.sh logs user-frontend

# Stop all services
bash run-app.sh stop

# Port management
bash kill-ports.sh status       # Check port status
bash kill-ports.sh kill-all     # Free all app ports
bash kill-ports.sh backend      # Kill backend only
```

**Note:** The scripts automatically kill any existing processes on required ports before starting services.

### Option 2: Docker Compose

```bash
# Start all services (PostgreSQL, Redis, Backend)
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### Option 3: VS Code Tasks

Press `Ctrl+Shift+P` → "Tasks: Run Task" and select:
- 🌐 Start All Services
- 🚀 Start Backend API
- 👥 Start Frontend User
- ⚙️ Start Frontend Admin
- 🐳 Start Docker Services

See [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md) for details.

### Option 4: Manual Setup

```bash
# Backend setup
cd backend
npm install
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start development server
npm run dev
```

## 📚 Documentation

- **Development Plan**: [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) - Comprehensive technical specifications
- **Backend README**: [backend/README.md](./backend/README.md) - Setup and development guide
- **API Endpoints**: [backend/docs/API_ENDPOINTS.md](./backend/docs/API_ENDPOINTS.md) - Complete endpoint documentation with examples
- **API Summary**: [backend/docs/API_SUMMARY.md](./backend/docs/API_SUMMARY.md) - Quick reference for all 80+ endpoints
- **OpenAPI Spec**: [backend/docs/openapi.yaml](./backend/docs/openapi.yaml) - Swagger/OpenAPI 3.0 specification
- **Testing Guide**: [backend/TESTING.md](./backend/TESTING.md) - Automated testing documentation
- **Swagger UI**: `http://localhost:3000/api-docs` - Interactive API documentation
- **Allegro Integration**: [ALLEGRO_SETUP_GUIDE.md](./ALLEGRO_SETUP_GUIDE.md) - Allegro marketplace integration guide
- **BaseLinker Integration**: [BASELINKER_SETUP_GUIDE.md](./BASELINKER_SETUP_GUIDE.md) - BaseLinker integration guide

## 🧪 Testing

```bash
# Backend tests
cd backend

# Unit tests
npm test                    # Run Jest unit tests
npm run test:watch          # Watch mode

# API integration tests
npm run test:api            # Full automated test suite (80+ endpoints)
npm run test:quick          # Quick smoke test (critical endpoints)
npm run test:all            # All tests (unit + API)

# Individual test scripts
./test-api.sh              # Comprehensive API test with auto-start
./quick-test.sh            # Fast smoke test
./start-server.sh          # Start backend server for testing
```

**Test Coverage:**
- ✅ Health & Monitoring (5/5 endpoints)
- ✅ Authentication (3/4 endpoints) 
- ✅ Companies (5/5 endpoints)
- ✅ Customers (8/8 endpoints)
- ✅ Products (7/7 endpoints)
- ✅ Invoices (15/15 endpoints)
- ✅ Payments (7/7 endpoints)
- ✅ Templates (9/9 endpoints)
- ✅ Notifications (7/7 endpoints)
- ✅ Reports (6/6 endpoints)
- ✅ Webhooks (8/8 endpoints)
- ✅ Scheduler (4/4 endpoints)
- ✅ Allegro (6/6 endpoints)
- ✅ BaseLinker (6/6 endpoints)

Target: **80%+ code coverage**

## 🔒 Security

- ✅ AES-256 encryption at rest
- ✅ TLS 1.3 encryption in transit
- ✅ JWT authentication (15min access, 30d refresh)
- ✅ bcrypt password hashing
- ✅ Rate limiting (100 req/hour per IP)
- ✅ CSRF protection
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ Complete audit logging

## 📈 Performance Targets

- API response time: <200ms (p95)
- Invoice generation: <2 seconds
- Dashboard load: <1 second
- Bulk operations: 1000+ invoices/minute
- Concurrent users: 1000+
- Uptime: 99.9% (43 min/month downtime)

## 🌍 Compliance

- ✅ GDPR compliant (data encryption, right to erasure, audit logs)
- ✅ Polish VAT regulations (NIP validation, tax rates, archival)
- ✅ EU e-invoicing standards (UBL 2.1, eFaktura/JPK_FA)
- ✅ 10-year invoice archival (Polish requirement)

## 🚧 Development Status

### ✅ Backend API Completed (20/26 Tasks - 77%)

**Phase 1: Core Infrastructure** ✅ COMPLETE
- [x] Backend setup (Express.js, TypeScript, middleware)
- [x] Database schema (PostgreSQL, TypeORM, 11 entities)
- [x] Authentication system (JWT, refresh tokens, RBAC)
- [x] Multi-tenant architecture with isolation
- [x] Health checks and monitoring endpoints
- [x] Error handling and logging (Winston)

**Phase 2: Business Logic** ✅ COMPLETE
- [x] Company management (CRUD, validation)
- [x] Product catalog with VAT rates (23%, 8%, 5%, 0%, exempt)
- [x] Customer database with NIP validation
- [x] Tax calculation engine (Polish VAT compliance)
- [x] Smart template system (Handlebars, variables, rendering)
- [x] Invoice management (CRUD, status workflow, PDF generation)
- [x] Payment tracking and reconciliation

**Phase 3: Communication & Delivery** ✅ COMPLETE
- [x] Email delivery system (Nodemailer, SMTP, templates)
- [x] SMS notifications (Twilio integration ready)
- [x] In-app notifications (CRUD, read/unread tracking)
- [x] Scheduler service (automated tasks, cron jobs)

**Phase 4: Export & Analytics** ✅ COMPLETE
- [x] Multi-format export (PDF, Excel, CSV, XML/JPK_FA, JSON)
- [x] Reporting & analytics (sales, tax/JPK_VAT, customer reports)
- [x] Dashboard metrics (revenue, invoices, customers)
- [x] Export service with format conversion

**Phase 5: Integration & Events** ✅ COMPLETE
- [x] Webhook system (subscriptions, delivery, retry logic)
- [x] Allegro integration structure (OAuth, webhook receiver)
- [x] BaseLinker integration (API token auth, order sync)
- [x] API documentation (OpenAPI 3.0, 80+ endpoints)
- [x] Comprehensive testing suite (automated API tests)

**Phase 6: Testing & Quality** ✅ COMPLETE
- [x] Automated API test suite (test-api.sh)
- [x] Quick smoke tests (quick-test.sh)
- [x] Health check validation
- [x] Error handling verification

### 🔄 In Progress
- [ ] Payment gateway integration (Stripe, PayPal, Przelewy24 - structure ready)
- [ ] Allegro full implementation (OAuth flow completion, order sync)
- [ ] BaseLinker webhook integration (order status updates)

### 📋 Planned (Remaining 6 Tasks)
- [ ] Unit test coverage expansion (target 80%+)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Production deployment (Docker, cloud hosting)
- [ ] Frontend application (React/TypeScript)
- [ ] Admin panel (tenant & user management UI)
- [ ] End-user documentation (guides, tutorials)

### 📊 Current Statistics
- **Total Endpoints:** 120+
- **Database Tables:** 17
- **Services:** 24
- **Routes:** 19
- **Test Coverage:** Health, Auth, Companies, Customers, Products, Invoices, Payments, Templates, Notifications, Reports, Webhooks, Scheduler, Allegro, BaseLinker, Receipts, Expenses, Warehouses, Departments, KSeF
- **API Documentation:** Complete (OpenAPI 3.0)

See [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) for detailed implementation roadmap.

## 🤝 Contributing

This is a private project. For feature requests or bug reports, please open an issue.

## 📄 License

MIT License - see LICENSE file for details

## 👥 Team

- **Development**: Invoice-HUB Team
- **Project Owner**: jomardyan

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/jomardyan/Invoice-HUB/issues)
- **Documentation**: Coming soon
- **Email**: Coming soon

---

**Built with ❤️ for Polish e-commerce businesses**
