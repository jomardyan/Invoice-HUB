#!/bin/bash

################################################################################
# Invoice-HUB API Test Suite
# Comprehensive integration testing for all API endpoints
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
API_BASE_URL="http://localhost:3000"
API_VERSION="v1"
SERVER_PID=""
TEST_RESULTS=()
PASSED_TESTS=0
FAILED_TESTS=0

# Temporary files
TEMP_DIR="/tmp/invoice-hub-tests"
mkdir -p "$TEMP_DIR"

################################################################################
# Utility Functions
################################################################################

print_header() {
    echo -e "${CYAN}"
    echo "╔═══════════════════════════════════════════════════════════════════╗"
    echo "║          INVOICE-HUB API - AUTOMATED TEST SUITE                   ║"
    echo "╚═══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_section() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${MAGENTA}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

log_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

log_success() {
    echo -e "${GREEN}✓ $1${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    TEST_RESULTS+=("✓ $1")
}

log_error() {
    echo -e "${RED}✗ $1${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    TEST_RESULTS+=("✗ $1")
}

log_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

################################################################################
# Server Management
################################################################################

start_services() {
    print_section "🚀 Starting Services"
    
    # Check if Docker services are running
    log_info "Checking Docker services..."
    if ! docker ps | grep -q invoice-hub-postgres; then
        log_info "Starting PostgreSQL and Redis..."
        cd /workspaces/Invoice-HUB
        docker-compose up -d postgres redis
        sleep 5
    else
        log_success "Docker services already running"
    fi
    
    # Start backend server
    log_info "Starting backend server..."
    cd /workspaces/Invoice-HUB/backend
    
    # Kill any existing server on port 3000
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    
    # Start server in background
    npx ts-node -r tsconfig-paths/register src/index.ts > "$TEMP_DIR/server.log" 2>&1 &
    SERVER_PID=$!
    
    # Wait for server to be ready
    log_info "Waiting for server to start..."
    for i in {1..30}; do
        if curl -s "$API_BASE_URL/api/health/health" > /dev/null 2>&1; then
            log_success "Server started successfully (PID: $SERVER_PID)"
            sleep 2  # Give it a bit more time to fully initialize
            return 0
        fi
        sleep 1
    done
    
    log_error "Server failed to start"
    cat "$TEMP_DIR/server.log"
    exit 1
}

stop_services() {
    print_section "🛑 Stopping Services"
    
    if [ ! -z "$SERVER_PID" ]; then
        log_info "Stopping backend server (PID: $SERVER_PID)..."
        kill -SIGINT $SERVER_PID 2>/dev/null || true
        wait $SERVER_PID 2>/dev/null || true
        log_success "Server stopped"
    fi
}

################################################################################
# Test Helper Functions
################################################################################

test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_status="$5"
    local token="$6"
    
    local headers=(-H "Content-Type: application/json")
    if [ ! -z "$token" ]; then
        headers+=(-H "Authorization: Bearer $token")
    fi
    
    local response_file="$TEMP_DIR/response_$$.json"
    local http_code
    
    if [ "$method" = "GET" ]; then
        http_code=$(curl -s -w "%{http_code}" -o "$response_file" \
            -X GET "${headers[@]}" "$endpoint")
    elif [ "$method" = "DELETE" ]; then
        http_code=$(curl -s -w "%{http_code}" -o "$response_file" \
            -X DELETE "${headers[@]}" "$endpoint" \
            -d "$data")
    else
        http_code=$(curl -s -w "%{http_code}" -o "$response_file" \
            -X "$method" "${headers[@]}" "$endpoint" \
            -d "$data")
    fi
    
    if [ "$http_code" = "$expected_status" ]; then
        log_success "$name (Status: $http_code)"
        cat "$response_file"
        rm -f "$response_file"
        return 0
    else
        log_error "$name (Expected: $expected_status, Got: $http_code)"
        cat "$response_file"
        rm -f "$response_file"
        return 1
    fi
}

################################################################################
# Test Suites
################################################################################

