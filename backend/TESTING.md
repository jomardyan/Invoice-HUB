# API Testing Scripts

Automated test suites for the Invoice-HUB API.

## 📋 Available Test Scripts

### 1. Full API Test Suite (`test-api.sh`)

Comprehensive integration testing covering all API endpoints.

**Usage:**
```bash
# Direct execution
./test-api.sh

# Via npm
npm run test:api
```

**Features:**
- ✅ Automatic server startup and shutdown
- ✅ Docker service management (PostgreSQL, Redis)
- ✅ Complete endpoint coverage
- ✅ Colored output with detailed reporting
- ✅ Test result summary with pass/fail statistics

**Test Coverage:**
- Health & Monitoring endpoints (5 tests)
- API Documentation (2 tests)
- Authentication (register, login, refresh token)
- Company Management (CRUD operations)
- Customer Management (CRUD operations)
- Product Management (CRUD operations)
- Invoice Management (create, list, workflows)
- Webhook Management
- Template Management
- Reporting endpoints
- Scheduler endpoints

**Output Example:**
```
╔═══════════════════════════════════════════════════════════════════╗
║          INVOICE-HUB API - AUTOMATED TEST SUITE                   ║
╚═══════════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏥 Testing Health Endpoints
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Health Check (Status: 200)
✓ Liveness Probe (Status: 200)
✓ Readiness Probe (Status: 200)
...
```

---

### 2. Quick Test (`quick-test.sh`)

Fast smoke test for critical endpoints - ideal for rapid feedback.

**Usage:**
```bash
# Direct execution
./quick-test.sh

# Via npm
npm run test:quick
```

**Features:**
- ⚡ Fast execution (< 5 seconds)
- ✅ Essential health checks
- ✅ Server availability verification
- ✅ Minimal dependencies

**Test Coverage:**
- Health Check endpoint
- Liveness probe
- Readiness probe
- Swagger documentation

**Output Example:**
```
🚀 Quick API Test Suite

Waiting for server...
Server is ready!

✓ Health Check
✓ Liveness
✓ Readiness
✓ Swagger Docs

Results:
  Passed: 4
  Failed: 0

✓ All quick tests passed!
```

---

### 3. Combined Testing (`npm run test:all`)

Runs both Jest unit tests and API integration tests.

**Usage:**
```bash
npm run test:all
```

---

## 🚀 Quick Start

### First Time Setup

1. **Start Docker services:**
```bash
cd /workspaces/Invoice-HUB
docker-compose up -d postgres redis
```

2. **Install dependencies:**
```bash
cd backend
npm install
```

3. **Run tests:**
```bash
# Quick smoke test
npm run test:quick

# Full API test suite
npm run test:api

# All tests (unit + integration)
npm run test:all
```

---

## 📊 Test Results

### Understanding Output

**Colors:**
- 🟢 Green (`✓`) = Test passed
- 🔴 Red (`✗`) = Test failed
- 🔵 Blue = Section headers
- 🟡 Yellow = Warnings
- 🔷 Cyan = Information

### Exit Codes

- `0` = All tests passed
- `1` = One or more tests failed

---

## 🔧 Configuration

### Environment Variables

The test scripts use the following defaults:

```bash
API_BASE_URL="http://localhost:3000"
API_VERSION="v1"
```

To change these, modify the variables at the top of each script.

### Temporary Files

Tests create temporary files in `/tmp/invoice-hub-tests/` including:
- `access_token` - Authentication token
- `tenant_id` - Test tenant ID
- `user_id` - Test user ID
- `company_id` - Created company ID
- `customer_id` - Created customer ID
- `product_id` - Created product ID
- `invoice_id` - Created invoice ID
- `server.log` - Server output

These are automatically cleaned up after test execution.

---

## 🐛 Troubleshooting

### Server Won't Start

```bash
# Check if port 3000 is already in use
lsof -ti:3000

# Kill process if needed
lsof -ti:3000 | xargs kill -9

# Check Docker services
docker-compose ps

# View server logs
tail -f /tmp/invoice-hub-tests/server.log
```

### Database Connection Issues

```bash
# Restart Docker services
docker-compose down
docker-compose up -d postgres redis

# Wait a few seconds for services to initialize
sleep 5
```

### Permission Denied

```bash
# Make scripts executable
chmod +x test-api.sh quick-test.sh
```

---

## 📝 Adding New Tests

To add tests for new endpoints:

1. Create a new test function in `test-api.sh`:
```bash
test_new_feature() {
    print_section "🆕 Testing New Feature"
    
    local token=$(cat "$TEMP_DIR/access_token")
    local tenant_id=$(cat "$TEMP_DIR/tenant_id")
    
    test_endpoint "Test Name" "POST" \
        "$API_BASE_URL/api/$API_VERSION/endpoint" \
        '{"data": "value"}' "201" "$token"
}
```

2. Add to main execution:
```bash
main() {
    # ... existing tests ...
    test_new_feature
    # ...
}
```

---

## 🎯 Best Practices

### When to Run Tests

**Quick Test:**
- After making small changes
- Before committing code
- During development

**Full API Test:**
- After completing a feature
- Before merging PRs
- After updating dependencies
- Before production deployment

**All Tests:**
- Before major releases
- After significant refactoring
- For comprehensive validation

### CI/CD Integration

Add to `.github/workflows/test.yml`:

```yaml
- name: Run API Tests
  run: |
    cd backend
    npm run test:api
```

---

## 📈 Test Statistics

Track your test coverage and pass rates:

```bash
# Run with detailed output
./test-api.sh 2>&1 | tee test-results.log

# Count tests
grep -c "✓" test-results.log  # Passed
grep -c "✗" test-results.log  # Failed
```

---

## 🔗 Related Documentation

- [API Documentation](../API_DOCUMENTATION.md)
- [Development Guide](../README.md)
- [Deployment Guide](../DEPLOYMENT.md)

---

## 📞 Support

If tests are failing:

1. Check server logs: `/tmp/invoice-hub-tests/server.log`
2. Verify Docker services are running
3. Ensure environment variables are set
4. Review the specific test output for error details

---

**Last Updated:** November 14, 2025
