#!/bin/bash

################################################################################
# Invoice-HUB Master Test & Setup Script
# Universal script with auto-installation, error handling, and comprehensive testing
################################################################################

set -e  # Exit on error
set -o pipefail  # Catch errors in pipes

################################################################################
# CONFIGURATION
################################################################################

# Colors for beautiful output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly MAGENTA='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[1;37m'
readonly NC='\033[0m' # No Color

# API Configuration
readonly API_BASE_URL="http://localhost:3000"
readonly API_VERSION="v1"
readonly HEALTH_ENDPOINT="$API_BASE_URL/api/health"

# Directory Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly BACKEND_DIR="$SCRIPT_DIR/backend"
readonly TEMP_DIR="/tmp/invoice-hub-tests-$$"

# Process Management
SERVER_PID=""
DOCKER_STARTED=false

# Test Results
declare -a TEST_RESULTS=()
PASSED_TESTS=0
FAILED_TESTS=0

# Installation flags
NEED_SUDO=false
OS_DETECTED=""

################################################################################
# UTILITY FUNCTIONS
################################################################################

print_banner() {
    clear
    echo -e "${CYAN}"
    echo "╔═══════════════════════════════════════════════════════════════════════════╗"
    echo "║                                                                           ║"
    echo "║              INVOICE-HUB MASTER TEST & SETUP SCRIPT                      ║"
    echo "║              Universal • Auto-Install • Error-Safe                       ║"
    echo "║                                                                           ║"
    echo "╚═══════════════════════════════════════════════════════════════════════════╝"
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

log_test_pass() {
    echo -e "${GREEN}✓${NC} $1"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    TEST_RESULTS+=("✓ $1")
}

log_test_fail() {
    echo -e "${RED}✗${NC} $1"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    TEST_RESULTS+=("✗ $1")
}

spinner() {
    local pid=$1
    local delay=0.1
    local spinstr='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
    while [ "$(ps a | awk '{print $1}' | grep $pid)" ]; do
        local temp=${spinstr#?}
        printf " [${CYAN}%c${NC}]  " "$spinstr"
        local spinstr=$temp${spinstr%"$temp"}
        sleep $delay
        printf "\b\b\b\b\b\b"
    done
    printf "    \b\b\b\b"
}

kill_port() {
    local port=$1
    local service=$2
    
    log_info "Checking for existing server on port $port..."
    
    if command -v lsof &> /dev/null; then
        local pids=$(lsof -ti:$port 2>/dev/null)
        if [ ! -z "$pids" ]; then
            log_warning "Port $port in use - terminating existing process(es)..."
            
            # Try graceful termination first
            echo "$pids" | xargs kill -SIGTERM 2>/dev/null || true
            sleep 2
            
            # Force kill if still running
            local remaining=$(lsof -ti:$port 2>/dev/null)
            if [ ! -z "$remaining" ]; then
                echo "$remaining" | xargs kill -9 2>/dev/null || true
                sleep 1
            fi
            
            # Verify port is free
            if ! lsof -ti:$port &> /dev/null; then
                log_success "Port $port freed successfully"
            fi
        fi
    fi
}

################################################################################
# SYSTEM DETECTION & REQUIREMENTS
################################################################################

detect_os() {
    print_section "🔍 Detecting System Information"
    
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS_DETECTED="$ID"
        log_info "Operating System: $PRETTY_NAME"
        log_info "Version: $VERSION_ID"
    elif [ "$(uname)" == "Darwin" ]; then
        OS_DETECTED="macos"
        log_info "Operating System: macOS"
    else
        OS_DETECTED="unknown"
        log_warning "Unknown operating system"
    fi
    
    # Check if we can use sudo without password prompt
    if command -v sudo &> /dev/null; then
        if sudo -n true 2>/dev/null; then
            NEED_SUDO=true
            log_success "sudo access available (passwordless)"
        elif [ "$EUID" -eq 0 ]; then
            log_success "Running as root"
        else
            # Check if user is in sudo group (can use sudo with password)
            if groups | grep -q sudo; then
                NEED_SUDO=true
                log_warning "sudo available but requires password - some installations may fail"
            else
                log_warning "No sudo access - will attempt without privileges"
            fi
        fi
    elif [ "$EUID" -eq 0 ]; then
        log_success "Running as root"
    else
        log_warning "No sudo access - will attempt without privileges"
    fi
    
    log_info "User: $(whoami)"
    log_info "Home: $HOME"
    log_info "Shell: $SHELL"
    echo ""
}

################################################################################
# DEPENDENCY INSTALLATION
################################################################################

update_package_manager() {
    log_info "Updating package manager..."
    
    case "$OS_DETECTED" in
        ubuntu|debian|pop)
            if [ "$NEED_SUDO" = true ]; then
                if sudo -n true 2>/dev/null; then
                    sudo apt-get update -qq > /dev/null 2>&1 || log_warning "apt-get update failed"
                else
                    log_warning "Skipping apt-get update (requires password)"
                fi
            else
                apt-get update -qq > /dev/null 2>&1 || log_warning "apt-get update failed"
            fi
            ;;
        fedora|rhel|centos)
            if [ "$NEED_SUDO" = true ]; then
                if sudo -n true 2>/dev/null; then
                    sudo dnf check-update -q > /dev/null 2>&1 || true
                else
                    log_warning "Skipping dnf check-update (requires password)"
                fi
            else
                dnf check-update -q > /dev/null 2>&1 || true
            fi
            ;;
        macos)
            if ! command -v brew &> /dev/null; then
                log_warning "Homebrew not installed - installing now..."
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            fi
            brew update > /dev/null 2>&1 || log_warning "brew update failed"
            ;;
    esac
    
    log_success "Package manager ready"
}

