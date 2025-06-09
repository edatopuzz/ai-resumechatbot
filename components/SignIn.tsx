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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-8 animate-pulse" style={{ animationDelay: '4s' }}></div>
        </div>
        
        <div className="max-w-md w-full p-8 backdrop-blur-xl bg-white/70 border border-white/50 rounded-3xl shadow-2xl shadow-blue-500/10 relative z-10">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 via-blue-700 to-indigo-700 bg-clip-text text-transparent mb-4">
              Access Granted
            </h2>
            <p className="text-gray-600 mb-8">
              Redirecting you to the chat interface...
            </p>
            <div className="flex justify-center space-x-3">
              <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-3 h-3 bg-gradient-to-r from-indigo-600 to-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-8 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4 py-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sign In Section */}
          <div className="backdrop-blur-xl bg-white/70 border border-white/50 p-8 rounded-3xl shadow-2xl shadow-blue-500/10">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 via-blue-700 to-indigo-700 bg-clip-text text-transparent mb-6 tracking-tight">
                Eda's Resume GPT
              </h1>
              <div className="flex justify-center mb-6">
                <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-blue-200/50 hover:scale-105 transition-transform duration-200 shadow-lg">
                  <img 
                    src="/eda-profile.jpg" 
                    alt="Eda Topuz" 
                    className="w-full h-full object-cover scale-110"
                  />
                </div>
              </div>
              <div className="backdrop-blur-sm bg-white/40 rounded-2xl p-6 border border-white/30 shadow-inner mb-6">
                <p className="text-gray-600 text-sm leading-relaxed font-light">
                  Hey there! I'm Eda's AI assistant — built by Eda to give you a fast, smart way to explore her professional journey.
                  Ask me about her skills, projects, and career milestones — I'm powered by advanced AI and modern web technologies.
                  Feel free to dive in and get to know Eda better!
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-6 py-4 border border-gray-300/50 rounded-2xl bg-white/80 backdrop-blur-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-lg"
                  placeholder="Enter your email"
                  required
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50/80 backdrop-blur-sm p-4 rounded-2xl border border-red-200/50">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 px-8 rounded-2xl font-semibold transition-all duration-300 shadow-lg ${
                  isLoading
                    ? 'bg-gray-300/50 text-gray-500 cursor-not-allowed border border-gray-400/30'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 border border-blue-400/50 hover:border-blue-500/50 shadow-blue-500/25 hover:shadow-blue-500/40 transform hover:scale-105'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-3 h-3 bg-gradient-to-r from-indigo-600 to-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                ) : (
                  'Request Access'
                )}
              </button>
            </form>
          </div>

          {/* Technical Details Section */}
          <div className="space-y-4 max-w-md">
            <div className="backdrop-blur-xl bg-white/70 border border-white/50 p-6 rounded-3xl shadow-2xl shadow-blue-500/10">
              <h4 className="font-semibold text-gray-800 mb-4 text-lg">
                AI Architecture
              </h4>
              <ul className="text-sm text-gray-600 space-y-2 font-light">
                <li className="flex items-center">
                  <span className="mr-3 text-blue-400">•</span>
                  GPT-4 and Cohere dual-model system
                </li>
                <li className="flex items-center">
                  <span className="mr-3 text-blue-400">•</span>
                  Custom document processing pipeline with semantic chunking
                </li>
                <li className="flex items-center">
                  <span className="mr-3 text-blue-400">•</span>
                  Advanced prompt engineering with context injection
                </li>
                <li className="flex items-center">
                  <span className="mr-3 text-blue-400">•</span>
                  Multi-model response refinement pipeline
                </li>
              </ul>
            </div>

            <div className="backdrop-blur-xl bg-white/70 border border-white/50 p-6 rounded-3xl shadow-2xl shadow-blue-500/10">
              <h4 className="font-semibold text-gray-800 mb-4 text-lg">
                Backend Architecture
              </h4>
              <ul className="text-sm text-gray-600 space-y-2 font-light">
                <li className="flex items-center">
                  <span className="mr-3 text-blue-400">•</span>
                  Convex real-time database with instant sync
                </li>
                <li className="flex items-center">
                  <span className="mr-3 text-blue-400">•</span>
                  Type-safe operations with schema validation
                </li>
                <li className="flex items-center">
                  <span className="mr-3 text-blue-400">•</span>
                  Serverless functions with cold start optimization
                </li>
                <li className="flex items-center">
                  <span className="mr-3 text-blue-400">•</span>
                  Real-time chat message synchronization
                </li>
              </ul>
            </div>

            <div className="backdrop-blur-xl bg-white/70 border border-white/50 p-6 rounded-3xl shadow-2xl shadow-blue-500/10">
              <h4 className="font-semibold text-gray-800 mb-4 text-lg">
                Search Engine
              </h4>
              <ul className="text-sm text-gray-600 space-y-2 font-light">
                <li className="flex items-center">
                  <span className="mr-3 text-blue-400">•</span>
                  Vector and keyword hybrid search system
                </li>
                <li className="flex items-center">
                  <span className="mr-3 text-blue-400">•</span>
                  Context-aware response generation
                </li>
                <li className="flex items-center">
                  <span className="mr-3 text-blue-400">•</span>
                  Dynamic context window management
                </li>
                <li className="flex items-center">
                  <span className="mr-3 text-blue-400">•</span>
                  Intelligent follow-up question generation
                </li>
              </ul>
            </div>

            <div className="backdrop-blur-xl bg-white/70 border border-white/50 p-6 rounded-3xl shadow-2xl shadow-blue-500/10">
              <h4 className="font-semibold text-gray-800 mb-4 text-lg">
                Frontend Stack
              </h4>
              <ul className="text-sm text-gray-600 space-y-2 font-light">
                <li className="flex items-center">
                  <span className="mr-3 text-blue-400">•</span>
                  Next.js 14 with React Server Components
                </li>
                <li className="flex items-center">
                  <span className="mr-3 text-blue-400">•</span>
                  ElevenLabs Turbo v2.5 premium audio integration
                </li>
                <li className="flex items-center">
                  <span className="mr-3 text-blue-400">•</span>
                  Optimistic UI with error handling
                </li>
                <li className="flex items-center">
                  <span className="mr-3 text-blue-400">•</span>
                  Responsive design with modern UI
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 