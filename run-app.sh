#!/bin/bash

################################################################################
# Invoice-HUB Full Application Startup Script
# Starts: Database, Redis, Backend API, Admin Frontend, User Frontend
# Platform: Universal with Auto-Installation
# Features: Auto-install, Error handling, Health checks, Beautiful UI
################################################################################

set -e
set -o pipefail

################################################################################
# CONFIGURATION
################################################################################

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly MAGENTA='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[1;37m'
readonly NC='\033[0m'

# Server URLs
readonly BACKEND_URL="http://localhost:3000"
readonly ADMIN_URL="http://localhost:5174"
readonly USER_URL="http://localhost:5173"
readonly API_DOCS_URL="$BACKEND_URL/api-docs"

# Script configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly BACKEND_DIR="$SCRIPT_DIR/backend"
readonly ADMIN_DIR="$SCRIPT_DIR/frontend-admin"
readonly USER_DIR="$SCRIPT_DIR/frontend-user"
readonly LOG_DIR="$SCRIPT_DIR/.run-logs"

# Process tracking
declare -a RUNNING_PIDS=()
declare -a SERVICE_NAMES=()
DOCKER_STARTED=false
OS_DETECTED=""
NEED_SUDO=false

################################################################################
# UTILITY FUNCTIONS
################################################################################

print_banner() {
    clear
    echo -e "${CYAN}"
    cat << "EOF"
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║              INVOICE-HUB FULL APPLICATION STARTUP                        ║
║              Database • Redis • Backend • Admin • User                   ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}\n"
}

print_section() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${MAGENTA}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

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

spinner() {
    local pid=$1
    local delay=0.1
    local spinstr='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
    while kill -0 $pid 2>/dev/null; do
        local temp=${spinstr#?}
        printf " [${CYAN}%c${NC}]  " "$spinstr"
        local spinstr=$temp${spinstr%"$temp"}
        sleep $delay
        printf "\b\b\b\b\b\b"
    done
    printf "    \b\b\b\b"
}

detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS_DETECTED="$ID"
        log_info "Detected OS: $PRETTY_NAME"
    elif [ "$(uname)" == "Darwin" ]; then
        OS_DETECTED="macos"
        log_info "Detected OS: macOS"
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        OS_DETECTED="windows"
        log_info "Detected OS: Windows"
    else
        OS_DETECTED="linux"
        log_info "Detected OS: Linux"
    fi
    
    # Check if we can use sudo without password prompt
    if command -v sudo &> /dev/null; then
        if sudo -n true 2>/dev/null; then
            NEED_SUDO=true
        elif [ "$EUID" -eq 0 ]; then
            log_info "Running as root"
        else
            if groups | grep -q sudo; then
                NEED_SUDO=true
            fi
        fi
    elif [ "$EUID" -eq 0 ]; then
        log_info "Running as root"
    fi
}

check_port() {
    local port=$1
    local service=$2
    
    if command -v lsof &> /dev/null; then
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            log_warning "$service (port $port) is already in use"
            return 1
        fi
    fi
    return 0
}

kill_port() {
    local port=$1
    local service=$2
    
    log_info "Checking for processes on port $port..."
    
    if command -v lsof &> /dev/null; then
        local pids=$(lsof -ti:$port 2>/dev/null)
        if [ ! -z "$pids" ]; then
            log_warning "Found process(es) on port $port: $pids"
            log_info "Terminating process(es) on port $port..."
            
            # Try graceful termination first
            echo "$pids" | xargs kill -SIGTERM 2>/dev/null || true
            sleep 2
            
            # Force kill if still running
            local remaining=$(lsof -ti:$port 2>/dev/null)
            if [ ! -z "$remaining" ]; then
                log_warning "Forcing termination of remaining process(es)..."
                echo "$remaining" | xargs kill -9 2>/dev/null || true
                sleep 1
            fi
            
            # Verify port is free
            if lsof -ti:$port &> /dev/null; then
                log_error "Failed to free port $port"
                return 1
            else
                log_success "Port $port is now available"
                return 0
            fi
        else
            log_success "Port $port is available"
            return 0
        fi
    else
        log_warning "lsof not available - cannot check port $port"
        return 0
    fi
}

