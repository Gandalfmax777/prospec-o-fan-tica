# Frontend — UI/UX Guidelines

## Objective

Reduce friction in the salesperson's daily workflow and keep navigation simple.

## Main Screen Priorities

The dashboard should highlight (in order):
1. **Overdue leads** — Contacts past due date
2. **Talk today** — Scheduled for today
3. **Hot leads without recent contact** — High priority, no recent activity

## Component Patterns

| Pattern | Component | When to Use |
|---------|-----------|-------------|
| Quick form | `Dialog` | Register contact, add briefing |
| Detail view | `Drawer` | Lead details, history |
| Confirmations | `AlertDialog` | Delete, convert actions |
| Notifications | `Sonner` (toast) | Success/error feedback |
| Status | `StatusBadge` | Lead status, temperature |
| Metrics | `KPICard` | Dashboard statistics |

## Feedback Patterns

- **Success**: Toast notification (auto-dismiss)
- **Error**: Toast with error variant or inline alert
- **Loading**: Skeleton components for lists, spinner for actions
- **Empty state**: Informative message with action suggestion

## Views

| View | Component | Purpose |
|------|-----------|---------|
| Kanban | `KanbanBoard.tsx` | Temperature-based columns (Cold/Warm/Hot) |
| Table | `LeadTable.tsx` | List view with sorting |
| Pending | `PendenciasTab.tsx` | Overdue and today's contacts |
| Converted | `ConvertidosTab.tsx` | Won leads |
| Gamification | `GamificacaoTab.tsx` | Points, missions, achievements |
| Metrics | `MetricasTab.tsx` | Daily performance |

---

## Roadmap

### 1. Daily Workflow
- [ ] Morning review screen showing overdue + today's priorities
- [ ] One-click "start day" to see prioritized lead list
- [ ] End-of-day summary with metrics

### 2. Quick Actions
- [x] Register contact (modal)
- [x] Convert lead
- [ ] Update deal value (inline edit)
- [ ] Bulk actions (mark multiple as contacted)

### 3. Filters & Search
- [ ] Search by name, phone, code
- [ ] Filter by temperature (Cold/Warm/Hot)
- [ ] Filter by status (On track/Overdue/Converted)
- [ ] Filter by date range
- [ ] Save filter presets

### 4. Pagination & Performance
- [ ] Paginate leads list (50 per page)
- [ ] Lazy load history/briefings on demand
- [ ] Virtual scrolling for large lists
- [ ] Cache lead details to reduce API calls
- [ ] Show pipeline total value
