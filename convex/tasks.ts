import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

async function checkTeamMembership(ctx: any, userId: string, teamId: string) {
  const member = await ctx.db
    .query("teamMembers")
    .withIndex("by_team_and_user", (q: any) =>
      q.eq("teamId", teamId).eq("userId", userId)
    )
    .first();
  return !!member;
}

export const getTasks = query({
  args: {
    teamId: v.optional(v.id("teams")),
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

    let queryBuilder;

    if (args.teamId) {
      if (!(await checkTeamMembership(ctx, userId, args.teamId))) {
        throw new Error("Not a member of this team");
      }
      if (args.search && args.search.trim()) {
        queryBuilder = ctx.db
          .query("tasks")
          .withSearchIndex("search_tasks", (q) =>
            q.search("title", args.search!).eq("teamId", args.teamId!)
          );
      } else {
        queryBuilder = ctx.db
          .query("tasks")
          .withIndex("by_team", (q) => q.eq("teamId", args.teamId!));
      }
    } else {
      if (args.search && args.search.trim()) {
        queryBuilder = ctx.db
          .query("tasks")
          .withSearchIndex("search_tasks", (q) =>
            q.search("title", args.search!).eq("userId", userId)
          );
      } else {
        queryBuilder = ctx.db
          .query("tasks")
          .withIndex("by_user", (q) => q.eq("userId", userId));
      }
    }

    let tasks = await queryBuilder.collect();

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
      tasks.sort((a, b) => b._creationTime - a._creationTime);
    }

    return tasks;
  },
});

export const getCategories = query({
  args: {
    teamId: v.optional(v.id("teams")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    let tasks;
    if (args.teamId) {
      if (!(await checkTeamMembership(ctx, userId, args.teamId))) {
        return [];
      }
      tasks = await ctx.db
        .query("tasks")
        .withIndex("by_team", (q) => q.eq("teamId", args.teamId!))
        .collect();
    } else {
      tasks = await ctx.db
        .query("tasks")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
    }

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
    teamId: v.optional(v.id("teams")),
    color: v.optional(v.string()),
    taggedUsers: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    if (args.teamId) {
      if (!(await checkTeamMembership(ctx, userId, args.teamId))) {
        throw new Error("Not a member of this team");
      }
    }

    return await ctx.db.insert("tasks", {
      ...args,
      completed: false,
      userId, // creator of the task
    });
  },
});

async function checkTaskAuth(ctx: any, userId: string, taskId: string) {
  const task = await ctx.db.get(taskId);
  if (!task) {
    return false;
  }
  if (task.teamId) {
    return await checkTeamMembership(ctx, userId, task.teamId);
  }
  return task.userId === userId;
}

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
    color: v.optional(v.string()),
    taggedUsers: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    if (!(await checkTaskAuth(ctx, userId, args.id))) {
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

    if (!(await checkTaskAuth(ctx, userId, args.id))) {
      throw new Error("Task not found or unauthorized");
    }

    // First, get all files associated with the task
    const files = await ctx.db
      .query("files")
      .withIndex("by_task", (q) => q.eq("taskId", args.id))
      .collect();

    // Delete each file from storage and the files table
    for (const file of files) {
      await ctx.storage.delete(file.storageId);
      await ctx.db.delete(file._id);
    }

    // Finally, delete the task
    await ctx.db.delete(args.id);
  },
});

async function canCompleteTask(ctx: any, userId: string, taskId: string) {
  const task = await ctx.db.get(taskId);
  if (!task) {
    return false;
  }
  // if it is a team task, only creator or tagged users can complete
  if (task.teamId) {
    return (
      task.userId === userId ||
      (task.taggedUsers && task.taggedUsers.includes(userId))
    );
  }
  // if it is a personal task, only creator can complete
  return task.userId === userId;
}

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
    if (!task) {
      throw new Error("Task not found");
    }

    if (!(await canCompleteTask(ctx, userId, args.id))) {
      throw new Error("Unauthorized to complete this task");
    }

    await ctx.db.patch(args.id, {
      completed: !task.completed,
    });
  },
});
