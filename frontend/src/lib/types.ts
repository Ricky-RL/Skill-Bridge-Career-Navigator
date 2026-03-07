// Type definitions for the Skill-Bridge Career Navigator

export interface JobRole {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  required_skills: string[];
  nice_to_have_skills: string[];
  avg_salary_range: string | null;
  created_at?: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  job_title: string | null;
  skills: string[];
  target_industries: string[];
  target_role_id: string | null;
  resume_url: string | null;
  resume_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileCreate {
  user_id: string;
  name: string;
  job_title?: string;
  skills: string[];
  target_industries?: string[];
  target_role_id?: string;
  resume_url?: string;
  resume_text?: string;
}

export interface ProfileUpdate {
  name?: string;
  job_title?: string;
  skills?: string[];
  target_industries?: string[];
  target_role_id?: string;
  resume_url?: string;
  resume_text?: string;
}

export interface ResumeUploadResponse {
  resume_url: string;
  resume_text: string;
  extracted_skills: string[];
  message: string;
}

export interface SkillRecommendation {
  skill: string;
  priority: number;
  resources: LearningResource[];
}

export interface AnalysisResult {
  id?: string;
  matching_skills: string[];
  missing_skills: string[];
  match_percentage: number;
  recommendations: SkillRecommendation[];
  estimated_time?: string;
  ai_generated: boolean;
  created_at?: string;
}

export interface AnalysisRequest {
  user_skills: string[];
  target_role_id?: string;
  job_posting_id?: string;
}

export interface JobPosting {
  id: string;
  company: string;
  company_logo_url: string | null;
  title: string;
  industry: string;
  location: string;
  employment_type: string;
  experience_level: string;
  about_the_job: string | null;
  minimum_qualifications: string[];
  preferred_qualifications: string[];
  responsibilities: string[];
  required_skills: string[];
  preferred_skills: string[];
  required_experience_years: number;
  salary_range: string | null;
  benefits: string[];
  posted_date: string | null;
  created_at: string | null;
}

export interface LearningResource {
  id: string;
  skill_name: string;
  resource_name: string;
  resource_url: string | null;
  resource_type: string | null;
  platform: string | null;
  is_free: boolean;
  estimated_hours: number | null;
}

export interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}
