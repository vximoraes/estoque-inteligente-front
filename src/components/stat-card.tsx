import React from 'react';

interface StatCardProps {
  title: string;
  subtitle?: string;
  value: number | string;
  valueColor?: string;
  'data-test'?: string;
  hoverTitle?: string;
}

export default function StatCard({
  title,
  subtitle,
  value,
  valueColor,
  'data-test': dataTest,
  hoverTitle,
}: StatCardProps) {
  const cardTitle =
    hoverTitle || `${title}${subtitle ? ` ${subtitle}` : ''}: ${value}`;

  return (
    <div
      className="flex flex-col gap-1 sm:gap-1.5 px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-5 bg-card border border-border rounded-sm flex-1 min-w-0"
      data-test={dataTest}
      title={cardTitle}
    >
      <span
        className="text-lg sm:text-xl lg:text-[2rem] font-extrabold leading-none tracking-tight tabular-nums text-ei-stat-value truncate"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </span>
      <p className="text-[9px] sm:text-[10px] lg:text-[11px] font-semibold uppercase tracking-[0.12em] text-ei-stat-title leading-none truncate">
        {title}
        {subtitle ? ` ${subtitle}` : ''}
      </p>
    </div>
  );
}
