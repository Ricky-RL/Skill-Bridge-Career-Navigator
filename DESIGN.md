# Skill-Bridge Career Navigator - Design Document

## Executive Summary

Skill-Bridge Career Navigator is a full-stack web application that helps students and early-career professionals identify skill gaps between their current abilities and job requirements, then provides personalized learning roadmaps and mentorship connections. The platform uses AI-powered analysis with rule-based fallbacks to ensure reliable functionality.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [System Components](#system-components)
4. [Data Model](#data-model)
5. [API Design](#api-design)
6. [AI Integration](#ai-integration)
7. [Security Considerations](#security-considerations)
8. [Performance Optimizations](#performance-optimizations)
9. [Future Enhancements](#future-enhancements)

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Next.js 16 Frontend                           │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │   │
│  │  │  Pages   │ │Components│ │ API Lib  │ │  Types   │           │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ REST API (JSON)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    FastAPI Backend                               │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │   │
│  │  │ Routers  │ │ Services │ │  Models  │ │  Config  │           │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
┌──────────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│      Supabase        │ │     Groq AI      │ │   File Storage   │
│    (PostgreSQL)      │ │  (LLM Analysis)  │ │ (Supabase Bucket)│
│  - User Profiles     │ │  - Gap Analysis  │ │  - Resume PDFs   │
│  - Job Postings      │ │  - Job Parsing   │ │                  │
│  - Mentorship        │ │  - Chat/Advisor  │ │                  │
│  - Auth (OAuth)      │ │  - Interview Q's │ │                  │
└──────────────────────┘ └──────────────────┘ └──────────────────┘
```

### Request Flow

```
User Action → Frontend Component → API Client → Backend Router → Service Layer
                                                                      │
                                          ┌───────────────────────────┤
                                          │                           │
                                          ▼                           ▼
                                    AI Analyzer              Fallback Analyzer
                                    (Groq LLM)              (Rule-based)
                                          │                           │
                                          └───────────┬───────────────┘
                                                      │
                                                      ▼
                                              Database (Supabase)
                                                      │
                                                      ▼
                                              Response → Client
```

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.1.6 | React framework with App Router, SSR, and API routes |
| **React** | 19.2.3 | UI component library |
| **TypeScript** | 5.x | Type-safe JavaScript |
| **Tailwind CSS** | 4.x | Utility-first CSS framework |
| **Supabase SSR** | 0.9.0 | Server-side authentication |
| **canvas-confetti** | 1.9.4 | Celebration animations |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Python** | 3.11+ | Primary backend language |
| **FastAPI** | 0.115.0 | High-performance async web framework |
| **Pydantic** | 2.8.0 | Data validation and settings |
| **Supabase** | 2.5.0 | Database client |
| **Groq** | 0.9.0 | LLM API client |
| **pypdf** | 4.0.0 | PDF text extraction |
| **pytest** | 8.3.0 | Testing framework |

### Infrastructure

| Technology | Purpose |
|------------|---------|
| **Supabase** | PostgreSQL database, authentication, file storage |
| **Railway** | Application hosting (auto-sleep enabled) |
| **Groq Cloud** | LLM inference (llama-3.3-70b-versatile) |

---

## System Components

### Frontend Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Landing Page | Hero section, features overview, CTA |
| `/auth/login` | Login Page | Google OAuth sign-in |
| `/auth/callback` | OAuth Handler | Token exchange and session creation |
| `/profile` | Profile Manager | Skills, education, experience editing |
| `/dashboard` | Analysis Dashboard | Paste job descriptions, get analysis |
| `/jobs` | Job Browser | Search/filter job postings, quick analysis |
| `/saved-jobs` | Saved Analyses | Track saved analyses and progress |
| `/compare` | Bulk Comparison | Market readiness across multiple jobs |
| `/mentors` | Mentorship Hub | Find mentors, manage connections, chat |

### Backend Routers

| Router | Prefix | Endpoints | Purpose |
|--------|--------|-----------|---------|
| `profiles` | `/api/profiles` | 5 | User profile CRUD, resume upload |
| `roles` | `/api/roles` | 3 | Job role catalog |
| `job_postings` | `/api/job-postings` | 6 | Job posting search/filter |
| `analyze` | `/api/analyze` | 4 | Skill gap analysis, interview questions |
| `saved_analyses` | `/api/saved-analyses` | 4 | Persist analysis results |
| `chat` | `/api/chat` | 1 | AI career advisor chatbot |
| `bulk_comparison` | `/api/compare` | 3 | Multi-job market analysis |
| `mentorship` | `/api/mentorship` | 16 | Mentor profiles, connections, sessions, chat |

### Services

| Service | File | Purpose |
|---------|------|---------|
| **AI Analyzer** | `ai_analyzer.py` | Groq LLM integration for analysis, parsing, chat |
| **Fallback Analyzer** | `fallback_analyzer.py` | Rule-based skill matching when AI unavailable |
| **Bulk Analyzer** | `bulk_analyzer.py` | Fast multi-job comparison (no AI calls) |
| **Resume Parser** | `resume_parser.py` | PDF extraction and profile parsing |
| **Supabase Client** | `supabase_client.py` | Database connection and dependency injection |

---

## Data Model

### Database Schema (Supabase PostgreSQL)

#### Core Tables

```sql
-- User profiles linked to Supabase Auth
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    name VARCHAR(255),
    job_title VARCHAR(255),
    years_of_experience INTEGER,
    skills TEXT[],
    education JSONB[],           -- [{institution, degree, field, dates, gpa}]
    certifications JSONB[],      -- [{name, issuer, dates, credential_id}]
    work_experience JSONB[],     -- [{company, title, dates, description, highlights}]
    projects JSONB[],            -- [{name, description, technologies, url}]
    target_industries TEXT[],
    resume_url TEXT,
    resume_text TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Job postings from companies
CREATE TABLE job_postings (
    id UUID PRIMARY KEY,
    company VARCHAR(255),
    title VARCHAR(255),
    industry VARCHAR(100),
    location VARCHAR(255),
    employment_type VARCHAR(50),
    experience_level VARCHAR(50),   -- Entry, Mid, Senior, Lead
    minimum_qualifications TEXT[],
    preferred_qualifications TEXT[],
    about_the_job TEXT,
    responsibilities TEXT[],
    required_skills TEXT[],
    preferred_skills TEXT[],
    required_experience_years INTEGER,
    salary_range VARCHAR(100),
    benefits TEXT[],
    posted_date DATE,
    application_deadline DATE
);

-- Static job roles for career paths
CREATE TABLE job_roles (
    id UUID PRIMARY KEY,
    title VARCHAR(255),
    category VARCHAR(100),
    description TEXT,
    required_skills TEXT[],
    nice_to_have_skills TEXT[],
    avg_salary_range VARCHAR(50)
);

-- Learning resources mapped to skills
CREATE TABLE learning_resources (
    id UUID PRIMARY KEY,
    skill_name VARCHAR(255),
    resource_name VARCHAR(255),
    resource_url TEXT,
    resource_type VARCHAR(50),  -- course, video, article, project
    platform VARCHAR(100),
    is_free BOOLEAN,
    estimated_hours INTEGER
);

-- User's saved analysis results
CREATE TABLE saved_analyses (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    job_info JSONB,             -- Parsed job information
    analysis_result JSONB,       -- Full analysis with recommendations
    job_description TEXT,        -- Original job description
    created_at TIMESTAMP
);
```

#### Mentorship Tables

```sql
-- Mentor profiles (separate from user profiles)
CREATE TABLE mentor_profiles (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    name TEXT,
    bio TEXT,
    expertise_areas TEXT[],
    industries TEXT[],
    years_experience INTEGER,
    job_title TEXT,
    company TEXT,
    linkedin_url TEXT,
    max_mentees INTEGER DEFAULT 3,
    current_mentees INTEGER DEFAULT 0,
    availability_hours_per_week INTEGER,
    preferred_meeting_type TEXT,    -- video, chat, both
    status TEXT DEFAULT 'available', -- available, busy, inactive
    rating DECIMAL(2,1),
    total_sessions INTEGER DEFAULT 0
);

-- Mentor-mentee connections
CREATE TABLE mentorship_connections (
    id UUID PRIMARY KEY,
    mentor_id UUID REFERENCES mentor_profiles(id),
    mentee_id UUID REFERENCES auth.users(id),
    mentor_name TEXT,
    mentee_name TEXT,
    status TEXT DEFAULT 'pending',  -- pending, active, completed, declined
    goals TEXT[],
    message TEXT,
    sessions_completed INTEGER DEFAULT 0,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(mentor_id, mentee_id)
);

-- Scheduled mentorship sessions
CREATE TABLE mentorship_sessions (
    id UUID PRIMARY KEY,
    connection_id UUID REFERENCES mentorship_connections(id),
    scheduled_time TIMESTAMP,
    duration_minutes INTEGER,
    topic TEXT,
    notes TEXT,
    status TEXT DEFAULT 'pending',  -- pending, confirmed, completed, cancelled
    meeting_link TEXT,
    feedback TEXT,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5)
);

-- Chat messages within connections
CREATE TABLE mentorship_messages (
    id UUID PRIMARY KEY,
    connection_id UUID REFERENCES mentorship_connections(id),
    sender_id UUID REFERENCES auth.users(id),
    sender_name TEXT,
    content TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP
);
```

### Row Level Security (RLS)

All tables use Supabase RLS policies to ensure data isolation:

- **user_profiles**: Users can only access their own profile
- **saved_analyses**: Users can only access their own saved analyses
- **mentor_profiles**: Public read, users can only modify their own
- **mentorship_connections**: Users see connections where they are mentor or mentee
- **mentorship_messages**: Users can only access messages in their connections

---

## API Design

### Authentication Flow

```
1. User clicks "Sign in with Google"
2. Frontend redirects to Supabase OAuth
3. Google authenticates user
4. Supabase callback receives tokens
5. Frontend /auth/callback exchanges code for session
6. Session stored in cookies (Supabase SSR manages)
7. Subsequent requests include session for user identification
```

### Key API Endpoints

#### Analysis Endpoints

```
POST /api/analyze
Body: { user_skills, target_role_id | job_posting_id, user_id?, use_fallback? }
Response: {
    matching_skills, missing_skills, match_percentage,
    recommendations, estimated_time, profile_summary,
    experience_match, ai_generated
}

POST /api/analyze/from-description
Body: { job_description, user_id }
Response: { parsed_job_info, analysis }

POST /api/analyze/interview-questions
Body: { job_posting_id | job_info, skills_to_focus? }
Response: [{ category, question, difficulty, tips }]
```

#### Mentorship Endpoints

```
GET  /api/mentorship/mentors                    # List available mentors
GET  /api/mentorship/mentors/matches/{user_id} # AI-matched mentors
POST /api/mentorship/connections               # Request mentorship
PUT  /api/mentorship/connections/{id}/accept   # Accept request
POST /api/mentorship/messages                  # Send chat message
GET  /api/mentorship/messages/{connection_id}  # Get chat history
GET  /api/mentorship/unread-counts             # Unread message counts
```

#### Bulk Comparison Endpoint

```
POST /api/compare
Body: { user_id, role_type?, industries[], experience_level?, max_jobs }
Response: {
    total_jobs_analyzed, market_readiness_score,
    most_requested_skills, most_missing_skills,
    job_matches, avg_match_percentage, best_fit_industries
}
```

---

## AI Integration

### Primary AI: Groq LLM (llama-3.3-70b-versatile)

Used for intelligent, context-aware analysis:

| Feature | Temperature | Max Tokens | Response Format |
|---------|-------------|------------|-----------------|
| Gap Analysis | 0.3 | 3000 | JSON |
| Job Description Parsing | 0.2 | 2000 | JSON |
| Interview Questions | 0.5 | 3000 | JSON |
| Career Advisor Chat | 0.7 | 1000 | JSON |
| Resume Profile Extraction | 0.2 | 3000 | JSON |

### AI Analysis Prompt Structure

```python
prompt = f"""
Analyze the skill gap between a user and their target role.

User Profile:
- Skills: {user_skills}
- Experience: {years} years as {current_title}
- Education: {education_summary}
- Certifications: {certifications}

Target Role: {job_title} at {company}
Required Skills: {required_skills}
Preferred Skills: {preferred_skills}
Experience Level: {experience_level}

Evaluate:
1. Skills match (60% weight)
2. Experience relevance (25% weight)
3. Education/certification fit (15% weight)

Return JSON with: matching_skills, missing_skills, match_percentage,
profile_summary (<150 words), experience_match, recommendations, estimated_time
"""
```

### Fallback: Rule-Based Analysis

When AI is unavailable or `use_fallback=true`:

1. **Skill Matching**: Case-insensitive substring matching
2. **Experience Scoring**: +10% for matching experience, +5% for education, +5% for certifications
3. **Recommendations**: Static resource mapping from database
4. **Time Estimation**: Based on missing skill count

```python
def analyze_gap_fallback(user_skills, required_skills, user_profile):
    # Normalize and match skills
    matching = [s for s in required_skills if fuzzy_match(s, user_skills)]
    missing = [s for s in required_skills if s not in matching]

    # Calculate base percentage
    match_pct = len(matching) / len(required_skills) * 100

    # Add bonuses for experience/education/certifications
    if has_relevant_education(user_profile): match_pct += 5
    if has_relevant_experience(user_profile): match_pct += 10
    if has_relevant_certifications(user_profile): match_pct += 5

    return min(100, match_pct)
```

### Market Readiness Score (Bulk Comparison)

```python
score = (
    avg_match_percentage * 0.60 +           # Skill match across jobs
    high_demand_skill_coverage * 0.25 +     # Skills in 50%+ of jobs
    strong_match_ratio * 0.15               # Jobs with 70%+ match
)
```

---

## Security Considerations

### Authentication & Authorization

- **OAuth 2.0**: Google SSO via Supabase Auth
- **Session Management**: Secure cookies managed by Supabase SSR
- **Row Level Security**: Database-enforced access control
- **User ID Validation**: API endpoints require valid user_id parameter

### Input Validation

- **Pydantic Models**: All request bodies validated with type constraints
- **File Upload Security**:
  - PDF-only restriction (`.pdf` extension check)
  - 5MB file size limit
  - Content type validation
- **SQL Injection Prevention**: Supabase client uses parameterized queries

### API Security

- **CORS**: Configured for specific frontend origins
- **Rate Limiting**: Not implemented (known limitation)
- **Environment Variables**: Sensitive keys stored in `.env`

### Data Privacy

- **No PII Storage in Logs**: Error messages sanitized
- **Synthetic Data**: Sample data uses fake profiles/companies
- **Resume Storage**: User-controlled, stored in private Supabase bucket

---

## Performance Optimizations

### Client-Side Caching

```typescript
// Analysis results cached in localStorage
interface JobAnalysisCache {
    [jobId: string]: {
        skills: string[];       // User skills at analysis time
        analysis: AnalysisResult;
        timestamp: number;
    };
}

// Cache invalidation rules:
// - Skills changed → invalidate all
// - 1 hour expiration
// - Max 20 entries (LRU eviction)
```

### Backend Optimizations

- **LRU Cache**: Settings and Supabase client cached
- **Bulk Analysis**: Uses rule-based fallback (no AI calls) for speed
- **Pagination**: All list endpoints support limit/offset
- **Database Indexes**: On frequently queried columns (user_id, status, etc.)

### Lazy Loading

- **Frontend**: Components loaded on-demand
- **Supabase Client**: Initialized lazily to avoid SSR issues
- **AI Responses**: Streamed where possible

---

## Future Enhancements

### Short-Term (Next Sprint)

| Feature | Priority | Effort | Impact |
|---------|----------|--------|--------|
| Rate Limiting | High | Medium | Security improvement |
| WebSocket Chat | Medium | High | Real-time mentorship |
| Email Notifications | Medium | Medium | User engagement |
| Mobile Responsive Polish | Medium | Low | Better mobile UX |

### Medium-Term (Next Quarter)

| Feature | Priority | Effort | Impact |
|---------|----------|--------|--------|
| LinkedIn Profile Import | High | High | Easier onboarding |
| Progress Tracking | High | Medium | Learning accountability |
| Admin Dashboard | Medium | High | Content management |
| Multi-language Support | Low | Medium | Global reach |

### Long-Term (Future Roadmap)

| Feature | Description |
|---------|-------------|
| **Mobile App** | React Native app for iOS/Android |
| **Company Partnerships** | Direct job application integration |
| **AI Interview Practice** | Voice-based mock interviews |
| **Team/Enterprise Features** | Company accounts for bulk mentoring |
| **Certification Verification** | Automatic credential verification |
| **Salary Insights** | Market salary data by role/location |
| **Career Path Visualization** | Interactive career trajectory mapping |

### Technical Debt

| Item | Priority | Notes |
|------|----------|-------|
| Frontend Unit Tests | High | Currently no test coverage |
| API Rate Limiting | High | Prevent abuse |
| Error Boundary Components | Medium | Better error UX |
| Logging/Monitoring | Medium | Observability for production |
| Docker Compose Setup | Low | Easier local development |

---

## Appendix

### Environment Variables

```env
# Backend
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJhbGc...
GROQ_API_KEY=gsk_xxx
FRONTEND_URL=http://localhost:3000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### Sample Data Files

| File | Contents |
|------|----------|
| `data/job_roles.json` | 15 tech career roles with skills |
| `data/job_postings.json` | 20+ realistic job postings |
| `data/learning_resources.json` | 45+ learning resources by skill |
| `data/sample_profiles.json` | 5 sample user profiles |

### Test Coverage

| Test File | Coverage Area |
|-----------|---------------|
| `test_api.py` | Health, CORS, route availability |
| `test_analyze.py` | Analysis endpoint happy paths |
| `test_fallback.py` | Fallback analyzer edge cases |
| `test_bulk_analyzer.py` | Bulk comparison logic |
| `test_matching.py` | Skill matching utilities |
| `test_resume_parser.py` | PDF extraction and parsing |

---

*Document Version: 1.0*
*Last Updated: March 2026*
*Author: Ricky Lin*
