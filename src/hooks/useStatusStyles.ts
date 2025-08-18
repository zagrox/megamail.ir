import { useTranslation } from 'react-i18next';
import { ICONS } from '../components/Icon';

export type StatusStyle = {
    text: string;
    type: 'success' | 'warning' | 'danger' | 'info' | 'default';
    iconPath?: string;
};

// This hook provides consistent styling for status badges across the app.
export const useStatusStyles = () => {
    const { t } = useTranslation();

    const getStatusStyle = (status: string | undefined): StatusStyle => {
        const originalStatus = status || t('unknown');
        const normalizedStatus = String(status || 'unknown').toLowerCase().replace(/\s/g, '');

        // Map various status strings to a standardized style type
        switch (normalizedStatus) {
            // Success states
            case 'active':
            case 'completed':
            case 'verified':
            case 'delivered':
            case 'engaged':
            case 'success':
                return { text: originalStatus, type: 'success', iconPath: ICONS.CHECK };

            // Warning / In-progress states
            case 'pending':
            case 'paused':
            case 'transactional':
            case 'checking':
                return { text: originalStatus, type: 'warning', iconPath: ICONS.LOADING_SPINNER };
            
            case 'missing':
            case 'notverified':
                return { text: originalStatus, type: 'warning' };

            // Info states
            case 'processing':
            case 'sending':
            case 'inprogress':
            case 'draft':
            case 'review':
            case 'info':
                 return { text: originalStatus, type: 'info', iconPath: ICONS.LOADING_SPINNER };

            // Danger / Error states
            case 'inactive':
            case 'failed':
            case 'cancelled':
            case 'deleted':
            case 'bounced':
            case 'abuse':
            case 'unsubscribed':
            case 'complaints':
            case 'manualcancel':
            case 'notdelivered':
            case 'invalid':
                return { text: originalStatus, type: 'danger', iconPath: ICONS.X_CIRCLE };
            
            // Default
            default:
                return { text: originalStatus, type: 'default' };
        }
    };

    return { getStatusStyle };
};
