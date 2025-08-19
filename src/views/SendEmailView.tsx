import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useApiV4 from '../hooks/useApiV4';
import { apiFetchV4 } from '../api/elasticEmail';
import { List, Segment, Template } from '../api/types';
import { useToast } from '../contexts/ToastContext';
import Loader from '../components/Loader';
import Icon, { ICONS } from '../components/Icon';
import CenteredMessage from '../components/CenteredMessage';
import Modal from '../components/Modal';
import MultiSelectSearch from '../components/MultiSelectSearch';

type CampaignType = 'Normal' | 'ABTest';
type RecipientTarget = 'list' | 'segment' | 'all';
type CreationStep = 'selection' | 'form';
type ContentMethod = 'template' | 'plainText';
type AccordionSection = 'recipients' | 'content' | 'settings' | '';

const emptyContent = { From: '', ReplyTo: '', Subject: '', TemplateName: '', Preheader: '' };

const AccordionItem = ({ 
    id, 
    title, 
    children, 
    openAccordion, 
    setOpenAccordion 
}: { 
    id: AccordionSection, 
    title: string, 
    children: React.ReactNode,
    openAccordion: AccordionSection,
    setOpenAccordion: (id: AccordionSection) => void
}) => (
    <div className="accordion-item">
        <div className={`accordion-header ${openAccordion === id ? 'open' : ''}`} onClick={() => setOpenAccordion(openAccordion === id ? '' : id)}>
            <h3>{title}</h3>
            <Icon path={ICONS.CHEVRON_DOWN} className={`accordion-icon ${openAccordion === id ? 'open' : ''}`} />
        </div>
        {openAccordion === id && <div className="accordion-content">{children}</div>}
    </div>
);


