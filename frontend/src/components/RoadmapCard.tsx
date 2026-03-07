import { useRef } from 'react';
import confetti from 'canvas-confetti';
import { SkillRecommendation } from '@/lib/types';
import Card, { CardHeader, CardTitle, CardContent } from './ui/Card';
import SkillTag from './ui/SkillTag';

interface RoadmapCardProps {
  recommendation: SkillRecommendation;
  isCompleted?: boolean;
  onToggleComplete?: (skill: string) => void;
  onMarkLearned?: (skill: string) => void;
  isLearning?: boolean;
}

// Map common skills to their documentation/learning URLs
const skillUrls: Record<string, string> = {
  'kubernetes': 'https://kubernetes.io/docs/tutorials/',
  'k8s': 'https://kubernetes.io/docs/tutorials/',
  'docker': 'https://docs.docker.com/get-started/',
  'terraform': 'https://developer.hashicorp.com/terraform/tutorials',
  'aws': 'https://aws.amazon.com/training/',
  'gcp': 'https://cloud.google.com/training',
  'azure': 'https://learn.microsoft.com/en-us/training/azure/',
  'python': 'https://docs.python.org/3/tutorial/',
  'javascript': 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript',
  'typescript': 'https://www.typescriptlang.org/docs/handbook/',
  'react': 'https://react.dev/learn',
  'node.js': 'https://nodejs.org/en/learn',
  'go': 'https://go.dev/doc/tutorial/getting-started',
  'rust': 'https://doc.rust-lang.org/book/',
  'sql': 'https://sqlbolt.com/',
  'postgresql': 'https://www.postgresqltutorial.com/',
  'mongodb': 'https://university.mongodb.com/',
  'redis': 'https://redis.io/docs/getting-started/',
  'linux': 'https://linuxjourney.com/',
  'git': 'https://git-scm.com/book/en/v2',
  'ci/cd': 'https://docs.github.com/en/actions/learn-github-actions',
  'machine learning': 'https://www.coursera.org/specializations/machine-learning-introduction',
  'deep learning': 'https://course.fast.ai/',
  'tensorflow': 'https://www.tensorflow.org/tutorials',
  'pytorch': 'https://pytorch.org/tutorials/',
  'data structures': 'https://www.geeksforgeeks.org/data-structures/',
  'algorithms': 'https://leetcode.com/explore/',
  'system design': 'https://github.com/donnemartin/system-design-primer',
  'distributed systems': 'https://www.educative.io/courses/grokking-modern-system-design-interview',
  'cloud computing': 'https://aws.amazon.com/training/intro-to-aws/',
  'security': 'https://owasp.org/www-project-top-ten/',
  'network security': 'https://www.comptia.org/certifications/security',
  'graphql': 'https://graphql.org/learn/',
  'rest api': 'https://restfulapi.net/',
  'microservices': 'https://microservices.io/patterns/',
  'agile': 'https://www.atlassian.com/agile',
  'jenkins': 'https://www.jenkins.io/doc/tutorials/',
  'ansible': 'https://docs.ansible.com/ansible/latest/getting_started/',
  'prometheus': 'https://prometheus.io/docs/introduction/',
  'grafana': 'https://grafana.com/tutorials/',
  'elasticsearch': 'https://www.elastic.co/guide/en/elasticsearch/reference/current/getting-started.html',
  'kafka': 'https://kafka.apache.org/quickstart',
  'spark': 'https://spark.apache.org/docs/latest/quick-start.html',
};

function getSkillUrl(skill: string): string | null {
  const normalizedSkill = skill.toLowerCase();

  // Direct match
  if (skillUrls[normalizedSkill]) {
    return skillUrls[normalizedSkill];
  }

  // Partial match
  for (const [key, url] of Object.entries(skillUrls)) {
    if (normalizedSkill.includes(key) || key.includes(normalizedSkill)) {
      return url;
    }
  }

  // Fallback to Google search for the skill
  return `https://www.google.com/search?q=learn+${encodeURIComponent(skill)}+tutorial`;
}

