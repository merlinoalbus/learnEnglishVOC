// Re-export the useTheme hook from ThemeContext
// This maintains compatibility with any existing imports while centralizing theme logic
import { useTheme } from '../../contexts/ThemeContext';
export { useTheme };
export default useTheme;