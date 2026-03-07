'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import api from '@/lib/api';
import { Education, Certificate, WorkExperience, Project } from '@/lib/types';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import SkillInput from '@/components/SkillInput';

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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState<number | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [certifications, setCertifications] = useState<Certificate[]>([]);
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [targetIndustries, setTargetIndustries] = useState<string[]>([]);
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

      // Load existing profile
      try {
        const profile = await api.getProfile(session.user.id);
        setName(profile.name);
        setJobTitle(profile.job_title || '');
        setYearsOfExperience(profile.years_of_experience);
        setSkills(profile.skills);
        setEducation(profile.education || []);
        setCertifications(profile.certifications || []);
        setWorkExperience(profile.work_experience || []);
        setProjects(profile.projects || []);
        setTargetIndustries(profile.target_industries || []);
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
      }

      // Set years of experience if extracted
      if (result.years_of_experience) {
        setYearsOfExperience(result.years_of_experience);
      }

      // Merge education data
      if (result.education?.length > 0) {
        setEducation(result.education);
      }

      // Merge certifications
      if (result.certifications?.length > 0) {
        setCertifications(result.certifications);
      }

      // Merge work experience
      if (result.work_experience?.length > 0) {
        setWorkExperience(result.work_experience);
      }

      // Merge projects
      if (result.projects?.length > 0) {
        setProjects(result.projects);
      }

      const totalItems = (result.extracted_skills?.length || 0) +
                         (result.education?.length || 0) +
                         (result.certifications?.length || 0) +
                         (result.work_experience?.length || 0) +
                         (result.projects?.length || 0);

      setSuccess(`Resume analyzed! Found ${result.extracted_skills?.length || 0} skills, ${result.education?.length || 0} education entries, ${result.certifications?.length || 0} certifications, ${result.work_experience?.length || 0} work experiences, and ${result.projects?.length || 0} projects.`);
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
          years_of_experience: yearsOfExperience || undefined,
          skills,
          education,
          certifications,
          work_experience: workExperience,
          projects,
          target_industries: targetIndustries,
          resume_url: resumeUrl || undefined,
          resume_text: resumeText || undefined,
        });
        setSuccess('Profile updated successfully!');
      } else {
        await api.createProfile({
          user_id: userId,
          name,
          job_title: jobTitle || undefined,
          years_of_experience: yearsOfExperience || undefined,
          skills,
          education,
          certifications,
          work_experience: workExperience,
          projects,
          target_industries: targetIndustries,
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

        {/* Education */}
        {education.length > 0 && (
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>Education</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Extracted from your resume
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {education.map((edu, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                        <p className="text-violet-600 font-medium">{edu.institution}</p>
                        {edu.field_of_study && (
                          <p className="text-gray-600 text-sm">{edu.field_of_study}</p>
                        )}
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        {edu.start_date && <span>{edu.start_date}</span>}
                        {edu.start_date && edu.end_date && <span> - </span>}
                        {edu.end_date && <span>{edu.end_date}</span>}
                        {edu.gpa && <p className="text-gray-600">GPA: {edu.gpa}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>Certifications</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Professional certifications and credentials
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {certifications.map((cert, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900">{cert.name}</h4>
                        {cert.issuer && <p className="text-violet-600 font-medium">{cert.issuer}</p>}
                        {cert.credential_id && (
                          <p className="text-gray-500 text-sm">ID: {cert.credential_id}</p>
                        )}
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        {cert.date_obtained && <p>Obtained: {cert.date_obtained}</p>}
                        {cert.expiry_date && <p>Expires: {cert.expiry_date}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Work Experience */}
        {workExperience.length > 0 && (
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>Work Experience</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Your professional experience
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workExperience.map((exp, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">{exp.title}</h4>
                        <p className="text-violet-600 font-medium">{exp.company}</p>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        {exp.start_date && <span>{exp.start_date}</span>}
                        {exp.start_date && exp.end_date && <span> - </span>}
                        {exp.end_date && <span>{exp.end_date}</span>}
                      </div>
                    </div>
                    {exp.description && (
                      <p className="text-gray-600 text-sm mb-2">{exp.description}</p>
                    )}
                    {exp.highlights && exp.highlights.length > 0 && (
                      <ul className="space-y-1">
                        {exp.highlights.map((highlight, hIndex) => (
                          <li key={hIndex} className="text-sm text-gray-600 flex items-start gap-2">
                            <span className="text-violet-500 mt-1">•</span>
                            {highlight}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>Projects</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Personal and professional projects
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects.map((project, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">{project.name}</h4>
                        {project.url && (
                          <a
                            href={project.url.startsWith('http') ? project.url : `https://${project.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-violet-600 text-sm hover:underline"
                          >
                            {project.url}
                          </a>
                        )}
                      </div>
                    </div>
                    {project.description && (
                      <p className="text-gray-600 text-sm mb-2">{project.description}</p>
                    )}
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {project.technologies.map((tech, tIndex) => (
                          <span
                            key={tIndex}
                            className="px-2 py-1 bg-violet-100 text-violet-700 rounded text-xs font-medium"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Years of Experience */}
        {yearsOfExperience !== null && (
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>Experience Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-violet-50 rounded-lg p-4 text-center">
                <span className="text-3xl font-bold text-violet-600">{yearsOfExperience}</span>
                <span className="text-gray-600 ml-2">years of experience</span>
              </div>
            </CardContent>
          </Card>
        )}

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
