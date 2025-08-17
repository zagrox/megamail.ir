import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableBlock } from './SortableBlock';
import Icon, { ICONS } from '../Icon';

interface EditableBlockProps {
    id: string;
    html: string;
    style: React.CSSProperties;
    isSelected: boolean;
    onContentChange: (id: string, content: { html: string }) => void;
    className: string;
}

const getPixelValue = (val: any) => parseInt(String(val).replace('px', '')) || 0;

const EditableBlock: React.FC<EditableBlockProps> = ({ id, html, style, isSelected, onContentChange, className }) => {
    const ref = useRef<HTMLDivElement>(null);
    const lastHtml = useRef(html);

    useEffect(() => {
        if (ref.current && (html ?? '') !== ref.current.innerHTML) {
            ref.current.innerHTML = html ?? '';
            lastHtml.current = html ?? '';
        }
    }, [html]);

    const handleBlur = () => {
        if (ref.current && ref.current.innerHTML !== lastHtml.current) {
            const newHtml = ref.current.innerHTML;
            lastHtml.current = newHtml;
            onContentChange(id, { html: newHtml });
        }
    };

    return (
        <div
            ref={ref}
            className={className}
            contentEditable={isSelected}
            suppressContentEditableWarning={true}
            style={style}
            onBlur={handleBlur}
            dangerouslySetInnerHTML={{ __html: html ?? '' }}
        />
    );
};

// Block Components
const HeaderBlock = ({ id, content, style, isSelected, onContentChange }: { id: string; content?: { html: string }; style?: React.CSSProperties; isSelected: boolean; onContentChange: any; }) => (
    <EditableBlock
        id={id}
        html={content?.html ?? '<h1>Headline Text</h1>'}
        style={style || {}}
        isSelected={isSelected}
        onContentChange={onContentChange}
        className="header-block"
    />
);

const TextBlock = ({ id, content, style, isSelected, onContentChange }: { id: string; content?: { html: string }; style?: React.CSSProperties; isSelected: boolean; onContentChange: any; }) => (
    <EditableBlock
        id={id}
        html={content?.html ?? '<p>This is a paragraph. Click to edit.</p>'}
        style={style || {}}
        isSelected={isSelected}
        onContentChange={onContentChange}
        className="text-block"
    />
);

const ImageBlock = ({ content, style }: { content?: any, style?: any }) => {
    const { t } = useTranslation();
    const c = content || {};
    const s = style || {};

    const src = c.src;
    const alt = c.alt ?? 'Placeholder';
    const href = c.href;
    const isPlaceholder = !src || src.startsWith('data:image/svg+xml');

    const hAlignToJustify = {
        left: 'flex-start',
        center: 'center',
        right: 'flex-end',
    };
    const vAlignToAlign = {
        top: 'flex-start',
        middle: 'center',
        bottom: 'flex-end',
    };

    const outerWrapperStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: hAlignToJustify[s.textAlign as keyof typeof hAlignToJustify] || 'center',
        alignItems: vAlignToAlign[s.verticalAlign as keyof typeof vAlignToAlign] || 'center',
        padding: `${getPixelValue(s.paddingTop)}px ${getPixelValue(s.paddingRight)}px ${getPixelValue(s.paddingBottom)}px ${getPixelValue(s.paddingLeft)}px`,
        backgroundColor: s.backgroundColor || 'transparent',
    };
    
    const imageStyle: React.CSSProperties = {
        display: 'block',
        maxWidth: '100%',
        width: c.width === 'auto' ? 'auto' : `${getPixelValue(c.width)}px`,
        height: c.height === 'auto' ? 'auto' : `${getPixelValue(c.height)}px`,
        borderRadius: s.borderRadius ? `${getPixelValue(s.borderRadius)}px` : '0px',
    };
    
    const placeholderBorderStyle: React.CSSProperties = {
        border: isPlaceholder ? '2px dashed var(--border-color)' : 'none',
        padding: isPlaceholder ? '2rem 0' : '0',
        boxSizing: 'border-box',
    };

    const imageElement = <img src={src} alt={alt} style={{...imageStyle, ...placeholderBorderStyle}} />;

    const finalImage = href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" style={{textDecoration: 'none', display: 'block'}}>
            {imageElement}
        </a>
    ) : (
        imageElement
    );
    
    return (
        <div className="image-block" style={outerWrapperStyle}>
             {isPlaceholder && <div className="image-placeholder-text">{t('imagePlaceholderText')}</div>}
            {finalImage}
        </div>
    );
};

