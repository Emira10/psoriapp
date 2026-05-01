import { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProviderCustom({ children }) {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeCustom() {
  const context = useContext(ThemeContext);
  if (!context) {
    // هذا السطر سيحميكِ من ظهور أخطاء غير مفهومة مستقبلاً
    throw new Error('useThemeCustom must be used within a ThemeProviderCustom');
  }
  return context;
}