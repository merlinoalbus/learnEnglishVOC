// =====================================================
// 📁 src/utils/textUtils.ts - Type-Safe Text Formatting Utilities
// =====================================================

import React from 'react';
import type { TestStats } from '../types/global';

/**
 * Keywords for formatting notes with proper highlighting
 */
const FORMATTING_KEYWORDS = [
  'Altri Significati', 'Altre Traduzioni', 'Espressioni', 'Verbo Irregolare', 
  'Pronuncia', 'Sinonimi', 'Esempi', 'Attenzione', 'Nota', 'Importante',
  'Plurale irregolare', 'Tecnologia', 'Posizione', 'Contrario', 'Espressione',
  'Verbo', 'Phrasal verbs', 'Differenza', 'Abbreviazione', 'Sinonimo',
  'Tipico britannico', 'Vestiti', 'Preposizioni', 'Avverbio', 'Sostantivo',
  'Aggettivo', 'Congiunzione', 'Interiezione', 'Participio', 'Gerundio',
  'Passato', 'Presente', 'Futuro', 'Condizionale', 'Imperativo', 'Infinito',
  'Formale', 'Informale', 'Slang', 'Americano', 'Britannico', 'Australiano',
  'Tempo', 'Luogo', 'Modo', 'Causa', 'Effetto', 'Scopo', 'Confronto',
  'Origine', 'Destinazione', 'Materiale', 'Colore', 'Forma', 'Dimensione',
  'Quantità', 'Frequenza', 'Durata', 'Velocità', 'Temperatura', 'Peso',
  'Struttura', 'Espressione fissa', 'Figurativo', 'Specificità', 'Pattern',
  'Più specifico di'
] as const;

/**
 * Test result types for type safety
 */
export type TestResultType = 'victory' | 'good' | 'defeat';

/**
 * Test result information
 */
export interface TestResultInfo {
  type: TestResultType;
  message: string;
  color: string;
  bgColor: string;
}

/**
 * Formatted note part - can be a React element or string
 */
export type FormattedNotePart = React.ReactElement | string;

/**
 * Format notes with keyword highlighting and proper structure
 * @param notes - Raw notes string to format
 * @returns Array of React elements and strings representing formatted notes
 */
export const formatNotes = (notes?: string | null): FormattedNotePart[] | null => {
  if (!notes || typeof notes !== 'string') return null;
  
  let formattedText = notes;
  
  // Format predefined keywords with bold styling
  FORMATTING_KEYWORDS.forEach(keyword => {
    const regex = new RegExp(`(${keyword})\\s*:`, 'gi');
    formattedText = formattedText.replace(regex, `**$1:**`);
  });
  
  // Format any other patterns that look like labels (word followed by colon)
  formattedText = formattedText.replace(/^([A-Za-z\s]+):/gm, '**$1:**');
  
  // Split text into parts for React rendering
  const parts = formattedText.split(/(\*\*[^*]+\*\*)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2);
      return React.createElement('span', { 
        key: `bold-${index}`, 
        className: 'font-bold' 
      }, boldText);
    }
    return part;
  });
};

/**
 * Get test result information based on statistics with type safety
 * @param stats - Test statistics object
 * @returns Test result information object
 */
export const getTestResult = (stats: TestStats): TestResultInfo => {
  const total = stats.correct + stats.incorrect;
  const percentage = total > 0 ? Math.round((stats.correct / total) * 100) : 0;
  
  if (percentage >= 80) {
    return { 
      type: 'victory', 
      message: 'Eccellente! 🏆', 
      color: 'text-green-600', 
      bgColor: 'bg-green-50' 
    };
  } else if (percentage >= 60) {
    return { 
      type: 'good', 
      message: 'Buon lavoro! 👍', 
      color: 'text-blue-600', 
      bgColor: 'bg-blue-50' 
    };
  } else {
    return { 
      type: 'defeat', 
      message: 'Continua a studiare! 📚', 
      color: 'text-red-600', 
      bgColor: 'bg-red-50' 
    };
  }
};

/**
 * Sanitize and validate text input
 * @param input - Input string to sanitize
 * @param maxLength - Maximum allowed length
 * @returns Sanitized string
 */
export const sanitizeText = (input?: string | null, maxLength = 1000): string => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/\s+/g, ' '); // Replace multiple spaces with single space
};

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @param suffix - Suffix to add when truncated
 * @returns Truncated text
 */
