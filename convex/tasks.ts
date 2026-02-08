import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new task
export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    priority: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const taskId = await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      status: "inbox",
      assigneeIds: [],
      priority: (args.priority as any) || "medium",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      dueDate: args.dueDate,
      tags: args.tags || [],
    });

    // Log activity
    await ctx.db.insert("activities", {
      type: "task_created",
      taskId,
      message: `Task created: ${args.title}`,
      createdAt: Date.now(),
    });

    return taskId;
  },
});

// Assign task to agents
export const assign = mutation({
  args: {
    taskId: v.id("tasks"),
    agentIds: v.array(v.id("agents")),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    await ctx.db.patch(args.taskId, {
      assigneeIds: args.agentIds,
      status: "assigned",
      updatedAt: Date.now(),
      tags: args.tags !== undefined ? args.tags : (task.tags || []),
    });

    // Create notifications for all assignees
    for (const agentId of args.agentIds) {
      await ctx.db.insert("notifications", {
        mentionedAgentId: agentId,
        taskId: args.taskId,
        content: `You have been assigned to task: ${task.title}`,
        delivered: false,
        createdAt: Date.now(),
      });
    }

    // Log activity
    await ctx.db.insert("activities", {
      type: "task_assigned",
      agentId: args.agentIds[0],
      taskId: args.taskId,
      message: `Task assigned to ${args.agentIds.length} agent(s)`,
      createdAt: Date.now(),
    });
  },
});

// Update task status
export const updateStatus = mutation({
  args: {
    taskId: v.id("tasks"),
    status: v.union(
      v.literal("inbox"),
      v.literal("assigned"),
      v.literal("in_progress"),
      v.literal("review"),
      v.literal("done"),
      v.literal("blocked")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    // Log activity
    await ctx.db.insert("activities", {
      type: "task_status_changed",
      taskId: args.taskId,
      message: `Status changed to ${args.status}`,
      createdAt: Date.now(),
    });
  },
});

// Get all tasks
export const list = query({
  handler: async (ctx) => {
    const tasks = await ctx.db.query("tasks").order("desc").collect();
    return Promise.all(
      tasks.map(async (task) => ({
        ...task,
        assignees: await Promise.all(
          task.assigneeIds.map((id) => ctx.db.get(id))
        ),
      }))
    );
  },
});

// Get tasks by status
export const byStatus = query({
  args: { 
    status: v.union(
      v.literal("inbox"),
      v.literal("assigned"),
      v.literal("in_progress"),
      v.literal("review"),
      v.literal("done"),
      v.literal("blocked")
    )
  },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) =>
        q.eq("status", args.status)
      )
      .collect();
    return tasks;
  },
});

// Get a single task by ID
export const get = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }
    
    // Fetch assignees
    const assignees = await Promise.all(
      task.assigneeIds.map((id) => ctx.db.get(id))
    );
    
    return {
      ...task,
      assignees,
    };
  },
});
