'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import api from '@/lib/api';
import { JobPosting, AnalysisResult, InterviewQuestion } from '@/lib/types';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import JobPostingCard from '@/components/JobPostingCard';
import GapDisplay from '@/components/GapDisplay';
import RoadmapCard from '@/components/RoadmapCard';
import InterviewQuestions from '@/components/InterviewQuestions';

const COMPANIES = ['Google', 'Amazon', 'Palo Alto Networks', 'Apple', 'Meta'];

const AVAILABLE_INDUSTRIES = [
  'Cloud & Infrastructure',
  'Cybersecurity',
  'AI & Machine Learning',
  'Frontend Development',
  'Backend Development',
  'Full Stack Development',
  'Mobile Development',
  'Data Engineering',
  'DevOps & SRE',
  'Product Management',
];

export default function JobsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [postings, setPostings] = useState<JobPosting[]>([]);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [targetIndustries, setTargetIndustries] = useState<string[]>([]);
  const [selectedPosting, setSelectedPosting] = useState<JobPosting | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useAI, setUseAI] = useState(true);
  const [completedSkills, setCompletedSkills] = useState<Set<string>>(new Set());

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [showSuggested, setShowSuggested] = useState(true);
  const [editingIndustries, setEditingIndustries] = useState(false);
  const [savingIndustries, setSavingIndustries] = useState(false);

  // Toggle skill completion
  const toggleSkillComplete = (skill: string) => {
    setCompletedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(skill)) {
        next.delete(skill);
      } else {
        next.add(skill);
      }
      return next;
    });
  };

  // Toggle industry selection
  const toggleIndustry = (industry: string) => {
    setTargetIndustries((prev) =>
      prev.includes(industry)
        ? prev.filter((i) => i !== industry)
        : [...prev, industry]
    );
  };

  // Save industries
  const saveIndustries = async () => {
    if (!userId) return;
    setSavingIndustries(true);
    try {
      await api.updateProfile(userId, { target_industries: targetIndustries });
      setEditingIndustries(false);
      // Reload postings based on new industries
      if (targetIndustries.length > 0) {
        const suggested = await api.getSuggestedPostings(userId, 20);
        setPostings(suggested);
        setShowSuggested(true);
      } else {
        const allPostings = await api.getJobPostings({ limit: 20 });
        setPostings(allPostings);
        setShowSuggested(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save industries');
    } finally {
      setSavingIndustries(false);
    }
  };

  // Generate interview questions
  const handleGenerateQuestions = async (): Promise<InterviewQuestion[]> => {
    if (!selectedPosting) return [];
    const missingSkills = analysis?.missing_skills || [];
    return api.generateInterviewQuestions({
      job_posting_id: selectedPosting.id,
      skills_to_focus: missingSkills.slice(0, 5),
    });
  };

  useEffect(() => {
    const init = async () => {
      const response = await supabase.auth.getSession();
      const session = response?.data?.session;
      if (!session) {
        router.push('/auth/login');
        return;
      }

      setUserId(session.user.id);

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
        user_id: userId || undefined,
        use_fallback: !useAI,
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
            <div className="mt-4 flex flex-wrap gap-4 items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-500">Your industries:</span>
                  <button
                    onClick={() => setEditingIndustries(!editingIndustries)}
                    className="text-xs text-violet-600 hover:text-violet-800 font-medium"
                  >
                    {editingIndustries ? 'Cancel' : 'Edit'}
                  </button>
                  {editingIndustries && (
                    <button
                      onClick={saveIndustries}
                      disabled={savingIndustries}
                      className="text-xs bg-violet-600 text-white px-2 py-1 rounded hover:bg-violet-700 disabled:opacity-50"
                    >
                      {savingIndustries ? 'Saving...' : 'Save'}
                    </button>
                  )}
                </div>
                {editingIndustries ? (
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_INDUSTRIES.map((industry) => {
                      const isSelected = targetIndustries.includes(industry);
                      return (
                        <button
                          key={industry}
                          type="button"
                          onClick={() => toggleIndustry(industry)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                            isSelected
                              ? 'border-violet-500 bg-violet-100 text-violet-700'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {industry}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {targetIndustries.length > 0 ? (
                      targetIndustries.map((industry) => (
                        <span
                          key={industry}
                          className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm font-medium"
                        >
                          {industry}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400 italic">
                        No industries selected. Click Edit to add some.
                      </span>
                    )}
                  </div>
                )}
              </div>
              {/* AI Toggle */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Analysis Mode:</span>
                <button
                  onClick={() => setUseAI(!useAI)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    useAI ? 'bg-violet-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      useAI ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`text-sm font-medium ${useAI ? 'text-violet-600' : 'text-gray-500'}`}>
                  {useAI ? 'AI Analysis' : 'Rule-based'}
                </span>
              </div>
            </div>
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
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle>Learning Roadmap</CardTitle>
                              <p className="text-sm text-gray-500">
                                {analysis.estimated_time
                                  ? `Estimated time: ${analysis.estimated_time}`
                                  : 'Start with high-priority skills'}
                              </p>
                            </div>
                            {completedSkills.size > 0 && (
                              <span className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
                                {completedSkills.size} / {analysis.recommendations.length} completed
                              </span>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {analysis.recommendations.slice(0, 5).map((rec) => (
                            <RoadmapCard
                              key={rec.skill}
                              recommendation={rec}
                              isCompleted={completedSkills.has(rec.skill)}
                              onToggleComplete={toggleSkillComplete}
                            />
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {/* Interview Questions */}
                    <InterviewQuestions
                      jobTitle={selectedPosting.title}
                      company={selectedPosting.company}
                      skills={analysis.missing_skills}
                      onGenerateQuestions={handleGenerateQuestions}
                    />
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
