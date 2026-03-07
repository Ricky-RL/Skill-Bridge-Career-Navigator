'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import api from '@/lib/api';
import { JobRole, UserProfile } from '@/lib/types';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import SkillInput from '@/components/SkillInput';
import RoleCard from '@/components/RoleCard';

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
  const [targetRoleId, setTargetRoleId] = useState<string | null>(null);
  const [hasProfile, setHasProfile] = useState(false);

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
        setTargetRoleId(profile.target_role_id);
        setHasProfile(true);
      } catch (err) {
        // No profile yet, use auth data as default
        setName(session.user.user_metadata?.full_name || '');
      }

      setLoading(false);
    };

    init();
  }, [router]);

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
          target_role_id: targetRoleId || undefined,
        });
        setSuccess('Profile updated successfully!');
      } else {
        await api.createProfile({
          user_id: userId,
          name,
          job_title: jobTitle || undefined,
          skills,
          target_role_id: targetRoleId || undefined,
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

        {/* Target Role */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Target Role</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Select the role you want to work towards
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

        {/* Actions */}
        <div className="flex justify-end gap-4">
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
