'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation, useAction } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';
import SuggestedQuestions from './SuggestedQuestions';
import VoiceInput from './VoiceInput';
import { suggestedQuestions } from '../data/suggestedQuestions';
import { textToSpeechService } from '../utils/textToSpeech';

interface SearchResult {
  text: string;
  id: Id<"documents">;
  score: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export default function ChatInterface() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<number | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const sendMessage = useMutation(api.chat.sendMessage);
  const generateAnswer = useAction(api.chat.generateAnswer);
  const generateFollowUpQuestions = useAction(api.chat.generateFollowUpQuestions);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getContextualQuestions = () => {
    if (messages.length === 0) {
      return suggestedQuestions;
    }
    return followUpQuestions.map(question => ({
      question,
      answer: '' // The answer will be generated when the question is clicked
    }));
  };

  const playResponseAudio = async (text: string, messageTimestamp: number) => {
    try {
      setIsPlayingAudio(true);
      setPlayingMessageId(messageTimestamp);
      
      // Stop any currently playing audio
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
      
      const audio = await textToSpeechService.speak(text);
      if (audio) {
        setCurrentAudio(audio);
        
        // Listen for when audio ends
        audio.onended = () => {
          setIsPlayingAudio(false);
          setPlayingMessageId(null);
          setCurrentAudio(null);
        };
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlayingAudio(false);
      setPlayingMessageId(null);
      setCurrentAudio(null);
    }
  };

  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    setIsPlayingAudio(false);
    setPlayingMessageId(null);
    setCurrentAudio(null);
  };

