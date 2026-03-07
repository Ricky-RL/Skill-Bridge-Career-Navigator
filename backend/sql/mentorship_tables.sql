-- Mentorship Tables for Skill-Bridge Career Navigator
-- Run this in Supabase SQL Editor

-- 1. Mentor Profiles Table
CREATE TABLE IF NOT EXISTS mentor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    bio TEXT NOT NULL,
    expertise_areas TEXT[] NOT NULL DEFAULT '{}',
    industries TEXT[] DEFAULT '{}',
    years_experience INTEGER NOT NULL DEFAULT 0,
    job_title TEXT NOT NULL,
    company TEXT,
    linkedin_url TEXT,
    max_mentees INTEGER NOT NULL DEFAULT 3,
    current_mentees INTEGER NOT NULL DEFAULT 0,
    availability_hours_per_week INTEGER NOT NULL DEFAULT 2,
    preferred_meeting_type TEXT NOT NULL DEFAULT 'video',
    status TEXT NOT NULL DEFAULT 'available',
    rating DECIMAL(2,1),
    total_sessions INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. Mentorship Connections Table
CREATE TABLE IF NOT EXISTS mentorship_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_id UUID NOT NULL REFERENCES mentor_profiles(id) ON DELETE CASCADE,
    mentee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mentor_name TEXT NOT NULL,
    mentee_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    goals TEXT[] NOT NULL DEFAULT '{}',
    message TEXT NOT NULL,
    sessions_completed INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(mentor_id, mentee_id)
);

-- 3. Mentorship Sessions Table
CREATE TABLE IF NOT EXISTS mentorship_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL REFERENCES mentorship_connections(id) ON DELETE CASCADE,
    mentor_name TEXT NOT NULL,
    mentee_name TEXT NOT NULL,
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    topic TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    meeting_link TEXT,
    feedback TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE mentor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorship_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorship_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mentor_profiles
