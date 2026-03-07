'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import api from '@/lib/api';
import { AnalysisResult, InterviewQuestion, ParsedJobInfo, SavedAnalysisCreate, UserProfile } from '@/lib/types';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import GapDisplay from '@/components/GapDisplay';
import RoadmapCard from '@/components/RoadmapCard';
import InterviewQuestions from '@/components/InterviewQuestions';
import SkillInput from '@/components/SkillInput';
import Chatbot from '@/components/Chatbot';
import { buildChatContext } from '@/lib/chatContext';

// Demo job posting from Palo Alto Networks
const DEMO_JOB_POSTING = {
  id: 'demo-palo-alto',
  company: 'Palo Alto Networks',
  company_logo_url: null,
  title: 'Senior Software Engineer, Cortex XSIAM',
  industry: 'Cybersecurity',
  location: 'Santa Clara, CA, USA',
  employment_type: 'Full-time',
  experience_level: 'Senior',
  minimum_qualifications: [
    "Bachelor's degree in Computer Science, Engineering, or related technical field.",
    '5+ years of software engineering experience with focus on backend systems.',
    'Strong proficiency in Python or Java with experience in distributed systems.',
    'Experience building and operating large-scale data processing pipelines.',
    'Experience with message queuing systems (Kafka, RabbitMQ, or similar).',
    'Experience with search and analytics platforms (Elasticsearch, Splunk, or similar).',
  ],
  preferred_qualifications: [
    "Master's degree or PhD in Computer Science, Machine Learning, or related field.",
    '8+ years of software engineering experience.',
    'Experience in cybersecurity, threat detection, or security operations.',
    'Experience with machine learning systems in production environments.',
    'Experience with stream processing frameworks (Spark Streaming, Flink, or Kafka Streams).',
    'Knowledge of security frameworks (MITRE ATT&CK, NIST, CIS).',
    'Track record of leading technical projects and mentoring engineers.',
  ],
  about_the_job: `At Palo Alto Networks, we're committed to being the cybersecurity partner of choice. We're building the future of security operations with Cortex XSIAM—the industry's first autonomous security operations platform that uses AI to transform how security teams detect, investigate, and respond to threats.

As a Senior Software Engineer on the Cortex XSIAM team, you will architect and build the core platform components that process billions of security events daily. You'll work on cutting-edge machine learning pipelines for threat detection, high-throughput data ingestion systems, and real-time analytics engines that enable security teams to respond to threats in seconds rather than hours.

This role requires deep technical expertise in building large-scale distributed systems, experience with streaming data architectures, and passion for solving complex security challenges. You'll collaborate with world-class security researchers, data scientists, and engineers to build products that protect organizations from sophisticated cyber threats.

Our compensation ranges from $152,000 to $247,500, depending on location. This position is eligible for bonus and equity.`,
  responsibilities: [
    'Architect and develop core platform features for Cortex XSIAM, processing 10+ billion events per day.',
    'Build high-throughput, low-latency data pipelines using Kafka, Spark, and custom streaming solutions.',
    'Design and implement machine learning infrastructure for real-time threat detection and anomaly detection.',
    'Lead technical design discussions, create architecture documents, and conduct design reviews.',
    'Collaborate with security researchers to implement new detection algorithms and threat intelligence integrations.',
    'Mentor engineers, establish coding standards, and drive engineering excellence across the team.',
  ],
  required_skills: [
    'Python',
    'Java',
    'Elasticsearch',
    'Kafka',
    'Machine Learning',
    'Big Data',
    'Cybersecurity',
    'REST APIs',
    'Microservices',
    'Distributed Systems',
  ],
  preferred_skills: ['Apache Spark', 'Flink', 'SOAR', 'SIEM', 'Kubernetes', 'TensorFlow', 'PyTorch', 'MITRE ATT&CK'],
  required_experience_years: 5,
  salary_range: '$152,000 - $247,500 + bonus + equity',
  benefits: [
    'Competitive equity package with RSUs',
    'FLEXBenefits wellness spending ($1,000/year)',
    'Comprehensive medical, dental, and vision',
    'Mental health resources and EAP',
    'Fitness reimbursement ($100/month)',
    'Unlimited PTO',
    '401(k) with company match',
  ],
};

// Cache key for localStorage
const ANALYSIS_CACHE_KEY = 'skillbridge_analysis_cache';

