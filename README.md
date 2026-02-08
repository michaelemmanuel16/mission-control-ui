# Mission Control UI

A real-time multi-agent task coordination system built for seamless team collaboration and visibility.

## Overview

Mission Control provides a live dashboard for coordinating multiple AI agents working together on complex tasks. It features real-time updates, a Kanban-style task board, agent status monitoring, and a complete activity audit trail.

**Key Features:**
- 🎯 **Mission Queue** - Kanban board showing tasks flowing through status columns (Inbox → Assigned → In Progress → Review → Done)
- 🤖 **Agent Sidebar** - Live status of all agents with role badges and activity indicators
- 📡 **Live Feed** - Real-time activity stream with filtering and "LIVE" indicators for recent events

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Convex (real-time database with live queries)
- **UI Components**: Lucide React icons
- **Real-Time Sync**: Convex subscriptions for instant updates across all clients

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Convex account (free tier available at [convex.dev](https://convex.dev))

### Installation

1. **Clone the repository:**
   ```bash
   cd mission-control-ui
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Convex:**
   ```bash
   npx convex dev
   ```
   This will:
   - Create a new Convex project (or link to existing)
   - Generate your `.env.local` file with `NEXT_PUBLIC_CONVEX_URL`
   - Deploy the database schema and functions
   - Start the Convex development server

4. **Start the Next.js dev server:**
   ```bash
   npm run dev
   ```

5. **Open the app:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Architecture Overview

### Mission Queue (Kanban Board)

Tasks flow through 5 columns based on their `status` field:

```
INBOX → ASSIGNED → IN PROGRESS → REVIEW → DONE
```

- **Status-driven**: Task position is 100% determined by the `status` field in the database
- **Real-time updates**: Tasks animate into new columns instantly when status changes
- **Task cards** display: title, priority badge, description, tags, assignee, and timestamp

### Agent Sidebar

Displays all registered agents with:

- **Role badges**: Color-coded labels (LEAD, INT, SPC, AGT) extracted from role strings
- **Status indicators**: Colored dots showing current state
  - 🔵 **WORKING** (slate) - Agent actively working on a task
  - ⚪ **IDLE** (zinc) - Agent available for new assignments
  - 🔴 **BLOCKED** (red) - Agent waiting on dependencies
- **Live heartbeats**: Agents ping every 30-60 seconds to prove they're alive

### Live Feed

Real-time activity stream showing all system events:

- **6 activity types**: task_created, task_assigned, task_status_changed, message_sent, document_created, agent_heartbeat
- **Filter tabs**: All, Tasks, Comments, Status
- **Live indicators**: Activities less than 30 seconds old show "LIVE" with pulsing red dot
- **Smart timestamps**: Auto-formatting (LIVE → 15s → 3m → 2h → full date)

## How It Works

### Task Lifecycle

```
1. Task Created      → Appears in INBOX
2. Task Assigned     → Moves to ASSIGNED column + agent notified
3. Agent Starts      → Moves to IN PROGRESS + agent status = "active"
4. Work Completed    → Moves to REVIEW + agent status = "idle"
5. Approved          → Moves to DONE
```

### Agent Lifecycle

```
1. Registration      → Agent enters system with unique sessionKey
2. Task Assignment   → Agent receives notification
3. Accept & Work     → status = "active", periodic heartbeats
4. Complete Task     → status = "idle", ready for next assignment
```

### Real-Time Synchronization

All components use Convex's `useQuery` hook for automatic real-time subscriptions:

```typescript
const tasks = useQuery(api.tasks.list);        // Auto-updates on any task change
const agents = useQuery(api.agents.list);      // Auto-updates on agent status
const activities = useQuery(api.activities.recent, { limit: 50 });
```

Changes propagate instantly from database → subscribed components → UI update. No polling, no manual refresh, no stale data.

## Database Schema

### Convex Tables

1. **tasks** - Task records with status, priority, assignees, metadata
2. **agents** - Agent records with status, role, heartbeat timestamp, current task
3. **activities** - Audit trail of all system events (6 types)
4. **notifications** - Per-agent notification queue
5. **documents** - Deliverables and file attachments
6. **messages** - Comments and task discussions

See `/convex/schema.ts` for complete type definitions.

## API Endpoints

### Tasks (`/convex/tasks.ts`)

- `api.tasks.create({ title, description, priority })` - Create new task
- `api.tasks.assign(taskId, [agentId1, agentId2])` - Assign task to agents
- `api.tasks.updateStatus(taskId, "in_progress")` - Change task status
- `api.tasks.list()` - Query all tasks (real-time)

### Agents (`/convex/agents.ts`)

- `api.agents.register({ name, role, sessionKey })` - Register new agent
- `api.agents.updateHeartbeat({ sessionKey, status, currentTaskId })` - Send heartbeat
- `api.agents.list()` - Query all agents (real-time)

### Activities (`/convex/activities.ts`)

- `api.activities.recent({ limit: 50 })` - Query recent activities (real-time)

## Development

### Running Locally

```bash
# Terminal 1: Convex backend
npx convex dev

# Terminal 2: Next.js frontend
npm run dev
```

### Environment Variables

Create `.env.local` (auto-generated by `npx convex dev`):

```bash
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
```

### Key Files

- `/components/MissionQueue.tsx` - Kanban board component
- `/components/AgentSidebar.tsx` - Agent list component
- `/components/LiveFeed.tsx` - Activity feed component
- `/convex/tasks.ts` - Task backend logic
- `/convex/agents.ts` - Agent backend logic
- `/convex/schema.ts` - Database schema definitions

## Deployment

### Deploy to Vercel

1. **Push to GitHub:**
   ```bash
   git push origin main
   ```

2. **Import to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel auto-detects Next.js configuration

3. **Configure Convex for production:**
   ```bash
   npx convex deploy
   ```
   This creates a production Convex deployment and outputs your production URL.

4. **Add environment variable in Vercel:**
   - Go to Project Settings → Environment Variables
   - Add `NEXT_PUBLIC_CONVEX_URL` with your production Convex URL
   - Redeploy

Your Mission Control dashboard is now live!

## Documentation

For a comprehensive walkthrough of the system architecture, data flow, and how components interact, see the full technical documentation in the project docs.

## License

MIT
