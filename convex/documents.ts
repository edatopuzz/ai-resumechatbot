import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { generateQueryEmbedding } from "./search";

export const store = mutation({
  args: {
    name: v.string(),
    content: v.string(),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("documents", {
      name: args.name,
      content: args.content,
      embedding: args.embedding,
    });
    return id;
  },
});

export default store;

export const listDocuments = query({
  handler: async (ctx) => {
    return await ctx.db.query("documents").collect();
  },
});

export const deleteDocument = mutation({
  args: {
    id: v.id("documents"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

export const clearAllDocuments = mutation({
  handler: async (ctx) => {
    const documents = await ctx.db.query("documents").collect();
    for (const doc of documents) {
      await ctx.db.delete(doc._id);
    }
    return { deleted: documents.length };
  },
});

export const uploadDocument = mutation({
  args: {
    name: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // Generate embedding for the document
    const embedding = await generateQueryEmbedding(args.content);

    // Store document with embedding
    const documentId = await ctx.db.insert("documents", {
      name: args.name,
      content: args.content,
      embedding,
    });

    return documentId;
  },
});