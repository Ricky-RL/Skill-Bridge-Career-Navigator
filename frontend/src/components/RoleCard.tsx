import { JobRole } from '@/lib/types';
import Card, { CardHeader, CardTitle, CardContent } from './ui/Card';
import SkillTag from './ui/SkillTag';
import Button from './ui/Button';
import Link from 'next/link';

interface RoleCardProps {
  role: JobRole;
  onSelect?: (role: JobRole) => void;
  isSelected?: boolean;
}

export default function RoleCard({ role, onSelect, isSelected }: RoleCardProps) {
  const { title, category, description, required_skills, avg_salary_range } = role;

  return (
    <Card
      variant="bordered"
      className={`hover:shadow-md transition-all cursor-pointer ${
        isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''
      }`}
      onClick={() => onSelect?.(role)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {category && (
              <span className="text-sm text-gray-500">{category}</span>
            )}
          </div>
          {avg_salary_range && (
            <span className="text-sm font-medium text-green-600">
              {avg_salary_range}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{description}</p>
        )}
        <div>
          <p className="text-xs text-gray-500 mb-2">Required Skills:</p>
          <div className="flex flex-wrap gap-1">
            {required_skills.slice(0, 6).map((skill) => (
              <SkillTag key={skill} skill={skill} size="sm" />
            ))}
            {required_skills.length > 6 && (
              <span className="text-xs text-gray-500 self-center">
                +{required_skills.length - 6} more
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
