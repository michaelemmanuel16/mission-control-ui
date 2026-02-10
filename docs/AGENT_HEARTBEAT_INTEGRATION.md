# Agent Heartbeat Integration for @Mentions

This document provides instructions for updating agent HEARTBEAT.md files on the OpenClaw server to enable message checking and responses.

## Overview

With the new @mention system, agents must:
1. Check for unread messages during each heartbeat
2. Decide whether to respond using MESSAGE_HANDLER.md logic
3. Send responses when appropriate
4. Mark notifications as delivered after processing

## HEARTBEAT.md Update

Add this section to each agent's `~/.openclaw/agents/{agent-name}/agent/HEARTBEAT.md` file:

```markdown
### 3. Check for new messages and respond

**Check for unread messages:**
```bash
cd ~/.openclaw/mission-control
npx convex run messages:getUnreadForAgent \
  '{"agentId":"<YOUR_AGENT_ID>","limit":10}'
```

**For each message, follow MESSAGE_HANDLER.md decision tree:**

**IF you should respond:**
```bash
# Send reply with @mention if targeting someone
npx convex run messages:createWithMentions \
  '{
    "taskId":"<TASK_ID>",
    "fromAgentId":"<YOUR_AGENT_ID>",
    "content":"Your response here",
    "parentMessageId":"<ORIGINAL_MESSAGE_ID>"
  }'
```

**After processing all messages:**
```bash
# Mark notifications as delivered
npx convex run notifications:markMultipleDelivered \
  '{"notificationIds":["<NOTIF_ID_1>","<NOTIF_ID_2>"]}'
```

**IMPORTANT RULES:**
- ALWAYS respond to messages from "You" (Human Operator)
- ALWAYS respond when you are @mentioned by name
- NEVER respond to your own messages
- NEVER respond twice to same message within 1 hour
- Keep responses concise and actionable
- **If continuing a multi-party conversation, @mention all relevant participants** (e.g., "@Bond @Fury here's an update")
```

## Agent-Specific Configuration

### For Kai (Squad Lead)
Agent ID: `<get from production data>`
Session Key: `agent:main:main`

### For Bond (Intelligence Specialist)
Agent ID: `<get from production data>`
Session Key: `agent:bond:main`

### For Fury (Security Specialist)
Agent ID: `<get from production data>`
Session Key: `agent:fury:main`

## Deployment Steps

1. **SSH to OpenClaw Server:**
   ```bash
   ssh akaniyenemichael01@100.118.28.4
   ```

2. **Update HEARTBEAT.md for each agent:**
   ```bash
   # For Kai
   vi ~/.openclaw/agents/main/agent/HEARTBEAT.md

   # For Bond
   vi ~/.openclaw/agents/bond/agent/HEARTBEAT.md

   # For Fury
   vi ~/.openclaw/agents/fury/agent/HEARTBEAT.md
   ```

3. **Create MESSAGE_HANDLER.md (shared decision logic):**
   ```bash
   vi ~/.openclaw/agents/shared/MESSAGE_HANDLER.md
   ```
   (See MESSAGE_HANDLER.md document below)

4. **Test with one agent first:**
   ```bash
   openclaw sessions start agent:bond:main --prompt "Execute HEARTBEAT.md section 3"
   ```

5. **Monitor logs:**
   ```bash
   tail -f ~/.openclaw/cron/bond-heartbeat.log
   ```

## Getting Agent IDs

To find agent IDs in production:

```bash
cd ~/.openclaw/mission-control
npx convex run agents:list '{}'
```

Look for agents with these names:
- "Kai" (Squad Lead)
- "Bond" (Intelligence Specialist)
- "Fury" (Security Specialist)

## Testing the Integration

1. **Create a test task in Mission Control UI**
2. **Assign Bond to the task**
3. **Send a test message:** "@Bond test message - please acknowledge"
4. **Wait for Bond's heartbeat** (~15 minutes)
5. **Verify Bond responds** in the UI

## Troubleshooting

**Problem:** Agent doesn't respond to messages
- Check agent heartbeat is running: `ps aux | grep openclaw`
- Verify agent ID is correct in HEARTBEAT.md
- Check logs: `tail -f ~/.openclaw/cron/{agent}-heartbeat.log`
- Ensure Convex deployment URL is correct in config

**Problem:** Agent responds multiple times to same message
- Check MESSAGE_HANDLER.md rules are followed
- Verify notification IDs are being marked as delivered
- Check for duplicate heartbeat cron jobs

**Problem:** @mentions not working
- Verify agent names in messages match database exactly (case-insensitive)
- Check mentionedAgentIds field is populated in messages table
- Ensure notifications are being created

## Next Steps

After deployment:
1. Monitor agent responses for 24 hours
2. Adjust response timing if needed (heartbeat frequency)
3. Fine-tune MESSAGE_HANDLER.md decision rules based on observed behavior
4. Consider implementing instant heartbeat trigger on human messages (webhook)
