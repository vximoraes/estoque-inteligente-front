import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  subtitle,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 gap-4 ${className}`}
      data-test="empty-state"
    >
      <Icon className="w-8 h-8 text-muted-foreground" />
      <div className="text-center">
        <p className="text-base font-semibold text-foreground mb-1">{title}</p>
        {subtitle && (
          <p className="text-sm text-muted-foreground max-w-[32ch]">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
