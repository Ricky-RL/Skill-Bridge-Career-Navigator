'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import api from '@/lib/api';
import { JobPosting, AnalysisResult, InterviewQuestion, ExperienceLevel, ParsedJobInfo } from '@/lib/types';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import JobPostingCard from '@/components/JobPostingCard';
import GapDisplay from '@/components/GapDisplay';
import RoadmapCard from '@/components/RoadmapCard';
import InterviewQuestions from '@/components/InterviewQuestions';

const COMPANIES = ['Google', 'Amazon', 'Palo Alto Networks', 'Apple', 'Meta', 'Microsoft', 'Netflix', 'Stripe', 'Uber', 'Airbnb', 'Spotify', 'NVIDIA', 'Salesforce', 'Databricks', 'Cloudflare', 'LinkedIn', 'Snowflake', 'Figma', 'Coinbase', 'Notion'];

const EXPERIENCE_LEVELS: ExperienceLevel[] = ['Entry Level', 'Mid', 'Senior', 'Staff', 'Principal', 'Management'];

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

// Cache for job analysis results
const JOBS_CACHE_KEY = 'skillbridge_jobs_analysis_cache';

interface JobAnalysisCache {
  [jobId: string]: {
    skills: string[];
    analysis: AnalysisResult;
    timestamp: number;
  };
}

