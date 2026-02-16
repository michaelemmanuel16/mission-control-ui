# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
npm install

# Development (requires 2 terminals)
npx convex dev           # Terminal 1: Start Convex backend (watches schema changes)
npm run dev              # Terminal 2: Start Next.js dev server on :3000

# Build & Deploy
npm run build            # Production build
npm start                # Run production server
npx convex deploy        # Deploy Convex backend to production

# Linting
npm run lint
```

## Architecture Overview

Mission Control UI is a **real-time multi-agent task coordination system** built on Next.js 15 + Convex. The key architectural pattern is that **Convex handles all state, mutations, and real-time subscriptions**—there is no local state management, no REST APIs, and no manual polling.

### Core Data Flow Pattern

```
User Action → Convex Mutation → Database Update → Live Query Subscription → UI Auto-Updates
```

**Example:** When a task status changes:
1. Component calls `api.tasks.updateStatus(taskId, "in_progress")`
2. Convex mutation updates `tasks` table and logs to `activities` table
3. All components with `useQuery(api.tasks.list)` automatically receive updated data
4. UI re-renders instantly across all connected clients

### Real-Time Subscriptions (Critical Pattern)

All data fetching uses Convex's `useQuery` hook for automatic live updates:

```typescript
// ✅ Correct: Components auto-update when data changes
const tasks = useQuery(api.tasks.list);
const agents = useQuery(api.agents.list);
const activities = useQuery(api.activities.recent, { limit: 50 });

// ❌ Wrong: Never use fetch/axios or manual polling with Convex
```

**Key point:** Once a query is subscribed, the component receives real-time updates forever until unmounted. No need for refresh logic.

### Database Schema (convex/schema.ts)

Six tables with cross-references:

- **tasks** - Main task records with status-driven Kanban flow
  - `status`: "inbox" → "assigned" → "in_progress" → "review" → "done"
  - `assigneeIds`: Array of agent IDs (supports multi-assignment)
  - Indexed by `status` and `assigneeIds`

- **agents** - Agent registry with heartbeat tracking
  - `sessionKey`: Unique identifier (e.g., "agent:main:main")
  - `status`: "idle" | "active" | "blocked"
  - `lastHeartbeat`: Unix timestamp for liveness detection
  - Indexed by `status` and `sessionKey`

- **activities** - Audit trail for all system events
  - 6 types: task_created, task_assigned, task_status_changed, message_sent, document_created, agent_heartbeat
  - Used by LiveFeed component for real-time activity stream

- **notifications** - Per-agent notification queue
- **messages** - Task comment threads
- **documents** - Shared deliverables

### Component Architecture

**Main Layout** (`app/page.tsx`):
```
<AgentSidebar /> | <MissionQueue /> | <DetailView /> | <LiveFeed />
     (left)              (center)          (right)           (far right)
```

**Status-Driven Kanban** (`components/MissionQueue.tsx`):
- Task cards are **filtered by status** into 5 columns
- No drag-and-drop—status changes happen via mutations
- Cards show: priority badge, assignee avatar, timestamps, tags
- Clicking a card triggers `onTaskClick(taskId)` to open DetailView

**Agent Sidebar** (`components/AgentSidebar.tsx`):
- Displays all registered agents with role badges (LEAD, INT, SPC, AGT)
- Status indicators: 🔵 WORKING, ⚪ IDLE, 🔴 BLOCKED
- Agents must send heartbeats every 30-60s via `api.agents.updateHeartbeat`

**Live Feed** (`components/LiveFeed.tsx`):
- Real-time activity stream with filter tabs (All, Tasks, Comments, Status)
- Shows "LIVE" indicator for activities < 30 seconds old
- Auto-formats timestamps: LIVE → 15s → 3m → 2h → full date

## Convex Backend Patterns

### Mutations (Write Operations)

All Convex mutations in `/convex/*.ts` follow this pattern:

```typescript
export const create = mutation({
  args: { /* validated input schema */ },
  handler: async (ctx, args) => {
    // 1. Perform database operation
    const id = await ctx.db.insert("tasks", { ... });

    // 2. Create side effects (activities, notifications)
    await ctx.db.insert("activities", { ... });

    return id;
  },
});
```

**Key insight:** Mutations automatically trigger updates to all active subscriptions. No need to manually invalidate or refetch.

### Queries (Read Operations)

Queries are read-only and can be subscribed to:

```typescript
export const list = query({
  handler: async (ctx) => {
    const tasks = await ctx.db.query("tasks").order("desc").collect();
    // Populate relations manually (no joins in Convex)
    return Promise.all(
      tasks.map(async (task) => ({
        ...task,
        assignees: await Promise.all(
          task.assigneeIds.map((id) => ctx.db.get(id))
        ),
      }))
    );
  },
});
```

**Gotcha:** Convex has no SQL-style joins. Populate relations manually with `ctx.db.get()` or use indexes.

### Agent Registration & Heartbeats

Agents register once and send periodic heartbeats:

```typescript
// Registration (happens once per session)
const agentId = await ctx.runMutation(api.agents.register, {
  name: "Kai",
  role: "Squad Lead",
  sessionKey: "agent:main:main",
});

