'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import api from '@/lib/api';
import { JobPosting, AnalysisResult } from '@/lib/types';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import JobPostingCard from '@/components/JobPostingCard';
import GapDisplay from '@/components/GapDisplay';
import RoadmapCard from '@/components/RoadmapCard';

const COMPANIES = ['Google', 'Amazon', 'Palo Alto Networks', 'Apple', 'Meta'];

export default function JobsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [postings, setPostings] = useState<JobPosting[]>([]);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [targetIndustries, setTargetIndustries] = useState<string[]>([]);
  const [selectedPosting, setSelectedPosting] = useState<JobPosting | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [showSuggested, setShowSuggested] = useState(true);

  useEffect(() => {
    const init = async () => {
      const response = await supabase.auth.getSession();
      const session = response?.data?.session;
      if (!session) {
        router.push('/auth/login');
        return;
      }

      // Load user profile for skills and industries
      try {
        const profile = await api.getProfile(session.user.id);
        setUserSkills(profile.skills || []);
        setTargetIndustries(profile.target_industries || []);

        // Load suggested postings based on target industries
        if (profile.target_industries?.length) {
          const suggested = await api.getSuggestedPostings(session.user.id, 20);
          setPostings(suggested);
        } else {
          // Load all postings if no industries selected
          const allPostings = await api.getJobPostings({ limit: 20 });
          setPostings(allPostings);
          setShowSuggested(false);
        }
      } catch (err) {
        // No profile, load all postings
        const allPostings = await api.getJobPostings({ limit: 20 });
        setPostings(allPostings);
        setShowSuggested(false);
      }

      setLoading(false);
    };

    init();
  }, [router]);

  const handleSearch = async () => {
    setLoading(true);
    setShowSuggested(false);
    try {
      const results = await api.getJobPostings({
        search: searchQuery || undefined,
        company: selectedCompany || undefined,
        industries: targetIndustries.length ? targetIndustries : undefined,
        limit: 20,
      });
      setPostings(results);
    } catch (err) {
      setError('Failed to search job postings');
    }
    setLoading(false);
  };

  const handleAnalyze = async (posting: JobPosting) => {
    setSelectedPosting(posting);
    setAnalysis(null);
    setAnalyzing(true);
    setError(null);

    try {
      const result = await api.analyzeSkills({
        user_skills: userSkills,
        job_posting_id: posting.id,
      });
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze skills');
    } finally {
      setAnalyzing(false);
    }
  };

  const clearSelection = () => {
    setSelectedPosting(null);
    setAnalysis(null);
  };

  const getCompanyColor = (company: string) => {
    const colors: Record<string, string> = {
      'Google': 'bg-blue-500',
      'Amazon': 'bg-orange-500',
      'Meta': 'bg-blue-600',
      'Apple': 'bg-gray-800',
      'Palo Alto Networks': 'bg-red-500',
    };
    return colors[company] || 'bg-violet-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading job postings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-purple pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="text-white mb-6 md:mb-0">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Job Postings</h1>
              <p className="text-white/80 text-lg">
                {showSuggested
                  ? 'Personalized matches based on your target industries'
                  : 'Browse and analyze your fit for top tech roles'}
              </p>
            </div>
            <Button
              variant="yellow"
              onClick={() => router.push('/profile')}
              rightIcon
            >
              Update Profile
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

        {/* Search and Filters */}
        <Card variant="elevated" className="mb-8">
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by title, description, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="rounded-xl"
                />
              </div>
              <select
                className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white"
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
              >
                <option value="">All Companies</option>
                {COMPANIES.map((company) => (
                  <option key={company} value={company}>
                    {company}
                  </option>
                ))}
              </select>
              <Button variant="primary" onClick={handleSearch}>
                Search
              </Button>
            </div>
            {targetIndustries.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 items-center">
                <span className="text-sm text-gray-500">Your industries:</span>
                {targetIndustries.map((industry) => (
                  <span
                    key={industry}
                    className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm font-medium"
                  >
                    {industry}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8 pb-12">
          {/* Job Listings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-gray-900">
                {postings.length} {postings.length === 1 ? 'Position' : 'Positions'} Found
              </h2>
            </div>
            <div className="space-y-4">
              {postings.map((posting) => (
                <JobPostingCard
                  key={posting.id}
                  posting={posting}
                  userSkills={userSkills}
                  onAnalyze={handleAnalyze}
                  isSelected={selectedPosting?.id === posting.id}
                />
              ))}
              {postings.length === 0 && (
                <Card variant="bordered" className="bg-white">
                  <CardContent className="p-8 text-center text-gray-500">
                    <div className="text-5xl mb-4">🔍</div>
                    <p className="font-medium">No job postings found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Analysis Panel */}
          <div className="lg:sticky lg:top-4 h-fit space-y-6">
            {selectedPosting ? (
              <>
                <Card variant="elevated" className="bg-white overflow-hidden">
                  <div className={`h-2 ${getCompanyColor(selectedPosting.company)}`} />
                  <CardHeader className="flex flex-row items-start justify-between pt-5">
                    <div>
                      <CardTitle className="text-xl">{selectedPosting.title}</CardTitle>
                      <p className="text-violet-600 font-semibold">{selectedPosting.company}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={clearSelection} className="text-gray-400 hover:text-gray-600">
                      ✕
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-5 max-h-[70vh] overflow-y-auto">
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1.5 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
                        📍 {selectedPosting.location}
                      </span>
                      <span className="px-3 py-1.5 bg-violet-100 rounded-full text-sm font-medium text-violet-700">
                        {selectedPosting.experience_level}
                      </span>
                      <span className="px-3 py-1.5 bg-blue-100 rounded-full text-sm font-medium text-blue-700">
                        {selectedPosting.industry}
                      </span>
                    </div>

                    {selectedPosting.salary_range && (
                      <div className="bg-green-50 rounded-xl p-4">
                        <p className="text-green-700 font-bold text-lg">{selectedPosting.salary_range}</p>
                        <p className="text-green-600 text-sm">Base salary + bonus + equity</p>
                      </div>
                    )}

                    {/* About the Job */}
                    {selectedPosting.about_the_job && (
                      <div>
                        <h4 className="font-bold text-gray-900 mb-3">About the Job</h4>
                        <p className="text-gray-600 text-sm whitespace-pre-line leading-relaxed">
                          {selectedPosting.about_the_job}
                        </p>
                      </div>
                    )}

                    {/* Minimum Qualifications */}
                    {selectedPosting.minimum_qualifications?.length > 0 && (
                      <div>
                        <h4 className="font-bold text-gray-900 mb-3">Minimum Qualifications</h4>
                        <ul className="space-y-2">
                          {selectedPosting.minimum_qualifications.map((qual, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                              <span className="text-violet-500 mt-1">•</span>
                              {qual}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Preferred Qualifications */}
                    {selectedPosting.preferred_qualifications?.length > 0 && (
                      <div>
                        <h4 className="font-bold text-gray-900 mb-3">Preferred Qualifications</h4>
                        <ul className="space-y-2">
                          {selectedPosting.preferred_qualifications.map((qual, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                              <span className="text-gray-400 mt-1">•</span>
                              {qual}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Responsibilities */}
                    <div>
                      <h4 className="font-bold text-gray-900 mb-3">Responsibilities</h4>
                      <ul className="space-y-2">
                        {selectedPosting.responsibilities.map((resp, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                            <span className="text-violet-500 mt-1">•</span>
                            {resp}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Required Skills */}
                    <div>
                      <h4 className="font-bold text-gray-900 mb-3">Required Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedPosting.required_skills.map((skill) => {
                          const hasSkill = userSkills.some(
                            (us) =>
                              us.toLowerCase().includes(skill.toLowerCase()) ||
                              skill.toLowerCase().includes(us.toLowerCase())
                          );
                          return (
                            <span
                              key={skill}
                              className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                                hasSkill
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {hasSkill && '✓ '}{skill}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Preferred Skills */}
                    {selectedPosting.preferred_skills.length > 0 && (
                      <div>
                        <h4 className="font-bold text-gray-900 mb-3">Nice to Have Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedPosting.preferred_skills.map((skill) => {
                            const hasSkill = userSkills.some(
                              (us) =>
                                us.toLowerCase().includes(skill.toLowerCase()) ||
                                skill.toLowerCase().includes(us.toLowerCase())
                            );
                            return (
                              <span
                                key={skill}
                                className={`px-3 py-1.5 rounded-full text-sm ${
                                  hasSkill
                                    ? 'bg-green-50 text-green-600'
                                    : 'bg-gray-50 text-gray-500'
                                }`}
                              >
                                {hasSkill && '✓ '}{skill}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Benefits */}
                    {selectedPosting.benefits?.length > 0 && (
                      <div>
                        <h4 className="font-bold text-gray-900 mb-3">Benefits</h4>
                        <ul className="grid grid-cols-1 gap-2">
                          {selectedPosting.benefits.map((benefit, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                              <span className="text-green-500">✓</span>
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Analysis Results */}
                {analyzing ? (
                  <Card variant="elevated" className="bg-white">
                    <CardContent className="p-8 flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mb-4" />
                      <p className="text-gray-600 font-medium">Analyzing your fit...</p>
                      <p className="text-gray-400 text-sm">This may take a moment</p>
                    </CardContent>
                  </Card>
                ) : analysis ? (
                  <div className="space-y-6">
                    <GapDisplay analysis={analysis} />

                    {analysis.recommendations.length > 0 && (
                      <Card variant="elevated" className="bg-white">
                        <CardHeader>
                          <CardTitle>Learning Roadmap</CardTitle>
                          <p className="text-sm text-gray-500">
                            {analysis.estimated_time
                              ? `Estimated time: ${analysis.estimated_time}`
                              : 'Start with high-priority skills'}
                          </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {analysis.recommendations.slice(0, 5).map((rec, index) => (
                            <RoadmapCard key={rec.skill} recommendation={rec} index={index} />
                          ))}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : null}
              </>
            ) : (
              <Card variant="elevated" className="bg-white">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg
                      className="w-10 h-10 text-violet-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Select a Job Posting
                  </h3>
                  <p className="text-gray-500 max-w-sm mx-auto">
                    Click on any job posting to see a detailed analysis of how your skills match
                    and get a personalized learning roadmap.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
