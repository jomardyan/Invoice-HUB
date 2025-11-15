# Invoice-HUB Admin Frontend

Platform administration interface for Invoice-HUB multi-tenant system.

## Features

- **Dashboard**: Platform-wide metrics, revenue trends, and top tenants
- **Tenant Management**: CRUD operations, quota tracking, suspension controls
- **System Monitoring**: Service health, performance metrics, error logs, resource usage

## Tech Stack

- React 19 + TypeScript
- Material-UI v7
- Chart.js for visualizations
- Vite for fast development

## Getting Started

```bash
# Install dependencies
npm install

# Start development server (port 5174)
npm run dev

# Build for production
npm run build
```

## Pages

### Admin Dashboard
- Platform overview with key metrics
- Revenue and growth charts
- Top tenants by usage

### Tenant Management
- List all tenants with filtering
- View/Edit tenant details
- Suspend/Reactivate tenants
- Quota and subscription management

### System Monitoring
- Service health status
- Performance metrics and bottlenecks
- Error logs with filtering
- Resource usage (CPU, memory, storage)
