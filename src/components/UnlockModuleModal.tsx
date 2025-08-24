import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import useApi from '../views/useApi';
import { Module } from '../api/types';
import Modal from './Modal';
import Loader from './Loader';
import Icon, { ICONS } from './Icon';

interface UnlockModuleModalProps {
    module: Module | null;
    onClose: () => void;
    setView: (view: string) => void;
}

const UnlockModuleModal: React.FC<UnlockModuleModalProps> = ({ module, onClose, setView }) => {
    const { t, i18n } = useTranslation();
    const { user, purchaseModule } = useAuth();
    const { addToast } = useToast();
    const { data: accountData, loading: balanceLoading } = useApi('/account/load', user?.elastickey || '', {}, user?.elastickey ? 1 : 0);
    const [isPurchasing, setIsPurchasing] = useState(false);

    if (!module) return null;

    const userBalance = accountData?.emailcredits ?? 0;
    const hasEnoughCredits = userBalance >= module.moduleprice;
    const isPromo = module.modulepro && module.modulediscount && module.modulediscount > module.moduleprice;

    const handlePurchase = async () => {
        setIsPurchasing(true);
        try {
            await purchaseModule(module.id);
            addToast(t('unlockModuleSuccess', { moduleName: module.modulename }), 'success');
            onClose();
        } catch (err: any) {
            addToast(err.message || t('unlockModuleError'), 'error');
        } finally {
            setIsPurchasing(false);
        }
    };

    const handleGoToBuyCredits = () => {
        onClose();
        setView('Buy Credits');
    };

    return (
        <Modal isOpen={!!module} onClose={onClose} title={`${t('unlock')} ${module.modulename}`}>
            <div style={{ textAlign: 'center', padding: '1rem' }}>
                <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{module.modulename}</h2>
                <p style={{ color: 'var(--subtle-text-color)', maxWidth: '400px', margin: '0 auto 2rem' }}>
                    {module.moduledetails}
                </p>

                <div style={{
                    backgroundColor: 'var(--subtle-background)',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    marginBottom: '2rem',
                    border: '1px solid var(--border-color)'
                }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--subtle-text-color)' }}>{t('unlockModalPriceLabel')}</div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                           {isPromo && (
                                <span style={{ textDecoration: 'line-through', color: 'var(--subtle-text-color)', fontSize: '1.5rem', fontWeight: 'normal' }}>
                                    {module.modulediscount?.toLocaleString(i18n.language)}
                                </span>
                            )}
                            <span>
                                {module.moduleprice.toLocaleString(i18n.language)} {t('credits')}
                            </span>
                        </div>
                    </div>
                    <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1rem 0' }} />
                    <div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--subtle-text-color)' }}>{t('yourBalanceLabel')}</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 500 }}>
                            {balanceLoading ? <Loader /> : `${userBalance.toLocaleString(i18n.language)} ${t('credits')}`}
                        </div>
                    </div>
                </div>

                <div className="form-actions" style={{ justifyContent: 'center', gap: '1rem', paddingTop: 0 }}>
                    <button className="btn" onClick={onClose} disabled={isPurchasing}>{t('cancel')}</button>
                    {hasEnoughCredits ? (
                        <button className="btn btn-primary" onClick={handlePurchase} disabled={isPurchasing || balanceLoading}>
                            {isPurchasing ? <Loader /> : t('unlockForCredits', { amount: module.moduleprice.toLocaleString(i18n.language) })}
                        </button>
                    ) : (
                        <button className="btn btn-primary" onClick={handleGoToBuyCredits} disabled={balanceLoading}>
                            {t('buyCredits')}
                        </button>
                    )}
                </div>
                 {!balanceLoading && !hasEnoughCredits &&
                    <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--danger-color)'}}>
                        {t('notEnoughCredits', { amount: (module.moduleprice - userBalance).toLocaleString(i18n.language)})}
                    </p>
                }
            </div>
        </Modal>
    );
};

export default UnlockModuleModal;