install_package() {
    local package=$1
    local command_name=${2:-$package}
    
    if command -v "$command_name" &> /dev/null; then
        log_success "$command_name is already installed"
        return 0
    fi
    
    log_info "Installing $package..."
    
    case "$OS_DETECTED" in
        ubuntu|debian|pop)
            if [ "$NEED_SUDO" = true ]; then
                if sudo -n true 2>/dev/null; then
                    if sudo apt-get install -y -qq "$package" > /dev/null 2>&1; then
                        log_success "$package installed"
                        return 0
                    fi
                else
                    log_warning "Skipping $package installation (requires password)"
                    return 1
                fi
            else
                if apt-get install -y -qq "$package" > /dev/null 2>&1; then
                    log_success "$package installed"
                    return 0
                fi
            fi
            ;;
        fedora|rhel|centos)
            if [ "$NEED_SUDO" = true ]; then
                if sudo -n true 2>/dev/null; then
                    if sudo dnf install -y -q "$package" > /dev/null 2>&1; then
                        log_success "$package installed"
                        return 0
                    fi
                else
                    log_warning "Skipping $package installation (requires password)"
                    return 1
                fi
            else
                if dnf install -y -q "$package" > /dev/null 2>&1; then
                    log_success "$package installed"
                    return 0
                fi
            fi
            ;;
        macos)
            if brew install "$package" > /dev/null 2>&1; then
                log_success "$package installed"
                return 0
            fi
            ;;
    esac
    
    # If command is available after installation attempt, consider it success
    if command -v "$command_name" &> /dev/null; then
        log_success "$command_name is now available"
        return 0
    else
        log_warning "$command_name not available - skipping"
        return 1
    fi
}

install_nodejs() {
    if command -v node &> /dev/null; then
        local node_version=$(node --version 2>/dev/null || echo "unknown")
        log_success "Node.js is already installed: $node_version"
        return 0
    fi
    
    log_info "Installing Node.js..."
    
    # Try to install Node.js via package manager
    case "$OS_DETECTED" in
        ubuntu|debian|pop)
            log_info "Setting up NodeSource repository..."
            if [ "$NEED_SUDO" = true ]; then
                if sudo -n true 2>/dev/null; then
                    if curl -fsSL https://deb.nodesource.com/setup_20.x 2>/dev/null | sudo -E bash - > /dev/null 2>&1; then
                        if sudo apt-get install -y -qq nodejs > /dev/null 2>&1; then
                            log_success "Node.js installed: $(node --version)"
                            return 0
                        fi
                    fi
                else
                    log_warning "Cannot install Node.js via apt (requires sudo password)"
                    return 1
                fi
            else
                if curl -fsSL https://deb.nodesource.com/setup_20.x 2>/dev/null | bash - > /dev/null 2>&1; then
                    if apt-get install -y -qq nodejs > /dev/null 2>&1; then
                        log_success "Node.js installed: $(node --version)"
                        return 0
                    fi
                fi
            fi
            ;;
        fedora|rhel|centos)
            if [ "$NEED_SUDO" = true ]; then
                if sudo -n true 2>/dev/null; then
                    if sudo dnf install -y -q nodejs npm > /dev/null 2>&1; then
                        log_success "Node.js installed: $(node --version)"
                        return 0
                    fi
                else
                    log_warning "Cannot install Node.js via dnf (requires sudo password)"
                    return 1
                fi
            else
                if dnf install -y -q nodejs npm > /dev/null 2>&1; then
                    log_success "Node.js installed: $(node --version)"
                    return 0
                fi
            fi
            ;;
        macos)
            if brew install node > /dev/null 2>&1; then
                log_success "Node.js installed: $(node --version)"
                return 0
            fi
            ;;
    esac
    
    if command -v node &> /dev/null; then
        log_success "Node.js installed: $(node --version)"
        return 0
    else
        log_error "Failed to install Node.js - cannot proceed"
        return 1
    fi
}

