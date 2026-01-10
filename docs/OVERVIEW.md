# Frontend — Overview

Aplicação React (Vite + TS) para gerenciamento de leads, histórico de contatos, briefings, métricas diárias e gamificação.

## Tech Stack

| Category | Technology |
|----------|------------|
| Build Tool | Vite 7.2 |
| Framework | React 18.3 |
| Language | TypeScript 5.8 |
| Styling | Tailwind CSS 3.4 |
| UI Components | shadcn/ui (Radix UI primitives) |
| Routing | React Router DOM 6.30 |
| Server State | TanStack React Query 5.83 |
| Forms | React Hook Form + Zod |
| Authentication | Better Auth |
| Charts | Recharts |
| Icons | Lucide React |

## Project Structure

```
src/
├── components/
│   ├── ui/           # shadcn/ui components (buttons, dialogs, inputs, etc.)
│   ├── crm/          # Business components (Kanban, Lead Table, KPIs, etc.)
│   └── auth/         # Authentication components (AuthGuard, LoginForm, etc.)
├── pages/
│   ├── Index.tsx     # Main dashboard
│   ├── Login.tsx     # Login page
│   ├── Register.tsx  # Registration page
│   └── NotFound.tsx  # 404 page
├── services/
│   ├── api.ts        # API client for CRM data (leads, metrics, briefings)
│   └── auth.ts       # Authentication service (Better Auth integration)
├── context/
│   ├── AuthContext.tsx  # Auth state management
│   └── CRMContext.tsx   # CRM business logic context
├── types/
│   ├── auth.ts       # Authentication types
│   ├── crm.ts        # CRM domain types (Lead, Contact, Gamification, etc.)
│   └── api.ts        # API response types
├── hooks/            # Custom React hooks
├── lib/              # Utility functions
└── App.tsx           # Main app with routing
```

## Como o app funciona

- Autenticação via Better Auth (sessão em cookie)
- Dados principais vêm do backend:
  - `/api/leads`
  - `/api/gamificacao`
  - `/api/metricas`
  - `/api/briefings`

## Estado global

O app usa `CRMContext` como fonte principal de estado:

- `leads[]`
- `gamificacao`
- `metricasDiarias`
- `loading` / `error`
- actions: `createLead`, `updateLead`, `deleteLead`, `registrarContato`, etc.

## Key Features

- **Lead Management** — CRUD operations with status tracking (New, Contacted, Qualified, Proposal, Won, Lost)
- **Contact History** — Track interactions (Call, WhatsApp, Email, Meeting, Visit)
- **Gamification** — Points, levels, achievements, and daily missions
- **Daily Metrics** — Monitor contacts made, delays resolved, conversion rates
- **Lead Temperature** — Cold, Warm, Hot classification
- **Lead Priority** — Urgent, Alert, Attention, Normal levels
- **Briefing Records** — Document contact details and next steps
- **Dashboard with KPIs** — Visual representation of leads by status, source, and temperature
- **Dark/Light Mode** — Theme switching

## Pontos de atenção

- Não confiar em regras de gamificação no client (roadmap: servidor calcula)
- `/leads` pode ficar pesado; planejar paginação e detalhes sob demanda
