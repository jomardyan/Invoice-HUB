#!/bin/bash

################################################################################
# Invoice-HUB Quick API Test
# Fast smoke test for critical endpoints
################################################################################

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

API_BASE="http://localhost:3000"
PASSED=0
FAILED=0

echo -e "${CYAN}🚀 Quick API Test Suite${NC}\n"

# Function to test endpoint
test() {
    local name="$1"
    local url="$2"
    local expected="$3"
    
    local status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$status" = "$expected" ]; then
        echo -e "${GREEN}✓${NC} $name"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗${NC} $name (Expected: $expected, Got: $status)"
        FAILED=$((FAILED + 1))
    fi
}

# Wait for server
echo "Waiting for server..."
for i in {1..30}; do
    if curl -s "$API_BASE/api/health/health" > /dev/null 2>&1; then
        echo -e "${GREEN}Server is ready!${NC}\n"
        break
    fi
    sleep 1
done

# Run tests
# Quick smoke tests
run_test "Health Check" "$API_URL/health"
run_test "Liveness Probe" "$API_URL/health/live"
run_test "Readiness Probe" "$API_URL/health/ready"
run_test "Swagger Docs" "$API_URL/../api-docs"

# Summary
echo ""
echo -e "${CYAN}Results:${NC}"
echo -e "  Passed: ${GREEN}$PASSED${NC}"
echo -e "  Failed: ${RED}$FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}✓ All quick tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}✗ Some tests failed${NC}"
    exit 1
fi
