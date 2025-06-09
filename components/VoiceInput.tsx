'use client';

import { useState, useEffect } from 'react';
import { speechToTextService } from '../utils/speechToText';

interface VoiceInputProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
}

export default function VoiceInput({ onTranscription, disabled = false }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  // Timer for recording duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      setError(null);
      setIsRecording(true);
      await speechToTextService.startRecording();
    } catch (error) {
      console.error('Failed to start recording:', error);
      setError(error instanceof Error ? error.message : 'Failed to start recording');
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      setIsProcessing(true);
      const transcription = await speechToTextService.stopRecording();
      
      if (transcription.trim()) {
        onTranscription(transcription.trim());
      } else {
        setError('No speech detected. Please try again.');
      }
    } catch (error) {
      console.error('Failed to process recording:', error);
      setError(error instanceof Error ? error.message : 'Failed to process recording');
    } finally {
      setIsRecording(false);
      setIsProcessing(false);
    }
  };

  const cancelRecording = () => {
    speechToTextService.cancelRecording();
    setIsRecording(false);
    setIsProcessing(false);
    setError(null);
  };

  const handleClick = () => {
    if (disabled) return;
    
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      {/* Main Voice Button */}
      <button
        onClick={handleClick}
        disabled={disabled || isProcessing}
        className={`relative p-4 rounded-full transition-all duration-300 shadow-lg transform hover:scale-105 ${
          isRecording
            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-500/25 hover:shadow-red-500/40 animate-pulse'
            : disabled || isProcessing
            ? 'bg-gray-300/50 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-blue-500/25 hover:shadow-blue-500/40'
        }`}
        title={
          isRecording 
            ? 'Click to stop recording' 
            : isProcessing 
            ? 'Processing...' 
            : 'Click to start voice input'
        }
      >
        {isProcessing ? (
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : isRecording ? (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
          </svg>
        )}
        
        {/* Recording indicator */}
        {isRecording && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-ping" />
        )}
      </button>

      {/* Recording Timer */}
      {isRecording && (
        <div className="text-sm text-red-600 font-mono bg-red-50 px-3 py-1 rounded-full border border-red-200">
          🔴 {formatTime(recordingTime)}
        </div>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
          🔄 Processing audio...
        </div>
      )}

      {/* Cancel Button (only show when recording) */}
      {isRecording && (
        <button
          onClick={cancelRecording}
          className="text-xs text-gray-500 hover:text-red-500 transition-colors duration-200 bg-gray-100 hover:bg-red-50 px-3 py-1 rounded-full border border-gray-300 hover:border-red-300"
        >
          Cancel
        </button>
      )}

      {/* Error Message */}
      {error && (
        <div className="text-xs text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200 max-w-xs text-center">
          {error}
        </div>
      )}

      {/* Instructions */}
      {!isRecording && !isProcessing && !error && (
        <div className="text-xs text-gray-500 text-center max-w-xs">
          Speak your question
        </div>
      )}
    </div>
  );
} 