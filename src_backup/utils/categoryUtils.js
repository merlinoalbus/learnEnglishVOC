// /src/utils/categoryUtils.js
// This file contains utility functions for managing vocabulary categories.
// It provides functions to get the style for a category based on its name, and to retrieve a list of predefined groups.
// It is used to ensure consistent styling and categorization of vocabulary words in the application.

export const getCategoryStyle = (group) => {
  if (!group) return { 
    color: 'from-blue-400 via-blue-500 to-blue-600', 
    icon: '📚', 
    bgColor: 'bg-blue-500',
    bgGradient: 'bg-gradient-to-br from-blue-500 to-cyan-600'
  };
  
  const categoryMap = {
    'VERBI': { 
      color: 'from-red-400 via-red-500 to-red-600', 
      icon: '⚡', 
      bgColor: 'bg-red-500',
      bgGradient: 'bg-gradient-to-br from-red-500 to-orange-600'
    },
    'VERBI_IRREGOLARI': { 
      color: 'from-red-500 via-red-600 to-red-700', 
      icon: '🔄', 
      bgColor: 'bg-red-600',
      bgGradient: 'bg-gradient-to-br from-red-600 to-pink-600'
    },
    'SOSTANTIVI': { 
      color: 'from-blue-400 via-blue-500 to-blue-600', 
      icon: '🏷️', 
      bgColor: 'bg-blue-500',
      bgGradient: 'bg-gradient-to-br from-blue-500 to-indigo-600'
    },
    'AGGETTIVI': { 
      color: 'from-green-400 via-green-500 to-green-600', 
      icon: '🎨', 
      bgColor: 'bg-green-500',
      bgGradient: 'bg-gradient-to-br from-green-500 to-emerald-600'
    },
    'DESCRIZIONI_FISICHE': { 
      color: 'from-teal-400 via-teal-500 to-teal-600', 
      icon: '👤', 
      bgColor: 'bg-teal-500',
      bgGradient: 'bg-gradient-to-br from-teal-500 to-cyan-600'
    },
    'POSIZIONE_CORPO': { 
      color: 'from-purple-400 via-purple-500 to-purple-600', 
      icon: '🧘', 
      bgColor: 'bg-purple-500',
      bgGradient: 'bg-gradient-to-br from-purple-500 to-violet-600'
    },
    'EMOZIONI': { 
      color: 'from-pink-400 via-pink-500 to-pink-600', 
      icon: '❤️', 
      bgColor: 'bg-pink-500',
      bgGradient: 'bg-gradient-to-br from-pink-500 to-rose-600'
    },
    'EMOZIONI_POSITIVE': { 
      color: 'from-yellow-400 via-yellow-500 to-orange-500', 
      icon: '😊', 
      bgColor: 'bg-yellow-500',
      bgGradient: 'bg-gradient-to-br from-yellow-400 to-orange-500'
    },
    'EMOZIONI_NEGATIVE': { 
      color: 'from-gray-400 via-gray-500 to-gray-600', 
      icon: '😔', 
      bgColor: 'bg-gray-500',
      bgGradient: 'bg-gradient-to-br from-gray-500 to-slate-600'
    },
    'LAVORO': { 
      color: 'from-indigo-400 via-indigo-500 to-indigo-600', 
      icon: '💼', 
      bgColor: 'bg-indigo-500',
      bgGradient: 'bg-gradient-to-br from-indigo-500 to-blue-600'
    },
    'FAMIGLIA': { 
      color: 'from-pink-300 via-pink-400 to-rose-500', 
      icon: '👨‍👩‍👧‍👦', 
      bgColor: 'bg-pink-400',
      bgGradient: 'bg-gradient-to-br from-pink-400 to-rose-500'
    },
    'TECNOLOGIA': { 
      color: 'from-cyan-400 via-cyan-500 to-blue-500', 
      icon: '💻', 
      bgColor: 'bg-cyan-500',
      bgGradient: 'bg-gradient-to-br from-cyan-500 to-blue-500'
    },
    'VESTITI': { 
      color: 'from-purple-300 via-purple-400 to-pink-500', 
      icon: '👕', 
      bgColor: 'bg-purple-400',
      bgGradient: 'bg-gradient-to-br from-purple-400 to-pink-500'
    },
    'DEFAULT': { 
      color: 'from-emerald-400 via-emerald-500 to-cyan-500', 
      icon: '📚', 
      bgColor: 'bg-emerald-500',
      bgGradient: 'bg-gradient-to-br from-emerald-500 to-cyan-600'
    }
  };
  
  const upperGroup = group ? group.toUpperCase().trim() : '';
  return categoryMap[upperGroup] || categoryMap['DEFAULT'];
};

export const getPredefinedGroups = () => {
  return [
    'VERBI', 'VERBI_IRREGOLARI', 'SOSTANTIVI', 'AGGETTIVI',
    'DESCRIZIONI_FISICHE', 'POSIZIONE_CORPO', 'EMOZIONI',
    'EMOZIONI_POSITIVE', 'EMOZIONI_NEGATIVE', 'LAVORO',
    'FAMIGLIA', 'TECNOLOGIA', 'VESTITI'
  ].sort();
};