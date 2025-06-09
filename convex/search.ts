import { action, internalAction, internalQuery, query } from "./_generated/server";
import { v } from "convex/values";
import { OpenAI } from "openai";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

export async function generateQueryEmbedding(question: string) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error("The OPENAI_API_KEY environment variable is missing or empty.");
    }

    const openai = new OpenAI({ apiKey });
    const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: question
    });
    const embedding = response.data[0].embedding;
    return embedding;
}

export const fetchResults = internalQuery({
    args: { ids: v.array(v.id("documents")) },
    handler: async (ctx, args) => {
        const results = [];
        for (const id of args.ids) {
            const doc = await ctx.db.get(id);
            if (doc === null) {
                continue;
            }
            results.push(doc);
        }
        return results;
    },
});

export const chunkEmbeddingsRetriever = internalAction({
    args: {
        question: v.string()
    },
    async handler(ctx, args) {
        const embedding = await generateQueryEmbedding(args.question);
        const results = await ctx.vectorSearch("documents", "by_embedding", {
            vector: embedding,
            limit: 50
        });
        const chunks: Array<Doc<"documents">> = await ctx.runQuery(
            internal.search.fetchResults,
            { ids: results.map((chunk) => chunk._id) }
        );
        return chunks.map((chunk, index) => ({
            text: chunk.content,
            id: chunk._id,
            score: results[index]._score
        }));
    }
});

export const keywordRetriever = internalQuery({
    args: { query: v.string() },
    handler: async (ctx, args) => {
        console.log("Starting keyword search with query:", args.query);
        
        try {
            // Get all documents and filter them based on content
            const allDocuments = await ctx.db.query("documents").collect();
            console.log("Total documents found:", allDocuments.length);
            
            const searchResults = allDocuments.filter(doc => {
                const matches = doc.content.toLowerCase().includes(args.query.toLowerCase());
                if (matches) {
                    console.log("Found matching document:", doc._id);
                }
                return matches;
            });

            console.log("Matching documents found:", searchResults.length);

            return searchResults.map(doc => ({
                text: doc.content,
                id: doc._id,
                score: 1 - (searchResults.indexOf(doc) / searchResults.length)
            }));
        } catch (error) {
            console.error("Error in keywordRetriever:", error);
            throw error;
        }
    }
});

export const hybridSearch = action({
    args: {
        query: v.string()
    },
    async handler(ctx, args): Promise<Array<{
        text: string;
        id: Id<"documents">;
        score: number;
    }>> {
        console.log("Starting search with query:", args.query);
        
        try {
            // Generate embedding for the query
            const embedding = await generateQueryEmbedding(args.query);
            console.log("Generated embedding");

            // Perform vector search
            const results = await ctx.vectorSearch("documents", "by_embedding", {
                vector: embedding,
                limit: 50
            });
            console.log("Vector search results:", results.length);

            // Fetch the full document content
            const chunks = await ctx.runQuery(internal.search.fetchResults, {
                ids: results.map((chunk) => chunk._id)
            });

            // Map results to the expected format
            const searchResults = chunks.map((chunk, index) => ({
                text: chunk.content,
                id: chunk._id,
                score: results[index]._score
            }));

            console.log("Total results:", searchResults.length);
            return searchResults;
        } catch (error) {
            console.error("Error in search:", error);
            return [];
        }
    }
});

export const listMessages = internalQuery({
    handler: async (ctx) => {
        return await ctx.db.query("messages").order("desc").take(100);
    },
}); 