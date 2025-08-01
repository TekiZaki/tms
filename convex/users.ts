import { query } from "./_generated/server";
import { v } from "convex/values";

export const getUser = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return {
      name: user?.name,
      email: user?.email,
    };
  },
});

export const getUsers = query({
  args: {
    userIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    if (!args.userIds || args.userIds.length === 0) {
      return [];
    }
    const users = await Promise.all(
      args.userIds.map((userId) => ctx.db.get(userId))
    );
    return users
      .filter((u) => u !== null)
      .map((user) => ({
        _id: user?._id,
        name: user?.name,
        email: user?.email,
      }));
  },
});
