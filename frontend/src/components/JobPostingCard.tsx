'use client';

import { JobPosting } from '@/lib/types';
import SkillTag from '@/components/ui/SkillTag';

interface JobPostingCardProps {
  posting: JobPosting;
  userSkills?: string[];
  onAnalyze?: (posting: JobPosting) => void;
  isSelected?: boolean;
}

export default function JobPostingCard({
  posting,
  userSkills = [],
  onAnalyze,
  isSelected = false,
}: JobPostingCardProps) {
  // Calculate quick match percentage
  const normalizedUserSkills = userSkills.map((s) => s.toLowerCase());
  const matchingSkills = posting.required_skills.filter((skill) =>
    normalizedUserSkills.some(
      (us) => us.includes(skill.toLowerCase()) || skill.toLowerCase().includes(us)
    )
  );
  const matchPercentage =
    posting.required_skills.length > 0
      ? Math.round((matchingSkills.length / posting.required_skills.length) * 100)
      : 0;

  const getMatchColor = (percentage: number) => {
    if (percentage >= 70) return 'text-green-600 bg-green-100';
    if (percentage >= 40) return 'text-amber-600 bg-amber-100';
    return 'text-red-500 bg-red-100';
  };

  const getCompanyInitial = (company: string) => {
    return company.charAt(0).toUpperCase();
  };

  const getCompanyColor = (company: string) => {
    const colors: Record<string, string> = {
      'Google': 'bg-blue-500',
      'Amazon': 'bg-orange-500',
      'Meta': 'bg-blue-600',
      'Apple': 'bg-gray-800',
      'Palo Alto Networks': 'bg-red-500',
    };
    return colors[company] || 'bg-violet-500';
  };

  return (
    <div
      className={`bg-white rounded-2xl p-5 cursor-pointer transition-all duration-200 border-2 hover:shadow-lg hover:-translate-y-1 ${
        isSelected
          ? 'border-violet-500 shadow-lg shadow-violet-500/20'
          : 'border-transparent shadow-md hover:border-violet-200'
      }`}
      onClick={() => onAnalyze?.(posting)}
    >
      {/* Company header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-12 h-12 ${getCompanyColor(posting.company)} rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
          {getCompanyInitial(posting.company)}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{posting.company}</p>
          {userSkills.length > 0 && (
            <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getMatchColor(matchPercentage)}`}>
              {matchPercentage}% match
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
          {posting.employment_type}
        </span>
        <span className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-medium">
          {posting.experience_level}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-bold text-gray-900 text-lg mb-2 leading-tight">
        {posting.title}
      </h3>

      {/* Details */}
      <div className="space-y-1.5 text-sm text-gray-600 mb-4">
        <p className="flex items-center gap-2">
          <span className="text-base">📍</span>
          <span>{posting.location}</span>
        </p>
        <p className="flex items-center gap-2">
          <span className="text-base">🏢</span>
          <span>{posting.industry}</span>
        </p>
        {posting.salary_range && (
          <p className="flex items-center gap-2">
            <span className="text-base">💰</span>
            <span className="text-green-600 font-medium">{posting.salary_range}</span>
          </p>
        )}
      </div>

      {/* Skills preview */}
      <div className="mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Top Skills</p>
        <div className="flex flex-wrap gap-1.5">
          {posting.required_skills.slice(0, 5).map((skill) => {
            const isMatch = normalizedUserSkills.some(
              (us) =>
                us.includes(skill.toLowerCase()) || skill.toLowerCase().includes(us)
            );
            return (
              <SkillTag
                key={skill}
                skill={skill}
                variant={isMatch ? 'success' : 'default'}
                size="sm"
              />
            );
          })}
          {posting.required_skills.length > 5 && (
            <span className="text-xs text-gray-400 px-2 py-1">
              +{posting.required_skills.length - 5}
            </span>
          )}
        </div>
      </div>

      {/* CTA hint */}
      <div className="pt-3 border-t border-gray-100">
        <p className="text-xs text-center text-violet-500 font-medium">
          Click to see full analysis →
        </p>
      </div>
    </div>
  );
}
