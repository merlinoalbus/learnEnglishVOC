import React from 'react';

interface StatDisplayProps {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'card' | 'inline';
  showChange?: boolean;
  changeValue?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
}

export const StatDisplay: React.FC<StatDisplayProps> = ({
  value,
  label,
  icon,
  color = 'neutral',
  size = 'md',
  variant = 'default',
  showChange = false,
  changeValue,
  changeType = 'neutral'
}) => {
  // Size classes
  const sizeClasses = {
    sm: {
      value: 'text-lg font-semibold',
      label: 'text-xs',
      container: 'p-3'
    },
    md: {
      value: 'text-2xl font-bold',
      label: 'text-sm',
      container: 'p-4'
    },
    lg: {
      value: 'text-3xl font-bold',
      label: 'text-base',
      container: 'p-6'
    }
  };
  
  // Color classes
  const colorClasses = {
    primary: 'text-purple-600 dark:text-purple-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    error: 'text-red-600 dark:text-red-400',
    info: 'text-blue-600 dark:text-blue-400',
    neutral: 'text-gray-800 dark:text-gray-200'
  };
  
  // Change indicator classes
  const changeClasses = {
    increase: 'text-green-600 dark:text-green-400',
    decrease: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-600 dark:text-gray-400'
  };
  
  // Variant classes
  const variantClasses = {
    default: 'text-center',
    card: 'card-glass text-center interactive-scale',
    inline: 'flex items-center gap-2'
  };
  
  const currentSize = sizeClasses[size];
  const currentColor = colorClasses[color];
  const currentVariant = variantClasses[variant];
  
  if (variant === 'inline') {
    return (
      <div className={`${currentVariant} ${currentSize.container}`}>
        {icon && (
          <div className={`${currentColor} ${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'}`}>
            {icon}
          </div>
        )}
        <div>
          <span className={`${currentSize.value} ${currentColor}`}>
            {value}
          </span>
          <span className={`${currentSize.label} text-gray-600 dark:text-gray-400 ml-2`}>
            {label}
          </span>
        </div>
        {showChange && changeValue !== undefined && (
          <div className={`${currentSize.label} ${changeClasses[changeType]} ml-2`}>
            {changeType === 'increase' ? '+' : changeType === 'decrease' ? '-' : ''}
            {Math.abs(changeValue)}
            {changeType === 'increase' ? '↗' : changeType === 'decrease' ? '↘' : '→'}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className={`${currentVariant} ${currentSize.container}`}>
      {icon && (
        <div className={`${currentColor} ${size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-8 h-8' : 'w-10 h-10'} mx-auto mb-2`}>
          {icon}
        </div>
      )}
      
      <div className={`${currentSize.value} ${currentColor}`}>
        {value}
      </div>
      
      <div className={`${currentSize.label} text-gray-600 dark:text-gray-400 mt-1`}>
        {label}
      </div>
      
      {showChange && changeValue !== undefined && (
        <div className={`${currentSize.label} ${changeClasses[changeType]} mt-1 flex items-center justify-center gap-1`}>
          <span>
            {changeType === 'increase' ? '+' : changeType === 'decrease' ? '-' : ''}
            {Math.abs(changeValue)}
          </span>
          <span className="text-xs">
            {changeType === 'increase' ? '↗' : changeType === 'decrease' ? '↘' : '→'}
          </span>
        </div>
      )}
    </div>
  );
};

export default StatDisplay;