'use client';

import { useEffect, useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useRouter, useSearchParams } from 'next/navigation';

export default function VerifyPage() {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const verifyAccess = useMutation(api.auth.verifyAccess);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus('error');
        setError('No verification token provided');
        return;
      }

      try {
        await verifyAccess({ token });
        setStatus('success');
        // Redirect to chat page after successful verification
        setTimeout(() => {
          router.push('/chat');
        }, 2000);
      } catch (error) {
        setStatus('error');
        setError('Invalid or expired verification token');
      }
    };

    verifyToken();
  }, [token, verifyAccess, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F9FC]">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-sm">
        <div className="text-center">
          {status === 'verifying' && (
            <>
              <h2 className="text-2xl font-medium text-gray-900 mb-4">Verifying Access</h2>
              <p className="text-gray-600">Please wait while we verify your access...</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <h2 className="text-2xl font-medium text-gray-900 mb-4">Access Verified</h2>
              <p className="text-gray-600">Your access has been verified. Redirecting to chat...</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <h2 className="text-2xl font-medium text-gray-900 mb-4">Verification Failed</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => router.push('/')}
                className="text-sm text-[#635BFF] hover:text-[#4F46E5]"
              >
                Back to Sign In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 