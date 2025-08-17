import React, { useState, useEffect, ReactNode, createContext, useContext } from 'react';

type Theme = 'light' | 'dark' | 'auto';
interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    effectiveTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [theme, _setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'auto');
    const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');

    const setTheme = (newTheme: Theme) => {
        localStorage.setItem('theme', newTheme);
        _setTheme(newTheme);
    };

    useEffect(() => {
        const applyTheme = (t: Theme) => {
            if (t === 'auto') {
                const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                const newEffectiveTheme = mediaQuery.matches ? 'dark' : 'light';
                setEffectiveTheme(newEffectiveTheme);
                document.documentElement.setAttribute('data-theme', newEffectiveTheme);
            } else {
                setEffectiveTheme(t);
                document.documentElement.setAttribute('data-theme', t);
            }
        };

        applyTheme(theme);
        
        if (theme === 'auto') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = (e: MediaQueryListEvent) => {
                const newEffectiveTheme = e.matches ? 'dark' : 'light';
                setEffectiveTheme(newEffectiveTheme);
                document.documentElement.setAttribute('data-theme', newEffectiveTheme);
            };
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [theme]);

    const value = { theme, setTheme, effectiveTheme };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