export default function RoadmapCard({ recommendation, isCompleted = false, onToggleComplete, onMarkLearned, isLearning = false }: RoadmapCardProps) {
  const { skill, priority, resources } = recommendation;
  const checkboxRef = useRef<HTMLLabelElement>(null);

  const getPriorityBadge = () => {
    if (priority === 1) return { color: 'bg-red-100 text-red-800', label: 'High Priority' };
    if (priority <= 3) return { color: 'bg-yellow-100 text-yellow-800', label: 'Medium Priority' };
    return { color: 'bg-gray-100 text-gray-800', label: 'Low Priority' };
  };

  const handleToggleComplete = (skillName: string) => {
    // Only trigger when marking as complete (not when unchecking)
    if (!isCompleted) {
      // Fire confetti
      if (checkboxRef.current) {
        const rect = checkboxRef.current.getBoundingClientRect();
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;

        confetti({
          particleCount: 50,
          spread: 60,
          origin: { x, y },
          colors: ['#8b5cf6', '#10b981', '#fbbf24', '#3b82f6', '#ec4899'],
          ticks: 150,
          gravity: 1.2,
          scalar: 0.8,
          shapes: ['circle', 'square'],
        });
      }

      // If onMarkLearned is provided, use it to persist to profile
      // Otherwise fall back to local toggle
      if (onMarkLearned) {
        onMarkLearned(skillName);
      } else {
        onToggleComplete?.(skillName);
      }
    } else {
      // Allow unchecking (local state only)
      onToggleComplete?.(skillName);
    }
  };

  const priorityBadge = getPriorityBadge();
  const skillUrl = getSkillUrl(skill);

  return (
    <Card
      variant="bordered"
      className={`hover:shadow-md transition-all ${isCompleted ? 'bg-green-50/50 border-green-200' : ''}`}
    >
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center flex-1 min-w-0">
            {/* Checkbox */}
            <label ref={checkboxRef} className="relative flex items-center mr-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isCompleted}
                onChange={() => handleToggleComplete(skill)}
                disabled={isLearning}
                className="peer sr-only"
              />
              <div className={`w-6 h-6 flex-shrink-0 rounded border-2 flex items-center justify-center transition-all ${
                isLearning
                  ? 'border-violet-300 bg-violet-50'
                  : isCompleted
                    ? 'bg-green-500 border-green-500'
                    : 'border-gray-300 bg-white hover:border-violet-500'
              }`}>
                {isLearning ? (
                  <div className="w-3 h-3 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
                ) : isCompleted ? (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : null}
              </div>
            </label>
            {/* Priority number */}
            <span className="w-6 h-6 flex-shrink-0 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center mr-2">
              {priority}
            </span>
            <CardTitle className={`text-base ${isCompleted ? 'line-through text-gray-400' : ''}`}>
              {skill}
            </CardTitle>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${priorityBadge.color}`}>
            {priorityBadge.label}
          </span>
        </div>
      </CardHeader>
      <CardContent className={isCompleted ? 'opacity-60' : ''}>
        {/* Direct Learning Link */}
        {skillUrl && (
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <a
              href={skillUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 bg-violet-50 text-violet-700 rounded-lg hover:bg-violet-100 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Start Learning {skill}
            </a>
          </div>
        )}

        {resources && resources.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 font-medium">Recommended Resources:</p>
            <ul className="space-y-2">
              {resources.map((resource: any, idx: number) => (
                <li key={idx} className="flex items-start p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <svg
                    className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {(resource.url || resource.resource_url) ? (
                        <a
                          href={resource.url || resource.resource_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                          {resource.name || resource.resource_name}
                        </a>
                      ) : (
                        <span className="font-medium">{resource.name || resource.resource_name}</span>
                      )}
                      {(resource.platform || resource.is_free !== undefined) && (
                        <div className="flex items-center gap-1.5">
                          {resource.platform && (
                            <span className="text-gray-500 text-xs bg-gray-100 px-2 py-0.5 rounded">
                              {resource.platform}
                            </span>
                          )}
                          {resource.is_free && (
                            <SkillTag skill="Free" variant="success" size="sm" />
                          )}
                        </div>
                      )}
                    </div>
                    {resource.estimated_hours && (
                      <span className="text-xs text-gray-500 mt-1 block">
                        ~{resource.estimated_hours} hours
                      </span>
                    )}
                  </div>
                  {(resource.url || resource.resource_url) && (
                    <a
                      href={resource.url || resource.resource_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Click the button above to find learning resources for this skill.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
