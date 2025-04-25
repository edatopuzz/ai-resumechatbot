'use client';

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import ChatInterface from "../../components/ChatInterface";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function ChatContent() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const { hasAccess } = useQuery(api.auth.checkAccess, { email: email || "" }) || { hasAccess: false };

  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail");
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      router.push("/");
    }
  }, [router]);

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F9FC]">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-sm">
          <div className="text-center">
            <h2 className="text-2xl font-medium text-gray-900 mb-4">Access Required</h2>
            <p className="text-gray-600 mb-6">
              Please verify your email to access the chat interface.
            </p>
            <button
              onClick={() => router.push("/")}
              className="text-sm text-[#635BFF] hover:text-[#4F46E5]"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="h-screen w-screen overflow-hidden">
      <ChatInterface />
    </main>
  );
}

export default function ChatPage() {
  return (
    <ConvexProvider client={convex}>
      <ChatContent />
    </ConvexProvider>
  );
} 