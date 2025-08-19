import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useApiV4 from '../hooks/useApiV4';
import { apiFetchV4 } from '../api/elasticEmail';
import { List, Segment, Template } from '../api/types';
import { useToast } from '../contexts/ToastContext';
import Loader from '../components/Loader';
import Icon, { ICONS } from '../components/Icon';
import CenteredMessage from '../components/CenteredMessage';

type CampaignType = 'Normal' | 'ABTest';
type RecipientTarget = 'list' | 'segment' | 'all';
type CreationStep = 'selection' | 'form';
type ContentMethod = 'template' | 'builder' | 'plainText';
type AccordionSection = 'recipients' | 'content' | 'settings';

const emptyContent = { From: '', ReplyTo: '', Subject: '', TemplateName: '', Preheader: '' };

const CampaignTypeSelection = ({ onSelect }: { onSelect: (type: CampaignType) => void }) => {
    const { t } = useTranslation();
    return (
        <div>
            <h2 className="content-header" style={{textAlign: 'center', marginBottom: '2rem'}}>
                {t('createCampaign')}
            </h2>
            <div className="campaign-type-selection-container">
                <div className="campaign-type-option">
                    <Icon path={ICONS.MAIL} />
                    <h3>{t('regular')}</h3>
                    <p>Create and send a single template to your recipients.</p>
                    <button className="btn btn-primary" onClick={() => onSelect('Normal')}>Create</button>
                </div>
                <div className="campaign-type-option">
                    <Icon path={ICONS.COLUMNS} />
                    <h3>A/B test</h3>
                    <p>Send a few variants of templates to see which one will perform better.</p>
                    <button className="btn btn-primary" onClick={() => onSelect('ABTest')}>Create</button>
                </div>
            </div>
        </div>
    );
};

