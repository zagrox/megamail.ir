import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { readItems, updateItem } from '@directus/sdk';
import sdk from '../api/directus';
import { apiFetch } from '../api/elasticEmail';
import { useAuth } from '../contexts/AuthContext';
import CenteredMessage from '../components/CenteredMessage';
import Loader from '../components/Loader';
import Icon, { ICONS } from '../components/Icon';

type ProcessedOrder = {
    id: string;
    note: string;
    creditsAdded?: number;
    total: number;
};

const CallbackView = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState('');
    const [processedOrder, setProcessedOrder] = useState<ProcessedOrder | null>(null);

    useEffect(() => {
        const handleCallback = async () => {
            setLoading(true);
            try {
                // Be robust: check both hash and search for parameters, as gateways can handle redirects differently.
                const hash = window.location.hash.substring(1);
                const hashQueryString = hash.split('?')[1] || '';
                const searchQueryString = window.location.search.substring(1) || '';
                const params = new URLSearchParams(hashQueryString || searchQueryString);
                
                const trackId = params.get('trackId');
                const status = params.get('status');
                const success = params.get('success');
                const orderIdParam = params.get('orderId');

                if (!trackId || !status || !success || !orderIdParam) {
                    throw new Error('Missing callback parameters.');
                }

                // Find the transaction by trackId
                const transactions = await sdk.request(readItems('transactions', {
                    filter: { trackid: { _eq: trackId } },
                    fields: ['*', 'transaction_order.*'],
                    limit: 1
                }));

                if (!transactions || transactions.length === 0) {
                    throw new Error(`Transaction with Track ID ${trackId} not found.`);
                }
                
                const transaction = transactions[0];
                const order = transaction.transaction_order;
                
                // Update the transaction status
                await sdk.request(updateItem('transactions', transaction.id, { payment_status: status }));

                const isSuccess = success === '1' && status === '2';

                if (isSuccess) {
                    // Update order status
                    await sdk.request(updateItem('orders', order.id, { order_status: 'completed' }));
                    
                    // Find package to get credit amount
                    const packages = await sdk.request(readItems('packages', {
                        filter: { packname: { _eq: order.order_note } }
                    }));
                    
                    if (!packages || packages.length === 0) {
                        throw new Error(`Package details for "${order.order_note}" not found.`);
                    }
                    const packsize = packages[0].packsize;

                    // Add credits to user's account via Elastic Email API
                    if (user && user.panelkey) {
                        await apiFetch('/account/addsubaccountcredits', user.panelkey, {
                            method: 'POST',
                            params: {
                                credits: packsize,
                                notes: `Order #${order.id} via ZibalPay. Track ID: ${trackId}`
                            }
                        });
                        setMessage(`Payment successful! ${packsize.toLocaleString()} credits have been added to your account.`);
                        setProcessedOrder({
                            id: order.id,
                            note: order.order_note,
                            creditsAdded: packsize,
                            total: order.order_total,
                        });
                    } else {
                        throw new Error("User authentication not found. Could not add credits.");
                    }
                } else {
                    // Payment failed or was canceled
                    await sdk.request(updateItem('orders', order.id, { order_status: 'failed' }));
                     setProcessedOrder({
                        id: order.id,
                        note: order.order_note,
                        total: order.order_total,
                    });
                    throw new Error('Payment was not successful.');
                }

            } catch (err: any) {
                setError(err.message || 'An unknown error occurred during payment verification.');
            } finally {
                setLoading(false);
            }
        };

        handleCallback();
    }, [user]);

    const handleReturn = () => {
        window.location.href = '/';
    };

    if (loading) {
        return (
            <CenteredMessage style={{ height: '100vh' }}>
                <Loader />
                <p style={{ marginTop: '1rem', color: 'var(--subtle-text-color)' }}>
                    Verifying your payment, please wait...
                </p>
            </CenteredMessage>
        );
    }

    return (
        <div className="auth-container">
            <div className="card" style={{ maxWidth: '500px', width: '100%', margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
                {error ? (
                    <>
                        <Icon path={ICONS.X_CIRCLE} style={{ width: 48, height: 48, color: 'var(--danger-color)', margin: '0 auto 1rem' }} />
                        <h2 style={{ color: 'var(--danger-color)' }}>{t('paymentFailed')}</h2>
                        <p style={{ color: 'var(--subtle-text-color)', maxWidth: '400px', margin: '0 auto 1.5rem' }}>{error}</p>
                        {processedOrder && (
                             <div className="table-container-simple" style={{ marginBottom: '2rem', textAlign: 'left' }}>
                                <table className="simple-table">
                                     <tbody>
                                        <tr><td>{t('orderId')}</td><td style={{textAlign: 'right'}}><strong>#{processedOrder.id}</strong></td></tr>
                                        <tr><td>{t('package')}</td><td style={{textAlign: 'right'}}><strong>{processedOrder.note}</strong></td></tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <div className="form-actions" style={{ justifyContent: 'center' }}>
                            <button onClick={handleReturn} className="btn btn-primary">{t('returnToDashboard')}</button>
                        </div>
                    </>
                ) : (
                    <>
                        <Icon path={ICONS.CHECK} style={{ width: 48, height: 48, color: 'var(--success-color)', margin: '0 auto 1rem' }} />
                        <h2 style={{ color: 'var(--success-color)' }}>{t('paymentSuccess')}</h2>
                        <p style={{ color: 'var(--subtle-text-color)', maxWidth: '400px', margin: '0 auto 1.5rem' }}>{message}</p>
                        {processedOrder && (
                            <div className="table-container-simple" style={{ marginBottom: '2rem', textAlign: 'left' }}>
                                <table className="simple-table">
                                    <tbody>
                                        <tr><td>{t('orderId')}</td><td style={{textAlign: 'right'}}><strong>#{processedOrder.id}</strong></td></tr>
                                        <tr><td>{t('package')}</td><td style={{textAlign: 'right'}}><strong>{processedOrder.note}</strong></td></tr>
                                        {processedOrder.creditsAdded && <tr><td>{t('credits')}</td><td style={{textAlign: 'right'}}><strong>+{processedOrder.creditsAdded.toLocaleString(i18n.language)}</strong></td></tr>}
                                        <tr><td>{t('total')}</td><td style={{textAlign: 'right'}}><strong>{processedOrder.total.toLocaleString(i18n.language)} {t('priceIRT')}</strong></td></tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <div className="form-actions" style={{ justifyContent: 'center' }}>
                            <button onClick={handleReturn} className="btn btn-primary">{t('returnToDashboard')}</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default CallbackView;
