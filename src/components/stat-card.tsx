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
  iconBgColor,
  'data-test': dataTest,
  hoverTitle,
}: StatCardProps) {
  const cardTitle =
    hoverTitle || `${title}${subtitle ? ` ${subtitle}` : ''}: ${value}`;

  return (
    <div
      className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 w-full h-full min-h-[120px] flex items-center"
      data-test={dataTest}
      title={cardTitle}
    >
      <div className="flex items-center w-full">
        <div className={`p-2 ${iconBgColor} rounded-lg flex-shrink-0`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          {subtitle && (
            <p className="text-sm font-medium text-gray-600">{subtitle}</p>
          )}
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