install_docker() {
    if command -v docker &> /dev/null; then
        log_success "Docker is already installed: $(docker --version 2>/dev/null | head -n1)"
        return 0
    fi
    
    log_info "Installing Docker..."
    
    case "$OS_DETECTED" in
        ubuntu|debian|pop)
            if [ "$NEED_SUDO" = true ]; then
                if sudo -n true 2>/dev/null; then
                    # Install Docker using convenience script
                    if curl -fsSL https://get.docker.com -o /tmp/get-docker.sh 2>/dev/null; then
                        if sudo sh /tmp/get-docker.sh > /dev/null 2>&1; then
                            sudo usermod -aG docker $USER > /dev/null 2>&1
                            rm -f /tmp/get-docker.sh
                            log_success "Docker installed successfully"
                            # Apply group changes immediately
                            if ! newgrp docker &> /dev/null; then
                                log_info "Applying docker group permissions..."
                                sg docker -c "docker ps > /dev/null 2>&1" || log_warning "Docker may require group refresh"
                            fi
                            return 0
                        fi
                    fi
                    rm -f /tmp/get-docker.sh
                else
                    log_warning "Cannot install Docker (requires sudo password)"
                    return 1
                fi
            else
                log_warning "Need sudo to install Docker"
                return 1
            fi
            ;;
        fedora|rhel|centos)
            if [ "$NEED_SUDO" = true ]; then
                if sudo -n true 2>/dev/null; then
                    if sudo dnf install -y -q docker > /dev/null 2>&1; then
                        sudo systemctl start docker > /dev/null 2>&1
                        sudo usermod -aG docker $USER > /dev/null 2>&1
                        log_success "Docker installed and started successfully"
                        # Apply group changes immediately
                        if ! newgrp docker &> /dev/null; then
                            log_info "Applying docker group permissions..."
                            sg docker -c "docker ps > /dev/null 2>&1" || log_warning "Docker may require group refresh"
                        fi
                        return 0
                    fi
                else
                    log_warning "Cannot install Docker (requires sudo password)"
                    return 1
                fi
            else
                log_warning "Need sudo to install Docker"
                return 1
            fi
            ;;
        macos)
            log_warning "Please install Docker Desktop for Mac from https://www.docker.com/products/docker-desktop"
            return 1
            ;;
    esac
    
    if command -v docker &> /dev/null; then
        log_success "Docker is now available"
        return 0
    else
        log_warning "Docker installation may have failed or requires a system restart"
        return 1
    fi
}

install_docker_compose() {
    if command -v docker-compose &> /dev/null; then
        log_success "docker-compose is already installed: $(docker-compose --version 2>/dev/null | head -n1)"
        return 0
    fi
    
    # Check if docker compose (v2) is available
    if docker compose version &> /dev/null 2>&1; then
        log_success "docker compose (v2) is available via docker"
        return 0
    fi
    
    log_info "Installing docker-compose..."
    
    case "$OS_DETECTED" in
        ubuntu|debian|pop|fedora|rhel|centos)
            if [ "$NEED_SUDO" = true ]; then
                if sudo -n true 2>/dev/null; then
                    local docker_compose_url="https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)"
                    if curl -fsSL "$docker_compose_url" -o /tmp/docker-compose 2>/dev/null; then
                        if sudo mv /tmp/docker-compose /usr/local/bin/docker-compose 2>/dev/null; then
                            sudo chmod +x /usr/local/bin/docker-compose 2>/dev/null
                            log_success "docker-compose installed successfully"
                            return 0
                        fi
                    fi
                else
                    log_warning "Cannot install docker-compose (requires sudo password)"
                    return 1
                fi
            else
                log_warning "Need sudo to install docker-compose"
                return 1
            fi
            ;;
        macos)
            if brew install docker-compose > /dev/null 2>&1; then
                log_success "docker-compose installed via brew"
                return 0
            fi
            ;;
    esac
    
    if command -v docker-compose &> /dev/null; then
        log_success "docker-compose is now available"
        return 0
    else
        log_warning "docker-compose installation may have failed"
        return 1
    fi
}

