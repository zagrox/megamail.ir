
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { apiFetch } from '../../api/elasticEmail';
import { useToast } from '../../contexts/ToastContext';
import Loader from '../../components/Loader';

const ApiKeyTab = ({ apiKey: initialApiKey }: { apiKey: string }) => {
    const { t } = useTranslation();
    const { updateUser } = useAuth();
    const { addToast } = useToast();
    const [newApiKey, setNewApiKey] = useState(initialApiKey || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveKey = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await apiFetch('/account/load', newApiKey);
            await updateUser({ elastickey: newApiKey });
            addToast(t('apiKeyUpdateSuccess'), 'success');
        } catch (err: any) {
            addToast(err.message || t('apiKeyUpdateError'), 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="account-tab-content">
            <div className="account-tab-card">
                <div className="account-tab-card-header">
                    <h3>{t('apiKey')}</h3>
                </div>
                <form onSubmit={handleSaveKey}>
                    <div className="account-tab-card-body">
                         <div className="form-group">
                            <label htmlFor="api-key-input">{t('yourApiKey')}</label>
                            <input
                                id="api-key-input"
                                type="password"
                                value={newApiKey}
                                onChange={(e) => setNewApiKey(e.target.value)}
                                placeholder={t('enterYourApiKey')}
                                required
                            />
                        </div>
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary" disabled={isSaving}>
                            {isSaving ? <Loader /> : t('saveAndVerifyKey')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ApiKeyTab;
