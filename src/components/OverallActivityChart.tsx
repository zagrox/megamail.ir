import React from 'react';
import { useTranslation } from 'react-i18next';
import CenteredMessage from './CenteredMessage';
import Loader from './Loader';
import ErrorMessage from './ErrorMessage';
import { formatAxisLabel } from '../utils/helpers';

const BAR_CHART_COLORS: { [key: string]: string } = {
    Delivered: '#3B82F6', // Blue
    Opened: '#10B981', // Green
    Bounced: '#64748B', // Slate
    Clicked: '#F59E0B', // Amber
    Unsubscribed: '#8B5CF6', // Violet
    Complaints: '#EF4444', // Red
};

const OverallActivityChart = ({ stats, loading, error }: { stats: any, loading: boolean, error: any }) => {
    const { t, i18n } = useTranslation();

    if (loading) return <CenteredMessage style={{height: '350px'}}><Loader /></CenteredMessage>;
    if (error) return <ErrorMessage error={error} />;
    if (!stats || Object.keys(stats).length === 0 || !stats.Delivered) {
        return <CenteredMessage style={{height: '350px'}}>{t('noOverallActivity')}</CenteredMessage>;
    }

    const chartData = [
        { name: t('delivered'), value: stats.Delivered ?? 0, color: BAR_CHART_COLORS.Delivered },
        { name: t('opened'), value: stats.Opened ?? 0, color: BAR_CHART_COLORS.Opened },
        { name: t('clicked'), value: stats.Clicked ?? 0, color: BAR_CHART_COLORS.Clicked },
        { name: t('bounced'), value: stats.Bounced ?? 0, color: BAR_CHART_COLORS.Bounced },
        { name: t('unsubscribed'), value: stats.Unsubscribed ?? 0, color: BAR_CHART_COLORS.Unsubscribed },
        { name: t('complaints'), value: stats.Complaints ?? 0, color: BAR_CHART_COLORS.Complaints },
    ].sort((a, b) => b.value - a.value);

    const maxValue = Math.max(...chartData.map(d => d.value), 1);
    
    return (
        <div style={{ padding: '1.25rem' }}>
            {/* Chart Grid */}
            <div style={{ height: '300px', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem' }}>
                {/* Y-Axis Labels */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: '1.5rem', textAlign: 'right' }}>
                    {[...Array(5)].map((_, i) => (
                        <span key={i} style={{ fontSize: '0.75rem', color: 'var(--subtle-text-color)' }}>
                            {formatAxisLabel(Math.round(maxValue - (i * (maxValue / 4))), i18n.language)}
                        </span>
                    ))}
                </div>

                {/* Chart Area with Bars */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: `repeat(${chartData.length}, 1fr)`,
                    gap: '4%',
                    padding: '0 2%',
                    borderLeft: '1px solid var(--border-color)', 
                    borderBottom: '1px solid var(--border-color)',
                    position: 'relative'
                }}>
                    {/* Background Grid Lines */}
                    {[...Array(4)].map((_, i) => (
                         <div key={i} style={{
                            position: 'absolute',
                            top: `${(i/4) * 100}%`,
                            left: 0,
                            width: '100%',
                            height: '1px',
                            backgroundColor: 'var(--border-color)',
                            opacity: 0.5,
                            zIndex: 0
                        }}></div>
                    ))}
                    
                    {/* Bars */}
                    {chartData.map(item => (
                        <div key={item.name} style={{ display: 'flex', alignItems: 'flex-end', zIndex: 1 }}>
                            <div 
                                title={`${item.name}: ${item.value.toLocaleString(i18n.language)}`}
                                style={{
                                    width: '100%',
                                    height: `${(item.value / maxValue) * 100}%`,
                                    backgroundColor: item.color,
                                    borderRadius: '4px 4px 0 0',
                                    transition: 'height 0.3s ease-out',
                                    minHeight: '2px'
                                }}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* X-Axis Labels / Legend */}
            <div className="chart-legend">
                {chartData.map(item => (
                    <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '12px', height: '12px', backgroundColor: item.color, borderRadius: '3px', flexShrink: 0 }}></span>
                        <span>{item.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default OverallActivityChart;