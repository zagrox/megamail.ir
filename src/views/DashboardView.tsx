
import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from '@dnd-kit/sortable';

import useApi from './useApi';
import useApiV4 from '../hooks/useApiV4';
import { getPastDateByDays, formatDateForApiV4 } from '../utils/helpers';
import CenteredMessage from '../components/CenteredMessage';
import Loader from '../components/Loader';
import AccountDataCard from '../components/AccountDataCard';
import Icon, { ICONS } from '../components/Icon';
import { SortableNavCard } from '../components/SortableNavCard';

const DashboardView = ({ setView, apiKey, user, isEmbed = false }: { setView: (view: string) => void, apiKey: string, user: any, isEmbed?: boolean }) => {
    const { t, i18n } = useTranslation();
    const apiParams = useMemo(() => ({ from: formatDateForApiV4(getPastDateByDays(365)) }), []);
    const { data: statsData, loading: statsLoading, error: statsError } = useApiV4(`/statistics`, apiKey, apiParams);
    const { data: accountData, loading: accountLoading } = useApi('/account/load', apiKey, {}, apiKey ? 1 : 0);
    const { data: contactsCountData, loading: contactsCountLoading } = useApi('/contact/count', apiKey, { allContacts: true }, apiKey ? 1 : 0);

    const defaultNavItems = useMemo(() => [
        { name: t('statistics'), icon: ICONS.STATISTICS, desc: t('statisticsDesc'), view: 'Statistics' },
        { name: t('contacts'), icon: ICONS.CONTACTS, desc: t('contactsDesc'), view: 'Contacts' },
        { name: t('emailLists'), icon: ICONS.EMAIL_LISTS, desc: t('emailListsDesc'), view: 'Email Lists' },
        { name: t('segments'), icon: ICONS.SEGMENTS, desc: t('segmentsDesc'), view: 'Segments' },
        { name: t('mediaManager'), icon: ICONS.FOLDER, desc: t('mediaManagerDesc'), view: 'Media Manager' },
        { name: t('campaigns'), icon: ICONS.CAMPAIGNS, desc: t('campaignsDesc'), view: 'Campaigns' },
        { name: t('templates'), icon: ICONS.ARCHIVE, desc: t('templatesDesc'), view: 'Templates' },
        { name: t('emailBuilder'), icon: ICONS.SEND_EMAIL, desc: t('emailBuilderDesc'), view: 'Email Builder' },
        { name: t('domains'), icon: ICONS.DOMAINS, desc: t('domainsDesc'), view: 'Domains' },
        { name: t('smtp'), icon: ICONS.SMTP, desc: t('smtpDesc'), view: 'SMTP' },
    ], [t]);

    const [navItems, setNavItems] = useState(defaultNavItems);
    const [activeId, setActiveId] = useState<string | null>(null);

    useEffect(() => {
        try {
            const storedOrder = localStorage.getItem('dashboardNavOrder');
            if (storedOrder) {
                const orderedViews = JSON.parse(storedOrder);
                const reordered = orderedViews
                    .map((view: string) => defaultNavItems.find(item => item.view === view))
                    .filter(Boolean); // Ensure no undefined items
                const newItems = defaultNavItems.filter(item => !orderedViews.includes(item.view));
                setNavItems([...reordered, ...newItems]);
            } else {
                setNavItems(defaultNavItems);
            }
        } catch (e) {
            console.error("Failed to parse nav order from localStorage", e);
            setNavItems(defaultNavItems);
        }
    }, [defaultNavItems]);
    
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require user to drag 8px before initiating a drag
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        setActiveId(null);
        if (over && active.id !== over.id) {
            setNavItems((items) => {
                const oldIndex = items.findIndex(item => item.view === active.id);
                const newIndex = items.findIndex(item => item.view === over.id);
                const newOrder = arrayMove(items, oldIndex, newIndex);
                
                // Persist the new order
                localStorage.setItem('dashboardNavOrder', JSON.stringify(newOrder.map(item => item.view)));

                return newOrder;
            });
        }
    };

    const activeItem = useMemo(() => activeId ? navItems.find(item => item.view === activeId) : null, [activeId, navItems]);

    if (!user && !isEmbed) return <CenteredMessage><Loader /></CenteredMessage>;
    if (statsError) console.warn("Could not load dashboard stats:", statsError);

    const welcomeName = user?.first_name || t('user');

    return (
        <div className="dashboard-container">
            {!isEmbed && (
                <div className="dashboard-header">
                    <div>
                        <h2>{t('welcomeMessage', { name: welcomeName })}</h2>
                        <p>{t('dashboardSubtitle')}</p>
                    </div>
                    <div className="dashboard-actions">
                        <button className="btn btn-credits" onClick={() => setView('Buy Credits')}>
                            <Icon path={ICONS.BUY_CREDITS} />
                            {accountLoading ? t('loadingCredits') : `${t('credits')}: ${Number(accountData?.emailcredits ?? 0).toLocaleString(i18n.language)}`}
                        </button>
                        <button className="btn btn-primary" onClick={() => setView('Email Builder')}><Icon path={ICONS.SEND_EMAIL} /> {t('createTemplate')}</button>
                    </div>
                </div>
            )}

            <div className="dashboard-stats-grid">
                 <AccountDataCard title={t('sendingReputation')} iconPath={ICONS.TRENDING_UP}>
                    {accountLoading ? '...' : (accountData?.reputation ? `${accountData.reputation}%` : 'N/A')}
                </AccountDataCard>
                <AccountDataCard title={t('emailsSent365d')} iconPath={ICONS.MAIL}>
                    {statsLoading ? '...' : (statsData?.EmailTotal?.toLocaleString(i18n.language) ?? '0')}
                </AccountDataCard>
                 <AccountDataCard title={t('totalContacts')} iconPath={ICONS.CONTACTS}>
                    {contactsCountLoading ? '...' : (contactsCountData?.toLocaleString(i18n.language) ?? '0')}
                </AccountDataCard>
            </div>

            {!isEmbed && (
                <>
                    <div className="dashboard-section">
                        <div className="dashboard-section-header">
                            <h3>{t('exploreYourTools')}</h3>
                            <p>{t('exploreYourToolsSubtitle')}</p>
                        </div>
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext items={navItems.map(item => item.view)} strategy={rectSortingStrategy}>
                                <div className="dashboard-nav-grid">
                                    {navItems.map(item => (
                                        <SortableNavCard key={item.view} id={item.view} item={item} setView={setView} />
                                    ))}
                                </div>
                            </SortableContext>
                            <DragOverlay>
                                {activeItem ? (
                                    <div className="card nav-card sortable-overlay">
                                        <Icon path={activeItem.icon} className="nav-card-icon" />
                                        <div className="nav-card-text-content">
                                            <div className="nav-card-title">{activeItem.name}</div>
                                            <div className="nav-card-description">{activeItem.desc}</div>
                                        </div>
                                    </div>
                                ) : null}
                            </DragOverlay>
                        </DndContext>
                    </div>
                    <div className="dashboard-branding-footer">
                        <p>Mailzila App by <strong>ZAGROX.com</strong></p>
                    </div>
                </>
            )}
        </div>
    );
};

export default DashboardView;