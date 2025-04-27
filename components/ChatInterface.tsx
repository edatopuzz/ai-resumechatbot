'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation, useAction } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';
import SuggestedQuestions from './SuggestedQuestions';
import { suggestedQuestions } from '../data/suggestedQuestions';

interface SearchResult {
  text: string;
  id: Id<"documents">;
  score: number;
}

type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

export default function ChatInterface() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useMutation(api.chat.sendMessage);
  const generateAnswer = useAction(api.chat.generateAnswer);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getContextualQuestions = () => {
    return suggestedQuestions;
  };

  const handleQuestionClick = async (question: string) => {
    // Find the predefined answer for this question
    const predefinedAnswer = suggestedQuestions.find(q => q.question === question)?.answer;
    
    if (predefinedAnswer) {
      const timestamp = Date.now();
      setIsLoading(true);
      
      // Add the question to messages immediately
      setMessages(prev => [...prev, { content: question, role: 'user', timestamp }]);
      
      // Simulate loading time for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Split the answer into sentences and group them into paragraphs
      const sentences = predefinedAnswer.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const paragraphs = [];
      let currentParagraph = '';
      
      for (let i = 0; i < sentences.length; i++) {
        currentParagraph += sentences[i].trim() + '. ';
        // Create a new paragraph every 2-3 sentences or when we reach the end
        if ((i + 1) % 3 === 0 || i === sentences.length - 1) {
          paragraphs.push(currentParagraph.trim());
          currentParagraph = '';
        }
      }

      // Add each paragraph as a separate message with a delay
      for (let i = 0; i < paragraphs.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 800)); // Delay between messages
        const aiMessage: Message = { 
          role: 'assistant', 
          content: paragraphs[i], 
          timestamp: timestamp + i + 1 
        };
        setMessages(prev => [...prev, aiMessage]);
      }
      
      setInput('');
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    const timestamp = Date.now();
    setInput('');
    setIsLoading(true);

    try {
      // Add user message to state and database
      const newMessage: Message = { role: 'user', content: userMessage, timestamp };
      setMessages(prev => [...prev, newMessage]);
      await sendMessage(newMessage);

      // Generate AI response for follow-up questions
      const response = await generateAnswer({
        content: userMessage,
        timestamp,
        conversationHistory: messages
      });

      // Add AI response to state and database
      const aiMessage: Message = { role: 'assistant', content: response, timestamp: Date.now() };
      setMessages(prev => [...prev, aiMessage]);
      await sendMessage(aiMessage);
    } catch (error) {
      console.error('Error in chat:', error);
      const errorMessage: Message = { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Welcome to Eda's Resume GPT
            </h2>
            <p className="text-gray-600 max-w-md mb-8">
              Ask me anything about my experience, skills, or achievements. I'm here to help!
            </p>
            <SuggestedQuestions onQuestionClick={handleQuestionClick} />
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-4 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                      : 'bg-white shadow-lg border border-gray-100'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{message.content}</p>
                </div>
              </div>
            ))}
            {!isLoading && getContextualQuestions().length > 0 && (
              <div className="mt-8">
                <SuggestedQuestions onQuestionClick={handleQuestionClick} questions={getContextualQuestions()} />
              </div>
            )}
          </>
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white/50 backdrop-blur-sm p-4">
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            className="flex-1 rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
              isLoading || !input.trim()
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600'
            }`}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
