import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TOOLBAR_COMPONENTS } from './Toolbar';
import Icon from '../Icon';

interface AddBlockPopoverProps {
    onSelectBlockType: (type: string) => void;
    onClose: () => void;
}

const AddBlockPopover = ({ onSelectBlockType, onClose }: AddBlockPopoverProps) => {
    const popoverRef = useRef<HTMLDivElement>(null);
    const { t } = useTranslation();

    // Handle clicks outside the popover to close it
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [onClose]);

    const handleSelect = (type: string) => {
        onSelectBlockType(type);
        onClose();
    };

    return (
        <div className="add-block-popover" ref={popoverRef}>
            {TOOLBAR_COMPONENTS.map(comp => (
                <button
                    key={comp.id}
                    className="add-block-popover-item"
                    onClick={() => handleSelect(comp.type)}
                >
                    <Icon path={comp.icon} />
                    <span>{t(comp.type.toLowerCase())}</span>
                </button>
            ))}
        </div>
    );
};

export default AddBlockPopover;