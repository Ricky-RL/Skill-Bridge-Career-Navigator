import { AnalysisResult } from '@/lib/types';
import SkillTag from './ui/SkillTag';
import Card, { CardHeader, CardTitle, CardContent } from './ui/Card';

interface GapDisplayProps {
  analysis: AnalysisResult;
}

export default function GapDisplay({ analysis }: GapDisplayProps) {
  const {
    matching_skills,
    missing_skills,
    match_percentage,
    ai_generated,
    estimated_time,
    profile_summary,
    experience_match
  } = analysis;

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
          <CardTitle>Profile Match Score</CardTitle>
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
                Rule-based analysis
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Profile Summary */}
      {profile_summary && (
        <Card variant="bordered" className="border-violet-200 bg-violet-50/50">
          <CardHeader>
            <CardTitle className="flex items-center text-violet-800">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Analysis Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">{profile_summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Experience Match Details */}
      {experience_match && (
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-800">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Profile Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {/* Education */}
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                  experience_match.education_match ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {experience_match.education_match ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Education</h4>
                  <p className="text-sm text-gray-600">{experience_match.education_details || 'No information available'}</p>
                </div>
              </div>

              {/* Work Experience */}
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                  experience_match.experience_match ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {experience_match.experience_match ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Work Experience</h4>
                  <p className="text-sm text-gray-600">{experience_match.experience_details || 'No information available'}</p>
                </div>
              </div>

              {/* Certifications */}
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                  experience_match.certifications_match ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {experience_match.certifications_match ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Certifications</h4>
                  <p className="text-sm text-gray-600">{experience_match.certifications_details || 'No certifications found'}</p>
                </div>
              </div>

              {/* Projects */}
              {experience_match.projects_relevance && (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-blue-100 text-blue-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Projects</h4>
                    <p className="text-sm text-gray-600">{experience_match.projects_relevance}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
