// =====================================================
// 📁 src/constants/appConstants.ts - Application Constants
// =====================================================

export const STORAGE_CONFIG = {
  keys: {
    words: 'vocabulary_words_v2',
    stats: 'app_statistics',
    testHistory: 'test_history',
    settings: 'app_settings'
  }
} as const;

export default STORAGE_CONFIG;