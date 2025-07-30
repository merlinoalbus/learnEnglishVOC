// =====================================================
// 📁 src/components/LoadingComponents.tsx - TypeScript Migration
// =====================================================

import React from 'react';
import { Loader2, Brain, Database, Wifi, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';

// =====================================================
// 🔧 TYPES & INTERFACES
// =====================================================

interface SmartLoadingIndicatorProps {
  isLoading: boolean;
  operation?: string;
  duration?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showDuration?: boolean;
  customIcon?: React.ElementType;
  customMessage?: string;
}

interface ProgressLoaderProps {
  isLoading: boolean;
  progress?: number;
  operation?: string;
  estimatedTime?: number;
  onCancel?: () => void;
}

interface ErrorWithRetryProps {
  error: Error | null;
  onRetry?: () => void;
  canRetry?: boolean;
  retryCount?: number;
  maxRetries?: number;
  isRetrying?: boolean;
}

interface WordFormSkeletonProps {
  // No props needed for this component
}

interface WordListSkeletonProps {
  count?: number;
}

interface StatsSkeletonProps {
  // No props needed for this component
}

interface ChartSkeletonProps {
  // No props needed for this component
}

interface InlineLoaderProps {
  size?: 'sm' | 'md';
  text?: string;
}

interface ButtonLoaderProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean;
  children: React.ReactNode;
}

interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
}

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
  blur?: boolean;
}

interface LoadingStateManagerProps {
  isLoading: boolean;
  error?: Error | null;
  onRetry?: () => void;
  retryCount?: number;
  maxRetries?: number;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  children: React.ReactNode;
}

// =====================================================
// ⭐ SMART LOADING INDICATOR
// =====================================================

export const SmartLoadingIndicator: React.FC<SmartLoadingIndicatorProps> = ({ 
  isLoading, 
  operation, 
  duration, 
  size = 'md',
  showDuration = true,
  customIcon = null,
  customMessage = null 
}) => {
  if (!isLoading) return null;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const getOperationIcon = (): React.ElementType => {
    if (customIcon) return customIcon;
    
    if (operation?.toLowerCase().includes('ai')) return Brain;
    if (operation?.toLowerCase().includes('storage') || operation?.toLowerCase().includes('save')) return Database;
    if (operation?.toLowerCase().includes('network') || operation?.toLowerCase().includes('fetch')) return Wifi;
    return Loader2;
  };

  const Icon = getOperationIcon();
  const message = customMessage || operation || 'Caricamento...';

  return (
    <div className="flex items-center gap-3 text-blue-600">
      <Icon className={`${sizeClasses[size]} animate-spin`} />
      <div className="flex flex-col">
        <span className="text-sm font-medium">{message}</span>
        {showDuration && duration && duration > 2000 && (
          <span className="text-xs text-gray-500">
            {Math.round(duration / 1000)}s
          </span>
        )}
      </div>
    </div>
  );
};

// =====================================================
// 🔄 PROGRESS LOADER
// =====================================================

