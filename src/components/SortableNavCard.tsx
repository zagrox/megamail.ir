import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Icon from './Icon';

export const SortableNavCard = ({ id, item, setView }: { id: string; item: { name: string; icon: string; desc: string; view: string; }; setView: (view: string) => void; }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1, // Style for the original item acting as a placeholder
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="card nav-card clickable"
            {...attributes}
            {...listeners}
            onClick={() => setView(item.view)}
        >
            <Icon path={item.icon} className="nav-card-icon" />
            <div className="nav-card-text-content">
                <div className="nav-card-title">{item.name}</div>
                <div className="nav-card-description">{item.desc}</div>
            </div>
        </div>
    );
};
