# Frontend — API Contracts

Endpoints actually called by the frontend services.

## CRM API (`src/services/api.ts`)

Base URL: `VITE_API_URL` (default: `http://localhost:3333/api`)

### Leads

| Method | Path | Description |
|--------|------|-------------|
| GET | `/leads` | List all leads |
| GET | `/leads/:id` | Get single lead |
| POST | `/leads` | Create lead |
| PUT | `/leads/:id` | Update lead |
| DELETE | `/leads/:id` | Delete lead |
| POST | `/leads/:id/contato` | Register contact |

### Gamificacao

| Method | Path | Description |
|--------|------|-------------|
| GET | `/gamificacao` | Get gamification data |
| PUT | `/gamificacao` | Update gamification |
| POST | `/gamificacao/pontos` | Add points |
| PUT | `/gamificacao/missoes/:id` | Complete mission |

### Metricas

| Method | Path | Description |
|--------|------|-------------|
| GET | `/metricas` | Get daily metrics |
| PUT | `/metricas` | Update metrics |

### Briefings

| Method | Path | Description |
|--------|------|-------------|
| POST | `/briefings` | Create briefing |
| GET | `/briefings/lead/:leadId` | Get briefings by lead |

## Auth API (`src/services/auth.ts`)

Base URL: `VITE_BETTER_AUTH_URL` (default: `http://localhost:3333/api/auth`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/sign-in/email` | Login with email/password |
| POST | `/sign-up/email` | Register new user |
| POST | `/sign-out` | Logout |
| GET | `/get-session` | Get current session |

## Notes

- All requests include `credentials: "include"` for cookie-based sessions
- Content-Type: `application/json`