  const handleQuestionClick = async (question: string) => {
    const timestamp = Date.now();
    setIsLoading(true);
    
    // Add the question to messages immediately
    setMessages(prev => [...prev, { content: question, role: 'user', timestamp }]);
    
    try {
      let response: string;
      
      // Check if this is an initial question from suggestedQuestions
      const predefinedAnswer = suggestedQuestions.find(q => q.question === question)?.answer;
      
      if (predefinedAnswer) {
        // Use the predefined answer for initial questions
        response = predefinedAnswer;
      } else {
        // Generate answer for follow-up questions
        response = await generateAnswer({
          content: question,
          timestamp,
          conversationHistory: messages
        });
      }

      // Add AI response to messages
      const aiMessage: Message = { 
        role: 'assistant', 
        content: response, 
        timestamp: Date.now() 
      };
      setMessages(prev => [...prev, aiMessage]);

      // Generate new follow-up questions based on the answer
      const newFollowUpQuestions = await generateFollowUpQuestions({
        currentAnswer: response,
        conversationHistory: [...messages, { content: question, role: 'user', timestamp }, aiMessage]
      });
      setFollowUpQuestions(newFollowUpQuestions);
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

      // Generate new follow-up questions based on the answer
      const newFollowUpQuestions = await generateFollowUpQuestions({
        currentAnswer: response,
        conversationHistory: [...messages, newMessage, aiMessage]
      });
      setFollowUpQuestions(newFollowUpQuestions);
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

  const handleVoiceTranscription = async (transcription: string) => {
    if (transcription.trim()) {
      const userMessage = transcription.trim();
      const timestamp = Date.now();
      setInput(''); // Clear any existing input
      setIsLoading(true);

      try {
        // Add user message to state and database
        const newMessage: Message = { role: 'user', content: userMessage, timestamp };
        setMessages(prev => [...prev, newMessage]);
        await sendMessage(newMessage);

        // Generate AI response
        const response = await generateAnswer({
          content: userMessage,
          timestamp,
          conversationHistory: messages
        });

        // Add AI response to state and database
        const aiMessage: Message = { role: 'assistant', content: response, timestamp: Date.now() };
        setMessages(prev => [...prev, aiMessage]);
        await sendMessage(aiMessage);

        // Auto-play the AI response for voice inputs
        setTimeout(() => {
          playResponseAudio(response, aiMessage.timestamp);
        }, 500); // Small delay to ensure message is rendered

        // Generate new follow-up questions based on the answer
        const newFollowUpQuestions = await generateFollowUpQuestions({
          currentAnswer: response,
          conversationHistory: [...messages, newMessage, aiMessage]
        });
        setFollowUpQuestions(newFollowUpQuestions);
      } catch (error) {
        console.error('Error in voice chat:', error);
        const errorMessage: Message = { 
          role: 'assistant', 
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-8 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0">
        {/* Chat Messages Area */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="backdrop-blur-xl bg-white/70 border border-white/50 rounded-3xl p-8 shadow-2xl shadow-blue-500/10">
                  <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 via-blue-700 to-indigo-700 bg-clip-text text-transparent mb-8">
                    Eda's AI Assistant
                  </h2>
                  <div className="backdrop-blur-sm bg-white/40 rounded-2xl p-6 border border-white/30 shadow-inner">
                    <SuggestedQuestions onQuestionClick={handleQuestionClick} />
                  </div>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <div
                    key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                    } animate-fadeIn`}
              >
                <div
                      className={`max-w-[80%] rounded-2xl p-6 backdrop-blur-xl border shadow-2xl ${
                    message.role === 'user'
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-blue-400/30 shadow-blue-500/20'
                          : 'bg-white/80 border-gray-200/50 text-gray-800 shadow-gray-500/10'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <p className="text-sm leading-relaxed flex-1">{message.content}</p>
                        {message.role === 'assistant' && (
                          <button
                            onClick={() => {
                              if (playingMessageId === message.timestamp) {
                                stopAudio();
                              } else {
                                playResponseAudio(message.content, message.timestamp);
                              }
                            }}
                            disabled={isPlayingAudio && playingMessageId !== message.timestamp}
                            className="ml-4 p-2 rounded-xl backdrop-blur-sm bg-gray-100/80 hover:bg-gray-200/80 transition-all duration-300 flex-shrink-0 border border-gray-300/50 hover:border-blue-400/50 group"
                            title={playingMessageId === message.timestamp ? "Stop audio" : "Play audio"}
                          >
                            {playingMessageId === message.timestamp ? (
                              <svg className="w-4 h-4 text-red-500 group-hover:text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 text-blue-600 group-hover:text-blue-700" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.846 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.846l3.537-3.816a1 1 0 011.617.816zM16 8a2 2 0 11-4 0 2 2 0 014 0zM14 8a2 2 0 012-2v4a2 2 0 01-2-2z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {!isLoading && getContextualQuestions().length > 0 && (
                  <div className="mt-8 animate-fadeIn">
                    <div className="backdrop-blur-xl bg-white/70 border border-white/50 rounded-2xl p-6 shadow-2xl shadow-blue-500/10">
                      <SuggestedQuestions onQuestionClick={handleQuestionClick} questions={getContextualQuestions()} />
                    </div>
                  </div>
                )}
              </>
            )}
            {isLoading && (
              <div className="flex justify-start animate-fadeIn">
                <div className="backdrop-blur-xl bg-white/80 rounded-2xl p-6 border border-gray-200/50 shadow-2xl shadow-gray-500/10">
                  <div className="flex space-x-3">
                    <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-3 h-3 bg-gradient-to-r from-indigo-600 to-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Right Side Voice Panel */}
        <div className="w-80 border-l border-gray-200/50 backdrop-blur-xl bg-white/40 relative z-10">
          <div className="h-full flex flex-col">
            {/* Voice Panel Header */}
            <div className="p-6 border-b border-gray-200/30">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Voice Assistant</h3>
              <p className="text-sm text-gray-600">Click to ask questions by voice</p>
            </div>
            
            {/* Voice Input Area */}
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="transform scale-150">
                <VoiceInput 
                  onTranscription={handleVoiceTranscription}
                  disabled={isLoading}
                />
              </div>
            </div>
            
            {/* Voice Panel Footer */}
            <div className="p-6 border-t border-gray-200/30">
              <div className="text-xs text-gray-500 space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Auto-send enabled</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Auto-playback enabled</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Text Input Area - Full Width Bottom */}
      <div className="border-t border-gray-200/50 backdrop-blur-xl bg-white/60 p-6 relative z-10">
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about Eda's experience..."
            className="flex-1 rounded-2xl border border-gray-300/50 bg-white/80 backdrop-blur-sm px-6 py-4 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-lg"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={`px-8 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg ${
              isLoading || !input.trim()
                ? 'bg-gray-300/50 text-gray-500 cursor-not-allowed border border-gray-400/30'
                : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 border border-blue-400/50 hover:border-blue-500/50 shadow-blue-500/25 hover:shadow-blue-500/40 transform hover:scale-105'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Thinking...</span>
              </div>
            ) : (
              'Send'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
