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

# Script configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly BACKEND_DIR="$SCRIPT_DIR/backend"
readonly ADMIN_DIR="$SCRIPT_DIR/frontend-admin"
readonly USER_DIR="$SCRIPT_DIR/frontend-user"
readonly LOG_DIR="$SCRIPT_DIR/.run-logs"

# Default Ports (can be overridden by environment variables)
export BACKEND_PORT="${BACKEND_PORT:-3000}"
export ADMIN_PORT="${ADMIN_PORT:-5174}"
export USER_PORT="${USER_PORT:-5173}"
export POSTGRES_PORT="${POSTGRES_PORT:-5432}"
export REDIS_PORT="${REDIS_PORT:-6379}"

# Server URLs
readonly BACKEND_URL="http://localhost:$BACKEND_PORT"
readonly ADMIN_URL="http://localhost:$ADMIN_PORT"
readonly USER_URL="http://localhost:$USER_PORT"
readonly API_DOCS_URL="$BACKEND_URL/api-docs"

# Process tracking
declare -a RUNNING_PIDS=()
declare -a SERVICE_NAMES=()
declare -A SERVICE_PIDS_MAP
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

prompt_yes_no() {
    local question="${1:-Proceed?}"
    local default=${2:-}
    if [ -n "$AUTO_INSTALL" ] && [ "$AUTO_INSTALL" = "true" ]; then
        return 0
    fi
    if [ "$TERM" = "dumb" ] || ! tty -s; then
        return 1
    fi
    while true; do
        read -p "$question [y/N]: " yn
        case "$yn" in
            [Yy]*) return 0;;
            [Nn]*) return 1;;
            "")
                if [ "$default" = "y" ]; then
                    return 0
                else
                    return 1
                fi
                ;;
        esac
    done
}

install_nvm_and_node() {
    log_info "Installing nvm and Node.js LTS..."
    if command -v curl &> /dev/null; then
        curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.6/install.sh | bash || true
        export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
        [ -s "$NVM_DIR/nvm.sh" ] && \ . "$NVM_DIR/nvm.sh"
        nvm install --lts || return 1
        nvm use --lts || true
        log_success "Installed Node.js $(node --version) and npm $(npm --version) via nvm"
        return 0
    else
        log_error "curl not found - cannot bootstrap nvm. Please install curl or use system package manager."
        return 1
    fi
}

install_node_system_apt() {
    log_info "Installing Node.js via NodeSource (apt)..."
    if [ "$NEED_SUDO" = true ]; then
        sudo bash -c 'curl -fsSL https://deb.nodesource.com/setup_20.x | bash -'
        sudo apt-get install -y nodejs
    else
        bash -c 'curl -fsSL https://deb.nodesource.com/setup_20.x | bash -'
        apt-get install -y nodejs || return 1
    fi
    log_success "Installed Node.js $(node --version)"
}

install_node_system_yum() {
    log_info "Installing Node.js via NodeSource (yum/rpm)..."
    if [ "$NEED_SUDO" = true ]; then
        sudo bash -c 'curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -'
        sudo yum install -y nodejs
    else
        bash -c 'curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -'
        yum install -y nodejs || return 1
    fi
    log_success "Installed Node.js $(node --version)"
}

install_docker_apt() {
    log_info "Installing Docker (apt)..."
    if [ "$NEED_SUDO" = true ]; then
        sudo apt-get update
        sudo apt-get install -y ca-certificates curl gnupg lsb-release
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

        if [ -f /etc/apt/sources.list.d/docker.list ]; then
            if sudo grep -q '^"' /etc/apt/sources.list.d/docker.list 2>/dev/null; then
                log_info "Fixing malformed /etc/apt/sources.list.d/docker.list"
                sudo sed -i 's/^"//' /etc/apt/sources.list.d/docker.list || true
                sudo sed -i 's/"$//' /etc/apt/sources.list.d/docker.list || true
            fi
        fi
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
        sudo apt-get update
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    else
        apt-get update
        apt-get install -y ca-certificates curl gnupg lsb-release || return 1
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        if [ -f /etc/apt/sources.list.d/docker.list ]; then
            if grep -q '^"' /etc/apt/sources.list.d/docker.list 2>/dev/null; then
                log_info "Fixing malformed /etc/apt/sources.list.d/docker.list"
                sed -i 's/^"//' /etc/apt/sources.list.d/docker.list || true
                sed -i 's/"$//' /etc/apt/sources.list.d/docker.list || true
            fi
        fi
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list >/dev/null
        apt-get update
        apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin || return 1
    fi
    log_success "Docker installed"
}

