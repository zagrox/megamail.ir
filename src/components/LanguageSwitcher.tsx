import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();
    const { updateUser, user } = useAuth();
    
    const options = [
        { value: 'en', label: 'English', directusValue: 'en-US', dir: 'ltr' },
        { value: 'fa', label: 'فارسی', directusValue: 'fa-IR', dir: 'rtl' },
    ];

    const handleLanguageChange = (langCode: string) => {
        // Update UI immediately
        i18n.changeLanguage(langCode);

        // If user is not an API user, sync to Directus
        if (user && !user.isApiKeyUser) {
            const selectedOption = options.find(opt => opt.value === langCode);
            if (selectedOption) {
                const payload = {
                    language: selectedOption.directusValue,
                    text_direction: selectedOption.dir,
                };
                updateUser(payload).catch(error => {
                    console.warn("Failed to sync language preference:", error);
                    // The UI has already updated, so we just log the error
                });
            }
        }
    };

    return (
        <div className="language-switcher">
            {options.map(option => (
                <button
                    key={option.value}
                    className={`language-btn ${i18n.language === option.value ? 'active' : ''}`}
                    onClick={() => handleLanguageChange(option.value)}
                >
                    <span>{option.label}</span>
                </button>
            ))}
        </div>
    );
};

export default LanguageSwitcher;
