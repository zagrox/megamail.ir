import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useApiV4 from '../hooks/useApiV4';
import { apiFetchV4 } from '../api/elasticEmail';
import { getPastDateByDays, getPastDateByMonths, getPastDateByYears, formatDateForApiV4 } from '../utils/helpers';
import CenteredMessage from '../components/CenteredMessage';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import StatsChart from '../components/StatsChart';
import AccountDataCard from '../components/AccountDataCard';
import Icon, { ICONS } from '../components/Icon';
import OverallActivityChart from '../components/OverallActivityChart';
import ChannelStatsTable from '../components/ChannelStatsTable';

const StatisticsView = ({ apiKey, isEmbed = false }: { apiKey: string, isEmbed?: boolean }) => {
    const { t, i18n } = useTranslation();
    const [duration, setDuration] = useState('3months');
    const [dailyData, setDailyData] = useState<any[]>([]);
    const [isChartLoading, setIsChartLoading] = useState(true);

    const durationOptions: {[key: string]: {label: string, from: () => Date}} = useMemo(() => ({
        '7days': { label: t('last7Days'), from: () => getPastDateByDays(7) },
        '14days': { label: t('last14Days'), from: () => getPastDateByDays(14) },
        '30days': { label: t('last30Days'), from: () => getPastDateByDays(30) },
        '3months': { label: t('last3Months'), from: () => getPastDateByMonths(3) },
        '6months': { label: t('last6Months'), from: () => getPastDateByMonths(6) },
        '1year': { label: t('lastYear'), from: () => getPastDateByYears(1) },
    }), [t]);

    // API call for the top aggregate cards, depends on selected duration
    const aggregateApiParams = useMemo(() => ({
        from: formatDateForApiV4(durationOptions[duration].from()) + 'Z',
    }), [duration, durationOptions]);
    const { data: aggregateStats, loading: aggregateLoading, error: aggregateError } = useApiV4(`/statistics`, apiKey, aggregateApiParams);

    // API call for the bottom "All Time" bar chart
    const { data: overallStats, loading: overallLoading, error: overallError } = useApiV4(
        `/statistics`, 
        apiKey, 
        { from: formatDateForApiV4(getPastDateByYears(10)) + 'Z' }
    );
    
    // Fetching data for the main line chart
    useEffect(() => {
        const fetchDailyData = async () => {
            if (!apiKey) return;
            setIsChartLoading(true);
            
            const fromDate = durationOptions[duration].from();
            const toDate = new Date();
            const promises = [];

            const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            let intervalDays = 1; // Daily
            if (diffDays > 180) intervalDays = 30; // Monthly for >6 months
            else if (diffDays > 30) intervalDays = 7; // Weekly for >1 month

            for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + intervalDays)) {
                const startOfPeriod = new Date(d);
                const endOfPeriod = new Date(startOfPeriod);
                endOfPeriod.setDate(endOfPeriod.getDate() + intervalDays - 1);
                
                const finalEndOfPeriod = endOfPeriod > toDate ? toDate : endOfPeriod;

                const from = new Date(startOfPeriod.setHours(0,0,0,0)).toISOString();
                const to = new Date(finalEndOfPeriod.setHours(23,59,59,999)).toISOString();
                
                promises.push(
                    apiFetchV4(`/statistics`, apiKey, { params: { from, to } })
                        .then(res => ({
                            date: startOfPeriod.toISOString().split('T')[0],
                            delivered: res.Delivered || 0,
                            opened: res.Opened || 0,
                            clicked: res.Clicked || 0,
                            bounced: res.Bounced || 0,
                        }))
                        .catch(() => ({ 
                            date: startOfPeriod.toISOString().split('T')[0],
                            delivered: 0, 
                            opened: 0, 
                            clicked: 0,
                            bounced: 0,
                        }))
                );
            }
            
            try {
                const results = await Promise.all(promises);
                setDailyData(results.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
            } catch (err) {
                console.error("Failed to fetch daily chart data", err);
                setDailyData([]);
            } finally {
                setIsChartLoading(false);
            }
        };
        
        fetchDailyData();
    }, [apiKey, duration, durationOptions]);

    const chartKeys = [
        { key: 'delivered', label: t('delivered') },
        { key: 'opened', label: t('opened') },
        { key: 'clicked', label: t('clicked') },
        { key: 'bounced', label: t('bounced') },
    ];

    const filterControl = (
        <div className="view-controls">
            <Icon path={ICONS.CALENDAR} />
            <select id="duration-select" value={duration} onChange={(e) => setDuration(e.target.value)} aria-label={t('dateRange')}>
                {Object.entries(durationOptions).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                ))}
            </select>
        </div>
    );
    
    return (
        <>
            {filterControl}

            {aggregateLoading ? (
                <CenteredMessage><Loader /></CenteredMessage>
            ) : aggregateError ? (
                <ErrorMessage error={aggregateError} />
            ) : (!aggregateStats || Object.keys(aggregateStats).length === 0) ? (
                <CenteredMessage>{t('noStatsForPeriod', { period: durationOptions[duration].label.toLowerCase() })}</CenteredMessage>
            ) : (
                <div className="card-grid account-grid" style={{ marginBottom: '1.5rem' }}>
                    <AccountDataCard title={t('totalEmails')} iconPath={ICONS.MAIL}>{aggregateStats.EmailTotal?.toLocaleString(i18n.language) ?? '0'}</AccountDataCard>
                    <AccountDataCard title={t('recipients')} iconPath={ICONS.CONTACTS}>{aggregateStats.Recipients?.toLocaleString(i18n.language) ?? '0'}</AccountDataCard>
                    <AccountDataCard title={t('delivered')} iconPath={ICONS.VERIFY}>{aggregateStats.Delivered?.toLocaleString(i18n.language) ?? '0'}</AccountDataCard>
                    <AccountDataCard title={t('opened')} iconPath={ICONS.EYE}>{aggregateStats.Opened?.toLocaleString(i18n.language) ?? '0'}</AccountDataCard>
                    <AccountDataCard title={t('clicked')} iconPath={ICONS.CLICK}>{aggregateStats.Clicked?.toLocaleString(i18n.language) ?? '0'}</AccountDataCard>
                    <AccountDataCard title={t('unsubscribed')} iconPath={ICONS.LOGOUT}>{aggregateStats.Unsubscribed?.toLocaleString(i18n.language) ?? '0'}</AccountDataCard>
                    <AccountDataCard title={t('complaints')} iconPath={ICONS.COMPLAINT}>{aggregateStats.Complaints?.toLocaleString(i18n.language) ?? '0'}</AccountDataCard>
                    <AccountDataCard title={t('bounced')} iconPath={ICONS.BOUNCED}>{aggregateStats.Bounced?.toLocaleString(i18n.language) ?? '0'}</AccountDataCard>
                </div>
            )}
            
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                {isChartLoading ? (
                    <div style={{height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Loader /></div>
                ) : (
                    <div className="stats-chart-wrapper">
                      <StatsChart data={dailyData} keys={chartKeys} period={duration} />
                    </div>
                )}
            </div>
            
            {!isEmbed && (
                <div className="overall-snapshot-grid" style={{borderTop: '1px solid var(--border-color)', marginTop: '2.5rem', paddingTop: '2.5rem'}}>
                    <div className="card">
                        <div className="channel-selector-header">
                            <h4>{t('activityOverview')}</h4>
                        </div>
                        <OverallActivityChart stats={overallStats} loading={overallLoading} error={overallError} />
                    </div>
                    <div className="card">
                         <ChannelStatsTable apiKey={apiKey} />
                    </div>
                </div>
            )}
        </>
    );
};

export default StatisticsView;