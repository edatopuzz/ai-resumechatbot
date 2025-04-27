import { useState } from 'react';
import { suggestedQuestions } from '../data/suggestedQuestions';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';

interface SuggestedQuestionsProps {
  onQuestionClick: (question: string) => void;
  questions?: typeof suggestedQuestions;
}

export default function SuggestedQuestions({ onQuestionClick, questions = suggestedQuestions }: SuggestedQuestionsProps) {
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);

  const handleQuestionClick = (question: string) => {
    setSelectedQuestion(question);
    onQuestionClick(question);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Suggested Questions</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {questions.map((q, index) => (
          <button
            key={index}
            onClick={() => handleQuestionClick(q.question)}
            className={`p-4 rounded-lg text-left transition-all duration-200 ${
              selectedQuestion === q.question
                ? 'bg-indigo-50 border-2 border-indigo-500 shadow-lg shadow-indigo-100'
                : 'bg-white border border-gray-200 hover:border-indigo-300 shadow-md hover:shadow-lg hover:shadow-indigo-50'
            }`}
          >
            <p className="text-sm font-medium text-gray-900">{q.question}</p>
          </button>
        ))}
      </div>
    </div>
  );
} 