# Invoice-HUB Master Test Script

## 🚀 Quick Start

Run the comprehensive test suite with a single command:

```bash
./run-tests.sh
```

That's it! The script will automatically:
- ✅ Detect your operating system
- ✅ Install all missing system dependencies
- ✅ Install Node.js and npm if needed
- ✅ Install Docker and docker-compose if needed
- ✅ Install all backend npm packages
- ✅ Start PostgreSQL and Redis via Docker
- ✅ Start the backend server
- ✅ Run comprehensive API tests
- ✅ Generate a detailed test report
- ✅ Clean up everything when done

## 📋 Features

### Universal Compatibility
- **Linux**: Ubuntu, Debian, Fedora, RHEL, CentOS, Pop!_OS
- **macOS**: Full support with Homebrew
- **Auto-detection**: Automatically detects your OS and package manager

### Auto-Installation
Automatically installs missing components:
- `curl` - HTTP client for API testing
- `jq` - JSON processor for response parsing
- `lsof` - Port checking utility
- `git` - Version control
- `Node.js` and `npm` - JavaScript runtime
- `Docker` and `docker-compose` - Container platform
- `ts-node` and `typescript` - TypeScript execution
- All backend npm dependencies

### Comprehensive Testing
Tests all major API endpoints:
- 🏥 Health & monitoring endpoints
- 📚 API documentation (Swagger)
- 🔐 Authentication & authorization
- 🏢 Company management
- 👥 Customer management
- 📦 Product management
- 🧾 Invoice management
- 📊 Reporting endpoints

### Error Handling
- Graceful fallbacks if Docker is unavailable
- Detailed error messages and logs
- Automatic cleanup on exit or interrupt
- Process management (auto-kill existing servers)

### Beautiful Output
- Color-coded output for easy reading
- Progress indicators
- Detailed test results with pass/fail status
- Summary statistics with pass rate

## 🛠️ Requirements

### Minimum Requirements
- Linux or macOS operating system
- Internet connection (for downloading dependencies)
- ~500MB free disk space

### Optional
- `sudo` access (for installing system packages)
  - If you don't have sudo, the script will try to work without it
  - Some features may be limited without sudo

## 📖 Usage

### Basic Usage
```bash
# Run all tests with auto-setup
./run-tests.sh
```

### Manual Setup Only
If you want to just install dependencies without running tests, you can modify the script or install manually:

```bash
# Install system dependencies
sudo apt-get update
sudo apt-get install -y curl jq lsof git build-essential

# Install Node.js (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install backend dependencies
cd backend
npm install
```

### Run Backend Manually
```bash
cd backend
npx ts-node -r tsconfig-paths/register src/index.ts
```

## 🐳 Docker Services

The script automatically starts these Docker services:
- **PostgreSQL**: Database server (port 5432)
- **Redis**: Cache and session store (port 6379)

If Docker is not available, tests will run without database connectivity (some tests may fail).

To manually start Docker services:
```bash
docker-compose up -d postgres redis
```

To stop Docker services:
```bash
docker-compose down
```

## 📊 Test Output

### Success
```
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║          ✓✓✓ ALL TESTS PASSED - SYSTEM OPERATIONAL ✓✓✓              ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

### Failure
```
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║          ✗✗✗ SOME TESTS FAILED - REVIEW REQUIRED ✗✗✗                ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

## 🔍 Troubleshooting

### Script Won't Execute
```bash
# Make sure it's executable
chmod +x run-tests.sh
```

### Permission Denied (Docker)
```bash
# Add your user to docker group
sudo usermod -aG docker $USER
# Then logout and login again
```

### Port 3000 Already in Use
The script automatically kills any process on port 3000. If you get errors:
```bash
# Manually kill the process
lsof -ti:3000 | xargs kill -9
```

### Node.js Not Found After Installation
```bash
# Reload your shell
source ~/.bashrc  # or ~/.zshrc for zsh
```

### Docker Daemon Not Running
```bash
# Start Docker service (Ubuntu/Debian)
sudo systemctl start docker

# Enable Docker to start on boot
sudo systemctl enable docker
```

### NPM Install Fails
```bash
# Clear npm cache and try again
cd backend
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## 📁 File Locations

- **Script**: `/run-tests.sh`
- **Backend**: `/backend/`
- **Logs**: `/tmp/invoice-hub-tests-{PID}/server.log`
- **Test Data**: `/tmp/invoice-hub-tests-{PID}/`

## 🔧 Advanced Options

### Environment Variables
You can customize the script behavior:

```bash
# Use custom API URL
API_BASE_URL="http://localhost:4000" ./run-tests.sh

# Skip Docker services
SKIP_DOCKER=1 ./run-tests.sh
```

### Debug Mode
To see detailed execution:
```bash
bash -x run-tests.sh
```

## 📝 What Gets Deleted

The old scripts have been replaced:
- ❌ `backend/start-server.sh` (deleted)
- ❌ `backend/test-api.sh` (deleted)
- ❌ `backend/quick-test.sh` (deleted)
- ❌ `setup.sh` (deleted)

All functionality is now in:
- ✅ `run-tests.sh` (new master script)

## 🎯 Features Compared to Old Scripts

| Feature | Old Scripts | New Master Script |
|---------|-------------|-------------------|
| Auto-install dependencies | ❌ | ✅ |
| OS detection | ❌ | ✅ |
| Error handling | Basic | Comprehensive |
| Docker management | Manual | Automatic |
| Test coverage | Partial | Complete |
| Output formatting | Basic | Beautiful |
| Cleanup on error | ❌ | ✅ |
| Single command | ❌ | ✅ |

## 🆘 Support

If you encounter issues:
1. Check the server log: `/tmp/invoice-hub-tests-{PID}/server.log`
2. Verify Node.js version: `node --version` (should be v18+)
3. Check Docker status: `docker ps`
4. Review backend dependencies: `cd backend && npm list`

## 📜 License

Part of the Invoice-HUB project.
