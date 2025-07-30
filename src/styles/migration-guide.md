# CSS Migration Guide

## Overview
This guide helps migrate from inline Tailwind classes to semantic CSS classes for better maintainability.

## Common Replacements

### Layout Patterns
- `flex items-center justify-center` → `flex-center`
- `flex flex-col items-center justify-center` → `flex-center-column`
- `flex items-center justify-between` → `flex-between`

### Card Patterns
- `bg-white rounded-xl shadow-lg` → `card-base`
- `bg-white/90 backdrop-blur-sm rounded-xl shadow-lg` → `card-glass`
- `bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20` → `test-card-section`

### Glassmorphism
- `bg-white/20 backdrop-blur-md` → `glass-effect`
- `bg-white/10 backdrop-blur-sm` → `glass-effect-light`
- `bg-black/20 backdrop-blur-md` → `glass-effect-dark`

### Text Effects
- `drop-shadow-lg` → `text-shadow-lg`
- `drop-shadow-md` → `text-shadow-md`
- `bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent` → `gradient-text-purple`

### Interactive Elements
- `transform transition-all duration-200 hover:scale-105` → `interactive-scale`
- `transition-all duration-200 hover:shadow-xl hover:-translate-y-1` → `interactive-lift`

### Status Colors
- `text-green-600 bg-green-100` → `status-success`
- `text-red-600 bg-red-100` → `status-error`
- `text-yellow-600 bg-yellow-100` → `status-warning`
- `text-blue-600 bg-blue-100` → `status-info`

### Animations
- Custom fade animations → `animate-fade-in`
- Custom slide animations → `animate-slide-up`
- Custom scale animations → `animate-scale-in`

### Spacing
- `space-y-2` → `stack-sm`
- `space-y-4` → `stack-md`
- `space-y-6` → `stack-lg`
- `py-8 md:py-12` → `section-spacing`
- `px-4 md:px-6 lg:px-8` → `content-spacing`

## Component-Specific Classes

### TestCard
- Main container → `test-card-container`
- Flip wrapper → `test-card-flip-wrapper`
- Card faces → `test-card-face test-card-face-front/back`
- Content sections → `test-card-section`
- Word display → `test-card-word-text`

### TestView
- Container → `test-view-container`
- Progress card → `test-view-progress-card`
- Timer display → `test-view-timer-display`
- Hint buttons → `test-view-hint-button test-view-hint-[type]`
- Answer buttons → `test-view-answer-button test-view-answer-[correct/incorrect]`

### TestResults
- Container → `test-results-container`
- Main card → `test-results-card`
- Score circle → `test-results-score-circle`
- Stats grid → `test-results-stats`
- Word cards → `test-results-word-card`

## Migration Steps

1. Import the CSS file in your component or ensure it's included via index.css
2. Replace inline Tailwind classes with semantic classes using the mapping above
3. For complex combinations, check if a utility class exists in common.css
4. If no utility exists, consider creating one if the pattern is used multiple times
5. Test thoroughly to ensure visual appearance remains unchanged
6. Use browser DevTools to verify dark mode styles work correctly

## Best Practices

1. **Semantic Naming**: Use class names that describe the component/purpose, not the style
2. **Composition**: Combine utility classes with component-specific classes
3. **Dark Mode**: Always test dark mode variants
4. **Consistency**: Use the same patterns across similar components
5. **Documentation**: Comment complex class combinations in CSS files

## Example Migration

### Before:
```tsx
<div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
  <h3 className="font-bold mb-2 text-sm flex items-center gap-2">
    Title
  </h3>
  <div className="text-sm">Content</div>
</div>
```

### After:
```tsx
<div className="test-card-section">
  <h3 className="test-card-section-header">
    Title
  </h3>
  <div className="test-card-section-content">Content</div>
</div>
```

This approach maintains the exact visual appearance while making the code more maintainable and semantic.