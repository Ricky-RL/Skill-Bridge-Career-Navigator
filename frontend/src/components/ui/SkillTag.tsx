import { clsx } from 'clsx';

interface SkillTagProps {
  skill: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  onRemove?: () => void;
  className?: string;
}

export default function SkillTag({
  skill,
  variant = 'default',
  size = 'md',
  onRemove,
  className,
}: SkillTagProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {skill}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-black/10 transition-colors"
          aria-label={`Remove ${skill}`}
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </span>
  );
}