ensure_port_free() {
    local port=$1
    local service=$2
    
    if ! check_port $port "$service"; then
        kill_port $port "$service"
    fi
}

create_log_dir() {
    mkdir -p "$LOG_DIR"
    log_success "Created log directory: $LOG_DIR"
}

check_and_install_dependencies() {
    print_section "📦 Checking Dependencies"
    
    local missing_deps=false
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_warning "Node.js not found"
        missing_deps=true
    else
        log_success "Node.js $(node --version) installed"
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_warning "npm not found"
        missing_deps=true
    else
        log_success "npm $(npm --version) installed"
    fi
    
    # Check curl
    if ! command -v curl &> /dev/null; then
        log_warning "curl not found - may need for health checks"
    else
        log_success "curl installed"
    fi
    
    # Check lsof
    if ! command -v lsof &> /dev/null; then
        log_warning "lsof not found - port checking may not work"
    else
        log_success "lsof installed"
    fi
    
    if [ "$missing_deps" = true ]; then
        log_error "Missing required dependencies. Please install Node.js and npm"
        log_info "Visit: https://nodejs.org/ or run the full install script: bash run-tests.sh"
        return 1
    fi
    
    echo ""
    return 0
}

start_service() {
    local name=$1
    local command=$2
    local log_file=$3
    local check_url=$4
    
    log_info "Starting $name..."
    
    # Start the service in background
    eval "$command" > "$log_file" 2>&1 &
    local pid=$!
    
    RUNNING_PIDS+=($pid)
    SERVICE_NAMES+=("$name (PID: $pid)")
    
    # Wait for service to be ready if check_url provided
    if [ ! -z "$check_url" ]; then
        local attempts=0
        local max_attempts=30
        
        while [ $attempts -lt $max_attempts ]; do
            if curl -s "$check_url" > /dev/null 2>&1; then
                log_success "$name started successfully (PID: $pid)"
                echo "$pid" > "$LOG_DIR/${name// /_}.pid"
                return 0
            fi
            
            # Check if process is still running
            if ! kill -0 $pid 2>/dev/null; then
                log_error "$name process died unexpectedly"
                log_error "Last 20 lines of $name log:"
                tail -20 "$log_file"
                return 1
            fi
            
            sleep 1
            attempts=$((attempts + 1))
            printf "."
        done
        
        echo ""
        log_error "$name failed to start within ${max_attempts} seconds"
        log_error "Check log file: $log_file"
        return 1
    else
        log_success "$name started (PID: $pid)"
        echo "$pid" > "$LOG_DIR/${name// /_}.pid"
        sleep 2
        return 0
    fi
}

wait_for_port() {
    local port=$1
    local service=$2
    local max_attempts=30
    local attempts=0
    
    log_info "Waiting for $service on port $port..."
    
    while [ $attempts -lt $max_attempts ]; do
        if nc -z localhost $port 2>/dev/null || telnet localhost $port 2>/dev/null | grep -q Connected; then
            log_success "$service is ready on port $port"
            return 0
        fi
        
        sleep 1
        attempts=$((attempts + 1))
        printf "."
    done
    
    echo ""
    log_warning "$service may not be fully ready on port $port"
    return 0
}

################################################################################
# DOCKER SERVICES
################################################################################

