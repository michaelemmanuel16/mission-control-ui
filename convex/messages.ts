import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Post a message to a task
export const create = mutation({
  args: {
    taskId: v.id("tasks"),
    fromAgentId: v.id("agents"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      taskId: args.taskId,
      fromAgentId: args.fromAgentId,
      content: args.content,
      attachments: [],
      createdAt: Date.now(),
    });

    // Log activity
    await ctx.db.insert("activities", {
      type: "message_sent",
      agentId: args.fromAgentId,
      taskId: args.taskId,
      message: "New comment posted",
      createdAt: Date.now(),
    });

    return messageId;
  },
});

// Get messages for a task
export const byTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .order("asc")
      .collect();

    return Promise.all(
      messages.map(async (msg) => ({
        ...msg,
        fromAgent: await ctx.db.get(msg.fromAgentId),
      }))
    );
  },
});

// Create message with @mention parsing and notification handling
export const createWithMentions = mutation({
  args: {
    taskId: v.id("tasks"),
    fromAgentId: v.id("agents"),
    content: v.string(),
    parentMessageId: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    // 1. Parse @mentions from content using regex
    const mentionPattern = /@(\w+)/g;
    const matches = Array.from(args.content.matchAll(mentionPattern));
    const mentionedNames = matches.map(m => m[1].toLowerCase());

    // 2. Look up mentioned agents by name
    const allAgents = await ctx.db.query("agents").collect();
    const mentionedAgents = allAgents.filter(agent =>
      mentionedNames.includes(agent.name.toLowerCase())
    );
    const mentionedAgentIds = mentionedAgents.map(a => a._id);

    // 3. Get task to determine assignees
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    // 4. Insert message with parsed mentions
    const messageId = await ctx.db.insert("messages", {
      taskId: args.taskId,
      fromAgentId: args.fromAgentId,
      content: args.content,
      attachments: [],
      mentionedAgentIds,
      parentMessageId: args.parentMessageId,
      createdAt: Date.now(),
    });

    // 5. Determine notification recipients:
    //    - All @mentioned agents (REGARDLESS of whether they're assigned to task!)
    //    - All assigned agents (if sender is human)
    const fromAgent = await ctx.db.get(args.fromAgentId);
    const isHuman = fromAgent?.sessionKey === "system:human:operator";

    const notifyAgentIds = new Set(mentionedAgentIds);
    if (isHuman) {
      // If human sends message, notify all assigned agents
      task.assigneeIds.forEach(id => notifyAgentIds.add(id));
    }
    // Note: If agent sends message with @mentions, ONLY mentioned agents are notified

    // Remove sender from notifications (don't notify yourself)
    notifyAgentIds.delete(args.fromAgentId);

    // 6. Create notifications for all recipients
    for (const agentId of notifyAgentIds) {
      await ctx.db.insert("notifications", {
        mentionedAgentId: agentId,
        taskId: args.taskId,
        messageId: messageId,
        content: `New message from ${fromAgent?.name || "Unknown"}: ${args.content.substring(0, 100)}...`,
        delivered: false,
        createdAt: Date.now(),
      });
    }

    // 7. Log activity to feed
    await ctx.db.insert("activities", {
      type: "message_sent",
      agentId: args.fromAgentId,
      taskId: args.taskId,
      message: `${fromAgent?.name} posted a comment`,
      metadata: { mentionCount: mentionedAgentIds.length },
      createdAt: Date.now(),
    });

    return messageId;
  },
});

// Get unread messages for an agent
export const getUnreadForAgent = query({
  args: {
    agentId: v.id("agents"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get undelivered notifications for this agent
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_agent_undelivered", (q) =>
        q.eq("mentionedAgentId", args.agentId).eq("delivered", false)
      )
      .order("desc") // Newest first
      .take(args.limit || 10); // Process max 10 per heartbeat

    // Fetch associated messages and tasks
    const messages = await Promise.all(
      notifications.map(async (notif) => {
        if (!notif.messageId) return null;
        const message = await ctx.db.get(notif.messageId);
        if (!message) return null;

        const task = notif.taskId ? await ctx.db.get(notif.taskId) : null;
        const fromAgent = await ctx.db.get(message.fromAgentId);

        return {
          notification: notif,
          message: {
            ...message,
            fromAgent,
          },
          task,
        };
      })
    );

    return messages.filter(m => m !== null);
  },
});

// Get message thread context
export const getThread = query({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) return null;

    // If this is a reply, get the parent
    let parentMessage = null;
    if (message.parentMessageId) {
      const parent = await ctx.db.get(message.parentMessageId);
      if (parent) {
        parentMessage = {
          ...parent,
          fromAgent: await ctx.db.get(parent.fromAgentId),
        };
      }
    }

    // Get all replies to this message
    const allMessages = await ctx.db
      .query("messages")
      .withIndex("by_task", (q) => q.eq("taskId", message.taskId))
      .collect();

    const replies = await Promise.all(
      allMessages
        .filter(m => m.parentMessageId === args.messageId)
        .map(async (m) => ({
          ...m,
          fromAgent: await ctx.db.get(m.fromAgentId),
        }))
    );

    return {
      message: {
        ...message,
        fromAgent: await ctx.db.get(message.fromAgentId),
      },
      parent: parentMessage,
      replies,
    };
  },
});
