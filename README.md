# Skill-Bridge Career Navigator

A career navigation platform that helps students and early-career professionals identify skill gaps between their current abilities and job requirements, then provides personalized learning roadmaps.

## Candidate Information

**Candidate Name:** [Your Name]
**Scenario Chosen:** Skill-Bridge Career Navigator
**Estimated Time Spent:** ~5.5 hours

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Supabase account (free tier works)
- Groq API key (free tier works)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd Skill-Bridge-Career-Navigator
   ```

2. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to SQL Editor and run the schema from `PLAN.md` (Database Schema section)
   - Enable Google OAuth in Authentication > Providers
   - Copy your project URL and anon key

3. **Configure environment variables**

   Backend (`backend/.env`):
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_service_key
   GROQ_API_KEY=your_groq_api_key
   FRONTEND_URL=http://localhost:3000
   ```

   Frontend (`frontend/.env.local`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Seed the database**
   - Go to Supabase SQL Editor
   - Insert data from `data/job_roles.json` and `data/learning_resources.json`

### Run Commands

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

The app will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Test Commands

```bash
cd backend
pytest tests/ -v
```

## AI Disclosure

- **Did you use an AI assistant?** Yes - Claude Code
- **How did you verify the suggestions?**
  - Reviewed all generated code for correctness and security
  - Tested functionality manually
  - Ran automated tests
  - Verified API endpoints work correctly
- **Example of rejected/changed suggestion:**
  - Changed the initial suggestion to use email/password auth to Google SSO as per requirement
  - Modified the database schema to properly link user_profiles to auth.users

## Project Overview

### Architecture

```
Frontend (Next.js)  ◄──── API Calls ────►  Backend (Python FastAPI)
       │                                            │
       │                                            ▼
       └──── Auth (Supabase) ──────────►  Supabase (PostgreSQL)
```

### Features

1. **Google SSO Authentication** - Secure login via Supabase Auth
2. **Profile Management** - Add skills and select target roles
3. **Gap Analysis** - AI-powered skill comparison with rule-based fallback
4. **Learning Roadmap** - Prioritized course recommendations
5. **Job Role Browser** - Search and filter tech roles

### AI Integration

- **Primary:** Groq API (Llama 3.1 70B) for intelligent gap analysis
- **Fallback:** Rule-based keyword matching when AI is unavailable
- Automatic failover ensures the app always works

## Tradeoffs & Prioritization

### What I cut to stay within the 4-6 hour limit:
- Resume PDF parsing
- GitHub integration
- User progress tracking
- Multiple profile support
- Comprehensive unit tests for frontend

### What I would build next if I had more time:
1. **LinkedIn Integration** - Import profile data from LinkedIn URL
2. **Progress Tracking** - Track which courses user has completed
3. **Mock Interview Questions** - Generate interview questions based on skill gaps
4. **Email/Password Auth** - Alternative authentication method
5. **Mobile-responsive polish** - Better mobile experience

### Known limitations:
- No offline support
- Job roles and resources are static (would need admin panel to update)
- Analysis results are not cached/persisted
- No rate limiting on API endpoints
- Frontend tests not implemented

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Backend | Python 3.11, FastAPI, Pydantic |
| Database | Supabase (PostgreSQL) |
| AI | Groq SDK (Llama 3.1) |
| Auth | Supabase Auth (Google OAuth) |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/profiles` | Create user profile |
| GET | `/api/profiles/{user_id}` | Get user profile |
| PUT | `/api/profiles/{user_id}` | Update user profile |
| GET | `/api/roles` | List job roles (with search/filter) |
| GET | `/api/roles/{role_id}` | Get role details |
| POST | `/api/analyze` | Run gap analysis |
| GET | `/api/analyze/resources` | Get learning resources |

## Synthetic Data

Sample data is included in the `data/` directory:
- `job_roles.json` - 15 tech roles with required skills
- `learning_resources.json` - 45 learning resources across platforms
- `sample_profiles.json` - 5 sample user profiles for testing

## License

MIT
