import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import Icon, { ICONS } from './Icon';

type Theme = 'light' | 'dark' | 'auto';

const ThemeSwitcher = () => {
    const { t } = useTranslation();
    const { theme, setTheme } = useTheme();
    const { updateUser, user } = useAuth();

    const options: { value: Theme; label: string; icon: string; }[] = [
        { value: 'light', label: t('themeLight'), icon: ICONS.SUN },
        { value: 'dark', label: t('themeDark'), icon: ICONS.MOON },
        { value: 'auto', label: t('themeSystem'), icon: ICONS.DESKTOP },
    ];

    const handleThemeChange = (newTheme: Theme) => {
        // Update UI immediately
        setTheme(newTheme);

        // If user is not an API user, sync to Directus
        if (user && !user.isApiKeyUser) {
            let payload = {};
            if (newTheme === 'light') {
                payload = { theme_light: true, theme_dark: false };
            } else if (newTheme === 'dark') {
                payload = { theme_light: false, theme_dark: true };
            } else {
                // For 'auto', we don't update the backend as it's a client preference
                // The 'auto' value is saved in localStorage by ThemeContext
                return;
            }

            updateUser(payload).catch(error => {
                console.warn("Failed to sync theme preference:", error);
                // The UI has already updated, so we just log the error
            });
        }
    };

    return (
        <div className="theme-switcher">
            {options.map(option => (
                <button
                    key={option.value}
                    className={`theme-btn ${theme === option.value ? 'active' : ''}`}
                    onClick={() => handleThemeChange(option.value)}
                    aria-label={t('switchToTheme', { theme: option.label })}
                >
                    <Icon path={option.icon} />
                    <span>{option.label}</span>
                </button>
            ))}
        </div>
    );
};

export default ThemeSwitcher;
