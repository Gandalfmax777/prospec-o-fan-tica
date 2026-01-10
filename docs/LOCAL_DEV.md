# Frontend — Local Dev

## Pré-requisitos

- Node 18+
- npm

## Setup

1. Clone the repository
2. `npm install`
3. Copy `.env.example` to `.env` and configure
4. `npm run dev`

The dev server runs on **port 8080**.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Base URL for CRM API (leads, metrics, briefings) | `http://localhost:3333/api` |
| `VITE_BETTER_AUTH_URL` | Base URL for authentication API | `http://localhost:3333/api/auth` |

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | Start development server (port 8080) |
| `build` | `vite build` | Build for production |
| `build:dev` | `vite build --mode development` | Build with development mode |
| `lint` | `eslint .` | Run ESLint for code quality |
| `preview` | `vite preview` | Preview production build locally |
