import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getTasks = query({
  args: {
    filter: v.optional(
      v.union(v.literal("all"), v.literal("pending"), v.literal("completed"))
    ),
    category: v.optional(v.string()),
    priority: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
    ),
    sortBy: v.optional(
      v.union(v.literal("dueDate"), v.literal("priority"), v.literal("created"))
    ),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    let tasks;

    // Apply search if provided
    if (args.search && args.search.trim()) {
      tasks = await ctx.db
        .query("tasks")
        .withSearchIndex("search_tasks", (q) =>
          q.search("title", args.search!).eq("userId", userId)
        )
        .collect();
    } else {
      tasks = await ctx.db
        .query("tasks")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
    }

    // Apply filters
    if (args.filter === "pending") {
      tasks = tasks.filter((task) => !task.completed);
    } else if (args.filter === "completed") {
      tasks = tasks.filter((task) => task.completed);
    }

    if (args.category) {
      tasks = tasks.filter((task) => task.category === args.category);
    }

    if (args.priority) {
      tasks = tasks.filter((task) => task.priority === args.priority);
    }

    // Apply sorting
    if (args.sortBy === "dueDate") {
      tasks.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate - b.dueDate;
      });
    } else if (args.sortBy === "priority") {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      tasks.sort(
        (a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]
      );
    } else {
      // Default sort by creation time (newest first)
      tasks.sort((a, b) => b._creationTime - a._creationTime);
    }

    return tasks;
  },
});

export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const categories = [...new Set(tasks.map((task) => task.category))];
    return categories.sort();
  },
});

export const createTask = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.insert("tasks", {
      ...args,
      completed: false,
      userId,
    });
  },
});

export const updateTask = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    priority: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
    ),
    category: v.optional(v.string()),
    completed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const task = await ctx.db.get(args.id);
    if (!task || task.userId !== userId) {
      throw new Error("Task not found or unauthorized");
    }

    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const deleteTask = mutation({
  args: {
    id: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const task = await ctx.db.get(args.id);
    if (!task || task.userId !== userId) {
      throw new Error("Task not found or unauthorized");
    }

    await ctx.db.delete(args.id);
  },
});

export const toggleTaskComplete = mutation({
  args: {
    id: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const task = await ctx.db.get(args.id);
    if (!task || task.userId !== userId) {
      throw new Error("Task not found or unauthorized");
    }

    await ctx.db.patch(args.id, {
      completed: !task.completed,
    });
  },
});