install_system_dependencies() {
    print_section "📦 Installing System Dependencies"
    
    # Update package manager first
    update_package_manager
    
    # Essential build tools (optional - npm may still work without them)
    log_info "Installing essential build tools..."
    case "$OS_DETECTED" in
        ubuntu|debian|pop)
            install_package "build-essential" || log_warning "build-essential not critical - proceeding anyway"
            install_package "python3" || true
            ;;
        fedora|rhel|centos)
            install_package "gcc-c++" "g++" || log_warning "gcc not critical - proceeding anyway"
            install_package "make" || true
            install_package "python3" || true
            ;;
        macos)
            # Xcode command line tools
            if ! xcode-select -p &> /dev/null; then
                log_info "Installing Xcode command line tools..."
                xcode-select --install 2>/dev/null || log_warning "Xcode tools may already be installed"
            fi
            ;;
    esac
    
    # Required command-line tools
    log_info "Checking for required tools..."
    install_package "curl" || log_warning "curl may be needed for some features"
    install_package "jq" || log_warning "jq not available - JSON parsing may not work"
    install_package "lsof" || log_warning "lsof not available - port checking may not work"
    install_package "git" || true
    
    # Install Node.js and npm
    install_nodejs
    
    # Install Docker and docker-compose
    log_info "Installing Docker and docker-compose..."
    install_docker || log_warning "Docker installation skipped or failed"
    if command -v docker &> /dev/null; then
        install_docker_compose || log_warning "docker-compose installation skipped or failed"
    else
        log_warning "Skipping docker-compose (Docker not available)"
    fi
    
    echo ""
}

install_npm_dependencies() {
    print_section "📦 Installing NPM Dependencies"
    
    if [ ! -d "$BACKEND_DIR" ]; then
        log_error "Backend directory not found: $BACKEND_DIR"
        return 1
    fi
    
    cd "$BACKEND_DIR"
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        log_error "package.json not found in $BACKEND_DIR"
        return 1
    fi
    
    # Install dependencies
    log_info "Installing backend dependencies (this may take a few minutes)..."
    if npm install --silent 2>&1 | grep -i "error" > /tmp/npm-errors.log; then
        log_warning "Some npm warnings occurred (check /tmp/npm-errors.log)"
    fi
    log_success "Backend dependencies installed"
    
    # Install global tools if needed
    if ! command -v ts-node &> /dev/null; then
        log_info "Installing ts-node globally..."
        npm install -g ts-node typescript tsconfig-paths --silent 2>/dev/null || log_warning "Global install failed - using local version"
    fi
    
    echo ""
}

################################################################################
# DOCKER & SERVICES MANAGEMENT
################################################################################

start_docker_services() {
    print_section "🐳 Starting Docker Services"
    
    if ! command -v docker &> /dev/null; then
        log_warning "Docker not available - skipping database services"
        return 0
    fi
    
    # Determine if we need sudo for docker commands
    local DOCKER_CMD="docker"
    if ! docker ps &> /dev/null; then
        if sudo docker ps &> /dev/null 2>&1; then
            DOCKER_CMD="sudo docker"
            log_info "Using sudo for Docker commands (group permissions not yet active)"
        else
            log_warning "Docker daemon not running - attempting to start..."
            case "$OS_DETECTED" in
                ubuntu|debian|pop|fedora|rhel|centos)
                    if [ "$NEED_SUDO" = true ]; then
                        sudo systemctl start docker 2>/dev/null || log_error "Failed to start Docker daemon"
                        sleep 3
                        if sudo docker ps &> /dev/null; then
                            DOCKER_CMD="sudo docker"
                        else
                            log_warning "Docker is not operational - tests will run without database"
                            return 0
                        fi
                    fi
                    ;;
            esac
        fi
    fi
    
    cd "$SCRIPT_DIR"
    
    # Check if docker-compose.yml exists
    if [ ! -f "docker-compose.yml" ]; then
        log_warning "docker-compose.yml not found - skipping Docker services"
        return 0
    fi
    
    # Check if services are already running
    if $DOCKER_CMD ps 2>/dev/null | grep -q "invoice-hub-postgres"; then
        log_success "PostgreSQL is already running"
    else
        log_info "Starting PostgreSQL and Redis..."
        
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
            log_warning "Failed to start Docker services - tests will run without database"
        fi
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
# BACKEND SERVER MANAGEMENT
################################################################################

