# Vite + React + shadcn/ui

Enterprise-grade React + TypeScript starter with shadcn/ui components and industry-standard tooling. **Production-ready with monitoring, security, and testing.**

## 🚀 Quick Start

```bash
# Clone and install
npm install

# Copy and customize environment variables
cp .env.example .env

# Start development server
npm run dev
```

## ⚙️ Configuration

All site configuration is done through **environment variables**. See [CONFIG.md](./CONFIG.md) for details.

Quick customization:
```bash
# .env
VITE_APP_TITLE=My Awesome App
VITE_APP_DESCRIPTION=My custom description
VITE_APP_URL=https://myapp.com
VITE_APP_VERSION=2.0.0
```

## 🎨 Theming

Supports themes from **shadcn studio**, **tweakcn**, or official shadcn/ui themes. See [THEMING.md](./THEMING.md) for complete guide.

## 🔒 Security & Monitoring

### Enterprise Features Included

- ✅ **Security headers** - CSP, XSS protection, frame options
- ✅ **Performance monitoring** - Web Vitals, Long Task detection
- ✅ **Error tracking** - Sentry integration ready
- ✅ **Analytics** - Google Analytics, Plausible, PostHog support
- ✅ **E2E testing** - Playwright configuration included
- ✅ **Bundle analysis** - Performance budgeting tools

See [SECURITY.md](./SECURITY.md) and [MONITORING.md](./MONITORING.md) for details.

## 🚀 Tech Stack

- **Framework**: Vite 7 + React 19
- **Language**: TypeScript 5.9
- **UI Library**: shadcn/ui (54 components)
- **Styling**: Tailwind CSS 4
- **Testing**: Vitest + React Testing Library + Playwright
- **Linting**: ESLint 9 (flat config) + typescript-eslint
- **Environment**: Type-safe with Zod validation via @t3-oss/env-core
- **Monitoring**: Performance tracking, error reporting, analytics

## 📦 Available Scripts

### Development
```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm run build:analyze    # Build with bundle analysis
npm run preview          # Preview production build
```

### Code Quality
```bash
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format           # Format code with Prettier
npm run format:check     # Check formatting
npm run typecheck        # Type check without emitting
npm run security         # Security audit (npm audit + outdated)
```

### Testing
```bash
npm run test             # Run unit tests in watch mode
npm run test:ui          # Run tests with UI
npm run test:run         # Run tests once
npm run test:coverage    # Generate coverage report
npm run test:e2e         # Run E2E tests with Playwright
npm run test:e2e:ui      # Run E2E tests with UI
```

### CI/CD
```bash
npm run ci               # Run full CI pipeline locally
```

## 🧪 Testing Setup

### Unit Testing
- **Vitest**: Modern test runner (10x faster than Jest)
- **React Testing Library**: Component testing utilities
- **Coverage**: @vitest/coverage-v8 with 80% minimum thresholds

### E2E Testing
- **Playwright**: Cross-browser E2E testing
- **Configured for**: Chrome, Firefox, Safari, Mobile
- **Parallel execution** for faster tests

## 🔍 Linting & Security

### Linting Configuration
Uses ESLint 9 flat config with:
- `typescript-eslint` - TypeScript rules
- `eslint-plugin-react` - React specific rules
- `eslint-plugin-react-hooks` - React Hooks rules
- `eslint-plugin-jsx-a11y` - Accessibility rules
- `eslint-config-prettier` - Prettier integration

### Security Features
- Content Security Policy (CSP) headers
- Security validation in development
- HTML sanitization utilities
- Environment variable validation
- HTTPS enforcement in production

## 📝 Prettier Configuration

- Single quotes
- No semicolons
- 2 space indentation
- 100 character line width
- Trailing commas (ES5)

## 🎨 UI Components

All 54 shadcn/ui components available at `@/components/ui/*`

Components include: Accordion, Alert, Alert Dialog, Aspect Ratio, Avatar, Badge, Breadcrumb, Button, Calendar, Card, Carousel, Chart, Checkbox, Collapsible, Command, Context Menu, Dialog, Drawer, Dropdown Menu, Form, Hover Card, Input, Label, Menubar, Navigation Menu, Pagination, Popover, Progress, Radio Group, Resizable, Scroll Area, Select, Separator, Sheet, Sidebar, Skeleton, Slider, Sonner, Switch, Table, Tabs, Textarea, Toggle, Tooltip

## 🏗️ Project Structure

```
src/
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── theme-provider.tsx     # Theme management
│   ├── theme-toggle.tsx       # Theme switcher
│   └── error-boundary.tsx     # Error handling
├── lib/
│   ├── utils.ts              # Utility functions
│   ├── env.ts                # Type-safe environment variables
│   ├── security.ts           # Security utilities
│   ├── performance.ts        # Performance monitoring
│   ├── error-tracking.ts     # Error tracking
│   └── analytics.ts          # Analytics integration
├── test/                     # Unit test files
└── main.tsx                  # App entry point
e2e/                         # E2E test files
```

## ✨ Features

### Core Features
- ✅ **Environment-driven configuration** - Change site name, metadata, etc. via `.env`
- ✅ **Type-safe env vars** - Zod validation with TypeScript inference
- ✅ **Theme system** - Light/dark mode with shadcn studio/tweakcn support
- ✅ **Error boundaries** - React 19 compatible error handling

### Production Features
- ✅ **Security headers** - CSP, XSS protection, frame options
- ✅ **Performance monitoring** - Web Vitals, Long Task detection
- ✅ **Error tracking** - Sentry integration ready
- ✅ **Analytics** - Multiple providers supported
- ✅ **E2E testing** - Playwright with cross-browser support
- ✅ **Bundle analysis** - Performance budgeting tools

### Developer Experience
- ✅ **SEO ready** - Open Graph, Twitter cards, meta tags
- ✅ **PWA ready** - Manifest and service worker support
- ✅ **VS Code ready** - Recommended extensions and settings
- ✅ **CI/CD ready** - GitHub Actions workflow included
- ✅ **Comprehensive docs** - Security, monitoring, theming guides

## 🚀 Deployment

### Vercel
```bash
npm run build
vercel --prod
```

### Netlify
```bash
npm run build
netlify deploy --prod
```

### Custom Server
See [SECURITY.md](./SECURITY.md) for security header configuration.

## 📚 Documentation

- [CONFIG.md](./CONFIG.md) - Environment configuration
- [THEMING.md](./THEMING.md) - Theme customization
- [SECURITY.md](./SECURITY.md) - Security features and best practices
- [MONITORING.md](./MONITORING.md) - Monitoring and analytics setup

## 🤝 Contributing

1. Follow the code style (Prettier + ESLint)
2. Write tests for new features
3. Update documentation as needed
4. Run `npm run ci` before committing

## 📄 License

MIT

---

Built with ❤️ using Vite, React 19, and shadcn/ui
