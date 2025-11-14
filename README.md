# Invoice-HUB

**Cloud-based invoicing platform for Polish e-commerce businesses**

Save 20+ hours per week by automating invoice creation, multi-channel delivery, and export processes with intelligent Allegro marketplace integration.

## 🚀 Features

### Core Capabilities
- ✅ **Multi-tenant SaaS Architecture** - Isolated data, white-label branding
- ✅ **Intelligent Allegro Integration** - Automatic order sync and invoice generation
- ✅ **Smart Invoice Management** - Complete lifecycle with state machine
- ✅ **Multi-Channel Delivery** - Email, SMS, in-app notifications
- ✅ **Powerful Export Engine** - PDF, Excel, XML (JPK_FA), JSON, EDI
- ✅ **Polish VAT Compliance** - 23%/8%/5%/0%, reverse charge, VIES validation
- ✅ **Database-Driven Intelligence** - Product catalog, customer management, tax engine

### Advanced Features
- 🔐 Role-based access control (Admin, Manager, Accountant, User)
- 📊 Real-time analytics and reporting
- 🎨 Customizable invoice templates (Handlebars-based)
- 🔄 Recurring invoice automation
- 📱 Responsive web interface
- 🌍 Multi-language support (Polish, English)
- 💱 Multi-currency support
- 🔒 Enterprise-grade security (encryption, audit logs, 2FA)

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
- Docker & Docker Compose
- Node.js 18+ (for local development)
- Git

### 1. Clone Repository

```bash
git clone https://github.com/jomardyan/Invoice-HUB.git
cd Invoice-HUB
```

### 2. Start with Docker Compose

```bash
# Start all services (PostgreSQL, Redis, Backend)
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

The backend API will be available at: `http://localhost:3000`

### 3. Manual Setup (Alternative)

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

- **Development Plan**: See [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) for comprehensive technical specifications
- **Backend README**: See [backend/README.md](./backend/README.md) for API documentation
- **API Reference**: Coming soon (OpenAPI/Swagger)

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:integration    # Integration tests
```

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

### ✅ Completed
- [x] Project infrastructure setup
- [x] Database schema design
- [x] Docker configuration
- [x] TypeORM entity models
- [x] Configuration management
- [x] Logging and error handling

### 🔄 In Progress
- [ ] Authentication & Authorization
- [ ] Invoice management API
- [ ] Allegro integration
- [ ] Email delivery system
- [ ] PDF export

### 📋 Planned
- [ ] Frontend application
- [ ] Template designer
- [ ] Reporting dashboard
- [ ] Webhook system
- [ ] Mobile app (PWA)

See [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) for detailed roadmap.

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
