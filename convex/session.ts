import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createSession = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const sessionId = 'session_' + Math.random().toString(36).substring(2);
    const timestamp = Date.now();
    
    await ctx.db.insert("sessions", {
      sessionId,
      userId: args.userId,
      startTime: timestamp,
      expirationTime: timestamp + 24 * 60 * 60 * 1000, // 24 hours
      active: true,
    });

    return sessionId;
  },
});

export const getActiveSession = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    const session = await ctx.db
      .query("sessions")
      .filter((q) => 
        q.eq(q.field("userId"), args.userId) &&
        q.eq(q.field("active"), true) &&
        q.gt(q.field("expirationTime"), now)
      )
      .first();

    return session;
  },
});

export const endSession = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .filter((q) => q.eq(q.field("sessionId"), args.sessionId))
      .first();

    if (session) {
      await ctx.db.patch(session._id, { active: false });
    }
  },
}); 