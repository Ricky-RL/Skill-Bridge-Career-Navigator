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
    // Special SVG icons for certain companies
    if (posting.company === 'Google') {
      return (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      );
    }
    if (posting.company === 'Amazon') {
      return (
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="white">
          <path d="M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595l.315-.14c.138-.06.234-.1.293-.13.226-.088.39-.046.493.126.104.172.063.348-.122.528-.74.715-1.905 1.344-3.5 1.888-1.594.545-3.12.85-4.578.915-2.166.096-4.264-.19-6.29-.857C4.48 21.073 2.087 19.9.045 18.02zm5.165-4.763c.15 0 .318.06.504.183.186.122.253.272.2.45-.145.468-.193 1.1-.143 1.9.05.8.188 1.413.418 1.838.115.216.07.378-.137.485-.207.107-.4.068-.577-.118-.386-.405-.637-1-.753-1.784-.115-.783-.045-1.578.21-2.385.098-.294.208-.442.33-.442l-.053-.127zm.85 0c.078 0 .128.055.15.165.023.11.007.188-.047.234-.345.293-.568.693-.668 1.2-.1.506-.057.972.13 1.396.12.254.11.427-.03.52-.14.093-.295.065-.465-.082-.343-.298-.528-.748-.556-1.35-.027-.604.113-1.14.42-1.61.14-.214.3-.363.48-.447.112-.058.23-.098.353-.12.077-.013.16-.015.25-.015l-.017.11zm7.62-6.44c.272 0 .492.095.66.284.168.19.252.44.252.75 0 .27-.095.51-.285.72-.19.21-.46.316-.81.316-.273 0-.49-.096-.65-.286-.16-.19-.24-.44-.24-.75 0-.274.093-.515.28-.722.186-.208.458-.31.793-.31v-.002zm-5.683 0c.272 0 .49.095.658.284.168.19.25.44.25.75 0 .27-.094.51-.284.72-.19.21-.458.316-.81.316-.27 0-.487-.096-.65-.286-.16-.19-.24-.44-.24-.75 0-.274.093-.515.28-.722.186-.208.458-.31.796-.31v-.002z"/>
        </svg>
      );
    }
    if (posting.company === 'Palo Alto Networks') {
      return (
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="white">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      );
    }
    if (posting.company === 'Microsoft') {
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
          <path d="M0 0h11.5v11.5H0zM12.5 0H24v11.5H12.5zM0 12.5h11.5V24H0zM12.5 12.5H24V24H12.5z"/>
        </svg>
      );
    }
    if (posting.company === 'Netflix') {
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
          <path d="M5.398 0v.006c3.028 8.556 5.37 15.175 8.348 23.596 2.344.058 4.85.398 4.854.398-2.8-7.924-5.923-16.747-8.487-24zm8.489 0v9.63L18.6 22.951c-.043-7.86-.004-15.913.002-22.95zM5.398 1.05V24c1.873-.225 2.81-.312 4.715-.398v-9.22z"/>
        </svg>
      );
    }
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
    if (posting.company === 'Meta') {
      return (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white">
          <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.53-4.5-10.02-10-10.02z"/>
        </svg>
      );
    }
    if (posting.company === 'Uber') {
      return (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white">
          <path d="M0 7.97v4.958h4.79c-.31 2.022-2.083 3.468-4.79 3.468v2.542c3.312 0 6.259-1.988 7.25-4.844.137-.396.209-.812.227-1.24h2.354v-4.883H0v-.001zm17.58 0H13v7.79c0 1.157.938 2.095 2.096 2.095h2.482v-2.426h-2.094c-.173 0-.314-.14-.314-.313v-7.147H17.58v.001zm6.42 7.792c-1.322 0-2.327-1.182-2.327-2.598 0-1.416 1.005-2.598 2.327-2.598v-2.596c-2.75 0-4.978 2.327-4.978 5.194 0 2.867 2.227 5.193 4.978 5.193V15.762z"/>
        </svg>
      );
    }
    if (posting.company === 'NVIDIA') {
      return (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white">
          <path d="M8.948 8.798v-1.43a6.7 6.7 0 0 1 .424-.018c3.922-.124 6.493 3.374 6.493 3.374s-2.774 3.851-5.75 3.851c-.421 0-.82-.052-1.167-.157v-4.108c1.281.129 1.556.573 2.331 1.915l1.737-1.46s-1.628-2.11-4.068-1.967zM8.948 4.49v1.973l.424-.015c5.207-.168 8.627 4.315 8.627 4.315s-3.944 4.966-8.03 4.966c-.347 0-.687-.027-1.021-.08v1.543c.274.025.554.042.833.042 4.88 0 8.397-2.477 11.17-4.916-.445-.376-1.36-1.003-1.36-1.003s-2.997-3.07-7.34-3.526V5.73c3.88.314 6.895 3.36 6.895 3.36L22 6.76s-4.408-4.24-11.424-3.322c-.552.07-1.09.168-1.628.287v.764zm0 12.324v1.513c-3.718-.766-6.54-3.883-6.54-7.636 0-3.752 2.822-6.97 6.54-7.735v1.542c-2.923.704-5.1 3.234-5.1 6.193 0 2.96 2.177 5.489 5.1 6.123z"/>
        </svg>
      );
    }
    if (posting.company === 'Airbnb') {
      return (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white">
          <path d="M12.001 18.275c-1.353-1.697-2.148-3.184-2.413-4.457-.263-1.238-.094-2.219.503-2.907.4-.46.95-.706 1.59-.706h.638c.64 0 1.19.246 1.59.706.597.688.766 1.669.504 2.907-.266 1.273-1.06 2.76-2.412 4.457m4.537-10.639c-.89-1.02-2.063-1.542-3.404-1.544h-.268c-1.34.002-2.513.523-3.403 1.544-.8.916-1.16 2.055-1.043 3.305.124 1.347.71 2.895 1.742 4.597a25.633 25.633 0 0 0 2.41 3.305c.106.124.213.244.322.363.075.081.15.162.227.24a.643.643 0 0 0 .888 0c.077-.078.152-.159.227-.24.109-.12.216-.239.322-.363a25.633 25.633 0 0 0 2.41-3.305c1.031-1.702 1.618-3.25 1.742-4.597.117-1.25-.244-2.389-1.042-3.305"/>
        </svg>
      );
    }
    if (posting.company === 'Stripe') {
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
          <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/>
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
