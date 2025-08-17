import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { readItems } from '@directus/sdk';
import sdk from '../../api/directus';
import { useAuth } from '../../contexts/AuthContext';
import CenteredMessage from '../../components/CenteredMessage';
import Loader from '../../components/Loader';
import ErrorMessage from '../../components/ErrorMessage';
import Icon, { ICONS } from '../../components/Icon';
import OrderDetailsModal from './OrderDetailsModal';
import { formatDateRelative } from '../../utils/helpers';
import Badge from '../../components/Badge';

const OrdersTab = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<{ message: string, endpoint: string } | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

    useEffect(() => {
        if (!user || !user.id) {
            setLoading(false);
            return;
        }

        const fetchOrders = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await sdk.request(readItems('orders', {
                    filter: { user_created: { _eq: user.id } },
                    sort: ['-date_created'],
                    fields: ['*', 'transactions.*']
                }));
                setOrders(response);
            } catch (err: any) {
                console.error("Failed to fetch orders:", err);
                
                // This function safely extracts a string message from various error formats.
                const getErrorMessage = (error: any): string => {
                    // Directus SDK error format
                    if (error?.errors?.[0]?.message) {
                        return error.errors[0].message;
                    }
                    // Standard Error or object with a message property
                    if (error?.message) {
                        // If message is an object, stringify it to avoid [object Object]
                        return typeof error.message === 'string' ? error.message : JSON.stringify(error.message);
                    }
                    // If the error itself is a string
                    if (typeof error === 'string') {
                        return error;
                    }
                    // Fallback for other unexpected error structures
                    return t('unknownError');
                };

                const errorMessage = getErrorMessage(err);
                setError({ message: errorMessage, endpoint: 'GET /items/orders' });
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [user, t]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed': return 'success';
            case 'pending': return 'warning';
            case 'failed': return 'danger';
            default: return 'default';
        }
    };

    if (loading) {
        return <CenteredMessage><Loader /></CenteredMessage>;
    }

    if (error) {
        return <ErrorMessage error={error} />;
    }

    return (
        <div className="account-tab-card">
            {selectedOrder && (
                <OrderDetailsModal
                    isOpen={!!selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    order={selectedOrder}
                />
            )}
            <div className="account-tab-card-header">
                <h3>{t('orders')}</h3>
            </div>
            <div className="account-tab-card-body" style={{ padding: 0 }}>
                {orders.length === 0 ? (
                    <CenteredMessage>{t('noOrdersFound')}</CenteredMessage>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>{t('description')}</th>
                                    <th>{t('date')}</th>
                                    <th>{t('totalAmount')}</th>
                                    <th>{t('status')}</th>
                                    <th style={{ textAlign: 'right' }}>{t('action')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <tr key={order.id}>
                                        <td>{order.order_note}</td>
                                        <td>{formatDateRelative(order.date_created, i18n.language)}</td>
                                        <td>{order.order_total.toLocaleString(i18n.language)} {t('priceIRT')}</td>
                                        <td><Badge text={order.order_status} type={getStatusBadge(order.order_status)} /></td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button className="btn-icon btn-icon-primary" onClick={() => setSelectedOrder(order)} aria-label={t('orderDetails')}>
                                                <Icon path={ICONS.EYE} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrdersTab;
