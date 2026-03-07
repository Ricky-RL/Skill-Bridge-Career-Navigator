'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import api from '@/lib/api';
import { UserProfile, JobRole, AnalysisResult } from '@/lib/types';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import GapDisplay from '@/components/GapDisplay';
import RoadmapCard from '@/components/RoadmapCard';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [targetRole, setTargetRole] = useState<JobRole | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      // Check auth
      const response = await supabase.auth.getSession();
      const session = response?.data?.session;
      if (!session) {
        router.push('/auth/login');
        return;
      }

      // Load profile
      try {
        const profileData = await api.getProfile(session.user.id);
        setProfile(profileData);

        // Load target role if set
        if (profileData.target_role_id) {
          const roleData = await api.getRole(profileData.target_role_id);
          setTargetRole(roleData);
        }
      } catch (err) {
        // No profile, redirect to create one
        router.push('/profile');
        return;
      }

      setLoading(false);
    };

    init();
  }, [router]);

  const runAnalysis = async () => {
    if (!profile || !targetRole) return;

    setAnalyzing(true);
    setError(null);

    try {
      const result = await api.analyzeSkills({
        user_skills: profile.skills,
        target_role_id: targetRole.id,
      });
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">No Profile Found</h2>
        <p className="text-gray-600 mb-6">Create a profile to start analyzing your skill gap.</p>
        <Link href="/profile">
          <Button>Create Profile</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {profile.name}! Heres your career progress.
          </p>
        </div>
        <Link href="/profile">
          <Button variant="outline">Edit Profile</Button>
        </Link>
      </div>

      {/* Profile Summary */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-gray-500">Current Role</dt>
                <dd className="font-medium">{profile.job_title || 'Not specified'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Skills ({profile.skills.length})</dt>
                <dd className="font-medium">
                  {profile.skills.length > 0
                    ? profile.skills.slice(0, 5).join(', ') +
                      (profile.skills.length > 5 ? ` +${profile.skills.length - 5} more` : '')
                    : 'No skills added'}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Target Role</CardTitle>
          </CardHeader>
          <CardContent>
            {targetRole ? (
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-gray-500">Role</dt>
                  <dd className="font-medium">{targetRole.title}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Category</dt>
                  <dd className="font-medium">{targetRole.category || 'General'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Required Skills</dt>
                  <dd className="font-medium">{targetRole.required_skills.length} skills</dd>
                </div>
              </dl>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-4">No target role selected</p>
                <Link href="/profile">
                  <Button variant="outline" size="sm">Select Target Role</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analysis Section */}
      {targetRole && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Skill Gap Analysis</h2>
            <Button onClick={runAnalysis} isLoading={analyzing}>
              {analysis ? 'Re-analyze' : 'Analyze My Gap'}
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {analysis ? (
            <>
              <GapDisplay analysis={analysis} />

              {/* Learning Roadmap */}
              {analysis.recommendations && analysis.recommendations.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900">Your Learning Roadmap</h3>
                  <p className="text-gray-600">
                    Prioritized resources to help you close your skill gap.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    {analysis.recommendations.map((rec, idx) => (
                      <RoadmapCard key={idx} recommendation={rec} />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <Card variant="bordered" className="text-center py-12">
              <CardContent>
                <svg
                  className="w-16 h-16 text-gray-300 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <p className="text-gray-500 mb-4">
                  Click Analyze My Gap to see how your skills compare to the target role.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
