

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    DragStartEvent,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
} from '@dnd-kit/sortable';
import { produce } from 'immer';

import Icon, { ICONS } from '../components/Icon';
import Toolbar, { TOOLBAR_COMPONENTS } from '../components/email_builder/Toolbar';
import Canvas from '../components/email_builder/Canvas';
import { renderBlock } from '../components/email_builder/blocks';
import MediaManagerModal from '../components/media_manager/MediaManagerModal';
import { FileInfo } from '../api/types';
import { ELASTIC_EMAIL_API_V4_BASE } from '../api/config';
import { useToast } from '../contexts/ToastContext';
import Loader from '../components/Loader';
import SettingsPanel from '../components/email_builder/SettingsPanel';
import useApiV4 from '../hooks/useApiV4';
import Modal from '../components/Modal';
import { apiFetchV4 } from '../api/elasticEmail';


const generateId = (prefix = 'block') => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// --- START HTML GENERATION ---
const styleObjectToString = (style: React.CSSProperties | undefined): string => {
    if (!style) return '';
    return Object.entries(style)
        .map(([key, value]) => {
            if (value === undefined || value === null || value === '') return '';
            const kebabKey = key.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
            
            if (kebabKey === 'padding-y') {
                const pxVal = typeof value === 'number' ? `${value}px` : value;
                return `padding-top: ${pxVal}; padding-bottom: ${pxVal};`;
            }
            if (kebabKey === 'padding-x') {
                const pxVal = typeof value === 'number' ? `${value}px` : value;
                return `padding-left: ${pxVal}; padding-right: ${pxVal};`;
            }
            
            const cssValue = typeof value === 'number' && !['line-height', 'font-weight', 'opacity', 'flex'].includes(kebabKey)
                ? `${value}px`
                : value;
            
            return `${kebabKey}: ${cssValue};`;
        })
        .join(' ');
};

const renderBlockToHtml = (block: any): string => {
    const { type, content, style } = block;
    const styleStr = styleObjectToString(style);

    switch (type) {
        case 'Header':
        case 'Text':
        case 'Footer':
            return `<div style="${styleStr}">${content.html || ''}</div>`;
        case 'Image': {
            const imgStyle = styleObjectToString({
                display: 'block',
                maxWidth: '100%',
                width: content.width === 'auto' ? 'auto' : `${parseInt(String(content.width), 10)}px`,
                height: content.height === 'auto' ? 'auto' : `${parseInt(String(content.height), 10)}px`,
                borderRadius: style.borderRadius ? `${parseInt(String(style.borderRadius), 10)}px` : '0px',
            });
            const img = `<img src="${content.src}" alt="${content.alt || ''}" style="${imgStyle}" width="${content.width === 'auto' ? '' : parseInt(String(content.width), 10)}" />`;
            const wrapper = content.href
                ? `<a href="${content.href}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: block;">${img}</a>`
                : img;
            return `<div style="${styleStr}">${wrapper}</div>`;
        }
        case 'Button': {
            const tableAlign = style.width === 'full' ? 'center' : style.textAlign;
            const buttonStyle = styleObjectToString({
                display: 'inline-block',
                backgroundColor: style.backgroundColor,
                color: style.textColor,
                fontFamily: style.fontFamily,
                fontSize: style.fontSize,
                fontWeight: style.fontWeight,
                lineHeight: '120%',
                margin: 0,
                textDecoration: 'none',
                textTransform: 'none',
                padding: `${style.paddingY} ${style.paddingX}`,
                borderRadius: style.borderRadius,
            });
            return `
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                        <td align="${tableAlign}" style="padding: 10px 20px;">
                            <table border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" valign="middle" bgcolor="${style.backgroundColor}" style="border-radius:${style.borderRadius};">
                                        <a href="${content.href}" target="_blank" style="${buttonStyle}">${content.text}</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            `;
        }
        case 'Spacer':
            return `<div style="height: ${content.height}px; background-color: ${style.backgroundColor || 'transparent'};"></div>`;
        case 'Divider': {
            const wrapperStyle = styleObjectToString({
                padding: `${style.paddingY} 0`,
                backgroundColor: style.backgroundColor || 'transparent'
            });
             const lineStyle = styleObjectToString({
                borderTop: `${style.height} ${style.style} ${style.color}`
             });
            return `<div style="${wrapperStyle}"><div style="${lineStyle}"></div></div>`;
        }
        case 'Columns':
        case 'Product': {
             const totalFlex = content.columns.reduce((acc: number, col: any) => acc + (col.flex || 1), 0);
             const colsHtml = content.columns.map((col: any) => {
                const width = `${((col.flex || 1) / totalFlex) * 100}%`;
                const colContent = col.items.map(renderBlockToHtml).join('');
                return `<td valign="${style.verticalAlign || 'top'}" width="${width}" style="padding: 0 8px;">${colContent}</td>`;
             }).join('');
             return `<table border="0" cellpadding="0" cellspacing="0" width="100%" style="${styleStr}"><tr>${colsHtml}</tr></table>`;
        }
        default:
            return '';
    }
};
// --- END HTML GENERATION ---