const SendEmailView = ({ apiKey, setView }: { apiKey: string, setView: (view: string, data?: any) => void; }) => {
    const { t } = useTranslation();
    const { addToast } = useToast();
    
    const [isSending, setIsSending] = useState(false);
    const [activeContent, setActiveContent] = useState(0);
    const [recipientTarget, setRecipientTarget] = useState<RecipientTarget>('all');
    const [contentMethod, setContentMethod] = useState<ContentMethod>('template');
    const [openAccordion, setOpenAccordion] = useState<AccordionSection>('recipients');
    const [isOptimizationOn, setIsOptimizationOn] = useState(false);
    const [isScheduling, setIsScheduling] = useState(false);
    const [isUtmEnabled, setIsUtmEnabled] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [templateSearchTerm, setTemplateSearchTerm] = useState('');

    const [campaign, setCampaign] = useState({
        Name: '',
        Content: [JSON.parse(JSON.stringify(emptyContent))],
        Recipients: { ListNames: [], SegmentNames: [] },
        Options: { 
            TrackOpens: true, 
            TrackClicks: true, 
            ScheduleFor: null, 
            DeliveryOptimization: 'None',
            EnableSendTimeOptimization: false
        }
    });
    
    const { data: lists, loading: listsLoading } = useApiV4('/lists', apiKey, { limit: 1000 });
    const { data: segments, loading: segmentsLoading } = useApiV4('/segments', apiKey, {});
    const { data: domains, loading: domainsLoading } = useApiV4('/domains', apiKey, {});
    const { data: templates, loading: templatesLoading } = useApiV4(
        '/templates',
        apiKey,
        {
            limit: 1000,
            scopeType: 'Personal',
            templateTypes: 'RawHTML',
        }
    );
    
    const listItems = useMemo(() => (Array.isArray(lists) ? lists : []).map((l: List) => ({ id: l.ListName, name: l.ListName })), [lists]);
    const segmentItems = useMemo(() => (Array.isArray(segments) ? segments : []).map((s: Segment) => ({ id: s.Name, name: s.Name })), [segments]);

    const verifiedDomains = useMemo(() => (Array.isArray(domains) ? domains : [])
        .filter(d => String(d.Spf).toLowerCase() === 'true' && String(d.Dkim).toLowerCase() === 'true')
        .map(d => d.Domain), [domains]);
        
    const filteredTemplates = useMemo(() => {
        if (!Array.isArray(templates)) return [];
        return templates.filter((t: Template) => t.Name.toLowerCase().includes(templateSearchTerm.toLowerCase()));
    }, [templates, templateSearchTerm]);

    useEffect(() => {
        if (verifiedDomains.length > 0) {
            const defaultFrom = `@${verifiedDomains[0]}`;
            setCampaign(c => ({
                ...c,
                Content: c.Content.map(content => ({ ...content, From: content.From || defaultFrom }))
            }));
        }
    }, [verifiedDomains]);
    
    useEffect(() => {
        if (isOptimizationOn) {
            setCampaign(c => ({
                ...c,
                Options: { ...c.Options, DeliveryOptimization: 'ToEngagedFirst', EnableSendTimeOptimization: false }
            }));
        } else {
            setCampaign(c => ({
                ...c,
                Options: { ...c.Options, DeliveryOptimization: 'None', EnableSendTimeOptimization: false }
            }));
        }
    }, [isOptimizationOn]);

    const handleValueChange = (section: 'Campaign' | 'Content' | 'Options', key: string, value: any, contentIndex: number = activeContent) => {
        setCampaign(prev => {
            if (section === 'Campaign') {
                return { ...prev, [key]: value };
            }
            if (section === 'Content') {
                return {
                    ...prev,
                    Content: prev.Content.map((item, idx) => 
                        idx === contentIndex ? { ...item, [key]: value } : item
                    )
                };
            }
            if (section === 'Options') {
                return {
                    ...prev,
                    Options: { ...prev.Options, [key]: value }
                };
            }
            return prev;
        });
    };
    
    const handleUtmFieldChange = (field: string, value: string, contentIndex: number) => {
        setCampaign(prev => {
            const newContent = [...prev.Content];
            const currentContent = newContent[contentIndex];
            const newUtm = { ...currentContent.Utm, [field]: value };
            newContent[contentIndex] = { ...currentContent, Utm: newUtm };
            return { ...prev, Content: newContent };
        });
    };
    
    const handleSelectionChange = (selectedNames: string[], type: 'ListNames' | 'SegmentNames') => {
        setCampaign(prev => {
            const otherType = type === 'ListNames' ? 'SegmentNames' : 'ListNames';
            return {
                ...prev,
                Recipients: {
                    ...prev.Recipients,
                    [otherType]: [],
                    [type]: selectedNames,
                }
            }
        });
    };

    const handleSubmit = async (action: 'send' | 'draft' | 'schedule') => {
        setIsSending(true);
    
        let payload: any = { ...campaign };
    
        if (action === 'send') {
            payload.Status = 'Active';
        } else if (action === 'schedule' && campaign.Options.ScheduleFor) {
            payload.Status = 'Active';
        } else {
            payload.Status = 'Draft';
        }
    
        if (contentMethod === 'plainText') {
             payload.Content = payload.Content.map((c: any) => ({...c, Body: { Content: c.Body?.Content || '', ContentType: 'PlainText', Charset: 'utf-8' }, TemplateName: c.TemplateName || null }));
        } else {
             payload.Content = payload.Content.map((c: any) => ({...c, Body: null}));
        }
        
        if (!isUtmEnabled) {
             payload.Content = payload.Content.map((c: any) => {
                const { Utm, ...rest } = c;
                return rest;
            });
        }
    
        let finalRecipients: any;
        if (recipientTarget === 'all') {
            finalRecipients = {};
        } else if (recipientTarget === 'list') {
            finalRecipients = { ListNames: campaign.Recipients.ListNames || [] };
        } else { // segment
            finalRecipients = { SegmentNames: campaign.Recipients.SegmentNames || [] };
        }
    
        const hasActualRecipients = 
            recipientTarget === 'all' ||
            (finalRecipients.ListNames && finalRecipients.ListNames.length > 0) ||
            (finalRecipients.SegmentNames && finalRecipients.SegmentNames.length > 0);
    
        if (action === 'draft' && !hasActualRecipients) {
            payload.Recipients = {};
        } else {
            payload.Recipients = finalRecipients;
        }
    
        try {
            await apiFetchV4('/campaigns', apiKey, { method: 'POST', body: payload });
            if (payload.Status === 'Draft') {
                addToast(t('draftSavedSuccess'), 'success');
            } else {
                addToast(t('emailSentSuccess'), 'success');
            }
        } catch (err: any) {
            addToast(t('emailSentError', { error: err.message }), 'error');
        } finally {
            setIsSending(false);
        }
    };
    
    const handleSelectTemplate = (templateName: string) => {
        handleValueChange('Content', 'TemplateName', templateName, activeContent);
        setIsTemplateModalOpen(false);
    };

    const handleGoToDomains = () => {
        sessionStorage.setItem('account-tab', 'domains');
        setView('Account');
    };
    
    const currentContent = campaign.Content[activeContent] || {};
    const fromParts = (currentContent.From || '@').split('@');
    const fromNamePart = fromParts[0];
    const fromDomainPart = fromParts[1] || (verifiedDomains.length > 0 ? verifiedDomains[0] : '');
    
    if (domainsLoading) return <CenteredMessage><Loader /></CenteredMessage>;
    
    return (
        <div className="campaign-form-container">
             <Modal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} title={t('templates')}>
                <div className="template-selector-modal">
                    <div className="search-bar" style={{marginBottom: '1rem'}}>
                        <Icon path={ICONS.SEARCH} />
                        <input
                            type="search"
                            placeholder={t('searchTemplatesPlaceholder')}
                            value={templateSearchTerm}
                            onChange={e => setTemplateSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="template-list-container">
                        {templatesLoading ? <Loader /> : filteredTemplates.length > 0 ? (
                            filteredTemplates.map((template: Template) => (
                                <button
                                    type="button"
                                    key={template.Name}
                                    className="template-list-item"
                                    onClick={() => handleSelectTemplate(template.Name)}
                                >
                                    <span>{template.Name}</span>
                                    <small>{template.Subject || t('noSubject')}</small>
                                </button>
                            ))
                        ) : (
                            <CenteredMessage>{t('noTemplatesForQuery', {query: templateSearchTerm})}</CenteredMessage>
                        )}
                    </div>
                </div>
            </Modal>
            <h2 className="content-header" style={{marginBottom: '2rem'}}>
                {t('createCampaign')}
            </h2>
            <div className="accordion">
                <AccordionItem 
                    id="recipients" 
                    title={`1. ${t('recipients')}`}
                    openAccordion={openAccordion}
                    setOpenAccordion={setOpenAccordion}
                >
                    <div className="form-group recipient-target-selector">
                        <label className="custom-radio"><input type="radio" name="rt" value="all" checked={recipientTarget === 'all'} onChange={() => setRecipientTarget('all')} /><span className="radio-checkmark"></span><span className="radio-label">{t('allContacts')}</span></label>
                        <label className="custom-radio"><input type="radio" name="rt" value="list" checked={recipientTarget === 'list'} onChange={() => setRecipientTarget('list')} /><span className="radio-checkmark"></span><span className="radio-label">{t('aList')}</span></label>
                        <label className="custom-radio"><input type="radio" name="rt" value="segment" checked={recipientTarget === 'segment'} onChange={() => setRecipientTarget('segment')} /><span className="radio-checkmark"></span><span className="radio-label">{t('aSegment')}</span></label>
                    </div>
                    {recipientTarget === 'list' && (
                        <div style={{marginTop: '1.5rem'}}>
                            <MultiSelectSearch
                                items={listItems}
                                selectedItems={campaign.Recipients.ListNames}
                                onSelectionChange={(selected) => handleSelectionChange(selected, 'ListNames')}
                                placeholder={t('chooseList')}
                                loading={listsLoading}
                            />
                        </div>
                    )}
                     {recipientTarget === 'segment' && (
                        <div style={{marginTop: '1.5rem'}}>
                            <MultiSelectSearch
                                items={segmentItems}
                                selectedItems={campaign.Recipients.SegmentNames}
                                onSelectionChange={(selected) => handleSelectionChange(selected, 'SegmentNames')}
                                placeholder={t('chooseSegment')}
                                loading={segmentsLoading}
                            />
                        </div>
                    )}
                </AccordionItem>

                <AccordionItem 
                    id="content" 
                    title={`2. ${t('subject')} & ${t('content')}`}
                    openAccordion={openAccordion}
                    setOpenAccordion={setOpenAccordion}
                >
                    {campaign.Content.length > 1 && (
                        <div className="content-variant-tabs">
                            <button type="button" className={`content-variant-tab ${activeContent === 0 ? 'active' : ''}`} onClick={() => setActiveContent(0)}>Content A</button>
                            <button type="button" className={`content-variant-tab ${activeContent === 1 ? 'active' : ''}`} onClick={() => setActiveContent(1)}>Content B</button>
                        </div>
                    )}
                    <div className="form-grid">
                        <div className="form-group"><label>{t('fromName')}</label><input type="text" value={currentContent.FromName} onChange={e => handleValueChange('Content', 'FromName', e.target.value)} /></div>
                        <div className="form-group">
                            <label>{t('fromEmail')}</label>
                            {verifiedDomains.length > 0 ? (
                                <div className="from-email-composer">
                                    <input type="text" value={fromNamePart} onChange={e => handleValueChange('Content', 'From', `${e.target.value}@${fromDomainPart}`)} />
                                    <span className="from-email-at">@</span>
                                    <select value={fromDomainPart} onChange={e => handleValueChange('Content', 'From', `${fromNamePart}@${e.target.value}`)}>
                                        {verifiedDomains.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            ) : (
                                <div className="info-message warning" style={{width: '100%', margin: 0}}>
                                    <p style={{margin: 0}}>
                                        {t('noVerifiedDomainsToSendError')}{' '}
                                        <button type="button" className="link-button" onClick={handleGoToDomains}>
                                            {t('addDomainNow')}
                                        </button>
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="form-group"><label>{t('subject')}</label><input type="text" value={currentContent.Subject} onChange={e => handleValueChange('Content', 'Subject', e.target.value)} required /></div>
                    <div className="form-group"><label>{t('preheader')}</label><input type="text" value={currentContent.Preheader} onChange={e => handleValueChange('Content', 'Preheader', e.target.value)} /></div>
                    
                    <h4>{t('content')}</h4>
                    <div className="content-method-tabs">
                        <button type="button" className={`content-method-tab ${contentMethod === 'template' ? 'active' : ''}`} onClick={() => setContentMethod('template')}><Icon path={ICONS.ARCHIVE} /> {t('templates')}</button>
                        <button type="button" className={`content-method-tab ${contentMethod === 'plainText' ? 'active' : ''}`} onClick={() => setContentMethod('plainText')}><Icon path={ICONS.TYPE} /> {t('plainText')}</button>
                    </div>

                    {contentMethod === 'template' && (
                        <div className="form-group">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                                <input 
                                    type="text" 
                                    readOnly 
                                    value={currentContent.TemplateName || ''} 
                                    placeholder={t('noTemplatesFound')} 
                                    onClick={() => setIsTemplateModalOpen(true)}
                                    style={{cursor: 'pointer'}}
                                />
                                <button type="button" className="btn btn-secondary" onClick={() => setIsTemplateModalOpen(true)}>{t('useTemplate')}</button>
                            </div>
                        </div>
                    )}
                    {contentMethod === 'plainText' && <textarea value={currentContent.Body?.Content || ''} onChange={e => handleValueChange('Content', 'Body', { ...currentContent.Body, Content: e.target.value }, activeContent)} rows={10} />}
                </AccordionItem>

                <AccordionItem 
                    id="settings" 
                    title={`3. ${t('settingsAndTracking')}`}
                    openAccordion={openAccordion}
                    setOpenAccordion={setOpenAccordion}
                >
                    <div className="form-group">
                        <label>{t('campaignName')}</label>
                        <input
                            type="text"
                            value={campaign.Name}
                            onChange={(e) => handleValueChange('Campaign', 'Name', e.target.value)}
                            required
                        />
                    </div>
                    
                    <h4>{t('sending')}</h4>
                    <div className="form-group" style={{display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem'}}><label htmlFor="opt-toggle" style={{marginBottom: 0}}>{t('sendTimeOptimization')}</label><label className="toggle-switch"><input type="checkbox" id="opt-toggle" checked={isOptimizationOn} onChange={e => setIsOptimizationOn(e.target.checked)} /><span className="toggle-slider"></span></label></div>
                    {isOptimizationOn && (
                        <div className="form-group" style={{paddingLeft: '1rem', borderLeft: '2px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                            <label className="custom-radio">
                                <input type="radio" name="dto" value="ToEngagedFirst" 
                                       checked={campaign.Options.DeliveryOptimization === 'ToEngagedFirst'} 
                                       onChange={() => setCampaign(c => ({...c, Options: {...c.Options, DeliveryOptimization: 'ToEngagedFirst', EnableSendTimeOptimization: false}}))} />
                                <span className="radio-checkmark"></span>
                                <span className="radio-label">{t('sendToEngagedFirst')}</span>
                                <p className="radio-description">{t('sendToEngagedFirstDesc')}</p>
                            </label>
                            <label className="custom-radio">
                                <input type="radio" name="dto" value="OptimalTime"
                                       checked={campaign.Options.EnableSendTimeOptimization === true}
                                       onChange={() => setCampaign(c => ({...c, Options: {...c.Options, DeliveryOptimization: 'None', EnableSendTimeOptimization: true}}))} />
                                <span className="radio-checkmark"></span>
                                <span className="radio-label">{t('sendAtOptimalTime')}</span>
                                <p className="radio-description">{t('sendAtOptimalTimeDesc')}</p>
                            </label>
                        </div>
                    )}

                    <h4>{t('tracking')}</h4>
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <label className="custom-checkbox"><input type="checkbox" checked={campaign.Options.TrackOpens} onChange={e => handleValueChange('Options', 'TrackOpens', e.target.checked)} /><span className="checkbox-checkmark"></span><span className="checkbox-label">{t('trackOpens')}</span></label>
                        <label className="custom-checkbox"><input type="checkbox" checked={campaign.Options.TrackClicks} onChange={e => handleValueChange('Options', 'TrackClicks', e.target.checked)} /><span className="checkbox-checkmark"></span><span className="checkbox-label">{t('trackClicks')}</span></label>
                        <label className="custom-checkbox">
                            <input type="checkbox" checked={isUtmEnabled} onChange={e => setIsUtmEnabled(e.target.checked)} />
                            <span className="checkbox-checkmark"></span>
                            <span className="checkbox-label">{t('googleAnalytics')}</span>
                        </label>
                    </div>
                    {isUtmEnabled && (
                        <div className="utm-fields-container">
                            <p>{t('utmDescription')}</p>
                            <div className="form-grid">
                                <div className="form-group"><label>UTM_Source</label><input type="text" value={currentContent.Utm?.Source || ''} onChange={e => handleUtmFieldChange('Source', e.target.value, activeContent)} /></div>
                                <div className="form-group"><label>UTM_Medium</label><input type="text" value={currentContent.Utm?.Medium || ''} onChange={e => handleUtmFieldChange('Medium', e.target.value, activeContent)} /></div>
                                <div className="form-group"><label>UTM_Campaign</label><input type="text" value={currentContent.Utm?.Campaign || ''} onChange={e => handleUtmFieldChange('Campaign', e.target.value, activeContent)} /></div>
                                <div className="form-group"><label>UTM_Content</label><input type="text" value={currentContent.Utm?.Content || ''} onChange={e => handleUtmFieldChange('Content', e.target.value, activeContent)} /></div>
                            </div>
                        </div>
                    )}
                </AccordionItem>
            </div>

            <div className="campaign-form-footer">
                <button type="button" className="btn" onClick={() => handleSubmit('draft')} disabled={isSending}>{t('saveAsDraft')}</button>
                {!isScheduling ? (
                    <div style={{display: 'flex', gap: '1rem'}}>
                         <button type="button" className="btn btn-secondary" onClick={() => setIsScheduling(true)} disabled={isSending || verifiedDomains.length === 0}>{t('schedule')}</button>
                         <button type="button" className="btn btn-primary" onClick={() => handleSubmit('send')} disabled={isSending || verifiedDomains.length === 0}>{isSending ? <Loader/> : t('sendNow')}</button>
                    </div>
                ) : (
                    <div className="schedule-controls">
                        <input type="datetime-local" value={campaign.Options.ScheduleFor?.slice(0, 16) || ''} onChange={e => handleValueChange('Options', 'ScheduleFor', e.target.value ? new Date(e.target.value).toISOString() : null)} />
                        <button type="button" className="btn" onClick={() => setIsScheduling(false)} disabled={isSending}>{t('cancel')}</button>
                        <button type="button" className="btn btn-primary" onClick={() => handleSubmit('schedule')} disabled={isSending || !campaign.Options.ScheduleFor || verifiedDomains.length === 0}>{isSending ? <Loader/> : t('confirm')}</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SendEmailView;