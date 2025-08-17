import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Icon, { ICONS } from '../Icon';

const NumberInput = ({ value, onChange, title, className = '' }: { value: any, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, title: string, className?: string }) => (
    <input type="number" min="0" value={value} onChange={onChange} title={title} className={className} />
);

const getPixelValue = (val: any) => parseInt(String(val).replace('px', '')) || 0;

const PaddingControl = ({ style, onStyleChange }: { style: any, onStyleChange: any }) => {
    const { t } = useTranslation();
    const [isLinked, setIsLinked] = useState(true);

    const handleSingleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = `${e.target.value}px`;
        onStyleChange('paddingTop', val);
        onStyleChange('paddingRight', val);
        onStyleChange('paddingBottom', val);
        onStyleChange('paddingLeft', val);
    };

    const allSidesValue = getPixelValue(style.paddingTop);
    
    useEffect(() => {
        // If all sides are the same, switch to linked mode
        const { paddingTop, paddingRight, paddingBottom, paddingLeft } = style;
        const allEqual = paddingTop === paddingRight && paddingTop === paddingBottom && paddingTop === paddingLeft;
        setIsLinked(allEqual);
    }, [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft]);

    return (
        <div className="editor-toolbar-input-group">
            <label>{t('padding')}</label>
            <div className={`padding-control-inputs ${isLinked ? 'linked' : ''}`}>
                <NumberInput className="padding-input top" title="Top" value={getPixelValue(style.paddingTop)} onChange={e => onStyleChange('paddingTop', `${e.target.value}px`)} />
                <NumberInput className="padding-input left" title="Left" value={getPixelValue(style.paddingLeft)} onChange={e => onStyleChange('paddingLeft', `${e.target.value}px`)} />
                
                <button
                    className={`btn-icon link-btn ${isLinked ? 'active' : ''}`}
                    onClick={() => setIsLinked(!isLinked)}
                    title={t('paddingLinked')}
                >
                    <Icon path={ICONS.LINK} />
                </button>

                <NumberInput className="padding-input right" title="Right" value={getPixelValue(style.paddingRight)} onChange={e => onStyleChange('paddingRight', `${e.target.value}px`)} />
                <NumberInput className="padding-input bottom" title="Bottom" value={getPixelValue(style.paddingBottom)} onChange={e => onStyleChange('paddingBottom', `${e.target.value}px`)} />

                <NumberInput className="padding-all-sides" title="All Sides" value={allSidesValue} onChange={handleSingleChange} />
            </div>
        </div>
    );
};


const ImageEditorToolbar = ({ block, canvasWrapperRef, onStyleChange, onContentChange }: { block: any, canvasWrapperRef: React.RefObject<HTMLDivElement>, onStyleChange: any, onContentChange: any }) => {
    const { t } = useTranslation();
    const [toolbarState, setToolbarState] = useState({ top: 0, left: 0, opacity: 0 });
    const toolbarRef = useRef<HTMLDivElement>(null);
    const [linkUrl, setLinkUrl] = useState(block.content?.href || '');
    
    useEffect(() => {
        setLinkUrl(block.content?.href || '');
    }, [block.content?.href]);

    useEffect(() => {
        if (block && canvasWrapperRef.current) {
            const blockElement = document.querySelector(`[data-block-id="${block.id}"]`);
            const canvasRect = canvasWrapperRef.current.getBoundingClientRect();
            
            if (blockElement) {
                const blockRect = blockElement.getBoundingClientRect();
                const toolbarHeight = toolbarRef.current?.offsetHeight || 50;

                let top = blockRect.top - canvasRect.top - toolbarHeight - 10;
                top = Math.max(top, 10);

                setToolbarState({
                    top: top,
                    left: blockRect.left - canvasRect.left + blockRect.width / 2,
                    opacity: 1
                });
            }
        } else {
            setToolbarState(s => ({...s, opacity: 0}));
        }
    }, [block, canvasWrapperRef, block.style]); // Re-run on style change to account for size changes

    const handleStyleChange = (property: string, value: any) => {
        onStyleChange(block.id, { [property]: value });
    };

    const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLinkUrl(e.target.value);
    };

    const handleLinkBlur = () => {
        onContentChange(block.id, { href: linkUrl });
    };

    const currentStyle = block.style || {};

    return (
        <div ref={toolbarRef} className="editor-toolbar image-editor-toolbar" style={toolbarState} onMouseDown={e => e.preventDefault()}>
            <div className="editor-toolbar-section">
                <button onClick={() => handleStyleChange('textAlign', 'left')} className={currentStyle.textAlign === 'left' ? 'active' : ''} title={t('alignLeft')}><Icon path={ICONS.ALIGN_LEFT} /></button>
                <button onClick={() => handleStyleChange('textAlign', 'center')} className={currentStyle.textAlign === 'center' ? 'active' : ''} title={t('alignCenter')}><Icon path={ICONS.ALIGN_CENTER} /></button>
                <button onClick={() => handleStyleChange('textAlign', 'right')} className={currentStyle.textAlign === 'right' ? 'active' : ''} title={t('alignRight')}><Icon path={ICONS.ALIGN_RIGHT} /></button>
            </div>
            
             <div className="editor-toolbar-section">
                <PaddingControl style={currentStyle} onStyleChange={handleStyleChange} />
            </div>

            <div className="editor-toolbar-section">
                 <div className="editor-toolbar-input-group">
                    <label>{t('style')}</label>
                     <div className="border-controls">
                        <div className="editor-toolbar-color-picker" title={t('background')}>
                            <input type="color" value={currentStyle.backgroundColor || '#ffffff'} onChange={e => handleStyleChange('backgroundColor', e.target.value)} />
                            <div className="color-swatch-display" style={{ backgroundColor: currentStyle.backgroundColor }}></div>
                        </div>
                         <NumberInput title={t('borderRadius')} value={getPixelValue(currentStyle.borderRadius)} onChange={e => handleStyleChange('borderRadius', `${e.target.value}px`)} />
                    </div>
                 </div>
            </div>

            <div className="editor-toolbar-section">
                <div className="editor-toolbar-input-group">
                    <label>{t('border')}</label>
                    <div className="border-controls">
                         <NumberInput title={t('borderWidth')} value={getPixelValue(currentStyle.borderWidth)} onChange={e => handleStyleChange('borderWidth', `${e.target.value}px`)} />
                        <select
                            title={t('borderStyle')}
                            value={currentStyle.borderStyle || 'none'}
                            onChange={e => handleStyleChange('borderStyle', e.target.value)}
                        >
                            <option value="none">{t('none')}</option>
                            <option value="solid">{t('solid')}</option>
                            <option value="dashed">{t('dashed')}</option>
                            <option value="dotted">{t('dotted')}</option>
                        </select>
                        <div className="editor-toolbar-color-picker" title={t('borderColor')}>
                            <input type="color" value={currentStyle.borderColor || '#000000'} onChange={e => handleStyleChange('borderColor', e.target.value)} />
                            <div className="color-swatch-display" style={{ backgroundColor: currentStyle.borderColor }}></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="editor-toolbar-section">
                <Icon path={ICONS.LINK} />
                <input
                    type="url"
                    className="editor-toolbar-link-input"
                    placeholder={t('link')}
                    value={linkUrl}
                    onChange={handleLinkChange}
                    onBlur={handleLinkBlur}
                />
            </div>
        </div>
    );
};
export default ImageEditorToolbar;