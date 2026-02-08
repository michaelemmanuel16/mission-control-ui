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
