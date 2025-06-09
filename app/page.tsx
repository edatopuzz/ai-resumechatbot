'use client';

import { useState, useEffect } from 'react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';

// Ensure the Convex URL is available
if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  console.error('NEXT_PUBLIC_CONVEX_URL is not defined');
}

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function Home() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Convex URL:', process.env.NEXT_PUBLIC_CONVEX_URL);
  }, []);

  return (
    <ConvexProvider client={convex}>
      <div className="min-h-screen flex items-center justify-center bg-[#F6F9FC]">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-sm">
          <div className="text-center">
            <h2 className="text-2xl font-medium text-gray-900 mb-4">Eda's Resume GPT</h2>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    </ConvexProvider>
  );
}