const SendEmailView = ({ apiKey, setView }: { apiKey: string, setView: (view: string) => void; }) => {
    const { t } = useTranslation();
    const { addToast } = useToast();

    const [step, setStep] = useState<CreationStep>('selection');
    const [campaignType, setCampaignType] = useState<CampaignType>('Normal');
    
    const [isSending, setIsSending] = useState(false);
    const [activeContent, setActiveContent] = useState(0);
    const [recipientTarget, setRecipientTarget] = useState<RecipientTarget>('all');
    const [contentMethod, setContentMethod] = useState<ContentMethod>('template');
    const [openAccordion, setOpenAccordion] = useState<AccordionSection>('recipients');
    const [isOptimizationOn, setIsOptimizationOn] = useState(false);
    const [isScheduling, setIsScheduling] = useState(false);

    const [campaign, setCampaign] = useState({
        Name: '',
        Content: [JSON.parse(JSON.stringify(emptyContent))],
        Recipients: { ListNames: [], SegmentNames: [] },
        Options: { TrackOpens: true, TrackClicks: true, ScheduleFor: null, DeliveryOptimization: 'None' }
    });
    
    const { data: lists, loading: listsLoading } = useApiV4('/lists', apiKey, { limit: 1000 });
    const { data: segments, loading: segmentsLoading } = useApiV4('/segments', apiKey, {});
    const { data: domains, loading: domainsLoading } = useApiV4('/domains', apiKey, {});
    const { data: templates, loading: templatesLoading } = useApiV4('/templates', apiKey, { limit: 1000, templateTypes: 'RawHTML' });

    const verifiedDomains = useMemo(() => (Array.isArray(domains) ? domains : [])
        .filter(d => String(d.Spf).toLowerCase() === 'true' && String(d.Dkim).toLowerCase() === 'true')
        .map(d => d.Domain), [domains]);

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
            if (campaign.Options.DeliveryOptimization === 'None') {
                setCampaign(c => ({...c, Options: {...c.Options, DeliveryOptimization: 'ToEngagedFirst'}}))
            }
        } else {
            setCampaign(c => ({...c, Options: {...c.Options, DeliveryOptimization: 'None'}}))
        }
    }, [isOptimizationOn]);

    const handleCampaignTypeSelect = (type: CampaignType) => {
        setCampaignType(type);
        setCampaign(c => {
            const newContent = (type === 'Normal' || c.Content.length === 0)
                ? [c.Content[0] || JSON.parse(JSON.stringify(emptyContent))]
                : [c.Content[0], c.Content[1] || { ...c.Content[0], Subject: `${c.Content[0].Subject} B` }];
            return { ...c, Content: newContent };
        });
        setStep('form');
    };

    const handleValueChange = (section: 'Campaign' | 'Content' | 'Options' | 'Recipients', key: string, value: any, contentIndex: number = activeContent) => {
        setCampaign(prev => {
            const newCampaign = { ...prev };
            if (section === 'Content') {
                const newContent = [...newCampaign.Content];
                newContent[contentIndex] = { ...newContent[contentIndex], [key]: value };
                newCampaign.Content = newContent;
            } else if (section === 'Options') {
                newCampaign.Options = { ...newCampaign.Options, [key]: value };
            } else if (section === 'Campaign') {
                (newCampaign as any)[key] = value;
            }
            return newCampaign;
        });
    };
    
    const handleUtmChange = (value: boolean) => {
        handleValueChange('Content', 'Utm', value ? { Source: '', Medium: '', Campaign: '', Content: '' } : undefined);
    };
    
    const handleUtmFieldChange = (field: string, value: string) => {
        const newUtm = { ...campaign.Content[activeContent].Utm, [field]: value };
        handleValueChange('Content', 'Utm', newUtm);
    }
    
    const handleMultiRecipientChange = (name: string, type: 'ListNames' | 'SegmentNames') => {
        setCampaign(prev => {
            const currentNames = prev.Recipients[type] || [];
            const newNames = currentNames.includes(name)
                ? currentNames.filter((n: string) => n !== name)
                : [...currentNames, name];
            const otherType = type === 'ListNames' ? 'SegmentNames' : 'ListNames';
            
            return {
                ...prev,
                Recipients: {
                    ...prev.Recipients,
                    [otherType]: [],
                    [type]: newNames,
                },
            };
        });
    };

    const handleSubmit = async (action: 'send' | 'draft' | 'schedule') => {
        setIsSending(true);

        let payload: any = { ...campaign };
        if (action === 'send') payload.Status = 'Active';
        else if (action === 'schedule' && campaign.Options.ScheduleFor) payload.Status = 'Active';
        else payload.Status = 'Draft';

        if (contentMethod === 'plainText') {
             payload.Content = payload.Content.map((c: any) => ({...c, Body: { Content: c.Body?.Content || '', ContentType: 'PlainText', Charset: 'utf-8' }, TemplateName: null}));
        } else {
             payload.Content = payload.Content.map((c: any) => ({...c, Body: null}));
        }
        
        if (recipientTarget === 'all') {
            payload.Recipients = {};
        }

        try {
            await apiFetchV4('/campaigns', apiKey, { method: 'POST', body: payload });
            addToast(t('emailSentSuccess'), 'success');
        } catch (err: any) {
            addToast(t('emailSentError', { error: err.message }), 'error');
        } finally {
            setIsSending(false);
        }
    };
    
    const currentContent = campaign.Content[activeContent] || {};
    const fromParts = (currentContent.From || '@').split('@');
    const fromNamePart = fromParts[0];
    const fromDomainPart = fromParts[1] || (verifiedDomains.length > 0 ? verifiedDomains[0] : '');
    
    const AccordionItem = ({ id, title, children }: { id: AccordionSection, title: string, children: React.ReactNode}) => (
        <div className="accordion-item">
            <div className={`accordion-header ${openAccordion === id ? 'open' : ''}`} onClick={() => setOpenAccordion(id)}>
                <h3>{title}</h3>
                <Icon path={ICONS.CHEVRON_DOWN} className={`accordion-icon ${openAccordion === id ? 'open' : ''}`} />
            </div>
            {openAccordion === id && <div className="accordion-content">{children}</div>}
        </div>
    );
    
    if (step === 'selection') {
        return <CampaignTypeSelection onSelect={handleCampaignTypeSelect} />;
    }

    if (domainsLoading) return <CenteredMessage><Loader /></CenteredMessage>;
    if (verifiedDomains.length === 0) return <CenteredMessage><div className="info-message warning"><strong>{t('noVerifiedDomains')}</strong></div></CenteredMessage>;
    
    return (
        <div className="campaign-form-container">
            <h2 className="content-header" style={{marginBottom: '2rem'}}>
                {t('createCampaign')}
            </h2>
            <div className="accordion">
                <AccordionItem id="recipients" title={`1. ${t('recipients')}`}>
                    <div className="form-group recipient-target-selector">
                        <label className="custom-radio"><input type="radio" name="rt" value="all" checked={recipientTarget === 'all'} onChange={() => setRecipientTarget('all')} /><span className="radio-checkmark"></span><span className="radio-label">{t('allContacts')}</span></label>
                        <label className="custom-radio"><input type="radio" name="rt" value="list" checked={recipientTarget === 'list'} onChange={() => setRecipientTarget('list')} /><span className="radio-checkmark"></span><span className="radio-label">{t('aList')}</span></label>
                        <label className="custom-radio"><input type="radio" name="rt" value="segment" checked={recipientTarget === 'segment'} onChange={() => setRecipientTarget('segment')} /><span className="radio-checkmark"></span><span className="radio-label">{t('aSegment')}</span></label>
                    </div>
                    {recipientTarget === 'list' && (
                        <div className="recipient-checkbox-list">
                            {listsLoading ? <Loader/> : lists?.map((l: List) => <label key={l.ListName} className="custom-checkbox"><input type="checkbox" checked={campaign.Recipients.ListNames.includes(l.ListName)} onChange={() => handleMultiRecipientChange(l.ListName, 'ListNames')} /><span className="checkbox-checkmark"></span><span className="checkbox-label">{l.ListName}</span></label>)}
                        </div>
                    )}
                     {recipientTarget === 'segment' && (
                        <div className="recipient-checkbox-list">
                            {segmentsLoading ? <Loader/> : segments?.map((s: Segment) => <label key={s.Name} className="custom-checkbox"><input type="checkbox" checked={campaign.Recipients.SegmentNames.includes(s.Name)} onChange={() => handleMultiRecipientChange(s.Name, 'SegmentNames')} /><span className="checkbox-checkmark"></span><span className="checkbox-label">{s.Name}</span></label>)}
                        </div>
                    )}
                </AccordionItem>

                <AccordionItem id="content" title={`2. ${t('subject')} & ${t('content')}`}>
                    {campaignType === 'ABTest' && (
                        <div className="content-variant-tabs">
                            <button type="button" className={`content-variant-tab ${activeContent === 0 ? 'active' : ''}`} onClick={() => setActiveContent(0)}>Content A</button>
                            <button type="button" className={`content-variant-tab ${activeContent === 1 ? 'active' : ''}`} onClick={() => setActiveContent(1)}>Content B</button>
                        </div>
                    )}
                    <div className="form-grid">
                        <div className="form-group"><label>{t('fromName')}</label><input type="text" value={currentContent.FromName} onChange={e => handleValueChange('Content', 'FromName', e.target.value)} /></div>
                        <div className="form-group"><label>{t('fromEmail')}</label><div className="from-email-composer"><input type="text" value={fromNamePart} onChange={e => handleValueChange('Content', 'From', `${e.target.value}@${fromDomainPart}`)} /><span className="from-email-at">@</span><select value={fromDomainPart} onChange={e => handleValueChange('Content', 'From', `${fromNamePart}@${e.target.value}`)}>{verifiedDomains.map(d => <option key={d} value={d}>{d}</option>)}</select></div></div>
                    </div>
                    <div className="form-group"><label>{t('subject')}</label><input type="text" value={currentContent.Subject} onChange={e => handleValueChange('Content', 'Subject', e.target.value)} required /></div>
                    <div className="form-group"><label>{t('preheader')}</label><input type="text" value={currentContent.Preheader} onChange={e => handleValueChange('Content', 'Preheader', e.target.value)} /></div>
                    
                    <h4>{t('content')}</h4>
                    <div className="content-method-tabs">
                        <button type="button" className={`content-method-tab ${contentMethod === 'template' ? 'active' : ''}`} onClick={() => setContentMethod('template')}><Icon path={ICONS.ARCHIVE} /> Templates</button>
                        <button type="button" className={`content-method-tab ${contentMethod === 'builder' ? 'active' : ''}`} onClick={() => setView('Email Builder')}><Icon path={ICONS.PENCIL} /> Drag & drop editor</button>
                        <button type="button" className={`content-method-tab ${contentMethod === 'plainText' ? 'active' : ''}`} onClick={() => setContentMethod('plainText')}><Icon path={ICONS.TYPE} /> Plain Text</button>
                    </div>

                    {contentMethod === 'template' && <select value={currentContent.TemplateName} onChange={e => handleValueChange('Content', 'TemplateName', e.target.value)} disabled={templatesLoading}><option value="">Select a template...</option>{templates?.map((t: Template) => <option key={t.Name} value={t.Name}>{t.Name}</option>)}</select>}
                    {contentMethod === 'plainText' && <textarea value={currentContent.Body?.Content || ''} onChange={e => handleValueChange('Content', 'Body', { ...currentContent.Body, Content: e.target.value })} rows={10} />}
                </AccordionItem>

                <AccordionItem id="settings" title={`3. ${t('settings')} & ${t('tracking')}`}>
                    <div className="form-group"><label>{t('campaignName')}</label><input type="text" value={campaign.Name} onChange={e => handleValueChange('Campaign', 'Name', e.target.value)} required /></div>
                    
                    <h4>{t('sending')}</h4>
                    <div className="form-group" style={{display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem'}}><label htmlFor="opt-toggle" style={{marginBottom: 0}}>{t('sendTimeOptimization')}</label><label className="toggle-switch"><input type="checkbox" id="opt-toggle" checked={isOptimizationOn} onChange={e => setIsOptimizationOn(e.target.checked)} /><span className="toggle-slider"></span></label></div>
                    {isOptimizationOn && (
                        <div className="form-group" style={{paddingLeft: '1rem', borderLeft: '2px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                            <label className="custom-radio"><input type="radio" name="dto" value="ToEngagedFirst" checked={campaign.Options.DeliveryOptimization === 'ToEngagedFirst'} onChange={() => handleValueChange('Options', 'DeliveryOptimization', 'ToEngagedFirst')} /><span className="radio-checkmark"></span><span className="radio-label">Send to the most engaged contacts first</span><p className="radio-description">Optimize your emails beginning with the most engaged contacts first. This may improve the delivery of your campaign.</p></label>
                        </div>
                    )}

                    <h4>{t('tracking')}</h4>
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <label className="custom-checkbox"><input type="checkbox" checked={campaign.Options.TrackOpens} onChange={e => handleValueChange('Options', 'TrackOpens', e.target.checked)} /><span className="checkbox-checkmark"></span><span className="checkbox-label">{t('trackOpens')}</span></label>
                        <label className="custom-checkbox"><input type="checkbox" checked={campaign.Options.TrackClicks} onChange={e => handleValueChange('Options', 'TrackClicks', e.target.checked)} /><span className="checkbox-checkmark"></span><span className="checkbox-label">{t('trackClicks')}</span></label>
                        <label className="custom-checkbox"><input type="checkbox" checked={!!currentContent.Utm} onChange={e => handleUtmChange(e.target.checked)} /><span className="checkbox-checkmark"></span><span className="checkbox-label">{t('utmTracking')}</span></label>
                    </div>
                    {currentContent.Utm && (
                        <div className="utm-fields-container">
                            <p>{t('utmTrackingDesc')}</p>
                            <div className="form-grid">
                                <div className="form-group"><label>{t('utm_source')}</label><input type="text" value={currentContent.Utm.Source} onChange={e => handleUtmFieldChange('Source', e.target.value)} /></div>
                                <div className="form-group"><label>{t('utm_medium')}</label><input type="text" value={currentContent.Utm.Medium} onChange={e => handleUtmFieldChange('Medium', e.target.value)} /></div>
                                <div className="form-group"><label>{t('utm_campaign')}</label><input type="text" value={currentContent.Utm.Campaign} onChange={e => handleUtmFieldChange('Campaign', e.target.value)} /></div>
                                <div className="form-group"><label>{t('utm_content')}</label><input type="text" value={currentContent.Utm.Content} onChange={e => handleUtmFieldChange('Content', e.target.value)} /></div>
                            </div>
                        </div>
                    )}
                </AccordionItem>
            </div>

            <div className="campaign-form-footer">
                <button type="button" className="btn" onClick={() => handleSubmit('draft')} disabled={isSending}>{t('saveChanges')}</button>
                {!isScheduling ? (
                    <div style={{display: 'flex', gap: '1rem'}}>
                         <button type="button" className="btn btn-secondary" onClick={() => setIsScheduling(true)} disabled={isSending}>{t('schedule')}</button>
                         <button type="button" className="btn btn-primary" onClick={() => handleSubmit('send')} disabled={isSending}>{isSending ? <Loader/> : t('sendNow')}</button>
                    </div>
                ) : (
                    <div className="schedule-controls">
                        <input type="datetime-local" value={campaign.Options.ScheduleFor?.slice(0, 16) || ''} onChange={e => handleValueChange('Options', 'ScheduleFor', e.target.value ? new Date(e.target.value).toISOString() : null)} />
                        <button type="button" className="btn" onClick={() => setIsScheduling(false)} disabled={isSending}>{t('cancel')}</button>
                        <button type="button" className="btn btn-primary" onClick={() => handleSubmit('schedule')} disabled={isSending || !campaign.Options.ScheduleFor}>{isSending ? <Loader/> : t('confirm')}</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SendEmailView;