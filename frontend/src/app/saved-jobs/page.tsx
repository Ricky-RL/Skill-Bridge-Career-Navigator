'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import api from '@/lib/api';
import { SavedAnalysis, SavedAnalysisListItem, AnalysisResult, ParsedJobInfo } from '@/lib/types';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import GapDisplay from '@/components/GapDisplay';
import RoadmapCard from '@/components/RoadmapCard';

export default function SavedJobsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [savedJobs, setSavedJobs] = useState<SavedAnalysisListItem[]>([]);
  const [selectedJob, setSelectedJob] = useState<SavedAnalysis | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completedSkills, setCompletedSkills] = useState<Set<string>>(new Set());
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [learningSkill, setLearningSkill] = useState<string | null>(null);

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

  const handleMarkSkillLearned = async (skill: string) => {
    if (!userId || !selectedJob) return;

    setLearningSkill(skill);
    try {
      // Add skill to user's profile
      const updatedSkills = [...userSkills, skill];
      await api.updateProfile(userId, { skills: updatedSkills });
      setUserSkills(updatedSkills);

      // Mark as completed locally
      setCompletedSkills((prev) => new Set([...prev, skill]));

      // Update the selected job's analysis result locally to reflect the new match
      const currentAnalysis = selectedJob.analysis_result;
      const newMatchingSkills = [...(currentAnalysis.matching_skills || []), skill];
      const newMissingSkills = (currentAnalysis.missing_skills || []).filter(
        (s: string) => s.toLowerCase() !== skill.toLowerCase()
      );

      // Use the job's required skills as the denominator for consistent calculation
      const totalRequiredSkills = selectedJob.job_info.required_skills?.length ||
        (newMatchingSkills.length + newMissingSkills.length);
      const newMatchPercentage = totalRequiredSkills > 0
        ? Math.round((newMatchingSkills.length / totalRequiredSkills) * 100)
        : 0;

      // Update the selected job detail
      setSelectedJob({
        ...selectedJob,
        analysis_result: {
          ...currentAnalysis,
          matching_skills: newMatchingSkills,
          missing_skills: newMissingSkills,
          match_percentage: newMatchPercentage,
          // Keep recommendations list unchanged - skill stays visible but marked as completed
        },
      });

      // Also update the savedJobs list to keep the sidebar in sync
      setSavedJobs((prev) =>
        prev.map((job) =>
          job.id === selectedJob.id
            ? { ...job, match_percentage: newMatchPercentage }
            : job
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add skill to profile');
    } finally {
      setLearningSkill(null);
    }
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

      try {
        const [jobs, profile] = await Promise.all([
          api.getSavedAnalyses(session.user.id),
          api.getProfile(session.user.id).catch(() => null),
        ]);
        setSavedJobs(jobs);
        if (profile?.skills) {
          setUserSkills(profile.skills);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load saved jobs');
      }

      setLoading(false);
    };

    init();
  }, [router]);

  const handleSelectJob = async (job: SavedAnalysisListItem) => {
    if (!userId) return;

    setLoadingDetail(true);
    setError(null);

    try {
      const detail = await api.getSavedAnalysis(job.id, userId);
      setSelectedJob(detail);

      // Initialize completedSkills with skills that user has already learned
      // (skills that exist in both recommendations and userSkills)
      const learnedSkills = detail.analysis_result.recommendations
        ?.filter((rec: any) =>
          userSkills.some((us) => us.toLowerCase() === rec.skill.toLowerCase())
        )
        .map((rec: any) => rec.skill) || [];
      setCompletedSkills(new Set(learnedSkills));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load job details');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!userId) return;

    setDeleting(jobId);
    try {
      await api.deleteSavedAnalysis(jobId, userId);
      setSavedJobs(savedJobs.filter(j => j.id !== jobId));
      if (selectedJob?.id === jobId) {
        setSelectedJob(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete job');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Saved Jobs</h1>
              <p className="text-white/80 text-lg">
                Review your saved job analyses and track your progress
              </p>
            </div>
            <Button variant="yellow" onClick={() => router.push('/dashboard')} rightIcon>
              Analyze New Job
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">{error}</div>
        )}

        {savedJobs.length === 0 ? (
          <Card variant="elevated" className="bg-white">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No Saved Jobs Yet</h3>
              <p className="text-gray-500 text-sm mb-4">
                Analyze a job posting and save it to track your progress
              </p>
              <Button onClick={() => router.push('/dashboard')}>
                Analyze a Job
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6 pb-12">
            {/* Saved Jobs List */}
            <div className="lg:col-span-1 space-y-4">
              <Card variant="elevated" className="bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    Saved Analyses ({savedJobs.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-100">
                    {savedJobs.map((job) => (
                      <div
                        key={job.id}
                        onClick={() => handleSelectJob(job)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleSelectJob(job)}
                        className={`w-full p-4 text-left hover:bg-gray-50 transition-colors cursor-pointer ${
                          selectedJob?.id === job.id ? 'bg-violet-50 border-l-4 border-violet-600' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">{job.job_title}</h4>
                            {job.company && (
                              <p className="text-sm text-violet-600 truncate">{job.company}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">{formatDate(job.created_at)}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`text-sm font-bold px-2 py-1 rounded ${
                              job.match_percentage >= 70 ? 'bg-green-100 text-green-700' :
                              job.match_percentage >= 50 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {job.match_percentage}%
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteJob(job.id);
                              }}
                              disabled={deleting === job.id}
                              className="text-gray-400 hover:text-red-500 transition-colors p-1"
                              title="Delete"
                            >
                              {deleting === job.id ? (
                                <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Job Detail View */}
            <div className="lg:col-span-2 space-y-6">
              {loadingDetail ? (
                <Card variant="elevated" className="bg-white">
                  <CardContent className="p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto" />
                    <p className="text-gray-500 mt-4">Loading details...</p>
                  </CardContent>
                </Card>
              ) : selectedJob ? (
                <>
                  {/* Job Info Card */}
                  <Card variant="elevated" className="bg-white">
                    <CardHeader>
                      <div>
                        <CardTitle className="text-xl">{selectedJob.job_info.title}</CardTitle>
                        {selectedJob.job_info.company && (
                          <p className="text-violet-600 font-medium mt-1">{selectedJob.job_info.company}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedJob.job_info.experience_level && (
                            <span className="px-2 py-1 bg-violet-100 text-violet-700 rounded text-xs">
                              {selectedJob.job_info.experience_level}
                            </span>
                          )}
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            Saved {formatDate(selectedJob.created_at)}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedJob.job_info.description && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">About the Role</h4>
                          <p className="text-sm text-gray-600 whitespace-pre-line line-clamp-4">
                            {selectedJob.job_info.description}
                          </p>
                        </div>
                      )}

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Required Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedJob.job_info.required_skills.map((skill) => (
                            <span
                              key={skill}
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                selectedJob.analysis_result.matching_skills?.some(
                                  (ms) => ms.toLowerCase() === skill.toLowerCase()
                                )
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {selectedJob.job_info.responsibilities && selectedJob.job_info.responsibilities.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Responsibilities</h4>
                          <ul className="space-y-2">
                            {selectedJob.job_info.responsibilities.slice(0, 4).map((resp, idx) => (
                              <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                                <span className="text-violet-500 mt-1">•</span>
                                {resp}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Analysis Results */}
                  <GapDisplay analysis={selectedJob.analysis_result as AnalysisResult} />

                  {/* Learning Roadmap */}
                  {selectedJob.analysis_result.recommendations && selectedJob.analysis_result.recommendations.length > 0 && (
                    <Card variant="elevated" className="bg-white">
                      <CardHeader>
                        <div>
                          <CardTitle>Learning Roadmap</CardTitle>
                          <p className="text-sm text-gray-500">
                            {selectedJob.analysis_result.estimated_time
                              ? `Estimated time: ${selectedJob.analysis_result.estimated_time}`
                              : 'Start with high-priority skills'}
                          </p>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {selectedJob.analysis_result.recommendations.slice(0, 5).map((rec: any) => (
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
                </>
              ) : (
                <Card variant="elevated" className="bg-white">
                  <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Select a Saved Job</h3>
                    <p className="text-gray-500 text-sm">
                      Click on a saved job from the list to view its analysis
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
