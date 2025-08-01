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
  })
    .index("by_user", ["userId"])
    .index("by_user_and_completed", ["userId", "completed"])
    .index("by_user_and_category", ["userId", "category"])
    .index("by_user_and_priority", ["userId", "priority"])
    .searchIndex("search_tasks", {
      searchField: "title",
      filterFields: ["userId", "completed", "category", "priority"],
    }),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
