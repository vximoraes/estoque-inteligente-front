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
      className="flex flex-col gap-1.5 px-6 py-5 bg-card border border-border rounded-sm flex-1 min-w-[120px]"
      data-test={dataTest}
      title={cardTitle}
    >
      <span
        className="text-[2rem] font-extrabold leading-none tracking-tight tabular-nums text-ei-stat-value"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </span>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ei-stat-title leading-none">
        {title}
        {subtitle ? ` ${subtitle}` : ''}
      </p>
    </div>
  );
}
