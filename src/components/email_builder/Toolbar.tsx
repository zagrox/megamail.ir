import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDraggable } from '@dnd-kit/core';
import Icon, { ICONS } from '../Icon';

const defaultFont = "'Inter', Arial, sans-serif";
const placeholderImage = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='300' viewBox='0 0 600 300'%3E%3Crect fill='%23F7F9FC' width='600' height='300'/%3E%3C/svg%3E`;

export const TOOLBAR_COMPONENTS = [
    {
        id: 'HEADER_BLOCK',
        type: 'Header',
        icon: ICONS.HEADING,
        defaultContent: { html: '<h1>Headline Text</h1>' },
        defaultStyle: { fontFamily: defaultFont, fontSize: '28px', fontWeight: 'bold', color: '#222222', textAlign: 'left', paddingTop: 10, paddingRight: 20, paddingBottom: 10, paddingLeft: 20 }
    },
    {
        id: 'TEXT_BLOCK',
        type: 'Text',
        icon: ICONS.TYPE,
        defaultContent: { html: '<p>This is a paragraph. Click to edit.</p>' },
        defaultStyle: {
            fontFamily: defaultFont,
            fontSize: '16px',
            color: '#555555',
            lineHeight: 1.6,
            textAlign: 'left',
            paddingTop: 10,
            paddingRight: 20,
            paddingBottom: 10,
            paddingLeft: 20,
            backgroundColor: 'transparent',
            fontWeight: 'normal',
        }
    },
    {
        id: 'IMAGE_BLOCK',
        type: 'Image',
        icon: ICONS.IMAGE,
        defaultContent: { 
            src: placeholderImage, 
            alt: 'Placeholder', 
            href: '',
            width: 'auto',
            height: 'auto',
        },
        defaultStyle: {
            paddingTop: 10,
            paddingRight: 10,
            paddingBottom: 10,
            paddingLeft: 10,
            textAlign: 'center',
            verticalAlign: 'middle',
            backgroundColor: 'transparent',
            borderRadius: 0,
        }
    },
    {
        id: 'BUTTON_BLOCK',
        type: 'Button',
        icon: ICONS.BUTTON,
        defaultContent: {
            text: 'Click Here',
            href: '#',
        },
        defaultStyle: {
            textAlign: 'center',
            width: 'auto', // 'auto' or 'full'
            backgroundColor: '#007BFF',
            textColor: '#FFFFFF',
            fontFamily: defaultFont,
            fontSize: '16px',
            fontWeight: 'normal',
            borderRadius: '4px',
            paddingY: '12px',
            paddingX: '24px',
        }
    },
     {
        id: 'COLUMNS_BLOCK',
        type: 'Columns',
        icon: ICONS.COLUMNS,
        defaultContent: { columns: [] },
        defaultStyle: {
            backgroundColor: 'transparent',
            paddingTop: 10,
            paddingRight: 10,
            paddingBottom: 10,
            paddingLeft: 10,
            gap: 16,
            verticalAlign: 'top',
        }
    },
    {
        id: 'SPACER_BLOCK',
        type: 'Spacer',
        icon: ICONS.MENU,
        defaultContent: { height: 30 },
        defaultStyle: {
            backgroundColor: 'transparent'
        }
    },
    {
        id: 'DIVIDER_BLOCK',
        type: 'Divider',
        icon: ICONS.SPACER,
        defaultContent: {},
        defaultStyle: {
            paddingY: '10px',
            height: '2px', // thickness
            style: 'solid',
            color: '#cccccc', // divider color
            backgroundColor: 'transparent', // background of container
        }
    },
    {
        id: 'PRODUCT_BLOCK',
        type: 'Product',
        icon: ICONS.PRICE_TAG,
        defaultContent: {},
        defaultStyle: {}
    },
    {
        id: 'FOOTER_BLOCK',
        type: 'Footer',
        icon: ICONS.ARCHIVE,
        defaultContent: {
            permissionReminder: "You're receiving this email because you opted in via our website.",
            contactInfo: "<strong>Our mailing address is:</strong><br>My Company Inc.<br>123 Main St, Anytown, CA 12345",
            unsubscribeText: "Unsubscribe",
            unsubscribeUrl: "#",
            managePreferencesText: "Manage Preferences",
            managePreferencesUrl: "#",
            viewOnlineText: "View in Browser",
            viewOnlineUrl: "#",
        },
        defaultStyle: {
            backgroundColor: 'transparent',
            textColor: '#6c757d',
            linkColor: '#007bff',
            paddingTop: 20,
            paddingRight: 20,
            paddingBottom: 20,
            paddingLeft: 20,
            textAlign: 'center',
            fontSize: '12px',
        }
    },
];

const ToolbarItem = ({ component, onAddComponent }: { component: typeof TOOLBAR_COMPONENTS[0], onAddComponent: (type: string) => void }) => {
    const { t } = useTranslation();
    const { attributes, listeners, setNodeRef } = useDraggable({
        id: component.id,
        data: {
            isToolbarItem: true
        }
    });
    
    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className="toolbar-item"
            onClick={(e) => {
                if(e.detail) { // Prevents click firing during drag
                     onAddComponent(component.type)
                }
            }}
        >
            <Icon path={component.icon} />
            <span>{t(component.type.toLowerCase())}</span>
        </div>
    );
};

const Toolbar = ({ onAddComponent }: { onAddComponent: (type: string) => void }) => {
    const { t } = useTranslation();
    return (
        <aside className="builder-toolbar">
            <h3>{t('components')}</h3>
            <div className="toolbar-grid">
                {TOOLBAR_COMPONENTS.map(comp => (
                    <ToolbarItem key={comp.id} component={comp} onAddComponent={onAddComponent} />
                ))}
            </div>
        </aside>
    );
};

export default Toolbar;