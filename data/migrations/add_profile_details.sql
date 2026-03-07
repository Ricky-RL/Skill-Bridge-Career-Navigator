-- Migration: Add detailed profile fields to user_profiles
-- Run this in Supabase SQL Editor to add support for enhanced resume parsing

-- Add new columns to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS years_of_experience INTEGER,
ADD COLUMN IF NOT EXISTS education JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS work_experience JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS projects JSONB DEFAULT '[]'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.years_of_experience IS 'Total years of professional experience';
COMMENT ON COLUMN user_profiles.education IS 'Array of education entries: {institution, degree, field_of_study, start_date, end_date, gpa}';
COMMENT ON COLUMN user_profiles.certifications IS 'Array of certifications: {name, issuer, date_obtained, expiry_date, credential_id}';
COMMENT ON COLUMN user_profiles.work_experience IS 'Array of work experiences: {company, title, start_date, end_date, description, highlights}';
COMMENT ON COLUMN user_profiles.projects IS 'Array of projects: {name, description, technologies, url}';

-- Example of what the JSONB structures look like:
/*
education example:
[
  {
    "institution": "Stanford University",
    "degree": "Bachelor's",
    "field_of_study": "Computer Science",
    "start_date": "2018",
    "end_date": "2022",
    "gpa": "3.8"
  }
]

certifications example:
[
  {
    "name": "AWS Solutions Architect",
    "issuer": "Amazon Web Services",
    "date_obtained": "2023",
    "expiry_date": "2026",
    "credential_id": "ABC123"
  }
]

work_experience example:
[
  {
    "company": "Google",
    "title": "Software Engineer",
    "start_date": "Jan 2022",
    "end_date": "Present",
    "description": "Backend development for cloud services",
    "highlights": ["Built X that improved Y by Z%", "Led team of N engineers"]
  }
]

projects example:
[
  {
    "name": "E-commerce Platform",
    "description": "Full-stack web application for online shopping",
    "technologies": ["React", "Node.js", "PostgreSQL"],
    "url": "github.com/user/project"
  }
]
*/
