import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { nanoid } from "nanoid";

export const createTeam = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const teamId = await ctx.db.insert("teams", {
      name: args.name,
      ownerId: userId,
    });

    await ctx.db.insert("teamMembers", {
      teamId,
      userId,
    });

    return teamId;
  },
});

export const getMyTeams = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const memberEntries = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const teamIds = memberEntries.map((m) => m.teamId);

    const teams = await Promise.all(
      teamIds.map((teamId) => ctx.db.get(teamId))
    );

    return teams
      .filter((team) => team !== null)
      .map((team) => ({
        ...team!,
        isOwner: team!.ownerId === userId,
      }));
  },
});

export const generateInviteToken = mutation({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const team = await ctx.db.get(args.teamId);
    if (!team || team.ownerId !== userId) {
      throw new Error("Only the team owner can generate invite tokens.");
    }

    const token = nanoid(12);

    await ctx.db.insert("invitations", {
      teamId: args.teamId,
      token,
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    return token;
  },
});

export const joinTeam = mutation({
  args: {
    inviteToken: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", args.inviteToken))
      .first();

    if (!invitation) {
      throw new Error("Invalid invite token.");
    }

    if (invitation.expiresAt && invitation.expiresAt < Date.now()) {
      throw new Error("Invite token has expired.");
    }

    const existingMember = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", invitation.teamId).eq("userId", userId)
      )
      .first();

    if (existingMember) {
      throw new Error("You are already a member of this team.");
    }

    await ctx.db.insert("teamMembers", {
      teamId: invitation.teamId,
      userId,
    });

    // It's a good practice to delete the invitation after it's used
    // or handle it based on the application's logic (e.g., allow multiple uses)
    // For now, we'll leave it, but in a real-world app, you might delete it.
    // await ctx.db.delete(invitation._id);

    return invitation.teamId;
  },
});

export const getTeamMembers = query({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Check if the user is a member of the team
    const member = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", userId)
      )
      .first();

    if (!member) {
      throw new Error("You are not a member of this team.");
    }

    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    const users = await Promise.all(members.map((m) => ctx.db.get(m.userId)));

    return users.filter((u) => u !== null);
  },
});
