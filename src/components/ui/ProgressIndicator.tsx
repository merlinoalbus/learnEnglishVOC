import React from 'react';

interface ProgressIndicatorProps {
  current: number;
  total: number;
  variant?: 'default' | 'timer' | 'accuracy' | 'circular';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showRemaining?: boolean;
  showPercentage?: boolean;
  animated?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'error';
  label?: string;
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  current,
  total,
  variant = 'default',
  size = 'md',
  showLabel = true,
  showRemaining = false,
  showPercentage = true,
  animated = true,
  color = 'primary',
  label,
  className = ''
}) => {
  const percentage = total > 0 ? Math.min(100, Math.max(0, (current / total) * 100)) : 0;
  const remaining = Math.max(0, total - current);
  
  // Size classes
  const sizeClasses = {
    sm: {
      height: 'h-2',
      text: 'text-xs',
      circular: 'w-12 h-12'
    },
    md: {
      height: 'h-3',
      text: 'text-sm',
      circular: 'w-16 h-16'
    },
    lg: {
      height: 'h-4',
      text: 'text-base',
      circular: 'w-20 h-20'
    }
  };
  
  // Color classes
  const colorClasses = {
    primary: 'progress-fill',
    success: 'progress-success',
    warning: 'progress-warning',
    error: 'progress-error'
  };
  
  const currentSize = sizeClasses[size];
  const currentColor = colorClasses[color];
  
  // Timer variant with warning colors
  const getTimerColor = () => {
    if (percentage >= 80) return 'progress-error';
    if (percentage >= 60) return 'progress-warning';
    return 'progress-fill';
  };
  
  // Accuracy variant with success colors
  const getAccuracyColor = () => {
    if (percentage >= 90) return 'progress-success';
    if (percentage >= 70) return 'progress-fill';
    if (percentage >= 50) return 'progress-warning';
    return 'progress-error';
  };
  
  const fillColorClass = variant === 'timer' ? getTimerColor() : 
                        variant === 'accuracy' ? getAccuracyColor() : 
                        currentColor;
  
  if (variant === 'circular') {
    const radius = size === 'sm' ? 20 : size === 'md' ? 28 : 36;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    
    return (
      <div className={`relative ${currentSize.circular} ${className}`}>
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`${fillColorClass} ${animated ? 'transition-all duration-500 ease-out' : ''}`}
            style={{
              filter: 'drop-shadow(0 0 4px rgba(var(--tw-color-current), 0.3))'
            }}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex-center-col">
          <div className={`${currentSize.text} font-bold text-gray-800 dark:text-gray-200`}>
            {showPercentage ? `${Math.round(percentage)}%` : `${current}/${total}`}
          </div>
          {label && (
            <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
              {label}
            </div>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className={`${className}`}>
      {/* Label and stats */}
      {(showLabel || showRemaining || showPercentage) && (
        <div className="flex items-center justify-between mb-2">
          <div className={`${currentSize.text} text-gray-700 dark:text-gray-300`}>
            {label || `${current} / ${total}`}
          </div>
          
          <div className="flex items-center gap-2">
            {showPercentage && (
              <span className={`${currentSize.text} font-semibold text-gray-800 dark:text-gray-200`}>
                {Math.round(percentage)}%
              </span>
            )}
            {showRemaining && (
              <span className={`${currentSize.text} text-gray-600 dark:text-gray-400`}>
                ({remaining} remaining)
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Progress bar */}
      <div className={`progress-bar ${currentSize.height}`}>
        <div
          className={`${fillColorClass} ${animated ? 'transition-all duration-300 ease-out' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {/* Additional info for timer variant */}
      {variant === 'timer' && percentage >= 60 && (
        <div className={`${currentSize.text} text-center mt-1 ${
          percentage >= 80 ? 'text-red-600 dark:text-red-400 animate-pulse' : 
          'text-yellow-600 dark:text-yellow-400'
        }`}>
          {percentage >= 80 ? 'Time almost up!' : 'Hurry up!'}
        </div>
      )}
    </div>
  );
};

export default ProgressIndicator;