test_health_endpoints() {
    print_section "🏥 Testing Health Endpoints"
    
    test_endpoint "Health Check" "GET" \
        "$API_BASE_URL/api/health" \
        "" "200" ""
    
    test_endpoint "Liveness Probe" "GET" \
        "$API_BASE_URL/api/health/live" \
        "" "200" ""
    
    test_endpoint "Readiness Probe" "GET" \
        "$API_BASE_URL/api/health/ready" \
        "" "200" ""
    
    test_endpoint "Detailed Health" "GET" \
        "$API_BASE_URL/api/health/detailed" \
        "" "200" ""
    
    test_endpoint "Metrics" "GET" \
        "$API_BASE_URL/api/health/metrics" \
        "" "200" ""
}

test_documentation() {
    print_section "📚 Testing API Documentation"
    
    test_endpoint "Swagger JSON" "GET" \
        "$API_BASE_URL/api-docs.json" \
        "" "200" ""
    
    log_info "Checking Swagger UI availability..."
    if curl -s "$API_BASE_URL/api-docs" | grep -q "swagger"; then
        log_success "Swagger UI is accessible"
    else
        log_error "Swagger UI is not accessible"
    fi
}

test_authentication() {
    print_section "🔐 Testing Authentication"
    
    # Register a new user
    local timestamp=$(date +%s)
    local email="test$timestamp@example.com"
    
    local register_response=$(curl -s -X POST \
        "$API_BASE_URL/api/$API_VERSION/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$email\",
            \"password\": \"TestPass123!\",
            \"firstName\": \"Test\",
            \"lastName\": \"User\",
            \"tenantName\": \"Test Company $timestamp\"
        }")
    
    if echo "$register_response" | grep -q "accessToken"; then
        log_success "User Registration"
        
        # Extract tokens and user info
        ACCESS_TOKEN=$(echo "$register_response" | jq -r '.data.accessToken')
        REFRESH_TOKEN=$(echo "$register_response" | jq -r '.data.refreshToken')
        USER_ID=$(echo "$register_response" | jq -r '.data.user.id')
        TENANT_ID=$(echo "$register_response" | jq -r '.data.user.tenantId')
        
        # Save to file for use in other tests
        echo "$ACCESS_TOKEN" > "$TEMP_DIR/access_token"
        echo "$TENANT_ID" > "$TEMP_DIR/tenant_id"
        echo "$USER_ID" > "$TEMP_DIR/user_id"
        
        log_info "User ID: $USER_ID"
        log_info "Tenant ID: $TENANT_ID"
    else
        log_error "User Registration failed"
        echo "$register_response" | jq .
        return 1
    fi
    
    # Login
    local login_response=$(curl -s -X POST \
        "$API_BASE_URL/api/$API_VERSION/auth/login" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$email\",
            \"password\": \"TestPass123!\",
            \"tenantId\": \"$TENANT_ID\"
        }")
    
    if echo "$login_response" | grep -q "accessToken"; then
        log_success "User Login"
    else
        log_error "User Login failed"
    fi
    
    # Refresh token
    local refresh_response=$(curl -s -X POST \
        "$API_BASE_URL/api/$API_VERSION/auth/refresh" \
        -H "Content-Type: application/json" \
        -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}")
    
    if echo "$refresh_response" | grep -q "accessToken"; then
        log_success "Token Refresh"
    else
        log_error "Token Refresh failed"
    fi
}

