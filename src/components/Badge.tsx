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
        // Force text color to white for custom-colored badges for better contrast as requested.
        style.color = '#FFFFFF';
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