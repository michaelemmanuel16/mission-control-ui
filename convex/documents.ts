import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List all documents
export const list = query({
  handler: async (ctx) => {
    const documents = await ctx.db.query("documents").order("desc").collect();
    return documents;
  },
});

// Upload a document
export const upload = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    type: v.union(
      v.literal("deliverable"),
      v.literal("research"),
      v.literal("protocol"),
      v.literal("report"),
      v.literal("draft")
    ),
    taskId: v.optional(v.id("tasks")),
    agentId: v.id("agents"),
  },
  handler: async (ctx, args) => {
    const documentId = await ctx.db.insert("documents", {
      title: args.title,
      content: args.content,
      type: args.type,
      taskId: args.taskId,
      agentId: args.agentId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return documentId;
  },
});

// Delete a document
export const remove = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