interface AnalysisCache {
  skills: string[];
  jobId: string;
  analysis: AnalysisResult;
  timestamp: number;
}

function getCachedAnalysis(skills: string[], jobId: string): AnalysisResult | null {
  try {
    const cached = localStorage.getItem(ANALYSIS_CACHE_KEY);
    if (!cached) return null;

    const cacheData: AnalysisCache = JSON.parse(cached);

    // Check if skills match (same skills, same order not required)
    const skillsMatch =
      skills.length === cacheData.skills.length &&
      skills.every((s) => cacheData.skills.includes(s));

    // Check if job matches
    const jobMatches = jobId === cacheData.jobId;

    // Check if cache is not older than 1 hour
    const isRecent = Date.now() - cacheData.timestamp < 60 * 60 * 1000;

    if (skillsMatch && jobMatches && isRecent) {
      return cacheData.analysis;
    }

    return null;
  } catch {
    return null;
  }
}

function setCachedAnalysis(skills: string[], jobId: string, analysis: AnalysisResult): void {
  try {
    const cacheData: AnalysisCache = {
      skills,
      jobId,
      analysis,
      timestamp: Date.now(),
    };
    localStorage.setItem(ANALYSIS_CACHE_KEY, JSON.stringify(cacheData));
  } catch {
    // Ignore cache errors
  }
}