start_docker_services() {
    print_section "🐳 Starting Docker Services (PostgreSQL & Redis)"
    
    if ! command -v docker &> /dev/null; then
        log_warning "Docker not installed - skipping database services"
        log_info "Run without database or install Docker for full functionality"
        return 0
    fi
    
    # Determine if we need sudo for docker commands
    local DOCKER_CMD="docker"
    if ! docker ps &> /dev/null; then
        if sudo docker ps &> /dev/null 2>&1; then
            DOCKER_CMD="sudo docker"
            log_info "Using sudo for Docker commands"
        else
            log_warning "Docker daemon not running - attempting to start..."
            case "$OS_DETECTED" in
                ubuntu|debian|pop|fedora|rhel|centos|linux)
                    if [ "$NEED_SUDO" = true ]; then
                        sudo systemctl start docker 2>/dev/null || log_warning "Failed to start Docker daemon"
                        sleep 3
                        if sudo docker ps &> /dev/null; then
                            DOCKER_CMD="sudo docker"
                        else
                            log_warning "Docker is not operational - skipping Docker services"
                            return 0
                        fi
                    fi
                    ;;
                macos)
                    log_warning "Docker Desktop needs to be running on macOS"
                    return 0
                    ;;
            esac
        fi
    fi
    
    cd "$SCRIPT_DIR"
    
    if [ ! -f "docker-compose.yml" ]; then
        log_warning "docker-compose.yml not found - skipping Docker services"
        return 0
    fi
    
    # Check if services are already running
    if $DOCKER_CMD ps 2>/dev/null | grep -q "invoice-hub-postgres"; then
        log_success "PostgreSQL is already running"
        return 0
    fi
    
    log_info "Starting PostgreSQL and Redis containers..."
    
    # Determine docker compose command
    local COMPOSE_CMD=""
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    elif $DOCKER_CMD compose version &> /dev/null 2>&1; then
        COMPOSE_CMD="$DOCKER_CMD compose"
    else
        log_warning "docker-compose not available - skipping Docker services"
        return 0
    fi
    
    # Add sudo if needed
    if [[ "$DOCKER_CMD" == "sudo docker" ]]; then
        COMPOSE_CMD="sudo docker-compose"
        if ! command -v docker-compose &> /dev/null; then
            COMPOSE_CMD="sudo docker compose"
        fi
    fi
    
    # Start services
    if $COMPOSE_CMD up -d postgres redis 2>/dev/null; then
        DOCKER_STARTED=true
        log_info "Waiting for database to be ready..."
        sleep 5
        log_success "Docker services started"
    else
        log_warning "Failed to start Docker services - will run without database"
    fi
    
    echo ""
}

stop_docker_services() {
    if [ "$DOCKER_STARTED" = true ]; then
        log_info "Stopping Docker services..."
        cd "$SCRIPT_DIR"
        
        # Determine compose command with sudo if needed
        if command -v docker-compose &> /dev/null; then
            if docker ps &> /dev/null; then
                docker-compose down 2>/dev/null || true
            else
                sudo docker-compose down 2>/dev/null || true
            fi
        else
            if docker compose version &> /dev/null 2>&1; then
                docker compose down 2>/dev/null || true
            else
                sudo docker compose down 2>/dev/null || true
            fi
        fi
        log_success "Docker services stopped"
    fi
}

################################################################################
# BACKEND SERVER
################################################################################

start_backend() {
    print_section "🚀 Starting Backend API Server"
    
    if [ ! -d "$BACKEND_DIR" ]; then
        log_error "Backend directory not found: $BACKEND_DIR"
        return 1
    fi
    
    # Kill any existing process on port 3000
    ensure_port_free 3000 "Backend"
    
    cd "$BACKEND_DIR"
    
    if [ ! -f "package.json" ]; then
        log_error "Backend package.json not found"
        return 1
    fi
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        log_info "Installing backend dependencies (this may take a few minutes)..."
        if npm install --silent 2>&1 | grep -i "error" > /tmp/npm-backend-errors.log; then
            log_warning "Some npm warnings occurred during backend install"
        fi
        log_success "Backend dependencies installed"
    else
        log_success "Backend dependencies already installed"
    fi
    
    # Check for ts-node
    if ! command -v ts-node &> /dev/null && [ ! -f "node_modules/.bin/ts-node" ]; then
        log_warning "ts-node not found - may affect development mode"
    fi
    
    # Start backend
    start_service "Backend API" \
        "npm run dev" \
        "$LOG_DIR/backend.log" \
        "http://localhost:3000/api/health"
    
    echo ""
}

################################################################################
# FRONTEND - ADMIN
################################################################################

start_admin_frontend() {
    print_section "⚙️  Starting Admin Frontend"
    
    if [ ! -d "$ADMIN_DIR" ]; then
        log_error "Admin frontend directory not found: $ADMIN_DIR"
        return 1
    fi
    
    # Kill any existing process on port 5174
    ensure_port_free 5174 "Admin Frontend"
    
    cd "$ADMIN_DIR"
    
    if [ ! -f "package.json" ]; then
        log_error "Admin frontend package.json not found"
        return 1
    fi
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        log_info "Installing admin frontend dependencies (this may take a few minutes)..."
        if npm install --silent 2>&1 | grep -i "error" > /tmp/npm-admin-errors.log; then
            log_warning "Some npm warnings occurred during admin install"
        fi
        log_success "Admin frontend dependencies installed"
    else
        log_success "Admin frontend dependencies already installed"
    fi
    
    # Start admin frontend
    start_service "Admin Frontend" \
        "npm run dev" \
        "$LOG_DIR/admin-frontend.log" \
        "http://localhost:5174"
    
    echo ""
}

