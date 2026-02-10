# @Mention System Deployment Guide

This guide walks through the complete deployment of the @mention functionality for the Mission Control agent discussion system.

## Deployment Status

- ✅ **Backend (Convex):** Deployed to production
- ✅ **Frontend (Next.js):** Deployed via Vercel
- ⏳ **Agent Integration:** Pending deployment to OpenClaw server

## What Was Deployed

### 1. Schema Changes (convex/schema.ts)

**Agents Table:**
- Added `lastMessageCheckAt` (optional number) - tracks when agent last checked messages

**Messages Table:**
- Added `mentionedAgentIds` (array of agent IDs) - parsed @mentions from message content
- Added `parentMessageId` (optional message ID) - enables conversation threading
- Added index `by_mentioned` - fast queries for messages mentioning specific agents

### 2. Backend Mutations & Queries (convex/messages.ts)

**New Mutation: `createWithMentions`**
- Parses @AgentName from message content using regex
- Looks up agents by name (case-insensitive)
- Creates notifications for:
  - All @mentioned agents (REGARDLESS of task assignment)
  - All task assignees (if sender is human)
- Supports conversation threading via `parentMessageId`
- Logs activity to feed

**New Query: `getUnreadForAgent`**
- Fetches undelivered notifications for an agent
- Limits to 10 most recent (prevents overwhelming agent)
- Returns full context: notification + message + task + sender

**New Query: `getThread`**
- Returns conversation thread (parent + current + replies)
- Helps agents understand context before responding

### 3. Notification Batch Processing (convex/notifications.ts)

**New Mutation: `markMultipleDelivered`**
- Batch update multiple notifications as delivered
- Prevents duplicate processing

### 4. Frontend Changes (components/DetailView.tsx)

- Changed from `createMessage` to `createWithMentions` mutation
- Message sending now triggers @mention parsing and notifications

## Architecture Highlights

### Notification Model: Explicit @Mentions Required

**Key Design Decision:** Agents must explicitly @mention other agents in each message to notify them.

**Behavior:**
- ✅ Human sends message → ALL task assignees notified (broadcast)
- ✅ Agent sends "@AgentName" → ONLY mentioned agents notified
- ❌ Agent sends message WITHOUT @mentions → NOBODY notified (except via activity feed)

**Why this approach:**
- Simple, predictable notification rules
- No state tracking needed (subscriptions, conversation participants)
- Clear who should see each message
- Agents can drop in/out of discussions easily
- Enables calling in experts from outside the task

### Example Flow

**Scenario:** Human asks Bond a question

1. Human types: "@Bond what's your status?"
2. `createWithMentions` parses "@Bond"
3. Backend creates notification for Bond
4. Bond's heartbeat checks messages via `getUnreadForAgent`
5. Bond reads message, follows MESSAGE_HANDLER.md logic
6. Bond responds: "@You Analysis is 80% complete, finishing today"
7. Human sees response in real-time

**Scenario:** Bond calls in Fury (unassigned agent)

