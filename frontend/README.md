# HSP Frontend

React + TypeScript + Vite frontend for the HSP gym management app, styled
with Tailwind CSS and a small set of hand-rolled shadcn-style primitives.

## Stack

- React 18 + TypeScript, bundled with Vite
- React Router for client-side routing
- Axios for API calls (`src/services/api.ts`), with a JWT request
  interceptor and a 401 refresh-or-redirect response interceptor
- Tailwind CSS for styling, Framer Motion for animation
- Vitest + Testing Library for unit/component tests
- ESLint (flat config, typescript-eslint) for linting

## Getting started

```bash
npm install
cp .env.example .env   # set VITE_API_URL to the backend URL
npm run dev
```

## Scripts

```bash
npm run dev         # start the dev server
npm run build        # type-check and build for production
npm run type-check   # tsc -b --noEmit
npm run lint         # eslint .
npm run test          # run the vitest suite once
npm run test:watch   # run vitest in watch mode
npm run preview      # preview the production build
```

## Structure

```
src/
├── components/
│   ├── ui/       # Button, Input, Card, Badge, Table, Dialog, GlassCard,
│   │              GradientButton, PageWrapper, AnimatedList, AnimatedInput,
│   │              TextReveal
│   ├── layout/   # AppLayout, Sidebar, Navbar, MeshBackground
│   └── ProtectedRoute.tsx
├── pages/        # Route-level page components
├── hooks/        # Reusable hooks
├── services/     # Axios client + API service modules
├── context/      # AuthContext
├── types/        # Shared TypeScript interfaces
└── lib/          # cn() classname utility
```
