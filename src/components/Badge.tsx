import React from 'react';

const Badge = ({ text, type = 'default' }: {text: string, type?: string}) => (
    <span className={`badge badge-${type}`}>{text}</span>
);

export default Badge;
