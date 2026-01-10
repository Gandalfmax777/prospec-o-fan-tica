# Frontend — State Management (CRMContext)

Source: `src/context/CRMContext.tsx`

## State

| State | Type | Description |
|-------|------|-------------|
| `leads` | `Lead[]` | All leads with parsed dates |
| `gamificacao` | `Gamificacao` | Points, level, achievements, daily missions |
| `metricasDiarias` | `MetricasDiarias` | Daily metrics (contacts made, delays resolved, etc.) |
| `loading` | `boolean` | True while fetching initial data |
| `error` | `string \| null` | Error message from last failed operation |

## Actions

| Action | Description | Points |
|--------|-------------|--------|
| `addLead(lead)` | Create a new lead | +2 |
| `updateLead(id, updates)` | Update lead fields | — |
| `deleteLead(id)` | Remove lead | — |
| `registrarContato(id, briefing?)` | Register contact with optional briefing | +3 (+5 if was late) |
| `moverTemperatura(id, temp)` | Change lead temperature | +5 (hot), +3 (warm) |
| `converterLead(id)` | Mark lead as converted | +10 |
| `retornarAoFunil(id)` | Return converted lead to funnel | — |
| `adicionarBriefing(leadId, briefing)` | Add briefing to lead | +2 |
| `completarMissao(missaoId)` | Complete a daily mission | varies |
| `refreshData()` | Reload all data from API | — |

## Date Parsing Rules

**Inbound (API -> State):**

API returns ISO strings. CRMContext converts to `Date` objects:

```
ultimoContato   -> new Date() or null
proximoContato  -> new Date() or null
dataEntrada     -> new Date() (required)
dataConversao   -> new Date() or null
historico[].data -> new Date()
```

**Outbound (State -> API):**

Before sending to API, dates are converted back:

```typescript
date.toISOString()  // "2024-01-15T10:30:00.000Z"
```

## Usage

```tsx
import { useCRM } from "@/context/CRMContext";

function MyComponent() {
  const { leads, loading, error, addLead } = useCRM();
  // ...
}
```

## Conventions

- Dates from API must be converted to `Date` before storing in state
- Avoid deep mutations of arrays/objects (always use copies)
- `refreshData()` is the source of truth for re-sync on inconsistency
