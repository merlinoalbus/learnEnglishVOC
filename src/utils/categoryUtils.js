// /src/utils/categoryUtils.js
// This file contains utility functions for managing vocabulary categories.
// It provides functions to get the style for a category based on its name, and to retrieve a list of predefined groups.
// It is used to ensure consistent styling and categorization of vocabulary words in the application.

import { CATEGORY_STYLES, CATEGORIES } from '../constants/appConstants';

export const getCategoryStyle = (group) => {
  if (!group) return CATEGORY_STYLES['DEFAULT'] || { 
    color: 'from-blue-400 via-blue-500 to-blue-600', 
    icon: '📚', 
    bgColor: 'bg-blue-500',
    bgGradient: 'bg-gradient-to-br from-blue-500 to-cyan-600'
  };
  
  const upperGroup = group ? group.toUpperCase().trim() : '';
  return CATEGORY_STYLES[upperGroup] || CATEGORY_STYLES['DEFAULT'];
};

export const getPredefinedGroups = () => {
  return [...CATEGORIES].sort();
};