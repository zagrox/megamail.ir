import React from 'react';
import { useTranslation } from 'react-i18next';
import Icon, { ICONS } from '../Icon';
import CenteredMessage from '../CenteredMessage';

const getPixelValue = (val: any) => parseInt(String(val).replace('px', ''), 10) || 0;

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="settings-section">
        {title && <h4 className="settings-section-header">{title}</h4>}
        {children}
    </div>
);

const LabeledControl = ({ label, children, fullWidth = false }: { label: string, children: React.ReactNode, fullWidth?: boolean }) => (
    <div className={`control-row ${fullWidth ? 'full-width' : ''}`}>
        <span className="control-label">{label}</span>
        <div className="control-input">{children}</div>
    </div>
);

const ColorInput = ({ value, onChange, onAdd, onRemove }: { value?: string; onChange: (hex: string) => void; onAdd: () => void; onRemove: () => void; }) => {
    if (!value || value === 'transparent') {
        return <button onClick={onAdd} className="btn-icon color-input-add-btn"><Icon path={ICONS.PLUS}/></button>;
    }
    
    return (
        <div className="color-input-wrapper">
            <div className="color-input-swatch" style={{ backgroundColor: value }}>
                <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
            </div>
            <input
                className="color-input-hex"
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={(e) => e.target.select()}
            />
             <button onClick={onRemove} className="btn-icon"><Icon path={ICONS.DELETE} /></button>
        </div>
    );
};


const Slider = ({ label, value, onChange, min = 0, max = 100, step = 1 }: { label: string, value: number, onChange: (val: number) => void, min?: number, max?: number, step?: number }) => (
    <div className="slider-control">
        <span className="control-label">{label}</span>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value, 10))}
        />
        <span className="control-value">{value}px</span>
    </div>
);

const PaddingSlider = ({ icon, label, value, onChange, min = 0, max = 100, step = 1 }: { icon?: string, label: string, value: number, onChange: (val: number) => void, min?: number, max?: number, step?: number }) => (
    <div className="slider-control">
        {icon && <Icon path={icon} />}
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value, 10))}
        />
        <span className="control-value">{value}px</span>
    </div>
);

const SegmentedControl = ({ options, value, onChange, isIconOnly = false }: { options: { value: string, label?: string, icon?: string }[], value: string, onChange: (val: string) => void, isIconOnly?: boolean }) => (
    <div className={`segmented-control ${isIconOnly ? 'icon-only' : ''}`}>
        {options.map(opt => (
            <button
                key={opt.value}
                className={value === opt.value ? 'active' : ''}
                onClick={() => onChange(opt.value)}
                title={opt.label}
            >
                {opt.icon && <Icon path={opt.icon} />}
                {!isIconOnly && opt.label && <span>{opt.label}</span>}
            </button>
        ))}
    </div>
);

const NumberInputWithUnit = ({ value, onChange, unit = 'px' }: { value: string | number, onChange: (val: string) => void, unit?: string}) => {
    return (
        <div className="panel-input-with-unit">
             <input type="number" value={String(value).replace(/[^0-9]/g, '')} onChange={(e) => onChange(e.target.value)} />
             <span className="unit-label">{unit}</span>
        </div>
    )
}

