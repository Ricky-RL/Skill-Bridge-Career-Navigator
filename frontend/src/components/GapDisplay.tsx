import { AnalysisResult } from '@/lib/types';
import SkillTag from './ui/SkillTag';
import Card, { CardHeader, CardTitle, CardContent } from './ui/Card';

interface GapDisplayProps {
  analysis: AnalysisResult;
}

export default function GapDisplay({ analysis }: GapDisplayProps) {
  const { matching_skills, missing_skills, match_percentage, ai_generated, estimated_time } = analysis;

  // Determine color based on match percentage
  const getPercentageColor = () => {
    if (match_percentage >= 80) return 'text-green-600';
    if (match_percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = () => {
    if (match_percentage >= 80) return 'bg-green-500';
    if (match_percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Match Score */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Skill Match Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-4xl font-bold ${getPercentageColor()}`}>
              {match_percentage}%
            </span>
            {estimated_time && (
              <span className="text-sm text-gray-500">
                Estimated time to close gap: <strong>{estimated_time}</strong>
              </span>
            )}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${getProgressColor()}`}
              style={{ width: `${match_percentage}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-gray-500 flex items-center">
            {ai_generated ? (
              <>
                <svg className="w-4 h-4 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                AI-powered analysis
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                Rule-based analysis (AI unavailable)
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Skills Comparison */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Matching Skills */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="flex items-center text-green-700">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Skills You Have ({matching_skills.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {matching_skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {matching_skills.map((skill) => (
                  <SkillTag key={skill} skill={skill} variant="success" />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No matching skills found</p>
            )}
          </CardContent>
        </Card>

        {/* Missing Skills */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="flex items-center text-red-700">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              Skills to Learn ({missing_skills.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {missing_skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {missing_skills.map((skill) => (
                  <SkillTag key={skill} skill={skill} variant="error" />
                ))}
              </div>
            ) : (
              <p className="text-green-600 text-sm font-medium">
                You have all the required skills!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
