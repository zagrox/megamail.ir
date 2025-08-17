import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import Loader from './Loader';
import Icon, { ICONS } from './Icon';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void> | void;
    title: string;
    children: React.ReactNode;
    confirmText?: string;
    confirmIcon?: string;
    isDestructive?: boolean;
}

const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    children,
    confirmText,
    confirmIcon = ICONS.DELETE,
    isDestructive = true,
}: ConfirmModalProps) => {
    const { t } = useTranslation();
    const [isConfirming, setIsConfirming] = useState(false);

    const handleConfirm = async () => {
        setIsConfirming(true);
        try {
            await onConfirm();
        } catch (error) {
            console.error("Confirmation action failed:", error);
            // Error handling is expected to be managed by the parent component that calls onConfirm
        } finally {
            // The parent component is responsible for closing the modal
            // by setting the isOpen prop to false, typically after the async action completes.
            setIsConfirming(false);
        }
    };

    // Reset loading state when modal is closed externally
    React.useEffect(() => {
        if (!isOpen) {
            setIsConfirming(false);
        }
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="modal-form">
                <div style={{ marginBottom: '1.5rem', lineHeight: '1.6' }}>
                    {children}
                </div>
                <div className="form-actions">
                    <button
                        type="button"
                        className="btn"
                        onClick={onClose}
                        disabled={isConfirming}
                    >
                        {t('cancel')}
                    </button>
                    <button
                        type="button"
                        className={`btn ${isDestructive ? 'btn-danger' : 'btn-primary'}`}
                        onClick={handleConfirm}
                        disabled={isConfirming}
                    >
                        {isConfirming ? (
                            <Loader />
                        ) : (
                            <>
                                <Icon path={confirmIcon} />
                                <span>{confirmText || t('delete')}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmModal;