install_docker_yum() {
    log_info "Installing Docker (yum)..."
    if [ "$NEED_SUDO" = true ]; then
        sudo yum install -y yum-utils
        sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
        sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
        sudo systemctl enable --now docker
    else
        yum install -y yum-utils || return 1
        yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo || return 1
        yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin || return 1
        systemctl enable --now docker || true
    fi
    log_success "Docker installed"
}

install_package() {
    local pkg="$1"
    case "$OS_DETECTED" in
        ubuntu|debian|pop)
            if [ "$NEED_SUDO" = true ]; then
                sudo apt-get update
                sudo apt-get install -y "$pkg"
            else
                apt-get update
                apt-get install -y "$pkg"
            fi
            ;;
        fedora|centos|rhel)
            if [ "$NEED_SUDO" = true ]; then
                sudo yum install -y "$pkg"
            else
                yum install -y "$pkg"
            fi
            ;;
        macos)
            if command -v brew &> /dev/null; then
                brew install "$pkg"
            else
                log_warning "Homebrew not found. Please install $pkg manually on macOS."
            fi
            ;;
        *)
            log_warning "Unsupported OS: $OS_DETECTED - please install $pkg manually"
            ;;
    esac
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

check_env_files() {
    print_section "🔒 Checking Environment Configuration"
    local missing_env=false

    # Check Backend .env
    if [ ! -f "$BACKEND_DIR/.env" ]; then
        if [ -f "$BACKEND_DIR/.env.example" ]; then
            log_warning "Backend .env missing. Creating from .env.example..."
            cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
            log_success "Created backend .env"
        else
            log_error "Backend .env missing and no .env.example found!"
            missing_env=true
        fi
    else
        log_success "Backend configuration found"
    fi

    # Check Frontend Admin .env
    if [ ! -f "$ADMIN_DIR/.env" ]; then
        if [ -f "$ADMIN_DIR/.env.example" ]; then
             log_warning "Admin Frontend .env missing. Creating from .env.example..."
             cp "$ADMIN_DIR/.env.example" "$ADMIN_DIR/.env"
             log_success "Created Admin .env"
        fi
    fi

    echo ""
}

check_and_install_dependencies() {
    print_section "📦 Checking Dependencies"

    local missing_deps=false
    local missing_list=()

    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_warning "Node.js not found"
        missing_deps=true
        missing_list+=("node")
    else
        log_success "Node.js $(node --version) installed"
    fi

    # Check npm
    if ! command -v npm &> /dev/null; then
        log_warning "npm not found"
        missing_deps=true
        missing_list+=("npm")
    else
        log_success "npm $(npm --version) installed"
    fi

    # Check curl
    if ! command -v curl &> /dev/null; then
        log_warning "curl not found - may need for health checks"
        missing_list+=("curl")
    else
        log_success "curl installed"
    fi

    # Check lsof
    if ! command -v lsof &> /dev/null; then
        log_warning "lsof not found - port checking may not work"
        missing_list+=("lsof")
    else
        log_success "lsof installed"
    fi

    # Check docker / docker-compose optionally
    if ! command -v docker &> /dev/null; then
        log_warning "Docker not found - Docker services will not be available until Docker is installed"
        missing_list+=("docker")
    fi
    if ! command -v docker-compose &> /dev/null; then
        # modern docker compose is included with `docker compose`; we check for either
        if ! docker compose version &> /dev/null 2>&1; then
            log_warning "docker-compose not found - Docker Compose functionality will be limited"
            missing_list+=("docker-compose")
        fi
    fi

    if [ ${#missing_list[@]} -ne 0 ]; then
        log_error "Missing required components: ${missing_list[*]}"
        # Offer to auto-install
        if prompt_yes_no "Attempt to install missing dependencies automatically?" "y"; then
            for pkg in "${missing_list[@]}"; do
                case "$pkg" in
                    node|npm)
                        # Try nvm first
                        if install_nvm_and_node; then
                            continue
                        fi
                        # Fallback to system installer
                        case "$OS_DETECTED" in
                            ubuntu|debian|pop)
                                install_node_system_apt || true
                                ;;
                            fedora|centos|rhel)
                                install_node_system_yum || true
                                ;;
                            macos)
                                log_warning "Please install Node.js on macOS via Homebrew or installer"
                                ;;
                            *)
                                log_warning "Unsupported OS: $OS_DETECTED for system install of Node.js"
                                ;;
                        esac
                        ;;
                    docker)
                        case "$OS_DETECTED" in
                            ubuntu|debian|pop)
                                install_docker_apt || true
                                ;;
                            fedora|centos|rhel)
                                install_docker_yum || true
                                ;;
                            macos)
                                log_warning "Please install Docker Desktop for macOS from https://www.docker.com/products/docker-desktop"
                                ;;
                            *)
                                log_warning "Unsupported OS: $OS_DETECTED for Docker install"
                                ;;
                        esac
                        ;;
                    docker-compose)
                        log_info "Attempting to install docker-compose (plugin or binary)..."
                        case "$OS_DETECTED" in
                            ubuntu|debian|pop)
                                if [ "$NEED_SUDO" = true ]; then
                                    sudo apt-get install -y docker-compose-plugin || true
                                else
                                    apt-get install -y docker-compose-plugin || true
                                fi
                                ;;
                            fedora|centos|rhel)
                                if [ "$NEED_SUDO" = true ]; then
                                    sudo yum install -y docker-compose-plugin || true
                                else
                                    yum install -y docker-compose-plugin || true
                                fi
                                ;;
                            macos)
                                log_warning "Install Docker Desktop on macOS which includes Compose"
                                ;;
                            *)
                                log_warning "Unsupported OS: $OS_DETECTED for docker-compose install"
                                ;;
                        esac
                        ;;
                    curl|lsof)
                        install_package "$pkg" || true
                        ;;
                    *)
                        log_warning "Don't know how to auto-install $pkg; please install it manually"
                        ;;
                esac
            done

            # Re-run checks for node/npm
            if command -v node &> /dev/null && command -v npm &> /dev/null; then
                log_success "Node and npm are now installed"
                missing_deps=false
            else
                log_error "Automatic installation couldn't install Node/npm. Aborting."
                return 1
            fi
        else
            log_error "Cannot continue without required dependencies. Run script again after installing them."
            return 1
        fi
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
    SERVICE_PIDS_MAP[$pid]="$name"

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
    ensure_port_free "$BACKEND_PORT" "Backend"

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
        "PORT=$BACKEND_PORT npm run dev" \
        "$LOG_DIR/backend.log" \
        "http://localhost:$BACKEND_PORT/api/health"

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
    ensure_port_free "$ADMIN_PORT" "Admin Frontend"

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
        "PORT=$ADMIN_PORT npm run dev" \
        "$LOG_DIR/admin-frontend.log" \
        "http://localhost:$ADMIN_PORT"

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
    ensure_port_free "$USER_PORT" "User Frontend"

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
        "PORT=$USER_PORT npm run dev" \
        "$LOG_DIR/user-frontend.log" \
        "http://localhost:$USER_PORT"

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

