
import React, { useEffect } from 'react';
import Icon, { ICONS } from './Icon';

interface ActionStatusProps {
    status: { type: 'success' | 'error'; message: string } | null;
    onDismiss: () => void;
}

const ActionStatus: React.FC<ActionStatusProps> = ({ status, onDismiss }) => {
    useEffect(() => {
        if (status) {
            const timer = setTimeout(() => {
                onDismiss();
            }, 5000); // Auto-dismiss after 5 seconds

            return () => clearTimeout(timer);
        }
    }, [status, onDismiss]);

    if (!status) {
        return null;
    }

    const config = {
        success: { icon: ICONS.CHECK, className: 'success' },
        error: { icon: ICONS.X_CIRCLE, className: 'danger' },
    };

    const currentConfig = config[status.type];

    return (
        <div className={`action-status info-message ${currentConfig.className}`} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
            <Icon path={currentConfig.icon} />
            <p style={{ margin: '0 0.75rem', flexGrow: 1 }}>{status.message}</p>
            <button onClick={onDismiss} className="btn-icon" style={{alignSelf: 'center'}}>
                <Icon path={ICONS.DELETE} />
            </button>
        </div>
    );
};

export default ActionStatus;