test_companies() {
    print_section "🏢 Testing Company Management"
    
    local token=$(cat "$TEMP_DIR/access_token")
    local tenant_id=$(cat "$TEMP_DIR/tenant_id")
    local timestamp=$(date +%s)
    
    # Create company
    local company_response=$(curl -s -X POST \
        "$API_BASE_URL/api/$API_VERSION/$tenant_id/companies" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d "{
            \"name\": \"Test Corp $timestamp\",
            \"nip\": \"$timestamp\",
            \"address\": \"ul. Testowa 123\",
            \"postalCode\": \"00-001\",
            \"city\": \"Warsaw\",
            \"country\": \"PL\",
            \"email\": \"contact@test$timestamp.com\",
            \"phone\": \"+48123456789\",
            \"bankAccount\": \"PL12345678901234567890123456\"
        }")
    
    if echo "$company_response" | grep -q "\"status\":\"success\""; then
        log_success "Create Company"
        COMPANY_ID=$(echo "$company_response" | jq -r '.data.id')
        echo "$COMPANY_ID" > "$TEMP_DIR/company_id"
    else
        log_error "Create Company failed"
        echo "$company_response" | jq .
    fi
    
    # List companies
    test_endpoint "List Companies" "GET" \
        "$API_BASE_URL/api/$API_VERSION/$tenant_id/companies" \
        "" "200" "$token"
    
    # Get company by ID
    if [ ! -z "$COMPANY_ID" ]; then
        test_endpoint "Get Company by ID" "GET" \
            "$API_BASE_URL/api/$API_VERSION/$tenant_id/companies/$COMPANY_ID" \
            "" "200" "$token"
    fi
}

test_customers() {
    print_section "👥 Testing Customer Management"
    
    local token=$(cat "$TEMP_DIR/access_token")
    local tenant_id=$(cat "$TEMP_DIR/tenant_id")
    local company_id=$(cat "$TEMP_DIR/company_id")
    local timestamp=$(date +%s)
    
    # Create customer
    local customer_response=$(curl -s -X POST \
        "$API_BASE_URL/api/$API_VERSION/$tenant_id/customers" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d "{
            \"type\": \"business\",
            \"name\": \"Client Corp $timestamp\",
            \"email\": \"client$timestamp@example.com\",
            \"phone\": \"+48987654321\",
            \"nip\": \"9$timestamp\",
            \"billingAddress\": \"ul. Klienta 456\",
            \"billingPostalCode\": \"02-002\",
            \"billingCity\": \"Krakow\",
            \"billingCountry\": \"PL\",
            \"companyId\": \"$company_id\"
        }")
    
    if echo "$customer_response" | grep -q "\"status\":\"success\""; then
        log_success "Create Customer"
        CUSTOMER_ID=$(echo "$customer_response" | jq -r '.data.id')
        echo "$CUSTOMER_ID" > "$TEMP_DIR/customer_id"
    else
        log_error "Create Customer failed"
        echo "$customer_response" | jq .
    fi
    
    # List customers
    test_endpoint "List Customers" "GET" \
        "$API_BASE_URL/api/$API_VERSION/$tenant_id/customers" \
        "" "200" "$token"
    
    # Get customer by ID
    if [ ! -z "$CUSTOMER_ID" ]; then
        test_endpoint "Get Customer by ID" "GET" \
            "$API_BASE_URL/api/$API_VERSION/$tenant_id/customers/$CUSTOMER_ID" \
            "" "200" "$token"
    fi
}

test_products() {
    print_section "📦 Testing Product Management"
    
    local token=$(cat "$TEMP_DIR/access_token")
    local tenant_id=$(cat "$TEMP_DIR/tenant_id")
    local company_id=$(cat "$TEMP_DIR/company_id")
    local timestamp=$(date +%s)
    
    # Create product
    local product_response=$(curl -s -X POST \
        "$API_BASE_URL/api/$API_VERSION/$tenant_id/products" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d "{
            \"sku\": \"PROD-$timestamp\",
            \"name\": \"Widget Pro $timestamp\",
            \"description\": \"Premium widget for testing\",
            \"category\": \"Electronics\",
            \"price\": 99.99,
            \"currency\": \"PLN\",
            \"vatRate\": 23,
            \"unit\": \"pcs\",
            \"companyId\": \"$company_id\"
        }")
    
    if echo "$product_response" | grep -q "\"status\":\"success\""; then
        log_success "Create Product"
        PRODUCT_ID=$(echo "$product_response" | jq -r '.data.id')
        echo "$PRODUCT_ID" > "$TEMP_DIR/product_id"
    else
        log_error "Create Product failed"
        echo "$product_response" | jq .
    fi
    
    # List products
    test_endpoint "List Products" "GET" \
        "$API_BASE_URL/api/$API_VERSION/$tenant_id/products" \
        "" "200" "$token"
    
    # Get product by ID
    if [ ! -z "$PRODUCT_ID" ]; then
        test_endpoint "Get Product by ID" "GET" \
            "$API_BASE_URL/api/$API_VERSION/$tenant_id/products/$PRODUCT_ID" \
            "" "200" "$token"
    fi
}

