import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Icon, { ICONS } from '../Icon';

const FONT_FAMILIES = [
    "'Inter', Arial, sans-serif",
    "Georgia, serif",
    "'Times New Roman', Times, serif",
    "Tahoma, Geneva, sans-serif",
    "'Trebuchet MS', Helvetica, sans-serif",
    "Verdana, Geneva, sans-serif",
];

const EditorToolbar = ({ block, canvasWrapperRef, onStyleChange, onContentChange }: { block: any, canvasWrapperRef: React.RefObject<HTMLDivElement>, onStyleChange: any, onContentChange: any }) => {
    const { t } = useTranslation();
    const [toolbarState, setToolbarState] = useState({ top: 0, left: 0, opacity: 0 });
    const toolbarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (block && canvasWrapperRef.current) {
            const blockElement = document.querySelector(`[data-block-id="${block.id}"]`);
            const canvasRect = canvasWrapperRef.current.getBoundingClientRect();
            
            if (blockElement) {
                const blockRect = blockElement.getBoundingClientRect();
                const toolbarHeight = toolbarRef.current?.offsetHeight || 50;

                let top = blockRect.top - canvasRect.top - toolbarHeight - 10;
                top = Math.max(top, 10); // Prevent going off-screen top

                setToolbarState({
                    top: top,
                    left: blockRect.left - canvasRect.left + blockRect.width / 2,
                    opacity: 1
                });
            }
        } else {
            setToolbarState(s => ({...s, opacity: 0}));
        }
    }, [block, canvasWrapperRef]);

    const handleStyleCommand = (command: string) => {
        document.execCommand(command, false);
        // This is a bit of a hack to get the updated content, but necessary with execCommand
        const blockElement = document.querySelector(`[data-block-id="${block.id}"] .${block.type.toLowerCase()}-block`);
        if (blockElement) {
            onContentChange(block.id, { html: blockElement.innerHTML });
        }
    };
    
    const handleLink = () => {
        const url = prompt(t('enterUrl'), 'https://');
        if (url) {
            document.execCommand('createLink', false, url);
             const blockElement = document.querySelector(`[data-block-id="${block.id}"] .${block.type.toLowerCase()}-block`);
            if (blockElement) {
                onContentChange(block.id, { html: blockElement.innerHTML });
            }
        }
    };

    const handleStyleChange = (property: string, value: any) => {
        onStyleChange(block.id, { [property]: value });
    };

    const currentStyle = block.style || {};

    return (
        <div ref={toolbarRef} className="editor-toolbar" style={toolbarState} onMouseDown={e => e.preventDefault()}>
            <div className="editor-toolbar-section">
                 <select
                    value={currentStyle.fontFamily || ''}
                    onChange={e => handleStyleChange('fontFamily', e.target.value)}
                    title={t('fontFamily')}
                >
                    {FONT_FAMILIES.map(font => <option key={font} value={font}>{font.split(',')[0].replace(/'/g, '')}</option>)}
                </select>
                <input
                    type="number"
                    value={parseInt(currentStyle.fontSize) || 16}
                    onChange={e => handleStyleChange('fontSize', `${e.target.value}px`)}
                    title={t('fontSize')}
                />
                 <div className="editor-toolbar-color-picker" title={t('color')}>
                    <input
                        type="color"
                        value={currentStyle.color || '#000000'}
                        onChange={e => handleStyleChange('color', e.target.value)}
                    />
                    <div className="color-swatch-display" style={{ backgroundColor: currentStyle.color }}></div>
                </div>
            </div>

            <div className="editor-toolbar-section">
                <button onClick={() => handleStyleCommand('bold')} title={t('bold')}><Icon path={ICONS.BOLD} /></button>
                <button onClick={() => handleStyleCommand('italic')} title={t('italic')}><Icon path={ICONS.ITALIC} /></button>
                <button onClick={handleLink} title={t('link')}><Icon path={ICONS.LINK} /></button>
            </div>
            
            <div className="editor-toolbar-section">
                <button onClick={() => handleStyleChange('textAlign', 'left')} className={currentStyle.textAlign === 'left' ? 'active' : ''} title={t('alignLeft')}><Icon path={ICONS.ALIGN_LEFT} /></button>
                <button onClick={() => handleStyleChange('textAlign', 'center')} className={currentStyle.textAlign === 'center' ? 'active' : ''} title={t('alignCenter')}><Icon path={ICONS.ALIGN_CENTER} /></button>
                <button onClick={() => handleStyleChange('textAlign', 'right')} className={currentStyle.textAlign === 'right' ? 'active' : ''} title={t('alignRight')}><Icon path={ICONS.ALIGN_RIGHT} /></button>
            </div>
        </div>
    );
};

export default EditorToolbar;