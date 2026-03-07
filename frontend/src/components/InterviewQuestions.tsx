'use client';

import { useState } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from './ui/Card';
import Button from './ui/Button';

interface InterviewQuestion {
  category: string;
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tips?: string;
}

interface InterviewQuestionsProps {
  jobTitle: string;
  company: string;
  skills: string[];
  onGenerateQuestions: () => Promise<InterviewQuestion[]>;
}

export default function InterviewQuestions({
  jobTitle,
  company,
  skills,
  onGenerateQuestions,
}: InterviewQuestionsProps) {
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await onGenerateQuestions();
      setQuestions(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate questions');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'hard':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('behavioral') || cat.includes('soft')) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    }
    if (cat.includes('technical') || cat.includes('coding')) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      );
    }
    if (cat.includes('system') || cat.includes('design')) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  if (questions.length === 0) {
    return (
      <Card variant="elevated" className="bg-white">
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Prepare for Your Interview</h3>
          <p className="text-gray-500 text-sm mb-4 max-w-sm mx-auto">
            Generate mock interview questions based on the {jobTitle} role at {company} and the skills you need to learn.
          </p>
          {error && (
            <p className="text-red-500 text-sm mb-4">{error}</p>
          )}
          <Button
            variant="primary"
            onClick={handleGenerate}
            isLoading={loading}
            className="mx-auto"
          >
            {loading ? 'Generating Questions...' : 'Generate Interview Questions'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Group questions by category
  const groupedQuestions = questions.reduce((acc, q) => {
    if (!acc[q.category]) {
      acc[q.category] = [];
    }
    acc[q.category].push(q);
    return acc;
  }, {} as Record<string, InterviewQuestion[]>);

  return (
    <Card variant="elevated" className="bg-white">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Mock Interview Questions
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1">{questions.length} questions for {jobTitle}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleGenerate}
          isLoading={loading}
        >
          Regenerate
        </Button>
      </CardHeader>
      <CardContent className="space-y-6 max-h-[60vh] overflow-y-auto">
        {Object.entries(groupedQuestions).map(([category, categoryQuestions]) => (
          <div key={category}>
            <div className="flex items-center gap-2 mb-3 text-gray-700">
              {getCategoryIcon(category)}
              <h4 className="font-semibold">{category}</h4>
              <span className="text-xs text-gray-400">({categoryQuestions.length})</span>
            </div>
            <div className="space-y-3">
              {categoryQuestions.map((q, idx) => {
                const globalIdx = questions.indexOf(q);
                const isExpanded = expanded === globalIdx;

                return (
                  <div
                    key={idx}
                    className={`border rounded-lg transition-all ${
                      isExpanded ? 'border-violet-300 bg-violet-50/50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <button
                      onClick={() => setExpanded(isExpanded ? null : globalIdx)}
                      className="w-full p-4 text-left flex items-start gap-3"
                    >
                      <span className="text-gray-400 text-sm font-mono mt-0.5">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 font-medium pr-4">{q.question}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${getDifficultyColor(q.difficulty)}`}>
                            {q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1)}
                          </span>
                        </div>
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isExpanded && q.tips && (
                      <div className="px-4 pb-4 pl-12">
                        <div className="bg-white rounded-lg p-3 border border-violet-200">
                          <p className="text-xs font-semibold text-violet-600 mb-1">Tips for answering:</p>
                          <p className="text-sm text-gray-600">{q.tips}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
