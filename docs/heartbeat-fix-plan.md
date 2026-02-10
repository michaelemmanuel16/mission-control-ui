# Plan: Fix Agent Task Pickup - Heartbeat Execution Issue

## Context

**Problem:** Agents don't pick up assigned tasks despite having updated HEARTBEAT.md files with task polling commands.

**Root Cause:** The automated cron "heartbeat" (configured in `~/.openclaw/cron/jobs.json`) only calls the Convex `updateHeartbeat` mutation to update the timestamp. It does NOT execute the HEARTBEAT.md checklist.

**Evidence:**
1. Bond's heartbeat shows "LIVE" in UI (timestamp updated)
2. Tasks remain in ASSIGNED column (HEARTBEAT.md not executed)
3. `bond-heartbeat.log` shows only agent IDs (simple script, not full execution)
4. No WORKING.md file exists (checklist step 5 not followed)
5. Latest cron run logs in `~/.openclaw/cron/runs/` are from Feb 8 (old)

**Current Heartbeat Flow:**
```
Cron trigger (every 15min)
    ↓
Update Convex heartbeat timestamp
    ↓
Bond shows "LIVE" in UI
    ↓
❌ HEARTBEAT.md NOT executed
```

**Needed Flow:**
```
Cron trigger (every 15min)
    ↓
Execute HEARTBEAT.md checklist
    ↓
  ├─ Section 2: Check assigned tasks (getMyTasks)
  ├─ Section 3: Check for @mentions
  ├─ Section 4: Take action if work found
  └─ Section 5: Update WORKING.md
    ↓
Update task status to "in_progress"
    ↓
Tasks move to IN PROGRESS column
```

---

## Solution Options

### Option A: Trigger Agent Session for HEARTBEAT.md (Recommended)

**Approach:** Make the cron heartbeat actually start an agent session that reads and executes HEARTBEAT.md.

**Implementation:**

1. **Check current heartbeat mechanism:**
   ```bash
   ssh akaniyenemichael01@100.118.28.4 "cat ~/.openclaw/cron/jobs.json"
   ```
   Current config:
   ```json
   {
     "name": "bond-heartbeat",
     "schedule": "*/15 * * * *",
     "action": {
       "type": "heartbeat",
       "agentId": "bond",
       "sessionKey": "agent:bond:main"
     }
   }
   ```

2. **Change to custom script action:**
   ```json
   {
     "name": "bond-heartbeat",
     "schedule": "*/15 * * * *",
     "action": {
       "type": "custom",
       "script": "/home/akaniyenemichael01/.openclaw/bin/heartbeat-bond.sh"
     }
   }
   ```

3. **Create heartbeat script** (`~/.openclaw/bin/heartbeat-bond.sh`):
   ```bash
   #!/bin/bash
   # Bond's Heartbeat Execution Script

   # Log file
   LOG=~/.openclaw/cron/bond-heartbeat.log

   # Start OpenClaw session with heartbeat prompt
   echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Starting heartbeat..." >> $LOG

   npx openclaw sessions run agent:bond:main \
     --prompt "HEARTBEAT: Execute your HEARTBEAT.md checklist NOW. Focus on section 2 (check assigned tasks). If tasks found, start working immediately." \
     >> $LOG 2>&1

   echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Heartbeat complete." >> $LOG
   ```

4. **Make executable:**
   ```bash
   chmod +x ~/.openclaw/bin/heartbeat-bond.sh
   ```

5. **Create similar script for Kai** (`heartbeat-kai.sh`)

6. **Restart cron service** to pick up changes

**Pros:**
- Uses existing HEARTBEAT.md files
- Agent actually reads and follows checklist
- Full context and decision-making
- Works with current architecture

**Cons:**
- Spawns full agent session (higher resource usage)
- Takes longer than simple mutation call
- Relies on OpenClaw session mechanism

---

### Option B: Direct Task Polling Script (Simpler)

**Approach:** Create a lightweight script that directly calls Convex queries without spawning agent sessions.

**Implementation:**

1. **Create task polling script** (`~/.openclaw/bin/poll-tasks-bond.sh`):
   ```bash
   #!/bin/bash

   cd ~/.openclaw/mission-control

   # Query for Bond's assigned tasks
   TASKS=$(npx convex run tasks:getMyTasks '{"agentId":"j978zb77v1ar3e0xjf17141zkh80m3ww"}')

   # Check if any tasks found (not empty array)
   if echo "$TASKS" | grep -q '"_id"'; then
     echo "[$(date)] Tasks found - triggering Bond session"

     # Start Bond to work on tasks
     npx openclaw sessions run agent:bond:main \
       --prompt "You have assigned tasks waiting. Check Mission Control and start working on the highest priority task."
   else
     echo "[$(date)] No tasks assigned to Bond"
   fi

   # Update heartbeat timestamp
   npx convex run agents:updateHeartbeat \
     '{"sessionKey":"agent:bond:main","status":"idle"}'
   ```

