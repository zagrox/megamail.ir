import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from 'react-i18next';
import { renderBlock } from './blocks';
import Icon, { ICONS } from '../Icon';
import AddBlockPopover from './AddBlockPopover';

interface SortableBlockProps {
    id: string;
    item: any;
    index: number;
    onRemove: (id: string) => void;
    onDuplicate: (id: string) => void;
    onEditImage: (id: string) => void;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onContentChange: (id: string, content: any) => void;
    onStyleChange: (id: string, style: any) => void;
    onInsertBlock: (blockType: string) => void;
    onSetColumns: (id: string, layoutConfig: { flex: number }[]) => void;
    allHandlers: any; // Object containing all handlers for nested blocks
    selectedBlockId: string | null;
}

export const SortableBlock = (props: SortableBlockProps) => {
    const { id, item, index, onRemove, onDuplicate, onEditImage, isSelected, onSelect, onInsertBlock } = props;
    const { t } = useTranslation();
    const [isAddPopoverOpen, setIsAddPopoverOpen] = useState(false);
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const handleInsert = (blockType: string) => {
        onInsertBlock(blockType);
        setIsAddPopoverOpen(false);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            data-block-id={id}
            className={`canvas-item ${isDragging ? 'dragging' : ''} ${isSelected ? 'selected' : ''}`}
            onClick={(e) => { e.stopPropagation(); onSelect(id);}}
        >
            {renderBlock(item, props)}
            <div className="canvas-item-controls">
                <button
                    {...attributes}
                    {...listeners}
                    className="btn-icon canvas-item-drag-handle"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={t('dragHandle')}
                >
                    <Icon path={ICONS.DRAG_HANDLE} />
                </button>
                {item.type === 'Image' && (
                     <button className="btn-icon" onClick={(e) => { e.stopPropagation(); onEditImage(id); }} aria-label={t('editBlock')}>
                        <Icon path={ICONS.PENCIL} />
                    </button>
                )}
                <button className="btn-icon" onClick={(e) => { e.stopPropagation(); onDuplicate(id); }} aria-label={t('duplicateBlock')}>
                    <Icon path={ICONS.DUPLICATE} />
                </button>
                <button className="btn-icon btn-icon-danger" onClick={(e) => { e.stopPropagation(); onRemove(id); }} aria-label={t('deleteBlock')}>
                    <Icon path={ICONS.DELETE} />
                </button>
            </div>
            <div className="canvas-item-add-wrapper">
                <button
                    className="canvas-item-add-button"
                    onClick={(e) => { e.stopPropagation(); setIsAddPopoverOpen(p => !p); }}
                    aria-label={t('addBlock')}
                >
                    <Icon path={ICONS.PLUS} />
                </button>
                {isAddPopoverOpen && (
                    <AddBlockPopover onSelectBlockType={handleInsert} onClose={() => setIsAddPopoverOpen(false)} />
                )}
            </div>
        </div>
    );
};