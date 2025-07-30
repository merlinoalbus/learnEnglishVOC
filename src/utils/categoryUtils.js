// /src/utils/categoryUtils.js
// This file contains utility functions for managing vocabulary categories.
// It provides functions to get the style for a category based on its name, and to retrieve a list of predefined groups.
// It is used to ensure consistent styling and categorization of vocabulary words in the application.

import {
  EXPANDED_CATEGORY_STYLES,
  WORD_CATEGORIES,
} from "../types/entities/Word.types";

export const getCategoryStyle = (group) => {
  if (!group)
    return (
      EXPANDED_CATEGORY_STYLES["DEFAULT"] || {
        color: "from-blue-400 via-blue-500 to-blue-600",
        icon: "📚",
        bgColor: "bg-blue-500",
        bgGradient: "bg-gradient-to-br from-blue-500 to-cyan-600",
      }
    );

  const upperGroup = group ? group.toUpperCase().trim() : "";
  return (
    EXPANDED_CATEGORY_STYLES[upperGroup] || EXPANDED_CATEGORY_STYLES["DEFAULT"]
  );
};

export const getPredefinedGroups = () => {
  return [...WORD_CATEGORIES].sort();
};
