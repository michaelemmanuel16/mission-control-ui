# Mission Control UI - Complete Technical Documentation

**Last Updated:** February 8, 2026
**Version:** 0.1.0
**Repository:** [michaelemmanuel16/mission-control-ui](https://github.com/michaelemmanuel16/mission-control-ui)

---

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
  - [System Architecture](#system-architecture)
  - [Frontend Architecture](#frontend-architecture)
  - [Backend Architecture](#backend-architecture)
  - [Data Flow Patterns](#data-flow-patterns)
  - [Component Hierarchy](#component-hierarchy)
- [Database Schema](#database-schema)
  - [Agents Table](#agents-table)
  - [Tasks Table](#tasks-table)
  - [Messages Table](#messages-table)
  - [Activities Table](#activities-table)
  - [Documents Table](#documents-table)
  - [Notifications Table](#notifications-table)
- [API Reference](#api-reference)
  - [Tasks API](#tasks-api)
  - [Agents API](#agents-api)
  - [Messages API](#messages-api)
  - [Activities API](#activities-api)
  - [Documents API](#documents-api)
- [Components Reference](#components-reference)
  - [Core Components](#core-components)
  - [Supporting Components](#supporting-components)
  - [UI Components](#ui-components)
- [Dark Mode Implementation](#dark-mode-implementation)
  - [Setup and Configuration](#setup-and-configuration)
  - [Theme Provider](#theme-provider)
  - [Theme Toggle Component](#theme-toggle-component)
  - [Styling Patterns](#styling-patterns)
  - [Adding Dark Mode to New Components](#adding-dark-mode-to-new-components)
- [Environment & Configuration](#environment--configuration)
- [Development Setup](#development-setup)
- [Deployment](#deployment)
  - [Local Development](#local-development)
  - [Production Deployment to Vercel](#production-deployment-to-vercel)
- [Features Deep Dive](#features-deep-dive)
  - [Task Management](#task-management)
  - [Agent System](#agent-system)
  - [Activity Feed](#activity-feed)
  - [Real-time Synchronization](#real-time-synchronization)
- [Troubleshooting](#troubleshooting)
- [Code Examples](#code-examples)

---

## Project Overview

Mission Control UI is a **real-time multi-agent task coordination system** designed for seamless collaboration and visibility across AI agents working together on complex tasks. The system provides live updates, comprehensive task tracking, agent monitoring, and a complete audit trail of all system activities.

### Key Features

- 🎯 **Mission Queue** - Kanban-style board with 5 status columns (INBOX → ASSIGNED → IN PROGRESS → REVIEW → DONE)
- 🤖 **Agent Sidebar** - Live status monitoring with role badges and activity indicators
- 📡 **Live Feed** - Real-time activity stream with filtering and "LIVE" indicators for events less than 30 seconds old
- 💬 **Task Detail Modal** - Complete task view with comments, assignees, and status controls
- 📊 **Stats Bar** - Large dashboard display showing active agents and task queue size
- 🌓 **Dark Mode** - Full dark theme support with next-themes integration

### Technology Stack

| Category | Technology | Version |
|----------|-----------|---------|
| **Frontend Framework** | Next.js | 16.1.6 |
| **UI Library** | React | 19.2.3 |
| **Language** | TypeScript | 5.x |
| **Styling** | Tailwind CSS | 3.4.19 |
| **Backend** | Convex | 1.31.7 |
| **Icons** | Lucide React | 0.563.0 |
| **Theming** | next-themes | 0.4.6 |

### Quick Stats

- **6 Database Tables** (agents, tasks, messages, activities, documents, notifications)
- **18+ API Functions** across 6 Convex modules
- **14+ React Components** totaling ~1,500 lines of component code
- **Real-time Updates** via Convex live queries
- **Full Dark Mode** support with theme persistence

---

## Architecture

### System Architecture

Mission Control follows a **client-server architecture** with real-time synchronization:

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js Frontend                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Mission   │  │    Agent    │  │    Live     │    │
│  │    Queue    │  │   Sidebar   │  │    Feed     │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
│         │                 │                 │            │
│         └─────────────────┼─────────────────┘            │
│                           │                              │
│                    ┌──────▼──────┐                      │
│                    │   useQuery  │                      │
│                    │  useMutation│                      │
│                    └──────┬──────┘                      │
└───────────────────────────┼─────────────────────────────┘
                            │
                  WebSocket │ Connection
                            │
┌───────────────────────────▼─────────────────────────────┐
│                  Convex Backend                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Tasks   │  │  Agents  │  │Messages  │             │
│  │   API    │  │   API    │  │   API    │             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘             │
│       │             │              │                     │
│       └─────────────┼──────────────┘                     │
│                     │                                    │
│              ┌──────▼──────┐                            │
│              │  Database   │                            │
│              │  (6 Tables) │                            │
│              └─────────────┘                            │
└─────────────────────────────────────────────────────────┘
```

**Key Architectural Decisions:**

1. **Real-time First**: All data flows through Convex's reactive queries for instant updates
2. **Stateless Components**: UI components derive all state from Convex queries
3. **Single Source of Truth**: Database schema drives all UI behavior
4. **Activity Logging**: Every mutation creates an activity record for audit trail

### Frontend Architecture

Built with **Next.js 16 App Router** and **React 19**, the frontend uses:

- **Server Components** for the root layout and initial HTML
- **Client Components** (`'use client'`) for all interactive UI with Convex hooks
- **Convex Provider** wrapping the entire application for real-time subscriptions
- **Theme Provider** from next-themes for dark mode support

**Component Tree:**

```
RootLayout (app/layout.tsx)
├── ThemeProvider
│   └── ConvexClientProvider
│       └── Page (app/page.tsx)
│           ├── StatsBar
│           │   └── ThemeToggle
│           ├── AgentSidebar
│           ├── MissionQueue
│           ├── LiveFeed
│           └── DetailView (modal)
```

### Backend Architecture

**Convex** provides the entire backend infrastructure:

- **Database**: Document-based storage with 6 tables
- **Functions**: Mutations (write) and Queries (read) defined in TypeScript
- **Real-time**: Live queries automatically push updates to subscribed clients
- **Indexes**: Optimized queries with custom indexes on each table

**Function Organization:**

```
convex/
├── schema.ts          # Database schema definitions
├── tasks.ts           # Task CRUD operations
├── agents.ts          # Agent registration & heartbeat
├── messages.ts        # Comment/message operations
├── activities.ts      # Activity feed queries
└── documents.ts       # Document management
```

### Data Flow Patterns

#### Creating a Task

```
User Action → Component Event Handler → useMutation hook
                                            ↓
                                    Convex Backend
                                            ↓
                              Insert into tasks table
                                            ↓
                              Insert activity record
                                            ↓
                              useQuery subscribers notified
                                            ↓
                              UI updates automatically
```

#### Real-time Updates

```
Database Change → Convex detects change → WebSocket push
                                              ↓
                                     All subscribed clients
                                              ↓
                                     useQuery hook updates
                                              ↓
                                     React re-renders
```

**No manual refresh needed** - changes propagate instantly to all connected clients.

### Component Hierarchy

**State Management:**

- **No Redux/Context needed** - Convex handles all global state
- Components use `useQuery` for reads and `useMutation` for writes
- Local UI state (modals, filters) managed with `useState`

**Component Types:**

1. **Container Components**: Fetch data via `useQuery` and pass to presentational components
2. **Presentational Components**: Receive data via props and render UI
3. **Provider Components**: Wrap the app with context (Convex, Theme)

---

## Database Schema

Mission Control uses **6 Convex tables** for multi-agent coordination. All tables use Convex's document model with automatic `_id` and `_creationTime` fields.

### Agents Table

Tracks all registered agents and their current status.

**Schema:**

```typescript
agents: {
  name: string;              // "Kai", "Bond", "Fury"
  role: string;              // "Squad Lead", "Ad Intelligence", "Customer Researcher"
  status: "idle" | "active" | "blocked";
  currentTaskId?: Id<"tasks">;
  sessionKey: string;        // "agent:main:main", "agent:bond:main"
  lastHeartbeat?: number;    // Unix timestamp in milliseconds
}
```

**Indexes:**

- `by_status`: Index on `status` field for filtering agents by their current state
- `by_session`: Index on `sessionKey` field for fast agent lookup during heartbeat updates

**Relationships:**

- `currentTaskId` → References `tasks` table (optional)
- Referenced by `tasks.assigneeIds` (many-to-many)
- Referenced by `activities.agentId` (one-to-many)
- Referenced by `messages.fromAgentId` (one-to-many)

**Example Document:**

```json
{
  "_id": "jd7x8k9m...",
  "name": "Kai",
  "role": "Squad Lead",
  "status": "active",
  "currentTaskId": "ab1c2d3e...",
  "sessionKey": "agent:kai:main",
  "lastHeartbeat": 1675890234567,
  "_creationTime": 1675880234567
}
```

### Tasks Table

Shared task tracking with status-based workflow.

**Schema:**

```typescript
tasks: {
  title: string;
  description: string;
  status: "inbox" | "assigned" | "in_progress" | "review" | "done" | "blocked";
  assigneeIds: Id<"agents">[];
  priority: "low" | "medium" | "high" | "urgent";
  createdAt: number;
  updatedAt: number;
  dueDate?: number;
  tags?: string[];
}
```

**Indexes:**

- `by_status`: Index on `status` field for Kanban column queries
- `by_assignee`: Index on `assigneeIds` array for agent-specific task lists

**Status Flow:**

```
inbox → assigned → in_progress → review → done
         ↓                                  ↑
      blocked ──────────────────────────────┘
```

**Priority Levels:**

- `urgent`: Requires immediate attention (red badge)
- `high`: Important task (orange badge)
- `medium`: Standard priority (yellow badge)
- `low`: Can be deferred (green badge)

**Example Document:**

```json
{
  "_id": "ab1c2d3e...",
  "title": "Implement dark mode",
  "description": "Add theme toggle and dark mode styles to all components",
  "status": "in_progress",
  "assigneeIds": ["jd7x8k9m..."],
  "priority": "high",
  "createdAt": 1675880234567,
  "updatedAt": 1675890234567,
  "tags": ["ui", "enhancement"],
  "_creationTime": 1675880234567
}
```

### Messages Table

Comment threads for task discussions.

**Schema:**

```typescript
messages: {
  taskId: Id<"tasks">;
  fromAgentId: Id<"agents">;
  content: string;
  attachments?: Id<"documents">[];
  createdAt: number;
}
```

**Indexes:**

- `by_task`: Index on `taskId` for retrieving all messages for a task
- `by_agent`: Index on `fromAgentId` for agent activity history

**Relationships:**

- `taskId` → References `tasks` table (required)
- `fromAgentId` → References `agents` table (required)
- `attachments` → References `documents` table (optional array)

**Example Document:**

```json
{
  "_id": "mn9o0p1q...",
  "taskId": "ab1c2d3e...",
  "fromAgentId": "jd7x8k9m...",
  "content": "I've completed the UI implementation. Ready for review.",
  "createdAt": 1675890234567,
  "_creationTime": 1675890234567
}
```

### Activities Table

Real-time activity feed and audit trail.

**Schema:**

```typescript
activities: {
  type: "task_created" | "task_assigned" | "task_status_changed" |
        "message_sent" | "document_created" | "agent_heartbeat";
  agentId?: Id<"agents">;    // Optional because system events exist
  taskId?: Id<"tasks">;
  message: string;
  metadata?: any;             // Flexible metadata for different activity types
  createdAt: number;
}
```

**Indexes:**

- `by_time`: Index on `createdAt` for chronological activity feed
- `by_task`: Index on `taskId` for task-specific activity history

**Activity Types:**

1. **task_created**: New task added to the system
2. **task_assigned**: Task assigned to one or more agents
3. **task_status_changed**: Task moved to a different status
4. **message_sent**: New comment posted on a task
5. **document_created**: New document uploaded
6. **agent_heartbeat**: Agent sent heartbeat ping (filtered in UI)

**Example Document:**

```json
{
  "_id": "rs2t3u4v...",
  "type": "task_status_changed",
  "agentId": "jd7x8k9m...",
  "taskId": "ab1c2d3e...",
  "message": "Status changed to in_progress",
  "createdAt": 1675890234567,
  "_creationTime": 1675890234567
}
```

### Documents Table

Shared deliverables and research repository.

**Schema:**

```typescript
documents: {
  title: string;
  content: string;           // Markdown content
  type: "deliverable" | "research" | "protocol" | "report" | "draft";
  taskId?: Id<"tasks">;
  agentId: Id<"agents">;
  createdAt: number;
  updatedAt: number;
}
```

**Indexes:**

- `by_task`: Index on `taskId` for task-related documents
- `by_agent`: Index on `agentId` for agent contributions
- `by_type`: Index on `type` for document categorization

**Document Types:**

- `deliverable`: Final output/product
- `research`: Research findings and notes
- `protocol`: Standard operating procedures
- `report`: Status reports and summaries
- `draft`: Work-in-progress documents

**Example Document:**

```json
{
  "_id": "wx5y6z7a...",
  "title": "Dark Mode Implementation Guide",
  "content": "## Overview\n\nThis document describes...",
  "type": "deliverable",
  "taskId": "ab1c2d3e...",
  "agentId": "jd7x8k9m...",
  "createdAt": 1675890234567,
  "updatedAt": 1675890234567,
  "_creationTime": 1675890234567
}
```

### Notifications Table

Per-agent notification queue for @mentions and alerts.

**Schema:**

```typescript
notifications: {
  mentionedAgentId: Id<"agents">;
  content: string;
  taskId?: Id<"tasks">;
  messageId?: Id<"messages">;
  delivered: boolean;
  deliveredAt?: number;
  createdAt: number;
}
```

**Indexes:**

- `by_agent_undelivered`: Compound index on `[mentionedAgentId, delivered]` for efficient unread notification queries
- `by_task`: Index on `taskId` for task-related notifications

**Notification Flow:**

1. Agent assigned to task → notification created with `delivered: false`
2. Agent polls for unread notifications → fetches via `by_agent_undelivered` index
3. Agent reads notification → update `delivered: true`, set `deliveredAt`

**Example Document:**

```json
{
  "_id": "bc8d9e0f...",
  "mentionedAgentId": "jd7x8k9m...",
  "content": "You have been assigned to task: Implement dark mode",
  "taskId": "ab1c2d3e...",
  "delivered": false,
  "createdAt": 1675890234567,
  "_creationTime": 1675890234567
}
```

---

## API Reference

All API functions are defined in the `convex/` directory using Convex's `mutation` and `query` builders.

### Tasks API

Located in `/convex/tasks.ts`.

#### api.tasks.create

**Type:** Mutation

**Purpose:** Creates a new task in the mission queue.

**Parameters:**

```typescript
{
  title: string;              // Required - task title
  description: string;        // Required - task description
  priority?: string;          // Optional - "low" | "medium" | "high" | "urgent"
  dueDate?: number;          // Optional - Unix timestamp
  tags?: string[];           // Optional - task tags
}
```

**Returns:** `Id<'tasks'>` - The newly created task ID

**Side Effects:**
- Creates task with `status: "inbox"` and empty `assigneeIds`
- Logs `task_created` activity to activities table
- Defaults to `priority: "medium"` if not specified

**Example:**

```typescript
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

function CreateTaskButton() {
  const createTask = useMutation(api.tasks.create);

  const handleCreate = async () => {
    const taskId = await createTask({
      title: "Implement dark mode",
      description: "Add theme toggle to UI",
      priority: "high",
      tags: ["ui", "enhancement"]
    });
    console.log("Created task:", taskId);
  };

  return <button onClick={handleCreate}>Create Task</button>;
}
```

#### api.tasks.assign

**Type:** Mutation

**Purpose:** Assigns a task to one or more agents.

**Parameters:**

```typescript
{
  taskId: Id<"tasks">;        // Required - task to assign
  agentIds: Id<"agents">[];   // Required - agents to assign (array)
  tags?: string[];            // Optional - update task tags
}
```

**Returns:** `void`

**Side Effects:**
- Updates task `status` to `"assigned"`
- Replaces `assigneeIds` with provided agents
- Creates notification for each assigned agent
- Logs `task_assigned` activity
- Updates `updatedAt` timestamp

**Example:**

```typescript
const assignTask = useMutation(api.tasks.assign);

await assignTask({
  taskId: "ab1c2d3e...",
  agentIds: ["jd7x8k9m...", "pq3r4s5t..."],
  tags: ["ui", "enhancement", "priority"]
});
```

#### api.tasks.updateStatus

**Type:** Mutation

**Purpose:** Changes a task's status (moves between Kanban columns).

**Parameters:**

```typescript
{
  taskId: Id<"tasks">;
  status: "inbox" | "assigned" | "in_progress" | "review" | "done" | "blocked";
}
```

**Returns:** `void`

**Side Effects:**
- Updates task `status` field
- Updates `updatedAt` timestamp
- Logs `task_status_changed` activity

**Example:**

```typescript
const updateStatus = useMutation(api.tasks.updateStatus);

// Move task to "in_progress"
await updateStatus({
  taskId: "ab1c2d3e...",
  status: "in_progress"
});
```

#### api.tasks.list

**Type:** Query

**Purpose:** Retrieves all tasks with their assigned agents.

**Parameters:** None

**Returns:** `Array<Task & { assignees: Agent[] }>`

**Details:**
- Returns tasks ordered by creation time (most recent first)
- Populates `assignees` array by resolving `assigneeIds`
- Real-time: UI updates automatically when tasks change

**Example:**

```typescript
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

function TaskList() {
  const tasks = useQuery(api.tasks.list);

  if (!tasks) return <div>Loading...</div>;

  return (
    <div>
      {tasks.map(task => (
        <div key={task._id}>
          <h3>{task.title}</h3>
          <p>Assignees: {task.assignees.map(a => a.name).join(", ")}</p>
        </div>
      ))}
    </div>
  );
}
```

#### api.tasks.byStatus

**Type:** Query

**Purpose:** Retrieves tasks filtered by a specific status.

**Parameters:**

```typescript
{
  status: "inbox" | "assigned" | "in_progress" | "review" | "done" | "blocked";
}
```

**Returns:** `Array<Task>`

**Details:**
- Uses `by_status` index for efficient filtering
- Does NOT populate assignees (use `api.tasks.get` for full task details)

**Example:**

```typescript
const inProgressTasks = useQuery(api.tasks.byStatus, {
  status: "in_progress"
});
```

#### api.tasks.get

**Type:** Query

**Purpose:** Retrieves a single task by ID with full details.

**Parameters:**

```typescript
{
  taskId: Id<"tasks">;
}
```

**Returns:** `Task & { assignees: Agent[] }`

**Throws:** Error if task not found

**Example:**

```typescript
const task = useQuery(api.tasks.get, { taskId: "ab1c2d3e..." });

if (!task) return <div>Loading...</div>;

return (
  <div>
    <h2>{task.title}</h2>
    <p>{task.description}</p>
    <p>Status: {task.status}</p>
    <p>Priority: {task.priority}</p>
    {task.assignees.map(agent => (
      <span key={agent._id}>{agent.name}</span>
    ))}
  </div>
);
```

### Agents API

Located in `/convex/agents.ts`.

#### api.agents.register

**Type:** Mutation

**Purpose:** Registers a new agent in the system.

**Parameters:**

```typescript
{
  name: string;         // Agent display name
  role: string;         // Agent role description
  sessionKey: string;   // Unique session identifier
}
```

**Returns:** `Id<'agents'>` - The agent ID (existing or newly created)

**Behavior:**
- If agent with `sessionKey` already exists, returns existing ID
- Otherwise creates new agent with `status: "idle"`
- Idempotent: safe to call multiple times with same sessionKey

**Example:**

```typescript
const registerAgent = useMutation(api.agents.register);

const agentId = await registerAgent({
  name: "Kai",
  role: "Squad Lead",
  sessionKey: "agent:kai:main"
});
```

#### api.agents.updateHeartbeat

**Type:** Mutation

**Purpose:** Updates agent's heartbeat timestamp and optionally status/currentTaskId.

**Parameters:**

```typescript
{
  sessionKey: string;              // Required - agent identifier
  status?: string;                 // Optional - "idle" | "active" | "blocked"
  currentTaskId?: Id<"tasks">;     // Optional - task agent is working on
}
```

**Returns:** `Id<'agents'>` - The agent ID

**Side Effects:**
- Updates `lastHeartbeat` to current timestamp
- Updates `status` if provided
- Updates `currentTaskId` if provided
- Logs `agent_heartbeat` activity

**Throws:** Error if agent not found

**Example:**

```typescript
const updateHeartbeat = useMutation(api.agents.updateHeartbeat);

// Simple heartbeat
await updateHeartbeat({
  sessionKey: "agent:kai:main"
});

// Heartbeat with status update
await updateHeartbeat({
  sessionKey: "agent:kai:main",
  status: "active",
  currentTaskId: "ab1c2d3e..."
});
```

#### api.agents.removeAgent

**Type:** Mutation

**Purpose:** Removes an agent from the system.

**Parameters:**

```typescript
{
  sessionKey: string;   // Agent to remove
}
```

**Returns:**

```typescript
{
  success: true;
  deleted: string;      // Name of deleted agent
}
```

**Throws:** Error if agent not found

**Example:**

```typescript
const removeAgent = useMutation(api.agents.removeAgent);

const result = await removeAgent({
  sessionKey: "agent:kai:main"
});
console.log(`Deleted agent: ${result.deleted}`);
```

#### api.agents.list

**Type:** Query

**Purpose:** Retrieves all registered agents.

**Parameters:** None

**Returns:** `Array<Agent>`

**Example:**

```typescript
const agents = useQuery(api.agents.list);

return (
  <div>
    <h2>Active Agents ({agents?.length || 0})</h2>
    {agents?.map(agent => (
      <div key={agent._id}>
        <span>{agent.name}</span>
        <span>{agent.status}</span>
      </div>
    ))}
  </div>
);
```

### Messages API

Located in `/convex/messages.ts`.

#### api.messages.create

**Type:** Mutation

**Purpose:** Posts a message/comment on a task.

**Parameters:**

```typescript
{
  taskId: Id<"tasks">;
  fromAgentId: Id<"agents">;
  content: string;
}
```

**Returns:** `Id<'messages'>` - The message ID

**Side Effects:**
- Creates message with current timestamp
- Logs `message_sent` activity
- Sets `attachments` to empty array

**Example:**

```typescript
const postMessage = useMutation(api.messages.create);

await postMessage({
  taskId: "ab1c2d3e...",
  fromAgentId: "jd7x8k9m...",
  content: "I've completed the UI implementation. Ready for review."
});
```

#### api.messages.byTask

**Type:** Query

**Purpose:** Retrieves all messages for a specific task.

**Parameters:**

```typescript
{
  taskId: Id<"tasks">;
}
```

**Returns:** `Array<Message & { fromAgent: Agent }>`

**Details:**
- Uses `by_task` index for efficient filtering
- Returns messages in chronological order (oldest first)
- Populates `fromAgent` with full agent details

**Example:**

```typescript
const messages = useQuery(api.messages.byTask, {
  taskId: "ab1c2d3e..."
});

return (
  <div>
    {messages?.map(msg => (
      <div key={msg._id}>
        <strong>{msg.fromAgent.name}:</strong> {msg.content}
        <small>{new Date(msg.createdAt).toLocaleString()}</small>
      </div>
    ))}
  </div>
);
```

### Activities API

Located in `/convex/activities.ts`.

#### api.activities.recent

**Type:** Query

**Purpose:** Retrieves recent activity feed with optional limit.

**Parameters:**

```typescript
{
  limit?: number;   // Optional, defaults to 50
}
```

**Returns:** `Array<Activity & { agent?: Agent, task?: Task }>`

**Details:**
- Uses `by_time` index ordered by most recent first
- Populates `agent` if `agentId` exists
- Populates `task` if `taskId` exists
- Real-time updates as activities are logged

**Example:**

```typescript
const activities = useQuery(api.activities.recent, { limit: 50 });

return (
  <div>
    {activities?.map(activity => (
      <div key={activity._id}>
        <span>{activity.message}</span>
        {activity.agent && <span>by {activity.agent.name}</span>}
        <time>{new Date(activity.createdAt).toLocaleString()}</time>
      </div>
    ))}
  </div>
);
```

### Documents API

Located in `/convex/documents.ts`.

#### api.documents.list

**Type:** Query

**Purpose:** Retrieves all documents.

**Parameters:** None

**Returns:** `Array<Document>`

**Details:**
- Ordered by creation time (most recent first)

**Example:**

```typescript
const documents = useQuery(api.documents.list);

return (
  <ul>
    {documents?.map(doc => (
      <li key={doc._id}>
        {doc.title} ({doc.type})
      </li>
    ))}
  </ul>
);
```

#### api.documents.upload

**Type:** Mutation

**Purpose:** Creates a new document.

**Parameters:**

```typescript
{
  title: string;
  content: string;      // Markdown content
  type: "deliverable" | "research" | "protocol" | "report" | "draft";
  taskId?: Id<"tasks">;
}
```

**Returns:** `Id<'documents'>` - The document ID

**Side Effects:**
- Sets `createdAt` and `updatedAt` to current timestamp
- Sets `agentId` to hardcoded placeholder (TODO: Get from context)

**Example:**

```typescript
const uploadDoc = useMutation(api.documents.upload);

await uploadDoc({
  title: "Implementation Report",
  content: "## Overview\n\nThis report...",
  type: "report",
  taskId: "ab1c2d3e..."
});
```

#### api.documents.remove

**Type:** Mutation

**Purpose:** Deletes a document.

**Parameters:**

```typescript
{
  id: Id<"documents">;
}
```

**Returns:** `void`

**Example:**

```typescript
const removeDoc = useMutation(api.documents.remove);

await removeDoc({ id: "wx5y6z7a..." });
```

---

## Components Reference

### Core Components

#### MissionQueue

**Location:** `/components/MissionQueue.tsx`

**Purpose:** Kanban-style task board displaying 5 status columns.

**Props:**

```typescript
interface MissionQueueProps {
  onTaskClick?: (taskId: Id<'tasks'>) => void;
}
```

**Features:**
- Real-time task updates via `useQuery(api.tasks.list)`
- 5 status columns: INBOX → ASSIGNED → IN PROGRESS → REVIEW → DONE
- Task cards with priority badges, tags, assignee avatars, timestamps
- Dark mode support with Tailwind `dark:` prefix
- Responsive layout with horizontal scrolling
- Displays active task count in header

**Key Functions:**

```typescript
// Filters tasks by column status
const getTasksForColumn = (status: string) => {
  if (!tasks) return [];
  return tasks.filter((task) => task.status === status);
};

// Returns Tailwind classes for priority badge colors
const getPriorityColor = (priority: string) => {
  // Returns classes like: "bg-red-50 dark:bg-red-950/30 text-red-700..."
};

// Formats priority as single letter (U, H, M, L)
const getPriorityLabel = (priority: string) => {
  // Returns "U", "H", "M", or "L"
};

// Formats timestamp as relative time
const formatTimestamp = (timestamp: number) => {
  // Returns "Just now", "5m ago", "2h ago", or date
};

// Generates 2-letter initials from agent name
const getInitials = (name: string) => {
  // "John Doe" → "JD"
};
```

**Column Configuration:**

```typescript
const COLUMNS = [
  {
    id: 'inbox',
    title: 'INBOX',
    color: 'border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-900'
  },
  {
    id: 'assigned',
    title: 'ASSIGNED',
    color: 'border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30'
  },
  {
    id: 'in_progress',
    title: 'IN PROGRESS',
    color: 'border-teal-300 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/30'
  },
  {
    id: 'review',
    title: 'REVIEW',
    color: 'border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30'
  },
  {
    id: 'done',
    title: 'DONE',
    color: 'border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-900'
  }
];
```

**Usage:**

```typescript
import MissionQueue from "@/components/MissionQueue";

function Dashboard() {
  const [selectedTask, setSelectedTask] = useState<Id<'tasks'> | null>(null);

  return (
    <>
      <MissionQueue onTaskClick={setSelectedTask} />
      {selectedTask && (
        <DetailView taskId={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </>
  );
}
```

**Styling Notes:**
- Uses Tailwind `dark:` prefix for all color values
- Priority badges: red (urgent), orange (high), yellow (medium), green (low)
- Hover effects: `hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500`
- Fixed column widths: `min-w-[180px] max-w-[240px]`

#### AgentSidebar

**Location:** `/components/AgentSidebar.tsx`

**Purpose:** Displays all registered agents with live status indicators.

**Props:**

```typescript
interface AgentSidebarProps {
  selectedAgentId?: Id<'agents'> | null;
  onAgentClick?: (agentId: Id<'agents'>) => void;
}
```

**Features:**
- Real-time agent updates via `useQuery(api.agents.list)`
- Role badges extracted from role strings (LEAD, INT, SPC, AGT)
- Status indicators with colored dots:
  - 🔵 **active** (slate) - Agent working on a task
  - ⚪ **idle** (zinc) - Agent available
  - 🔴 **blocked** (red) - Agent waiting on dependencies
- Avatar circles with 2-letter initials
- Selected agent highlighting
- Loading skeleton during initial fetch

**Key Functions:**

```typescript
// Extracts role badge from role string
const getRoleBadge = (role: string) => {
  const roleUpper = role.toUpperCase();
  if (roleUpper.includes('LEAD')) return 'LEAD';
  if (roleUpper.includes('INT') || roleUpper.includes('INTEL')) return 'INT';
  if (roleUpper.includes('SPEC') || roleUpper.includes('SPC')) return 'SPC';
  return 'AGT';
};

// Returns Tailwind background color for status dot
const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-slate-400 dark:bg-slate-500';
    case 'idle': return 'bg-zinc-400 dark:bg-zinc-500';
    case 'blocked': return 'bg-red-400 dark:bg-red-500';
    default: return 'bg-gray-400 dark:bg-gray-500';
  }
};

// Returns Tailwind classes for role badge colors
const getRoleBadgeColor = (badge: string) => {
  switch (badge) {
    case 'LEAD': return 'bg-purple-100 dark:bg-purple-950/30 text-purple-700...';
    case 'INT': return 'bg-blue-100 dark:bg-blue-950/30 text-blue-700...';
    case 'SPC': return 'bg-orange-100 dark:bg-orange-950/30 text-orange-700...';
    default: return 'bg-gray-100 dark:bg-slate-800 text-gray-700...';
  }
};
```

**Usage:**

```typescript
import AgentSidebar from "@/components/AgentSidebar";

function Dashboard() {
  const [selectedAgent, setSelectedAgent] = useState<Id<'agents'> | null>(null);

  return (
    <AgentSidebar
      selectedAgentId={selectedAgent}
      onAgentClick={setSelectedAgent}
    />
  );
}
```

**Status Display:**
- Status text transforms: `active` → "WORKING", `idle` → "IDLE", `blocked` → "BLOCKED"
- Fixed width: `w-48` (12rem / 192px)

#### LiveFeed

**Location:** `/components/LiveFeed.tsx`

**Purpose:** Real-time activity stream with filtering capabilities.

**Props:** None

**Features:**
- Real-time activity updates via `useQuery(api.activities.recent, { limit: 50 })`
- 4 filter tabs: All, Tasks, Comments, Status
- Activity type icons (Heart, MessageSquare, CheckCircle2, AlertCircle)
- "LIVE" indicator for activities less than 30 seconds old
- Smart timestamps: LIVE → 15s → 3m → 2h → full date
- Pulsing red dot for live activities
- Hover effects and click interactions

**Key Functions:**

```typescript
// Returns appropriate Lucide icon for activity type
const getActivityIcon = (type: string) => {
  switch (type) {
    case 'agent_heartbeat': return <Heart className="h-5 w-5 text-red-500" />;
    case 'message_sent': return <MessageSquare className="h-5 w-5 text-blue-500" />;
    case 'task_created': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case 'task_assigned': return <CheckCircle2 className="h-5 w-5 text-purple-500" />;
    case 'task_status_changed': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    default: return <CheckCircle2 className="h-5 w-5 text-gray-500" />;
  }
};

// Formats timestamp with smart relative time
const formatTimestamp = (timestamp: number) => {
  const diffSecs = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSecs < 30) return 'LIVE';
  if (diffSecs < 60) return `${diffSecs}s`;
  // ... etc
};

// Checks if activity is less than 30 seconds old
const isLive = (timestamp: number) => {
  return (Date.now() - timestamp) < 30000;
};

// Filters activities based on selected tab
const filterActivities = (activities: any[]) => {
  if (activeFilter === 'all') return activities;
  if (activeFilter === 'tasks') {
    return activities.filter(a =>
      a.type.includes('task') || a.type === 'task_created' ||
      a.type === 'task_assigned' || a.type === 'task_status_changed'
    );
  }
  if (activeFilter === 'comments') {
    return activities.filter(a => a.type === 'message_sent');
  }
  if (activeFilter === 'status') {
    return activities.filter(a =>
      a.type === 'agent_heartbeat' || a.type === 'task_status_changed'
    );
  }
  return activities;
};
```

**Filter Tabs:**

```typescript
const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'comments', label: 'Comments' },
  { id: 'status', label: 'Status' }
];
```

**Usage:**

```typescript
import LiveFeed from "@/components/LiveFeed";

function Dashboard() {
  return (
    <div className="flex">
      <main>...</main>
      <LiveFeed />
    </div>
  );
}
```

**Styling Notes:**
- Fixed width: `w-64` (16rem / 256px)
- Live indicator: red text with pulsing dot
- Activity cards: hover shadow and border color change

#### DetailView

**Location:** `/components/DetailView.tsx`

**Purpose:** Modal displaying full task details with comments and status controls.

**Props:**

```typescript
interface DetailViewProps {
  taskId: Id<'tasks'> | null;
  onClose: () => void;
}
```

**Features:**
- Full task details via `useQuery(api.tasks.get, { taskId })`
- Message thread via `useQuery(api.messages.byTask, { taskId })`
- Status update buttons via `useMutation(api.tasks.updateStatus)`
- Message input field (placeholder - not yet wired to API)
- Modal overlay with close button
- Conditional status action buttons based on current status

**Key Functions:**

```typescript
// Changes task status
const handleStatusChange = async (newStatus: any) => {
  await updateStatus({ taskId, status: newStatus });
};

// Sends message (placeholder implementation)
const handleSendMessage = async () => {
  if (!newMessage.trim()) return;
  console.log('Sending message:', newMessage);
  setNewMessage('');
};

// Returns Tailwind classes for status badge colors
const getStatusColor = (status: string) => {
  switch (status) {
    case 'inbox': return 'bg-gray-100 dark:bg-slate-800 text-gray-800...';
    case 'assigned': return 'bg-blue-100 dark:bg-blue-950/30 text-blue-800...';
    case 'in_progress': return 'bg-yellow-100 dark:bg-yellow-950/30...';
    case 'review': return 'bg-purple-100 dark:bg-purple-950/30...';
    case 'done': return 'bg-green-100 dark:bg-green-950/30...';
  }
};
```

**Status Action Buttons:**

The component conditionally renders action buttons based on current task status:

```typescript
// "Start Working" button - shown if NOT in_progress, review, or done
{task.status !== 'in_progress' && task.status !== 'review' && task.status !== 'done' && (
  <button onClick={() => handleStatusChange('in_progress')}>
    Start Working
  </button>
)}

// "Request Review" button - shown if NOT review or done
{task.status !== 'review' && task.status !== 'done' && (
  <button onClick={() => handleStatusChange('review')}>
    Request Review
  </button>
)}

// "Mark Complete" button - shown if NOT done
{task.status !== 'done' && (
  <button onClick={() => handleStatusChange('done')}>
    Mark Complete
  </button>
)}
```

**Usage:**

```typescript
import { useState } from "react";
import DetailView from "@/components/DetailView";

function Dashboard() {
  const [selectedTask, setSelectedTask] = useState<Id<'tasks'> | null>(null);

  return (
    <>
      <button onClick={() => setSelectedTask("ab1c2d3e...")}>
        View Task
      </button>
      <DetailView
        taskId={selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </>
  );
}
```

**Modal Styling:**
- Full-screen overlay: `fixed inset-0 bg-black/50 dark:bg-black/70`
- Modal: `max-w-2xl w-full max-h-[90vh]`
- Scrollable content area for long discussions
- Enter key sends message

#### StatsBar

**Location:** `/components/StatsBar.tsx`

**Purpose:** Header bar with large stats display, time, and action buttons.

**Props:**

```typescript
interface StatsBarProps {
  onDocsClick?: () => void;
}
```

**Features:**
- Real-time agent count via `useQuery(api.agents.list)`
- Real-time task count via `useQuery(api.tasks.list)`
- Live updating clock with day/date display
- Large 6xl font for stat numbers
- "ONLINE" indicator with pulsing green dot
- "Docs" button
- Theme toggle button

**Key Functions:**

```typescript
// Updates clock every second
useEffect(() => {
  const updateTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
                    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const dayName = days[now.getDay()];
    const monthName = months[now.getMonth()];
    const date = now.getDate();
    setCurrentTime(`${hours}:${minutes}:${seconds} ${dayName} ${monthName} ${date}`);
  };
  updateTime();
  const interval = setInterval(updateTime, 1000);
  return () => clearInterval(interval);
}, []);

// Counts active agents (idle + active, excludes blocked)
const activeAgents = agents?.filter(a =>
  a.status === 'active' || a.status === 'idle'
).length || 0;

// Counts tasks not yet done
const tasksInQueue = tasks?.filter(t => t.status !== 'done').length || 0;
```

**Usage:**

```typescript
import StatsBar from "@/components/StatsBar";

function Dashboard() {
  const handleDocsClick = () => {
    window.open('/docs', '_blank');
  };

  return (
    <div className="h-screen flex flex-col">
      <StatsBar onDocsClick={handleDocsClick} />
      <main className="flex-1">...</main>
    </div>
  );
}
```

**Layout:**
- Fixed height: `h-20` (5rem / 80px)
- Three sections: Title (left), Stats (center), Time/Actions (right)
- Stats display: Two 6xl numbers separated by vertical divider
- Clock format: `14:32:45 WED FEB 8`

### Supporting Components

#### ThemeToggle

**Location:** `/components/theme-toggle.tsx`

**Purpose:** Button to toggle between light and dark mode.

**Features:**
- Uses `useTheme()` from next-themes
- Prevents hydration mismatch with `mounted` state
- Sun icon for dark mode (clicking switches to light)
- Moon icon for light mode (clicking switches to dark)
- Accessible button with title attribute

**Implementation:**

```typescript
"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-800 animate-pulse" />
    )
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors flex items-center justify-center"
      aria-label="Toggle theme"
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? (
        // Sun icon SVG
      ) : (
        // Moon icon SVG
      )}
    </button>
  )
}
```

**Usage:**

```typescript
import { ThemeToggle } from "@/components/theme-toggle";

<ThemeToggle />
```

#### ThemeProvider

**Location:** `/components/theme-provider.tsx`

**Purpose:** Wrapper component providing theme context from next-themes.

**Implementation:**

```typescript
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

**Usage in Root Layout:**

```typescript
// app/layout.tsx
import { ThemeProvider } from '@/components/theme-provider';

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**Props:**
- `attribute="class"`: Adds `class="dark"` to `<html>` tag
- `defaultTheme="system"`: Respects OS preference by default
- `enableSystem`: Allows "system" theme option
- `disableTransitionOnChange`: Prevents flash during theme toggle

#### ConvexClientProvider

**Location:** `/components/ConvexClientProvider.tsx`

**Purpose:** Wraps app with Convex context for real-time queries.

**Implementation:**

```typescript
'use client';

import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { ReactNode } from 'react';

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
```

**Usage:**

```typescript
// app/layout.tsx
import ConvexClientProvider from '@/components/ConvexClientProvider';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ConvexClientProvider>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
```

**Environment Variable:**
- Requires `NEXT_PUBLIC_CONVEX_URL` in `.env.local`
- Generated automatically by `npx convex dev`

### UI Components

Mission Control includes basic UI primitives for consistent styling:

- `/components/ui/badge.tsx` - Badge component for tags and labels
- `/components/ui/card.tsx` - Card component for content containers

Additional components exist but are not currently used in the main UI:

- `/components/ActivityFeed.tsx` - Alternative activity feed implementation
- `/components/AgentCards.tsx` - Card-based agent display
- `/components/DocumentPanel.tsx` - Document management panel
- `/components/TaskBoard.tsx` - Alternative task board implementation

---

## Dark Mode Implementation

Mission Control features comprehensive dark mode support using **next-themes** and **Tailwind CSS**.

### Setup and Configuration

#### 1. Install next-themes

```bash
npm install next-themes
```

#### 2. Tailwind Configuration

In `tailwind.config.js`, enable class-based dark mode:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',  // Enable class-based dark mode
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Custom CSS variables for dark mode colors
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        border: "hsl(var(--border))",
      },
    },
  },
  plugins: [],
}
```

### Theme Provider

Wrap your app with `ThemeProvider` in the root layout:

```typescript
// app/layout.tsx
import { ThemeProvider } from '@/components/theme-provider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**Important:** Add `suppressHydrationWarning` to the `<html>` tag to prevent hydration mismatches during theme initialization.

### Theme Toggle Component

The `ThemeToggle` component provides a button to switch themes:

```typescript
"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Show placeholder during SSR to prevent hydration mismatch
    return (
      <button className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-800 animate-pulse" />
    )
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
      aria-label="Toggle theme"
    >
      {/* Sun/Moon icons */}
    </button>
  )
}
```

**Key Pattern:** Always use the `mounted` state to prevent hydration mismatches. Render a placeholder during SSR, then show the actual button after client-side hydration.

### Styling Patterns

#### Using Tailwind Dark Mode Classes

Prefix any utility class with `dark:` to apply it in dark mode:

```tsx
// Light mode: white background, dark text
// Dark mode: slate-900 background, light text
<div className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100">
  Content
</div>
```

#### Color Palette

Mission Control uses this consistent color palette:

**Backgrounds:**
- Light: `bg-white`, `bg-gray-50`, `bg-gray-100`
- Dark: `dark:bg-slate-900`, `dark:bg-slate-800`, `dark:bg-slate-950`

**Text:**
- Light: `text-gray-900`, `text-gray-700`, `text-gray-600`
- Dark: `dark:text-gray-100`, `dark:text-gray-300`, `dark:text-gray-400`

**Borders:**
- Light: `border-gray-200`, `border-gray-300`
- Dark: `dark:border-slate-700`, `dark:border-slate-600`

**Colored Backgrounds (with dark variants):**
- Blue: `bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400`
- Red: `bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400`
- Orange: `bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400`
- Green: `bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400`
- Purple: `bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400`

**Note:** Use `/30` opacity for dark mode colored backgrounds to prevent oversaturation.

#### Example: Task Card with Dark Mode

```tsx
<div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-3">
  <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">
    {task.title}
  </h4>
  <p className="text-xs text-gray-600 dark:text-gray-400">
    {task.description}
  </p>
  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 rounded text-xs">
    {task.status}
  </span>
</div>
```

### Adding Dark Mode to New Components

**Checklist for dark mode support:**

1. ✅ Add `dark:` variants for all background colors
2. ✅ Add `dark:` variants for all text colors
3. ✅ Add `dark:` variants for all border colors
4. ✅ Add `dark:` variants for all hover/focus states
5. ✅ Use `/30` opacity for colored backgrounds in dark mode
6. ✅ Test both light and dark modes
7. ✅ Check for hydration mismatches (use `mounted` pattern if needed)

**Template for a new component:**

```tsx
'use client';

export default function MyComponent() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
        Title
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Description
      </p>
      <button className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white">
        Action
      </button>
    </div>
  );
}
```

### Troubleshooting Dark Mode

**Hydration Mismatch Errors:**

```
Warning: Prop `className` did not match. Server: "bg-white" Client: "bg-white dark:bg-slate-900"
```

**Solution:** Use the `mounted` pattern:

```typescript
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

if (!mounted) {
  return <div>Loading...</div>; // Or skeleton
}

// Now safe to render theme-dependent content
```

**Theme Not Persisting:**

- Ensure `ThemeProvider` wraps your entire app
- Check localStorage for `theme` key
- Verify `attribute="class"` is set on `ThemeProvider`

**Dark Mode Not Working:**

- Check `tailwind.config.js` has `darkMode: 'class'`
- Verify `dark:` prefixes are used on all color classes
- Ensure `<html suppressHydrationWarning>` is present

---

## Environment & Configuration

### Environment Variables

Create a `.env.local` file in the project root:

```bash
# Convex Backend URL (auto-generated by `npx convex dev`)
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
```

**Important:** This file is auto-generated when you run `npx convex dev` for the first time. Do not commit it to version control (already in `.gitignore`).

### Convex Configuration

Convex is configured via `convex.json` (auto-generated):

```json
{
  "functions": "convex/"
}
```

This tells Convex where to find your backend functions.

### Tailwind Configuration

See `tailwind.config.js` for the complete configuration. Key features:

- Dark mode: `darkMode: 'class'`
- Content paths: `app/**/*.{js,ts,jsx,tsx}` and `components/**/*.{js,ts,jsx,tsx}`
- Extended colors with CSS variables

### TypeScript Configuration

The project uses standard Next.js TypeScript configuration with:

- `strict: true` for type safety
- Path alias `@/*` pointing to project root
- Target: ES2020

### PostCSS Configuration

Standard Next.js + Tailwind setup in `postcss.config.js`:

```javascript
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

---

## Development Setup

### Prerequisites

- **Node.js** 18+ and npm
- **Convex account** (free tier available at [convex.dev](https://convex.dev))

### Installation Steps

1. **Clone the repository:**

```bash
git clone https://github.com/michaelemmanuel16/mission-control-ui.git
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

This command will:
- Prompt you to create a Convex project (or link to existing)
- Generate `.env.local` with `NEXT_PUBLIC_CONVEX_URL`
- Deploy the database schema and functions
- Start the Convex development server

**First-time setup prompts:**
- "Create a new project?" → Yes
- "Project name?" → mission-control-ui (or your choice)
- The CLI will display your deployment URL

4. **Start the Next.js dev server:**

Open a **second terminal** and run:

```bash
npm run dev
```

5. **Open the app:**

Navigate to [http://localhost:3000](http://localhost:3000)

### Development Workflow

**Two terminals running simultaneously:**

```
Terminal 1: npx convex dev     (Convex backend, runs on port 3210)
Terminal 2: npm run dev        (Next.js frontend, runs on port 3000)
```

**Hot Reload Behavior:**

- **Frontend changes**: Next.js hot reloads automatically
- **Backend changes**: Convex re-deploys functions automatically
- **Schema changes**: Convex re-deploys and validates data

### Code Organization

```
mission-control-ui/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Main dashboard page
│   └── globals.css         # Global styles
├── components/
│   ├── MissionQueue.tsx    # Kanban board
│   ├── AgentSidebar.tsx    # Agent list
│   ├── LiveFeed.tsx        # Activity feed
│   ├── DetailView.tsx      # Task detail modal
│   ├── StatsBar.tsx        # Header stats
│   ├── theme-toggle.tsx    # Theme toggle button
│   ├── theme-provider.tsx  # Theme context provider
│   └── ConvexClientProvider.tsx  # Convex context provider
├── convex/
│   ├── schema.ts           # Database schema
│   ├── tasks.ts            # Task API
│   ├── agents.ts           # Agent API
│   ├── messages.ts         # Message API
│   ├── activities.ts       # Activity API
│   └── documents.ts        # Document API
├── .env.local              # Environment variables (generated)
├── convex.json             # Convex config (generated)
├── tailwind.config.js      # Tailwind config
├── tsconfig.json           # TypeScript config
└── package.json            # Dependencies and scripts
```

### Adding New Features

**1. Add a new Convex function:**

```typescript
// convex/myFeature.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const myFunction = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    // Implementation
  }
});
```

**2. Use it in a component:**

```typescript
'use client';

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function MyComponent() {
  const myFunction = useMutation(api.myFeature.myFunction);

  const handleClick = async () => {
    await myFunction({ name: "test" });
  };

  return <button onClick={handleClick}>Click</button>;
}
```

**3. Test locally:**

- Convex dev server will auto-deploy your new function
- Refresh the browser to see changes

### Database Schema Changes

When modifying `convex/schema.ts`:

1. Edit the schema
2. Convex dev server automatically detects changes
3. Convex validates existing data against new schema
4. If validation fails, you'll see errors in the terminal
5. Fix issues and re-save

**Example: Adding a new field:**

```typescript
// Before
tasks: defineTable({
  title: v.string(),
  description: v.string(),
})

// After
tasks: defineTable({
  title: v.string(),
  description: v.string(),
  estimatedHours: v.optional(v.number()),  // New field
})
```

**Tip:** Always make new fields optional (`v.optional()`) to avoid breaking existing data.

---

## Deployment

### Local Development

See [Development Setup](#development-setup) for complete instructions.

**Quick start:**

```bash
# Terminal 1
npx convex dev

# Terminal 2
npm run dev
```

### Production Deployment to Vercel

Mission Control is optimized for deployment on **Vercel**, Next.js's native platform.

#### Step 1: Push to GitHub

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

#### Step 2: Create Production Convex Deployment

```bash
npx convex deploy
```

This command:
- Creates a new **production** Convex deployment (separate from dev)
- Deploys your schema and functions
- Outputs a production URL like: `https://your-project-prod.convex.cloud`

**Important:** Copy this production URL - you'll need it for Vercel.

#### Step 3: Import Project to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"New Project"**
3. Import your GitHub repository
4. Vercel auto-detects Next.js configuration

#### Step 4: Configure Environment Variables

Before clicking "Deploy":

1. Click **"Environment Variables"**
2. Add the following variable:

```
Name:  NEXT_PUBLIC_CONVEX_URL
Value: https://your-project-prod.convex.cloud
```

3. Ensure it's selected for **Production**, **Preview**, and **Development**

#### Step 5: Deploy

1. Click **"Deploy"**
2. Vercel builds and deploys your application
3. You'll receive a URL like: `https://mission-control-ui.vercel.app`

#### Step 6: Verify Deployment

1. Open your Vercel URL
2. Check browser console for errors
3. Verify real-time updates are working
4. Test creating a task and check if it appears immediately

**Troubleshooting Deployment Issues:**

- **"Convex connection error"**: Check that `NEXT_PUBLIC_CONVEX_URL` is set correctly
- **"Functions not found"**: Run `npx convex deploy` again to ensure production deployment
- **"Dark mode not working"**: Ensure Tailwind is configured correctly and build completed

### Alternative Deployment Platforms

Mission Control can be deployed to any platform that supports Next.js:

**Netlify:**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod
```

**Railway:**

1. Create new project on [railway.app](https://railway.app)
2. Connect GitHub repository
3. Add environment variable: `NEXT_PUBLIC_CONVEX_URL`
4. Deploy

**Self-Hosted:**

```bash
# Build for production
npm run build

# Start production server
npm start
```

**Docker:**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
ENV PORT=3000
EXPOSE 3000
CMD ["npm", "start"]
```

### CI/CD Considerations

**Automated Convex Deployments:**

You can automate Convex deployments in your CI/CD pipeline:

```bash
# In your CI script
npx convex deploy --cmd 'npm run build'
```

**Environment-Specific Deployments:**

- **Development**: `npx convex dev` (local)
- **Staging**: `npx convex deploy --preview` (preview deployment)
- **Production**: `npx convex deploy` (production deployment)

**Vercel Auto-Deployments:**

- **Main branch** → Production deployment
- **Feature branches** → Preview deployments
- Set `NEXT_PUBLIC_CONVEX_URL` differently for preview vs. production if needed

---

## Features Deep Dive

### Task Management

Mission Control implements a **status-driven Kanban workflow**.

#### Status Flow

```
INBOX → ASSIGNED → IN PROGRESS → REVIEW → DONE
         ↓                          ↑
      BLOCKED ←───────────────────┘
```

**Status Descriptions:**

- **inbox**: Newly created tasks awaiting assignment
- **assigned**: Task assigned to one or more agents, not yet started
- **in_progress**: Agent actively working on task
- **review**: Work completed, awaiting review/approval
- **done**: Task completed and approved
- **blocked**: Task cannot proceed due to dependencies

#### Priority System

Four priority levels affect visual display and sorting:

| Priority | Badge Color | Use Case |
|----------|------------|----------|
| **urgent** | Red (U) | Critical issues requiring immediate attention |
| **high** | Orange (H) | Important tasks that should be completed soon |
| **medium** | Yellow (M) | Standard priority (default) |
| **low** | Green (L) | Tasks that can be deferred |

**Badge Implementation:**

```typescript
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
    case 'high':
      return 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400';
    case 'medium':
      return 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400';
    case 'low':
      return 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400';
  }
};
```

#### Tagging System

Tasks support optional string tags for categorization:

```typescript
// Creating a task with tags
await createTask({
  title: "Fix login bug",
  description: "Users cannot log in after password reset",
  priority: "urgent",
  tags: ["bug", "authentication", "critical"]
});
```

**Tag Display:**
- Shows first 3 tags on task card
- Displays "+N" badge if more than 3 tags
- Tags truncate at 80px width with ellipsis

#### Assignment Logic

Tasks can be assigned to **multiple agents**:

```typescript
// Assign to multiple agents
await assignTask({
  taskId: "ab1c2d3e...",
  agentIds: ["agent1", "agent2", "agent3"]
});
```

**Assignment Side Effects:**
1. Task status changes to `"assigned"`
2. Notification created for each agent
3. Activity logged: `"Task assigned to N agent(s)"`
4. Task appears in each agent's assigned tasks

### Agent System

Mission Control tracks agents with real-time status monitoring.

#### Registration and Heartbeat

**Registration (idempotent):**

```typescript
const agentId = await registerAgent({
  name: "Kai",
  role: "Squad Lead",
  sessionKey: "agent:kai:main"
});
```

- If agent with `sessionKey` exists, returns existing ID
- Otherwise creates new agent with `status: "idle"`

**Heartbeat (every 30-60 seconds):**

```typescript
await updateHeartbeat({
  sessionKey: "agent:kai:main",
  status: "active",
  currentTaskId: "ab1c2d3e..."
});
```

**Heartbeat Pattern:**

```typescript
// Agent client code
setInterval(async () => {
  await ctx.runMutation(api.agents.updateHeartbeat, {
    sessionKey: AGENT_SESSION_KEY,
    status: currentStatus,
    currentTaskId: currentTaskId
  });
}, 30000); // Every 30 seconds
```

#### Role Badges

Role badges are extracted from the agent's role string:

| Role String Contains | Badge | Color |
|---------------------|-------|-------|
| "LEAD" | LEAD | Purple |
| "INT" or "INTEL" | INT | Blue |
| "SPEC" or "SPC" | SPC | Orange |
| Other | AGT | Gray |

**Example:**

```typescript
"Squad Lead" → LEAD badge (purple)
"Ad Intelligence Specialist" → INT badge (blue)
"Customer Researcher" → AGT badge (gray)
```

#### Status Tracking

Three status levels:

1. **idle**: Agent available for new assignments
2. **active**: Agent working on a task
3. **blocked**: Agent waiting on dependencies

**Status Display:**

```typescript
const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-slate-400 dark:bg-slate-500'; // Gray dot
    case 'idle': return 'bg-zinc-400 dark:bg-zinc-500';     // Light gray dot
    case 'blocked': return 'bg-red-400 dark:bg-red-500';    // Red dot
  }
};
```

**Status Text:**
- `active` → "WORKING"
- `idle` → "IDLE"
- `blocked` → "BLOCKED"

### Activity Feed

The activity feed provides a real-time audit trail of all system events.

#### Activity Types

Six activity types tracked:

1. **task_created**: New task added
   - Icon: Green CheckCircle2
   - Example: "Task created: Implement dark mode"

2. **task_assigned**: Task assigned to agents
   - Icon: Purple CheckCircle2
   - Example: "Task assigned to 2 agent(s)"

3. **task_status_changed**: Status transition
   - Icon: Yellow AlertCircle
   - Example: "Status changed to in_progress"

4. **message_sent**: Comment posted
   - Icon: Blue MessageSquare
   - Example: "New comment posted"

5. **document_created**: Document uploaded
   - Icon: Gray CheckCircle2
   - Example: "Document uploaded: Implementation Report"

6. **agent_heartbeat**: Agent heartbeat ping
   - Icon: Red Heart
   - Example: "Kai heartbeat"
   - Note: Typically filtered out in UI

#### Live Indicators

Activities less than **30 seconds old** are marked as "LIVE":

```typescript
const isLive = (timestamp: number) => {
  return (Date.now() - timestamp) < 30000;
};
```

**Live Display:**
- Text: "LIVE" in red bold
- Indicator: Pulsing red dot
- Updates automatically as time passes

#### Filter System

Four filter options:

1. **All**: Shows all activities
2. **Tasks**: Shows task_created, task_assigned, task_status_changed
3. **Comments**: Shows message_sent only
4. **Status**: Shows agent_heartbeat and task_status_changed

**Filter Implementation:**

```typescript
const filterActivities = (activities: any[]) => {
  if (activeFilter === 'all') return activities;
  if (activeFilter === 'tasks') {
    return activities.filter(a =>
      a.type === 'task_created' ||
      a.type === 'task_assigned' ||
      a.type === 'task_status_changed'
    );
  }
  // ... etc
};
```

### Real-time Synchronization

Mission Control achieves **instant updates** through Convex's reactive queries.

#### Convex Subscriptions

Every `useQuery` hook creates a WebSocket subscription:

```typescript
const tasks = useQuery(api.tasks.list);
// ^ Subscribes to all changes in the tasks table
```

**How it works:**

1. Component calls `useQuery`
2. Convex establishes WebSocket connection
3. Initial data returned immediately
4. Any database changes trigger re-query
5. Component re-renders with new data

#### WebSocket Connections

Convex manages a single WebSocket connection per client:

```
Browser ←──WebSocket──→ Convex Backend
   │                          │
   ├─ useQuery(tasks.list)   │
   ├─ useQuery(agents.list)  │
   └─ useQuery(activities.recent)
```

All subscriptions multiplex over one connection.

#### Live Query Updates

**Example: Task Status Change**

```typescript
// User clicks "Start Working" button
await updateStatus({ taskId: "abc", status: "in_progress" });

// Convex processes mutation:
// 1. Updates task status in database
// 2. Logs activity
// 3. Notifies all subscribed clients

// All connected browsers update automatically:
// - MissionQueue: Task moves to "IN PROGRESS" column
// - DetailView: Status badge updates
// - LiveFeed: New "Status changed" activity appears
// - StatsBar: Task count may update

// NO manual refresh needed!
```

**Latency:** Typically 50-200ms from mutation to UI update.

#### Optimistic Updates

While Convex handles updates automatically, you can implement optimistic updates for instant feedback:

```typescript
const updateStatus = useMutation(api.tasks.updateStatus);

const handleStatusChange = async (newStatus: string) => {
  // Optimistic update
  setLocalStatus(newStatus);

  try {
    await updateStatus({ taskId, status: newStatus });
    // Convex will re-query and confirm the change
  } catch (error) {
    // Revert on error
    setLocalStatus(originalStatus);
  }
};
```

**Note:** Mission Control doesn't currently use optimistic updates since Convex's latency is already very low.

---

## Troubleshooting

### Common Issues

#### 1. Convex Connection Errors

**Error:** `ConvexError: Failed to connect to Convex`

**Causes:**
- `NEXT_PUBLIC_CONVEX_URL` not set
- Convex dev server not running
- Network/firewall issues

**Solutions:**

```bash
# Check environment variable
cat .env.local

# Should show:
# NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud

# Restart Convex dev server
npx convex dev

# Check Convex dashboard
open https://dashboard.convex.dev
```

#### 2. Port Already in Use

**Error:** `Error: Port 3000 is already in use`

**Solution:**

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use a different port
npm run dev -- -p 3001
```

#### 3. TypeScript Compilation Errors

**Error:** `Type 'X' is not assignable to type 'Y'`

**Common causes:**
- Convex generated types out of sync
- Missing type imports

**Solutions:**

```bash
# Regenerate Convex types
npx convex dev

# This regenerates convex/_generated/ folder

# Restart TypeScript server in VS Code
# Command Palette → "TypeScript: Restart TS Server"
```

#### 4. Dark Mode Hydration Issues

**Error:** `Warning: Prop className did not match. Server: "..." Client: "..."`

**Cause:** Theme-dependent rendering before hydration

**Solution:**

```typescript
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

if (!mounted) {
  return <div className="bg-white">Loading...</div>; // No dark: classes
}

// Now safe to use dark: classes
return <div className="bg-white dark:bg-slate-900">Content</div>;
```

#### 5. Real-time Updates Not Working

**Symptoms:**
- UI doesn't update when data changes
- Have to refresh page to see updates

**Causes:**
- Missing `'use client'` directive
- Not using Convex hooks
- Query not returning data

**Solutions:**

```typescript
// ❌ Wrong - won't update
async function MyComponent() {
  const tasks = await fetch('/api/tasks');
  return <div>{tasks.length}</div>;
}

// ✅ Correct - updates automatically
'use client';
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

function MyComponent() {
  const tasks = useQuery(api.tasks.list);
  return <div>{tasks?.length || 0}</div>;
}
```

#### 6. Deployment Failures

**Error:** `Build failed: Module not found`

**Causes:**
- Missing dependencies
- Import path errors
- Environment variables not set

**Solutions:**

```bash
# Verify all dependencies installed
npm install

# Check import paths (use @ alias)
# ❌ import { api } from "../convex/_generated/api"
# ✅ import { api } from "@/convex/_generated/api"

# Verify environment variables in Vercel
# Settings → Environment Variables
```

#### 7. Schema Validation Errors

**Error:** `Validator returned error: Expected string, got undefined`

**Cause:** Schema doesn't match existing data

**Solution:**

```typescript
// Make field optional if adding to existing schema
agents: defineTable({
  name: v.string(),
  role: v.string(),
  newField: v.optional(v.string()),  // Add as optional
})

// Or migrate existing data first
```

### Getting Help

If you encounter issues not covered here:

1. Check [Convex docs](https://docs.convex.dev)
2. Check [Next.js docs](https://nextjs.org/docs)
3. Check browser console for errors
4. Check Convex dashboard logs
5. Open an issue on GitHub

---

## Code Examples

### Creating a Task

```typescript
'use client';

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";

function CreateTaskForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");

  const createTask = useMutation(api.tasks.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const taskId = await createTask({
      title,
      description,
      priority,
      tags: ["new", "unassigned"]
    });

    console.log("Created task:", taskId);

    // Reset form
    setTitle("");
    setDescription("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title"
        required
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Task description"
        required
      />
      <select value={priority} onChange={(e) => setPriority(e.target.value as any)}>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="urgent">Urgent</option>
      </select>
      <button type="submit">Create Task</button>
    </form>
  );
}
```

### Registering an Agent

```typescript
'use client';

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect } from "react";

function AgentRegistration() {
  const registerAgent = useMutation(api.agents.register);
  const updateHeartbeat = useMutation(api.agents.updateHeartbeat);

  useEffect(() => {
    // Register on mount
    const register = async () => {
      const agentId = await registerAgent({
        name: "Kai",
        role: "Squad Lead",
        sessionKey: "agent:kai:main"
      });
      console.log("Registered agent:", agentId);
    };

    register();

    // Send heartbeat every 30 seconds
    const interval = setInterval(async () => {
      await updateHeartbeat({
        sessionKey: "agent:kai:main",
        status: "idle"
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [registerAgent, updateHeartbeat]);

  return <div>Agent: Kai (Squad Lead)</div>;
}
```

### Posting a Message

```typescript
'use client';

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";

function MessageThread({ taskId }: { taskId: Id<"tasks"> }) {
  const [message, setMessage] = useState("");

  const messages = useQuery(api.messages.byTask, { taskId });
  const postMessage = useMutation(api.messages.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await postMessage({
      taskId,
      fromAgentId: "jd7x8k9m..." as Id<"agents">, // Replace with actual agent ID
      content: message
    });

    setMessage("");
  };

  return (
    <div>
      <div className="messages">
        {messages?.map((msg) => (
          <div key={msg._id}>
            <strong>{msg.fromAgent.name}:</strong> {msg.content}
            <small>{new Date(msg.createdAt).toLocaleString()}</small>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
```

### Querying Activities

```typescript
'use client';

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

function ActivityLog() {
  const activities = useQuery(api.activities.recent, { limit: 20 });

  const isLive = (timestamp: number) => {
    return (Date.now() - timestamp) < 30000;
  };

  return (
    <div>
      <h2>Recent Activity</h2>
      {activities?.map((activity) => (
        <div key={activity._id}>
          <span>{activity.message}</span>
          {activity.agent && <span> by {activity.agent.name}</span>}
          {isLive(activity.createdAt) && (
            <span className="text-red-600 font-bold">LIVE</span>
          )}
          <time>{new Date(activity.createdAt).toLocaleString()}</time>
        </div>
      ))}
    </div>
  );
}
```

### Adding a New Component with Dark Mode

```typescript
'use client';

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function TaskStats() {
  const tasks = useQuery(api.tasks.list);

  const stats = {
    total: tasks?.length || 0,
    inbox: tasks?.filter(t => t.status === 'inbox').length || 0,
    inProgress: tasks?.filter(t => t.status === 'in_progress').length || 0,
    done: tasks?.filter(t => t.status === 'done').length || 0,
  };

  return (
    <div className="p-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg">
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
        Task Statistics
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {stats.total}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Tasks
          </div>
        </div>

        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded">
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
            {stats.inbox}
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400">
            In Inbox
          </div>
        </div>

        <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded">
          <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
            {stats.inProgress}
          </div>
          <div className="text-sm text-yellow-600 dark:text-yellow-400">
            In Progress
          </div>
        </div>

        <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded">
          <div className="text-2xl font-bold text-green-700 dark:text-green-400">
            {stats.done}
          </div>
          <div className="text-sm text-green-600 dark:text-green-400">
            Completed
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Database Mutations

```typescript
// convex/myFeature.ts
import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const updateTaskPriority = mutation({
  args: {
    taskId: v.id("tasks"),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    )
  },
  handler: async (ctx, args) => {
    // Get existing task
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    // Update priority
    await ctx.db.patch(args.taskId, {
      priority: args.priority,
      updatedAt: Date.now()
    });

    // Log activity
    await ctx.db.insert("activities", {
      type: "task_status_changed",
      taskId: args.taskId,
      message: `Priority changed to ${args.priority}`,
      createdAt: Date.now()
    });

    return { success: true };
  }
});
```

---

## Project Metadata

### Version Information

- **Version:** 0.1.0
- **Last Updated:** February 8, 2026
- **License:** MIT
- **Repository:** [michaelemmanuel16/mission-control-ui](https://github.com/michaelemmanuel16/mission-control-ui)

### Dependencies

**Production Dependencies (6):**

```json
{
  "convex": "^1.31.7",
  "lucide-react": "^0.563.0",
  "next": "16.1.6",
  "next-themes": "^0.4.6",
  "react": "19.2.3",
  "react-dom": "19.2.3"
}
```

**Development Dependencies (10):**

```json
{
  "@tailwindcss/postcss": "^4",
  "@types/node": "^20",
  "@types/react": "^19",
  "@types/react-dom": "^19",
  "autoprefixer": "^10.4.24",
  "eslint": "^9",
  "eslint-config-next": "16.1.6",
  "postcss": "^8.5.6",
  "tailwindcss": "^3.4.19",
  "typescript": "^5"
}
```

### Scripts

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint"
}
```

### File Structure Summary

- **Total Files:** ~30 source files
- **Lines of Code:** ~2,500+ lines
- **Components:** 14+ React components
- **API Functions:** 18+ Convex mutations/queries
- **Database Tables:** 6 tables
- **Configuration Files:** 7 config files

### Browser Support

- **Chrome/Edge:** Latest 2 versions
- **Firefox:** Latest 2 versions
- **Safari:** Latest 2 versions
- **Mobile:** iOS Safari, Chrome Android

### Performance Metrics

- **First Contentful Paint:** < 1.5s
- **Time to Interactive:** < 3s
- **WebSocket Connection:** 50-200ms latency
- **Real-time Update Latency:** 50-200ms

### Known Limitations

1. Message sending in DetailView is placeholder (logs to console)
2. Document management UI exists but not integrated into main dashboard
3. Agent removal doesn't handle cleanup of assigned tasks
4. No pagination for activity feed (limited to 50 items)
5. No search/filter on main task board

### Future Enhancements

- Add task search and filtering
- Implement drag-and-drop for task status changes
- Add document panel to main dashboard
- Add agent performance analytics
- Add email notifications for task assignments
- Add file upload support for task attachments
- Add keyboard shortcuts for common actions

---

**End of Documentation**

For questions or contributions, please open an issue on [GitHub](https://github.com/michaelemmanuel16/mission-control-ui/issues).
