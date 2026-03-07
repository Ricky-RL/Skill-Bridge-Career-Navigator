'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import api from '@/lib/api';
import { Education, Certificate, WorkExperience, Project, ExperienceLevel } from '@/lib/types';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import SkillInput from '@/components/SkillInput';

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

// Empty templates for new entries
const emptyEducation: Education = {
  institution: '',
  degree: '',
  field_of_study: null,
  start_date: null,
  end_date: null,
  gpa: null,
};

const emptyWorkExperience: WorkExperience = {
  company: '',
  title: '',
  start_date: null,
  end_date: null,
  description: null,
  highlights: [],
};

const emptyProject: Project = {
  name: '',
  description: null,
  technologies: [],
  url: null,
};

const emptyCertificate: Certificate = {
  name: '',
  issuer: null,
  date_obtained: null,
  expiry_date: null,
  credential_id: null,
};

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
  const [targetExperienceLevel, setTargetExperienceLevel] = useState<ExperienceLevel | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState<string | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);

  // Editing state for each section
  const [editingEducation, setEditingEducation] = useState<number | null>(null);
  const [editingExperience, setEditingExperience] = useState<number | null>(null);
  const [editingProject, setEditingProject] = useState<number | null>(null);
  const [editingCertification, setEditingCertification] = useState<number | null>(null);

  // Temporary state for editing
  const [tempEducation, setTempEducation] = useState<Education>(emptyEducation);
  const [tempExperience, setTempExperience] = useState<WorkExperience>(emptyWorkExperience);
  const [tempProject, setTempProject] = useState<Project>(emptyProject);
  const [tempCertification, setTempCertification] = useState<Certificate>(emptyCertificate);
  const [tempHighlight, setTempHighlight] = useState('');
  const [tempTechnology, setTempTechnology] = useState('');

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
        setTargetExperienceLevel(profile.target_experience_level || null);
        setResumeUrl(profile.resume_url);
        setResumeText(profile.resume_text);
        setHasProfile(true);
      } catch {
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

      if (result.extracted_skills.length > 0) {
        const newSkills = [...new Set([...skills, ...result.extracted_skills])];
        setSkills(newSkills);
      }

      if (result.years_of_experience) {
        setYearsOfExperience(result.years_of_experience);
      }

      if (result.education?.length > 0) {
        setEducation((prev) => [...prev, ...result.education]);
      }

      if (result.certifications?.length > 0) {
        setCertifications((prev) => [...prev, ...result.certifications]);
      }

      if (result.work_experience?.length > 0) {
        setWorkExperience((prev) => [...prev, ...result.work_experience]);
      }

      if (result.projects?.length > 0) {
        setProjects((prev) => [...prev, ...result.projects]);
      }

      setSuccess(`Resume analyzed! Found ${result.extracted_skills?.length || 0} skills, ${result.education?.length || 0} education entries, ${result.certifications?.length || 0} certifications, ${result.work_experience?.length || 0} work experiences, and ${result.projects?.length || 0} projects.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload resume');
    } finally {
      setUploadingResume(false);
    }
  };

  const toggleIndustry = (industry: string) => {
    setTargetIndustries((prev) =>
      prev.includes(industry) ? prev.filter((i) => i !== industry) : [...prev, industry]
    );
  };

  // Education handlers
  const startAddEducation = () => {
    setTempEducation({ ...emptyEducation });
    setEditingEducation(-1); // -1 means adding new
  };

  const startEditEducation = (index: number) => {
    setTempEducation({ ...education[index] });
    setEditingEducation(index);
  };

  const saveEducation = () => {
    if (!tempEducation.institution || !tempEducation.degree) {
      setError('Institution and Degree are required');
      return;
    }
    if (editingEducation === -1) {
      setEducation([...education, tempEducation]);
    } else if (editingEducation !== null) {
      const updated = [...education];
      updated[editingEducation] = tempEducation;
      setEducation(updated);
    }
    setEditingEducation(null);
    setTempEducation(emptyEducation);
    setError(null);
  };

  const deleteEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  // Work Experience handlers
  const startAddExperience = () => {
    setTempExperience({ ...emptyWorkExperience });
    setTempHighlight('');
    setEditingExperience(-1);
  };

  const startEditExperience = (index: number) => {
    setTempExperience({ ...workExperience[index] });
    setTempHighlight('');
    setEditingExperience(index);
  };

  const addHighlight = () => {
    if (tempHighlight.trim()) {
      setTempExperience({
        ...tempExperience,
        highlights: [...(tempExperience.highlights || []), tempHighlight.trim()],
      });
      setTempHighlight('');
    }
  };

  const removeHighlight = (index: number) => {
    setTempExperience({
      ...tempExperience,
      highlights: tempExperience.highlights.filter((_, i) => i !== index),
    });
  };

  const saveExperience = () => {
    if (!tempExperience.company || !tempExperience.title) {
      setError('Company and Title are required');
      return;
    }
    if (editingExperience === -1) {
      setWorkExperience([...workExperience, tempExperience]);
    } else if (editingExperience !== null) {
      const updated = [...workExperience];
      updated[editingExperience] = tempExperience;
      setWorkExperience(updated);
    }
    setEditingExperience(null);
    setTempExperience(emptyWorkExperience);
    setError(null);
  };

  const deleteExperience = (index: number) => {
    setWorkExperience(workExperience.filter((_, i) => i !== index));
  };

  // Project handlers
  const startAddProject = () => {
    setTempProject({ ...emptyProject });
    setTempTechnology('');
    setEditingProject(-1);
  };

  const startEditProject = (index: number) => {
    setTempProject({ ...projects[index] });
    setTempTechnology('');
    setEditingProject(index);
  };

  const addTechnology = () => {
    if (tempTechnology.trim()) {
      setTempProject({
        ...tempProject,
        technologies: [...(tempProject.technologies || []), tempTechnology.trim()],
      });
      setTempTechnology('');
    }
  };

  const removeTechnology = (index: number) => {
    setTempProject({
      ...tempProject,
      technologies: tempProject.technologies.filter((_, i) => i !== index),
    });
  };

  const saveProject = () => {
    if (!tempProject.name) {
      setError('Project name is required');
      return;
    }
    if (editingProject === -1) {
      setProjects([...projects, tempProject]);
    } else if (editingProject !== null) {
      const updated = [...projects];
      updated[editingProject] = tempProject;
      setProjects(updated);
    }
    setEditingProject(null);
    setTempProject(emptyProject);
    setError(null);
  };

  const deleteProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  // Certification handlers
  const startAddCertification = () => {
    setTempCertification({ ...emptyCertificate });
    setEditingCertification(-1);
  };

  const startEditCertification = (index: number) => {
    setTempCertification({ ...certifications[index] });
    setEditingCertification(index);
  };

  const saveCertification = () => {
    if (!tempCertification.name) {
      setError('Certification name is required');
      return;
    }
    if (editingCertification === -1) {
      setCertifications([...certifications, tempCertification]);
    } else if (editingCertification !== null) {
      const updated = [...certifications];
      updated[editingCertification] = tempCertification;
      setCertifications(updated);
    }
    setEditingCertification(null);
    setTempCertification(emptyCertificate);
    setError(null);
  };

  const deleteCertification = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index));
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
          target_experience_level: targetExperienceLevel || undefined,
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
          target_experience_level: targetExperienceLevel || undefined,
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
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-1">Tell us about your skills and career goals</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{success}</div>
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
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Current Role"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g., Software Engineer"
              />
              <Input
                label="Years of Experience"
                type="number"
                min={0}
                value={yearsOfExperience ?? ''}
                onChange={(e) => setYearsOfExperience(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="e.g., 3"
              />
            </div>
          </CardContent>
        </Card>

        {/* Resume Upload */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Resume (Optional)</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Upload your resume to automatically extract information, or add details manually below
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="block">
              <input
                type="file"
                accept=".pdf"
                onChange={handleResumeUpload}
                className="hidden"
                disabled={uploadingResume}
              />
              <div className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-violet-400 hover:bg-violet-50 transition-colors">
                {uploadingResume ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-violet-600" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="font-medium">Click to upload PDF (max 5MB)</span>
                  </div>
                )}
              </div>
            </label>
            {resumeUrl && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
            <SkillInput skills={skills} onChange={setSkills} placeholder="Type a skill and press Enter..." />
          </CardContent>
        </Card>

        {/* Education */}
        <Card variant="bordered">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Education</CardTitle>
                <p className="text-sm text-gray-500 mt-1">{education.length} entries</p>
              </div>
              {editingEducation === null && (
                <Button type="button" variant="outline" size="sm" onClick={startAddEducation}>
                  + Add Education
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add/Edit Form */}
            {editingEducation !== null && (
              <div className="p-4 bg-violet-50 rounded-lg border border-violet-200 space-y-4">
                <h4 className="font-medium text-violet-900">
                  {editingEducation === -1 ? 'Add Education' : 'Edit Education'}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Institution *"
                    value={tempEducation.institution}
                    onChange={(e) => setTempEducation({ ...tempEducation, institution: e.target.value })}
                    placeholder="e.g., Stanford University"
                  />
                  <Input
                    label="Degree *"
                    value={tempEducation.degree}
                    onChange={(e) => setTempEducation({ ...tempEducation, degree: e.target.value })}
                    placeholder="e.g., Bachelor of Science"
                  />
                </div>
                <Input
                  label="Field of Study"
                  value={tempEducation.field_of_study || ''}
                  onChange={(e) => setTempEducation({ ...tempEducation, field_of_study: e.target.value || null })}
                  placeholder="e.g., Computer Science"
                />
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="Start Date"
                    value={tempEducation.start_date || ''}
                    onChange={(e) => setTempEducation({ ...tempEducation, start_date: e.target.value || null })}
                    placeholder="e.g., 2018"
                  />
                  <Input
                    label="End Date"
                    value={tempEducation.end_date || ''}
                    onChange={(e) => setTempEducation({ ...tempEducation, end_date: e.target.value || null })}
                    placeholder="e.g., 2022"
                  />
                  <Input
                    label="GPA"
                    value={tempEducation.gpa || ''}
                    onChange={(e) => setTempEducation({ ...tempEducation, gpa: e.target.value || null })}
                    placeholder="e.g., 3.8"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" onClick={saveEducation}>
                    Save
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setEditingEducation(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* List */}
            {education.map((edu, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                    <p className="text-violet-600 font-medium">{edu.institution}</p>
                    {edu.field_of_study && <p className="text-gray-600 text-sm">{edu.field_of_study}</p>}
                    <p className="text-sm text-gray-500 mt-1">
                      {edu.start_date && <span>{edu.start_date}</span>}
                      {edu.start_date && edu.end_date && <span> - </span>}
                      {edu.end_date && <span>{edu.end_date}</span>}
                      {edu.gpa && <span className="ml-2">• GPA: {edu.gpa}</span>}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEditEducation(index)}
                      className="text-gray-400 hover:text-violet-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteEducation(index)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {education.length === 0 && editingEducation === null && (
              <p className="text-gray-500 text-sm text-center py-4">No education added yet</p>
            )}
          </CardContent>
        </Card>

        {/* Work Experience */}
        <Card variant="bordered">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Work Experience</CardTitle>
                <p className="text-sm text-gray-500 mt-1">{workExperience.length} entries</p>
              </div>
              {editingExperience === null && (
                <Button type="button" variant="outline" size="sm" onClick={startAddExperience}>
                  + Add Experience
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add/Edit Form */}
            {editingExperience !== null && (
              <div className="p-4 bg-violet-50 rounded-lg border border-violet-200 space-y-4">
                <h4 className="font-medium text-violet-900">
                  {editingExperience === -1 ? 'Add Work Experience' : 'Edit Work Experience'}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Company *"
                    value={tempExperience.company}
                    onChange={(e) => setTempExperience({ ...tempExperience, company: e.target.value })}
                    placeholder="e.g., Google"
                  />
                  <Input
                    label="Job Title *"
                    value={tempExperience.title}
                    onChange={(e) => setTempExperience({ ...tempExperience, title: e.target.value })}
                    placeholder="e.g., Software Engineer"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Start Date"
                    value={tempExperience.start_date || ''}
                    onChange={(e) => setTempExperience({ ...tempExperience, start_date: e.target.value || null })}
                    placeholder="e.g., Jan 2020"
                  />
                  <Input
                    label="End Date"
                    value={tempExperience.end_date || ''}
                    onChange={(e) => setTempExperience({ ...tempExperience, end_date: e.target.value || null })}
                    placeholder="e.g., Present"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none"
                    rows={3}
                    value={tempExperience.description || ''}
                    onChange={(e) => setTempExperience({ ...tempExperience, description: e.target.value || null })}
                    placeholder="Brief description of your role..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Key Achievements</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                      value={tempHighlight}
                      onChange={(e) => setTempHighlight(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHighlight())}
                      placeholder="Add an achievement and press Enter..."
                    />
                    <Button type="button" variant="outline" onClick={addHighlight}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tempExperience.highlights?.map((h, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-200 rounded-full text-sm">
                        {h}
                        <button type="button" onClick={() => removeHighlight(i)} className="text-gray-400 hover:text-red-500">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="button" onClick={saveExperience}>
                    Save
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setEditingExperience(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* List */}
            {workExperience.map((exp, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{exp.title}</h4>
                    <p className="text-violet-600 font-medium">{exp.company}</p>
                    <p className="text-sm text-gray-500">
                      {exp.start_date && <span>{exp.start_date}</span>}
                      {exp.start_date && exp.end_date && <span> - </span>}
                      {exp.end_date && <span>{exp.end_date}</span>}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEditExperience(index)}
                      className="text-gray-400 hover:text-violet-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteExperience(index)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                {exp.description && <p className="text-gray-600 text-sm mb-2">{exp.description}</p>}
                {exp.highlights && exp.highlights.length > 0 && (
                  <ul className="space-y-1">
                    {exp.highlights.map((h, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-violet-500">•</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            {workExperience.length === 0 && editingExperience === null && (
              <p className="text-gray-500 text-sm text-center py-4">No work experience added yet</p>
            )}
          </CardContent>
        </Card>

        {/* Projects */}
        <Card variant="bordered">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Projects</CardTitle>
                <p className="text-sm text-gray-500 mt-1">{projects.length} entries</p>
              </div>
              {editingProject === null && (
                <Button type="button" variant="outline" size="sm" onClick={startAddProject}>
                  + Add Project
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add/Edit Form */}
            {editingProject !== null && (
              <div className="p-4 bg-violet-50 rounded-lg border border-violet-200 space-y-4">
                <h4 className="font-medium text-violet-900">
                  {editingProject === -1 ? 'Add Project' : 'Edit Project'}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Project Name *"
                    value={tempProject.name}
                    onChange={(e) => setTempProject({ ...tempProject, name: e.target.value })}
                    placeholder="e.g., E-commerce Platform"
                  />
                  <Input
                    label="URL"
                    value={tempProject.url || ''}
                    onChange={(e) => setTempProject({ ...tempProject, url: e.target.value || null })}
                    placeholder="e.g., github.com/user/project"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none"
                    rows={3}
                    value={tempProject.description || ''}
                    onChange={(e) => setTempProject({ ...tempProject, description: e.target.value || null })}
                    placeholder="Describe the project..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Technologies Used</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                      value={tempTechnology}
                      onChange={(e) => setTempTechnology(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
                      placeholder="Add a technology and press Enter..."
                    />
                    <Button type="button" variant="outline" onClick={addTechnology}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tempProject.technologies?.map((t, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm">
                        {t}
                        <button type="button" onClick={() => removeTechnology(i)} className="text-violet-500 hover:text-red-500">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="button" onClick={saveProject}>
                    Save
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setEditingProject(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* List */}
            {projects.map((project, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
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
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEditProject(index)}
                      className="text-gray-400 hover:text-violet-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteProject(index)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                {project.description && <p className="text-gray-600 text-sm mb-2">{project.description}</p>}
                {project.technologies && project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((t, i) => (
                      <span key={i} className="px-2 py-1 bg-violet-100 text-violet-700 rounded text-xs font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {projects.length === 0 && editingProject === null && (
              <p className="text-gray-500 text-sm text-center py-4">No projects added yet</p>
            )}
          </CardContent>
        </Card>

        {/* Certifications */}
        <Card variant="bordered">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Certifications</CardTitle>
                <p className="text-sm text-gray-500 mt-1">{certifications.length} entries</p>
              </div>
              {editingCertification === null && (
                <Button type="button" variant="outline" size="sm" onClick={startAddCertification}>
                  + Add Certification
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add/Edit Form */}
            {editingCertification !== null && (
              <div className="p-4 bg-violet-50 rounded-lg border border-violet-200 space-y-4">
                <h4 className="font-medium text-violet-900">
                  {editingCertification === -1 ? 'Add Certification' : 'Edit Certification'}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Certification Name *"
                    value={tempCertification.name}
                    onChange={(e) => setTempCertification({ ...tempCertification, name: e.target.value })}
                    placeholder="e.g., AWS Solutions Architect"
                  />
                  <Input
                    label="Issuing Organization"
                    value={tempCertification.issuer || ''}
                    onChange={(e) => setTempCertification({ ...tempCertification, issuer: e.target.value || null })}
                    placeholder="e.g., Amazon Web Services"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="Date Obtained"
                    value={tempCertification.date_obtained || ''}
                    onChange={(e) => setTempCertification({ ...tempCertification, date_obtained: e.target.value || null })}
                    placeholder="e.g., Jan 2023"
                  />
                  <Input
                    label="Expiry Date"
                    value={tempCertification.expiry_date || ''}
                    onChange={(e) => setTempCertification({ ...tempCertification, expiry_date: e.target.value || null })}
                    placeholder="e.g., Jan 2026"
                  />
                  <Input
                    label="Credential ID"
                    value={tempCertification.credential_id || ''}
                    onChange={(e) => setTempCertification({ ...tempCertification, credential_id: e.target.value || null })}
                    placeholder="e.g., ABC123"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" onClick={saveCertification}>
                    Save
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setEditingCertification(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* List */}
            {certifications.map((cert, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{cert.name}</h4>
                    {cert.issuer && <p className="text-violet-600 font-medium">{cert.issuer}</p>}
                    <p className="text-sm text-gray-500 mt-1">
                      {cert.date_obtained && <span>Obtained: {cert.date_obtained}</span>}
                      {cert.expiry_date && <span className="ml-2">• Expires: {cert.expiry_date}</span>}
                      {cert.credential_id && <span className="ml-2">• ID: {cert.credential_id}</span>}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEditCertification(index)}
                      className="text-gray-400 hover:text-violet-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCertification(index)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {certifications.length === 0 && editingCertification === null && (
              <p className="text-gray-500 text-sm text-center py-4">No certifications added yet</p>
            )}
          </CardContent>
        </Card>

        {/* Target Industries */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Target Industries</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Select the industries you want to work in
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
                        ? 'border-violet-500 bg-violet-50 text-violet-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {industry}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Target Experience Level */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Target Experience Level</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              What level of positions are you targeting?
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {EXPERIENCE_LEVELS.map((level) => {
                const isSelected = targetExperienceLevel === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setTargetExperienceLevel(isSelected ? null : level)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all border-2 ${
                      isSelected
                        ? 'border-violet-500 bg-violet-50 text-violet-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.push('/jobs')} disabled={!hasProfile}>
            Browse Jobs
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/dashboard')} disabled={!hasProfile}>
            Analyze Role
          </Button>
          <Button type="submit" isLoading={saving}>
            {hasProfile ? 'Update Profile' : 'Create Profile'}
          </Button>
        </div>
      </form>
    </div>
  );
}
