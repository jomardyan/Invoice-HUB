# Invoice-HUB Frontend (User Application)

This is the tenant-scoped user frontend for Invoice-HUB SaaS platform.

## Technology Stack

- **React 18+** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Material-UI (MUI)** - Component library
- **Redux Toolkit** - State management
- **RTK Query** - Data fetching
- **React Router v6** - Routing
- **React Hook Form + Zod** - Form handling and validation
- **i18next** - Internationalization (Polish/English)
- **Socket.io Client** - Real-time updates
- **Chart.js** - Data visualization
- **react-toastify** - Notifications

## Project Structure

```
src/
├── components/
│   ├── atoms/           # Basic UI components
│   ├── molecules/       # Composed components
│   ├── organisms/       # Complex components (Header, Sidebar)
│   ├── templates/       # Layout components
│   └── ProtectedRoute.tsx
├── pages/               # Page components
│   ├── Auth/
│   ├── Dashboard/
│   ├── Invoices/
│   ├── Customers/
│   ├── Products/
│   └── Settings/
├── store/               # Redux store
│   ├── api/            # RTK Query API
│   ├── slices/         # Redux slices
│   └── index.ts
├── hooks/              # Custom hooks
├── utils/              # Utilities
├── types/              # TypeScript types
├── locales/            # Translation files
├── routes/             # Route configuration
├── i18n.ts            # i18n setup
└── App.tsx
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env.development`:

```bash
VITE_API_URL=http://localhost:3000/api/v1
VITE_SOCKET_URL=ws://localhost:3000
VITE_ENV=development
```

### Development

```bash
npm run dev
```

App will run on http://localhost:5173

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Linting

```bash
npm run lint
```

## Features

- ✅ Authentication (Login/Register)
- ✅ Protected routes with role-based access
- ✅ Responsive layout with sidebar navigation
- ✅ Multi-language support (Polish/English)
- ✅ Theme support (Light/Dark)
- ✅ Redux state management with RTK Query
- 🚧 Dashboard with metrics
- 🚧 Invoice management (CRUD)
- 🚧 Customer management
- 🚧 Product catalog
- 🚧 Payment tracking
- 🚧 Reports and analytics
- 🚧 Template management
- 🚧 Notifications
- 🚧 Integrations (Allegro, Webhooks)

## Development Status

**Phase 1: Setup - COMPLETED ✅**
- Project initialization
- Dependencies installed
- Folder structure created
- Redux store configured
- Routing setup
- Basic layouts created
- Authentication pages

**Next: Phase 2 - Core Features**
- Implement full authentication flow
- Build dashboard with real data
- Create invoice management system
- Customer and product CRUD

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## License

Proprietary - All rights reserved
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