const GlobalSettings = ({ styles, onChange }: { styles: any, onChange: (newStyles: any) => void }) => {
    const { t } = useTranslation();
    const handleStyleChange = (key: string, value: any) => {
        onChange({ [key]: value });
    }

    return (
        <>
            <Section title="">
                <LabeledControl label={t('backdropColor')}>
                    <ColorInput value={styles.backdropColor} onChange={(val) => handleStyleChange('backdropColor', val)} onAdd={() => handleStyleChange('backdropColor', '#F0F0F0')} onRemove={() => handleStyleChange('backdropColor', 'transparent')} />
                </LabeledControl>
                 <LabeledControl label={t('canvasColor')}>
                    <ColorInput value={styles.canvasColor} onChange={(val) => handleStyleChange('canvasColor', val)} onAdd={() => handleStyleChange('canvasColor', '#FFFFFF')} onRemove={() => handleStyleChange('canvasColor', 'transparent')} />
                </LabeledControl>
                 <LabeledControl label={t('canvasBorderColor')}>
                    <ColorInput value={styles.canvasBorderColor} onChange={(val) => handleStyleChange('canvasBorderColor', val)} onAdd={() => handleStyleChange('canvasBorderColor', '#E2E8F0')} onRemove={() => handleStyleChange('canvasBorderColor', 'transparent')} />
                </LabeledControl>
                <Slider label={t('canvasBorderRadius')} value={getPixelValue(styles.canvasBorderRadius)} onChange={(val) => handleStyleChange('canvasBorderRadius', val)} max={50} />
            </Section>
            <Section title={t('typography')}>
                 <div className="form-group">
                    <label>{t('fontFamily')}</label>
                     <select value={styles.defaultFontFamily} onChange={(e) => handleStyleChange('defaultFontFamily', e.target.value)}>
                        <option value="'Inter', Arial, sans-serif">Modern Sans</option>
                        <option value="Georgia, serif">Classic Serif</option>
                        <option value="monospace">Monospace</option>
                    </select>
                </div>
                 <LabeledControl label={t('textColor')}>
                    <ColorInput value={styles.defaultTextColor} onChange={(val) => handleStyleChange('defaultTextColor', val)} onAdd={() => handleStyleChange('defaultTextColor', '#000000')} onRemove={() => {}} />
                </LabeledControl>
            </Section>
        </>
    )
}

const getHeaderText = (html: string): string => {
    if (!html) return '';
    try {
        const el = document.createElement('div');
        el.innerHTML = html;
        return el.textContent || '';
    } catch (e) {
        return '';
    }
};

const getHeaderTag = (html: string): string => {
    if (!html) return 'h1';
    const match = html.match(/<h([1-6])/i);
    return match ? `h${match[1]}` : 'h1';
};

