
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import ThemeSwitcher from '../../components/ThemeSwitcher';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import AccountDataCard from '../../components/AccountDataCard';
import Icon, { ICONS } from '../../components/Icon';
import Badge from '../../components/Badge';
import { useStatusStyles } from '../../hooks/useStatusStyles';

const GeneralTab = ({ accountData, contactsCountData, contactsCountLoading, installPrompt, handleInstallClick }: { accountData: any, contactsCountData: any, contactsCountLoading: boolean, installPrompt: any, handleInstallClick: () => void }) => {
    const { t, i18n } = useTranslation();
    const { logout } = useAuth();
    const { getStatusStyle } = useStatusStyles();

    const getReputationInfo = (reputation: number) => {
        const score = Number(reputation || 0);
        if (score >= 80) return { text: t('reputationExcellent'), className: 'good' };
        if (score >= 60) return { text: t('reputationGood'), className: 'good' };
        if (score >= 40) return { text: t('reputationAverage'), className: 'medium' };
        if (score >= 20) return { text: t('reputationPoor'), className: 'bad' };
        return { text: t('reputationVeryPoor'), className: 'bad' };
    };
    
    const accountStatus = accountData?.status || 'Active';
    const statusStyle = getStatusStyle(accountStatus);
    const reputation = getReputationInfo(accountData?.reputation);
    
    return (
        <div className="account-tab-content">
            <div className="card-grid account-grid">
                <AccountDataCard title={t('accountStatus')} iconPath={ICONS.VERIFY}>
                    <Badge text={statusStyle.text} type={statusStyle.type} iconPath={statusStyle.iconPath} />
                </AccountDataCard>
                <AccountDataCard title={t('reputation')} iconPath={ICONS.TRENDING_UP}>
                    <span className={`reputation-score ${reputation.className}`}>{accountData?.reputation ?? 0}%</span>
                    <span className="reputation-text">{reputation.text}</span>
                </AccountDataCard>
                 <AccountDataCard title={t('remainingCredits')} iconPath={ICONS.BUY_CREDITS}>
                    {(accountData?.emailcredits === undefined) ? 'N/A' : Number(accountData.emailcredits).toLocaleString(i18n.language)}
                </AccountDataCard>
                <AccountDataCard title={t('totalContacts')} iconPath={ICONS.CONTACTS}>
                    {contactsCountLoading ? '...' : (contactsCountData?.toLocaleString(i18n.language) ?? '0')}
                </AccountDataCard>
            </div>

            <div className="account-tab-card">
                 <div className="account-tab-card-header">
                    <h3>{t('displayMode')}</h3>
                </div>
                <div className="account-tab-card-body">
                    <p>{t('displayModeSubtitle')}</p>
                    <ThemeSwitcher />
                </div>
            </div>

            <div className="account-tab-card">
                 <div className="account-tab-card-header">
                    <h3>{t('language')}</h3>
                </div>
                <div className="account-tab-card-body">
                    <p>{t('languageSubtitle')}</p>
                    <LanguageSwitcher />
                </div>
            </div>

            {installPrompt && (
                <div className="account-tab-card">
                    <div className="account-tab-card-header">
                        <h3>{t('installApp')}</h3>
                    </div>
                    <div className="account-tab-card-body">
                        <p>{t('installAppSubtitle')}</p>
                        <button className="btn btn-secondary" onClick={handleInstallClick} style={{maxWidth: '250px'}}>
                            <Icon path={ICONS.DOWNLOAD} /> {t('installMailzila')}
                        </button>
                    </div>
                </div>
            )}

            <div className="account-tab-card">
                <div className="account-tab-card-header">
                    <h3>{t('logout')}</h3>
                </div>
                <div className="account-tab-card-body">
                    <p>{t('logoutDescription')}</p>
                    <button className="btn btn-secondary" onClick={logout} style={{maxWidth: '250px'}}>
                        <Icon path={ICONS.LOGOUT} />
                        <span>{t('logout')}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GeneralTab;
