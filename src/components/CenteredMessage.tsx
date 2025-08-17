import React, { ReactNode } from 'react';

const CenteredMessage = ({ children, style }: { children?: ReactNode, style?: React.CSSProperties }) => (
    <div className="centered-container" style={{height: '200px', ...style}}>
        {children}
    </div>
);

export default CenteredMessage;
