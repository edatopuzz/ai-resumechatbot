import React from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const ChatMessage = ({ message }: { message: Message }) => {
  return (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className="flex items-start space-x-3 max-w-[80%]">
        {message.role === 'assistant' && (
          <div className="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
            <span className="text-sm font-medium text-blue-600">AI</span>
          </div>
        )}
        <div
          className={`rounded-lg p-3 ${
            message.role === 'user'
              ? 'bg-blue-500 text-white'
              : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
        {message.role === 'user' && (
          <div className="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
            <span className="text-sm font-medium text-gray-600">You</span>
          </div>
        )}
      </div>
    </div>
  );
}; 