CREATE POLICY "Anyone can view available mentors" ON mentor_profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can create their own mentor profile" ON mentor_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mentor profile" ON mentor_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for mentorship_connections
CREATE POLICY "Users can view their own connections" ON mentorship_connections
    FOR SELECT USING (
        mentee_id = auth.uid() OR
        mentor_id IN (SELECT id FROM mentor_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can create connection requests" ON mentorship_connections
    FOR INSERT WITH CHECK (mentee_id = auth.uid());

CREATE POLICY "Mentors can update their connections" ON mentorship_connections
    FOR UPDATE USING (
        mentor_id IN (SELECT id FROM mentor_profiles WHERE user_id = auth.uid())
    );

-- RLS Policies for mentorship_sessions
CREATE POLICY "Users can view their sessions" ON mentorship_sessions
    FOR SELECT USING (
        connection_id IN (
            SELECT id FROM mentorship_connections
            WHERE mentee_id = auth.uid() OR
            mentor_id IN (SELECT id FROM mentor_profiles WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can create sessions for their connections" ON mentorship_sessions
    FOR INSERT WITH CHECK (
        connection_id IN (
            SELECT id FROM mentorship_connections
            WHERE mentee_id = auth.uid() OR
            mentor_id IN (SELECT id FROM mentor_profiles WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can update their sessions" ON mentorship_sessions
    FOR UPDATE USING (
        connection_id IN (
            SELECT id FROM mentorship_connections
            WHERE mentee_id = auth.uid() OR
            mentor_id IN (SELECT id FROM mentor_profiles WHERE user_id = auth.uid())
        )
    );

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_user_id ON mentor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_status ON mentor_profiles(status);
CREATE INDEX IF NOT EXISTS idx_mentorship_connections_mentor_id ON mentorship_connections(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_connections_mentee_id ON mentorship_connections(mentee_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_connections_status ON mentorship_connections(status);
CREATE INDEX IF NOT EXISTS idx_mentorship_sessions_connection_id ON mentorship_sessions(connection_id);

-- =====================================================
-- SAMPLE MENTOR DATA (10 mentors)
-- =====================================================
-- Note: These use fixed UUIDs so they can be referenced
-- The user_id references are set to NULL to allow sample data without real users

-- First, temporarily disable the foreign key constraint for seeding
ALTER TABLE mentor_profiles DROP CONSTRAINT IF EXISTS mentor_profiles_user_id_fkey;
ALTER TABLE mentor_profiles ALTER COLUMN user_id DROP NOT NULL;

INSERT INTO mentor_profiles (id, user_id, name, bio, expertise_areas, industries, years_experience, job_title, company, linkedin_url, max_mentees, current_mentees, availability_hours_per_week, preferred_meeting_type, status, rating, total_sessions, created_at)
VALUES
-- 1. Sarah Chen - Cloud Architecture Expert
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567801',
    NULL,
    'Sarah Chen',
    'Principal Cloud Architect at AWS with 12+ years of experience building scalable distributed systems. I''ve helped 50+ engineers transition into cloud roles and love sharing practical knowledge about system design, AWS certifications, and career growth in cloud computing. Previously at Google Cloud and Microsoft Azure.',
    ARRAY['AWS', 'System Design', 'Terraform', 'Kubernetes', 'Cloud Architecture', 'Docker'],
    ARRAY['Cloud & Infrastructure', 'DevOps & SRE'],
    12,
    'Principal Cloud Architect',
    'Amazon Web Services',
    'https://linkedin.com/in/sarahchen',
    5,
    2,
    4,
    'video',
    'available',
    4.9,
    127,
    NOW()
),
-- 2. Marcus Johnson - Backend & System Design
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567802',
    NULL,
    'Marcus Johnson',
    'Staff Software Engineer at Google with expertise in backend systems and distributed computing. I specialize in mentoring engineers preparing for FAANG interviews, particularly system design and coding rounds. Author of "Cracking the Backend Interview" blog series.',
    ARRAY['Python', 'Go', 'System Design', 'Microservices', 'PostgreSQL', 'Redis', 'gRPC'],
    ARRAY['Backend Development', 'Cloud & Infrastructure'],
    10,
    'Staff Software Engineer',
    'Google',
    'https://linkedin.com/in/marcusjohnson',
    4,
    3,
    3,
    'video',
    'available',
    4.8,
    89,
    NOW()
),
-- 3. Priya Patel - Machine Learning & AI
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567803',
    NULL,
    'Priya Patel',
    'Senior ML Engineer at OpenAI working on large language models. PhD in Computer Science from Stanford. I mentor aspiring ML engineers on breaking into AI, from building portfolios to acing ML interviews. Passionate about making AI careers accessible to everyone.',
    ARRAY['Python', 'TensorFlow', 'PyTorch', 'Machine Learning', 'Deep Learning', 'NLP', 'MLOps'],
    ARRAY['AI & Machine Learning', 'Data Engineering'],
    8,
    'Senior ML Engineer',
    'OpenAI',
    'https://linkedin.com/in/priyapatel',
    3,
    2,
    2,
    'video',
    'available',
    5.0,
    64,
    NOW()
),
-- 4. David Kim - Frontend & React Expert
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567804',
    NULL,
    'David Kim',
    'Engineering Manager at Meta leading the React Core team. 9 years of frontend experience building products used by billions. I help engineers level up their React skills, prepare for frontend interviews, and transition into leadership roles. Open source contributor to React and Next.js.',
    ARRAY['React', 'TypeScript', 'Next.js', 'JavaScript', 'CSS', 'GraphQL', 'Testing'],
    ARRAY['Frontend Development', 'Full Stack Development'],
    9,
    'Engineering Manager',
    'Meta',
    'https://linkedin.com/in/davidkim',
    4,
    1,
    3,
    'both',
    'available',
    4.7,
    112,
    NOW()
),
-- 5. Emily Rodriguez - DevOps & SRE
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567805',
    NULL,
    'Emily Rodriguez',
    'Site Reliability Engineer at Netflix with a passion for building resilient systems. I''ve mentored 30+ engineers on DevOps practices, Kubernetes, and incident management. Previously at Uber and Airbnb. I love helping people understand the SRE mindset and build production-ready skills.',
    ARRAY['Kubernetes', 'Docker', 'CI/CD', 'Prometheus', 'Grafana', 'Terraform', 'AWS', 'Linux'],
    ARRAY['DevOps & SRE', 'Cloud & Infrastructure'],
    7,
    'Senior SRE',
    'Netflix',
    'https://linkedin.com/in/emilyrodriguez',
    5,
    4,
    4,
    'video',
    'available',
    4.9,
    78,
    NOW()
),
-- 6. James Wilson - Security Engineering
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567806',
    NULL,
    'James Wilson',
    'Principal Security Engineer at Palo Alto Networks with 15 years in cybersecurity. CISSP, CEH certified. I mentor engineers breaking into security, from penetration testing to cloud security architecture. Former NSA contractor and Bug Bounty hunter with $500K+ in bounties.',
    ARRAY['Cybersecurity', 'Penetration Testing', 'Cloud Security', 'OWASP', 'IAM', 'Encryption', 'Python'],
    ARRAY['Cybersecurity', 'Cloud & Infrastructure'],
    15,
    'Principal Security Engineer',
    'Palo Alto Networks',
    'https://linkedin.com/in/jameswilson',
    3,
    1,
    2,
    'video',
    'available',
    4.8,
    45,
    NOW()
),
-- 7. Lisa Thompson - Data Engineering
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567807',
    NULL,
    'Lisa Thompson',
    'Staff Data Engineer at Databricks building next-gen data platforms. Expert in Spark, real-time streaming, and data architecture. I help engineers transition from software engineering to data engineering and level up their big data skills. Speaker at Data Council and Spark Summit.',
    ARRAY['Apache Spark', 'Python', 'SQL', 'Kafka', 'Airflow', 'dbt', 'Snowflake', 'Data Modeling'],
    ARRAY['Data Engineering', 'AI & Machine Learning'],
    11,
    'Staff Data Engineer',
    'Databricks',
    'https://linkedin.com/in/lisathompson',
    4,
    2,
    3,
    'video',
    'available',
    4.6,
    93,
    NOW()
),
-- 8. Alex Rivera - Full Stack & Startups
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567808',
    NULL,
    'Alex Rivera',
    'Co-founder & CTO of a YC-backed startup (acquired by Stripe). 8 years building full-stack products from 0 to 1M users. I mentor engineers on full-stack development, startup engineering, and making the leap from big tech to startups. Investor in 5 dev tool startups.',
    ARRAY['Node.js', 'React', 'TypeScript', 'PostgreSQL', 'AWS', 'System Design', 'Product Development'],
    ARRAY['Full Stack Development', 'Backend Development', 'Frontend Development'],
    8,
    'CTO & Co-founder',
    'Stripe (acquired)',
    'https://linkedin.com/in/alexrivera',
    5,
    3,
    5,
    'both',
    'available',
    4.9,
    156,
    NOW()
),
-- 9. Michelle Lee - Mobile Development
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567809',
    NULL,
    'Michelle Lee',
    'Senior iOS Engineer at Apple working on core iOS frameworks. 6 years of mobile development experience across iOS and Android. I mentor engineers on mobile development best practices, SwiftUI, and preparing for mobile-focused interviews at top companies.',
    ARRAY['Swift', 'SwiftUI', 'iOS', 'Kotlin', 'Android', 'React Native', 'Mobile Architecture'],
    ARRAY['Mobile Development', 'Frontend Development'],
    6,
    'Senior iOS Engineer',
    'Apple',
    'https://linkedin.com/in/michellelee',
    3,
    1,
    2,
    'video',
    'available',
    4.7,
    52,
    NOW()
),
-- 10. Robert Zhang - Platform Engineering
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567810',
    NULL,
    'Robert Zhang',
    'Distinguished Engineer at Cloudflare leading platform infrastructure. 14 years building developer platforms and internal tools at scale. I help engineers understand platform engineering, developer experience, and growing into senior/staff roles. Author of "Platform Engineering Handbook".',
    ARRAY['Go', 'Rust', 'Kubernetes', 'Platform Engineering', 'Developer Tools', 'API Design', 'Distributed Systems'],
    ARRAY['Cloud & Infrastructure', 'DevOps & SRE', 'Backend Development'],
    14,
    'Distinguished Engineer',
    'Cloudflare',
    'https://linkedin.com/in/robertzhang',
    4,
    2,
    3,
    'video',
    'available',
    4.8,
    87,
    NOW()
)
ON CONFLICT (id) DO NOTHING;
