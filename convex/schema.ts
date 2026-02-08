import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Mission Control Database Schema
// Defines 6 tables for multi-agent coordination

export default defineSchema({
  // Agents table - tracks all agents and their status
  agents: defineTable({
    name: v.string(),              // "Kai", "Bond", "Fury"
    role: v.string(),              // "Squad Lead", "Ad Intelligence", "Customer Researcher"
    status: v.union(
      v.literal("idle"),
      v.literal("active"),
      v.literal("blocked")
    ),
    currentTaskId: v.optional(v.id("tasks")),
    sessionKey: v.string(),        // "agent:main:main", "agent:bond:main", "agent:fury:main"
    lastHeartbeat: v.optional(v.number()),  // Unix timestamp
  })
    .index("by_status", ["status"])
    .index("by_session", ["sessionKey"]),

  // Tasks table - shared task tracking
  tasks: defineTable({
    title: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("inbox"),
      v.literal("assigned"),
      v.literal("in_progress"),
      v.literal("review"),
      v.literal("done"),
      v.literal("blocked")
    ),
    assigneeIds: v.array(v.id("agents")),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
    dueDate: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
  })
    .index("by_status", ["status"])
    .index("by_assignee", ["assigneeIds"]),

  // Messages table - comment threads for tasks
  messages: defineTable({
    taskId: v.id("tasks"),
    fromAgentId: v.id("agents"),
    content: v.string(),
    attachments: v.optional(v.array(v.id("documents"))),
    createdAt: v.number(),
  })
    .index("by_task", ["taskId"])
    .index("by_agent", ["fromAgentId"]),

  // Activities table - real-time activity feed
  activities: defineTable({
    type: v.union(
      v.literal("task_created"),
      v.literal("task_assigned"),
      v.literal("task_status_changed"),
      v.literal("message_sent"),
      v.literal("document_created"),
      v.literal("agent_heartbeat")
    ),
    agentId: v.optional(v.id("agents")),  // Optional because system events exist
    taskId: v.optional(v.id("tasks")),
    message: v.string(),
    metadata: v.optional(v.any()),  // Flexible metadata for different activity types
    createdAt: v.number(),
  })
    .index("by_time", ["createdAt"])
    .index("by_task", ["taskId"]),

  // Documents table - shared deliverables repository
  documents: defineTable({
    title: v.string(),
    content: v.string(),           // Markdown content
    type: v.union(
      v.literal("deliverable"),
      v.literal("research"),
      v.literal("protocol"),
      v.literal("report"),
      v.literal("draft")
    ),
    taskId: v.optional(v.id("tasks")),
    agentId: v.id("agents"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_task", ["taskId"])
    .index("by_agent", ["agentId"])
    .index("by_type", ["type"]),

  // Notifications table - @mentions and alerts
  notifications: defineTable({
    mentionedAgentId: v.id("agents"),
    content: v.string(),
    taskId: v.optional(v.id("tasks")),
    messageId: v.optional(v.id("messages")),
    delivered: v.boolean(),
    deliveredAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_agent_undelivered", ["mentionedAgentId", "delivered"])
    .index("by_task", ["taskId"]),
});
