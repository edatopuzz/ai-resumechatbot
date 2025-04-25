import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
// import { Resend } from 'resend';

// const resend = new Resend(process.env.RESEND_API_KEY);

export const requestAccess = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Generate a unique token for this access request
    const token = crypto.randomUUID();
    
    // Store the access request in the database and immediately verify it
    await ctx.db.insert("accessRequests", {
      email: args.email,
      token,
      status: "verified", // Set to verified immediately
      requestedAt: Date.now(),
      verifiedAt: Date.now(), // Set verification time immediately
    });
    
    return { success: true };
  },
});

export const verifyAccess = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db
      .query("accessRequests")
      .filter((q) => q.eq(q.field("token"), args.token))
      .first();

    if (!request) {
      throw new Error("Invalid access token");
    }

    // Update the request status
    await ctx.db.patch(request._id, {
      status: "verified",
      verifiedAt: Date.now(),
    });

    return { success: true };
  },
});

export const checkAccess = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db
      .query("accessRequests")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    return {
      hasAccess: true, // Always return true for testing
    };
  },
}); 