

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import useApi from './useApi';
import CenteredMessage from '../components/CenteredMessage';
import Loader from '../components/Loader';
import { ICONS } from '../components/Icon';
import Tabs from '../components/Tabs';
import GeneralTab from './account/GeneralTab';
import ProfileTab from './account/ProfileTab';
import ApiKeyTab from './account/ApiKeyTab';
import SecurityTab from './account/SecurityTab';
import ShareTab from './account/ShareTab';
import DomainsView from './DomainsView';
import SmtpView from './SmtpView';
import OrdersTab from './account/OrdersTab';

const AccountView = ({ apiKey, user }: { apiKey: string, user: any }) => {
    const { t } = useTranslation();
    const { data: accountData, loading: accountLoading, error: accountError } = useApi('/account/load', apiKey, {}, apiKey ? 1 : 0);
    const { data: contactsCountData, loading: contactsCountLoading } = useApi('/contact/count', apiKey, { allContacts: true }, apiKey ? 1 : 0);
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('general');

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = () => {
        if (!installPrompt) return;
        installPrompt.prompt();
    };

    const tabs = [
        { id: 'general', label: t('general'), icon: ICONS.DASHBOARD, component: <GeneralTab accountData={accountData} contactsCountData={contactsCountData} contactsCountLoading={contactsCountLoading} installPrompt={installPrompt} handleInstallClick={handleInstallClick} /> },
        { id: 'profile', label: t('profile'), icon: ICONS.ACCOUNT, component: <ProfileTab accountData={accountData} user={user} /> },
        { id: 'orders', label: t('orders'), icon: ICONS.BUY_CREDITS, component: <OrdersTab /> },
        { id: 'api_key', label: t('apiKey'), icon: ICONS.KEY, component: <ApiKeyTab apiKey={apiKey} /> },
        { id: 'security', label: t('security'), icon: ICONS.DOMAINS, component: <SecurityTab user={user} /> },
        { id: 'domains', label: t('domains'), icon: ICONS.LANGUAGE, component: <DomainsView apiKey={apiKey} /> },
        { id: 'smtp', label: t('smtp'), icon: ICONS.SMTP, component: <SmtpView apiKey={apiKey} user={user} /> },
        { id: 'share', label: t('share'), icon: ICONS.SHARE, component: <ShareTab apiKey={apiKey} /> },
    ];
    
    useEffect(() => {
        const initialTab = sessionStorage.getItem('account-tab');
        if (initialTab) {
            // Check if the tab from session storage is a valid tab to prevent errors
            if (tabs.some(tab => tab.id === initialTab)) {
                setActiveTab(initialTab);
            }
            sessionStorage.removeItem('account-tab');
        }
        // This effect should only run once on mount to check for an initial tab.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    

    if (!apiKey) {
        return (
            <div className="account-view-container">
                <CenteredMessage>
                    <div className="info-message">
                        <strong>{t('noApiKeyFound')}</strong>
                        <p>{t('addKeyToViewAccount')}</p>
                    </div>
                </CenteredMessage>
            </div>
        );
    }

    if (accountLoading) {
        return <div className="account-view-container"><CenteredMessage><Loader /></CenteredMessage></div>;
    }
    
    return (
        <div className="account-view-container">
            <Tabs
                tabs={tabs}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />
        </div>
    );
};

export default AccountView;