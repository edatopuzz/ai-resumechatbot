import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const migrateMessages = mutation({
  args: {},
  handler: async (ctx) => {
    const messages = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("userId"), undefined))
      .collect();

    for (const message of messages) {
      await ctx.db.patch(message._id, {
        userId: "default"
      });
    }
  },
}); 