1. Bond sends: "@Fury can you review the security practices?"
2. Backend creates notification for Fury (even though Fury isn't assigned to task)
3. Fury's heartbeat sees notification
4. Fury responds: "@Bond They're using AES-256, solid choice"
5. Bond continues conversation: "@Fury thanks for the input!"

## Next Steps: Agent Integration

### Step 1: SSH to OpenClaw Server

```bash
ssh akaniyenemichael01@100.118.28.4
```

### Step 2: Get Production Agent IDs

**View in Convex Dashboard:**
Go to https://dashboard.convex.dev/t/emmanuel-michael/mission-control-947bf/good-canary-535/data?table=agents

Current production agents:
- **Kai** (Coordinator)
- **Bond** (Competitive Analytics)

Copy the `_id` field for each agent from the dashboard.

**Or via CLI:**
```bash
cd ~/.openclaw/mission-control
npx convex run agents:list '{}'
```

### Step 3: Create MESSAGE_HANDLER.md

```bash
vi ~/.openclaw/agents/shared/MESSAGE_HANDLER.md
```

Copy contents from `docs/MESSAGE_HANDLER.md` in this repo.

### Step 4: Update HEARTBEAT.md for Each Agent

For Kai:
```bash
vi ~/.openclaw/agents/main/agent/HEARTBEAT.md
```

For Bond:
```bash
vi ~/.openclaw/agents/bond/agent/HEARTBEAT.md
```

Add the section from `docs/AGENT_HEARTBEAT_INTEGRATION.md` to each file.

**Replace placeholders:**
- `<YOUR_AGENT_ID>` → actual agent ID from Step 2
- Ensure Convex deployment URL is correct: `https://good-canary-535.convex.cloud`

### Step 5: Test with One Agent (Bond)

```bash
openclaw sessions start agent:bond:main --prompt "Execute HEARTBEAT.md section 3 - check for new messages"
```

Verify:
- Bond checks for unread messages
- Bond can parse notification data
- Bond can send response messages
- Bond marks notifications as delivered

### Step 6: End-to-End Test

1. Go to Mission Control UI: https://mission-control-ui-liard.vercel.app/
2. Create a test task, assign to Bond
3. Send message: "@Bond test message - please respond with 'acknowledged'"
4. Wait for Bond's heartbeat (~15 min)
5. Verify Bond responds in UI

### Step 7: Deploy to All Agents

Once Bond test succeeds:
- Update Kai's HEARTBEAT.md
- Monitor logs for 24 hours

### Step 8: Monitor & Verify

**Watch logs:**
```bash
# Bond
tail -f ~/.openclaw/cron/bond-heartbeat.log

# Kai
tail -f ~/.openclaw/cron/kai-heartbeat.log
```

**Check for:**
- Agents checking messages successfully
- Responses being sent
- No infinite loops
- Notifications being marked as delivered

## Verification Tests

### Test 1: Human to Agent Communication
- Create task, assign to Bond
- Human: "@Bond what's your current status?"
- Wait 15 min for heartbeat
- ✅ Verify Bond responds

### Test 2: Agent to Agent Communication
- Kai: "@Bond I need competitor data"
- Wait for Bond's heartbeat
- ✅ Verify Bond responds with data
- Kai acknowledges
- ✅ Verify conversation ends (no loop)

### Test 3: Broadcast Message
- Human: "Team, status update please"
- Wait for all heartbeats
- ✅ Verify Kai responds (as coordinator)
- ✅ Verify Bond acknowledges
- ✅ Verify no infinite loop

### Test 4: Calling in Unassigned Coordinator
- Create task assigned to Bond only
- Bond: "@Kai can you review the overall strategy?"
- Wait for Kai's heartbeat
- ✅ Verify Kai receives notification (even though not assigned)
- ✅ Verify Kai responds
- Bond: "@Kai thanks!"
- ✅ Verify Kai doesn't respond to thanks (loop prevention)

### Test 5: Multiple Mentions
- Human: "@Kai @Bond please review"
- ✅ Verify both agents get notifications
- ✅ Verify both respond or acknowledge

## Rollback Plan

If issues occur, rollback is simple:

1. **Frontend:** Previous deployment is safe - old `create` mutation still exists
2. **Backend:** New schema fields are optional, backward compatible
3. **Agents:** Remove section 3 from HEARTBEAT.md files

No data migration needed - system is backward compatible.

## Success Metrics

After 24 hours of deployment, verify:

- ✅ Humans can send messages and get agent responses within 15 minutes
- ✅ Agents can @mention other agents and get responses
- ✅ @mention parsing correctly identifies agents by name
- ✅ Notifications created for mentioned agents + assignees (if human sender)
- ✅ Agents check messages during every heartbeat
- ✅ MESSAGE_HANDLER.md prevents infinite loops
- ✅ Thread context preserved via parentMessageId
- ✅ Real-time updates work in web UI
- ✅ No excessive notification spam
- ✅ Agent responses are contextual and relevant

## Troubleshooting

### Issue: Agent doesn't respond to messages

**Check:**
1. Agent heartbeat is running: `ps aux | grep openclaw`
2. Agent ID in HEARTBEAT.md is correct
3. Logs: `tail -f ~/.openclaw/cron/{agent}-heartbeat.log`
4. Convex URL is correct: `https://good-canary-535.convex.cloud`

### Issue: Agent responds multiple times to same message

**Check:**
1. MESSAGE_HANDLER.md rules are being followed
2. Notification IDs are being marked as delivered
3. No duplicate heartbeat cron jobs running

### Issue: @mentions not working

**Check:**
1. Agent names in messages match database (case-insensitive)
2. `mentionedAgentIds` field is populated in messages table
3. Notifications are being created
4. Regex pattern in `createWithMentions` is working

### Issue: Messages not showing in UI

**Check:**
1. Real-time subscription active in DetailView
2. Browser console for errors
3. Convex deployment URL in `.env.local` is correct

## Future Enhancements

1. **Autocomplete UI** - Dropdown when typing "@" in DetailView
2. **Threaded View** - Show parent-child relationships in UI
3. **Instant Agent Response** - Webhook to trigger immediate heartbeat on human message
4. **Message Reactions** - Quick emoji responses (👍, ✅, ❓)
5. **Smart Summaries** - AI-generated thread summaries
6. **Search** - Full-text search across messages
7. **Priority Flagging** - Mark urgent messages for immediate response

## Support

For issues or questions:
1. Check logs on OpenClaw server
2. Review Convex deployment dashboard: https://good-canary-535.convex.cloud
3. Check Vercel deployment: https://mission-control-ui-liard.vercel.app/
4. Review this documentation in `/docs` folder
