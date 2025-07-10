// =====================================================
// 📁 src/types/components.ts - Component Type Definitions
// =====================================================

import React from 'react';
import { Word, WordInput } from './global';

// ===== BASIC COMPONENT PROPS =====

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// ===== UI COMPONENT PROPS =====

export interface CardProps extends BaseComponentProps {
  // Card inherits from BaseComponentProps
}

export interface CardHeaderProps extends BaseComponentProps {
  // CardHeader inherits from BaseComponentProps
}

export interface CardTitleProps extends BaseComponentProps {
  // CardTitle inherits from BaseComponentProps
}

export interface CardDescriptionProps extends BaseComponentProps {
  // CardDescription inherits from BaseComponentProps
}

export interface CardContentProps extends BaseComponentProps {
  // CardContent inherits from BaseComponentProps
}

export interface CardFooterProps extends BaseComponentProps {
  // CardFooter inherits from BaseComponentProps
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg';
  disabled?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
}

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> {
  className?: string;
}

export interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  className?: string;
}

// ===== FORM COMPONENT PROPS =====

export interface EnhancedAddWordFormProps {
  onAddWord: (wordData: WordInput) => Promise<void>;
  editingWord: Word | null;
  onClearForm: () => void;
}

export interface FormValidation {
  [key: string]: string;
}

// ===== TEST COMPONENT PROPS =====

export interface TestCardProps {
  word: Word;
  showMeaning: boolean;
  onFlip: () => void;
  showHint: boolean;
  hintUsed: boolean;
}

// ===== LOADING COMPONENT PROPS =====

export interface SmartLoadingIndicatorProps {
  isLoading: boolean;
  operation?: string;
  duration?: number;
  customIcon?: React.ComponentType<any>;
}

export interface ErrorWithRetryProps {
  error: Error;
  onRetry: () => void;
  canRetry: boolean;
  retryCount: number;
  maxRetries: number;
  isRetrying: boolean;
}

// ===== ERROR BOUNDARY PROPS =====

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export interface AIServiceErrorBoundaryProps {
  children: React.ReactNode;
  onAIError: (error: Error) => void;
}

export interface FormErrorBoundaryProps {
  children: React.ReactNode;
  formName: string;
  onFormError: (error: Error) => void;
}

// ===== CONTEXT COMPONENT PROPS =====

export interface AppProviderProps {
  children: React.ReactNode;
}

export interface NotificationProviderProps {
  children: React.ReactNode;
}

// ===== HIGHER-ORDER COMPONENT TYPES =====

export type WithLoadingProps<T = {}> = T & {
  isLoading: boolean;
  error?: Error | null;
};

export type WithNotificationProps<T = {}> = T & {
  showNotification: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  showError: (error: Error, context?: string) => void;
  showSuccess: (message: string) => void;
  showWarning: (message: string) => void;
};

// ===== COMPONENT STATE TYPES =====

export interface FormState {
  english: string;
  italian: string;
  group: string;
  sentence: string;
  notes: string;
  chapter: string;
  learned: boolean;
  difficult: boolean;
}

export interface TestCardState {
  isFlipped: boolean;
  showHint: boolean;
  hintUsed: boolean;
}

// ===== EVENT HANDLER TYPES =====

export type InputChangeHandler = (field: keyof FormState, value: string | boolean) => void;
export type ButtonClickHandler = (event: React.MouseEvent<HTMLButtonElement>) => void;
export type FormSubmitHandler = (event: React.FormEvent<HTMLFormElement>) => void;

// ===== RENDER PROPS TYPES =====

export interface RenderLoadingProps {
  isLoading: boolean;
  error: Error | null;
  retry: () => void;
}

export type RenderLoadingComponent = (props: RenderLoadingProps) => React.ReactNode;

// ===== COMPONENT REFS =====

export type ButtonRef = React.Ref<HTMLButtonElement>;
export type InputRef = React.Ref<HTMLInputElement>;
export type TextareaRef = React.Ref<HTMLTextAreaElement>;
export type DivRef = React.Ref<HTMLDivElement>;

// ===== STYLE TYPES =====

export interface StyleClasses {
  container?: string;
  header?: string;
  content?: string;
  footer?: string;
  button?: string;
  input?: string;
  error?: string;
  success?: string;
  warning?: string;
}

// ===== ANIMATION TYPES =====

export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
}

export interface TransitionProps {
  show: boolean;
  enter?: string;
  enterFrom?: string;
  enterTo?: string;
  leave?: string;
  leaveFrom?: string;
  leaveTo?: string;
}