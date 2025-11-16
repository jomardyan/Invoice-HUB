#!/bin/bash

################################################################################
# Port Management Utility for Invoice-HUB
# Kills processes on specific ports used by the application
################################################################################

set -e

# Colors
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m'

# Application ports
readonly BACKEND_PORT=3000
readonly USER_FRONTEND_PORT=5173
readonly ADMIN_FRONTEND_PORT=5174
readonly POSTGRES_PORT=5432
readonly REDIS_PORT=6379

log_info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

kill_port() {
    local port=$1
    local service=$2
    
    if ! command -v lsof &> /dev/null; then
        log_error "lsof not installed - cannot kill ports"
        return 1
    fi
    
    local pids=$(lsof -ti:$port 2>/dev/null)
    
    if [ -z "$pids" ]; then
        log_info "Port $port ($service) is not in use"
        return 0
    fi
    
    log_warning "Port $port ($service) is in use by PID(s): $pids"
    log_info "Terminating process(es)..."
    
    # Try graceful termination
    echo "$pids" | xargs kill -SIGTERM 2>/dev/null || true
    sleep 2
    
    # Check if still running
    local remaining=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$remaining" ]; then
        log_warning "Forcing termination..."
        echo "$remaining" | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
    
    # Verify
    if lsof -ti:$port &> /dev/null; then
        log_error "Failed to free port $port"
        return 1
    else
        log_success "Port $port ($service) freed successfully"
        return 0
    fi
}

show_port_status() {
    echo -e "\n${CYAN}Port Status for Invoice-HUB:${NC}\n"
    
    if ! command -v lsof &> /dev/null; then
        log_error "lsof not installed - cannot check ports"
        return 1
    fi
    
    local ports=("$BACKEND_PORT:Backend API" "$USER_FRONTEND_PORT:User Frontend" "$ADMIN_FRONTEND_PORT:Admin Frontend" "$POSTGRES_PORT:PostgreSQL" "$REDIS_PORT:Redis")
    
    for port_info in "${ports[@]}"; do
        local port="${port_info%%:*}"
        local service="${port_info#*:}"
        local pid=$(lsof -ti:$port 2>/dev/null)
        
        if [ -z "$pid" ]; then
            echo -e "  Port ${CYAN}$port${NC} ($service): ${GREEN}Available${NC}"
        else
            local process=$(ps -p $pid -o comm= 2>/dev/null || echo "unknown")
            echo -e "  Port ${CYAN}$port${NC} ($service): ${RED}In Use${NC} (PID: $pid, Process: $process)"
        fi
    done
    echo ""
}

kill_all_app_ports() {
    log_info "Killing all Invoice-HUB application ports..."
    echo ""
    
    kill_port $BACKEND_PORT "Backend API"
    kill_port $USER_FRONTEND_PORT "User Frontend"
    kill_port $ADMIN_FRONTEND_PORT "Admin Frontend"
    
    echo ""
    log_success "All application ports cleaned"
}

show_help() {
    cat << EOF
${CYAN}Invoice-HUB Port Management Utility${NC}

Usage: $0 [command] [port]

Commands:
  ${GREEN}status${NC}              - Show status of all application ports
  ${GREEN}kill <port>${NC}         - Kill process on specific port
  ${GREEN}kill-all${NC}            - Kill processes on all application ports
  ${GREEN}backend${NC}             - Kill backend (port $BACKEND_PORT)
  ${GREEN}user${NC}                - Kill user frontend (port $USER_FRONTEND_PORT)
  ${GREEN}admin${NC}               - Kill admin frontend (port $ADMIN_FRONTEND_PORT)
  ${GREEN}help${NC}                - Show this help message

Application Ports:
  - Backend API:       $BACKEND_PORT
  - User Frontend:     $USER_FRONTEND_PORT
  - Admin Frontend:    $ADMIN_FRONTEND_PORT
  - PostgreSQL:        $POSTGRES_PORT (Docker)
  - Redis:             $REDIS_PORT (Docker)

Examples:
  $0 status                    # Show port status
  $0 kill 3000                # Kill process on port 3000
  $0 backend                  # Kill backend server
  $0 kill-all                 # Kill all app ports

Note: Docker ports (PostgreSQL, Redis) should be managed via:
  docker-compose down         # Stop all Docker services
  $0 kill $POSTGRES_PORT         # Force kill PostgreSQL
  $0 kill $REDIS_PORT            # Force kill Redis

EOF
}

# Main command handler
case "${1:-status}" in
    "status")
        show_port_status
        ;;
    "kill")
        if [ -z "$2" ]; then
            log_error "Please specify a port number"
            echo "Usage: $0 kill <port>"
            exit 1
        fi
        kill_port "$2" "Port $2"
        ;;
    "kill-all")
        kill_all_app_ports
        ;;
    "backend")
        kill_port $BACKEND_PORT "Backend API"
        ;;
    "user")
        kill_port $USER_FRONTEND_PORT "User Frontend"
        ;;
    "admin")
        kill_port $ADMIN_FRONTEND_PORT "Admin Frontend"
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        echo ""
        echo "Run '$0 help' for usage information"
        exit 1
        ;;
esac
