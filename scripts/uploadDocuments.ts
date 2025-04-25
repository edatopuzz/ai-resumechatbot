import { ConvexClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const documents = [
  {
    name: "Experience - Software Development",
    content: `Eda is a skilled software developer with experience in full-stack development, particularly in React, Next.js, and TypeScript. She has demonstrated strong problem-solving abilities and a keen eye for user experience in her projects.`
  },
  {
    name: "Skills - Technical",
    content: `Technical skills include: React, Next.js, TypeScript, Node.js, Python, SQL, GraphQL, REST APIs, Git, and cloud services (AWS, GCP). Strong focus on writing clean, maintainable code and implementing best practices.`
  },
  {
    name: "Education",
    content: `Computer Science background with strong foundation in algorithms, data structures, and software engineering principles. Continuous learner who stays up-to-date with latest technologies and best practices.`
  }
];

async function uploadDocuments() {
  const client = new ConvexClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  
  for (const doc of documents) {
    try {
      await client.mutation(api.documents.uploadDocument, doc);
      console.log(`Uploaded document: ${doc.name}`);
    } catch (error) {
      console.error(`Error uploading ${doc.name}:`, error);
    }
  }
}

uploadDocuments().catch(console.error); 