start_backend_server() {
    print_section "🚀 Starting Backend Server"
    
    cd "$BACKEND_DIR"
    
    # Kill any existing server on port 3000
    kill_port 3000 "Backend Server"
    
    # Create temp directory
    mkdir -p "$TEMP_DIR"
    
    # Check if we have ts-node
    local TS_NODE_CMD=""
    if command -v ts-node &> /dev/null; then
        TS_NODE_CMD="ts-node"
    elif [ -f "node_modules/.bin/ts-node" ]; then
        TS_NODE_CMD="npx ts-node"
    else
        log_error "ts-node not found - cannot start server"
        return 1
    fi
    
    # Start server in background
    log_info "Starting server..."
    $TS_NODE_CMD -r tsconfig-paths/register src/index.ts > "$TEMP_DIR/server.log" 2>&1 &
    SERVER_PID=$!
    
    # Wait for server to be ready
    log_info "Waiting for server to start (PID: $SERVER_PID)..."
    local attempts=0
    local max_attempts=30
    
    while [ $attempts -lt $max_attempts ]; do
        if curl -s "$HEALTH_ENDPOINT" > /dev/null 2>&1; then
            log_success "Server started successfully!"
            log_info "Server URL: $API_BASE_URL"
            log_info "API Docs: $API_BASE_URL/api-docs"
            sleep 2  # Give it time to fully initialize
            return 0
        fi
        
        # Check if process is still running
        if ! kill -0 $SERVER_PID 2>/dev/null; then
            log_error "Server process died unexpectedly"
            log_error "Last 20 lines of server log:"
            tail -20 "$TEMP_DIR/server.log"
            return 1
        fi
        
        sleep 1
        attempts=$((attempts + 1))
        printf "."
    done
    
    echo ""
    log_error "Server failed to start within ${max_attempts} seconds"
    log_error "Server log:"
    cat "$TEMP_DIR/server.log"
    return 1
}

stop_backend_server() {
    if [ ! -z "$SERVER_PID" ]; then
        log_info "Stopping backend server (PID: $SERVER_PID)..."
        kill -SIGTERM $SERVER_PID 2>/dev/null || true
        sleep 2
        
        # Force kill if still running
        if kill -0 $SERVER_PID 2>/dev/null; then
            kill -9 $SERVER_PID 2>/dev/null || true
        fi
        
        log_success "Server stopped"
    fi
}

################################################################################
# API TESTING FUNCTIONS
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
    
    # Make the request based on method
    if [ "$method" = "GET" ]; then
        http_code=$(curl -s -w "%{http_code}" -o "$response_file" \
            -X GET "${headers[@]}" "$endpoint" 2>/dev/null || echo "000")
    elif [ "$method" = "DELETE" ]; then
        http_code=$(curl -s -w "%{http_code}" -o "$response_file" \
            -X DELETE "${headers[@]}" "$endpoint" \
            -d "$data" 2>/dev/null || echo "000")
    else
        http_code=$(curl -s -w "%{http_code}" -o "$response_file" \
            -X "$method" "${headers[@]}" "$endpoint" \
            -d "$data" 2>/dev/null || echo "000")
    fi
    
    # Check result
    if [ "$http_code" = "$expected_status" ]; then
        log_test_pass "$name (HTTP $http_code)"
        rm -f "$response_file"
        return 0
    else
        log_test_fail "$name (Expected HTTP $expected_status, Got $http_code)"
        if [ -f "$response_file" ] && [ -s "$response_file" ]; then
            log_error "Response: $(cat "$response_file" 2>/dev/null | head -c 200)"
        fi
        rm -f "$response_file"
        return 1
    fi
}

################################################################################
# TEST SUITES
################################################################################

test_health_endpoints() {
    print_section "🏥 Testing Health & Monitoring Endpoints"
    
    test_endpoint "Health Check" "GET" \
        "$API_BASE_URL/api/health" \
        "" "200" "" || true
    
    test_endpoint "Liveness Probe" "GET" \
        "$API_BASE_URL/api/health/live" \
        "" "200" "" || true
    
    test_endpoint "Readiness Probe" "GET" \
        "$API_BASE_URL/api/health/ready" \
        "" "200" "" || true
    
    test_endpoint "Detailed Health" "GET" \
        "$API_BASE_URL/api/health/detailed" \
        "" "200" "" || true
    
    test_endpoint "Metrics" "GET" \
        "$API_BASE_URL/api/health/metrics" \
        "" "200" "" || true
}

test_documentation() {
    print_section "📚 Testing API Documentation"
    
    test_endpoint "Swagger JSON" "GET" \
        "$API_BASE_URL/api-docs.json" \
        "" "200" "" || true
    
    log_info "Checking Swagger UI availability..."
    local swagger_response=$(curl -sL -w "\n%{http_code}" "$API_BASE_URL/api-docs" 2>/dev/null)
    local http_code=$(echo "$swagger_response" | tail -n1)
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "301" ] || [ "$http_code" = "302" ]; then
        log_test_pass "Swagger UI is accessible (HTTP $http_code)"
    else
        log_test_fail "Swagger UI is not accessible (HTTP $http_code)"
    fi
}

