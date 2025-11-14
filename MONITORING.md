# Monitoring & Logging Setup Guide

## Overview

Invoice-HUB includes comprehensive monitoring and logging infrastructure with:
- **Sentry** for error tracking and performance monitoring
- **Winston** for structured logging
- **Health endpoints** for Kubernetes readiness/liveness probes
- **Performance metrics** collection and analysis
- **Security event logging** for audit trails

## Components

### 1. MonitoringService

Located in `src/services/MonitoringService.ts`

**Features:**
- Sentry integration for error tracking
- Performance monitoring with spans and breadcrumbs
- Request/response tracking
- Metrics collection (error rates, response times, percentiles)
- User context tracking
- Security event logging
- Database and API call metrics

**Usage:**

```typescript
import { MonitoringService } from '@/services/MonitoringService';
import logger from '@/utils/logger';

const monitoring = MonitoringService.getInstance(logger);

// Capture exceptions
monitoring.captureException(error, { context: 'operation' });

// Log business events
monitoring.logBusinessEvent('invoice_created', { invoiceId: '123' });

// Log security events
monitoring.logSecurityEvent('failed_login', 'high', { userId: '456' });

// Track API calls
monitoring.logExternalApiCall('Allegro', 'GET', '/orders', 234, 200, true);

// Get metrics
const metrics = monitoring.getMetrics();
```

### 2. Enhanced Logger (Winston)

Located in `src/utils/logger.ts`

**Features:**
- Structured JSON logging for log aggregation
- Multiple transports (console, file)
- Log rotation (10MB per file, max 5 files)
- Context logging with request ID, user ID, tenant ID
- Different formats for development vs production
- Performance and error-specific logs

**Usage:**

```typescript
import logger, { createContextLogger } from '@/utils/logger';

// Basic logging
logger.info('Operation completed', { duration: 234 });
logger.error('Database error', { query: 'SELECT...' });
logger.warn('Slow request', { duration: 1234 });

// Context logging
const contextLogger = createContextLogger(
  'req-123',
  'user-456',
  'tenant-789'
);
contextLogger.info('User action', { action: 'created_invoice' });
```

### 3. Health Check Endpoints

Located in `src/routes/health.ts`

**Endpoints:**

| Endpoint | Purpose | Probe Type |
|----------|---------|-----------|
| `GET /api/health` | Basic health check | Load balancer |
| `GET /api/health/live` | Kubernetes liveness | Kubernetes |
| `GET /api/health/ready` | Kubernetes readiness | Kubernetes |
| `GET /api/health/detailed` | Detailed status with metrics | Monitoring |
| `GET /api/health/metrics` | Performance metrics | Metrics collection |
| `GET /api/health/version` | Application version | CI/CD |
| `POST /api/health/reset-metrics` | Reset collected metrics | Testing |

**Example Responses:**

```json
// GET /api/health
{
  "status": "ok",
  "timestamp": "2025-11-14T10:30:00Z"
}

// GET /api/health/ready
{
  "status": "ready",
  "timestamp": "2025-11-14T10:30:00Z",
  "checks": {
    "database": "ok",
    "redis": "ok"
  }
}

// GET /api/health/detailed
{
  "status": "healthy",
  "uptime": 3600,
  "memory": {
    "heapUsed": 45678900,
    "heapTotal": 134217728,
    "external": 2000000,
    "rss": 180000000
  },
  "metrics": {
    "totalRequests": 1250,
    "totalErrors": 5,
    "errorRate": 0.4,
    "averageResponseTime": "45.23",
    "medianResponseTime": "38.50",
    "p95ResponseTime": "156.78",
    "p99ResponseTime": "234.56"
  }
}

// GET /api/health/metrics
{
  "timestamp": "2025-11-14T10:30:00Z",
  "uptime": 3600,
  "memory": {
    "heapUsed": "45MB",
    "heapTotal": "128MB",
    "external": "2MB",
    "rss": "180MB"
  },
  "requests": 1250,
  "errors": 5,
  "errorRate": "0.40%",
  "responseTime": {
    "average": "45.23ms",
    "median": "38.50ms",
    "p95": "156.78ms",
    "p99": "234.56ms"
  }
}
```

### 4. Monitoring Middleware

Located in `src/middleware/monitoring.ts`

**Middleware:**

- `requestIdMiddleware` - Add unique request ID to each request
- `performanceMonitoringMiddleware` - Track response times
- `errorTrackingMiddleware` - Capture and log errors
- `setMonitoringUserContextMiddleware` - Set user context for tracking
- `securityEventLoggingMiddleware` - Track auth failures
- `systemHealthLoggingMiddleware` - Periodic health checks

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Monitoring
SENTRY_DSN=https://your-key@sentry.io/project-id
LOG_LEVEL=info

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=invoice_hub
DB_USER=postgres
DB_PASSWORD=postgres

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Sentry Setup

1. **Create Sentry Project:**
   ```bash
   # Go to https://sentry.io
   # Create new project for Node.js
   # Copy the DSN
   ```