function getAnalysisCache(): JobAnalysisCache {
  try {
    const cached = localStorage.getItem(JOBS_CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch {
    return {};
  }
}

function getCachedJobAnalysis(jobId: string, skills: string[]): AnalysisResult | null {
  try {
    const cache = getAnalysisCache();
    const entry = cache[jobId];
    if (!entry) return null;

    // Check if skills match
    const skillsMatch =
      skills.length === entry.skills.length &&
      skills.every((s) => entry.skills.includes(s));

    // Check if cache is not older than 1 hour
    const isRecent = Date.now() - entry.timestamp < 60 * 60 * 1000;

    if (skillsMatch && isRecent) {
      return entry.analysis;
    }

    return null;
  } catch {
    return null;
  }
}

function setCachedJobAnalysis(jobId: string, skills: string[], analysis: AnalysisResult): void {
  try {
    const cache = getAnalysisCache();
    cache[jobId] = {
      skills,
      analysis,
      timestamp: Date.now(),
    };
    // Keep only last 20 entries to prevent localStorage bloat
    const entries = Object.entries(cache);
    if (entries.length > 20) {
      const sorted = entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      const trimmed = Object.fromEntries(sorted.slice(0, 20));
      localStorage.setItem(JOBS_CACHE_KEY, JSON.stringify(trimmed));
    } else {
      localStorage.setItem(JOBS_CACHE_KEY, JSON.stringify(cache));
    }
  } catch {
    // Ignore cache errors
  }
}

function clearJobAnalysisCache(): void {
  try {
    localStorage.removeItem(JOBS_CACHE_KEY);
  } catch {
    // Ignore
  }
}

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
  const [usedCache, setUsedCache] = useState(false);
  const [userExperienceLevel, setUserExperienceLevel] = useState<ExperienceLevel | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [learningSkill, setLearningSkill] = useState<string | null>(null);
  const analysisRef = useRef<HTMLDivElement>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedExperienceLevel, setSelectedExperienceLevel] = useState<string>('');
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
        setUserExperienceLevel(profile.target_experience_level || null);

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

  // Debug: Monitor state changes
  useEffect(() => {
    console.log('State changed - analysis:', analysis ? 'set' : 'null', 'analyzing:', analyzing);
  }, [analysis, analyzing]);

  const handleSearch = async () => {
    setLoading(true);
    setShowSuggested(false);
    try {
      const results = await api.getJobPostings({
        search: searchQuery || undefined,
        company: selectedCompany || undefined,
        industries: targetIndustries.length ? targetIndustries : undefined,
        experience_level: selectedExperienceLevel || undefined,
        limit: 20,
      });
      setPostings(results);
    } catch (err) {
      setError('Failed to search job postings');
    }
    setLoading(false);
  };

  const handleAnalyze = useCallback(async (posting: JobPosting, forceRefresh = false) => {
    console.log('handleAnalyze called:', { postingId: posting.id, forceRefresh });
    setSelectedPosting(posting);
    setError(null);
    setSaved(false);

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = getCachedJobAnalysis(posting.id, userSkills);
      if (cached) {
        console.log('Using cached analysis');
        setAnalysis(cached);
        setUsedCache(true);
        // Initialize completedSkills with skills that user has already learned
        const learnedSkills = cached.recommendations
          ?.filter((rec) =>
            userSkills.some((us) => us.toLowerCase() === rec.skill.toLowerCase())
          )
          .map((rec) => rec.skill) || [];
        setCompletedSkills(new Set(learnedSkills));
        return;
      }
    }

    console.log('Clearing analysis and starting API call');
    setAnalysis(null);
    setCompletedSkills(new Set());
    setAnalyzing(true);
    setUsedCache(false);

    try {
      console.log('Making analysis API call for job:', posting.id);
      const result = await api.analyzeSkills({
        user_skills: userSkills,
        job_posting_id: posting.id,
        user_id: userId || undefined,
        use_fallback: !useAI,
      });
      console.log('Analysis result received:', result);
      console.log('Setting analysis state...');
      setAnalysis(result);
      console.log('Analysis state set');
      setCachedJobAnalysis(posting.id, userSkills, result);

      // Initialize completedSkills with skills that user has already learned
      const learnedSkills = result.recommendations
        ?.filter((rec) =>
          userSkills.some((us) => us.toLowerCase() === rec.skill.toLowerCase())
        )
        .map((rec) => rec.skill) || [];
      setCompletedSkills(new Set(learnedSkills));
      // Scroll to analysis section after a short delay
      setTimeout(() => {
        analysisRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 150);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze skills');
    } finally {
      console.log('Setting analyzing to false');
      setAnalyzing(false);
    }
  }, [userSkills, userId, useAI]);

  const handleReanalyze = () => {
    console.log('handleReanalyze called, selectedPosting:', selectedPosting?.id);
    if (selectedPosting) {
      handleAnalyze(selectedPosting, true);
    }
  };

  const clearSelection = () => {
    setSelectedPosting(null);
    setAnalysis(null);
    setUsedCache(false);
    setCompletedSkills(new Set());
    setSaved(false);
  };

  const handleSaveAnalysis = async () => {
    if (!userId || !analysis || !selectedPosting) return;

    const jobInfo: ParsedJobInfo = {
      title: selectedPosting.title,
      company: selectedPosting.company,
      required_skills: selectedPosting.required_skills,
      nice_to_have_skills: selectedPosting.preferred_skills,
      experience_level: selectedPosting.experience_level,
      responsibilities: selectedPosting.responsibilities,
      minimum_qualifications: selectedPosting.minimum_qualifications,
      description: selectedPosting.about_the_job,
    };

    setSaving(true);
    try {
      await api.saveAnalysis({
        user_id: userId,
        job_info: jobInfo,
        analysis_result: analysis,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save analysis');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkSkillLearned = async (skill: string) => {
    if (!userId || !selectedPosting) return;

    setLearningSkill(skill);
    try {
      // Add skill to user's profile
      const updatedSkills = [...userSkills, skill];
      await api.updateProfile(userId, { skills: updatedSkills });
      setUserSkills(updatedSkills);

      // Mark as completed locally
      setCompletedSkills((prev) => new Set([...prev, skill]));

      // Clear cache since skills changed
      clearJobAnalysisCache();

      // Re-run analysis with updated skills
      const result = await api.analyzeSkills({
        user_skills: updatedSkills,
        job_posting_id: selectedPosting.id,
        user_id: userId,
        use_fallback: !useAI,
      });
      setAnalysis(result);
      setCachedJobAnalysis(selectedPosting.id, updatedSkills, result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add skill to profile');
    } finally {
      setLearningSkill(null);
    }
  };

  const getCompanyColor = (company: string) => {
    const colors: Record<string, string> = {
      'Google': 'bg-[#4285F4]',
      'Amazon': 'bg-[#FF9900]',
      'Meta': 'bg-[#0668E1]',
      'Apple': 'bg-black',
      'Palo Alto Networks': 'bg-[#FA582D]',
      'Microsoft': 'bg-[#00A4EF]',
      'Netflix': 'bg-[#E50914]',
      'Stripe': 'bg-[#635BFF]',
      'Uber': 'bg-black',
      'Airbnb': 'bg-[#FF5A5F]',
      'Spotify': 'bg-[#1DB954]',
      'NVIDIA': 'bg-[#76B900]',
      'Salesforce': 'bg-[#00A1E0]',
      'Databricks': 'bg-[#FF3621]',
      'Cloudflare': 'bg-[#F38020]',
      'LinkedIn': 'bg-[#0A66C2]',
      'Snowflake': 'bg-[#29B5E8]',
      'Figma': 'bg-[#F24E1E]',
      'Coinbase': 'bg-[#0052FF]',
      'Notion': 'bg-black',
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
      <div className="bg-gradient-purple pt-4 pb-12">
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
              <select
                className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white"
                value={selectedExperienceLevel}
                onChange={(e) => setSelectedExperienceLevel(e.target.value)}
              >
                <option value="">All Levels</option>
                {EXPERIENCE_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
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
          <div className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto space-y-6 pb-4">
            {selectedPosting ? (
              <>
                {/* Job Details Card - Collapsed when analysis is ready */}
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
                  <CardContent className={`space-y-5 overflow-y-auto ${analysis ? 'max-h-[30vh]' : 'max-h-[70vh]'}`}>
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
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                    {error}
                  </div>
                )}
                {analyzing ? (
                  <Card variant="elevated" className="bg-white">
                    <CardContent className="p-8 flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mb-4" />
                      <p className="text-gray-600 font-medium">Analyzing your fit...</p>
                      <p className="text-gray-400 text-sm">This may take a moment</p>
                    </CardContent>
                  </Card>
                ) : analysis ? (
                  <div ref={analysisRef} className="space-y-6">
                    {/* Save Analysis Button */}
                    <Card variant="elevated" className="bg-white">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Save this analysis</p>
                            <p className="text-xs text-gray-500">Come back later to review your progress</p>
                          </div>
                          <div className="flex items-center gap-3">
                            {saved && (
                              <span className="text-sm text-green-600 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Saved
                              </span>
                            )}
                            <Button
                              variant={saved ? 'outline' : 'primary'}
                              size="sm"
                              onClick={handleSaveAnalysis}
                              isLoading={saving}
                              disabled={saved}
                            >
                              {saved ? 'Saved' : 'Save Analysis'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Cache indicator and re-analyze button */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {usedCache && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            Cached result
                          </span>
                        )}
                        {analysis.ai_generated && !usedCache && (
                          <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded animate-pulse">
                            Fresh Analysis
                          </span>
                        )}
                        {analysis.ai_generated && (
                          <span className="text-xs text-violet-600 bg-violet-50 px-2 py-1 rounded">
                            AI Analysis
                          </span>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReanalyze}
                        isLoading={analyzing}
                      >
                        {analyzing ? 'Analyzing...' : 'Re-analyze'}
                      </Button>
                    </div>

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
                              onMarkLearned={handleMarkSkillLearned}
                              isLearning={learningSkill === rec.skill}
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