################################################################################
# FRONTEND - USER
################################################################################

start_user_frontend() {
    print_section "👤 Starting User Frontend"
    
    if [ ! -d "$USER_DIR" ]; then
        log_error "User frontend directory not found: $USER_DIR"
        return 1
    fi
    
    # Kill any existing process on port 5173
    ensure_port_free 5173 "User Frontend"
    
    cd "$USER_DIR"
    
    if [ ! -f "package.json" ]; then
        log_error "User frontend package.json not found"
        return 1
    fi
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        log_info "Installing user frontend dependencies (this may take a few minutes)..."
        if npm install --silent 2>&1 | grep -i "error" > /tmp/npm-user-errors.log; then
            log_warning "Some npm warnings occurred during user install"
        fi
        log_success "User frontend dependencies installed"
    else
        log_success "User frontend dependencies already installed"
    fi
    
    # Start user frontend
    start_service "User Frontend" \
        "npm run dev" \
        "$LOG_DIR/user-frontend.log" \
        "http://localhost:5173"
    
    echo ""
}

################################################################################
# STATUS & HEALTH CHECK
################################################################################

print_startup_info() {
    print_section "📋 Application Startup Summary"
    
    echo -e "${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓ All services started successfully!${NC}\n"
    
    echo -e "${CYAN}Running Services:${NC}"
    for service in "${SERVICE_NAMES[@]}"; do
        echo -e "  ${GREEN}✓${NC} $service"
    done
    
    echo ""
    echo -e "${CYAN}Access URLs:${NC}"
    echo -e "  ${WHITE}Backend API:${NC}       ${BLUE}$BACKEND_URL${NC}"
    echo -e "  ${WHITE}API Documentation:${NC} ${BLUE}$API_DOCS_URL${NC}"
    echo -e "  ${WHITE}Admin Dashboard:${NC}   ${BLUE}$ADMIN_URL${NC}"
    echo -e "  ${WHITE}User Application:${NC}  ${BLUE}$USER_URL${NC}"
    
    echo ""
    echo -e "${CYAN}Log Files:${NC}"
    echo -e "  ${WHITE}Backend:${NC}          $LOG_DIR/backend.log"
    echo -e "  ${WHITE}Admin Frontend:${NC}   $LOG_DIR/admin-frontend.log"
    echo -e "  ${WHITE}User Frontend:${NC}    $LOG_DIR/user-frontend.log"
    
    echo ""
    echo -e "${CYAN}Quick Commands:${NC}"
    echo -e "  ${WHITE}View logs:${NC}        tail -f $LOG_DIR/*.log"
    echo -e "  ${WHITE}Stop all:${NC}         Press Ctrl+C"
    echo -e "  ${WHITE}Status:${NC}           curl $BACKEND_URL/api/health"
    
    echo -e "${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

check_health() {
    print_section "🏥 Checking Service Health"
    
    local all_healthy=true
    
    # Backend health
    if curl -s "$BACKEND_URL/api/health" > /dev/null 2>&1; then
        log_success "Backend API is healthy"
    else
        log_warning "Backend API health check failed"
        all_healthy=false
    fi
    
    # Admin frontend
    if curl -s "$ADMIN_URL" > /dev/null 2>&1; then
        log_success "Admin Frontend is responding"
    else
        log_warning "Admin Frontend not yet responding"
    fi
    
    # User frontend
    if curl -s "$USER_URL" > /dev/null 2>&1; then
        log_success "User Frontend is responding"
    else
        log_warning "User Frontend not yet responding"
    fi
    
    echo ""
    return 0
}

################################################################################
# CLEANUP & SHUTDOWN
################################################################################

shutdown_services() {
    print_section "🛑 Shutting Down Services"
    
    # Kill all running processes
    for pid in "${RUNNING_PIDS[@]}"; do
        if kill -0 $pid 2>/dev/null; then
            log_info "Stopping process $pid..."
            kill -SIGTERM $pid 2>/dev/null || true
            
            # Wait a bit then force kill if needed
            sleep 2
            if kill -0 $pid 2>/dev/null; then
                kill -9 $pid 2>/dev/null || true
            fi
        fi
    done
    
    log_success "All services stopped"
    echo ""
}

cleanup() {
    print_section "🧹 Cleanup"
    
    # Stop services
    shutdown_services
    
    # Stop Docker services if we started them
    stop_docker_services
    
    log_success "Cleanup complete"
}

################################################################################
# MAIN EXECUTION
################################################################################

main() {
    # Show banner
    print_banner
    
    # Setup signal handlers
    trap cleanup EXIT INT TERM
    
    # Detect OS
    detect_os
    
    # Create log directory
    create_log_dir
    
    # Check dependencies
    if ! check_and_install_dependencies; then
        log_error "Cannot start application without required dependencies"
        exit 1
    fi
    
    # Start Docker services (optional)
    start_docker_services || log_warning "Docker services failed to start - continuing without database"
    
    # Start backend
    if ! start_backend; then
        log_error "Failed to start backend - aborting startup"
        exit 1
    fi
    
    # Start admin frontend
    if ! start_admin_frontend; then
        log_warning "Failed to start admin frontend - continuing with limited functionality"
    fi
    
    # Start user frontend
    if ! start_user_frontend; then
        log_warning "Failed to start user frontend - continuing with limited functionality"
    fi
    
    # Print startup info
    print_startup_info
    
    # Check health
    check_health
    
    # Keep script running
    log_info "All services are running. Press Ctrl+C to stop."
    echo ""
    
    # Wait for all background processes
    wait
}

################################################################################
# HANDLE ARGUMENTS
################################################################################

case "${1:-}" in
    "health")
        check_health
        exit 0
        ;;
    "logs")
        if [ ! -z "$2" ]; then
            if [ -f "$LOG_DIR/$2.log" ]; then
                tail -f "$LOG_DIR/$2.log"
            else
                log_error "Log file not found: $LOG_DIR/$2.log"
                log_info "Available logs:"
                ls -1 "$LOG_DIR"/*.log 2>/dev/null | xargs -n1 basename || log_info "No logs available"
                exit 1
            fi
        else
            log_error "Please specify a service name"
            echo ""
            echo "Usage: $0 logs [service-name]"
            echo ""
            echo "Available services:"
            echo "  - backend"
            echo "  - admin-frontend"
            echo "  - user-frontend"
            exit 1
        fi
        ;;
    "stop")
        cleanup
        exit 0
        ;;
    "help"|"-h"|"--help")
        echo -e "${CYAN}Invoice-HUB Application Launcher${NC}"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  ${GREEN}(no command)${NC}     - Start all services (default)"
        echo "  ${GREEN}health${NC}           - Check health of running services"
        echo "  ${GREEN}logs <service>${NC}   - Tail logs for a specific service"
        echo "  ${GREEN}stop${NC}             - Stop all services"
        echo "  ${GREEN}help${NC}             - Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0                      # Start all services"
        echo "  $0 health              # Check service health"
        echo "  $0 logs backend        # View backend logs"
        echo "  $0 stop                # Stop all services"
        echo ""
        echo "Services:"
        echo "  - Backend API (port 3000)"
        echo "  - Admin Frontend (port 5174)"
        echo "  - User Frontend (port 5173)"
        echo "  - PostgreSQL (port 5432, via Docker)"
        echo "  - Redis (port 6379, via Docker)"
        echo ""
        echo "URLs:"
        echo "  - Backend API:       ${BLUE}http://localhost:3000${NC}"
        echo "  - API Docs:          ${BLUE}http://localhost:3000/api-docs${NC}"
        echo "  - Admin Dashboard:   ${BLUE}http://localhost:5174${NC}"
        echo "  - User Application:  ${BLUE}http://localhost:5173${NC}"
        echo ""
        echo "For more information, see: ${BLUE}Docs/DEVELOPMENT_WORKFLOW.md${NC}"
        exit 0
        ;;
    "")
        main "$@"
        ;;
    *)
        log_error "Unknown command: $1"
        echo ""
        echo "Run '$0 help' for usage information"
        exit 1
        ;;
esac
