'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import api from '@/lib/api';
import { BulkComparisonResult, JobMatchSummary, SkillFrequency, UserProfile } from '@/lib/types';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Chatbot from '@/components/Chatbot';
import { buildChatContext } from '@/lib/chatContext';

const ROLE_TYPES = [
  'Cloud Engineer',
  'Backend Developer',
  'Frontend Developer',
  'Full Stack Developer',
  'DevOps Engineer',
  'Data Engineer',
  'Machine Learning Engineer',
  'Security Engineer',
  'Site Reliability Engineer',
  'Platform Engineer',
  'Software Engineer',
  'Solutions Architect',
];

const EXPERIENCE_LEVELS = ['Entry Level', 'Mid', 'Senior', 'Staff', 'Principal', 'Management'];

export default function ComparePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Filter state
  const [roleType, setRoleType] = useState<string>('');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState<string>('');
  const [maxJobs, setMaxJobs] = useState(30);
  const [availableIndustries, setAvailableIndustries] = useState<string[]>([]);

  // Results state
  const [comparing, setComparing] = useState(false);
  const [result, setResult] = useState<BulkComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobMatchSummary | null>(null);

  useEffect(() => {
    const init = async () => {
      const response = await supabase.auth.getSession();
      const session = response?.data?.session;
      if (!session) {
        router.push('/auth/login');
        return;
      }

      setUserId(session.user.id);

      try {
        // Load user profile and industries in parallel
        const [profile, industriesResponse] = await Promise.all([
          api.getProfile(session.user.id),
          api.getIndustries(),
        ]);
        setUserProfile(profile);
        setAvailableIndustries(industriesResponse.industries);
      } catch {
        router.push('/profile');
        return;
      }

      setLoading(false);
    };

    init();
  }, [router]);

  const handleCompare = async () => {
    if (!userId) return;

    setComparing(true);
    setError(null);
    setSelectedJob(null);

    try {
      const response = await api.bulkCompare({
        user_id: userId,
        role_type: roleType || undefined,
        industries: selectedIndustries.length > 0 ? selectedIndustries : undefined,
        experience_level: experienceLevel || undefined,
        max_jobs: maxJobs,
      });

      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compare roles');
    } finally {
      setComparing(false);
    }
  };

  const toggleIndustry = (industry: string) => {
    setSelectedIndustries((prev) =>
      prev.includes(industry) ? prev.filter((i) => i !== industry) : [...prev, industry]
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 70) return 'bg-green-100';
    if (score >= 50) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-purple pt-4 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="text-white mb-6 md:mb-0">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Compare Roles</h1>
              <p className="text-white/80 text-lg">
                See how your skills stack up across the job market
              </p>
            </div>
            <Button variant="yellow" onClick={() => router.push('/profile')} rightIcon>
              Update Skills
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-6 pb-12">
          {/* Filters Panel */}
          <div className="lg:col-span-1">
            <Card variant="elevated" className="bg-white sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Role Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role Type</label>
                  <select
                    value={roleType}
                    onChange={(e) => setRoleType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  >
                    <option value="">All Roles</option>
                    {ROLE_TYPES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Industries */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Industries</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {availableIndustries.map((industry) => (
                      <label key={industry} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedIndustries.includes(industry)}
                          onChange={() => toggleIndustry(industry)}
                          className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                        />
                        <span className="text-sm text-gray-700">{industry}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Experience Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  >
                    <option value="">All Levels</option>
                    {EXPERIENCE_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Max Jobs */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Jobs to Analyze: {maxJobs}
                  </label>
                  <input
                    type="range"
                    min={5}
                    max={50}
                    value={maxJobs}
                    onChange={(e) => setMaxJobs(Number(e.target.value))}
                    className="w-full accent-violet-600"
                  />
                </div>

                <Button onClick={handleCompare} isLoading={comparing} className="w-full">
                  {comparing ? 'Analyzing...' : 'Compare Now'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-3 space-y-6">
            {comparing ? (
              <Card variant="elevated" className="bg-white">
                <CardContent className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Analyzing {maxJobs} Jobs...</h3>
                  <p className="text-gray-500 text-sm">This may take a few moments</p>
                </CardContent>
              </Card>
            ) : result ? (
              <>
                {/* Market Readiness Score */}
                <Card variant="elevated" className="bg-white">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                      <div className="flex items-center gap-6">
                        <div
                          className={`w-24 h-24 rounded-full flex items-center justify-center ${getScoreBgColor(result.market_readiness_score)}`}
                        >
                          <span className={`text-3xl font-bold ${getScoreColor(result.market_readiness_score)}`}>
                            {result.market_readiness_score}%
                          </span>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Market Readiness Score</h3>
                          <p className="text-gray-500 text-sm mt-1">
                            Based on {result.total_jobs_analyzed} jobs analyzed
                          </p>
                          <p className="text-gray-600 text-sm mt-2">
                            Average match: {result.avg_match_percentage}%
                          </p>
                        </div>
                      </div>
                      {result.best_fit_industries.length > 0 && (
                        <div className="bg-violet-50 rounded-xl p-4">
                          <p className="text-sm font-medium text-violet-700 mb-2">Best Fit Industries</p>
                          <div className="flex flex-wrap gap-2">
                            {result.best_fit_industries.map((industry) => (
                              <span
                                key={industry}
                                className="px-2 py-1 bg-violet-100 text-violet-700 rounded text-xs font-medium"
                              >
                                {industry}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Skills Analysis */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Most Requested Skills */}
                  <Card variant="elevated" className="bg-white">
                    <CardHeader>
                      <CardTitle className="text-lg">Most Requested Skills</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {result.most_requested_skills.map((skill) => (
                        <SkillBar key={skill.skill} skill={skill} />
                      ))}
                      {result.most_requested_skills.length === 0 && (
                        <p className="text-gray-500 text-sm text-center py-4">No data available</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Skills to Prioritize */}
                  <Card variant="elevated" className="bg-white">
                    <CardHeader>
                      <CardTitle className="text-lg">Skills to Prioritize</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {result.most_missing_skills.map((skill, idx) => (
                        <div key={skill.skill} className="flex items-center gap-3">
                          <span className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900">{skill.skill}</span>
                              <span className="text-sm text-gray-500">{skill.percentage}% of jobs</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {result.most_missing_skills.length === 0 && (
                        <p className="text-green-600 text-sm text-center py-4">
                          You have all the commonly requested skills!
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Job Matches */}
                <Card variant="elevated" className="bg-white">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Top Job Matches</CardTitle>
                      <span className="text-sm text-gray-500">{result.job_matches.length} jobs</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="divide-y divide-gray-100">
                      {result.job_matches.slice(0, 10).map((job) => (
                        <div
                          key={job.job_id}
                          onClick={() => setSelectedJob(selectedJob?.job_id === job.job_id ? null : job)}
                          className={`py-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedJob?.job_id === job.job_id ? 'bg-violet-50' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{job.title}</h4>
                              <p className="text-sm text-violet-600">{job.company}</p>
                              <div className="flex gap-2 mt-1">
                                <span className="text-xs text-gray-500">{job.industry}</span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-500">{job.experience_level}</span>
                              </div>
                            </div>
                            <span
                              className={`text-lg font-bold px-3 py-1 rounded ${
                                job.match_percentage >= 70
                                  ? 'bg-green-100 text-green-700'
                                  : job.match_percentage >= 50
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {job.match_percentage}%
                            </span>
                          </div>

                          {/* Expanded details */}
                          {selectedJob?.job_id === job.job_id && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm font-medium text-green-700 mb-2">
                                    Matching Skills ({job.matching_skills.length})
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {job.matching_skills.map((skill) => (
                                      <span
                                        key={skill}
                                        className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs"
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-red-700 mb-2">
                                    Missing Skills ({job.missing_skills.length})
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {job.missing_skills.map((skill) => (
                                      <span
                                        key={skill}
                                        className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs"
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <div className="mt-4 pt-4 border-t border-gray-100">
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/jobs?job_id=${job.job_id}`);
                                  }}
                                >
                                  View Full Job Posting
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card variant="elevated" className="bg-white">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Ready to Compare</h3>
                  <p className="text-gray-500 text-sm mb-4 max-w-md mx-auto">
                    Select filters on the left and click "Compare Now" to see how your skills match
                    against multiple job postings.
                  </p>
                  <p className="text-gray-400 text-xs">
                    Your profile has {userProfile?.skills.length || 0} skills
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Chatbot */}
      <Chatbot
        context={buildChatContext({
          profile: userProfile,
        })}
        userId={userId || undefined}
      />
    </div>
  );
}

// Skill frequency bar component
function SkillBar({ skill }: { skill: SkillFrequency }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-gray-900 text-sm">{skill.skill}</span>
          <span className="text-xs text-gray-500">{skill.percentage}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${skill.user_has ? 'bg-green-500' : 'bg-violet-500'}`}
            style={{ width: `${skill.percentage}%` }}
          />
        </div>
      </div>
      {skill.user_has ? (
        <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-gray-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </div>
  );
}