const ButtonBlock = ({ content, style }: { content?: any, style?: any }) => {
    const s = style || {};
    const c = content || {};

    const wrapperStyle: React.CSSProperties = {
        padding: '10px 20px', // Outer padding for the block itself
        textAlign: s.width === 'full' ? 'left' : (s.textAlign || 'center'), // for auto-width buttons
    };

    const buttonStyle: React.CSSProperties = {
        display: s.width === 'full' ? 'block' : 'inline-block',
        width: s.width === 'full' ? '100%' : 'auto',
        backgroundColor: s.backgroundColor || '#007BFF',
        color: s.textColor || '#FFFFFF',
        padding: `${getPixelValue(s.paddingY)}px ${getPixelValue(s.paddingX)}px`,
        borderRadius: s.borderRadius ? `${getPixelValue(s.borderRadius)}px` : '4px',
        fontFamily: s.fontFamily || "'Inter', Arial, sans-serif",
        fontSize: s.fontSize ? `${getPixelValue(s.fontSize)}px` : '16px',
        fontWeight: s.fontWeight || 'normal',
        textDecoration: 'none',
        border: 'none',
        boxSizing: 'border-box',
        textAlign: 'center',
    };

    // In an editor context, prevent navigation.
    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
    };

    return (
        <div className="button-block" style={wrapperStyle}>
            <a href={c.href || '#'} style={buttonStyle} onClick={handleClick}>{c.text || 'Button Text'}</a>
        </div>
    );
};


const SpacerBlock = ({ content, style }: { content?: { height: number }, style?: any }) => (
    <div
        className="spacer-block"
        style={{
            height: `${content?.height ?? 30}px`,
            backgroundColor: style?.backgroundColor || 'transparent',
        }}
    />
);

const DividerBlock = ({ style }: { style?: any }) => {
    const s = style || {};
    const wrapperStyle: React.CSSProperties = {
        padding: `${getPixelValue(s.paddingY)}px 0`,
        backgroundColor: s.backgroundColor || 'transparent',
    };
    const lineStyle: React.CSSProperties = {
        borderTopWidth: `${getPixelValue(s.height)}px`,
        borderTopStyle: s.style || 'solid',
        borderTopColor: s.color || '#cccccc',
    };
    return (
        <div style={wrapperStyle}>
            <div style={lineStyle} />
        </div>
    );
};


