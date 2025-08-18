import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { readField } from '@directus/sdk';
import sdk from '../api/directus';
import { ICONS } from '../components/Icon';

export interface OrderStatusChoice {
    value: string;
    color: string;
    icon: string;
    text: string;
}

export interface MappedOrderStatus extends OrderStatusChoice {
    iconPath?: string;
}

const mapIconNameToPath = (iconName?: string): string | undefined => {
    if (!iconName) return undefined;

    // Handle special characters first
    switch(iconName) {
        case '✓': return ICONS.CHECK;
        case '⊗': return ICONS.X_CIRCLE;
        case '❇': return ICONS.LOADING_SPINNER;
    }

    const normalizedName = iconName.toUpperCase().replace(/_/g, '');
    
    switch(normalizedName) {
        case 'CHECK':
        case 'CHECKCIRCLE':
        case 'COMPLETED':
            return ICONS.CHECK;
        case 'PENDING':
        case 'HOURGLASS':
        case 'HOURGLASSEMPTY':
        case 'SCHEDULE':
            return ICONS.LOADING_SPINNER;
        case 'SYNC':
        case 'SETTINGS':
        case 'PROCESSING':
             return ICONS.LOADING_SPINNER;
        case 'CANCEL':
        case 'CLOSE':
        case 'FAILED':
        case 'ERROR':
            return ICONS.X_CIRCLE;
        default:
            const foundKey = Object.keys(ICONS).find(key => key.includes(normalizedName));
            return foundKey ? (ICONS as any)[foundKey] : undefined;
    }
};

export const useOrderStatuses = () => {
    const { t } = useTranslation();
    const [statuses, setStatuses] = useState<OrderStatusChoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStatuses = async () => {
            setLoading(true);
            setError(null);
            try {
                const fieldInfo = await sdk.request(readField('orders', 'order_status'));
                const choices = fieldInfo?.meta?.options?.choices;

                if (Array.isArray(choices)) {
                    setStatuses(choices as OrderStatusChoice[]);
                } else {
                    console.warn("Could not find choices for order_status field in Directus metadata.");
                    setStatuses([]); 
                }
            } catch (err: any) {
                console.error("Failed to fetch order statuses field info:", err);
                setError(err.message || t('unknownError'));
            } finally {
                setLoading(false);
            }
        };

        fetchStatuses();
    }, [t]);

    const statusesMap = useMemo(() => {
        if (loading || error || statuses.length === 0) {
            return {};
        }

        return statuses.reduce((acc, status) => {
            let rawText = status.text || '';
            let icon = status.icon; // Prioritize dedicated icon field

            // Regex to find special characters used as icons, at the end of the string
            const iconRegex = /[✓⊗❇]$/;
            const match = rawText.match(iconRegex);

            // If there's an embedded icon AND no dedicated icon is set
            if (match && !icon) { 
                icon = match[0];
                rawText = rawText.replace(iconRegex, '').trim();
            }
            
            // Clean text by removing translation markers. Do not perform translation.
            const cleanedText = rawText
                .replace(/^\$t:|^t:/, '')
                .replace(/\$$/, '')
                .trim();
            
            // Capitalize for display.
            const displayText = cleanedText.charAt(0).toUpperCase() + cleanedText.slice(1);

            acc[status.value] = {
                ...status,
                text: displayText,
                iconPath: mapIconNameToPath(icon),
            };
            return acc;
        }, {} as Record<string, MappedOrderStatus>);

    }, [statuses, loading, error]);

    return { statusesMap, loading, error };
};
