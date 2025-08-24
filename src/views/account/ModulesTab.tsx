
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import useModules from '../../hooks/useModules';
import { useAuth } from '../../contexts/AuthContext';
import { Module } from '../../api/types';
import UnlockModuleModal from '../../components/UnlockModuleModal';
import Loader from '../../components/Loader';
import Icon, { ICONS } from '../../components/Icon';
import CenteredMessage from '../../components/CenteredMessage';
import ErrorMessage from '../../components/ErrorMessage';
import Badge from '../../components/Badge';
import { useToast } from '../../contexts/ToastContext';

interface ModulesTabProps {
    setView: (view: string) => void;
}

const ModuleCard = ({ module, isUnlocked, onUnlock, onInstantUnlock, isUnlocking }: { module: Module, isUnlocked: boolean, onUnlock: () => void, onInstantUnlock: () => void, isUnlocking: boolean }) => {
    const { t, i18n } = useTranslation();

    const handleUnlockClick = () => {
        if (module.moduleprice === 0) {
            onInstantUnlock();
        } else {
            onUnlock();
        }
    };
    
    const isPromo = module.modulepro && module.modulediscount && module.modulediscount > module.moduleprice;

    return (
        <div className="card">
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>{module.modulename}</h3>
                    {isUnlocked && <Badge text={t('unlocked')} type="success" iconPath={ICONS.LOCK_OPEN} />}
                </div>
                <p style={{ color: 'var(--subtle-text-color)', flexGrow: 1, margin: 0, minHeight: '60px' }}>
                    {module.moduledetails}
                </p>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '1rem',
                    marginTop: 'auto'
                }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
                        {isPromo && (
                            <span style={{ textDecoration: 'line-through', color: 'var(--subtle-text-color)', fontSize: '1rem', fontWeight: 'normal' }}>
                                {module.modulediscount?.toLocaleString(i18n.language)}
                            </span>
                        )}
                        <span style={{ fontWeight: 600, fontSize: '1.2rem' }}>
                            {module.moduleprice > 0 ? `${module.moduleprice.toLocaleString(i18n.language)} ${t('credits')}` : 'Free'}
                        </span>
                    </div>

                    {!isUnlocked && (
                        <button className="btn btn-primary" onClick={handleUnlockClick} disabled={isUnlocking}>
                            {isUnlocking ? <Loader /> : (
                                <>
                                    <Icon path={ICONS.LOCK} />
                                    <span>{t('unlock')}</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};


const ModulesTab: React.FC<ModulesTabProps> = ({ setView }) => {
    const { t } = useTranslation();
    const { modules, loading: modulesLoading, error: modulesError } = useModules();
    const { hasModuleAccess, purchaseModule } = useAuth();
    const { addToast } = useToast();
    const [moduleToUnlock, setModuleToUnlock] = useState<Module | null>(null);
    const [unlockingModuleId, setUnlockingModuleId] = useState<string | null>(null);

    const handleInstantUnlock = async (module: Module) => {
        setUnlockingModuleId(module.id);
        try {
            await purchaseModule(module.id);
            addToast(`Module "${module.modulename}" unlocked successfully!`, 'success');
        } catch (err: any) {
            addToast(err.message || 'Failed to unlock module.', 'error');
        } finally {
            setUnlockingModuleId(null);
        }
    };

    if (modulesLoading) {
        return <CenteredMessage><Loader /></CenteredMessage>;
    }

    if (modulesError) {
        return <ErrorMessage error={{ endpoint: 'GET /items/modules', message: modulesError }} />;
    }

    return (
        <div className="account-tab-content">
            {moduleToUnlock && (
                <UnlockModuleModal
                    module={moduleToUnlock}
                    onClose={() => setModuleToUnlock(null)}
                    setView={setView}
                />
            )}

            <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                {modules?.map(module => (
                    <ModuleCard
                        key={module.id}
                        module={module}
                        isUnlocked={hasModuleAccess(module.modulename)}
                        onUnlock={() => setModuleToUnlock(module)}
                        onInstantUnlock={() => handleInstantUnlock(module)}
                        isUnlocking={unlockingModuleId === module.id}
                    />
                ))}
            </div>
        </div>
    );
};

export default ModulesTab;