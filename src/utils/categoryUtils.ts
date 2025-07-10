// =====================================================
// 📁 src/utils/categoryUtils.ts - Type-Safe Category Utilities
// =====================================================

import { CATEGORY_STYLES, CATEGORIES, isValidCategory } from '../constants/appConstants';
import type { WordCategory, CategoryStyle } from '../types/global';

/**
 * Get the style configuration for a word category with full type safety
 * @param group - The category group name (can be undefined/null)
 * @returns CategoryStyle object with color, icon, bgColor, and bgGradient
 */
export const getCategoryStyle = (group?: string | null): CategoryStyle => {
  // Handle undefined, null, or empty string
  if (!group) {
    return CATEGORY_STYLES['DEFAULT'];
  }
  
  // Normalize the group name
  const upperGroup = group.toUpperCase().trim();
  
  // Type-safe check using type guard
  if (isValidCategory(upperGroup)) {
    return CATEGORY_STYLES[upperGroup];
  }
  
  // Fallback to default style
  return CATEGORY_STYLES['DEFAULT'];
};

/**
 * Get all predefined groups as a sorted array with type safety
 * @returns Array of valid WordCategory values
 */
export const getPredefinedGroups = (): readonly WordCategory[] => {
  return [...CATEGORIES].sort() as readonly WordCategory[];
};

/**
 * Get category style by exact match (case-sensitive)
 * @param category - The exact category name
 * @returns CategoryStyle or undefined if not found
 */
export const getCategoryStyleExact = (category: WordCategory): CategoryStyle => {
  return CATEGORY_STYLES[category];
};

/**
 * Check if a category has a custom style defined
 * @param group - The category group name
 * @returns True if the category has a custom style
 */
export const hasCustomStyle = (group?: string | null): boolean => {
  if (!group) return false;
  
  const upperGroup = group.toUpperCase().trim();
  return isValidCategory(upperGroup);
};

/**
 * Get all available category styles as key-value pairs
 * @returns Record of category names to their styles
 */
export const getAllCategoryStyles = (): Record<WordCategory | 'DEFAULT', CategoryStyle> => {
  return { ...CATEGORY_STYLES };
};

/**
 * Get category icon only
 * @param group - The category group name
 * @returns The icon string for the category
 */
export const getCategoryIcon = (group?: string | null): string => {
  return getCategoryStyle(group).icon;
};

/**
 * Get category color gradient only
 * @param group - The category group name
 * @returns The color gradient string for the category
 */
export const getCategoryGradient = (group?: string | null): string => {
  return getCategoryStyle(group).bgGradient;
};

/**
 * Get category background color only
 * @param group - The category group name
 * @returns The background color string for the category
 */
export const getCategoryBgColor = (group?: string | null): string => {
  return getCategoryStyle(group).bgColor;
};

/**
 * Get category text color gradient only
 * @param group - The category group name
 * @returns The text color gradient string for the category
 */
export const getCategoryTextColor = (group?: string | null): string => {
  return getCategoryStyle(group).color;
};

/**
 * Validate if a string is a valid category
 * @param category - String to validate
 * @returns True if the category is valid, with type predicate
 */
export { isValidCategory };

/**
 * Convert any string to a valid category or return default
 * @param input - Input string to convert
 * @returns Valid WordCategory or 'SOSTANTIVI' as default
 */
export const sanitizeCategory = (input?: string | null): WordCategory => {
  if (!input) return 'SOSTANTIVI';
  
  const upperInput = input.toUpperCase().trim();
  
  if (isValidCategory(upperInput)) {
    return upperInput;
  }
  
  // Try to match partial names
  const partialMatch = CATEGORIES.find(cat => 
    cat.includes(upperInput) || upperInput.includes(cat)
  );
  
  return partialMatch || 'SOSTANTIVI';
};

/**
 * Get categories grouped by theme
 * @returns Object with categorized groups
 */
export const getCategoriesGrouped = () => {
  return {
    grammar: ['VERBI', 'VERBI_IRREGOLARI', 'SOSTANTIVI', 'AGGETTIVI'] as const,
    emotions: ['EMOZIONI', 'EMOZIONI_POSITIVE', 'EMOZIONI_NEGATIVE'] as const,
    physical: ['DESCRIZIONI_FISICHE', 'POSIZIONE_CORPO', 'VESTITI'] as const,
    lifestyle: ['FAMIGLIA', 'LAVORO', 'TECNOLOGIA'] as const
  } as const;
};

/**
 * Search categories by keyword
 * @param keyword - Search keyword
 * @returns Array of matching categories
 */
export const searchCategories = (keyword: string): WordCategory[] => {
  if (!keyword.trim()) return [...CATEGORIES];
  
  const normalizedKeyword = keyword.toLowerCase().trim();
  
  return CATEGORIES.filter(category => 
    category.toLowerCase().includes(normalizedKeyword) ||
    getCategoryIcon(category).includes(keyword) ||
    // Add Italian translations for search
    getCategoryItalianName(category).toLowerCase().includes(normalizedKeyword)
  );
};

/**
 * Get Italian display name for category
 * @param category - The category
 * @returns Italian display name
 */
export const getCategoryItalianName = (category: WordCategory): string => {
  const italianNames: Record<WordCategory, string> = {
    'VERBI': 'Verbi',
    'VERBI_IRREGOLARI': 'Verbi Irregolari',
    'SOSTANTIVI': 'Sostantivi',
    'AGGETTIVI': 'Aggettivi',
    'DESCRIZIONI_FISICHE': 'Aspetto Fisico',
    'POSIZIONE_CORPO': 'Posizioni del Corpo',
    'EMOZIONI': 'Emozioni',
    'EMOZIONI_POSITIVE': 'Emozioni Positive',
    'EMOZIONI_NEGATIVE': 'Emozioni Negative',
    'LAVORO': 'Lavoro',
    'FAMIGLIA': 'Famiglia',
    'TECNOLOGIA': 'Tecnologia',
    'VESTITI': 'Vestiti'
  };
  
  return italianNames[category] || category;
};

/**
 * Get category statistics for display
 * @param category - The category
 * @returns Object with display information
 */
export const getCategoryDisplayInfo = (category: WordCategory) => {
  const style = getCategoryStyleExact(category);
  
  return {
    name: category,
    displayName: getCategoryItalianName(category),
    icon: style.icon,
    color: style.color,
    bgColor: style.bgColor,
    bgGradient: style.bgGradient,
    isGrammatical: ['VERBI', 'VERBI_IRREGOLARI', 'SOSTANTIVI', 'AGGETTIVI'].includes(category),
    isEmotional: category.includes('EMOZIONI'),
    isPhysical: ['DESCRIZIONI_FISICHE', 'POSIZIONE_CORPO', 'VESTITI'].includes(category)
  };
};