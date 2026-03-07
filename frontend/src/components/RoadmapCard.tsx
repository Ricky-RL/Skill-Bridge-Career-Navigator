import { SkillRecommendation } from '@/lib/types';
import Card, { CardHeader, CardTitle, CardContent } from './ui/Card';
import SkillTag from './ui/SkillTag';

interface RoadmapCardProps {
  recommendation: SkillRecommendation;
}

export default function RoadmapCard({ recommendation }: RoadmapCardProps) {
  const { skill, priority, resources } = recommendation;

  const getPriorityBadge = () => {
    if (priority === 1) return { color: 'bg-red-100 text-red-800', label: 'High Priority' };
    if (priority <= 3) return { color: 'bg-yellow-100 text-yellow-800', label: 'Medium Priority' };
    return { color: 'bg-gray-100 text-gray-800', label: 'Low Priority' };
  };

  const priorityBadge = getPriorityBadge();

  return (
    <Card variant="bordered" className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <span className="w-6 h-6 flex items-center justify-center bg-blue-600 text-white rounded-full text-sm mr-2">
              {priority}
            </span>
            {skill}
          </CardTitle>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityBadge.color}`}>
            {priorityBadge.label}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {resources && resources.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Recommended Resources:</p>
            <ul className="space-y-2">
              {resources.map((resource, idx) => (
                <li key={idx} className="flex items-start">
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
                  <div>
                    {resource.resource_url ? (
                      <a
                        href={resource.resource_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      >
                        {resource.resource_name}
                      </a>
                    ) : (
                      <span className="font-medium">{resource.resource_name}</span>
                    )}
                    {resource.platform && (
                      <span className="text-gray-500 text-sm ml-1">
                        ({resource.platform})
                      </span>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {resource.is_free && (
                        <SkillTag skill="Free" variant="success" size="sm" />
                      )}
                      {resource.estimated_hours && (
                        <span className="text-xs text-gray-500">
                          ~{resource.estimated_hours}h
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Search online courses or documentation for this skill.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