export default function AnalyzeRolePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [userName, setUserName] = useState('');

  // Input state
  const [inputMode, setInputMode] = useState<'link' | 'paste'>('link');
  const [jobLink, setJobLink] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobLoaded, setJobLoaded] = useState(false);

  // Profile editing state
  const [editingProfile, setEditingProfile] = useState(false);
  const [tempSkills, setTempSkills] = useState<string[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);

  // Analysis state
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [parsedJob, setParsedJob] = useState<ParsedJobInfo | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingJob, setLoadingJob] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useAI, setUseAI] = useState(true);
  const [completedSkills, setCompletedSkills] = useState<Set<string>>(new Set());
  const [usedCache, setUsedCache] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [learningSkill, setLearningSkill] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const init = async () => {
      const response = await supabase.auth.getSession();
      const session = response?.data?.session;
      if (!session) {
        router.push('/auth/login');
        return;
      }

      setUserId(session.user.id);

      // Load user profile for skills
      try {
        const profile = await api.getProfile(session.user.id);
        setUserProfile(profile);
        setUserSkills(profile.skills || []);
        setTempSkills(profile.skills || []);
        setUserName(profile.name || '');
      } catch {
        // No profile, redirect to create one
        router.push('/profile');
        return;
      }

      setLoading(false);
    };

    init();
  }, [router]);

  const handleLoadJob = async () => {
    if (inputMode === 'link' && !jobLink.trim()) {
      setError('Please enter a job posting URL');
      return;
    }
    if (inputMode === 'paste' && !jobDescription.trim()) {
      setError('Please paste the job description');
      return;
    }

    setError(null);
    setLoadingJob(true);

    // For paste mode, parse and analyze the job description
    if (inputMode === 'paste' && jobDescription.trim()) {
      if (!userId || userSkills.length === 0) {
        setError('Please add skills to your profile first');
        setLoadingJob(false);
        return;
      }

      try {
        const result = await api.analyzeFromDescription({
          user_skills: userSkills,
          job_description: jobDescription,
          user_id: userId,
          use_fallback: !useAI,
        });

        setParsedJob(result.parsed_job);
        setAnalysis(result.analysis);
        setJobLoaded(true);

        // Initialize completedSkills with skills that user has already learned
        const learnedSkills = result.analysis.recommendations
          ?.filter((rec) =>
            userSkills.some((us) => us.toLowerCase() === rec.skill.toLowerCase())
          )
          .map((rec) => rec.skill) || [];
        setCompletedSkills(new Set(learnedSkills));
      } catch (err) {
        console.error('Description analysis error:', err);
        setError(err instanceof Error ? err.message : 'Failed to analyze job description');
      } finally {
        setLoadingJob(false);
      }
    } else {
      // For link mode (demo), simulate loading before showing demo job
      await new Promise(resolve => setTimeout(resolve, 2000));
      setJobLoaded(true);
      const cached = getCachedAnalysis(userSkills, DEMO_JOB_POSTING.id);
      if (cached) {
        setAnalysis(cached);
        setUsedCache(true);
        // Initialize completedSkills with skills that user has already learned
        const learnedSkills = cached.recommendations
          ?.filter((rec) =>
            userSkills.some((us) => us.toLowerCase() === rec.skill.toLowerCase())
          )
          .map((rec) => rec.skill) || [];
        setCompletedSkills(new Set(learnedSkills));
      }
      setLoadingJob(false);
    }
  };

  const toggleSkillComplete = async (skill: string) => {
    if (!userId) return;

    const isCurrentlyCompleted = completedSkills.has(skill);

    if (isCurrentlyCompleted) {
      // Unchecking - remove skill from profile
      setLearningSkill(skill);
      try {
        const updatedSkills = userSkills.filter(
          (s) => s.toLowerCase() !== skill.toLowerCase()
        );
        await api.updateProfile(userId, { skills: updatedSkills });
        setUserSkills(updatedSkills);
        setTempSkills(updatedSkills);

        // Update local state
        setCompletedSkills((prev) => {
          const next = new Set(prev);
          next.delete(skill);
          return next;
        });

        // Clear cache
        localStorage.removeItem(ANALYSIS_CACHE_KEY);

        // Re-run analysis with updated skills
        if (inputMode === 'paste' && jobDescription.trim()) {
          const result = await api.analyzeFromDescription({
            user_skills: updatedSkills,
            job_description: jobDescription,
            user_id: userId,
            use_fallback: !useAI,
          });
          setParsedJob(result.parsed_job);
          setAnalysis(result.analysis);
        } else {
          // For demo mode, recalculate locally
          const requiredSkills = DEMO_JOB_POSTING.required_skills.map((s) => s.toLowerCase());
          const userSkillsLower = updatedSkills.map((s) => s.toLowerCase());

          const matching = requiredSkills.filter((reqSkill) =>
            userSkillsLower.some((us) => us.includes(reqSkill) || reqSkill.includes(us))
          );
          const missing = requiredSkills.filter(
            (reqSkill) => !userSkillsLower.some((us) => us.includes(reqSkill) || reqSkill.includes(us))
          );

          const matchPercentage = Math.round((matching.length / requiredSkills.length) * 100);

          setAnalysis((prev) => prev ? {
            ...prev,
            matching_skills: matching.map((s) => DEMO_JOB_POSTING.required_skills.find((rs) => rs.toLowerCase() === s) || s),
            missing_skills: missing.map((s) => DEMO_JOB_POSTING.required_skills.find((rs) => rs.toLowerCase() === s) || s),
            match_percentage: matchPercentage,
            recommendations: missing.slice(0, 5).map((reqSkill, idx) => ({
              skill: DEMO_JOB_POSTING.required_skills.find((rs) => rs.toLowerCase() === reqSkill) || reqSkill,
              priority: idx + 1,
              resources: [],
            })),
          } : null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to remove skill from profile');
      } finally {
        setLearningSkill(null);
      }
    } else {
      // Checking - just update local state (onMarkLearned handles the persist)
      setCompletedSkills((prev) => new Set([...prev, skill]));
    }
  };

  const runAnalysis = useCallback(async (forceRefresh = false) => {
    if (!userId || userSkills.length === 0) {
      setError('Please add skills to your profile first');
      return;
    }

    // For paste mode with job description, use the API to parse and analyze
    if (inputMode === 'paste' && jobDescription.trim()) {
      setAnalyzing(true);
      setError(null);
      setUsedCache(false);

      try {
        const result = await api.analyzeFromDescription({
          user_skills: userSkills,
          job_description: jobDescription,
          user_id: userId,
          use_fallback: !useAI,
        });

        setParsedJob(result.parsed_job);
        setAnalysis(result.analysis);

        // Initialize completedSkills with skills that user has already learned
        const learnedSkills = result.analysis.recommendations
          ?.filter((rec) =>
            userSkills.some((us) => us.toLowerCase() === rec.skill.toLowerCase())
          )
          .map((rec) => rec.skill) || [];
        setCompletedSkills(new Set(learnedSkills));
      } catch (err) {
        console.error('Description analysis error:', err);
        setError(err instanceof Error ? err.message : 'Failed to analyze job description');
      } finally {
        setAnalyzing(false);
      }
      return;
    }

    // For link mode (demo), check cache first
    if (!forceRefresh) {
      const cached = getCachedAnalysis(userSkills, DEMO_JOB_POSTING.id);
      if (cached) {
        setAnalysis(cached);
        setUsedCache(true);
        // Initialize completedSkills with skills that user has already learned
        const learnedSkills = cached.recommendations
          ?.filter((rec) =>
            userSkills.some((us) => us.toLowerCase() === rec.skill.toLowerCase())
          )
          .map((rec) => rec.skill) || [];
        setCompletedSkills(new Set(learnedSkills));
        return;
      }
    }

    setAnalyzing(true);
    setError(null);
    setUsedCache(false);
    setCompletedSkills(new Set());

    // For demo mode, use local analysis since we don't have a real job_posting_id in the database
    const requiredSkills = DEMO_JOB_POSTING.required_skills.map((s) => s.toLowerCase());
    const userSkillsLower = userSkills.map((s) => s.toLowerCase());

    const matching = requiredSkills.filter((skill) =>
      userSkillsLower.some((us) => us.includes(skill) || skill.includes(us))
    );
    const missing = requiredSkills.filter(
      (skill) => !userSkillsLower.some((us) => us.includes(skill) || skill.includes(us))
    );

    const matchPercentage = Math.round((matching.length / requiredSkills.length) * 100);

    const localAnalysis: AnalysisResult = {
      matching_skills: matching.map((s) => DEMO_JOB_POSTING.required_skills.find((rs) => rs.toLowerCase() === s) || s),
      missing_skills: missing.map((s) => DEMO_JOB_POSTING.required_skills.find((rs) => rs.toLowerCase() === s) || s),
      match_percentage: matchPercentage,
      recommendations: missing.slice(0, 5).map((skill, idx) => ({
        skill: DEMO_JOB_POSTING.required_skills.find((rs) => rs.toLowerCase() === skill) || skill,
        priority: idx + 1,
        resources: [],
      })),
      estimated_time: `${missing.length * 2}-${missing.length * 4} weeks`,
      profile_summary: `Based on your current skills, you have a ${matchPercentage}% match with the ${DEMO_JOB_POSTING.title} role at ${DEMO_JOB_POSTING.company}. ${
        matchPercentage >= 70
          ? "You're well-positioned for this role!"
          : matchPercentage >= 50
            ? 'With some focused learning, you could be a strong candidate.'
            : 'This role may require significant upskilling, but the skills are valuable and transferable.'
      }`,
      ai_generated: false,
    };

    setAnalysis(localAnalysis);
    setCachedAnalysis(userSkills, DEMO_JOB_POSTING.id, localAnalysis);
    setAnalyzing(false);
  }, [userId, userSkills, useAI, inputMode, jobDescription]);

  const handleGenerateQuestions = async (): Promise<InterviewQuestion[]> => {
    // For demo, return mock questions since we don't have a real job posting ID
    return [
      {
        category: 'Technical',
        question: `Explain how you would design a distributed data pipeline using ${DEMO_JOB_POSTING.required_skills[3]} to process millions of security events per second.`,
        difficulty: 'hard',
        tips: 'Focus on scalability, fault tolerance, and exactly-once processing guarantees.',
      },
      {
        category: 'Technical',
        question: `What are the key differences between ${DEMO_JOB_POSTING.required_skills[0]} and ${DEMO_JOB_POSTING.required_skills[1]} for building backend services? When would you choose one over the other?`,
        difficulty: 'medium',
        tips: 'Discuss type safety, performance characteristics, ecosystem, and team expertise.',
      },
      {
        category: 'Technical',
        question: `How would you implement real-time anomaly detection for cybersecurity threats using ${DEMO_JOB_POSTING.required_skills[4]}?`,
        difficulty: 'hard',
        tips: 'Consider both supervised and unsupervised approaches, feature engineering, and latency requirements.',
      },
      {
        category: 'Behavioral',
        question: 'Tell me about a time when you had to debug a complex distributed system issue under time pressure.',
        difficulty: 'medium',
        tips: "Use the STAR method. Emphasize your systematic approach and how you communicated with stakeholders.",
      },
      {
        category: 'Behavioral',
        question: "Describe a situation where you had to push back on a technical decision. How did you handle it?",
        difficulty: 'medium',
        tips: 'Show that you can disagree constructively while remaining collaborative.',
      },
      {
        category: 'System Design',
        question: 'Design a SIEM (Security Information and Event Management) system that can handle 10 billion events per day.',
        difficulty: 'hard',
        tips: 'Cover data ingestion, storage, indexing, search, alerting, and retention policies.',
      },
      {
        category: 'System Design',
        question: 'How would you design a real-time threat detection system that minimizes false positives while maintaining low latency?',
        difficulty: 'hard',
        tips: 'Discuss ML model selection, feature engineering, threshold tuning, and feedback loops.',
      },
      {
        category: 'Role Fit',
        question: 'Why are you interested in cybersecurity, and what draws you to Palo Alto Networks specifically?',
        difficulty: 'easy',
        tips: "Research the company's products, recent news, and mission. Be authentic about your motivations.",
      },
      {
        category: 'Role Fit',
        question: 'How do you stay current with the latest developments in cybersecurity and distributed systems?',
        difficulty: 'easy',
        tips: 'Mention specific blogs, conferences, papers, or communities you follow.',
      },
    ];
  };

  const handleReset = () => {
    setJobLoaded(false);
    setJobLink('');
    setJobDescription('');
    setAnalysis(null);
    setParsedJob(null);
    setCompletedSkills(new Set());
    setError(null);
    setUsedCache(false);
    setSaved(false);
  };

  const handleSaveAnalysis = async () => {
    if (!userId || !analysis) return;

    const jobInfo: ParsedJobInfo = parsedJob || {
      title: DEMO_JOB_POSTING.title,
      company: DEMO_JOB_POSTING.company,
      required_skills: DEMO_JOB_POSTING.required_skills,
      nice_to_have_skills: DEMO_JOB_POSTING.preferred_skills,
      experience_level: DEMO_JOB_POSTING.experience_level,
      responsibilities: DEMO_JOB_POSTING.responsibilities,
      minimum_qualifications: DEMO_JOB_POSTING.minimum_qualifications,
      description: DEMO_JOB_POSTING.about_the_job,
    };

    setSaving(true);
    try {
      await api.saveAnalysis({
        user_id: userId,
        job_info: jobInfo,
        analysis_result: analysis,
        job_description: inputMode === 'paste' ? jobDescription : undefined,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save analysis');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkSkillLearned = async (skill: string) => {
    if (!userId) return;

    setLearningSkill(skill);
    try {
      // Add skill to user's profile
      const updatedSkills = [...userSkills, skill];
      await api.updateProfile(userId, { skills: updatedSkills });
      setUserSkills(updatedSkills);
      setTempSkills(updatedSkills);

      // Mark as completed locally
      setCompletedSkills((prev) => new Set([...prev, skill]));

      // Clear cache since skills changed
      localStorage.removeItem(ANALYSIS_CACHE_KEY);

      // Re-run analysis with updated skills
      if (inputMode === 'paste' && jobDescription.trim()) {
        const result = await api.analyzeFromDescription({
          user_skills: updatedSkills,
          job_description: jobDescription,
          user_id: userId,
          use_fallback: !useAI,
        });
        setParsedJob(result.parsed_job);
        setAnalysis(result.analysis);
      } else {
        // For demo mode, recalculate locally
        const requiredSkills = DEMO_JOB_POSTING.required_skills.map((s) => s.toLowerCase());
        const userSkillsLower = updatedSkills.map((s) => s.toLowerCase());

        const matching = requiredSkills.filter((reqSkill) =>
          userSkillsLower.some((us) => us.includes(reqSkill) || reqSkill.includes(us))
        );
        const missing = requiredSkills.filter(
          (reqSkill) => !userSkillsLower.some((us) => us.includes(reqSkill) || reqSkill.includes(us))
        );

        const matchPercentage = Math.round((matching.length / requiredSkills.length) * 100);

        setAnalysis((prev) => prev ? {
          ...prev,
          matching_skills: matching.map((s) => DEMO_JOB_POSTING.required_skills.find((rs) => rs.toLowerCase() === s) || s),
          missing_skills: missing.map((s) => DEMO_JOB_POSTING.required_skills.find((rs) => rs.toLowerCase() === s) || s),
          match_percentage: matchPercentage,
          recommendations: missing.slice(0, 5).map((reqSkill, idx) => ({
            skill: DEMO_JOB_POSTING.required_skills.find((rs) => rs.toLowerCase() === reqSkill) || reqSkill,
            priority: idx + 1,
            resources: [],
          })),
        } : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add skill to profile');
    } finally {
      setLearningSkill(null);
    }
  };

  const handleEditProfile = () => {
    setTempSkills([...userSkills]);
    setEditingProfile(true);
  };

  const handleCancelEdit = () => {
    setTempSkills([...userSkills]);
    setEditingProfile(false);
  };

  const handleSaveProfile = async () => {
    if (!userId) return;

    setSavingProfile(true);
    try {
      await api.updateProfile(userId, { skills: tempSkills });
      setUserSkills(tempSkills);
      setEditingProfile(false);

      // Clear cache since skills changed
      localStorage.removeItem(ANALYSIS_CACHE_KEY);
      setAnalysis(null);
      setUsedCache(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-purple pt-4 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="text-white mb-6 md:mb-0">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Analyze Any Role</h1>
              <p className="text-white/80 text-lg">
                Paste a job link or description to see how your skills match up
              </p>
            </div>
            <Button variant="yellow" onClick={() => router.push('/profile')} rightIcon>
              Full Profile
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">{error}</div>
        )}

        {/* Your Skills Card */}
        <Card variant="elevated" className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Your Skills
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  {userName && `${userName} • `}{userSkills.length} skills
                </p>
              </div>
              {!editingProfile ? (
                <Button variant="ghost" size="sm" onClick={handleEditProfile}>
                  Edit Skills
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleSaveProfile} isLoading={savingProfile}>
                    Save
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {editingProfile ? (
              <SkillInput
                skills={tempSkills}
                onChange={setTempSkills}
                placeholder="Add a skill and press Enter..."
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {userSkills.length > 0 ? (
                  userSkills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm italic">No skills added. Click "Edit Skills" to add some.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {!jobLoaded ? (
          /* Input Section */
          <Card variant="elevated" className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Enter Job Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mode Toggle */}
              <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
                <button
                  onClick={() => setInputMode('link')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    inputMode === 'link' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Paste Link
                </button>
                <button
                  onClick={() => setInputMode('paste')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    inputMode === 'paste' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Paste Description
                </button>
              </div>

              {inputMode === 'link' ? (
                <div className="space-y-2">
                  <Input
                    label="Job Posting URL"
                    placeholder="https://careers.example.com/job/12345"
                    value={jobLink}
                    onChange={(e) => setJobLink(e.target.value)}
                    helperText="Paste a link to any job posting"
                  />
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-amber-800">Demo Mode</p>
                        <p className="text-sm text-amber-700">
                          For this demo, any link will analyze against the Palo Alto Networks Senior Software Engineer role. Use "Paste Description" for custom job descriptions.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Job Description</label>
                  <textarea
                    className="w-full h-48 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none"
                    placeholder="Paste the full job description here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                  />
                  <p className="text-sm text-gray-500">Include the job title, requirements, and responsibilities. AI will parse and analyze the description.</p>
                </div>
              )}

              <Button onClick={handleLoadJob} isLoading={loadingJob} className="w-full sm:w-auto">
                {loadingJob ? 'Analyzing...' : 'Load Job & Analyze'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Analysis Section */
          <div className="grid lg:grid-cols-2 gap-8 pb-12">
            {/* Job Details */}
            <div className="space-y-6">
              <Card variant="elevated" className="bg-white">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">
                        {parsedJob ? parsedJob.title : DEMO_JOB_POSTING.title}
                      </CardTitle>
                      {(parsedJob?.company || (!parsedJob && DEMO_JOB_POSTING.company)) && (
                        <p className="text-violet-600 font-medium mt-1">
                          {parsedJob?.company || DEMO_JOB_POSTING.company}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {!parsedJob && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            {DEMO_JOB_POSTING.location}
                          </span>
                        )}
                        {(parsedJob?.experience_level || (!parsedJob && DEMO_JOB_POSTING.experience_level)) && (
                          <span className="px-2 py-1 bg-violet-100 text-violet-700 rounded text-xs">
                            {parsedJob?.experience_level || DEMO_JOB_POSTING.experience_level}
                          </span>
                        )}
                        {!parsedJob && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                            {DEMO_JOB_POSTING.salary_range}
                          </span>
                        )}
                        {parsedJob && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                            AI Parsed
                          </span>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleReset}>
                      Change Job
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(parsedJob?.description || (!parsedJob && DEMO_JOB_POSTING.about_the_job)) && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">About the Role</h4>
                      <p className="text-sm text-gray-600 whitespace-pre-line">
                        {parsedJob?.description || DEMO_JOB_POSTING.about_the_job}
                      </p>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Required Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {(parsedJob?.required_skills || DEMO_JOB_POSTING.required_skills).map((skill) => (
                        <span
                          key={skill}
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            userSkills.some(
                              (us) => us.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(us.toLowerCase())
                            )
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {parsedJob?.nice_to_have_skills && parsedJob.nice_to_have_skills.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Nice to Have</h4>
                      <div className="flex flex-wrap gap-2">
                        {parsedJob.nice_to_have_skills.map((skill) => (
                          <span
                            key={skill}
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              userSkills.some(
                                (us) => us.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(us.toLowerCase())
                              )
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(parsedJob?.responsibilities?.length || (!parsedJob && DEMO_JOB_POSTING.responsibilities.length)) ? (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Responsibilities</h4>
                      <ul className="space-y-2">
                        {(parsedJob?.responsibilities || DEMO_JOB_POSTING.responsibilities).map((resp, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                            <span className="text-violet-500 mt-1">•</span>
                            {resp}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>

            {/* Analysis Results */}
            <div className="space-y-6">
              {/* AI Toggle & Analyze Button */}
              <Card variant="elevated" className="bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">Analysis Mode:</span>
                      <button
                        onClick={() => setUseAI(!useAI)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          useAI ? 'bg-violet-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            useAI ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <span className={`text-sm font-medium ${useAI ? 'text-violet-600' : 'text-gray-500'}`}>
                        {useAI ? 'AI Analysis' : 'Rule-based'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {usedCache && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Cached</span>
                      )}
                      <Button onClick={() => runAnalysis(true)} isLoading={analyzing} variant={analysis ? 'outline' : 'primary'}>
                        {analysis ? 'Re-analyze' : 'Analyze My Fit'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {analysis ? (
                <>
                  {/* Save Analysis Button */}
                  <Card variant="elevated" className="bg-white">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Save this analysis</p>
                          <p className="text-xs text-gray-500">Come back later to review your progress</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {saved && (
                            <span className="text-sm text-green-600 flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Saved
                            </span>
                          )}
                          <Button
                            variant={saved ? 'outline' : 'primary'}
                            size="sm"
                            onClick={handleSaveAnalysis}
                            isLoading={saving}
                            disabled={saved}
                          >
                            {saved ? 'Saved' : 'Save Analysis'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <GapDisplay analysis={analysis} />

                  {analysis.recommendations.length > 0 && (
                    <Card variant="elevated" className="bg-white">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>Learning Roadmap</CardTitle>
                            <p className="text-sm text-gray-500">
                              {analysis.estimated_time
                                ? `Estimated time: ${analysis.estimated_time}`
                                : 'Start with high-priority skills'}
                            </p>
                          </div>
                          {completedSkills.size > 0 && (
                            <span className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
                              {completedSkills.size} / {analysis.recommendations.length} completed
                            </span>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {analysis.recommendations.slice(0, 5).map((rec) => (
                          <RoadmapCard
                            key={rec.skill}
                            recommendation={rec}
                            isCompleted={completedSkills.has(rec.skill)}
                            onToggleComplete={toggleSkillComplete}
                            onMarkLearned={handleMarkSkillLearned}
                            isLearning={learningSkill === rec.skill}
                          />
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Interview Questions */}
                  <InterviewQuestions
                    jobTitle={parsedJob?.title || DEMO_JOB_POSTING.title}
                    company={parsedJob?.company || DEMO_JOB_POSTING.company}
                    skills={analysis.missing_skills}
                    onGenerateQuestions={handleGenerateQuestions}
                  />
                </>
              ) : (
                <Card variant="elevated" className="bg-white">
                  <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Ready to Analyze</h3>
                    <p className="text-gray-500 text-sm mb-4">
                      Click "Analyze My Fit" to see how your skills compare to this role
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Chatbot */}
      <Chatbot
        context={buildChatContext({
          profile: userProfile,
          parsedJob: parsedJob || undefined,
          analysis: analysis,
        })}
        userId={userId || undefined}
      />
    </div>
  );
}