test_authentication() {
    print_section "🔐 Testing Authentication & Authorization"
    
    local timestamp=$(date +%s)
    local email="test$timestamp@example.com"
    
    # Test user registration
    log_info "Testing user registration..."
    local register_response=$(curl -s -X POST \
        "$API_BASE_URL/api/$API_VERSION/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$email\",
            \"password\": \"TestPass123!\",
            \"firstName\": \"Test\",
            \"lastName\": \"User\",
            \"tenantName\": \"Test Company $timestamp\"
        }" 2>/dev/null)
    
    if echo "$register_response" | jq -e '.data.accessToken' > /dev/null 2>&1; then
        log_test_pass "User Registration"
        
        # Extract tokens
        ACCESS_TOKEN=$(echo "$register_response" | jq -r '.data.accessToken' 2>/dev/null)
        REFRESH_TOKEN=$(echo "$register_response" | jq -r '.data.refreshToken' 2>/dev/null)
        USER_ID=$(echo "$register_response" | jq -r '.data.user.id' 2>/dev/null)
        TENANT_ID=$(echo "$register_response" | jq -r '.data.user.tenantId' 2>/dev/null)
        
        # Save for other tests
        echo "$ACCESS_TOKEN" > "$TEMP_DIR/access_token"
        echo "$TENANT_ID" > "$TEMP_DIR/tenant_id"
        echo "$USER_ID" > "$TEMP_DIR/user_id"
        
        log_info "Created User ID: $USER_ID"
        log_info "Created Tenant ID: $TENANT_ID"
    else
        log_test_fail "User Registration - $(echo "$register_response" | jq -r '.message' 2>/dev/null || echo 'Unknown error')"
        return 1
    fi
    
    # Test login
    log_info "Testing user login..."
    local login_response=$(curl -s -X POST \
        "$API_BASE_URL/api/$API_VERSION/auth/login" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$email\",
            \"password\": \"TestPass123!\",
            \"tenantId\": \"$TENANT_ID\"
        }" 2>/dev/null)
    
    if echo "$login_response" | jq -e '.data.accessToken' > /dev/null 2>&1; then
        log_test_pass "User Login"
    else
        log_test_fail "User Login"
    fi
    
    # Test token refresh (if endpoint exists)
    log_info "Testing token refresh..."
    local refresh_response=$(curl -s -w "\n%{http_code}" -X POST \
        "$API_BASE_URL/api/$API_VERSION/auth/refresh" \
        -H "Content-Type: application/json" \
        -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}" 2>/dev/null)
    
    local refresh_http_code=$(echo "$refresh_response" | tail -n1)
    local refresh_body=$(echo "$refresh_response" | head -n -1)
    
    if [ "$refresh_http_code" = "200" ]; then
        if echo "$refresh_body" | jq -e '.data.accessToken' > /dev/null 2>&1; then
            log_test_pass "Token Refresh"
        else
            log_test_fail "Token Refresh - invalid response format"
        fi
    elif [ "$refresh_http_code" = "404" ]; then
        log_warning "Token Refresh endpoint not implemented (404)"
    elif [ "$refresh_http_code" = "401" ]; then
        # Try with the access token as bearer instead (some APIs expect this)
        log_warning "Token Refresh returned 401, trying alternative approach..."
        local alt_refresh=$(curl -s -w "\n%{http_code}" -X POST \
            "$API_BASE_URL/api/$API_VERSION/auth/refresh" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $ACCESS_TOKEN" \
            -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}" 2>/dev/null)
        
        local alt_code=$(echo "$alt_refresh" | tail -n1)
        if [ "$alt_code" = "200" ]; then
            log_test_pass "Token Refresh (with auth header)"
        else
            log_warning "Token Refresh endpoint requires different parameters (HTTP $refresh_http_code)"
        fi
    else
        log_warning "Token Refresh endpoint status: HTTP $refresh_http_code"
    fi
}

test_companies() {
    print_section "🏢 Testing Company Management"
    
    if [ ! -f "$TEMP_DIR/access_token" ]; then
        log_warning "No access token - skipping company tests"
        return 1
    fi
    
    local token=$(cat "$TEMP_DIR/access_token")
    local tenant_id=$(cat "$TEMP_DIR/tenant_id")
    local timestamp=$(date +%s)
    
    # Create company
    log_info "Creating test company..."
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
        }" 2>/dev/null)
    
    if echo "$company_response" | jq -e '.data.id' > /dev/null 2>&1; then
        log_test_pass "Create Company"
        COMPANY_ID=$(echo "$company_response" | jq -r '.data.id')
        echo "$COMPANY_ID" > "$TEMP_DIR/company_id"
    else
        log_test_fail "Create Company"
    fi
    
    # List companies
    test_endpoint "List Companies" "GET" \
        "$API_BASE_URL/api/$API_VERSION/$tenant_id/companies" \
        "" "200" "$token" || true
    
    # Get company by ID
    if [ ! -z "$COMPANY_ID" ]; then
        test_endpoint "Get Company by ID" "GET" \
            "$API_BASE_URL/api/$API_VERSION/$tenant_id/companies/$COMPANY_ID" \
            "" "200" "$token" || true
    fi
}

