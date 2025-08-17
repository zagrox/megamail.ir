import React from 'react';
import { useTranslation } from 'react-i18next';
import EmbedCodeCard from '../../components/EmbedCodeCard';
import Icon, { ICONS } from '../../components/Icon';

const ShareTab = ({ apiKey }: { apiKey: string }) => {
    const { t } = useTranslation();

    return (
        <div className="account-tab-content">
            <EmbedCodeCard apiKey={apiKey} />

            <div className="account-tab-card">
                <div className="account-tab-card-header">
                    <h3>{t('whitelabelAndCustomSetup')}</h3>
                </div>
                <div className="account-tab-card-body">
                    <p>{t('whitelabelInfo')}</p>
                    <a
                        href="https://zagrox.com/contact/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                        style={{ maxWidth: '250px' }}
                    >
                        <Icon path={ICONS.MAIL} />
                        <span>{t('contactUsForDetails')}</span>
                    </a>
                </div>
            </div>
        </div>
    );
};

export default ShareTab;