const HeaderSettings = ({ block, onStyleChange, onContentChange }: { block: any, onStyleChange: any, onContentChange: any }) => {
    const { t } = useTranslation();
    const s = block.style || {};
    const c = block.content || {};

    const handleContentChange = (key: string, value: any) => {
        onContentChange(block.id, { [key]: value });
    };

    const handleStyleChange = (key: string, value: any) => {
        onStyleChange(block.id, { [key]: value });
    };

    const handleTextChange = (newText: string) => {
        const tag = getHeaderTag(c.html);
        handleContentChange('html', `<${tag}>${newText}</${tag}>`);
    }

    const handleTagChange = (newTag: string) => {
        const text = getHeaderText(c.html);
        handleContentChange('html', `<${newTag}>${text}</${newTag}>`);
    }
    
    const FONT_FAMILIES = [
        "'Inter', Arial, sans-serif",
        "Georgia, serif",
        "'Times New Roman', Times, serif",
        "Tahoma, Geneva, sans-serif",
        "'Trebuchet MS', Helvetica, sans-serif",
        "Verdana, Geneva, sans-serif",
    ];

    return (
        <>
            <Section title={t('content')}>
                <div className="form-group">
                    <label htmlFor={`text-${block.id}`}>{t('text')}</label>
                    <textarea 
                        id={`text-${block.id}`} 
                        value={getHeaderText(c.html)} 
                        onChange={(e) => handleTextChange(e.target.value)} 
                        rows={2}
                    />
                </div>
                <LabeledControl label={t('tag')}>
                    <select value={getHeaderTag(c.html)} onChange={(e) => handleTagChange(e.target.value)}>
                        <option value="h1">H1</option>
                        <option value="h2">H2</option>
                        <option value="h3">H3</option>
                        <option value="h4">H4</option>
                        <option value="h5">H5</option>
                        <option value="h6">H6</option>
                    </select>
                </LabeledControl>
            </Section>
            
            <Section title={t('style')}>
                <LabeledControl label={t('textColor')}>
                    <ColorInput value={s.color} onChange={(val) => handleStyleChange('color', val)} onAdd={() => handleStyleChange('color', '#000000')} onRemove={() => {}} />
                </LabeledControl>
                <LabeledControl label={t('backgroundColor')}>
                    <ColorInput value={s.backgroundColor} onChange={(val) => handleStyleChange('backgroundColor', val)} onAdd={() => handleStyleChange('backgroundColor', '#FFFFFF')} onRemove={() => handleStyleChange('backgroundColor', 'transparent')} />
                </LabeledControl>
                 <div className="form-group">
                    <label>{t('fontFamily')}</label>
                     <select value={s.fontFamily} onChange={(e) => handleStyleChange('fontFamily', e.target.value)}>
                        {FONT_FAMILIES.map(font => <option key={font} value={font}>{font.split(',')[0].replace(/'/g, '')}</option>)}
                    </select>
                </div>
                <LabeledControl label={t('fontWeight')}>
                     <SegmentedControl
                        value={s.fontWeight === 'bold' ? 'bold' : 'normal'}
                        onChange={(val) => handleStyleChange('fontWeight', val)}
                        options={[
                            { value: 'normal', label: t('regular')},
                            { value: 'bold', label: t('bold')},
                        ]}
                    />
                </LabeledControl>
            </Section>

            <Section title={t('alignment')}>
                <LabeledControl label={t('alignment')}>
                    <SegmentedControl
                        value={s.textAlign || 'left'}
                        onChange={(val) => handleStyleChange('textAlign', val)}
                        isIconOnly
                        options={[
                            { value: 'left', label: t('alignLeft'), icon: ICONS.ALIGN_LEFT },
                            { value: 'center', label: t('alignCenter'), icon: ICONS.ALIGN_CENTER },
                            { value: 'right', label: t('alignRight'), icon: ICONS.ALIGN_RIGHT },
                        ]}
                    />
                </LabeledControl>
            </Section>

            <Section title={t('padding')}>
                <div className="padding-control-grid">
                    <PaddingSlider label={t('top')} value={getPixelValue(s.paddingTop)} onChange={val => handleStyleChange('paddingTop', `${val}px`)} />
                    <PaddingSlider label={t('bottom')} value={getPixelValue(s.paddingBottom)} onChange={val => handleStyleChange('paddingBottom', `${val}px`)} />
                    <PaddingSlider label={t('left')} value={getPixelValue(s.paddingLeft)} onChange={val => handleStyleChange('paddingLeft', `${val}px`)} />
                    <PaddingSlider label={t('right')} value={getPixelValue(s.paddingRight)} onChange={val => handleStyleChange('paddingRight', `${val}px`)} />
                </div>
            </Section>
        </>
    );
};


const ImageSettings = ({ block, onStyleChange, onContentChange, onOpenMediaManager }: { block: any, onStyleChange: any, onContentChange: any, onOpenMediaManager: (id: string) => void }) => {
    const { t } = useTranslation();
    const s = block.style || {};
    const c = block.content || {};

    const handleContentChange = (key: string, value: any) => {
        onContentChange(block.id, { [key]: value });
    };

     const handleStyleChange = (key: string, value: any) => {
        onStyleChange(block.id, { [key]: value });
    };

    return (
        <>
            <Section title="">
                <div className="form-group">
                    <label htmlFor={`src-${block.id}`}>{t('sourceUrl')}</label>
                    <div className="input-with-button">
                        <input id={`src-${block.id}`} type="url" value={c.src || ''} onChange={(e) => handleContentChange('src', e.target.value)} placeholder="https://..." />
                        <button className="btn" onClick={() => onOpenMediaManager(block.id)}><Icon path={ICONS.IMAGE} /></button>
                    </div>
                </div>
                <div className="form-group">
                    <label htmlFor={`alt-${block.id}`}>{t('altText')}</label>
                    <input id={`alt-${block.id}`} type="text" value={c.alt || ''} onChange={(e) => handleContentChange('alt', e.target.value)} placeholder="Image description" />
                </div>
                <div className="form-group">
                    <label htmlFor={`href-${block.id}`}>{t('clickThroughUrl')}</label>
                    <input id={`href-${block.id}`} type="url" value={c.href || ''} onChange={(e) => handleContentChange('href', e.target.value)} placeholder="https://..." />
                </div>
            </Section>

            <Section title={t('sizing')}>
                <LabeledControl label={t('width')}>
                    <div className="segmented-control">
                        <button className={c.width === 'auto' ? 'active' : ''} onClick={() => handleContentChange('width', 'auto')}>{t('auto')}</button>
                        <NumberInputWithUnit value={c.width} onChange={(val) => handleContentChange('width', val)} />
                    </div>
                </LabeledControl>
                 <LabeledControl label={t('height')}>
                     <div className="segmented-control">
                        <button className={c.height === 'auto' ? 'active' : ''} onClick={() => handleContentChange('height', 'auto')}>{t('auto')}</button>
                        <NumberInputWithUnit value={c.height} onChange={(val) => handleContentChange('height', val)} />
                    </div>
                </LabeledControl>
            </Section>

            <Section title={t('alignment')}>
                 <LabeledControl label={t('verticalAlign')}>
                    <SegmentedControl
                        value={s.verticalAlign || 'middle'}
                        onChange={(val) => handleStyleChange('verticalAlign', val)}
                        options={[
                            { value: 'top', label: t('verticalAlignTop')},
                            { value: 'middle', label: t('verticalAlignMiddle')},
                            { value: 'bottom', label: t('verticalAlignBottom')},
                        ]}
                    />
                </LabeledControl>
                <LabeledControl label={t('alignment')}>
                    <SegmentedControl
                        value={s.textAlign || 'center'}
                        onChange={(val) => handleStyleChange('textAlign', val)}
                        isIconOnly
                        options={[
                            { value: 'left', label: t('alignLeft'), icon: ICONS.ALIGN_LEFT },
                            { value: 'center', label: t('alignCenter'), icon: ICONS.ALIGN_CENTER },
                            { value: 'right', label: t('alignRight'), icon: ICONS.ALIGN_RIGHT },
                        ]}
                    />
                </LabeledControl>
            </Section>
            
            <Section title={t('style')}>
                 <LabeledControl label={t('backgroundColor')}>
                    <ColorInput value={s.backgroundColor} onChange={(val) => handleStyleChange('backgroundColor', val)} onAdd={() => handleStyleChange('backgroundColor', '#ffffff')} onRemove={() => handleStyleChange('backgroundColor', 'transparent')} />
                </LabeledControl>
                <Slider label={t('borderRadius')} value={getPixelValue(s.borderRadius)} onChange={(val) => handleStyleChange('borderRadius', `${val}px`)} max={50} />
            </Section>

            <Section title={t('padding')}>
                <div className="padding-control-grid">
                    <PaddingSlider label={t('top')} value={getPixelValue(s.paddingTop)} onChange={val => handleStyleChange('paddingTop', `${val}px`)} />
                    <PaddingSlider label={t('bottom')} value={getPixelValue(s.paddingBottom)} onChange={val => handleStyleChange('paddingBottom', `${val}px`)} />
                    <PaddingSlider label={t('left')} value={getPixelValue(s.paddingLeft)} onChange={val => handleStyleChange('paddingLeft', `${val}px`)} />
                    <PaddingSlider label={t('right')} value={getPixelValue(s.paddingRight)} onChange={val => handleStyleChange('paddingRight', `${val}px`)} />
                </div>
            </Section>
        </>
    );
};

const ButtonSettings = ({ block, onStyleChange, onContentChange }: { block: any, onStyleChange: any, onContentChange: any }) => {
    const { t } = useTranslation();
    const s = block.style || {};
    const c = block.content || {};

    const handleContentChange = (key: string, value: any) => {
        onContentChange(block.id, { [key]: value });
    };

    const handleStyleChange = (key: string, value: any) => {
        onStyleChange(block.id, { [key]: value });
    };

    const handleAlignmentChange = (value: string) => {
        if (value === 'full') {
            onStyleChange(block.id, { width: 'full', textAlign: 'center' });
        } else {
            onStyleChange(block.id, { width: 'auto', textAlign: value });
        }
    };
    
    const alignmentValue = s.width === 'full' ? 'full' : s.textAlign || 'center';

    return (
        <>
            <Section title={t('content')}>
                <div className="form-group">
                    <label htmlFor={`text-${block.id}`}>{t('buttonText')}</label>
                    <input id={`text-${block.id}`} type="text" value={c.text || ''} onChange={(e) => handleContentChange('text', e.target.value)} />
                </div>
                <div className="form-group">
                    <label htmlFor={`href-${block.id}`}>{t('url')}</label>
                    <input id={`href-${block.id}`} type="url" value={c.href || ''} onChange={(e) => handleContentChange('href', e.target.value)} placeholder="https://" />
                </div>
            </Section>

            <Section title={t('style')}>
                <LabeledControl label={t('textColor')}>
                    <ColorInput value={s.textColor} onChange={(val) => handleStyleChange('textColor', val)} onAdd={() => handleStyleChange('textColor', '#FFFFFF')} onRemove={() => {}} />
                </LabeledControl>
                <LabeledControl label={t('buttonColor')}>
                    <ColorInput value={s.backgroundColor} onChange={(val) => handleStyleChange('backgroundColor', val)} onAdd={() => handleStyleChange('backgroundColor', '#007BFF')} onRemove={() => {}} />
                </LabeledControl>
                <LabeledControl label={t('fontSize')}>
                    <NumberInputWithUnit value={getPixelValue(s.fontSize)} onChange={val => handleStyleChange('fontSize', `${val}px`)} />
                </LabeledControl>
                <LabeledControl label={t('fontWeight')}>
                     <SegmentedControl
                        value={s.fontWeight === 'bold' ? 'bold' : 'normal'}
                        onChange={(val) => handleStyleChange('fontWeight', val)}
                        options={[
                            { value: 'normal', label: t('regular')},
                            { value: 'bold', label: t('bold')},
                        ]}
                    />
                </LabeledControl>
            </Section>

            <Section title={t('alignment')}>
                <LabeledControl label={t('alignment')}>
                    <SegmentedControl
                        value={alignmentValue}
                        onChange={handleAlignmentChange}
                        options={[
                            { value: 'left', label: t('alignLeft'), icon: ICONS.ALIGN_LEFT },
                            { value: 'center', label: t('alignCenter'), icon: ICONS.ALIGN_CENTER },
                            { value: 'right', label: t('alignRight'), icon: ICONS.ALIGN_RIGHT },
                            { value: 'full', label: t('full') },
                        ]}
                    />
                </LabeledControl>
            </Section>

            <Section title={t('sizing')}>
                <Slider label={t('corners')} value={getPixelValue(s.borderRadius)} onChange={(val) => handleStyleChange('borderRadius', `${val}px`)} max={50} />
                <Slider label={t('vertical')} value={getPixelValue(s.paddingY)} onChange={(val) => handleStyleChange('paddingY', `${val}px`)} max={50} />
                <Slider label={t('horizontal')} value={getPixelValue(s.paddingX)} onChange={(val) => handleStyleChange('paddingX', `${val}px`)} max={100} />
            </Section>
        </>
    );
};

const SpacerSettings = ({ block, onContentChange, onStyleChange }: { block: any, onContentChange: any, onStyleChange: any }) => {
    const { t } = useTranslation();
    const s = block.style || {};
    const c = block.content || {};

    const handleContentChange = (key: string, value: any) => {
        onContentChange(block.id, { [key]: value });
    };

    const handleStyleChange = (key: string, value: any) => {
        onStyleChange(block.id, { [key]: value });
    };

    return (
        <>
            <Section title={t('sizing')}>
                <Slider label={t('height')} value={c.height || 30} onChange={(val) => handleContentChange('height', val)} max={200} />
            </Section>
            <Section title={t('style')}>
                <LabeledControl label={t('fillColor')}>
                    <ColorInput 
                        value={s.backgroundColor} 
                        onChange={(val) => handleStyleChange('backgroundColor', val)} 
                        onAdd={() => handleStyleChange('backgroundColor', '#FFFFFF')} 
                        onRemove={() => handleStyleChange('backgroundColor', 'transparent')} 
                    />
                </LabeledControl>
            </Section>
        </>
    );
};

const TextSettings = ({ block, onStyleChange, onContentChange }: { block: any, onStyleChange: any, onContentChange: any }) => {
    const { t } = useTranslation();
    const s = block.style || {};
    const c = block.content || {};
    
    const handleStyleChange = (key: string, value: any) => {
        onStyleChange(block.id, { [key]: value });
    };
    
    const handleContentChange = (key: string, value: any) => {
        onContentChange(block.id, { [key]: value });
    };
    
    const FONT_FAMILIES = [
        "'Inter', Arial, sans-serif",
        "Georgia, serif",
        "'Times New Roman', Times, serif",
        "Tahoma, Geneva, sans-serif",
        "'Trebuchet MS', Helvetica, sans-serif",
        "Verdana, Geneva, sans-serif",
    ];

    return (
        <>
            <Section title={t('content')}>
                <div className="form-group">
                    <label htmlFor={`content-${block.id}`}>{t('content')}</label>
                    <textarea 
                        id={`content-${block.id}`} 
                        value={c.html || ''} 
                        onChange={(e) => handleContentChange('html', e.target.value)} 
                        rows={6}
                        style={{fontFamily: 'monospace', fontSize: '12px'}}
                    />
                </div>
            </Section>
            <Section title={t('style')}>
                <LabeledControl label={t('textColor')}>
                    <ColorInput value={s.color} onChange={(val) => handleStyleChange('color', val)} onAdd={() => handleStyleChange('color', '#333333')} onRemove={() => {}} />
                </LabeledControl>
                <LabeledControl label={t('backgroundColor')}>
                    <ColorInput value={s.backgroundColor} onChange={(val) => handleStyleChange('backgroundColor', val)} onAdd={() => handleStyleChange('backgroundColor', '#FFFFFF')} onRemove={() => handleStyleChange('backgroundColor', 'transparent')} />
                </LabeledControl>
                 <div className="form-group">
                    <label>{t('fontFamily')}</label>
                     <select value={s.fontFamily} onChange={(e) => handleStyleChange('fontFamily', e.target.value)}>
                        {FONT_FAMILIES.map(font => <option key={font} value={font}>{font.split(',')[0].replace(/'/g, '')}</option>)}
                    </select>
                </div>
                <LabeledControl label={t('fontSize')}>
                    <NumberInputWithUnit value={getPixelValue(s.fontSize)} onChange={val => handleStyleChange('fontSize', `${val}px`)} />
                </LabeledControl>
                <LabeledControl label={t('fontWeight')}>
                     <SegmentedControl
                        value={s.fontWeight === 'bold' ? 'bold' : 'normal'}
                        onChange={(val) => handleStyleChange('fontWeight', val)}
                        options={[ { value: 'normal', label: t('regular')}, { value: 'bold', label: t('bold')} ]}
                    />
                </LabeledControl>
                 <LabeledControl label={t('alignment')}>
                    <SegmentedControl
                        value={s.textAlign || 'left'}
                        onChange={(val) => handleStyleChange('textAlign', val)}
                        isIconOnly
                        options={[ { value: 'left', icon: ICONS.ALIGN_LEFT, label: t('alignLeft') }, { value: 'center', icon: ICONS.ALIGN_CENTER, label: t('alignCenter') }, { value: 'right', icon: ICONS.ALIGN_RIGHT, label: t('alignRight') } ]}
                    />
                </LabeledControl>
            </Section>
            <Section title={t('padding')}>
                <div className="padding-control-grid">
                    <PaddingSlider label={t('top')} value={getPixelValue(s.paddingTop)} onChange={val => handleStyleChange('paddingTop', `${val}px`)} />
                    <PaddingSlider label={t('bottom')} value={getPixelValue(s.paddingBottom)} onChange={val => handleStyleChange('paddingBottom', `${val}px`)} />
                    <PaddingSlider label={t('left')} value={getPixelValue(s.paddingLeft)} onChange={val => handleStyleChange('paddingLeft', `${val}px`)} />
                    <PaddingSlider label={t('right')} value={getPixelValue(s.paddingRight)} onChange={val => handleStyleChange('paddingRight', `${val}px`)} />
                </div>
            </Section>
        </>
    );
};

const ColumnsSettings = ({ block, onStyleChange }: { block: any, onStyleChange: any }) => {
    const { t } = useTranslation();
    const s = block.style || {};

    const handleStyleChange = (key: string, value: any) => {
        onStyleChange(block.id, { [key]: value });
    };

    return (
        <>
            <Section title={t('style')}>
                <LabeledControl label={t('backgroundColor')}>
                    <ColorInput value={s.backgroundColor} onChange={(val) => handleStyleChange('backgroundColor', val)} onAdd={() => handleStyleChange('backgroundColor', '#FFFFFF')} onRemove={() => handleStyleChange('backgroundColor', 'transparent')} />
                </LabeledControl>
                 <LabeledControl label={t('verticalAlign')}>
                    <SegmentedControl
                        value={s.verticalAlign || 'top'}
                        onChange={(val) => handleStyleChange('verticalAlign', val)}
                        options={[ { value: 'top', label: t('top')}, { value: 'middle', label: t('middle')}, { value: 'bottom', label: t('bottom')} ]}
                    />
                </LabeledControl>
                <Slider label={t('gap')} value={getPixelValue(s.gap)} onChange={(val) => handleStyleChange('gap', val)} max={50} />
            </Section>
            <Section title={t('padding')}>
                <div className="padding-control-grid">
                     <PaddingSlider label={t('top')} value={getPixelValue(s.paddingTop)} onChange={val => handleStyleChange('paddingTop', `${val}px`)} />
                    <PaddingSlider label={t('bottom')} value={getPixelValue(s.paddingBottom)} onChange={val => handleStyleChange('paddingBottom', `${val}px`)} />
                    <PaddingSlider label={t('left')} value={getPixelValue(s.paddingLeft)} onChange={val => handleStyleChange('paddingLeft', `${val}px`)} />
                    <PaddingSlider label={t('right')} value={getPixelValue(s.paddingRight)} onChange={val => handleStyleChange('paddingRight', `${val}px`)} />
                </div>
            </Section>
        </>
    );
};

const DividerSettings = ({ block, onStyleChange }: { block: any, onStyleChange: any }) => {
    const { t } = useTranslation();
    const s = block.style || {};

    const handleStyleChange = (key: string, value: any) => {
        onStyleChange(block.id, { [key]: value });
    };

    return (
        <>
            <Section title={t('style')}>
                <LabeledControl label={t('dividerColor')}>
                     <ColorInput value={s.color} onChange={(val) => handleStyleChange('color', val)} onAdd={() => handleStyleChange('color', '#cccccc')} onRemove={() => {}} />
                </LabeledControl>
                <LabeledControl label={t('backgroundColor')}>
                     <ColorInput value={s.backgroundColor} onChange={(val) => handleStyleChange('backgroundColor', val)} onAdd={() => handleStyleChange('backgroundColor', '#FFFFFF')} onRemove={() => handleStyleChange('backgroundColor', 'transparent')} />
                </LabeledControl>
                <LabeledControl label={t('style')}>
                    <select value={s.style || 'solid'} onChange={e => handleStyleChange('style', e.target.value)}>
                        <option value="solid">{t('solid')}</option>
                        <option value="dashed">{t('dashed')}</option>
                        <option value="dotted">{t('dotted')}</option>
                    </select>
                </LabeledControl>
            </Section>
             <Section title={t('sizing')}>
                <Slider label={t('thickness')} value={getPixelValue(s.height)} onChange={(val) => handleStyleChange('height', `${val}px`)} min={1} max={20} />
                <Slider label={t('padding')} value={getPixelValue(s.paddingY)} onChange={(val) => handleStyleChange('paddingY', `${val}px`)} max={100} />
             </Section>
        </>
    )
};

const ProductSettings = ({ block, onStyleChange }: { block: any, onStyleChange: any }) => {
    return <ColumnsSettings block={block} onStyleChange={onStyleChange} />;
};

const FooterSettings = ({ block, onStyleChange, onContentChange }: { block: any, onStyleChange: any, onContentChange: any }) => {
    const { t } = useTranslation();
    const s = block.style || {};
    const c = block.content || {};

    const handleContentChange = (key: string, value: any) => {
        onContentChange(block.id, { [key]: value });
    };

    const handleStyleChange = (key: string, value: any) => {
        onStyleChange(block.id, { [key]: value });
    };

    return (
        <>
            <Section title={t('content')}>
                <div className="form-group">
                    <label>{t('permissionReminder')}</label>
                    <textarea value={c.permissionReminder} onChange={e => handleContentChange('permissionReminder', e.target.value)} rows={3} />
                </div>
                 <div className="form-group">
                    <label>{t('contactInfo')}</label>
                    <textarea value={c.contactInfo} onChange={e => handleContentChange('contactInfo', e.target.value)} rows={4} />
                </div>
                <div className="form-group">
                    <label>{t('unsubscribeLinkText')}</label>
                    <input type="text" value={c.unsubscribeText} onChange={e => handleContentChange('unsubscribeText', e.target.value)} />
                </div>
                <div className="form-group">
                    <label>{t('managePreferencesLinkText')}</label>
                    <input type="text" value={c.managePreferencesText} onChange={e => handleContentChange('managePreferencesText', e.target.value)} />
                </div>
                <div className="form-group">
                    <label>{t('viewOnlineLinkText')}</label>
                    <input type="text" value={c.viewOnlineText} onChange={e => handleContentChange('viewOnlineText', e.target.value)} />
                </div>
            </Section>
            <Section title={t('style')}>
                <LabeledControl label={t('backgroundColor')}>
                    <ColorInput value={s.backgroundColor} onChange={(val) => handleStyleChange('backgroundColor', val)} onAdd={() => handleStyleChange('backgroundColor', '#FFFFFF')} onRemove={() => handleStyleChange('backgroundColor', 'transparent')} />
                </LabeledControl>
                 <LabeledControl label={t('textColor')}>
                    <ColorInput value={s.textColor} onChange={(val) => handleStyleChange('textColor', val)} onAdd={() => handleStyleChange('textColor', '#6c757d')} onRemove={() => {}} />
                </LabeledControl>
                <LabeledControl label={t('linkColor')}>
                    <ColorInput value={s.linkColor} onChange={(val) => handleStyleChange('linkColor', val)} onAdd={() => handleStyleChange('linkColor', '#007BFF')} onRemove={() => {}} />
                </LabeledControl>
                <LabeledControl label={t('fontSize')}>
                    <NumberInputWithUnit value={getPixelValue(s.fontSize)} onChange={val => handleStyleChange('fontSize', `${val}px`)} />
                </LabeledControl>
            </Section>
        </>
    );
};


const SettingsPanel = ({ block, globalStyles, onGlobalStyleChange, onStyleChange, onContentChange, onOpenMediaManager, onClose }: { block: any, globalStyles: any, onGlobalStyleChange: any, onStyleChange: any, onContentChange: any, onOpenMediaManager: any, onClose: () => void }) => {
    const { t } = useTranslation();

    const renderSettingsForBlock = () => {
        switch (block.type) {
            case 'Header':
                return <HeaderSettings block={block} onStyleChange={onStyleChange} onContentChange={onContentChange} />;
            case 'Image':
                return <ImageSettings block={block} onStyleChange={onStyleChange} onContentChange={onContentChange} onOpenMediaManager={onOpenMediaManager} />;
            case 'Button':
                 return <ButtonSettings block={block} onStyleChange={onStyleChange} onContentChange={onContentChange} />;
            case 'Spacer':
                 return <SpacerSettings block={block} onStyleChange={onStyleChange} onContentChange={onContentChange} />;
            case 'Text':
                 return <TextSettings block={block} onStyleChange={onStyleChange} onContentChange={onContentChange} />;
            case 'Columns':
                 return <ColumnsSettings block={block} onStyleChange={onStyleChange} />;
            case 'Divider':
                 return <DividerSettings block={block} onStyleChange={onStyleChange} />;
            case 'Product':
                return <ProductSettings block={block} onStyleChange={onStyleChange} />;
            case 'Footer':
                return <FooterSettings block={block} onStyleChange={onStyleChange} onContentChange={onContentChange} />;
            default:
                return (
                    <CenteredMessage style={{ padding: '2rem', flexGrow: 1 }}>
                        <div className="info-message">
                             <strong>{block.type} Block</strong>
                             <p>Settings for this block type are not yet implemented.</p>
                        </div>
                    </CenteredMessage>
                );
        }
    };
    
    const getBlockTypeTranslationKey = (type: string) => {
        switch(type) {
            case 'Image': return 'imageBlock';
            case 'Button': return 'buttonBlock';
            case 'Header': return 'headerBlock';
            case 'Spacer': return 'spacerBlock';
            case 'Text': return 'textBlock';
            case 'Columns': return 'columnsBlock';
            case 'Divider': return 'dividerBlock';
            case 'Product': return 'productBlock';
            case 'Footer': return 'footerBlock';
            default: return type;
        }
    }

    const title = !block ? t('global') : t(getBlockTypeTranslationKey(block.type));

    return (
        <aside
            className="builder-settings-panel"
            onClick={e => e.stopPropagation()}
        >
            <div className="settings-panel-header">
                <h3>{title}</h3>
                <button className="modal-close-btn" onClick={onClose} aria-label={t('close')}>
                    &times;
                </button>
            </div>
            
            <div className="settings-panel-body">
            {!block ? (
                <GlobalSettings styles={globalStyles} onChange={onGlobalStyleChange} />
            ) : (
                renderSettingsForBlock()
            )}
            </div>
        </aside>
    );
};

export default SettingsPanel;