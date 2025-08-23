import React from 'react';
import { useTranslation } from 'react-i18next';
import useApiV4 from '../hooks/useApiV4';
import CenteredMessage from '../components/CenteredMessage';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import Icon, { ICONS } from '../components/Icon';
import Badge from '../components/Badge';
import { useStatusStyles } from '../hooks/useStatusStyles';
import { formatDateForDisplay } from '../utils/helpers';

const DetailItem = ({ label, value }: { label: string, value: React.ReactNode }) => (
    (value || value === 0) ? (
        <>
            <dt>{label}</dt>
            <dd>{value}</dd>
        </>
    ) : null
);

const ContactDetailView = ({ apiKey, contactEmail, onBack }: {
    apiKey: string;
    contactEmail: string;
    onBack: () => void;
}) => {
    const { t, i18n } = useTranslation();
    const { getStatusStyle } = useStatusStyles();

    const { data: contact, loading, error } = useApiV4(
        contactEmail ? `/contacts/${encodeURIComponent(contactEmail)}` : '',
        apiKey
    );

    if (!contactEmail) {
        return (
            <CenteredMessage>
                <div className="info-message warning">
                    <p>No contact selected.</p>
                </div>
            </CenteredMessage>
        );
    }

    const statusStyle = contact ? getStatusStyle(contact.Status) : getStatusStyle('unknown');
    const fullName = [contact?.FirstName, contact?.LastName].filter(Boolean).join(' ');

    return (
        <div>
            <div className="view-header" style={{ flexWrap: 'nowrap' }}>
                <button className="btn btn-secondary" onClick={onBack}>
                    <Icon path={ICONS.CHEVRON_LEFT} />
                    <span>{t('back')}</span>
                </button>
            </div>
            {loading && <CenteredMessage><Loader /></CenteredMessage>}
            {error && <ErrorMessage error={error} />}
            {contact && (
                <div className="account-tab-content">
                    <div className="profile-hero">
                        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexGrow: 1 }}>
                            <div className="profile-avatar">
                                <Icon path={ICONS.ACCOUNT} />
                            </div>
                            <div className="profile-info">
                                <h3>{fullName || contact.Email}</h3>
                                <p className="profile-email">{contact.Email}</p>
                                <div className="profile-meta">
                                    <Badge text={statusStyle.text} type={statusStyle.type} iconPath={statusStyle.iconPath} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card-grid" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>
                        <div className="account-tab-card">
                            <div className="account-tab-card-header"><h3>{t('contactDetails')}</h3></div>
                            <div className="account-tab-card-body">
                                <dl className="contact-details-grid">
                                    <DetailItem label={t('firstName')} value={contact.FirstName} />
                                    <DetailItem label={t('lastName')} value={contact.LastName} />
                                    <DetailItem label={t('source')} value={contact.Source} />
                                    <DetailItem label={t('dateAdded')} value={formatDateForDisplay(contact.DateAdded, i18n.language)} />
                                    <DetailItem label={t('dateUpdated')} value={formatDateForDisplay(contact.DateUpdated, i18n.language)} />
                                    <DetailItem label={t('statusChangeDate')} value={formatDateForDisplay(contact.StatusChangeDate, i18n.language)} />
                                </dl>
                            </div>
                        </div>

                        <div className="account-tab-card">
                            <div className="account-tab-card-header"><h3>{t('activity')}</h3></div>
                            <div className="account-tab-card-body">
                                <dl className="contact-details-grid">
                                    <DetailItem label={t('totalSent')} value={contact.Activity?.TotalSent?.toLocaleString(i18n.language)} />
                                    <DetailItem label={t('totalOpened')} value={contact.Activity?.TotalOpened?.toLocaleString(i18n.language)} />
                                    <DetailItem label={t('totalClicked')} value={contact.Activity?.TotalClicked?.toLocaleString(i18n.language)} />
                                    <DetailItem label={t('totalFailed')} value={contact.Activity?.TotalFailed?.toLocaleString(i18n.language)} />
                                    <DetailItem label={t('lastSent')} value={formatDateForDisplay(contact.Activity?.LastSent, i18n.language)} />
                                    <DetailItem label={t('lastOpened')} value={formatDateForDisplay(contact.Activity?.LastOpened, i18n.language)} />
                                    <DetailItem label={t('lastClicked')} value={formatDateForDisplay(contact.Activity?.LastClicked, i18n.language)} />
                                </dl>
                            </div>
                        </div>

                        {contact.CustomFields && Object.keys(contact.CustomFields).length > 0 && (
                            <div className="account-tab-card">
                                <div className="account-tab-card-header"><h3>{t('customFields')}</h3></div>
                                <div className="account-tab-card-body">
                                    <dl className="contact-details-grid">
                                        {Object.entries(contact.CustomFields).map(([key, value]) => (
                                            <DetailItem key={key} label={key} value={String(value)} />
                                        ))}
                                    </dl>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContactDetailView;