// Helper to find an item and its parent array in a nested structure
const findItemContainer = (items: any[], itemId: string): { container: any[], index: number } | null => {
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.id === itemId) {
            return { container: items, index: i };
        }
        if ((item.type === 'Columns' || item.type === 'Product') && item.content.columns) {
            for (const column of item.content.columns) {
                const found = findItemContainer(column.items, itemId);
                if (found) {
                    return found;
                }
            }
        }
    }
    return null;
};

// Helper to find and mutate a nested item using Immer drafts
const findAndMutateItem = (items: any[], itemId: string, mutator: (item: any) => void): boolean => {
    for (const item of items) {
        if (item.id === itemId) {
            mutator(item);
            return true;
        }
        if ((item.type === 'Columns' || item.type === 'Product') && item.content.columns) {
            for (const column of item.content.columns) {
                if (findAndMutateItem(column.items, itemId, mutator)) {
                    return true;
                }
            }
        }
    }
    return false;
};

// Helper to find a nested item
const findBlockById = (items: any[], id: string): any | null => {
    for (const item of items) {
        if (item.id === id) {
            return item;
        }
        if ((item.type === 'Columns' || item.type === 'Product') && item.content.columns) {
            for (const column of item.content.columns) {
                const found = findBlockById(column.items, id);
                if (found) {
                    return found;
                }
            }
        }
    }
    return null;
};


