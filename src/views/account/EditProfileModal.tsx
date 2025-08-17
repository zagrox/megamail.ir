import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import sdk from '../../api/directus';
import { uploadFiles } from '@directus/sdk';
import Modal from '../../components/Modal';
import Loader from '../../components/Loader';
import { useToast } from '../../contexts/ToastContext';
import Icon, { ICONS } from '../../components/Icon';
import { DIRECTUS_URL } from '../../api/config';

// A simple toggle component
const Toggle = ({ label, checked, onChange, name }: { label: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, name: string }) => (
    <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label htmlFor={name} style={{ marginBottom: 0 }}>{label}</label>
        <label className="toggle-switch">
            <input type="checkbox" id={name} name={name} checked={checked} onChange={onChange} />
            <span className="toggle-slider"></span>
        </label>
    </div>
);

// A simple language switcher component for the form
const LanguageSwitcherForm = ({ value, onChange }: { value: string; onChange: (val: string) => void }) => {
    const { t } = useTranslation();
    const options = [
        { value: 'en-US', label: 'English' },
        { value: 'fa-IR', label: 'فارسی' },
    ];
    return (
        <div className="language-switcher">
            {options.map(option => (
                <button
                    type="button"
                    key={option.value}
                    className={`language-btn ${value === option.value ? 'active' : ''}`}
                    onClick={() => onChange(option.value)}
                >
                    <span>{option.label}</span>
                </button>
            ))}
        </div>
    );
};


const EditProfileModal = ({ isOpen, onClose, user }: { isOpen: boolean, onClose: () => void, user: any }) => {
    const { t } = useTranslation();
    const { updateUser } = useAuth();
    const { addToast } = useToast();
    const [formData, setFormData] = useState<any>({});
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user && isOpen) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                company: user.company || '',
                website: user.website || '',
                mobile: user.mobile || '',
                language: user.language || 'en-US',
                theme_dark: user.theme_dark || false,
                theme_light: user.theme_light || true,
                email_notifications: user.email_notifications || false,
            });
            const initialAvatarUrl = user.avatar ? `${DIRECTUS_URL}/assets/${user.avatar}` : null;
            setAvatarPreview(initialAvatarUrl);
            setAvatarFile(null); // Reset file on open
        }
    }, [user, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev: any) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };
    
    const handleThemeChange = (theme: 'dark' | 'light') => {
        setFormData((prev: any) => ({
            ...prev,
            theme_dark: theme === 'dark',
            theme_light: theme === 'light'
        }));
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const payload: any = { ...formData };
            
            // 1. Handle avatar upload if a new file is present
            if (avatarFile) {
                const fileData = new FormData();
                fileData.append('file', avatarFile);
                const result = await sdk.request(uploadFiles(fileData));
                if (result.id) {
                    payload.avatar = result.id;
                } else {
                    throw new Error("File ID not returned from upload.");
                }
            }

            // 2. Update user data
            await updateUser(payload);
            
            addToast(t('profileUpdateSuccess'), 'success');
            setTimeout(() => {
                onClose();
            }, 1500);

        } catch (err: any) {
            let errorMessage = err.message;
            if (err.errors && err.errors[0]?.message) {
                 errorMessage = err.errors[0].message;
            }
            addToast(t('profileUpdateError', { error: errorMessage }), 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('editProfile')}>
            <form onSubmit={handleSubmit} className="modal-form">
                
                <div className="edit-profile-avatar-uploader">
                    <img src={avatarPreview || `https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name}`} alt="Avatar Preview" className="edit-profile-avatar-preview" />
                    <div className="form-group">
                        <label>{t('changeAvatar')}</label>
                        <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" style={{ display: 'none' }} />
                        <button type="button" className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
                            <Icon path={ICONS.UPLOAD} />
                            <span>{t('uploadFile')}</span>
                        </button>
                    </div>
                </div>

                <div className="form-grid">
                    <div className="form-group">
                        <label htmlFor="first_name">{t('firstName')}</label>
                        <input id="first_name" name="first_name" type="text" value={formData.first_name || ''} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="last_name">{t('lastName')}</label>
                        <input id="last_name" name="last_name" type="text" value={formData.last_name || ''} onChange={handleChange} />
                    </div>
                     <div className="form-group">
                        <label htmlFor="company">{t('company')}</label>
                        <input id="company" name="company" type="text" value={formData.company || ''} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="website">{t('website')}</label>
                        <input id="website" name="website" type="url" value={formData.website || ''} onChange={handleChange} placeholder="https://example.com" />
                    </div>
                    <div className="form-group full-width">
                        <label htmlFor="mobile">{t('mobile')}</label>
                        <input id="mobile" name="mobile" type="tel" value={formData.mobile || ''} onChange={handleChange} />
                    </div>
                </div>
                
                <hr className="form-separator" />
                
                <div className="form-group">
                    <label>{t('language')}</label>
                    <LanguageSwitcherForm value={formData.language} onChange={(val) => setFormData((p: any) => ({ ...p, language: val }))} />
                </div>
                
                 <div className="form-group">
                    <label>{t('theme')}</label>
                    <div className="theme-switcher">
                         <button type="button" onClick={() => handleThemeChange('light')} className={formData.theme_light ? 'active' : ''}><Icon path={ICONS.SUN} /> {t('themeLight')}</button>
                         <button type="button" onClick={() => handleThemeChange('dark')} className={formData.theme_dark ? 'active' : ''}><Icon path={ICONS.MOON} /> {t('themeDark')}</button>
                    </div>
                </div>

                <Toggle label={t('emailNotifications')} checked={!!formData.email_notifications} onChange={handleChange} name="email_notifications" />

                <div className="form-actions" style={{ marginTop: '1.5rem' }}>
                    <button type="button" className="btn" onClick={onClose} disabled={isSaving}>{t('cancel')}</button>
                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                        {isSaving ? <Loader /> : t('saveChanges')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default EditProfileModal;