monitor_services() {
    log_info "Monitoring services... (Press Ctrl+C to stop)"
    echo ""
    while true; do
        local all_running=true
        for pid in "${RUNNING_PIDS[@]}"; do
            if ! kill -0 "$pid" 2>/dev/null; then
                log_error "Service ${SERVICE_PIDS_MAP[$pid]} (PID $pid) has stopped unexpectedly!"
                all_running=false
            fi
        done

        if [ "$all_running" = false ]; then
            log_error "One or more services failed. Shutting down..."
            exit 1
        fi

        sleep 5
    done
}

################################################################################
# CLEANUP & SHUTDOWN
################################################################################

shutdown_services() {
    print_section "🛑 Shutting Down Services"

    # Kill all running processes
    for pid in "${RUNNING_PIDS[@]}"; do
        if kill -0 $pid 2>/dev/null; then
            log_info "Stopping process $pid (${SERVICE_PIDS_MAP[$pid]})..."
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

    # Check Environment Files
    check_env_files

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

    # Monitor services loop
    monitor_services
}

################################################################################
# HANDLE ARGUMENTS
################################################################################

case "${1:-}" in
    "--auto"|"-y"|"--yes")
        AUTO_INSTALL=true
        shift
        main "$@"
        ;;
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
        echo "  ${GREEN}--auto${NC}           - Auto-install missing dependencies and start"
        echo ""
        echo "Environment Variables:"
        echo "  PORT configuration:"
        echo "    BACKEND_PORT (default: 3000)"
        echo "    ADMIN_PORT (default: 5174)"
        echo "    USER_PORT (default: 5173)"
        echo ""
        echo "Examples:"
        echo "  $0                      # Start all services"
        echo "  BACKEND_PORT=3001 $0    # Start with custom backend port"
        echo "  $0 health               # Check service health"
        echo ""
        echo "URLs:"
        echo "  - Backend API:       ${BLUE}http://localhost:$BACKEND_PORT${NC}"
        echo "  - API Docs:          ${BLUE}http://localhost:$BACKEND_PORT/api-docs${NC}"
        echo "  - Admin Dashboard:   ${BLUE}http://localhost:$ADMIN_PORT${NC}"
        echo "  - User Application:  ${BLUE}http://localhost:$USER_PORT${NC}"
        echo ""
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
        
esac
