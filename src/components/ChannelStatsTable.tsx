import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import useApiV4 from '../hooks/useApiV4';
import Loader from './Loader';
import ErrorMessage from './ErrorMessage';
import CenteredMessage from './CenteredMessage';

const ChannelStatsTable = ({ apiKey }: { apiKey: string }) => {
    const { t, i18n } = useTranslation();
    const { data: channels, loading, error } = useApiV4('/statistics/channels', apiKey);
    const [selectedChannel, setSelectedChannel] = useState('');

    // When channels load, select the first one if available
    useEffect(() => {
        if (channels && Array.isArray(channels) && channels.length > 0 && !selectedChannel) {
            setSelectedChannel(channels[0].ChannelName);
        }
    }, [channels, selectedChannel]);

    const selectedChannelStats = useMemo(() => {
        if (!channels || !Array.isArray(channels) || !selectedChannel) return null;
        return channels.find(c => c.ChannelName === selectedChannel);
    }, [channels, selectedChannel]);

    const statRows = [
        { key: 'Recipients', label: t('recipients') },
        { key: 'EmailTotal', label: t('emailsSent') },
        { key: 'Delivered', label: t('delivered') },
        { key: 'Opened', label: t('opened') },
        { key: 'Clicked', label: t('clicked') },
        { key: 'Bounced', label: t('bounced') },
        { key: 'Unsubscribed', label: t('unsubscribed') },
    ];
    
    return (
        <div>
            <div className="channel-selector-header">
                <h4 style={{ flexShrink: 0, marginRight: '1rem' }}>{t('sendChannels')}</h4>
                {loading ? <Loader /> : (
                    <select
                        value={selectedChannel}
                        onChange={e => setSelectedChannel(e.target.value)}
                        disabled={!channels || channels.length === 0}
                        aria-label={t('sendChannels')}
                        style={{ maxWidth: '200px' }}
                    >
                        {channels?.map((channel: any) => (
                            <option key={channel.ChannelName} value={channel.ChannelName}>{channel.ChannelName}</option>
                        ))}
                    </select>
                )}
            </div>

            <div style={{ padding: '0 1.25rem 1.25rem' }}>
                {loading && <CenteredMessage style={{height: '280px'}}><Loader /></CenteredMessage>}
                {error && <ErrorMessage error={error} />}
                
                {!loading && !error && (!channels || channels.length === 0) && (
                    <CenteredMessage style={{height: '280px'}}>{t('noChannelData')}</CenteredMessage>
                )}

                {!loading && selectedChannelStats && (
                    <div className="table-container-simple">
                        <table>
                            <tbody>
                                {statRows.map(row => (
                                    <tr key={row.key}>
                                        <td style={{ padding: '0.9rem 1rem' }}>{row.label}</td>
                                        <td style={{ textAlign: 'right', fontWeight: '500', padding: '0.9rem 1rem' }}>
                                            {(selectedChannelStats[row.key] ?? 0).toLocaleString(i18n.language)}
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

export default ChannelStatsTable;