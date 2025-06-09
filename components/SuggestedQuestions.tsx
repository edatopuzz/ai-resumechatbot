import { useState } from 'react';
import { suggestedQuestions } from '../data/suggestedQuestions';

interface SuggestedQuestionsProps {
  onQuestionClick: (question: string) => void;
  questions?: Array<{
    question: string;
    answer?: string;
  }>;
}

export default function SuggestedQuestions({ onQuestionClick, questions = suggestedQuestions }: SuggestedQuestionsProps) {
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);

  const handleQuestionClick = (question: string) => {
    setSelectedQuestion(question);
    onQuestionClick(question);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">Suggested Questions</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {questions.map((q, index) => (
          <button
            key={index}
            onClick={() => handleQuestionClick(q.question)}
            className={`p-4 rounded-xl text-left transition-all duration-300 backdrop-blur-sm border group ${
              selectedQuestion === q.question
                ? 'bg-blue-100/80 border-blue-400/50 shadow-lg shadow-blue-500/20 transform scale-105'
                : 'bg-white/60 border-gray-300/50 hover:border-blue-400/50 hover:bg-blue-50/80 shadow-md hover:shadow-lg hover:shadow-blue-500/10 hover:transform hover:scale-102'
            }`}
          >
            <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 leading-relaxed">{q.question}</p>
          </button>
        ))}
      </div>
    </div>
  );
} 