// Heartbeats (every 30-60s)
await ctx.runMutation(api.agents.updateHeartbeat, {
  sessionKey: "agent:main:main",
  status: "active",
  currentTaskId: taskId,
});
```

**Special agent:** "system:human:operator" is auto-created for human users via `getOrCreateHumanOperator`.

## Dark Mode Implementation

Dark mode uses `next-themes` with Tailwind CSS dark: variants:

**Setup:**
1. `ThemeProvider` wraps app in `app/layout.tsx` with `attribute="class"`
2. HTML tag has `suppressHydrationWarning` to prevent flash
3. All color classes use `dark:` variants: `bg-gray-50 dark:bg-slate-900`

**Theme Toggle:** `components/theme-toggle.tsx` provides Sun/Moon icons with `setTheme()`

**Pattern for new components:**
```tsx
<div className="bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100">
  {/* Always pair light/dark colors */}
</div>
```

**Color palette:**
- Light backgrounds: `gray-50`, `white`
- Dark backgrounds: `slate-900`, `slate-950`, `slate-800`
- Borders: `gray-200 dark:border-slate-700`

## Environment Variables

**Required:** `.env.local` (auto-generated by `npx convex dev`):
```bash
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
```

**Gitignored:** `.env*.local` files are excluded via `.gitignore`

## Key Files Reference

- `/convex/schema.ts` - Database table definitions
- `/convex/tasks.ts` - Task CRUD operations + status updates
- `/convex/agents.ts` - Agent registration + heartbeat logic
- `/components/MissionQueue.tsx` - Kanban board (status-driven columns)
- `/components/AgentSidebar.tsx` - Agent list with role badges
- `/components/LiveFeed.tsx` - Real-time activity stream
- `/components/DetailView.tsx` - Task detail panel (right side)
- `/app/page.tsx` - Main dashboard layout

## Common Gotchas

1. **Convex schema changes:** After modifying `/convex/schema.ts`, run `npx convex dev` to push schema changes. The dev server watches for changes automatically.

2. **Task status flow:** Tasks MUST follow the status progression: inbox → assigned → in_progress → review → done. The Kanban board filters by these exact status strings.

3. **Agent sessionKeys:** Must be unique per agent. Convention: `"agent:{name}:{session}"` or `"system:{type}:{id}"`

4. **Real-time subscriptions:** Components with `useQuery` will re-render on every database change. Keep queries scoped to avoid unnecessary re-renders.

5. **Dark mode colors:** Always specify both light and dark variants. Missing `dark:` classes will break dark mode UX.

6. **Tailwind classes:** Task cards use `line-clamp-2` and `truncate` to prevent overflow. Test with long text when modifying card layouts.

## Deployment Notes

**Vercel deployment:**
1. Push to GitHub: `git push origin main`
2. Import to Vercel (auto-detects Next.js)
3. Deploy Convex production: `npx convex deploy`
4. Add `NEXT_PUBLIC_CONVEX_URL` env var in Vercel settings
5. Redeploy

**Production Convex URL:** Generated by `npx convex deploy`, different from dev URL.

## OpenClaw Agent Integration

**Agent Skills Assignment:**
- Workspace skills: `~/.openclaw/agents/{name}/agent/skills/` - agent-specific
- Managed skills: `~/.openclaw/skills/` - shared across all agents
- Precedence: workspace > managed > bundled
- Each skill = directory with `SKILL.md` (YAML frontmatter + instructions)
- Configure: `~/.openclaw/openclaw.json` under `skills.entries.<skillKey>`

**Critical Production Deployment:**
- All Convex commands MUST use `--prod`: `npx convex run --prod api.tasks.list`
- Without `--prod`: queries DEV database (empty), agents fail silently
- Production URL: `https://good-canary-535.convex.cloud`
- Validation: verify ALL `npx convex run` commands include `--prod` flag

**Agent Configuration Files:**
- `SOUL.md` - Personality traits and behavior
- `AGENTS.md` - Operating manual, workflows
- `HEARTBEAT.md` - Periodic automation checklist
- `memory/WORKING.md` - Current task state
- `memory/MEMORY.md` - Curated long-term learnings
