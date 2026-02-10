# Message Response Decision Tree

This document provides decision logic for agents to determine when to respond to messages. This file should be placed at `~/.openclaw/agents/shared/MESSAGE_HANDLER.md` on the OpenClaw server.

## Overview

When an agent receives a notification about a new message, use this logic to decide whether to respond.

## ALWAYS RESPOND IF:

1. ✅ **You were @mentioned by name** (e.g., "@Bond can you...")
   - Example: "@Bond what's your status on the analysis?"
   - Action: Respond with the requested information

2. ✅ **Message is from "You" (Human Operator)**
   - Example: "Bond, please provide an update"
   - Action: Always prioritize human requests and respond

3. ✅ **Message is a direct question about your work or expertise**
   - Example: "Who has the competitor pricing data?"
   - Action: Respond if you have the answer

4. ✅ **Message requests a status update from you**
   - Example: "Team, status check - where is everyone at?"
   - Action: Provide brief status update

## ACKNOWLEDGE BUT DON'T LOOP IF:

1. ⚠️ **Message is a status update from another agent**
   - Example: "Bond: Analysis complete, data uploaded"
   - Action: Optional brief acknowledgment ("Noted" or "Thanks"), but avoid creating back-and-forth

2. ⚠️ **Message is FYI/informational**
   - Example: "FYI - deadline moved to Friday"
   - Action: Optional acknowledgment, no detailed response needed

3. ⚠️ **Message is thanking you or confirming receipt**
   - Example: "Thanks Bond, that's helpful!"
   - Action: NO RESPONSE needed (loop prevention)

4. ⚠️ **You already responded to this thread today**
   - Action: Unless directly @mentioned again, don't respond

## NEVER RESPOND IF:

1. ❌ **Message is from yourself**
   - Never respond to your own messages

2. ❌ **Message is a heartbeat log or system message**
   - These are not meant for agent interaction

3. ❌ **You've already replied in this thread within last hour**
   - Loop prevention mechanism

4. ❌ **Message is not related to your current task or role**
   - Example: If you're Bond (intelligence) and message is about HR policies
   - Action: Ignore or suggest the appropriate agent

## Response Templates

### Responding to a question:
```
@{sender} - [Direct answer to their question]

[Additional context if needed]

[Next action you'll take, if relevant]
```

**Example:**
```
@You - I've completed the competitor analysis. Found 5 main competitors with pricing ranging from $49-199/mo.

Full report uploaded to Document #12.

Next: I'll analyze their marketing strategies.
```

### Acknowledging information:
```
Noted - [brief summary of what you understood]
```

**Example:**
```
Noted - deadline moved to Friday EOD
```

### When you need help from another agent:
```
@{sender} - Let me bring in @{other-agent} who can help with this.
```

**Example:**
```
@You - This requires coordination input. @Kai can you help with the overall strategy here?
```

### Delegating work:
```
@{other-agent} - Can you help with [specific task]? [Context about why you're delegating]
```

**Example:**
```
@Kai - Can you review the overall strategy I'm proposing? I want to make sure it aligns with our objectives.
```

### Status update (when requested):
```
[Brief current status]

[What you're working on]

[Estimated completion or blockers]
```

**Example:**
```
Currently analyzing competitor #4 of 5.

Working on: Pricing model comparison and feature matrix.

On track to finish by end of day.
```

## Loop Prevention Rules

1. **One Response Per Hour Rule:**
   - Don't respond to the same thread more than once per hour
   - Exception: If explicitly @mentioned again with a new question

2. **Acknowledgment Stop Rule:**
   - If a message is just acknowledging your work ("Thanks!", "Got it"), DON'T respond
   - This prevents "you're welcome" → "no problem" → "thanks again" loops

3. **Status Update Limit:**
   - Only provide unsolicited status updates if:
     - Explicitly asked by human
     - Major milestone reached
     - Critical blocker encountered
   - Don't provide updates just because other agents did

4. **Check Recent History:**
   - Before responding, check if you've already posted 3+ messages in this thread
   - If yes, wait for a direct question or @mention before posting more

## Multi-Party Conversation Rules

When continuing a conversation with multiple people:

1. **Always @mention participants you want to see the message**
   - Bad: "Here's the update" (nobody gets notified)
   - Good: "@Bond @Fury here's the update"

2. **If responding to a specific person, only @mention them**
   - Question from Bond → Response to "@Bond"
   - Don't cc everyone unless the information is relevant to all

3. **Use thread context to decide who to @mention**
   - Look at parentMessageId to understand conversation flow
   - @mention those who asked the original question or are waiting for updates

## Practical Examples

### Example 1: Human Question → Agent Response
```
Human: "@Bond what's your progress on competitor analysis?"
```

**Decision:** Human message + @mention = ALWAYS RESPOND

**Response:**
```
@You - I've analyzed 3 of 5 competitors so far. Key findings:
- Average pricing: $99/mo
- Common features: Analytics, reporting, API access

Completing the remaining 2 today, full report by EOD.
```

### Example 2: Agent Asking Another Agent
```
Kai: "@Bond I need the pricing data for the strategy doc"
```

**Decision:** @mentioned by name = ALWAYS RESPOND

**Response:**
```
@Kai - Here's the competitor pricing summary:
- CompetitorA: $49/mo (basic), $149/mo (pro)
- CompetitorB: $79/mo (flat rate)
- CompetitorC: $199/mo (enterprise focus)

Full spreadsheet in Document #47.
```

### Example 3: Loop Prevention
```
Kai: "@Bond thanks for the pricing data!"
```

**Decision:** Acknowledgment/thanks = NO RESPONSE (prevent loop)

**Response:** *No response needed*

### Example 4: Multi-Agent Coordination
```
Human: "Team, let's finish this by Friday"
```

**Decision:** Human broadcast to team = RESPOND (you're an assignee)

**Kai's Response:**
```
Understood, team is on track for Friday delivery.
```

**Bond's Response:**
```
Confirmed - analysis will be complete by Thursday.
```

**Decision for Kai's message:** Status update from another agent = ACKNOWLEDGE but brief

### Example 5: Calling in Unassigned Coordinator
```
Bond (in "Competitor Analysis" task): "@Kai I need a strategic perspective on these findings. Should we prioritize feature parity or pricing?"
```

**Kai's perspective:**
- Not assigned to this task
- But was @mentioned by name
- **Decision:** @mentioned = ALWAYS RESPOND (even if not assigned)

**Kai's Response:**
```
@Bond - Based on our objectives, prioritize feature parity. Pricing can be adjusted later once we have competitive features.
```

## When in Doubt

If you're uncertain whether to respond:

1. **Is this from a human?** → Respond
2. **Were you @mentioned?** → Respond
3. **Is someone waiting for your input?** → Respond
4. **Is this just FYI or acknowledgment?** → Don't respond
5. **Have you already responded recently?** → Don't respond

**Default to under-responding rather than over-responding.** It's better to miss an optional acknowledgment than to create a conversation loop.
