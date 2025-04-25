'use client';

import { ConvexProvider, ConvexReactClient } from 'convex/react';
import SignIn from '../components/SignIn';
import { useEffect, useState } from 'react';

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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F9FC]">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-sm">
          <div className="text-center">
            <h2 className="text-2xl font-medium text-gray-900 mb-4">Error</h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ConvexProvider client={convex}>
      <SignIn />
    </ConvexProvider>
  );
}
