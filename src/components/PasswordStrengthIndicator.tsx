import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
}

type StrengthLevel = 'weak' | 'medium' | 'strong';

interface StrengthResult {
  level: StrengthLevel;
  score: number;
  label: string;
}

function calculateStrength(password: string): StrengthResult {
  let score = 0;

  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 2) {
    return { level: 'weak', score, label: 'Weak' };
  } else if (score <= 3) {
    return { level: 'medium', score, label: 'Medium' };
  } else {
    return { level: 'strong', score, label: 'Strong' };
  }
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => calculateStrength(password), [password]);

  if (!password) return null;

  const barColors: Record<StrengthLevel, string> = {
    weak: 'bg-destructive',
    medium: 'bg-yellow-500',
    strong: 'bg-green-500',
  };

  const labelColors: Record<StrengthLevel, string> = {
    weak: 'text-destructive',
    medium: 'text-yellow-600 dark:text-yellow-400',
    strong: 'text-green-600 dark:text-green-400',
  };

  const filledBars = strength.level === 'weak' ? 1 : strength.level === 'medium' ? 2 : 3;

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3].map((bar) => (
          <div
            key={bar}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors',
              bar <= filledBars ? barColors[strength.level] : 'bg-muted'
            )}
          />
        ))}
      </div>
      <p className={cn('text-xs', labelColors[strength.level])}>
        {strength.label}
      </p>
    </div>
  );
}
