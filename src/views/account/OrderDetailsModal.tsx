import React from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../components/Modal';
import { formatDateForDisplay } from '../../utils/helpers';
import Badge from '../../components/Badge';
import Icon, { ICONS } from '../../components/Icon';
import { useOrderStatuses } from '../../hooks/useOrderStatuses';
import { useStatusStyles } from '../../hooks/useStatusStyles';

const OrderDetailsModal = ({ isOpen, onClose, order }: { isOpen: boolean, onClose: () => void, order: any }) => {
    const { t, i18n } = useTranslation();
    const { statusesMap, loading: statusesLoading } = useOrderStatuses();
    const { getStatusStyle } = useStatusStyles();

    const getPaymentStatusBadge = (status: string) => {
        const numStatus = Number(status);
        if (numStatus === 2) return getStatusStyle('Success');
        if (numStatus < 0) return getStatusStyle('Failed');
        return getStatusStyle('Pending');
    };

    const showPayButton = ['pending', 'failed'].includes(order.order_status);
    const lastTransaction = order.transactions?.length > 0 ? order.transactions[order.transactions.length - 1] : null;
    const paymentUrl = lastTransaction ? `https://gateway.zibal.ir/start/${lastTransaction.trackid}` : '#';

    const orderStatus = order.order_status;
    const statusInfo = !statusesLoading ? statusesMap[orderStatus] : null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${t('orderDetails')}`}>
            <div className="table-container-simple" style={{ marginBottom: '1.5rem' }}>
                <table className="simple-table">
                    <tbody>
                        <tr><td>{t('orderId')}</td><td style={{ textAlign: 'right' }}><strong>#{order.id}</strong></td></tr>
                        <tr><td>{t('date')}</td><td style={{ textAlign: 'right' }}>{formatDateForDisplay(order.date_created, i18n.language)}</td></tr>
                        <tr><td>{t('description')}</td><td style={{ textAlign: 'right' }}>{order.order_note}</td></tr>
                        <tr><td>{t('totalAmount')}</td><td style={{ textAlign: 'right' }}><strong>{order.order_total.toLocaleString(i18n.language)} {t('priceIRT')}</strong></td></tr>
                        <tr>
                            <td>{t('status')}</td>
                            <td style={{ textAlign: 'right' }}>
                                {statusInfo ? (
                                    <Badge text={statusInfo.text} color={statusInfo.color} iconPath={statusInfo.iconPath} />
                                ) : (
                                    (() => {
                                        const fallbackStyle = getStatusStyle(orderStatus);
                                        return <Badge text={fallbackStyle.text} type={fallbackStyle.type} iconPath={fallbackStyle.iconPath} />;
                                    })()
                                )}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h4>{t('transactions')}</h4>
            <div className="table-container-simple">
                <table className='simple-table'>
                    <thead>
                        <tr>
                            <th>Track ID</th>
                            <th>Gateway Status</th>
                            <th>Gateway Message</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.transactions && order.transactions.length > 0 ? (
                            order.transactions.map((tx: any) => {
                                const statusStyle = getPaymentStatusBadge(tx.payment_status);
                                return (
                                    <tr key={tx.id}>
                                        <td>{tx.trackid}</td>
                                        <td>
                                            <Badge text={tx.payment_status || 'N/A'} type={statusStyle.type} iconPath={statusStyle.iconPath} />
                                        </td>
                                        <td>{tx.transaction_message}</td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={3} style={{ textAlign: 'center', padding: '1.5rem' }}>{t('noTransactionsFound')}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="form-actions" style={{ justifyContent: 'space-between', paddingTop: '1.5rem' }}>
                <button className="btn" onClick={onClose}>{t('close')}</button>
                {showPayButton && lastTransaction && (
                    <a href={paymentUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                        <Icon path={ICONS.LOCK_OPEN} />
                        <span>{t('payNow')}</span>
                    </a>
                )}
            </div>
        </Modal>
    );
};

export default OrderDetailsModal;