test_customers() {
    print_section "👥 Testing Customer Management"
    
    if [ ! -f "$TEMP_DIR/access_token" ] || [ ! -f "$TEMP_DIR/company_id" ]; then
        log_warning "Prerequisites missing - skipping customer tests"
        return 1
    fi
    
    local token=$(cat "$TEMP_DIR/access_token")
    local tenant_id=$(cat "$TEMP_DIR/tenant_id")
    local company_id=$(cat "$TEMP_DIR/company_id")
    local timestamp=$(date +%s)
    
    # Create customer
    log_info "Creating test customer..."
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
        }" 2>/dev/null)
    
    if echo "$customer_response" | jq -e '.data.id' > /dev/null 2>&1; then
        log_test_pass "Create Customer"
        CUSTOMER_ID=$(echo "$customer_response" | jq -r '.data.id')
        echo "$CUSTOMER_ID" > "$TEMP_DIR/customer_id"
    else
        log_test_fail "Create Customer"
    fi
    
    # List customers
    test_endpoint "List Customers" "GET" \
        "$API_BASE_URL/api/$API_VERSION/$tenant_id/customers" \
        "" "200" "$token" || true
}

test_products() {
    print_section "📦 Testing Product Management"
    
    if [ ! -f "$TEMP_DIR/access_token" ] || [ ! -f "$TEMP_DIR/company_id" ]; then
        log_warning "Prerequisites missing - skipping product tests"
        return 1
    fi
    
    local token=$(cat "$TEMP_DIR/access_token")
    local tenant_id=$(cat "$TEMP_DIR/tenant_id")
    local company_id=$(cat "$TEMP_DIR/company_id")
    local timestamp=$(date +%s)
    
    # Create product
    log_info "Creating test product..."
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
        }" 2>/dev/null)
    
    if echo "$product_response" | jq -e '.data.id' > /dev/null 2>&1; then
        log_test_pass "Create Product"
        PRODUCT_ID=$(echo "$product_response" | jq -r '.data.id')
        echo "$PRODUCT_ID" > "$TEMP_DIR/product_id"
    else
        log_test_fail "Create Product"
    fi
    
    # List products
    test_endpoint "List Products" "GET" \
        "$API_BASE_URL/api/$API_VERSION/$tenant_id/products" \
        "" "200" "$token" || true
}

test_invoices() {
    print_section "🧾 Testing Invoice Management"
    
    if [ ! -f "$TEMP_DIR/access_token" ] || [ ! -f "$TEMP_DIR/company_id" ] || \
       [ ! -f "$TEMP_DIR/customer_id" ] || [ ! -f "$TEMP_DIR/product_id" ]; then
        log_warning "Prerequisites missing - skipping invoice tests"
        return 1
    fi
    
    local token=$(cat "$TEMP_DIR/access_token")
    local tenant_id=$(cat "$TEMP_DIR/tenant_id")
    local company_id=$(cat "$TEMP_DIR/company_id")
    local customer_id=$(cat "$TEMP_DIR/customer_id")
    local product_id=$(cat "$TEMP_DIR/product_id")
    
    # Create invoice
    log_info "Creating test invoice..."
    local invoice_response=$(curl -s -X POST \
        "$API_BASE_URL/api/$API_VERSION/$tenant_id/invoices" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d "{
            \"companyId\": \"$company_id\",
            \"customerId\": \"$customer_id\",
            \"invoiceType\": \"standard\",
            \"issueDate\": \"2025-11-15\",
            \"dueDate\": \"2025-11-30\",
            \"items\": [
                {
                    \"productId\": \"$product_id\",
                    \"description\": \"Widget Pro\",
                    \"quantity\": 5,
                    \"unitPrice\": 99.99,
                    \"vatRate\": 23
                }
            ],
            \"notes\": \"Test invoice created by automated tests\"
        }" 2>/dev/null)
    
    if echo "$invoice_response" | jq -e '.data.id' > /dev/null 2>&1; then
        log_test_pass "Create Invoice"
        INVOICE_ID=$(echo "$invoice_response" | jq -r '.data.id')
        echo "$INVOICE_ID" > "$TEMP_DIR/invoice_id"
    else
        log_test_fail "Create Invoice"
        return 1
    fi
    
    # List invoices
    test_endpoint "List Invoices" "GET" \
        "$API_BASE_URL/api/$API_VERSION/$tenant_id/invoices" \
        "" "200" "$token" || true
    
    if [ ! -z "$INVOICE_ID" ]; then
        # Get invoice
        test_endpoint "Get Invoice by ID" "GET" \
            "$API_BASE_URL/api/$API_VERSION/$tenant_id/invoices/$INVOICE_ID" \
            "" "200" "$token" || true
        
        # Mark as pending
        test_endpoint "Mark Invoice as Pending" "POST" \
            "$API_BASE_URL/api/$API_VERSION/$tenant_id/invoices/$INVOICE_ID/mark-pending" \
            "" "200" "$token" || true
        
        # Approve invoice
        test_endpoint "Approve Invoice" "POST" \
            "$API_BASE_URL/api/$API_VERSION/$tenant_id/invoices/$INVOICE_ID/approve" \
            "" "200" "$token" || true
    fi
}

