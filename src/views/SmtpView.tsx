import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import useApi from './useApi';
import CenteredMessage from '../components/CenteredMessage';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import Icon, { ICONS } from '../components/Icon';

const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

const CopyButton = ({ value }: { value: string }) => {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        copyToClipboard(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button onClick={handleCopy} className="btn-icon">
            <Icon path={copied ? ICONS.CHECK : ICONS.MAIL} />
        </button>
    );
};

const SecretValue = ({ value, type = "password" }: { value: string, type?: "text" | "password" }) => {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className="secret-value-wrapper">
            <input type={isVisible ? 'text' : type} value={value} readOnly />
            <button type="button" className="btn-icon" onClick={() => setIsVisible(!isVisible)}>
                <Icon path={isVisible ? ICONS.EYE_OFF : ICONS.EYE} />
            </button>
            <CopyButton value={value} />
        </div>
    );
};

const SmtpView = ({ apiKey, user }: { apiKey: string, user: any }) => {
    const { t } = useTranslation();
    
    const { data: mainCreds, loading, error } = useApi('/account/load', apiKey);
    
    return (
        <div>
            <div className="card main-credential-card">
                <div className="card-header"><h3>{t('mainAccountCredentials')}</h3></div>
                <div className="card-body">
                    {loading && <CenteredMessage><Loader /></CenteredMessage>}
                    {error && <ErrorMessage error={error} />}
                    {mainCreds && (
                        <div className="smtp-card-body">
                            <div className="smtp-detail-item"><label>{t('server')}</label><strong>smtp.mailzila.com</strong></div>
                            <div className="smtp-detail-item"><label>{t('ports')}</label><strong>25, 2525, 587, 465</strong></div>
                            <div className="smtp-detail-item"><label>{t('username')}</label><strong className="monospace">{mainCreds.email}</strong></div>
                            <div className="smtp-detail-item full-span"><label>{t('passwordMainApiKey')}</label><SecretValue value={apiKey} /></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SmtpView;