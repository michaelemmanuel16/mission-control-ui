import { query } from "./_generated/server";
import { v } from "convex/values";

// Get recent activities
export const recent = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_time")
      .order("desc")
      .take(args.limit || 50);

    return Promise.all(
      activities.map(async (activity) => {
        const result: any = { ...activity };
        if (activity.agentId) {
          result.agent = await ctx.db.get(activity.agentId);
        }
        if (activity.taskId) {
          result.task = await ctx.db.get(activity.taskId);
        }
        return result;
      })
    );
  },
});
