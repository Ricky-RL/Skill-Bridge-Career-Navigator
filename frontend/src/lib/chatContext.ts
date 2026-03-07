import { ChatContext, UserProfile, JobPosting, AnalysisResult, ParsedJobInfo } from './types';

export function buildChatContext(params: {
  profile?: UserProfile | null;
  jobPosting?: JobPosting | null;
  parsedJob?: ParsedJobInfo | null;
  analysis?: AnalysisResult | null;
}): ChatContext {
  const { profile, jobPosting, parsedJob, analysis } = params;

  const context: ChatContext = {
    user_skills: [],
    education: [],
    certifications: [],
    work_experience: [],
    projects: [],
    job_required_skills: [],
    job_nice_to_have_skills: [],
    job_responsibilities: [],
    matching_skills: [],
    missing_skills: [],
    recommendations: [],
  };

  // Add profile context
  if (profile) {
    context.user_name = profile.name;
    context.user_skills = profile.skills || [];
    context.years_of_experience = profile.years_of_experience || undefined;
    context.education = profile.education || [];
    context.certifications = profile.certifications || [];
    context.work_experience = profile.work_experience || [];
    context.projects = profile.projects || [];
  }

  // Add job context (prefer jobPosting over parsedJob)
  if (jobPosting) {
    context.job_title = jobPosting.title;
    context.job_company = jobPosting.company;
    context.job_required_skills = jobPosting.required_skills || [];
    context.job_nice_to_have_skills = jobPosting.preferred_skills || [];
    context.job_responsibilities = jobPosting.responsibilities || [];
    context.job_experience_level = jobPosting.experience_level;
  } else if (parsedJob) {
    context.job_title = parsedJob.title;
    context.job_company = parsedJob.company || undefined;
    context.job_required_skills = parsedJob.required_skills || [];
    context.job_nice_to_have_skills = parsedJob.nice_to_have_skills || [];
    context.job_responsibilities = parsedJob.responsibilities || [];
    context.job_experience_level = parsedJob.experience_level || undefined;
  }

  // Add analysis context
  if (analysis) {
    context.matching_skills = analysis.matching_skills || [];
    context.missing_skills = analysis.missing_skills || [];
    context.match_percentage = analysis.match_percentage;
    context.profile_summary = analysis.profile_summary || undefined;
    context.recommendations = analysis.recommendations || [];
  }

  return context;
}
