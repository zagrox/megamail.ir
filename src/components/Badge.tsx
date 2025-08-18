import React from 'react';
import Icon from './Icon';

const Badge = ({ text, type = 'default', color, iconPath }: {text: string, type?: string, color?: string, iconPath?: string}) => {
    const style: React.CSSProperties = {};
    if (color) {
        style.backgroundColor = color;
        style.color = '#FFFFFF'; // Force text color to white
        style.border = `1px solid ${color}`;
    }

    return (
        <span className={`badge badge-${type}`} style={style}>
            {iconPath && <Icon path={iconPath} style={{ width: '1em', height: '1em', marginRight: '0.4em', verticalAlign: 'text-bottom' }} />}
            {text}
        </span>
    );
};

export default Badge;
