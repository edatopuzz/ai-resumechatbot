import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import OpenAI from "openai";
import { CohereClient } from "cohere-ai";
import { api } from "./_generated/api";
import { hybridSearch } from "./search";
import { Id } from "./_generated/dataModel";

// Initialize OpenAI with error handling
let openai: OpenAI;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });
} catch (error) {
  console.error("Failed to initialize OpenAI:", error);
  throw new Error("OpenAI initialization failed");
}

// Initialize Cohere with error handling
let cohere: CohereClient;
try {
  cohere = new CohereClient({
    token: process.env.CO_API_KEY!,
  });
} catch (error) {
  console.error("Failed to initialize Cohere:", error);
  throw new Error("Cohere initialization failed");
}

const SYSTEM_PROMPT = `You are Eda's personal AI assistant, designed to answer questions about her professional experience.

Your ONLY source of truth is the provided resume content.

IMPORTANT RULES:
1. ONLY use information explicitly present in the provided resume content
2. Do NOT make assumptions or guess. If the answer isn't in the context, say:
   - "That's not mentioned in my records"
   - or "I don't have that information"
3. Be precise and factual. Quote the resume when relevant
4. Never hallucinate or infer from outside knowledge
5. If you're unsure about something, say so rather than guessing

When answering questions:
1. First check if the information exists in the resume content
2. If it exists, quote the relevant section
3. If it doesn't exist, clearly state that the information is not available
4. Never make up or infer information that isn't explicitly stated

Example response format:
"According to my records, [specific information from resume]. This is shown in the resume where it states: '[exact quote from resume]'."

If information is not available:
"I don't have that information in my records about [specific topic]."

Remember: Your primary goal is to provide accurate, factual information based solely on the resume content. Never make assumptions or guesses.`;

export const generateAnswer = action({
  args: {
    content: v.string(),
    timestamp: v.number(),
    conversationHistory: v.array(v.object({
      role: v.string(),
      content: v.string(),
      timestamp: v.number()
    }))
  },
  handler: async (ctx, args) => {
    console.log("Starting generateAnswer with query:", args.content);
    
    try {
      // Get relevant content from documents
      let relevantDocs: Array<{ text: string; id: Id<"documents">; score: number; }> = [];
      try {
        relevantDocs = await ctx.runAction(api.search.hybridSearch, {
          query: args.content
        });
        console.log("Found relevant documents:", relevantDocs.length);
      } catch (error) {
        console.error("Error in hybrid search:", error);
        return "I apologize, but I encountered an error while searching for relevant information. Please try again later.";
      }
      
      // If no relevant documents found, return a specific message
      if (relevantDocs.length === 0) {
        return "I apologize, but I couldn't find any relevant information in my records to answer your question. Please try asking about something else or rephrase your question.";
      }
      
      // Prepare conversation history
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: "system" as const, content: SYSTEM_PROMPT },
        ...args.conversationHistory.map(msg => ({
          role: msg.role as "user" | "assistant",
          content: msg.content
        })),
        { role: "user" as const, content: args.content }
      ];

      // Add relevant document content
      const context = relevantDocs.map((doc: { text: string }) => doc.text).join("\n\n");
      console.log("Adding context from documents");
      messages.push({
        role: "system" as const,
        content: `IMPORTANT: Here is the ONLY information you should use to answer questions about Eda's experience. Do not use any other information or make assumptions:

${context}

Remember:
1. ONLY use information from the above context
2. If information is not present, say so
3. Do not make up or infer information
4. Be precise and factual`
      });

      console.log("Generating responses with both models");
      
      // Generate response with OpenAI
      let openaiResponse: string;
      try {
        const openaiCompletion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages,
          temperature: 0.3,
          max_tokens: 1000,
          presence_penalty: 0.3,
          frequency_penalty: 0.3,
          top_p: 0.7
        });
        openaiResponse = openaiCompletion.choices[0]?.message?.content || "No response from OpenAI";
      } catch (error) {
        console.error("OpenAI API error:", error);
        openaiResponse = "Error generating OpenAI response";
      }

      // Generate response with Cohere
      let cohereText: string;
      try {
        const cohereResponse = await cohere.generate({
          prompt: `${SYSTEM_PROMPT}\n\nContext: ${relevantDocs.map((doc: { text: string }) => doc.text).join("\n\n")}\n\nQuestion: ${args.content}\n\nAnswer:`,
          maxTokens: 1000,
          temperature: 0.8,
          k: 0,
          stopSequences: [],
          returnLikelihoods: 'NONE'
        });
        cohereText = cohereResponse.generations[0].text;
      } catch (error) {
        console.error("Cohere API error:", error);
        cohereText = "Error generating Cohere response";
      }

      // If both APIs failed, return a fallback response
      if (openaiResponse.includes("Error") && cohereText.includes("Error")) {
        return "I apologize, but I'm having trouble accessing my knowledge base at the moment. Please try again later.";
      }

      // Combine and refine the responses
      const finalPrompt = `Combine and refine these two responses about Eda's experience into one cohesive, natural answer. 
      Focus on maintaining a professional tone while telling a compelling story about her achievements.
      
      Response 1: ${openaiResponse}
      Response 2: ${cohereText}
      
      Refined Answer:`;

      let finalResponse: string;
      try {
        const finalCompletion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are an expert at combining and refining responses to create the most compelling narrative." },
            { role: "user", content: finalPrompt }
          ],
          temperature: 0.7,
          max_tokens: 1000
        });
        finalResponse = finalCompletion.choices[0]?.message?.content || "No final response generated";
      } catch (error) {
        console.error("Final response generation error:", error);
        // Return the better of the two original responses
        finalResponse = openaiResponse.includes("Error") ? cohereText : openaiResponse;
      }

      console.log("Generated final response");
      return finalResponse;
    } catch (error) {
      console.error("Error in generateAnswer:", error);
      return "I apologize, but I encountered an error while processing your request. Please try again later.";
    }
  },
});

export const sendMessage = mutation({
  args: {
    content: v.string(),
    timestamp: v.number(),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      content: args.content,
      role: args.role,
      timestamp: args.timestamp
    });
    return messageId;
  },
});

export const getMessages = query({
  handler: async (ctx) => {
    return await ctx.db.query("messages").order("desc").take(50);
  },
});

// Query to get documents
export const listDocuments = query({
  handler: async (ctx) => {
    return await ctx.db.query("documents").collect();
  },
});

