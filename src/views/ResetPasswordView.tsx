import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useToast } from '../contexts/ToastContext';
import Loader from '../components/Loader';
import Icon, { ICONS } from '../components/Icon';

const ResetPasswordView = () => {
    const { resetPassword } = useAuth();
    const { t } = useTranslation();
    const { addToast } = useToast();
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        // Be robust: check both hash and search for parameters
        const hash = window.location.hash.substring(1);
        const hashQueryString = hash.split('?')[1] || '';
        const searchQueryString = window.location.search.substring(1) || '';
        const params = new URLSearchParams(hashQueryString || searchQueryString);
        const tokenFromUrl = params.get('token');

        if (tokenFromUrl) {
            setToken(tokenFromUrl);
        } else {
            addToast(t('invalidResetToken'), 'error');
        }
    }, [t, addToast]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!token) {
            addToast(t('invalidResetToken'), 'error');
            return;
        }

        const form = e.currentTarget;
        const password = (form.elements.namedItem('password') as HTMLInputElement).value;
        const confirm_password = (form.elements.namedItem('confirm_password') as HTMLInputElement).value;

        if (password !== confirm_password) {
            addToast(t('passwordsDoNotMatch'), 'error');
            return;
        }

        setLoading(true);
        try {
            await resetPassword(token, password);
            addToast(t('passwordResetSuccessMessage'), 'success');
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        } catch (err: any) {
            let errorMessage = err.message;
            if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
                errorMessage = err.errors[0].message;
            }
            addToast(errorMessage || t('unknownError'), 'error');
        } finally {
            setLoading(false);
        }
    };
    
    const goToLogin = () => {
        window.location.href = '/';
    }

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h1><span className="logo-font">Mailzila</span></h1>
                <p>{t('resetPasswordSubtitle')}</p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <fieldset disabled={!token || loading} style={{border: 'none', padding: 0, margin: 0, display: 'contents'}}>
                        <div className="input-group has-btn">
                            <span className="input-icon"><Icon path={ICONS.LOCK} /></span>
                            <input name="password" type={showPassword ? "text" : "password"} placeholder={t('newPassword')} required />
                             <button type="button" className="input-icon-btn" onClick={() => setShowPassword(!showPassword)}>
                                <Icon path={showPassword ? ICONS.EYE_OFF : ICONS.EYE} />
                            </button>
                        </div>
                        <div className="input-group">
                            <span className="input-icon"><Icon path={ICONS.LOCK} /></span>
                            <input name="confirm_password" type="password" placeholder={t('confirmPassword')} required />
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={loading || !token}>
                            {loading ? <Loader /> : t('resetPassword')}
                        </button>
                    </fieldset>
                </form>
                 <div className="auth-switch">
                    <button onClick={goToLogin} className="link-button">{t('backToSignIn')}</button>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordView;