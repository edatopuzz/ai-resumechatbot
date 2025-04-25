'use client';

import { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { useRouter } from 'next/navigation';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const requestAccess = useMutation(api.auth.requestAccess);

  useEffect(() => {
    console.log('SignIn component mounted');
    console.log('Convex URL:', process.env.NEXT_PUBLIC_CONVEX_URL);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      console.log('Requesting access for email:', email);
      await requestAccess({ email });
      console.log('Access request successful');
      localStorage.setItem("userEmail", email);
      setSuccess(true);
      setTimeout(() => {
        router.push("/chat");
      }, 2000);
    } catch (error) {
      console.error('Access request failed:', error);
      setError('Failed to request access. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="max-w-md w-full p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100">
          <div className="text-center">
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Access Granted
            </h2>
            <p className="text-gray-600 mb-6">
              Redirecting you to the chat interface...
            </p>
            <div className="flex justify-center space-x-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sign In Section */}
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
              </div>
              <h1 className="text-3xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2 tracking-tight">
                Eda's Resume GPT
              </h1>
              <p className="text-gray-600 text-base mb-4 font-light">Advanced AI-Powered Professional Profile</p>
              <div className="bg-white/90 p-4 rounded-lg border border-gray-100">
                <p className="text-gray-600 text-sm leading-relaxed font-light">
                  Welcome! I'm an advanced AI assistant powered by state-of-the-art language models and custom RAG architecture. 
                  I can provide detailed insights into Eda's technical expertise, project implementations, and professional achievements. 
                  Built with cutting-edge AI technologies and modern web architecture.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-light text-gray-600 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white/80 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your email"
                  required
                />
              </div>

              {error && (
                <div className="text-sm text-red-500 bg-red-50/50 p-2 rounded-lg border border-red-100">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-2 px-4 rounded-lg font-light transition-all duration-200 ${
                  isLoading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                ) : (
                  'Request Access'
                )}
              </button>
            </form>
          </div>

          {/* Technical Details Section */}
          <div className="space-y-3 max-w-md">
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-sm border border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-2 text-base">
                Advanced AI Processing
              </h4>
              <ul className="text-sm text-gray-600 space-y-1 font-light">
                <li className="flex items-center">
                  <span className="mr-2 text-gray-400">•</span>
                  Custom RAG implementation with LlamaIndex for semantic understanding
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-gray-400">•</span>
                  Multi-model architecture using GPT-4 and Cohere
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-gray-400">•</span>
                  Advanced prompt engineering with dynamic context injection
                </li>
              </ul>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-sm border border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-2 text-base">
                Scalable Architecture
              </h4>
              <ul className="text-sm text-gray-600 space-y-1 font-light">
                <li className="flex items-center">
                  <span className="mr-2 text-gray-400">•</span>
                  Real-time data synchronization with Convex
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-gray-400">•</span>
                  Type-safe operations with automatic schema validation
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-gray-400">•</span>
                  Optimized serverless functions with cold start handling
                </li>
              </ul>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-sm border border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-2 text-base">
                Intelligent Search
              </h4>
              <ul className="text-sm text-gray-600 space-y-1 font-light">
                <li className="flex items-center">
                  <span className="mr-2 text-gray-400">•</span>
                  Hybrid search combining vector similarity and keyword matching
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-gray-400">•</span>
                  Context-aware response generation with chain-of-thought reasoning
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-gray-400">•</span>
                  Dynamic context window management for optimal performance
                </li>
              </ul>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-sm border border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-2 text-base">
                Modern Frontend
              </h4>
              <ul className="text-sm text-gray-600 space-y-1 font-light">
                <li className="flex items-center">
                  <span className="mr-2 text-gray-400">•</span>
                  Next.js 14 with App Router and React Server Components
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-gray-400">•</span>
                  Real-time updates with WebSocket integration
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-gray-400">•</span>
                  Optimistic UI updates for seamless user experience
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 