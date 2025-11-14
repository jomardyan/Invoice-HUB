#!/bin/bash

################################################################################
# Start Invoice-HUB Backend Server for Testing
# Use this before running test-api.sh if the server isn't already running
################################################################################

set -e

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}🚀 Starting Invoice-HUB Backend Server${NC}\n"

# Check and start Docker services
echo -e "${CYAN}Checking Docker services...${NC}"
cd /workspaces/Invoice-HUB
if ! docker ps | grep -q invoice-hub-postgres; then
    echo "Starting PostgreSQL and Redis..."
    docker-compose up -d postgres redis
    sleep 5
    echo -e "${GREEN}✓ Docker services started${NC}"
else
    echo -e "${GREEN}✓ Docker services already running${NC}"
fi

# Start backend server
echo -e "\n${CYAN}Starting backend server...${NC}"
cd /workspaces/Invoice-HUB/backend

# Kill any existing server on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Start server in background
npx ts-node -r tsconfig-paths/register src/index.ts > /tmp/server.log 2>&1 &
SERVER_PID=$!

echo "Server PID: $SERVER_PID"

# Wait for server to be ready
echo "Waiting for server to start..."
for i in {1..30}; do
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo -e "\n${GREEN}✓ Server started successfully!${NC}"
        echo -e "${CYAN}Server is running at: http://localhost:3000${NC}"
        echo -e "${CYAN}API Docs: http://localhost:3000/api-docs${NC}"
        echo -e "\n${CYAN}To stop the server: kill $SERVER_PID${NC}"
        echo -e "Or press Ctrl+C if running in foreground\n"
        exit 0
    fi
    sleep 1
done

echo -e "\n${RED}✗ Server failed to start${NC}"
echo "Check logs at: /tmp/server.log"
tail -20 /tmp/server.log
exit 1
