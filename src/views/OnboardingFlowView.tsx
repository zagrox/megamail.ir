

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../api/elasticEmail';
import { useToast } from '../contexts/ToastContext';
import Loader from '../components/Loader';
import Icon, { ICONS } from '../components/Icon';

const TOTAL_STEPS = 4;

const Step1 = () => {
    const { t } = useTranslation();
    return (
        <div className="onboarding-step">
            <h2>{t('welcomeTitle')}</h2>
            <p>{t('welcomeSubtitle')}</p>
        </div>
    );
};

const Step2 = () => {
    const { t } = useTranslation();
    const features = [
        { icon: ICONS.SEND_EMAIL, title: t('emailBuilder'), desc: t('emailBuilderDesc') },
        { icon: ICONS.CONTACTS, title: t('contacts'), desc: t('contactsDesc') },
        { icon: ICONS.STATISTICS, title: t('statistics'), desc: t('statisticsDesc') },
        { icon: ICONS.CAMPAIGNS, title: t('campaigns'), desc: t('campaignsDesc') },
    ];
    return (
        <div className="onboarding-step">
            <h2>{t('featuresTitle')}</h2>
            <p>{t('featuresSubtitle')}</p>
            <div className="feature-grid">
                {features.map(f => (
                    <div className="feature-card" key={f.title}>
                        <Icon path={f.icon} />
                        <div>
                            <h4>{f.title}</h4>
                            <p>{f.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const Step3 = ({ data, setData }: { data: any, setData: Function }) => {
    const { t } = useTranslation();
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setData({ ...data, [e.target.name]: e.target.value });
    };
    return (
        <div className="onboarding-step">
            <h2>{t('profileTitle')}</h2>
            <p>{t('profileSubtitle')}</p>
            <form className="auth-form" style={{maxWidth: '400px', margin: '0 auto'}}>
                <div className="form-group">
                    <label htmlFor="company">{t('company')}</label>
                    <input id="company" name="company" type="text" value={data.company} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="website">{t('website')}</label>
                    <input id="website" name="website" type="url" value={data.website} onChange={handleChange} />
                </div>
                 <div className="form-group">
                    <label htmlFor="mobile">{t('mobile')}</label>
                    <input id="mobile" name="mobile" type="tel" value={data.mobile} onChange={handleChange} />
                </div>
            </form>
        </div>
    );
};

const Step4 = () => {
    const { t } = useTranslation();
    return (
        <div className="onboarding-step">
            <h2>{t('finalizeSetupTitle')}</h2>
            <p>{t('finalizeSetupSubtitle')}</p>
        </div>
    );
};

const OnboardingFlowView = ({ onComplete }: { onComplete: () => void }) => {
    const { t } = useTranslation();
    const { user, updateUser, createElasticSubaccount } = useAuth();
    const { addToast } = useToast();
    
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [demoLoading, setDemoLoading] = useState(false);

    // Step 3 state
    const [profileData, setProfileData] = useState({
        mobile: user?.mobile || '',
        website: user?.website || '',
        company: user?.company || '',
    });

    // Step 4 state (including fallback)
    const [apiKey, setApiKey] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [newUserFlowFailed, setNewUserFlowFailed] = useState(false);

    const handleNext = () => setStep(s => Math.min(s + 1, TOTAL_STEPS));
    const handleBack = () => setStep(s => Math.max(s - 1, 1));

    const handleProfileSubmit = async () => {
        setLoading(true);
        try {
            await updateUser(profileData);
            addToast(t('profileUpdateSuccess'), 'success');
            handleNext();
        } catch (err: any) {
            addToast(t('profileUpdateError', { error: err.message }), 'error');
        } finally {
            setLoading(false);
        }
    };
    
    // This is the manual API key submission for the *fallback* case.
    const handleApiKeySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await apiFetch('/account/load', apiKey); // Validate key
            await updateUser({ elastickey: apiKey });
            addToast(t('apiKeyUpdateSuccess'), 'success');
            onComplete();
        } catch (err: any) {
            addToast(err.message || t('invalidApiKey'), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDemoLogin = async () => {
        setDemoLoading(true);
        const DEMO_API_KEY = 'CAA7DE853FEDA01F7D314E018B78FFD163F0C328F93352CAF663C2BDA732CBE91C7E0A6E218464A17EDD5A474668EBE5';
        try {
            await apiFetch('/account/load', DEMO_API_KEY); // Validate key
            await updateUser({ elastickey: DEMO_API_KEY });
            addToast('Welcome to the demo version!', 'success');
            onComplete();
        } catch (err: any) {
            addToast(err.message || t('invalidApiKey'), 'error');
        } finally {
            setDemoLoading(false);
        }
    };

    // This is the primary action for step 4, triggering the unified backend flow.
    const handleFinalizeSetup = async () => {
        if (!user || !user.email) {
            addToast('User email not found. Cannot create account.', 'error');
            return;
        }

        setLoading(true);
        setNewUserFlowFailed(false); // Reset on new attempt
        try {
            // This password is for the new Elastic Email subaccount, not the user's Directus password.
            // It's temporary and the user will use an API key to interact with the system.
            const randomPassword = Math.random().toString(36).slice(-12);
            await createElasticSubaccount(user.email, randomPassword);
            // The createElasticSubaccount function in AuthContext handles refreshing the user data,
            // which will make the user?.elastickey available and exit the onboarding flow.
            addToast('Your Mailzila account has been connected!', 'success');
        } catch (err: any) {
            addToast(err.message, 'error');
            setNewUserFlowFailed(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="onboarding-container">
            <div className="onboarding-box">
                <div className="onboarding-progress">
                    <div className="progress-bar-wrapper">
                        <div className="progress-bar-inner" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}></div>
                    </div>
                </div>
                <div className="onboarding-content">
                    {step === 1 && <Step1 />}
                    {step === 2 && <Step2 />}
                    {step === 3 && <Step3 data={profileData} setData={setProfileData} />}
                    {step === 4 && (
                        <div className="onboarding-step">
                            <Step4 />
                            {newUserFlowFailed && (
                                <form className="onboarding-api-key-form" onSubmit={handleApiKeySubmit}>
                                    <div className="info-message warning" style={{textAlign: 'left', maxWidth: '400px', margin: '2rem auto 0'}}>
                                        <strong>{t('setupFailed')}</strong>
                                        <p>{t('setupFailedManualPrompt')}</p>
                                    </div>
                                    <div className="input-group has-btn" style={{ maxWidth: '400px', margin: '1rem auto 0' }}>
                                        <span className="input-icon"><Icon path={ICONS.KEY} /></span>
                                        <input name="apikey" type={showPassword ? "text" : "password"} placeholder={t('enterYourApiKey')} required value={apiKey} onChange={e => setApiKey(e.target.value)} />
                                        <button type="button" className="input-icon-btn" onClick={() => setShowPassword(!showPassword)}>
                                            <Icon path={showPassword ? ICONS.EYE_OFF : ICONS.EYE} />
                                        </button>
                                    </div>
                                    <div className="form-actions" style={{ justifyContent: 'center', border: 'none', padding: '1rem 0 0', flexDirection: 'column', maxWidth: '400px', margin: '0 auto' }}>
                                        <button type="submit" className="btn btn-primary full-width" disabled={loading || demoLoading} style={{ marginBottom: '0.75rem' }}>
                                            {loading ? <Loader /> : t('verifyAndFinish')}
                                        </button>
                                        <button type="button" className="btn btn-secondary full-width" onClick={handleDemoLogin} disabled={loading || demoLoading}>
                                            {demoLoading ? <Loader /> : t('visitDemo')}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}
                </div>
                <div className="onboarding-actions">
                    <button className="btn btn-secondary" onClick={handleBack} disabled={step === 1 || loading || demoLoading} style={{ visibility: step > 1 ? 'visible' : 'hidden' }}>
                        {t('back')}
                    </button>
                    {step < 3 && <button className="btn btn-primary" onClick={handleNext}>{step === 1 ? t('getStarted') : t('nextStep')}</button>}
                    {step === 3 && <button className="btn btn-primary" onClick={handleProfileSubmit} disabled={loading}>{loading ? <Loader/> : t('saveAndContinue')}</button>}
                    {step === 4 && !newUserFlowFailed && (
                        <button className="btn btn-primary" onClick={handleFinalizeSetup} disabled={loading}>
                            {loading ? <Loader /> : t('finishSetup')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OnboardingFlowView;