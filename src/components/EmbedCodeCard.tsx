import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Icon, { ICONS } from './Icon';

const EmbedCodeCard = ({ apiKey }: { apiKey: string }) => {
    const { t, i18n } = useTranslation();
    const [view, setView] = useState('Dashboard');
    const [copied, setCopied] = useState(false);

    const baseUrl = 'https://my.mailzila.com';
    const embedUrl = `${baseUrl}/?embed=true&apiKey=${apiKey}&view=${view}&lang=${i18n.language}`;
    const iframeCode = `<iframe src="${embedUrl}" width="100%" height="800px" style="border:1px solid #ccc; border-radius: 8px;" title="Mailzila Dashboard"></iframe>`;

    const handleCopy = () => {
        navigator.clipboard.writeText(iframeCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="card">
            <div className="card-header" style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{t('embedDashboard')}</h3>
            </div>
            <div className="card-body" style={{ padding: '0 1.25rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ color: 'var(--subtle-text-color)', marginTop: 0, fontSize: '0.9rem' }}>{t('embedDashboardSubtitle')}</p>
                <div className="info-message warning" style={{flexDirection: 'row', alignItems: 'center', textAlign: 'left'}}>
                    <p style={{margin: 0}}><strong>{t('warning')}:</strong> {t('embedWarning')}</p>
                </div>
                <div className="form-group">
                    <label htmlFor="embed-view-select">{t('selectView')}</label>
                    <select id="embed-view-select" value={view} onChange={e => setView(e.target.value)}>
                        <option value="Dashboard">{t('dashboard')}</option>
                        <option value="Statistics">{t('statistics')}</option>
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="embed-code">{t('embedCode')}</label>
                    <textarea id="embed-code" readOnly value={iframeCode} style={{ height: '120px', fontFamily: 'monospace', fontSize: '0.85rem', resize: 'none' }} />
                </div>
                <div className="form-actions" style={{justifyContent: 'flex-end', padding: 0, border: 'none', margin: 0}}>
                    <button className="btn btn-secondary" onClick={handleCopy}>
                        <Icon path={copied ? ICONS.CHECK : ICONS.MAIL} /> {copied ? t('copied') : t('copyEmbedCode')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmbedCodeCard;