const ColumnsBlock = (props: any) => {
    const { item, onSetColumns, allHandlers, selectedBlockId } = props;
    const { t } = useTranslation();
    const s = item.style || {};

    const layouts = [
        { label: t('twoColumns'), config: [{flex: 1}, {flex: 1}] },
        { label: t('threeColumns'), config: [{flex: 1}, {flex: 1}, {flex: 1}] },
        { label: '4 Columns', config: [{flex: 1}, {flex: 1}, {flex: 1}, {flex: 1}] },
        { label: '2 Cols (30/70)', config: [{flex: 0.3}, {flex: 0.7}] },
        { label: '2 Cols (70/30)', config: [{flex: 0.7}, {flex: 0.3}] },
    ];
    
    if (!item.content?.columns || item.content.columns.length === 0) {
        return (
            <div className="column-layout-selector" style={{ flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                <p style={{ width: '100%', textAlign: 'center', marginBottom: '0.5rem' }}>{t('chooseLayout')}:</p>
                {layouts.map(layout => (
                    <button key={layout.label} className="btn btn-secondary" onClick={() => onSetColumns(item.id, layout.config)}>{layout.label}</button>
                ))}
            </div>
        );
    }

    const wrapperStyle: React.CSSProperties = {
        backgroundColor: s.backgroundColor,
        padding: `${getPixelValue(s.paddingTop)}px ${getPixelValue(s.paddingRight)}px ${getPixelValue(s.paddingBottom)}px ${getPixelValue(s.paddingLeft)}px`,
        gap: `${getPixelValue(s.gap)}px`,
        alignItems: s.verticalAlign === 'middle' ? 'center' : s.verticalAlign === 'bottom' ? 'flex-end' : 'flex-start',
    };

    return (
        <div className="columns-block" style={wrapperStyle}>
            {item.content.columns.map((col: any) => (
                <ColumnDropZone key={col.id} id={col.id} items={col.items} allHandlers={allHandlers} selectedBlockId={selectedBlockId} flex={col.flex} />
            ))}
        </div>
    );
};

const ColumnDropZone = ({ id, items, allHandlers, selectedBlockId, flex }: { id: string, items: any[], allHandlers: any, selectedBlockId: string | null, flex?: number }) => {
    const { t } = useTranslation();
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div ref={setNodeRef} className={`column-droppable ${isOver ? 'is-over' : ''}`} style={{ flex: flex || 1 }}>
             <SortableContext items={items.map((i: any) => i.id)} strategy={verticalListSortingStrategy}>
                 {items.length > 0 ? (
                    items.map((nestedItem: any, index: number) => (
                         <SortableBlock
                            key={nestedItem.id}
                            id={nestedItem.id}
                            item={nestedItem}
                            index={index}
                            onRemove={allHandlers.removeItem}
                            onDuplicate={allHandlers.onDuplicateBlock}
                            onEditImage={allHandlers.onEditImageBlock}
                            isSelected={nestedItem.id === selectedBlockId}
                            onSelect={allHandlers.onSelectBlock}
                            onContentChange={allHandlers.onContentChange}
                            onStyleChange={allHandlers.onStyleChange}
                            onInsertBlock={(type) => allHandlers.onInsertBlock(type, index, items)}
                            onSetColumns={allHandlers.onSetColumns}
                            allHandlers={allHandlers}
                            selectedBlockId={selectedBlockId}
                        />
                    ))
                 ) : (
                    <div className="canvas-placeholder" style={{minHeight: 100, fontSize: '0.9rem'}}>
                        <span>{t('dropContentHere')}</span>
                    </div>
                 )}
            </SortableContext>
        </div>
    );
}

const ProductBlock = (props: any) => {
    return <ColumnsBlock {...props} />;
};

const FooterBlock = ({ content, style }: { content?: any, style?: any }) => {
    const c = content || {};
    const s = style || {};

    const wrapperStyle: React.CSSProperties = {
        padding: `${getPixelValue(s.paddingTop)}px ${getPixelValue(s.paddingRight)}px ${getPixelValue(s.paddingBottom)}px ${getPixelValue(s.paddingLeft)}px`,
        backgroundColor: s.backgroundColor || 'transparent',
        textAlign: s.textAlign as any || 'center',
        color: s.textColor || '#6c757d',
        fontSize: s.fontSize || '12px',
        lineHeight: 1.6
    };

    const linkStyle: React.CSSProperties = {
        color: s.linkColor || '#007bff',
        textDecoration: 'underline'
    };
    
    // In an editor context, prevent navigation.
    const handleClick = (e: React.MouseEvent) => e.preventDefault();

    return (
        <div className="footer-block" style={wrapperStyle}>
            <p dangerouslySetInnerHTML={{ __html: c.permissionReminder || '' }} />
            <p dangerouslySetInnerHTML={{ __html: c.contactInfo || '' }} />
            <p>
                <a href={c.unsubscribeUrl || '#'} style={linkStyle} onClick={handleClick}>{c.unsubscribeText || 'Unsubscribe'}</a>
                {' | '}
                <a href={c.managePreferencesUrl || '#'} style={linkStyle} onClick={handleClick}>{c.managePreferencesText || 'Manage Preferences'}</a>
                {' | '}
                <a href={c.viewOnlineUrl || '#'} style={linkStyle} onClick={handleClick}>{c.viewOnlineText || 'View in Browser'}</a>
            </p>
        </div>
    );
};


// Block Renderer
export const renderBlock = (block: any, props: any = {}) => {
    if (!block) {
        return null;
    }
    const { id, type, content, style, isSelected, onContentChange, onStyleChange } = block;

    const baseProps = {
        ...props,
        id,
        item: block,
        content: content || {},
        style: style || {},
        isSelected,
        onContentChange,
        onStyleChange,
    };
    
    const blockMap: { [key: string]: React.ReactElement } = {
        'Header': <HeaderBlock {...baseProps} />,
        'Text': <TextBlock {...baseProps} />,
        'Image': <ImageBlock {...baseProps} />,
        'Button': <ButtonBlock {...baseProps} />,
        'Spacer': <SpacerBlock {...baseProps} />,
        'Columns': <ColumnsBlock {...baseProps} />,
        'Divider': <DividerBlock {...baseProps} />,
        'Product': <ProductBlock {...baseProps} />,
        'Footer': <FooterBlock {...baseProps} />,
    };

    return (
        <div className="block-content-wrapper" style={{ pointerEvents: 'auto' }}>
            {blockMap[type] || null}
        </div>
    );
};
