import React from 'react';
import Icon from './Icon';

interface BadgeProps {
    text: string;
    type?: 'success' | 'warning' | 'danger' | 'info' | 'default';
    color?: string; // Hex color for specific styling
    iconPath?: string;
}

const Badge = ({ text, type = 'default', color, iconPath }: BadgeProps) => {
    const style: React.CSSProperties = {};
    
    // If a specific hex color is provided, it takes precedence for the background.
    if (color) {
        // A simple algorithm to determine if text should be light or dark based on background
        const hex = color.replace('#', '');
        if (hex.length === 6) {
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            style.color = luminance > 0.5 ? '#333' : '#FFFFFF';
        }
        style.backgroundColor = color;
    }

    return (
        <span className={`badge badge-${type}`} style={style}>
            {iconPath && <Icon path={iconPath} className="icon" style={{ width: '1em', height: '1em', marginRight: '0.4em', verticalAlign: 'text-bottom' }} />}
            {text}
        </span>
    );
};

export default Badge;
