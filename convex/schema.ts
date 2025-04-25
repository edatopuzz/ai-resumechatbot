import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  documents: defineTable({
    name: v.string(),
    content: v.string(),
    embedding: v.array(v.float64()),
  })
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
    })
    .searchIndex("content", {
      searchField: "content",
    }),
  messages: defineTable({
    content: v.string(),
    role: v.string(),
    timestamp: v.number(),
  }).index("by_timestamp", ["timestamp"]),
  accessRequests: defineTable({
    email: v.string(),
    token: v.string(),
    status: v.union(v.literal("pending"), v.literal("verified")),
    requestedAt: v.number(),
    verifiedAt: v.optional(v.number()),
  }),
});