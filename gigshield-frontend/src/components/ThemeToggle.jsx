import { useTheme } from '../context/ThemeContext.jsx';
import { Sun, Moon } from 'lucide-react';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      className="theme-toggle-btn"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      <span className={`theme-toggle-icon ${isDark ? 'active' : ''}`}>
        <Moon size={14} />
      </span>
      <span className={`theme-toggle-icon ${!isDark ? 'active' : ''}`}>
        <Sun size={14} />
      </span>
      <span className="theme-toggle-slider" style={{ transform: isDark ? 'translateX(0)' : 'translateX(100%)' }} />
    </button>
  );
}

export default ThemeToggle;
