

import React, { useState, useMemo } from 'react';
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
    const [showOnlyActive, setShowOnlyActive] = useState(false);
    const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

    const handleInstantUnlock = async (module: Module) => {
        setUnlockingModuleId(module.id);
        try {
            await purchaseModule(module.id);
            addToast(t('unlockModuleSuccess', { moduleName: module.modulename }), 'success');
        } catch (err: any) {
            addToast(err.message || t('unlockModuleError'), 'error');
        } finally {
            setUnlockingModuleId(null);
        }
    };

    const filteredModules = useMemo(() => {
        if (!modules) return [];
        if (showOnlyActive) {
            return modules.filter(module => hasModuleAccess(module.modulename));
        }
        return modules;
    }, [modules, showOnlyActive, hasModuleAccess]);

    if (modulesLoading) {
        return <CenteredMessage><Loader /></CenteredMessage>;
    }

    if (modulesError) {
        return <ErrorMessage error={{ endpoint: 'GET /items/modules', message: modulesError }} />;
    }
    
    const renderTable = () => (
        <div className="table-container">
            <table>
                <thead>
                    <tr>
                        <th>{t('name')}</th>
                        <th>{t('description')}</th>
                        <th>{t('price')}</th>
                        <th style={{ textAlign: 'right' }}>{t('status')}</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredModules?.map(module => (
                        <tr key={module.id}>
                            <td><strong>{module.modulename}</strong></td>
                            <td>{module.moduledetails}</td>
                            <td>
                                {module.moduleprice > 0 
                                    ? `${module.moduleprice.toLocaleString()} ${t('credits')}` 
                                    : 'Free'
                                }
                            </td>
                            <td style={{ textAlign: 'right' }}>
                                {hasModuleAccess(module.modulename) ? (
                                    <Badge text={t('unlocked')} type="success" iconPath={ICONS.LOCK_OPEN} />
                                ) : (
                                    <button 
                                        className="btn" 
                                        onClick={() => module.moduleprice === 0 ? handleInstantUnlock(module) : setModuleToUnlock(module)}
                                        disabled={unlockingModuleId === module.id}
                                    >
                                        {unlockingModuleId === module.id ? <Loader /> : t('unlock')}
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderCards = () => (
        <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {filteredModules?.map(module => (
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
    );

    return (
        <div className="account-tab-content">
            {moduleToUnlock && (
                <UnlockModuleModal
                    module={moduleToUnlock}
                    onClose={() => setModuleToUnlock(null)}
                    setView={setView}
                />
            )}

            <div className="view-header" style={{marginBottom: '2rem'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: 0 }}>
                        <label className="toggle-switch">
                            <input type="checkbox" checked={showOnlyActive} onChange={e => setShowOnlyActive(e.target.checked)} />
                            <span className="toggle-slider"></span>
                        </label>
                         <label style={{ marginBottom: 0, fontWeight: 500 }}>{t('showActiveOnly')}</label>
                    </div>
                </div>
                <div className="header-actions">
                     <div className="view-switcher">
                        <button onClick={() => setViewMode('card')} className={`view-mode-btn ${viewMode === 'card' ? 'active' : ''}`} aria-label={t('cardView')}>
                            <Icon path={ICONS.DASHBOARD} />
                        </button>
                        <button onClick={() => setViewMode('table')} className={`view-mode-btn ${viewMode === 'table' ? 'active' : ''}`} aria-label={t('tableView')}>
                            <Icon path={ICONS.EMAIL_LISTS} />
                        </button>
                    </div>
                </div>
            </div>

            {viewMode === 'card' ? renderCards() : renderTable()}
        </div>
    );
};

export default ModulesTab;
