import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Register an agent
export const register = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    sessionKey: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("agents")
      .withIndex("by_session", (q) => q.eq("sessionKey", args.sessionKey))
      .first();

    if (existing) {
      return existing._id;
    }

    const agentId = await ctx.db.insert("agents", {
      name: args.name,
      role: args.role,
      status: "idle",
      sessionKey: args.sessionKey,
      ...(args.description ? { description: args.description } : {}),
    });

    return agentId;
  },
});

// Update agent description
export const updateDescription = mutation({
  args: {
    sessionKey: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_session", (q) => q.eq("sessionKey", args.sessionKey))
      .first();
    if (!agent) throw new Error("Agent not found");
    await ctx.db.patch(agent._id, { description: args.description });
    return agent._id;
  },
});

// Update agent role
export const updateRole = mutation({
  args: {
    sessionKey: v.string(),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_session", (q) => q.eq("sessionKey", args.sessionKey))
      .first();
    if (!agent) throw new Error("Agent not found");
    await ctx.db.patch(agent._id, { role: args.role });
    return agent._id;
  },
});

// Update agent heartbeat
export const updateHeartbeat = mutation({
  args: {
    sessionKey: v.string(),
    status: v.optional(v.string()),
    currentTaskId: v.optional(v.id("tasks")),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_session", (q) => q.eq("sessionKey", args.sessionKey))
      .first();

    if (!agent) {
      throw new Error("Agent not found");
    }

    const updates: any = {
      lastHeartbeat: Date.now(),
    };

    if (args.status) {
      updates.status = args.status;
    }
    if (args.currentTaskId !== undefined) {
      updates.currentTaskId = args.currentTaskId;
    }

    await ctx.db.patch(agent._id, updates);

    // Log heartbeat activity
    await ctx.db.insert("activities", {
      type: "agent_heartbeat",
      agentId: agent._id,
      message: `${agent.name} heartbeat`,
      createdAt: Date.now(),
    });

    return agent._id;
  },
});

// Remove an agent
export const removeAgent = mutation({
  args: {
    sessionKey: v.string(),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_session", (q) => q.eq("sessionKey", args.sessionKey))
      .first();

    if (!agent) {
      throw new Error(`Agent with sessionKey "${args.sessionKey}" not found`);
    }

    await ctx.db.delete(agent._id);

    return { success: true, deleted: agent.name };
  },
});

// Get or create the special human operator agent
export const getOrCreateHumanOperator = mutation({
  args: {},
  handler: async (ctx) => {
    const sessionKey = "system:human:operator";

    // Check if human operator already exists
    const existing = await ctx.db
      .query("agents")
      .withIndex("by_session", (q) => q.eq("sessionKey", sessionKey))
      .first();

    if (existing) {
      return existing._id;
    }

    // Create human operator agent
    const agentId = await ctx.db.insert("agents", {
      name: "You",
      role: "Human Operator",
      status: "active",
      sessionKey: sessionKey,
      lastHeartbeat: Date.now(),
    });

    return agentId;
  },
});

// Get all agents with derived working status from in_progress tasks
export const list = query({
  handler: async (ctx) => {
    const agents = await ctx.db.query("agents").collect();

    // Single query for all in_progress tasks
    const inProgressTasks = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "in_progress"))
      .collect();

    // Build a set of agent IDs who are actively working
    const workingAgentIds = new Set(
      inProgressTasks.flatMap((t) => t.assigneeIds.map((id) => id.toString()))
    );

    const STALE_MS = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();

    return agents.map((agent) => {
      const hasActiveTask = workingAgentIds.has(agent._id.toString());
      const isAlive =
        agent.lastHeartbeat && now - agent.lastHeartbeat < STALE_MS;

      // WORKING: has an in_progress task AND sent a heartbeat in last 5 min
      // Otherwise fall back to stored status
      const effectiveStatus =
        hasActiveTask && isAlive ? "active" : agent.status;

      return { ...agent, status: effectiveStatus };
    });
  },
});
