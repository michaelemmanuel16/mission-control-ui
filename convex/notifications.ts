import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get undelivered notifications for an agent
export const getUndelivered = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_agent_undelivered", (q) =>
        q.eq("mentionedAgentId", args.agentId).eq("delivered", false)
      )
      .collect();

    return notifications;
  },
});

// Mark notification as delivered
export const markDelivered = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, {
      delivered: true,
      deliveredAt: Date.now(),
    });
  },
});
