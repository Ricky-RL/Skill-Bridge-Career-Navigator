'use client';

import { JobPosting } from '@/lib/types';
import SkillTag from '@/components/ui/SkillTag';

// Company logo/color configuration
const COMPANY_CONFIG: Record<string, { color: string; bgColor: string; icon?: string }> = {
  'Google': { color: '#4285F4', bgColor: 'bg-[#4285F4]', icon: 'G' },
  'Amazon': { color: '#FF9900', bgColor: 'bg-[#FF9900]', icon: 'a' },
  'Meta': { color: '#0668E1', bgColor: 'bg-[#0668E1]', icon: 'M' },
  'Apple': { color: '#000000', bgColor: 'bg-black', icon: '' },
  'Palo Alto Networks': { color: '#FA582D', bgColor: 'bg-[#FA582D]', icon: 'P' },
  'Microsoft': { color: '#00A4EF', bgColor: 'bg-[#00A4EF]', icon: 'M' },
  'Netflix': { color: '#E50914', bgColor: 'bg-[#E50914]', icon: 'N' },
  'Stripe': { color: '#635BFF', bgColor: 'bg-[#635BFF]', icon: 'S' },
  'Uber': { color: '#000000', bgColor: 'bg-black', icon: 'U' },
  'Airbnb': { color: '#FF5A5F', bgColor: 'bg-[#FF5A5F]', icon: 'A' },
  'Spotify': { color: '#1DB954', bgColor: 'bg-[#1DB954]', icon: 'S' },
  'NVIDIA': { color: '#76B900', bgColor: 'bg-[#76B900]', icon: 'N' },
  'Salesforce': { color: '#00A1E0', bgColor: 'bg-[#00A1E0]', icon: 'S' },
  'Databricks': { color: '#FF3621', bgColor: 'bg-[#FF3621]', icon: 'D' },
  'Cloudflare': { color: '#F38020', bgColor: 'bg-[#F38020]', icon: 'C' },
  'LinkedIn': { color: '#0A66C2', bgColor: 'bg-[#0A66C2]', icon: 'in' },
  'Snowflake': { color: '#29B5E8', bgColor: 'bg-[#29B5E8]', icon: 'S' },
  'Figma': { color: '#F24E1E', bgColor: 'bg-[#F24E1E]', icon: 'F' },
  'Coinbase': { color: '#0052FF', bgColor: 'bg-[#0052FF]', icon: 'C' },
  'Notion': { color: '#000000', bgColor: 'bg-black', icon: 'N' },
};

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

  const config = COMPANY_CONFIG[posting.company] || { color: '#7C3AED', bgColor: 'bg-violet-500', icon: posting.company.charAt(0).toUpperCase() };

  const renderCompanyLogo = () => {
    // Special icons for certain companies
    if (posting.company === 'Apple') {
      return (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
        </svg>
      );
    }
    if (posting.company === 'LinkedIn') {
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      );
    }
    if (posting.company === 'Spotify') {
      return (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
        </svg>
      );
    }
    // Default: show company initial
    return (
      <span className="text-white font-bold text-lg">
        {config.icon || posting.company.charAt(0).toUpperCase()}
      </span>
    );
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
        <div className={`w-12 h-12 ${config.bgColor} rounded-xl flex items-center justify-center shadow-lg`}>
          {renderCompanyLogo()}
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
