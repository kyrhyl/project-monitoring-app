'use client';

import { ReactNode } from 'react';

interface ModernCardProps {
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export function ModernCard({ children, className = '', padding = 'md', hover = true }: ModernCardProps) {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <div className={`
      bg-white/95 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-sm
      ${hover ? 'hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-1' : ''}
      transition-all duration-300 ${paddingClasses[padding]} ${className}
    `}>
      {children}
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: 'chocolate' | 'emerald' | 'gray' | 'black';
}

export function StatsCard({ title, value, icon, trend, color = 'chocolate' }: StatsCardProps) {
  const colorClasses = {
    chocolate: {
      bg: 'from-amber-900 to-yellow-900',
      text: 'text-amber-900',
      lightBg: 'bg-amber-50'
    },
    emerald: {
      bg: 'from-emerald-600 to-green-600',
      text: 'text-emerald-600',
      lightBg: 'bg-emerald-50'
    },
    gray: {
      bg: 'from-gray-600 to-gray-700',
      text: 'text-gray-600',
      lightBg: 'bg-gray-50'
    },
    black: {
      bg: 'from-gray-900 to-black',
      text: 'text-gray-900',
      lightBg: 'bg-gray-50'
    }
  };

  const colors = colorClasses[color];

  return (
    <ModernCard className="relative overflow-hidden group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <div className="flex items-baseline">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {trend && (
              <span className={`ml-2 text-sm font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.isPositive ? '↗' : '↘'} {trend.value}
              </span>
            )}
          </div>
        </div>
        <div className={`
          w-12 h-12 bg-gradient-to-r ${colors.bg} rounded-xl flex items-center justify-center
          shadow-lg transform group-hover:scale-110 transition-transform duration-200
        `}>
          <div className="text-white">
            {icon}
          </div>
        </div>
      </div>
      
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-50/50 to-transparent rounded-full transform translate-x-16 -translate-y-16"></div>
    </ModernCard>
  );
}

interface ActionButtonProps {
  onClick: () => void;
  icon: ReactNode;
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md';
  disabled?: boolean;
}

export function ActionButton({ 
  onClick, 
  icon, 
  label, 
  variant = 'primary', 
  size = 'md',
  disabled = false 
}: ActionButtonProps) {
  const variantClasses = {
    primary: 'bg-gradient-to-r from-amber-900 to-yellow-900 hover:from-black hover:to-gray-800 text-white shadow-lg',
    secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm',
    danger: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg'
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center font-medium rounded-xl transition-all duration-200
        transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-3 focus:ring-amber-900/20
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        ${variantClasses[variant]} ${sizeClasses[size]}
      `}
    >
      <span className="mr-2">{icon}</span>
      {label}
    </button>
  );
}