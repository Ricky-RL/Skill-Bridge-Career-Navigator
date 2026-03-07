'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import api from '@/lib/api';
import { JobRole } from '@/lib/types';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import SkillInput from '@/components/SkillInput';
import RoleCard from '@/components/RoleCard';

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

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [roles, setRoles] = useState<JobRole[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [targetIndustries, setTargetIndustries] = useState<string[]>([]);
  const [targetRoleId, setTargetRoleId] = useState<string | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState<string | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Check auth
      const response = await supabase.auth.getSession();
      const session = response?.data?.session;
      if (!session) {
        router.push('/auth/login');
        return;
      }

      setUserId(session.user.id);

      // Load roles
      try {
        const rolesData = await api.getRoles();
        setRoles(rolesData);
      } catch (err) {
        console.error('Failed to load roles:', err);
      }

      // Load existing profile
      try {
        const profile = await api.getProfile(session.user.id);
        setName(profile.name);
        setJobTitle(profile.job_title || '');
        setSkills(profile.skills);
        setTargetIndustries(profile.target_industries || []);
        setTargetRoleId(profile.target_role_id);
        setResumeUrl(profile.resume_url);
        setResumeText(profile.resume_text);
        setHasProfile(true);
      } catch (err) {
        // No profile yet, use auth data as default
        setName(session.user.user_metadata?.full_name || '');
      }

      setLoading(false);
    };

    init();
  }, [router]);

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are supported');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setError(null);
    setUploadingResume(true);

    try {
      const result = await api.uploadResume(userId, file);
      setResumeUrl(result.resume_url);
      setResumeText(result.resume_text);

      // Merge extracted skills with existing skills (avoid duplicates)
      if (result.extracted_skills.length > 0) {
        const newSkills = [...new Set([...skills, ...result.extracted_skills])];
        setSkills(newSkills);
        setSuccess(`Resume uploaded! Found ${result.extracted_skills.length} skills.`);
      } else {
        setSuccess('Resume uploaded successfully!');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload resume');
    } finally {
      setUploadingResume(false);
    }
  };

  const toggleIndustry = (industry: string) => {
    setTargetIndustries((prev) =>
      prev.includes(industry)
        ? prev.filter((i) => i !== industry)
        : [...prev, industry]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      if (hasProfile) {
        await api.updateProfile(userId, {
          name,
          job_title: jobTitle || undefined,
          skills,
          target_industries: targetIndustries,
          target_role_id: targetRoleId || undefined,
          resume_url: resumeUrl || undefined,
          resume_text: resumeText || undefined,
        });
        setSuccess('Profile updated successfully!');
      } else {
        await api.createProfile({
          user_id: userId,
          name,
          job_title: jobTitle || undefined,
          skills,
          target_industries: targetIndustries,
          target_role_id: targetRoleId || undefined,
          resume_url: resumeUrl || undefined,
          resume_text: resumeText || undefined,
        });
        setHasProfile(true);
        setSuccess('Profile created successfully!');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-1">
          Tell us about your skills and career goals
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
            />
            <Input
              label="Current Role"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g., Junior Developer, Student, Data Analyst"
              helperText="What is your current job title or status?"
            />
          </CardContent>
        </Card>

        {/* Resume Upload */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Resume (Optional)</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Upload your resume to automatically extract your skills
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="flex-1">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleResumeUpload}
                  className="hidden"
                  disabled={uploadingResume}
                />
                <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                  {uploadingResume ? (
                    <div className="flex flex-col items-center text-gray-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2" />
                      <span>Processing resume...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-gray-500">
                      <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="font-medium">Click to upload PDF</span>
                      <span className="text-sm">Max 5MB</span>
                    </div>
                  )}
                </div>
              </label>
            </div>
            {resumeUrl && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Resume uploaded</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Skills */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Your Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <SkillInput
              skills={skills}
              onChange={setSkills}
              label="Current Skills"
              placeholder="e.g., Python, JavaScript, SQL..."
            />
          </CardContent>
        </Card>

        {/* Target Industries */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Target Industries</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Select the industries you want to work in. We&apos;ll show you relevant job postings.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {AVAILABLE_INDUSTRIES.map((industry) => {
                const isSelected = targetIndustries.includes(industry);
                return (
                  <button
                    key={industry}
                    type="button"
                    onClick={() => toggleIndustry(industry)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all border-2 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {industry}
                  </button>
                );
              })}
            </div>
            {targetIndustries.length > 0 && (
              <p className="mt-3 text-sm text-gray-500">
                Selected: {targetIndustries.join(', ')}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Target Role (Legacy - kept for backward compatibility) */}
        {roles.length > 0 && (
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>General Target Role (Optional)</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Select a general role type for broader skill gap analysis
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles.map((role) => (
                  <RoleCard
                    key={role.id}
                    role={role}
                    isSelected={targetRoleId === role.id}
                    onSelect={(r) => setTargetRoleId(r.id)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/jobs')}
            disabled={!hasProfile}
          >
            Browse Jobs
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard')}
            disabled={!hasProfile}
          >
            View Dashboard
          </Button>
          <Button type="submit" isLoading={saving}>
            {hasProfile ? 'Update Profile' : 'Create Profile'}
          </Button>
        </div>
      </form>
    </div>
  );
}