test_invoices() {
    print_section "🧾 Testing Invoice Management"
    
    local token=$(cat "$TEMP_DIR/access_token")
    local tenant_id=$(cat "$TEMP_DIR/tenant_id")
    local company_id=$(cat "$TEMP_DIR/company_id")
    local customer_id=$(cat "$TEMP_DIR/customer_id")
    local product_id=$(cat "$TEMP_DIR/product_id")
    
    # Create invoice
    local invoice_response=$(curl -s -X POST \
        "$API_BASE_URL/api/$API_VERSION/$tenant_id/invoices" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d "{
            \"companyId\": \"$company_id\",
            \"customerId\": \"$customer_id\",
            \"invoiceType\": \"standard\",
            \"issueDate\": \"2025-11-14\",
            \"dueDate\": \"2025-11-28\",
            \"items\": [
                {
                    \"productId\": \"$product_id\",
                    \"description\": \"Widget Pro\",
                    \"quantity\": 5,
                    \"unitPrice\": 99.99,
                    \"vatRate\": 23
                }
            ],
            \"notes\": \"Test invoice\"
        }")
    
    if echo "$invoice_response" | grep -q "\"status\":\"success\""; then
        log_success "Create Invoice"
        INVOICE_ID=$(echo "$invoice_response" | jq -r '.data.id')
        echo "$INVOICE_ID" > "$TEMP_DIR/invoice_id"
    else
        log_error "Create Invoice failed"
        echo "$invoice_response" | jq .
    fi
    
    # List invoices
    test_endpoint "List Invoices" "GET" \
        "$API_BASE_URL/api/$API_VERSION/$tenant_id/invoices" \
        "" "200" "$token"
    
    if [ ! -z "$INVOICE_ID" ]; then
        # Get invoice by ID
        test_endpoint "Get Invoice by ID" "GET" \
            "$API_BASE_URL/api/$API_VERSION/$tenant_id/invoices/$INVOICE_ID" \
            "" "200" "$token"
        
        # Mark as pending
        test_endpoint "Mark Invoice as Pending" "POST" \
            "$API_BASE_URL/api/$API_VERSION/$tenant_id/invoices/$INVOICE_ID/mark-pending" \
            "" "200" "$token"
        
        # Approve invoice
        test_endpoint "Approve Invoice" "POST" \
            "$API_BASE_URL/api/$API_VERSION/$tenant_id/invoices/$INVOICE_ID/approve" \
            "" "200" "$token"
    fi
}

test_webhooks() {
    print_section "🔗 Testing Webhook Management"
    
    local token=$(cat "$TEMP_DIR/access_token")
    local tenant_id=$(cat "$TEMP_DIR/tenant_id")
    
    # Create webhook
    local webhook_response=$(curl -s -X POST \
        "$API_BASE_URL/api/$API_VERSION/webhooks/$tenant_id" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d "{
            \"url\": \"https://webhook.site/test-endpoint-$(date +%s)\",
            \"events\": [\"invoice.created\", \"invoice.paid\"],
            \"description\": \"Test webhook\"
        }")
    
    if echo "$webhook_response" | grep -q "\"id\""; then
        log_success "Create Webhook"
        WEBHOOK_ID=$(echo "$webhook_response" | jq -r '.id')
    else
        log_error "Create Webhook failed"
        echo "$webhook_response" | jq .
    fi
    
    # List webhooks
    test_endpoint "List Webhooks" "GET" \
        "$API_BASE_URL/api/$API_VERSION/webhooks/$tenant_id" \
        "" "200" "$token"
}

