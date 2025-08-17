import React from 'react';
import { useTranslation } from 'react-i18next';
import DashboardView from './DashboardView';
import StatisticsView from './StatisticsView';
import CenteredMessage from '../components/CenteredMessage';

const EmbedView = () => {
    const { t, i18n } = useTranslation();
    const urlParams = new URLSearchParams(window.location.search);
    const apiKey = urlParams.get('apiKey');
    const view = urlParams.get('view') || 'Dashboard';
    const lang = urlParams.get('lang'); // Allow language override

    React.useEffect(() => {
        if (lang && lang !== i18n.language) {
            i18n.changeLanguage(lang);
        }
    }, [lang, i18n]);

    React.useEffect(() => {
        document.documentElement.lang = i18n.language;
        document.documentElement.dir = i18n.dir();
    }, [i18n.language, i18n.dir]);

    if (!apiKey) {
        return <CenteredMessage style={{ height: '100vh' }}>{t('embedApiKeyMissing')}</CenteredMessage>;
    }
    
    // A simplified user object for prop compatibility
    const embedUser = { isEmbed: true };
    
    const renderView = () => {
        switch (view) {
            case 'Statistics':
                return <StatisticsView apiKey={apiKey} isEmbed={true} />;
            case 'Dashboard':
            default:
                return <DashboardView apiKey={apiKey} user={embedUser} setView={() => {}} isEmbed={true} />;
        }
    };
    
    return (
        <main className="embed-container">
            {renderView()}
        </main>
    );
};

export default EmbedView;
