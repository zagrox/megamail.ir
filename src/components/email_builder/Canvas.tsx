import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useTranslation } from 'react-i18next';
import { SortableBlock } from './SortableBlock';

interface CanvasProps {
    items: any[];
    removeItem: (id: string) => void;
    onDuplicateBlock: (id: string) => void;
    onEditImageBlock: (id: string) => void;
    selectedBlockId: string | null;
    onSelectBlock: (id: string) => void;
    onContentChange: (id: string, content: any) => void;
    onStyleChange: (id: string, style: any) => void;
    onInsertBlock: (blockType: string, index: number) => void;
    onSetColumns: (id: string, layoutConfig: { flex: number }[]) => void;
    globalStyles: any;
}

const Canvas = ({ items, removeItem, onDuplicateBlock, onEditImageBlock, selectedBlockId, onSelectBlock, onContentChange, onStyleChange, onInsertBlock, onSetColumns, globalStyles }: CanvasProps) => {
    const { t } = useTranslation();
    const { setNodeRef } = useDroppable({
        id: 'canvas-droppable',
    });
    
    const canvasStyle: React.CSSProperties = {
        backgroundColor: globalStyles.canvasColor,
        borderRadius: `${globalStyles.canvasBorderRadius}px`,
        border: `1px solid ${globalStyles.canvasBorderColor}`,
        color: globalStyles.defaultTextColor,
        fontFamily: globalStyles.defaultFontFamily,
    };

    return (
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div ref={setNodeRef} className="builder-canvas" style={canvasStyle}>
                {items.length > 0 ? (
                    items.map((item, index) => (
                        <SortableBlock
                            key={item.id}
                            id={item.id}
                            item={item}
                            index={index}
                            onRemove={removeItem}
                            onDuplicate={onDuplicateBlock}
                            onEditImage={onEditImageBlock}
                            isSelected={item.id === selectedBlockId}
                            onSelect={onSelectBlock}
                            onContentChange={onContentChange}
                            onStyleChange={onStyleChange}
                            onInsertBlock={(type) => onInsertBlock(type, index)}
                            onSetColumns={onSetColumns}
                            // Pass all handlers down for nested rendering
                            allHandlers={{ removeItem, onDuplicateBlock, onEditImageBlock, onSelectBlock, onContentChange, onStyleChange, onInsertBlock, onSetColumns }}
                            selectedBlockId={selectedBlockId}
                        />
                    ))
                ) : (
                    <div className="canvas-placeholder">
                        <span>{t('dropContentHere')}</span>
                    </div>
                )}
            </div>
        </SortableContext>
    );
};

export default Canvas;