export const truncateText = (
  text: string, 
  maxLength: number, 
  suffix = '...'
): string => {
  if (!text || text.length <= maxLength) return text;
  
  return text.slice(0, maxLength - suffix.length) + suffix;
};

/**
 * Capitalize first letter of each word
 * @param text - Text to capitalize
 * @returns Capitalized text
 */
export const capitalizeWords = (text?: string | null): string => {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Capitalize only the first letter of the text
 * @param text - Text to capitalize
 * @returns Text with first letter capitalized
 */
export const capitalizeFirst = (text?: string | null): string => {
  if (!text || typeof text !== 'string') return '';
  
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Clean text for comparison (remove accents, normalize case)
 * @param text - Text to clean
 * @returns Cleaned text for comparison
 */
export const cleanForComparison = (text?: string | null): string => {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, '') // Keep only alphanumeric and spaces
    .replace(/\s+/g, ' '); // Normalize spaces
};

/**
 * Check if two texts are similar (fuzzy matching)
 * @param text1 - First text
 * @param text2 - Second text
 * @param threshold - Similarity threshold (0-1)
 * @returns True if texts are similar
 */
export const areTextsSimilar = (
  text1?: string | null, 
  text2?: string | null, 
  threshold = 0.8
): boolean => {
  if (!text1 || !text2) return false;
  
  const clean1 = cleanForComparison(text1);
  const clean2 = cleanForComparison(text2);
  
  if (clean1 === clean2) return true;
  
  // Simple Levenshtein distance calculation
  const distance = levenshteinDistance(clean1, clean2);
  const maxLength = Math.max(clean1.length, clean2.length);
  const similarity = maxLength > 0 ? 1 - (distance / maxLength) : 0;
  
  return similarity >= threshold;
};

/**
 * Calculate Levenshtein distance between two strings
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Edit distance between strings
 */
export const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

/**
 * Extract keywords from text
 * @param text - Text to extract keywords from
 * @param minLength - Minimum keyword length
 * @returns Array of keywords
 */
export const extractKeywords = (text?: string | null, minLength = 3): string[] => {
  if (!text || typeof text !== 'string') return [];
  
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length >= minLength);
  
  // Remove duplicates and return
  return [...new Set(words)];
};

/**
 * Highlight search terms in text
 * @param text - Text to highlight in
 * @param searchTerm - Term to highlight
 * @param className - CSS class for highlighting
 * @returns Array of React elements with highlighted terms
 */
export const highlightSearchTerm = (
  text: string, 
  searchTerm: string, 
  className = 'bg-yellow-200'
): FormattedNotePart[] => {
  if (!searchTerm.trim()) return [text];
  
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, index) => {
    if (part.toLowerCase() === searchTerm.toLowerCase()) {
      return React.createElement('mark', { 
        key: `highlight-${index}`, 
        className 
      }, part);
    }
    return part;
  });
};

/**
 * Format time duration in a human-readable way
 * @param seconds - Duration in seconds
 * @returns Formatted time string
 */
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
};

/**
 * Format percentage with proper rounding
 * @param value - Decimal value (0-1)
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, decimals = 0): string => {
  const percentage = Math.round(value * 100 * Math.pow(10, decimals)) / Math.pow(10, decimals);
  return `${percentage}%`;
};

/**
 * Generate a slug from text (URL-friendly)
 * @param text - Text to convert to slug
 * @returns URL-friendly slug
 */
export const generateSlug = (text?: string | null): string => {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Keep only alphanumeric, spaces, and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Validate if text contains only allowed characters for English words
 * @param text - Text to validate
 * @returns True if text is valid English word format
 */
export const isValidEnglishWord = (text?: string | null): boolean => {
  if (!text || typeof text !== 'string') return false;
  
  // Allow letters, spaces, apostrophes, and hyphens
  const englishWordRegex = /^[a-zA-Z\s'-]+$/;
  return englishWordRegex.test(text.trim());
};

/**
 * Validate if text contains valid Italian characters
 * @param text - Text to validate
 * @returns True if text is valid Italian format
 */
export const isValidItalianText = (text?: string | null): boolean => {
  if (!text || typeof text !== 'string') return false;
  
  // Allow letters (including accented), spaces, apostrophes, and hyphens
  const italianTextRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
  return italianTextRegex.test(text.trim());
};