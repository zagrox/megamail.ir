
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Icon, { ICONS } from '../../components/Icon';
import { DIRECTUS_URL } from '../../api/config';
import Badge from '../../components/Badge';
import EditProfileModal from './EditProfileModal';
import { useStatusStyles } from '../../hooks/useStatusStyles';

const ProfileField = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
    <div className="form-group">
        <label>{label}</label>
        <div className="profile-field-value">{value || '—'}</div>
    </div>
);


const ProfileTab = ({ accountData, user }: { accountData: any, user: any }) => {
    const { t, i18n } = useTranslation();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const { getStatusStyle } = useStatusStyles();

    if (!user) {
        return null; 
    }

    const firstName = user?.first_name;
    const lastName = user?.last_name;
    const email = user?.email;
    const fullName = [firstName, lastName].filter(Boolean).join(' ');
    
    const avatarUrl = user?.avatar ? `${DIRECTUS_URL}/assets/${user.avatar}` : null;

    const getRoleName = (role: any) => {
        if (typeof role === 'object' && role !== null && role.name) {
            return role.name;
        }
        return role; // Fallback for role ID or simple string
    }
    
    const roleStyle = getStatusStyle('info');
    const statusStyle = getStatusStyle(user.status);

    return (
        <div className="account-tab-content">
            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                user={user}
            />
            <div className="profile-hero">
                <div style={{display: 'flex', gap: '2rem', alignItems: 'center', flexGrow: 1}}>
                    <div className="profile-avatar">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={t('profile')} />
                        ) : (
                            <Icon path={ICONS.ACCOUNT} />
                        )}
                    </div>
                    <div className="profile-info">
                        <h3>{fullName || t('userProfile')}</h3>
                        <p className="profile-email">{email || 'N/A'}</p>
                        <div className="profile-meta">
                            {user.role && <Badge text={getRoleName(user.role)} type={roleStyle.type} />}
                            {user.status && <Badge text={statusStyle.text} type={statusStyle.type} iconPath={statusStyle.iconPath} />}
                        </div>
                    </div>
                </div>
                <div className="profile-actions">
                    <button className="btn btn-secondary" onClick={() => setIsEditModalOpen(true)}>
                        <Icon path={ICONS.PENCIL} />
                        <span>{t('editProfile')}</span>
                    </button>
                </div>
            </div>

            <div className="account-tab-card">
                <div className="account-tab-card-header">
                    <h3>{t('personalInformation')}</h3>
                </div>
                <div className="account-tab-card-body">
                    <div className="form-grid">
                        <ProfileField label={t('firstName')} value={user.first_name} />
                        <ProfileField label={t('lastName')} value={user.last_name} />
                    </div>
                </div>
            </div>
            
            <div className="account-tab-card">
                <div className="account-tab-card-header">
                    <h3>{t('companyInformation')}</h3>
                </div>
                <div className="account-tab-card-body">
                    <div className="form-grid">
                        <ProfileField label={t('company')} value={user.company} />
                        <ProfileField label={t('website')} value={user.website} />
                        <ProfileField label={t('mobile')} value={user.mobile} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileTab;
