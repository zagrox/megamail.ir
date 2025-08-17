import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import Loader from './Loader';

const RenameModal = ({ isOpen, onClose, entityName, entityType, onSubmit }: { isOpen: boolean, onClose: () => void, entityName: string, entityType: string, onSubmit: (newName: string) => Promise<void> }) => {
    const { t } = useTranslation();
    const [newName, setNewName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setNewName(entityName);
        }
    }, [isOpen, entityName]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || newName === entityName) return;
        setIsSubmitting(true);
        await onSubmit(newName);
        setIsSubmitting(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('renameEntityType', { type: entityType, name: entityName })}>
            <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                    <label htmlFor="new-entity-name">{t('newEntityName', { type: entityType })}</label>
                    <input id="new-entity-name" type="text" value={newName} onChange={e => setNewName(e.target.value)} required disabled={isSubmitting} />
                </div>
                <div className="form-actions" style={{ marginTop: '1rem' }}>
                    <button type="button" className="btn" onClick={onClose} disabled={isSubmitting}>{t('cancel')}</button>
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting || !newName || newName === entityName}>
                        {isSubmitting ? <Loader /> : t('saveChanges')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default RenameModal;