const EmailBuilderView = ({ apiKey, user }: { apiKey: string, user: any }) => {
    const { t } = useTranslation();
    const { addToast } = useToast();
    const [items, setItems] = useState<any[]>([]);
    const [activeItem, setActiveItem] = useState<any | null>(null);
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
    const [editingImageBlockId, setEditingImageBlockId] = useState<string | null>(null);
    const [isUpdatingImage, setIsUpdatingImage] = useState(false);
    const canvasWrapperRef = useRef<HTMLDivElement>(null);
    const [latestImageContent, setLatestImageContent] = useState<{ src: string, alt: string } | null>(null);

    const [isMobileView, setIsMobileView] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
    const [generatedHtml, setGeneratedHtml] = useState('');
    const [templateName, setTemplateName] = useState('');
    const [subject, setSubject] = useState('');
    const [fromName, setFromName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    const [settingsView, setSettingsView] = useState<'block' | 'global' | null>(null);
    
    const [globalStyles, setGlobalStyles] = useState({
        backdropColor: '#F7F9FC',
        canvasColor: '#FFFFFF',
        canvasBorderRadius: 0,
        canvasBorderColor: 'transparent',
        defaultFontFamily: "'Inter', Arial, sans-serif",
        defaultTextColor: '#333333',
    });

    const { data: filesData } = useApiV4(
        '/files',
        apiKey,
        { limit: 100 },
        1 // Only fetch once on mount
    );

    const toBase64 = (blob: Blob) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
    
    useEffect(() => {
        if (!filesData || !Array.isArray(filesData)) return;

        const imageFiles = filesData
            .filter((file: FileInfo) => /\.(jpe?g|png|gif|webp|svg)$/i.test(file.FileName))
            .sort((a, b) => new Date(b.DateAdded).getTime() - new Date(a.DateAdded).getTime());

        if (imageFiles.length > 0) {
            const latestImage = imageFiles[0];
            let isCancelled = false;

            const fetchAndSetLatestImage = async () => {
                try {
                    const url = `${ELASTIC_EMAIL_API_V4_BASE}/files/${encodeURIComponent(latestImage.FileName)}`;
                    const response = await fetch(url, { headers: { 'X-ElasticEmail-ApiKey': apiKey } });
                    if (!response.ok) throw new Error(`Failed to fetch latest image: ${response.statusText}`);

                    const blob = await response.blob();
                    const base64 = await toBase64(blob);

                    if (!isCancelled) {
                        setLatestImageContent({ src: base64, alt: latestImage.FileName });
                    }
                } catch (error) {
                    console.error("Failed to preload latest image:", error);
                }
            };

            fetchAndSetLatestImage();

            return () => {
                isCancelled = true;
            };
        }
    }, [filesData, apiKey]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const generateEmailHtml = useCallback((): string => {
        const bodyStyle = styleObjectToString({
            fontFamily: globalStyles.defaultFontFamily,
            color: globalStyles.defaultTextColor,
            margin: 0,
            padding: 0,
            backgroundColor: globalStyles.backdropColor
        });

        const canvasStyle = styleObjectToString({
            backgroundColor: globalStyles.canvasColor,
            borderRadius: `${globalStyles.canvasBorderRadius}px`,
            border: `1px solid ${globalStyles.canvasBorderColor}`,
            maxWidth: '600px',
        });
        
        const contentHtml = items.map(renderBlockToHtml).join('');

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${subject || 'Email'}</title>
                <style>
                    body { font-family: ${globalStyles.defaultFontFamily}; }
                </style>
            </head>
            <body style="${bodyStyle}">
                <center>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto;">
                        <tr>
                            <td align="center">
                                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="${canvasStyle}">
                                    <tr>
                                        <td style="padding: 1rem;">
                                            ${contentHtml}
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </center>
            </body>
            </html>
        `;
    }, [items, globalStyles, subject]);
    
    const handleSaveTemplate = async () => {
        if (!templateName) {
            addToast(t('templateNameRequired'), 'error');
            return;
        }
        setIsSaving(true);
    
        const htmlContent = generateEmailHtml();
        const payload = {
            Name: templateName,
            Subject: subject,
            Body: [{
                ContentType: "HTML",
                Content: htmlContent,
                Charset: "utf-8"
            }],
            TemplateScope: "Personal"
        };
    
        try {
            let existingTemplate = null;
            try {
                // Check if a template with this name already exists
                existingTemplate = await apiFetchV4(`/templates/${encodeURIComponent(templateName)}`, apiKey);
            } catch (e: any) {
                // A 404 error is expected if the template is new, so we can ignore it.
                if (e.message.includes('404')) {
                    // Not found, which is fine for creation.
                } else {
                    throw e; // Re-throw other errors
                }
            }
    
            if (existingTemplate) {
                // If it exists, update it (PUT)
                await apiFetchV4(`/templates/${encodeURIComponent(templateName)}`, apiKey, { method: 'PUT', body: payload });
            } else {
                // If it doesn't exist, create it (POST)
                await apiFetchV4('/templates', apiKey, { method: 'POST', body: payload });
            }
    
            addToast(t('saveTemplateSuccess', { name: templateName }), 'success');
        } catch (err: any) {
            addToast(t('saveTemplateError', { error: err.message }), 'error');
        } finally {
            setIsSaving(false);
        }
    };
    

    const toggleMobileView = () => setIsMobileView(v => !v);

    const prepareAndShowHtml = (mode: 'preview' | 'code') => {
        const html = generateEmailHtml();
        setGeneratedHtml(html);
        if (mode === 'preview') {
            setIsPreviewModalOpen(true);
        } else {
            setIsCodeModalOpen(true);
        }
    };

    const handleExportHtml = () => {
        const html = generateEmailHtml();
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'email-template.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleExportJson = () => {
        const data = { globalStyles, items, subject };
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'email-template.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    
    const handleDragStart = useCallback((event: DragStartEvent) => {
        setSelectedBlockId(null);
        setSettingsView(null);
        const { active } = event;
        const activeId = active.id as string;
        
        const toolbarItem = TOOLBAR_COMPONENTS.find(c => c.id === activeId);
        if (toolbarItem) {
            setActiveItem({ id: activeId, type: toolbarItem.type, ...toolbarItem, isToolbarItem: true });
        } else {
            const found = findItemContainer(items, activeId);
            if (found) {
                setActiveItem(found.container[found.index]);
            }
        }
    }, [items]);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        setActiveItem(null);

        if (!over) return;
        const overId = over.id as string;
        const activeId = active.id as string;

        // --- Reordering existing items ---
        if (activeId !== overId && !active.data.current?.isToolbarItem) {
            setItems((currentItems) => {
                 return produce(currentItems, draft => {
                    const oldContainerResult = findItemContainer(draft, activeId);
                    const newContainerResult = findItemContainer(draft, overId);

                    if (oldContainerResult && newContainerResult) {
                        const { container: oldContainer, index: oldIndex } = oldContainerResult;
                        const { container: newContainer, index: newIndex } = newContainerResult;

                        const [movedItem] = oldContainer.splice(oldIndex, 1);
                        newContainer.splice(newIndex, 0, movedItem);
                    }
                });
            });
            return;
        }

        // --- Dropping a toolbar item ---
        if (active.data.current?.isToolbarItem) {
            const toolbarItem = TOOLBAR_COMPONENTS.find(c => c.id === activeId);
            if (!toolbarItem) return;

            let newBlock;
            if (toolbarItem.type === 'Product') {
                const imageId = generateId('image');
                const titleId = generateId('header');
                const descId = generateId('text');
                const priceId = generateId('text');
                const buttonId = generateId('button');
                newBlock = {
                    id: generateId('product'),
                    type: 'Product',
                    content: {
                        columns: [
                            {
                                id: generateId('col'),
                                flex: 1,
                                items: [{
                                    id: imageId,
                                    type: 'Image',
                                    content: { ...TOOLBAR_COMPONENTS.find(c => c.type === 'Image')!.defaultContent },
                                    style: { ...TOOLBAR_COMPONENTS.find(c => c.type === 'Image')!.defaultStyle, backgroundColor: '#ffffff' }
                                }]
                            },
                            {
                                id: generateId('col'),
                                flex: 1,
                                items: [
                                    {
                                        id: titleId,
                                        type: 'Header',
                                        content: { html: '<h2>Product Title</h2>' },
                                        style: { ...TOOLBAR_COMPONENTS.find(c => c.type === 'Header')!.defaultStyle, fontSize: '22px', paddingLeft: 10, paddingRight: 10 }
                                    },
                                    {
                                        id: descId,
                                        type: 'Text',
                                        content: { html: '<p>A brief description of your amazing product goes here. Highlight the key features and benefits.</p>' },
                                        style: { ...TOOLBAR_COMPONENTS.find(c => c.type === 'Text')!.defaultStyle, fontSize: '14px', paddingLeft: 10, paddingRight: 10 }
                                    },
                                    {
                                        id: priceId,
                                        type: 'Text',
                                        content: { html: '<p style="font-size: 20px; font-weight: bold;">$19.99</p>' },
                                        style: { ...TOOLBAR_COMPONENTS.find(c => c.type === 'Text')!.defaultStyle, fontSize: '20px', fontWeight: 'bold', paddingLeft: 10, paddingRight: 10, textAlign: 'left' }
                                    },
                                    {
                                        id: buttonId,
                                        type: 'Button',
                                        content: { text: 'Buy Now', href: '#' },
                                        style: { ...TOOLBAR_COMPONENTS.find(c => c.type === 'Button')!.defaultStyle, textAlign: 'left' }
                                    }
                                ]
                            }
                        ]
                    },
                    style: { ...TOOLBAR_COMPONENTS.find(c => c.type === 'Columns')!.defaultStyle }
                }
            } else {
                 newBlock = {
                    id: generateId(toolbarItem.type.toLowerCase()),
                    type: toolbarItem.type,
                    content: JSON.parse(JSON.stringify(toolbarItem.defaultContent)),
                    style: JSON.parse(JSON.stringify(toolbarItem.defaultStyle))
                };
            }

            setItems(produce(draft => {
                const dropContainerResult = findItemContainer(draft, overId);
                 if (dropContainerResult) {
                    dropContainerResult.container.splice(dropContainerResult.index, 0, newBlock);
                } else {
                     if (overId === 'canvas-droppable') {
                         draft.push(newBlock);
                     } else { // It's a column
                        for(const item of draft) {
                            if (item.type === 'Columns' || item.type === 'Product') {
                                const col = item.content.columns.find((c: any) => c.id === overId);
                                if (col) {
                                    col.items.push(newBlock);
                                    break;
                                }
                            }
                        }
                     }
                }
            }));
            return;
        }

        // --- Dragging item into a column ---
        const isColumnDrop = overId.startsWith('col-');
        if(isColumnDrop) {
            setItems(produce(draft => {
                const oldContainerResult = findItemContainer(draft, activeId);
                if (!oldContainerResult) return;
                const [movedItem] = oldContainerResult.container.splice(oldContainerResult.index, 1);

                for(const item of draft) {
                    if (item.type === 'Columns' || item.type === 'Product') {
                        const col = item.content.columns.find((c: any) => c.id === overId);
                        if (col) {
                            col.items.push(movedItem);
                            break;
                        }
                    }
                }
            }));
        }

    }, [items]);

    const removeItem = useCallback((id: string) => {
        setItems(produce(draft => {
            const containerResult = findItemContainer(draft, id);
            if (containerResult) {
                containerResult.container.splice(containerResult.index, 1);
            }
        }));
        if (selectedBlockId === id) {
            setSelectedBlockId(null);
            setSettingsView(null);
        }
    }, [selectedBlockId]);

    const handleDuplicateBlock = useCallback((idToDuplicate: string) => {
        setItems(produce(draft => {
            const containerResult = findItemContainer(draft, idToDuplicate);
            if (containerResult) {
                const { container, index } = containerResult;
                const originalItem = container[index];
                
                const duplicateItem = JSON.parse(JSON.stringify(originalItem));
                
                const regenerateIds = (item: any) => {
                    item.id = generateId(item.type.toLowerCase());
                    if (item.type === 'Columns' && item.content?.columns) {
                        item.content.columns.forEach((col: any) => {
                            col.id = generateId('col');
                            col.items.forEach(regenerateIds);
                        });
                    }
                };
                
                regenerateIds(duplicateItem);
                
                container.splice(index + 1, 0, duplicateItem);
                setSelectedBlockId(duplicateItem.id);
                setSettingsView('block');
            }
        }));
    }, []);

    const handleSelectBlock = useCallback((id: string) => {
        setSelectedBlockId(id);
        setSettingsView('block');
    }, []);
    
    const handleGlobalStyleChange = (newStyles: any) => {
        setGlobalStyles(prev => ({ ...prev, ...newStyles }));
    }

    const handleStyleChange = useCallback((blockId: string, newStyles: any) => {
        setItems(produce(draft => {
            findAndMutateItem(draft, blockId, item => {
                item.style = { ...item.style, ...newStyles };
            });
        }));
    }, []);
    
    const handleContentChange = useCallback((blockId: string, newContent: any) => {
        setItems(produce(draft => {
            findAndMutateItem(draft, blockId, item => {
                item.content = { ...item.content, ...newContent };
            });
        }));
    }, []);

    const handleEditImageBlock = (id: string) => {
        setEditingImageBlockId(id);
        setIsMediaModalOpen(true);
    };

    const handleImageSelect = async (fileInfo: FileInfo) => {
        if (!editingImageBlockId) return;

        setIsMediaModalOpen(false);
        setIsUpdatingImage(true);
        addToast(`Updating image to ${fileInfo.FileName}...`, 'info');

        try {
            const url = `${ELASTIC_EMAIL_API_V4_BASE}/files/${encodeURIComponent(fileInfo.FileName)}`;
            const response = await fetch(url, { headers: { 'X-ElasticEmail-ApiKey': apiKey } });
            if (!response.ok) throw new Error(t('couldNotLoadPreview'));

            const blob = await response.blob();
            const base64 = await toBase64(blob);

            handleContentChange(editingImageBlockId, { src: base64, alt: fileInfo.FileName });
            addToast(`Image updated successfully!`, 'success');

        } catch (error: any) {
            addToast(error.message, 'error');
        } finally {
            setIsUpdatingImage(false);
            setEditingImageBlockId(null);
        }
    };
    
    const handleInsertBlock = useCallback((blockType: string, index: number, targetArray?: any[]) => {
        const toolbarItem = TOOLBAR_COMPONENTS.find(c => c.type === blockType);
        if (!toolbarItem) return;

        const newBlock = {
            id: generateId(toolbarItem.type.toLowerCase()),
            type: toolbarItem.type,
            content: JSON.parse(JSON.stringify(toolbarItem.defaultContent)),
            style: JSON.parse(JSON.stringify(toolbarItem.defaultStyle)),
        };

        setItems(items => {
            const newItems = [...items];
            const arrayToInsertInto = targetArray || newItems;
            arrayToInsertInto.splice(index + 1, 0, newBlock);
            return newItems;
        });
        setSelectedBlockId(newBlock.id);
        setSettingsView('block');
    }, []);
    
    const handleSetColumns = useCallback((blockId: string, layoutConfig: { flex: number }[]) => {
        setItems(produce(draft => {
            const item = findBlockById(draft, blockId);
            if (item && (item.type === 'Columns' || item.type === 'Product')) {
                item.content.columns = layoutConfig.map(config => ({
                    id: generateId('col'),
                    flex: config.flex,
                    items: []
                }));
            }
        }));
    }, []);

    const handleAddComponentFromToolbar = useCallback((blockType: string) => {
        const toolbarItem = TOOLBAR_COMPONENTS.find(c => c.type === blockType);
        if (!toolbarItem) return;

        let newBlock;
        if (toolbarItem.type === 'Product') {
            const imageId = generateId('image');
            const titleId = generateId('header');
            const descId = generateId('text');
            const priceId = generateId('text');
            const buttonId = generateId('button');
            newBlock = {
                id: generateId('product'),
                type: 'Product',
                content: {
                    columns: [
                        {
                            id: generateId('col'),
                            flex: 1,
                            items: [{
                                id: imageId,
                                type: 'Image',
                                content: { ...TOOLBAR_COMPONENTS.find(c => c.type === 'Image')!.defaultContent },
                                style: { ...TOOLBAR_COMPONENTS.find(c => c.type === 'Image')!.defaultStyle, backgroundColor: '#ffffff' }
                            }]
                        },
                        {
                            id: generateId('col'),
                            flex: 1,
                            items: [
                                {
                                    id: titleId,
                                    type: 'Header',
                                    content: { html: '<h2>Product Title</h2>' },
                                    style: { ...TOOLBAR_COMPONENTS.find(c => c.type === 'Header')!.defaultStyle, fontSize: '22px', paddingLeft: 10, paddingRight: 10 }
                                },
                                {
                                    id: descId,
                                    type: 'Text',
                                    content: { html: '<p>A brief description of your amazing product goes here. Highlight the key features and benefits.</p>' },
                                    style: { ...TOOLBAR_COMPONENTS.find(c => c.type === 'Text')!.defaultStyle, fontSize: '14px', paddingLeft: 10, paddingRight: 10 }
                                },
                                {
                                    id: priceId,
                                    type: 'Text',
                                    content: { html: '<p style="font-size: 20px; font-weight: bold;">$19.99</p>' },
                                    style: { ...TOOLBAR_COMPONENTS.find(c => c.type === 'Text')!.defaultStyle, fontSize: '20px', fontWeight: 'bold', paddingLeft: 10, paddingRight: 10, textAlign: 'left' }
                                },
                                {
                                    id: buttonId,
                                    type: 'Button',
                                    content: { text: 'Buy Now', href: '#' },
                                    style: { ...TOOLBAR_COMPONENTS.find(c => c.type === 'Button')!.defaultStyle, textAlign: 'left' }
                                }
                            ]
                        }
                    ]
                },
                style: { ...TOOLBAR_COMPONENTS.find(c => c.type === 'Columns')!.defaultStyle }
            }
        } else {
             newBlock = {
                id: generateId(toolbarItem.type.toLowerCase()),
                type: toolbarItem.type,
                content: JSON.parse(JSON.stringify(toolbarItem.defaultContent)),
                style: JSON.parse(JSON.stringify(toolbarItem.defaultStyle))
            };
        }

        setItems(produce(draft => {
            draft.push(newBlock);
        }));
        setSelectedBlockId(newBlock.id);
        setSettingsView('block');
    }, []);
    
    const handleOpenGlobalSettings = () => {
        setSelectedBlockId(null);
        setSettingsView('global');
    };

    const handleCloseSettingsPanel = () => {
        setSelectedBlockId(null);
        setSettingsView(null);
    };

    const selectedBlock = selectedBlockId ? findBlockById(items, selectedBlockId) : null;
    
    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="email-builder-view-container">
                {isUpdatingImage && <div className="page-overlay"><Loader /></div>}
                 <header className="email-builder-header">
                    <div className="email-builder-header-left">
                       <div className="email-builder-main-inputs">
                            <div className="form-group template-name-group">
                                <div className="input-with-icon">
                                    <Icon path={ICONS.ARCHIVE} />
                                    <input
                                        type="text"
                                        placeholder={t('templateName')}
                                        value={templateName}
                                        onChange={(e) => setTemplateName(e.target.value)}
                                        aria-label={t('templateName')}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <div className="input-with-icon">
                                    <Icon path={ICONS.MAIL} />
                                    <input
                                        type="text"
                                        placeholder={t('subject')}
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        aria-label={t('subject')}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <div className="input-with-icon">
                                    <Icon path={ICONS.ACCOUNT} />
                                    <input
                                        type="text"
                                        placeholder={t('fromName')}
                                        value={fromName}
                                        onChange={(e) => setFromName(e.target.value)}
                                        aria-label={t('fromName')}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                     <div className="header-actions">
                        <div className="header-tool-actions">
                            <button className="btn-icon" onClick={handleOpenGlobalSettings} title={t('global')}><Icon path={ICONS.SETTINGS} /></button>
                            <button className={`btn-icon ${isMobileView ? 'active' : ''}`} onClick={toggleMobileView} title={t('mobileView')}><Icon path={ICONS.MOBILE} /></button>
                            <button className="btn-icon" onClick={() => prepareAndShowHtml('preview')} title={t('previewEmail')}><Icon path={ICONS.EYE} /></button>
                            <button className="btn-icon" onClick={() => prepareAndShowHtml('code')} title={t('viewCode')}><Icon path={ICONS.CODE} /></button>
                            <button className="btn-icon" onClick={handleExportHtml} title={t('exportHtml')}><Icon path={ICONS.DOWNLOAD} /></button>
                            <button className="btn-icon" onClick={handleExportJson} title={t('exportJson')}><Icon path={ICONS.FILE_TEXT} /></button>
                        </div>
                        <div className="header-main-actions">
                             <button className="btn-icon-primary-save" onClick={handleSaveTemplate} disabled={isSaving} title={t('saveChanges')}>
                                {isSaving ? <Loader /> : <Icon path={ICONS.SAVE_CHANGES} />}
                            </button>
                        </div>
                    </div>
                </header>
                <div className="email-builder-container">
                    <Toolbar onAddComponent={handleAddComponentFromToolbar} />
                    <div ref={canvasWrapperRef} className="builder-canvas-wrapper" style={{backgroundColor: globalStyles.backdropColor}}>
                         <div className={isMobileView ? 'is-mobile-view' : ''}>
                             <Canvas
                                items={items}
                                removeItem={removeItem}
                                onDuplicateBlock={handleDuplicateBlock}
                                onEditImageBlock={handleEditImageBlock}
                                selectedBlockId={selectedBlockId}
                                onSelectBlock={handleSelectBlock}
                                onContentChange={handleContentChange}
                                onStyleChange={handleStyleChange}
                                onInsertBlock={handleInsertBlock}
                                onSetColumns={handleSetColumns}
                                globalStyles={globalStyles}
                            />
                        </div>
                    </div>
                    <div className={`settings-panel-wrapper ${settingsView ? 'is-open' : ''}`}>
                        <div className="settings-panel-overlay" onClick={handleCloseSettingsPanel}></div>
                        <SettingsPanel
                            block={settingsView === 'block' ? selectedBlock : null}
                            globalStyles={globalStyles}
                            onGlobalStyleChange={handleGlobalStyleChange}
                            onStyleChange={handleStyleChange}
                            onContentChange={handleContentChange}
                            onOpenMediaManager={handleEditImageBlock}
                            onClose={handleCloseSettingsPanel}
                        />
                    </div>
                </div>
            </div>
            
            <MediaManagerModal
                isOpen={isMediaModalOpen}
                onClose={() => setIsMediaModalOpen(false)}
                apiKey={apiKey}
                onSelect={handleImageSelect}
            />
            
            <Modal isOpen={isPreviewModalOpen} onClose={() => setIsPreviewModalOpen(false)} title={t('previewEmail')} size="fullscreen">
                <iframe srcDoc={generatedHtml} className="preview-iframe" title={t('previewEmail')} />
            </Modal>
            
            <Modal isOpen={isCodeModalOpen} onClose={() => setIsCodeModalOpen(false)} title={t('htmlCode')} size="large">
                <pre className="code-view-pre">
                    <code>{generatedHtml}</code>
                </pre>
            </Modal>

            <DragOverlay>
                {activeItem ? (
                    <div className="drag-overlay-item">
                        {activeItem.isToolbarItem ? (
                            <div className="toolbar-item" style={{cursor: 'grabbing'}}>
                                <Icon path={activeItem.icon} />
                                <span>{t(activeItem.type.toLowerCase())}</span>
                            </div>
                        ) : (
                            renderBlock(activeItem)
                        )}
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

export default EmailBuilderView;