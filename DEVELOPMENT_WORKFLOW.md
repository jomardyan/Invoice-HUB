# 🚀 Development Workflow Guide

Quick reference for running and developing the Invoice-HUB application.

## 📋 Table of Contents
- [Quick Start](#-quick-start)
- [VS Code Tasks](#-vs-code-tasks)
- [Port Configuration](#-port-configuration)
- [Debugging](#-debugging)
- [Development Scripts](#-development-scripts)

## 🏃 Quick Start

### Option 1: VS Code Tasks (Recommended)
Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) and type "Tasks: Run Task":

- **🌐 Start All Services** - Starts Docker, Backend, and both Frontends
- **🚀 Start Backend API** - Backend only (port 3000)
- **👥 Start Frontend User** - User frontend only (port 5173)
- **⚙️ Start Frontend Admin** - Admin frontend only (port 5174)
- **🧪 Run Tests** - Run the complete test suite

### Option 2: Manual Start
```bash
# Start Docker services (PostgreSQL + Redis)
docker compose up -d postgres redis

# Start Backend API (Terminal 1)
cd backend && npm run dev

# Start Frontend User (Terminal 2)
cd frontend-user && npm run dev

# Start Frontend Admin (Terminal 3)
cd frontend-admin && npm run dev
```

### Option 3: Automated Test Script
```bash
# Installs dependencies, starts services, runs tests
bash run-tests.sh
```

## 🎯 VS Code Tasks

All tasks are available via `Terminal > Run Task...` or `Ctrl+Shift+P > Tasks: Run Task`

### Server Tasks
| Task | Description | Port |
|------|-------------|------|
| 🚀 Start Backend API | Node.js/Express API server | 3000 |
| 👥 Start Frontend User | Vite dev server (User) | 5173 |
| ⚙️ Start Frontend Admin | Vite dev server (Admin) | 5174 |
| 🌐 Start All Services | All servers + Docker | Multiple |

### Docker Tasks
| Task | Description |
|------|-------------|
| 🐳 Start Docker Services | PostgreSQL + Redis |
| 🛑 Stop Docker Services | Stop all containers |

### Utility Tasks
| Task | Description |
|------|-------------|
| 🧪 Run Tests | Full integration test suite |
| 📦 Install All Dependencies | npm install for all projects |

## 🔌 Port Configuration

All ports are automatically labeled in VS Code:

| Port | Service | Auto-Forward | Label |
|------|---------|--------------|-------|
| 3000 | Backend API | Notify | Backend API |
| 5173 | Frontend User (Dev) | Open Browser | Frontend User |
| 5174 | Frontend Admin (Dev) | Open Browser | Frontend Admin |
| 4173 | Frontend User (Preview) | Notify | Frontend User (Preview) |
| 4174 | Frontend Admin (Preview) | Notify | Frontend Admin (Preview) |
| 5432 | PostgreSQL | Ignore | PostgreSQL |
| 6379 | Redis | Ignore | Redis |

Ports are configured in `.vscode/settings.json` under `remote.portsAttributes`.

## 🐛 Debugging

Launch configurations are available in the Debug panel (`Ctrl+Shift+D`):

### Available Configurations
- **🚀 Debug Backend (Node)** - Debug Node.js backend with breakpoints
- **👥 Debug Frontend User (Chrome)** - Debug React app in Chrome
- **⚙️ Debug Frontend Admin (Chrome)** - Debug Admin app in Chrome
- **🧪 Debug Tests** - Debug Jest tests
- **🌐 Debug Full Stack** - Debug backend + frontend simultaneously

### How to Debug
1. Set breakpoints in your code (click left margin in editor)
2. Press `F5` or click Debug icon
3. Select configuration from dropdown
4. Debugger will attach and pause at breakpoints

## 💻 Development Scripts

### Backend (Node.js/Express)
```bash
cd backend

npm run dev              # Start with hot reload
npm run build           # Build TypeScript
npm run test            # Run Jest tests
npm run test:watch      # Run tests in watch mode
npm run lint            # Run ESLint
```

### Frontend User (React + Vite)
```bash
cd frontend-user

npm run dev                 # Start dev server (port 5173)
npm run dev:network        # Expose on network (0.0.0.0)
npm run build              # Build for production
npm run build:analyze      # Build with bundle analysis
npm run preview            # Preview production build
npm run lint               # Run ESLint
npm run lint:fix           # Auto-fix linting issues
npm run type-check         # TypeScript type checking
npm run clean              # Clean build artifacts
```

### Frontend Admin (React + Vite)
```bash
cd frontend-admin

npm run dev                 # Start dev server (port 5174)
npm run dev:network        # Expose on network (0.0.0.0)
npm run build              # Build for production
npm run build:analyze      # Build with bundle analysis
npm run preview            # Preview production build (port 4174)
npm run lint               # Run ESLint
npm run lint:fix           # Auto-fix linting issues
npm run type-check         # TypeScript type checking
npm run clean              # Clean build artifacts
```

## ⚙️ Vite Configuration Features

Both frontends use enhanced Vite configurations with:

### Development Server
- **HMR (Hot Module Replacement)** - Instant updates without page refresh
- **CORS enabled** - Cross-origin requests allowed
- **Proxy to Backend** - `/api` routes proxied to `http://localhost:3000`
- **Host exposed** - Accessible from network when using `--host`
- **Fast refresh** - React Fast Refresh enabled

### Build Optimizations
- **Code splitting** - Automatic chunk splitting for vendors
- **Tree shaking** - Remove unused code
- **Minification** - esbuild for fast minification
- **Source maps** - Enabled for debugging
- **Manual chunks** - Separate bundles for:
  - React vendor (react, react-dom, react-router-dom)
  - MUI vendor (@mui/material, @mui/icons-material)
  - Chart vendor (chart.js, react-chartjs-2)

### Path Aliases
Import with clean paths:
```typescript
// Instead of: import Button from '../../../components/Button'
import Button from '@components/Button'
import { useAuth } from '@hooks/useAuth'
import { api } from '@services/api'
import { User } from '@types/user'
```

Available aliases:
- `@` → `./src`
- `@components` → `./src/components`
- `@pages` → `./src/pages`
- `@services` → `./src/services`
- `@store` → `./src/store`
- `@utils` → `./src/utils`
- `@types` → `./src/types`
- `@hooks` → `./src/hooks`
- `@assets` → `./src/assets`

## 🔍 Troubleshooting

### Port Already in Use

The scripts now automatically kill processes on busy ports, but you can also manage ports manually:

```bash
# Check port status
bash kill-ports.sh status

# Kill specific port
bash kill-ports.sh kill 3000

# Kill all application ports
bash kill-ports.sh kill-all

# Kill specific service
bash kill-ports.sh backend      # Port 3000
bash kill-ports.sh user         # Port 5173
bash kill-ports.sh admin        # Port 5174

# Manual port killing
lsof -ti:3000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
lsof -ti:5174 | xargs kill -9
```

**Automatic Port Cleanup:**
- `run-app.sh` automatically kills processes on ports 3000, 5173, 5174 before starting
- `run-tests.sh` automatically kills processes on port 3000 before testing
- Graceful termination (SIGTERM) attempted first, then force kill (SIGKILL) if needed

### Docker Permission Issues
```bash
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Or use sudo with docker commands
sudo docker compose up -d
```

### Clear Vite Cache
```bash
cd frontend-user && npm run clean
cd frontend-admin && npm run clean
```

### Reinstall Dependencies
```bash
# Use VS Code task: 📦 Install All Dependencies
# Or manually:
cd backend && rm -rf node_modules package-lock.json && npm install
cd frontend-user && rm -rf node_modules package-lock.json && npm install
cd frontend-admin && rm -rf node_modules package-lock.json && npm install
```

## 🌐 Access URLs

Once services are running:

- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api-docs
- **Frontend User**: http://localhost:5173
- **Frontend Admin**: http://localhost:5174
- **Health Check**: http://localhost:3000/api/health

## 📚 Additional Resources

- [Backend API Documentation](./API_DOCUMENTATION.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Development Plan](./DEVELOPMENT_PLAN.md)
- [Frontend Documentation](./frontend.md)

---

**Tip**: Use the VS Code Command Palette (`Ctrl+Shift+P`) to quickly access tasks, debugging, and terminal commands!
