

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useToast } from '../contexts/ToastContext';
import Loader from '../components/Loader';
import Icon, { ICONS } from '../components/Icon';

type AuthMode = 'login' | 'register' | 'forgot';

const AuthView = () => {
    const { login, register, requestPasswordReset } = useAuth();
    const [mode, setMode] = useState<AuthMode>('login');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { t, i18n } = useTranslation();
    const { addToast } = useToast();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const form = e.currentTarget;

        try {
            if (mode === 'login') {
                const email = (form.elements.namedItem('email') as HTMLInputElement).value;
                const password = (form.elements.namedItem('password') as HTMLInputElement).value;
                await login({ email, password });
            } else if (mode === 'register') {
                const email = (form.elements.namedItem('email') as HTMLInputElement).value;
                const password = (form.elements.namedItem('password') as HTMLInputElement).value;
                const confirm_password = (form.elements.namedItem('confirm_password') as HTMLInputElement).value;
                const first_name = (form.elements.namedItem('first_name') as HTMLInputElement).value;
                const last_name = (form.elements.namedItem('last_name') as HTMLInputElement).value;

                if (password !== confirm_password) {
                    throw new Error(t('passwordsDoNotMatch'));
                }
                await register({ email, password, first_name, last_name });
                addToast(t('registrationSuccessMessage'), 'success');
                setMode('login');
            } else if (mode === 'forgot') {
                const email = (form.elements.namedItem('email') as HTMLInputElement).value;
                await requestPasswordReset(email);
                addToast(t('passwordResetEmailSent'), 'success');
                setMode('login');
            }
        } catch (err: any) {
            let errorMessage = err.message;
            // Directus errors often come in an errors array
            if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
                errorMessage = err.errors[0].message;
            }
            addToast(errorMessage || t('unknownError'), 'error');
        } finally {
            setLoading(false);
        }
    };
    
    const getSubtitle = () => {
         if (mode === 'forgot') return t('forgotPasswordSubtitle');
         if (mode === 'login') return t('signInSubtitle');
         return t('createAccountSubtitle');
    }

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h1><span className="logo-font">Mailzila</span></h1>
                <p>{getSubtitle()}</p>

                <form className="auth-form" onSubmit={handleSubmit}>

                    {mode === 'login' ? (
                         <>
                            <div className="input-group">
                                <span className="input-icon"><Icon path={ICONS.MAIL} /></span>
                                <input name="email" type="email" placeholder={t('emailAddress')} required />
                            </div>
                            <div className="input-group has-btn">
                                <span className="input-icon"><Icon path={ICONS.LOCK} /></span>
                                <input name="password" type={showPassword ? "text" : "password"} placeholder={t('password')} required />
                                <button type="button" className="input-icon-btn" onClick={() => setShowPassword(!showPassword)}>
                                    <Icon path={showPassword ? ICONS.EYE_OFF : ICONS.EYE} />
                                </button>
                            </div>
                             <div style={{ textAlign: 'right', fontSize: '0.9rem', marginTop: '-0.5rem', marginBottom: '1rem' }}>
                                <button type="button" className="link-button" onClick={() => setMode('forgot')}>
                                    {t('forgotPassword')}
                                </button>
                            </div>
                        </>
                    ) : mode === 'register' ? (
                        <>
                            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group">
                                    <span className="input-icon"><Icon path={ICONS.ACCOUNT} /></span>
                                    <input name="first_name" type="text" placeholder={t('firstName')} required />
                                </div>
                                <div className="input-group">
                                    <span className="input-icon"><Icon path={ICONS.ACCOUNT} /></span>
                                    <input name="last_name" type="text" placeholder={t('lastName')} required />
                                </div>
                            </div>
                            <div className="input-group">
                                <span className="input-icon"><Icon path={ICONS.MAIL} /></span>
                                <input name="email" type="email" placeholder={t('emailAddress')} required />
                            </div>
                            <div className="input-group has-btn">
                                <span className="input-icon"><Icon path={ICONS.LOCK} /></span>
                                <input name="password" type={showPassword ? "text" : "password"} placeholder={t('password')} required />
                                <button type="button" className="input-icon-btn" onClick={() => setShowPassword(!showPassword)}>
                                    <Icon path={showPassword ? ICONS.EYE_OFF : ICONS.EYE} />
                                </button>
                            </div>
                            <div className="input-group has-btn">
                                <span className="input-icon"><Icon path={ICONS.LOCK} /></span>
                                <input name="confirm_password" type={showConfirmPassword ? "text" : "password"} placeholder={t('confirmPassword')} required />
                                <button type="button" className="input-icon-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                    <Icon path={showConfirmPassword ? ICONS.EYE_OFF : ICONS.EYE} />
                                </button>
                            </div>
                        </>
                    ) : ( // mode === 'forgot'
                        <div className="input-group">
                            <span className="input-icon"><Icon path={ICONS.MAIL} /></span>
                            <input name="email" type="email" placeholder={t('emailAddress')} required />
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? <Loader /> : (mode === 'forgot' ? t('sendResetLink') : mode === 'login' ? t('signIn') : t('signUp'))}
                    </button>
                </form>

                <div className="auth-switch">
                    {mode === 'login' ? (
                        <>
                            <p>{t('noAccount')}</p>
                            <button type="button" className="auth-switch-button" onClick={() => setMode('register')}>{t('signUpNow')}</button>
                        </>
                    ) : mode === 'register' ? (
                        <>
                            <p>{t('alreadyHaveAccount')}</p>
                            <button type="button" className="auth-switch-button" onClick={() => setMode('login')}>{t('signIn')}</button>
                        </>
                    ) : (
                        <button type="button" className="link-button" onClick={() => setMode('login')}>{t('backToSignIn')}</button>
                    )}
                </div>

                <div className="auth-language-switcher">
                    <button onClick={() => i18n.changeLanguage('en')} className={i18n.language.startsWith('en') ? 'active' : ''}>EN</button>
                    <span>/</span>
                    <button onClick={() => i18n.changeLanguage('fa')} className={i18n.language.startsWith('fa') ? 'active' : ''}>FA</button>
                </div>
            </div>
        </div>
    );
};

export default AuthView;