import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  subtitle?: string;
  value: number;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  'data-test'?: string;
  hoverTitle?: string;
}

export default function StatCard({
  title,
  subtitle,
  value,
  icon: Icon,
  iconColor,
  /* iconBgColor kept for API compatibility */
  iconBgColor: _iconBgColor,
  'data-test': dataTest,
  hoverTitle,
}: StatCardProps) {
  const cardTitle =
    hoverTitle || `${title}${subtitle ? ` ${subtitle}` : ''}: ${value}`;

  return (
    <div
      className="bg-card rounded-lg px-5 py-4 border border-border w-full h-full min-h-[100px] flex flex-col justify-between gap-3"
      data-test={dataTest}
      title={cardTitle}
    >
      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ei-stat-title leading-none">
        {title}
        {subtitle ? ` ${subtitle}` : ''}
      </p>
      <div className="flex items-end justify-between">
        <span
          className="text-[2.4rem] font-extrabold leading-none tracking-tight tabular-nums text-ei-stat-value"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          {value}
        </span>
        <Icon className={`w-5 h-5 mb-0.5 ${iconColor} opacity-55`} />
      </div>
    </div>
  );
}