test_templates() {
    print_section "📝 Testing Template Management"
    
    local token=$(cat "$TEMP_DIR/access_token")
    local tenant_id=$(cat "$TEMP_DIR/tenant_id")
    
    # Create template
    local template_response=$(curl -s -X POST \
        "$API_BASE_URL/api/$API_VERSION/$tenant_id/templates" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d "{
            \"name\": \"Test Invoice Template\",
            \"type\": \"invoice\",
            \"subject\": \"Invoice {{invoiceNumber}}\",
            \"body\": \"<h1>Invoice {{invoiceNumber}}</h1><p>Total: {{total}}</p>\"
        }")
    
    if echo "$template_response" | grep -q "\"status\":\"success\""; then
        log_success "Create Template"
    else
        log_error "Create Template failed"
    fi
    
    # List templates
    test_endpoint "List Templates" "GET" \
        "$API_BASE_URL/api/$API_VERSION/$tenant_id/templates" \
        "" "200" "$token"
}

test_reports() {
    print_section "📊 Testing Reporting Endpoints"
    
    local token=$(cat "$TEMP_DIR/access_token")
    local tenant_id=$(cat "$TEMP_DIR/tenant_id")
    
    # Dashboard metrics
    test_endpoint "Dashboard Metrics" "GET" \
        "$API_BASE_URL/api/$API_VERSION/reports/$tenant_id/dashboard" \
        "" "200" "$token"
    
    # Sales report
    test_endpoint "Sales Report" "GET" \
        "$API_BASE_URL/api/$API_VERSION/reports/$tenant_id/sales?startDate=2025-11-01&endDate=2025-11-30" \
        "" "200" "$token"
}

test_scheduler() {
    print_section "⏰ Testing Scheduler Endpoints"
    
    local token=$(cat "$TEMP_DIR/access_token")
    local tenant_id=$(cat "$TEMP_DIR/tenant_id")
    
    # List tasks
    test_endpoint "List Scheduled Tasks" "GET" \
        "$API_BASE_URL/api/$API_VERSION/$tenant_id/scheduler/tasks" \
        "" "200" "$token"
}

################################################################################
# Test Summary
################################################################################

print_summary() {
    print_section "📋 Test Summary"
    
    local total=$((PASSED_TESTS + FAILED_TESTS))
    local pass_rate=0
    
    if [ $total -gt 0 ]; then
        pass_rate=$(awk "BEGIN {printf \"%.1f\", ($PASSED_TESTS/$total)*100}")
    fi
    
    echo -e "${CYAN}Total Tests:${NC} $total"
    echo -e "${GREEN}Passed:${NC} $PASSED_TESTS"
    echo -e "${RED}Failed:${NC} $FAILED_TESTS"
    echo -e "${CYAN}Pass Rate:${NC} ${pass_rate}%"
    
    echo ""
    echo "Detailed Results:"
    for result in "${TEST_RESULTS[@]}"; do
        echo "  $result"
    done
    
    echo ""
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║          ✓ ALL TESTS PASSED - SYSTEM OPERATIONAL                  ║${NC}"
        echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════╝${NC}"
        return 0
    else
        echo -e "${RED}╔═══════════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${RED}║          ✗ SOME TESTS FAILED - REVIEW REQUIRED                    ║${NC}"
        echo -e "${RED}╚═══════════════════════════════════════════════════════════════════╝${NC}"
        return 1
    fi
}

################################################################################
# Main Execution
################################################################################

main() {
    print_header
    
    # Trap to ensure cleanup on exit
    trap cleanup EXIT INT TERM
    
    # Start services
    start_services
    
    # Run all test suites
    test_health_endpoints
    test_documentation
    test_authentication
    test_companies
    test_customers
    test_products
    test_invoices
    test_webhooks
    test_templates
    test_reports
    test_scheduler
    
    # Print summary
    print_summary
    
    # Return exit code based on test results
    [ $FAILED_TESTS -eq 0 ]
}

cleanup() {
    stop_services
    log_info "Cleaning up temporary files..."
    rm -rf "$TEMP_DIR"
}

# Run main function
main