2. **Add DSN to Environment:**
   ```env
   SENTRY_DSN=https://key@sentry.io/project-id
   ```

3. **Test Integration:**
   ```bash
   curl -X GET http://localhost:3000/api/health/detailed
   ```

### Docker Configuration

Health check in `docker-compose.yml`:

```yaml
services:
  api:
    image: invoice-hub:latest
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health/ready"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### Kubernetes Configuration

In your Kubernetes deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: invoice-hub
spec:
  template:
    spec:
      containers:
      - name: api
        image: invoice-hub:latest
        
        # Liveness probe - restart if not responding
        livenessProbe:
          httpGet:
            path: /api/health/live
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        
        # Readiness probe - remove from load balancer if not ready
        readinessProbe:
          httpGet:
            path: /api/health/ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
```

## Logging Best Practices

### 1. Structured Logging

Always include context:

```typescript
logger.info('Invoice created', {
  invoiceId: '123',
  customerId: '456',
  amount: 9999.99,
  duration: '245ms'
});
```

### 2. Error Logging

Include stack traces and context:

```typescript
try {
  // operation
} catch (error) {
  logger.error('Operation failed', {
    error: error.message,
    stack: error.stack,
    operationId: '789',
  });
}
```

### 3. Performance Tracking

Log slow operations:

```typescript
const start = Date.now();
// operation
const duration = Date.now() - start;

if (duration > 1000) {
  logger.warn('Slow operation', {
    operation: 'generateReport',
    duration: `${duration}ms`
  });
}
```

### 4. Security Events

Track security-related actions:

```typescript
monitoring.logSecurityEvent('failed_payment', 'high', {
  userId: user.id,
  attemptCount: failedAttempts,
  ip: req.ip
});
```

## Monitoring Alerts

### Health Status Levels

- **Healthy**: Error rate < 5%, response time < 1000ms
- **Degraded**: Error rate 5-10%, response time 1000-5000ms
- **Unhealthy**: Error rate > 10%, response time > 5000ms

### Alert Triggers

Set up alerts in your monitoring system:

```yaml
alerts:
  - name: HighErrorRate
    condition: errorRate > 10%
    severity: critical
  
  - name: SlowRequests
    condition: p95ResponseTime > 5000ms
    severity: warning
  
  - name: HighMemoryUsage
    condition: heapUsed > 80% of heapTotal
    severity: warning
  
  - name: ServiceDown
    condition: statusCode != 200 (health check)
    severity: critical
```

## Performance Optimization

### Response Time Percentiles

The system tracks:
- **Average**: Mean response time
- **Median**: 50th percentile (typical request)
- **P95**: 95th percentile (slow requests)
- **P99**: 99th percentile (very slow requests)

### Optimization Targets

- Average: < 100ms
- Median: < 50ms
- P95: < 500ms
- P99: < 2000ms

### Monitoring Optimization

```typescript
// View current performance
const metrics = monitoring.getMetrics();
console.log(`P95: ${metrics.p95ResponseTime}ms`);
console.log(`Error rate: ${metrics.errorRate}%`);

// Reset metrics after deployment
POST /api/health/reset-metrics
```

## Integration with Observability Platforms

### Datadog

```env
SENTRY_DSN=https://key@sentry.io/project-id
LOG_LEVEL=info
# Datadog agent must be running on localhost:8126
```

### New Relic

```env
NEW_RELIC_LICENSE_KEY=your-key
NEW_RELIC_APP_NAME=invoice-hub
```

### CloudWatch

Logs are written to files, then collected by CloudWatch agent:

```bash
/var/log/invoice-hub/error.log
/var/log/invoice-hub/combined.log
/var/log/invoice-hub/performance.log
```

## Troubleshooting

### Health Check Failing

1. Check database connection:
   ```bash
   psql $DATABASE_URL -c "SELECT NOW();"
   ```

2. Check Redis connection:
   ```bash
   redis-cli PING
   ```

3. View application logs:
   ```bash
   tail -f logs/combined.log
   ```

### High Error Rate

1. Check error log:
   ```bash
   tail -f logs/error.log
   ```

2. View detailed health status:
   ```bash
   curl http://localhost:3000/api/health/detailed
   ```

3. Check Sentry dashboard for error patterns

### Slow Response Times

1. Check performance log:
   ```bash
   grep "Slow" logs/combined.log
   ```

2. View metrics:
   ```bash
   curl http://localhost:3000/api/health/metrics
   ```

3. Profile slow database queries using PostgreSQL logs

## Security Considerations

1. **Sensitive Data**: Never log passwords, API keys, or PII
2. **Error Messages**: Don't expose internal error details to clients
3. **Audit Trail**: Log all security-relevant actions
4. **Request IDs**: Use for tracing security incidents
5. **User Context**: Always track which user performed actions

## References

- [Sentry Documentation](https://docs.sentry.io/platforms/node/)
- [Winston Logger](https://github.com/winstonjs/winston)
- [Kubernetes Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [Health Check Patterns](https://microservices.io/patterns/observability/health-check-api.html)
