webapp url: https://skillbridgecn.up.railway.app
Note: it might take a couple refreshes as the server auto sleeps fairly often

youtube video: https://www.youtube.com/watch?v=n3tnjDopuFw

Candidate Name: Ricky Lin
Scenario Chosen: Option 2, Skill Bridge Career Navigator
Estimated Time Spent: 25 hours
Quick Start:

● Prerequisites:
  - Node.js 18+ and npm
  - Python 3.11+

● Run Commands:
  Backend:
  ```bash
  cd backend
  python -m venv venv
  source venv/bin/activate  # On Windows: venv\Scripts\activate
  pip install -r requirements.txt
  uvicorn app.main:app --reload
  ```
  Frontend:
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
  App available at: Frontend http://localhost:3000, Backend http://localhost:8000, API Docs http://localhost:8000/docs

● Test Commands:
  ```bash
  cd backend
  pytest tests/ -v
  ```

AI Disclosure:
● Did you use an AI assistant (Copilot, ChatGPT, etc.)? Yes - Claude Code
● How did you verify the suggestions?
  - Reviewed all generated code for correctness and security
  - Tested functionality manually in browser
  - Ran automated pytest tests
  - Verified API endpoints via postman
● Give one example of a suggestion you rejected or changed:
  - The initial resume upload endpoint (/api/profiles/upload-resume) lacked file validation - it accepted any file type without checking. I added file type validation (PDF only) and a 5MB size limit to prevent malicious file uploads and denial of service attacks via large files.

Tradeoffs & Prioritization:
● What did you cut to stay within the 4–6 hour limit?
  - GitHub integration for importing profile data
  - LinkedIn integration to import profile data from LinkedIn URL
  - Progress tracking to track which courses user has completed
  - Email/password authentication (alternative to Google SSO)
  - Comprehensive frontend unit tests, integration tests, and e2e tests
  - Mobile-responsive polish
  - Admin panel for managing job roles and resources

● What would you build next if you had more time?
  - Mobile app version
  - Analytics dashboard for user engagement
  - improve prompt engineering for the ai analyzer

● Known limitations:
  - No offline support
  - Job postings are static (currently seeded data)
  - Analysis results cached in localStorage only (not persisted server-side)
  - No rate limiting on API endpoints
  - Mentorship chat uses polling instead of WebSockets for real-time updates