2. **Add to cron:**
   ```json
   {
     "name": "bond-task-checker",
     "schedule": "*/5 * * * *",
     "action": {
       "type": "custom",
       "script": "/home/akaniyenemichael01/.openclaw/bin/poll-tasks-bond.sh"
     }
   }
   ```

**Pros:**
- Fast and lightweight
- Only spawns agent when work exists
- Easy to debug (simple bash script)
- Lower resource usage

**Cons:**
- Bypasses HEARTBEAT.md (agent doesn't follow checklist)
- No @mention checking or other heartbeat actions
- Duplicates logic from HEARTBEAT.md

---

### Option C: Hybrid Approach (Most Reliable)

Combine both:
- **Every 5 minutes:** Lightweight task polling (Option B)
- **Every 15 minutes:** Full HEARTBEAT.md execution (Option A)

This ensures:
- Fast response to new tasks (5min polling)
- Complete heartbeat functionality (@mentions, memory updates, etc.)
- Redundancy if one mechanism fails

---

## Recommended Implementation: Option A (Full Heartbeat)

**Reasoning:**
- Preserves HEARTBEAT.md as single source of truth
- Agent makes intelligent decisions
- Handles @mentions and other agent coordination
- Properly updates WORKING.md and memory

**Steps:**

1. Create heartbeat execution scripts for Bond and Kai
2. Update `~/.openclaw/cron/jobs.json` to use custom scripts
3. Test manually before relying on cron
4. Monitor first few automatic runs

---

## Verification Steps

After implementation:

1. **Manual test:**
   ```bash
   ssh akaniyenemichael01@100.118.28.4 "~/.openclaw/bin/heartbeat-bond.sh"
   ```
   Expected: Bond discovers tasks, updates status to "in_progress"

2. **Check Mission Control UI:**
   - Tasks move from ASSIGNED to IN PROGRESS
   - Bond's status changes to ACTIVE
   - Live feed shows task status change activity

3. **Monitor cron logs:**
   ```bash
   ssh akaniyenemichael01@100.118.28.4 "tail -f ~/.openclaw/cron/bond-heartbeat.log"
   ```
   Expected: See heartbeat execution logs with task discovery

4. **Verify WORKING.md created:**
   ```bash
   ssh akaniyenemichael01@100.118.28.4 "cat ~/.openclaw/agents/bond/agent/WORKING.md"
   ```
   Expected: Bond's current state documented

---

## Critical Files

**Remote (OpenClaw Server):**
- `~/.openclaw/cron/jobs.json` - Cron configuration (modify action type)
- `~/.openclaw/bin/heartbeat-bond.sh` - New heartbeat execution script (create)
- `~/.openclaw/bin/heartbeat-kai.sh` - Kai's heartbeat script (create)
- `~/.openclaw/agents/bond/agent/HEARTBEAT.md` - Already updated ✓
- `~/.openclaw/agents/main/agent/HEARTBEAT.md` - Already updated ✓

**Local (Already Complete):**
- `/Users/mac/dev/mission-control-ui/convex/tasks.ts` - `getMyTasks` query ✓

---

## Rollback Plan

If the new heartbeat mechanism causes issues:

1. **Revert cron config:**
   ```bash
   ssh akaniyenemichael01@100.118.28.4 'cat > ~/.openclaw/cron/jobs.json << EOF
   {
     "version": 1,
     "jobs": [
       {
         "name": "bond-heartbeat",
         "schedule": "*/15 * * * *",
         "action": {
           "type": "heartbeat",
           "agentId": "bond",
           "sessionKey": "agent:bond:main"
         },
         "enabled": true
       }
     ]
   }
   EOF'
   ```

2. **Remove custom scripts:**
   ```bash
   rm ~/.openclaw/bin/heartbeat-bond.sh
   rm ~/.openclaw/bin/heartbeat-kai.sh
   ```

---

## Time Estimate

- **Option A (Recommended):** 30 minutes
  - Create scripts: 10 min
  - Update cron config: 5 min
  - Test manually: 10 min
  - Verify automation: 5 min

- **Option B (Simple polling):** 20 minutes

- **Option C (Hybrid):** 45 minutes