export const ProgressLoader: React.FC<ProgressLoaderProps> = ({ 
  isLoading, 
  progress, 
  operation, 
  estimatedTime,
  onCancel 
}) => {
  if (!isLoading) return null;

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="font-medium text-blue-800">{operation}</span>
            </div>
            {onCancel && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onCancel}
                className="text-blue-600 hover:bg-blue-100"
              >
                Annulla
              </Button>
            )}
          </div>
          
          {progress !== undefined && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-blue-600">
                <span>{Math.round(progress)}%</span>
                {estimatedTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {estimatedTime}s
                  </span>
                )}
              </div>
              {/* Custom progress bar without Progress component */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// =====================================================
// ❌ ERROR WITH RETRY COMPONENT
// =====================================================

export const ErrorWithRetry: React.FC<ErrorWithRetryProps> = ({ 
  error, 
  onRetry, 
  canRetry = true, 
  retryCount = 0, 
  maxRetries = 3,
  isRetrying = false 
}) => {
  if (!error) return null;

  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-red-800 font-medium">
                {error.message || 'Si è verificato un errore'}
              </p>
              {retryCount > 0 && (
                <p className="text-red-600 text-sm">
                  Tentativo {retryCount}/{maxRetries}
                </p>
              )}
            </div>
            
            {canRetry && onRetry && (
              <Button
                onClick={onRetry}
                disabled={isRetrying}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                {isRetrying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Riprovando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Riprova
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// =====================================================
// 💀 SKELETON LOADING COMPONENTS
// =====================================================

export const WordFormSkeleton: React.FC<WordFormSkeletonProps> = () => (
  <Card className="animate-pulse">
    <CardContent className="p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="h-12 bg-gray-200 rounded-xl"></div>
        <div className="h-12 bg-gray-200 rounded-xl"></div>
      </div>
      <div className="h-14 bg-gray-200 rounded-xl"></div>
      <div className="space-y-2">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="h-32 bg-gray-200 rounded-xl"></div>
      </div>
    </CardContent>
  </Card>
);

export const WordListSkeleton: React.FC<WordListSkeletonProps> = ({ count = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }, (_, i) => (
      <Card key={i} className="animate-pulse">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export const StatsSkeleton: React.FC<StatsSkeletonProps> = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {Array.from({ length: 6 }, (_, i) => (
      <Card key={i} className="animate-pulse">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export const ChartSkeleton: React.FC<ChartSkeletonProps> = () => (
  <Card className="animate-pulse">
    <CardContent className="p-6">
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="h-64 bg-gray-200 rounded-xl"></div>
        <div className="flex justify-between">
          <div className="h-4 bg-gray-200 rounded w-16"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// =====================================================
// 🔌 INLINE LOADING STATES
// =====================================================

export const InlineLoader: React.FC<InlineLoaderProps> = ({ size = 'sm', text = 'Caricamento...' }) => (
  <div className="flex items-center gap-2 text-gray-600">
    <Loader2 className={`animate-spin ${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'}`} />
    <span className={`${size === 'sm' ? 'text-sm' : 'text-base'}`}>{text}</span>
  </div>
);

export const ButtonLoader: React.FC<ButtonLoaderProps> = ({ isLoading, children, ...props }) => (
  <Button {...props} disabled={isLoading || props.disabled}>
    {isLoading ? (
      <>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Caricamento...
      </>
    ) : children}
  </Button>
);

// =====================================================
// 📱 COMPACT LOADING STATES
// =====================================================

export const LoadingDots: React.FC<LoadingDotsProps> = ({ size = 'md' }) => {
  const dotSize = size === 'sm' ? 'w-1 h-1' : size === 'lg' ? 'w-3 h-3' : 'w-2 h-2';
  
  return (
    <div className="flex space-x-1">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={`${dotSize} bg-blue-600 rounded-full animate-pulse`}
          style={{
            animationDelay: `${index * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  );
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', color = 'text-blue-600' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return <Loader2 className={`animate-spin ${sizeClasses[size]} ${color}`} />;
};

// =====================================================
// 🎯 LOADING OVERLAY
// =====================================================

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  isLoading, 
  message = 'Caricamento in corso...', 
  children,
  blur = true 
}) => {
  if (!isLoading) return <>{children}</>;

  return (
    <div className="relative">
      <div className={`${blur ? 'filter blur-sm' : 'opacity-50'} pointer-events-none`}>
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl shadow-lg border">
          <LoadingSpinner size="lg" />
          <p className="text-gray-700 font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// 📋 LOADING STATE MANAGER
// =====================================================

export const LoadingStateManager: React.FC<LoadingStateManagerProps> = ({ 
  isLoading, 
  error, 
  onRetry, 
  retryCount = 0, 
  maxRetries = 3,
  loadingComponent,
  errorComponent,
  children 
}) => {
  if (error) {
    return (
      <>
        {errorComponent || (
          <ErrorWithRetry
            error={error}
            onRetry={onRetry}
            canRetry={retryCount < maxRetries}
            retryCount={retryCount}
            maxRetries={maxRetries}
          />
        )}
      </>
    );
  }

  if (isLoading) {
    return <>{loadingComponent || <InlineLoader />}</>;
  }

  return <>{children}</>;
};