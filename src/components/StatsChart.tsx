import React, { useState, useRef, useLayoutEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { formatAxisLabel } from '../utils/helpers';
import Loader from './Loader';
import CenteredMessage from './CenteredMessage';

const CHART_MARGIN = { top: 20, right: 20, bottom: 30, left: 60 };
const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6366F1'];

type TooltipData = {
    x: number;
    y: number;
    visible: boolean;
    data: { label: string; value: number; color: string; }[];
    date: string;
}

const StatsChart = ({ data, keys, period, yAxisLabel = "Total" }: { data: any[]; keys: { key: string, label: string }[]; period: string; yAxisLabel?: string; }) => {
    const { effectiveTheme } = useTheme();
    const { i18n } = useTranslation();
    const containerRef = useRef<HTMLDivElement>(null);
    const [tooltip, setTooltip] = useState<TooltipData>({ x: 0, y: 0, visible: false, data: [], date: '' });
    const [dimensions, setDimensions] = useState({ width: 0, height: 350 });

    useLayoutEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                setDimensions({ width: containerRef.current.offsetWidth, height: 350 });
            }
        };
        window.addEventListener('resize', updateSize);
        updateSize();
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    const { width, height } = dimensions;
    const chartWidth = width - CHART_MARGIN.left - CHART_MARGIN.right;
    const chartHeight = height - CHART_MARGIN.top - CHART_MARGIN.bottom;

    const { xScale, yScale, linePaths, dataPoints } = useMemo(() => {
        if (!data || data.length < 2 || width === 0) {
            return { xScale: null, yScale: null, linePaths: [], dataPoints: [] };
        }

        const dates = data.map(d => new Date(d.date));
        const minDate = Math.min(...dates.map(d => d.getTime()));
        const maxDate = Math.max(...dates.map(d => d.getTime()));
        
        const allValues = data.flatMap(d => keys.map(k => d[k.key] || 0));
        const maxValue = Math.max(...allValues, 1);

        const xScale = (date: Date) => CHART_MARGIN.left + ((date.getTime() - minDate) / (maxDate - minDate)) * chartWidth;
        const yScale = (value: number) => chartHeight + CHART_MARGIN.top - (value / maxValue) * chartHeight;

        const generatedDataPoints = data.map(d => ({
            x: xScale(new Date(d.date)),
            date: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            values: keys.map(k => ({ key: k.label, value: d[k.key] || 0 })),
        }));

        const generatedLinePaths = keys.map((k, i) => {
            const pathData = data
                .map(d => `${xScale(new Date(d.date))},${yScale(d[k.key] || 0)}`)
                .join(' L');
            return {
                path: `M ${pathData}`,
                color: CHART_COLORS[i % CHART_COLORS.length],
            };
        });

        return { xScale, yScale, linePaths: generatedLinePaths, dataPoints: generatedDataPoints };
    }, [data, keys, chartWidth, chartHeight, width]);
    
    const handleMouseMove = (e: React.MouseEvent<SVGRectElement>) => {
        if (!dataPoints || dataPoints.length === 0) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;

        const closestPoint = dataPoints.reduce((prev, curr) => 
            Math.abs(curr.x - mouseX) < Math.abs(prev.x - mouseX) ? curr : prev
        );

        setTooltip({
            x: closestPoint.x,
            y: e.clientY - rect.top,
            visible: true,
            date: closestPoint.date,
            data: closestPoint.values.map((v, i) => ({
                label: v.key,
                value: v.value,
                color: CHART_COLORS[i % CHART_COLORS.length],
            }))
        });
    };

    const handleMouseLeave = () => {
        setTooltip(t => ({ ...t, visible: false }));
    };

    if (width === 0) return <div ref={containerRef} style={{ height: `${height}px` }}><Loader /></div>;
    
    if (!data || data.length < 2) {
        return (
            <CenteredMessage style={{ height: `${height}px` }}>
                <div className="info-message">
                    <strong>Not Enough Data to Display Chart</strong>
                    <p>We need at least two data points for the selected period to render a chart. Try selecting a wider date range.</p>
                </div>
            </CenteredMessage>
        );
    }
    
    return (
        <div ref={containerRef} className="stats-chart-container" style={{ height: `${height}px` }}>
            <svg className="stats-chart-svg" width={width} height={height}>
                <g className="grid-lines">
                    {[...Array(6)].map((_, i) => (
                        <line key={i} className="grid-line"
                            x1={CHART_MARGIN.left} x2={width - CHART_MARGIN.right}
                            y1={CHART_MARGIN.top + (i / 5) * chartHeight}
                            y2={CHART_MARGIN.top + (i / 5) * chartHeight} />
                    ))}
                </g>
                <g className="axes">
                    <line x1={CHART_MARGIN.left} y1={CHART_MARGIN.top} x2={CHART_MARGIN.left} y2={height - CHART_MARGIN.bottom} stroke="var(--border-color)" />
                    <line x1={CHART_MARGIN.left} y1={height - CHART_MARGIN.bottom} x2={width - CHART_MARGIN.right} y2={height - CHART_MARGIN.bottom} stroke="var(--border-color)" />
                    {[...Array(6)].map((_, i) => {
                         const value = (Math.max(...data.flatMap(d => keys.map(k => d[k.key] || 0)), 1) / 5) * (5 - i);
                         return (
                            <text key={i} className="axis-label" x={CHART_MARGIN.left - 8} y={CHART_MARGIN.top + (i / 5) * chartHeight + 4} textAnchor="end">
                                {formatAxisLabel(value, i18n.language)}
                            </text>
                        );
                    })}
                </g>
                <g className="plot-area">
                    {linePaths.map((line, i) => (
                        <path key={i} d={line.path} className="plot-line" stroke={line.color} />
                    ))}
                </g>
                <rect className="mouse-overlay"
                    x={CHART_MARGIN.left} y={CHART_MARGIN.top}
                    width={chartWidth} height={chartHeight}
                    onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} />
                {tooltip.visible && (
                    <g className="tooltip-elements">
                        <line className="tooltip-line" x1={tooltip.x} y1={CHART_MARGIN.top} x2={tooltip.x} y2={height - CHART_MARGIN.bottom} />
                        {tooltip.data.map((d, i) => (
                             <circle key={i} className="chart-tooltip-dot" cx={tooltip.x} cy={yScale!(d.value)} r={5} fill={d.color} />
                        ))}
                    </g>
                )}
            </svg>
            {tooltip.visible && (
                <div className="chart-tooltip" style={{
                    position: 'absolute',
                    top: `${tooltip.y + 10}px`,
                    left: `${tooltip.x + 10}px`,
                    transform: tooltip.x > chartWidth / 2 ? 'translateX(-100%)' : 'translateX(0)',
                    pointerEvents: 'none',
                }}>
                    <div className="tooltip-date">{tooltip.date}</div>
                    {tooltip.data.map((item, i) => (
                        <div key={i} className="tooltip-item">
                            <span className="color-swatch" style={{ backgroundColor: item.color }}></span>
                            <span className="label">{item.label}</span>
                            <span className="value">{item.value.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            )}
             <div className="chart-legend">
                {keys.map((k, i) => (
                    <div key={k.key} className="legend-item">
                        <span className="color-swatch" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}></span>
                        {k.label}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StatsChart;