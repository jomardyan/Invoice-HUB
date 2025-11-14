# Invoice-HUB Backend

SaaS invoicing platform for Polish e-commerce businesses with intelligent Allegro marketplace integration.

## Features

- 🔐 **Multi-tenant Authentication & Authorization** - JWT-based auth with RBAC
- 📊 **Database-Driven Intelligence** - Company, product, customer, and tax management
- 📄 **Smart Invoice Management** - Complete invoice lifecycle with state machine
- 🏪 **Allegro Integration** - Automatic order synchronization and invoice generation
- 📧 **Multi-Channel Delivery** - Email, SMS, in-app notifications
- 📤 **Export & Reporting** - PDF, Excel, XML, JSON, EDI formats
- 🇵🇱 **Polish VAT Compliance** - JPK_FA, VAT-7, VAT-UE, Intrastat
- 🔒 **Enterprise Security** - Encryption at rest/transit, rate limiting, audit logging

## Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Cache**: Redis
- **ORM**: TypeORM
- **Queue**: BullMQ
- **Testing**: Jest

## Prerequisites

- Node.js >= 18.0.0
- Docker & Docker Compose
- PostgreSQL 16
- Redis 7

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop all services
docker-compose down
```

### Manual Setup

```bash
# Install dependencies
cd backend
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start PostgreSQL and Redis (if not using Docker)
# Then run migrations
npm run migration:run

# Start development server
npm run dev
```

## Environment Variables

See `.env.example` for all configuration options. Key variables:

```env
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=invoice_hub
DB_USER=postgres
DB_PASSWORD=postgres

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key

ALLEGRO_CLIENT_ID=your-allegro-client-id
ALLEGRO_CLIENT_SECRET=your-allegro-client-secret
```

## Available Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build            # Build TypeScript to JavaScript
npm start                # Run production build

# Testing
npm test                 # Run unit tests with Jest
npm run test:api         # Run full API integration test suite (auto-starts server)
npm run test:quick       # Run quick smoke test (requires server running)
npm run test:all         # Run all tests (unit + API)
npm run test:watch       # Run tests in watch mode

# Database
npm run typeorm          # TypeORM CLI
npm run migration:generate -- -n MigrationName
npm run migration:run    # Run migrations
npm run migration:revert # Revert last migration
```

## Testing Workflow

See [TESTING.md](./TESTING.md) for detailed documentation.

### After Making Changes

```bash
# Run full automated test suite
npm run test:api
```

### During Development

```bash
# Terminal 1: Start server
./start-server.sh
# OR
npm run dev

# Terminal 2: Run quick smoke tests (repeat as needed)
npm run test:quick
```


## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── entities/        # TypeORM entities
│   ├── middleware/      # Express middleware
│   ├── migrations/      # Database migrations
│   ├── repositories/    # Data access layer
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   ├── validators/      # Input validation
│   ├── app.ts           # Express app setup
│   └── index.ts         # Entry point
├── tests/               # Test files
├── logs/                # Log files
├── uploads/             # Uploaded files
├── .env.example         # Environment template
├── Dockerfile           # Docker configuration
├── package.json         # Dependencies
└── tsconfig.json        # TypeScript config
```

## API Documentation

Once the server is running, access:

- **Health Check**: `http://localhost:3000/health`
- **API v1**: `http://localhost:3000/api/v1`
- **OpenAPI/Swagger** (coming soon): `http://localhost:3000/api/docs`

## Database Schema

Key entities:

- **Tenant** - Multi-tenant organization
- **User** - User accounts with RBAC
- **Company** - Seller company information
- **Customer** - Buyer/customer profiles
- **Product** - Product catalog
- **Invoice** - Invoice documents
- **InvoiceItem** - Invoice line items
- **AllegroIntegration** - Allegro API connections

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- src/services/auth.test.ts

# Watch mode
npm run test:watch
```

Target: **80%+ code coverage**

## Security

- ✅ Password hashing with bcrypt (12 rounds)
- ✅ JWT tokens (access: 15min, refresh: 30 days)
- ✅ Rate limiting on all endpoints
- ✅ Helmet.js security headers
- ✅ Input validation with express-validator
- ✅ SQL injection prevention (TypeORM)
- ✅ XSS protection
- ✅ CORS configuration
- ✅ Audit logging

## Performance

- Response time: <200ms (p95)
- Invoice generation: <2s
- Concurrent users: 1000+
- Throughput: 1000+ invoices/minute

## Monitoring

Logs are stored in:
- `logs/error.log` - Error logs
- `logs/combined.log` - All logs

Log levels: error, warn, info, http, debug

## Deployment

### Docker

```bash
# Build image
docker build -t invoice-hub-backend .

# Run container
docker run -p 3000:3000 --env-file .env invoice-hub-backend
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT secrets
- [ ] Configure SMTP/email provider
- [ ] Set up Redis for caching
- [ ] Enable database backups
- [ ] Configure monitoring (Sentry, DataDog)
- [ ] Set up SSL/TLS certificates
- [ ] Configure DKIM/SPF/DMARC for emails
- [ ] Review rate limiting settings
- [ ] Set up log aggregation
- [ ] Configure auto-scaling

## License

MIT

## Support

For issues and questions:
- GitHub Issues: [Invoice-HUB Issues](https://github.com/jomardyan/Invoice-HUB/issues)
- Documentation: Coming soon
