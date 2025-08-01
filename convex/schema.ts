import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    category: v.string(),
    completed: v.boolean(),
    userId: v.id("users"),
    teamId: v.optional(v.id("teams")),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_completed", ["userId", "completed"])
    .index("by_user_and_category", ["userId", "category"])
    .index("by_user_and_priority", ["userId", "priority"])
    .index("by_team", ["teamId"])
    .searchIndex("search_tasks", {
      searchField: "title",
      filterFields: ["userId", "completed", "category", "priority", "teamId"],
    }),

  teams: defineTable({
    name: v.string(),
    ownerId: v.id("users"),
  }).index("by_owner", ["ownerId"]),

  teamMembers: defineTable({
    teamId: v.id("teams"),
    userId: v.id("users"),
  })
    .index("by_team", ["teamId"])
    .index("by_user", ["userId"])
    .index("by_team_and_user", ["teamId", "userId"]),

  invitations: defineTable({
    teamId: v.id("teams"),
    token: v.string(),
    expiresAt: v.optional(v.number()),
  })
    .index("by_token", ["token"])
    .index("by_team", ["teamId"]),

  files: defineTable({
    taskId: v.id("tasks"),
    storageId: v.string(),
    name: v.string(),
    type: v.string(),
  }).index("by_task", ["taskId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
