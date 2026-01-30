# Network Automation Frontend

A modern, enterprise-grade React/Next.js frontend for network automation and monitoring platform built with industry best practices.

## 🚀 Features

- **Modern Tech Stack**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Enterprise UI**: Radix UI components with shadcn/ui design system
- **Real-time Data**: React Query for state management and API integration
- **Accessibility**: WCAG 2.1 AA compliant with comprehensive a11y features
- **Security**: Built-in security headers, CSP, and secure coding practices
- **Performance**: Bundle optimization, code splitting, and performance monitoring
- **Developer Experience**: ESLint, Prettier, TypeScript strict mode, testing setup

## 🛠️ Tech Stack

- **Framework**: Next.js 14.2.5
- **Language**: TypeScript 5.3.0
- **Styling**: Tailwind CSS 3.3.6
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts
- **Icons**: Lucide React
- **Testing**: Jest, React Testing Library
- **Linting**: ESLint with accessibility and security plugins
- **Formatting**: Prettier with Tailwind plugin
- **Git Hooks**: Husky with lint-staged

## 📋 Prerequisites

- Node.js 18.17.0 or later
- npm or yarn package manager
- Git

## 🚀 Getting Started

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd networking-main/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Update `.env.local` with your configuration:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
   CUSTOM_KEY=your-secret-key
   ```

4. **Initialize git hooks**
   ```bash
   npm run prepare
   ```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Building

Create a production build:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## 📜 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run type-check` - Run TypeScript type checking
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run analyze` - Analyze bundle size
- `npm run build:analyze` - Build with bundle analysis

## 🧪 Testing

Run the test suite:
```bash
npm run test
```

Run tests with coverage:
```bash
npm run test:coverage
```

Run tests in watch mode:
```bash
npm run test:watch
```

## 🔍 Code Quality

### Linting

ESLint is configured with:
- TypeScript rules
- React best practices
- Accessibility rules (WCAG 2.1)
- Security vulnerability detection
- Import organization

```bash
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
```

### Formatting

Prettier is configured for consistent code style:
```bash
npm run format        # Format all files
npm run format:check  # Check formatting
```

### Type Checking

TypeScript strict mode ensures type safety:
```bash
npm run type-check  # Run type checking
```

## 🎨 Design System

The application uses shadcn/ui with Radix UI primitives for:
- Consistent design tokens
- Accessible components
- Theme support (light/dark mode ready)
- Responsive design
- Animation support with Framer Motion

## 🔒 Security

- **Content Security Policy (CSP)** headers
- **Security headers** (X-Frame-Options, X-Content-Type-Options, etc.)
- **Input validation** with Zod schemas
- **XSS protection** via secure coding practices
- **Dependency scanning** for vulnerabilities
- **Environment variable validation**

## ♿ Accessibility

- **WCAG 2.1 AA compliant**
- **Keyboard navigation** support
- **Screen reader** optimization
- **Color contrast** standards
- **Focus management**
- **Semantic HTML** structure

## 🚀 Performance

- **Bundle analysis** with Next.js Bundle Analyzer
- **Code splitting** for optimal loading
- **Image optimization** with Next.js Image component
- **Caching strategies** for API responses
- **Performance budgets** in CI/CD
- **Web Vitals** monitoring

## 📁 Project Structure

```
frontend/
├── components/          # Reusable React components
│   ├── ui/             # UI components (shadcn/ui)
│   ├── ErrorBoundary.tsx # Error boundary component
│   └── Loading.tsx     # Loading components
├── pages/              # Next.js pages (App Router)
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and configurations
├── types/              # TypeScript type definitions
├── utils/              # Helper functions
├── styles/             # Global styles and CSS
├── public/             # Static assets
└── __tests__/          # Test files
```

## 🔧 Configuration

### TypeScript
- Strict mode enabled
- Modern ES2022 target
- Path mapping configured
- Incremental compilation

### ESLint
- TypeScript rules
- Accessibility rules
- Security rules
- Import organization

### Prettier
- Consistent formatting
- Tailwind CSS plugin
- Import organization

### Jest
- React Testing Library setup
- TypeScript support
- Coverage reporting

## 🚢 Deployment

The application is optimized for deployment on:
- Vercel (recommended)
- Netlify
- Docker
- Any Node.js hosting platform

### Docker Deployment

```dockerfile
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM base AS builder
COPY . .
RUN npm run build

FROM base AS runtime
COPY --from=builder .next .next
COPY --from=builder public public
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Run tests and linting**
5. **Submit a pull request**

### Code Standards

- Follow TypeScript strict mode
- Use functional components with hooks
- Implement proper error boundaries
- Add accessibility attributes
- Write tests for new features
- Follow conventional commits

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code examples

---

Built with ❤️ using modern web technologies and industry best practices.