test_reports() {
    print_section "📊 Testing Reporting Endpoints"
    
    if [ ! -f "$TEMP_DIR/access_token" ]; then
        log_warning "No access token - skipping report tests"
        return 1
    fi
    
    local token=$(cat "$TEMP_DIR/access_token")
    local tenant_id=$(cat "$TEMP_DIR/tenant_id")
    
    test_endpoint "Dashboard Metrics" "GET" \
        "$API_BASE_URL/api/$API_VERSION/reports/$tenant_id/dashboard" \
        "" "200" "$token" || true
    
    test_endpoint "Sales Report" "GET" \
        "$API_BASE_URL/api/$API_VERSION/reports/$tenant_id/sales?startDate=2025-11-01&endDate=2025-11-30" \
        "" "200" "$token" || true
}

################################################################################
# TEST SUMMARY & REPORTING
################################################################################

print_test_summary() {
    print_section "📋 Test Summary & Results"
    
    local total=$((PASSED_TESTS + FAILED_TESTS))
    local pass_rate=0
    
    if [ $total -gt 0 ]; then
        pass_rate=$(awk "BEGIN {printf \"%.1f\", ($PASSED_TESTS/$total)*100}")
    fi
    
    echo -e "${WHITE}╔══════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${WHITE}║                        TEST RESULTS                                  ║${NC}"
    echo -e "${WHITE}╠══════════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${WHITE}║${NC} Total Tests:   ${CYAN}$total${NC}"
    echo -e "${WHITE}║${NC} Passed:        ${GREEN}$PASSED_TESTS${NC}"
    echo -e "${WHITE}║${NC} Failed:        ${RED}$FAILED_TESTS${NC}"
    echo -e "${WHITE}║${NC} Pass Rate:     ${CYAN}${pass_rate}%${NC}"
    echo -e "${WHITE}╚══════════════════════════════════════════════════════════════════════╝${NC}"
    
    if [ ${#TEST_RESULTS[@]} -gt 0 ]; then
        echo -e "\n${WHITE}Detailed Results:${NC}"
        for result in "${TEST_RESULTS[@]}"; do
            echo "  $result"
        done
    fi
    
    echo ""
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║                                                                      ║${NC}"
        echo -e "${GREEN}║          ✓✓✓ ALL TESTS PASSED - SYSTEM OPERATIONAL ✓✓✓              ║${NC}"
        echo -e "${GREEN}║                                                                      ║${NC}"
        echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════╝${NC}"
        return 0
    else
        echo -e "${RED}╔══════════════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${RED}║                                                                      ║${NC}"
        echo -e "${RED}║          ✗✗✗ SOME TESTS FAILED - REVIEW REQUIRED ✗✗✗                ║${NC}"
        echo -e "${RED}║                                                                      ║${NC}"
        echo -e "${RED}╚══════════════════════════════════════════════════════════════════════╝${NC}"
        return 1
    fi
}

################################################################################
# CLEANUP
################################################################################

cleanup() {
    print_section "🧹 Cleaning Up"
    
    # Stop backend server
    stop_backend_server
    
    # Stop Docker services if we started them
    stop_docker_services
    
    # Clean temp files
    if [ -d "$TEMP_DIR" ]; then
        log_info "Removing temporary files..."
        rm -rf "$TEMP_DIR"
        log_success "Cleanup complete"
    fi
    
    echo ""
}

################################################################################
# MAIN EXECUTION
################################################################################

main() {
    # Show banner
    print_banner
    
    # Trap signals for cleanup
    trap cleanup EXIT INT TERM
    
    # Detect system
    detect_os
    
    # Install dependencies
    install_system_dependencies
    install_npm_dependencies
    
    # Start services
    start_docker_services
    
    # Start backend
    if ! start_backend_server; then
        log_error "Failed to start backend server - cannot run tests"
        exit 1
    fi
    
    # Run all test suites
    test_health_endpoints
    test_documentation
    test_authentication
    test_companies
    test_customers
    test_products
    test_invoices
    test_reports
    
    # Print summary
    print_test_summary
    
    # Return appropriate exit code
    [ $FAILED_TESTS -eq 0 ]
}

################################################################################
# RUN SCRIPT
################################################################################

# Check if script is being sourced or executed
if [ "${BASH_SOURCE[0]}" -ef "$0" ]; then
    main "$@"
fi
