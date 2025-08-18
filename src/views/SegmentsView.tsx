import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useApiV4 from '../hooks/useApiV4';
import { apiFetchV4 } from '../api/elasticEmail';
import { Segment } from '../api/types';
import CenteredMessage from '../components/CenteredMessage';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { useToast } from '../contexts/ToastContext';
import Modal from '../components/Modal';
import RenameModal from '../components/RenameModal';
import RuleBuilder from '../components/RuleBuilder';
import Icon, { ICONS } from '../components/Icon';
import ConfirmModal from '../components/ConfirmModal';

const FIELD_TYPES: Record<string, 'date' | 'number' | 'boolean' | 'string'> = {
    DateAdded: 'date', DateUpdated: 'date', StatusChangeDate: 'date', ConsentDate: 'date',
    LastSent: 'date', LastOpened: 'date', LastClicked: 'date', LastBounced: 'date',
    DaysSinceDateAdded: 'number', DaysSinceDateUpdated: 'number', DaysSinceConsentDate: 'number',
    TotalSent: 'number', TotalOpens: 'number', TotalClicks: 'number', TotalBounces: 'number',
    ConsentTracking: 'boolean',
};

const CreateSegmentModal = ({ isOpen, onClose, apiKey, onSuccess, onError }: { isOpen: boolean, onClose: () => void, apiKey: string, onSuccess: Function, onError: Function }) => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [conjunction, setConjunction] = useState('AND');
    const [rules, setRules] = useState([{ Field: 'Email', Operator: 'CONTAINS', Value: '' }]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || rules.some(r => !r.Field || !r.Operator)) {
            onError(t('segmentRuleValidationError'));
            return;
        }

        setIsSubmitting(true);
        const ruleString = rules.map(r => {
            if (r.Operator === 'ISEMPTY' || r.Operator === 'ISNOTEMPTY') {
                return `(${r.Field} ${r.Operator})`;
            }

            const value = r.Value || '';
            const fieldType = FIELD_TYPES[r.Field as keyof typeof FIELD_TYPES] || 'string';
            let formattedValue = value;

            if (fieldType === 'string') {
                const escapedValue = value.replace(/'/g, "''");
                if (/\s/.test(value)) {
                    formattedValue = `'${escapedValue}'`;
                } else {
                    formattedValue = escapedValue;
                }
            }
            
            return `(${r.Field} ${r.Operator} ${formattedValue})`;
        }).join(` ${conjunction} `);
        
        try {
            await apiFetchV4('/segments', apiKey, {
                method: 'POST',
                body: { Name: name, Rule: ruleString }
            });
            onSuccess(name);
        } catch (err: any) {
            onError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('createNewSegment')}>
            <form onSubmit={handleSubmit} className="rule-builder-form">
                <div className="info-message warning">{t('segmentRuleSubRuleNotice')}</div>
                <div className="form-group">
                    <label htmlFor="segment-name">{t('segmentName')}</label>
                    <input id="segment-name" type="text" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <RuleBuilder rules={rules} setRules={setRules} conjunction={conjunction} setConjunction={setConjunction} />
                <div className="form-actions">
                    <button type="button" className="btn" onClick={onClose} disabled={isSubmitting}>{t('cancel')}</button>
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? <Loader/> : t('createSegment')}</button>
                </div>
            </form>
        </Modal>
    );
};

const EditSegmentRulesModal = ({ isOpen, onClose, apiKey, segment, onSuccess, onError }: { isOpen: boolean, onClose: () => void, apiKey: string, segment: Segment | null, onSuccess: (name: string) => void, onError: (msg: string) => void }) => {
    const { t } = useTranslation();
    const [conjunction, setConjunction] = useState('AND');
    const [rules, setRules] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (segment && segment.Rule) {
            const ruleString = segment.Rule;
            const hasOr = ruleString.includes(' OR ');
            setConjunction(hasOr ? 'OR' : 'AND');

            const ruleRegex = /\(([^ ]+) ([^ ]+)(?: (.*))?\)/g;
            const matches = [...ruleString.matchAll(ruleRegex)];
            
            const unquoteValue = (value: string = ''): string => {
                let val = value.trim();
                if (val.startsWith("'") && val.endsWith("'")) {
                    val = val.substring(1, val.length - 1);
                }
                return val.replace(/''/g, "'");
            };

            const parsedRules = matches.map(match => ({
                Field: match[1],
                Operator: match[2],
                Value: unquoteValue(match[3])
            }));
            
            setRules(parsedRules.length > 0 ? parsedRules : [{ Field: 'Email', Operator: 'CONTAINS', Value: '' }]);
        }
    }, [segment]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!segment || rules.some(r => !r.Field || !r.Operator)) {
            onError(t('segmentRuleValidationError'));
            return;
        }

        setIsSubmitting(true);
        const ruleString = rules.map(r => {
            if (r.Operator === 'ISEMPTY' || r.Operator === 'ISNOTEMPTY') {
                return `(${r.Field} ${r.Operator})`;
            }

            const value = r.Value || '';
            const fieldType = FIELD_TYPES[r.Field as keyof typeof FIELD_TYPES] || 'string';
            let formattedValue = value;

            if (fieldType === 'string') {
                const escapedValue = value.replace(/'/g, "''");
                if (/\s/.test(value)) {
                    formattedValue = `'${escapedValue}'`;
                } else {
                    formattedValue = escapedValue;
                }
            }
            
            return `(${r.Field} ${r.Operator} ${formattedValue})`;
        }).join(` ${conjunction} `);
        
        try {
            await apiFetchV4(`/segments/${encodeURIComponent(segment.Name)}`, apiKey, {
                method: 'PUT',
                body: { Rule: ruleString }
            });
            onSuccess(segment.Name);
        } catch (err: any) {
            onError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('editRulesForSegment', { name: segment?.Name })}>
            <form onSubmit={handleSubmit} className="rule-builder-form">
                <div className="info-message warning">{t('segmentRuleSubRuleNotice')}</div>
                <RuleBuilder rules={rules} setRules={setRules} conjunction={conjunction} setConjunction={setConjunction} />
                <div className="form-actions">
                    <button type="button" className="btn" onClick={onClose} disabled={isSubmitting}>{t('cancel')}</button>
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? <Loader/> : t('saveChanges')}</button>
                </div>
            </form>
        </Modal>
    );
};


const SegmentsView = ({ apiKey }: { apiKey: string }) => {
    const { t, i18n } = useTranslation();
    const { addToast } = useToast();
    const [refetchIndex, setRefetchIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [segmentToRename, setSegmentToRename] = useState<Segment | null>(null);
    const [segmentToEditRules, setSegmentToEditRules] = useState<Segment | null>(null);
    const [segmentToDelete, setSegmentToDelete] = useState<string | null>(null);

    const { data: segments, loading, error } = useApiV4('/segments', apiKey, {}, refetchIndex);
    const refetch = () => setRefetchIndex(i => i + 1);

    const handleCreateSuccess = (name: string) => {
        setIsCreateModalOpen(false);
        addToast(t('segmentCreatedSuccess', { name }), 'success');
        refetch();
    };
    
    const confirmDeleteSegment = async () => {
        if (!segmentToDelete) return;
        try {
            await apiFetchV4(`/segments/${encodeURIComponent(segmentToDelete)}`, apiKey, { method: 'DELETE' });
            addToast(t('segmentDeletedSuccess', { segmentName: segmentToDelete }), 'success');
            refetch();
        } catch (err: any) {
            addToast(t('segmentDeletedError', { error: err.message }), 'error');
        } finally {
            setSegmentToDelete(null);
        }
    };

    const handleRenameSegment = async (newName: string) => {
        if (!segmentToRename) return;
        try {
            await apiFetchV4(`/segments/${encodeURIComponent(segmentToRename.Name)}`, apiKey, {
                method: 'PUT',
                body: { Name: newName }
            });
            addToast(t('segmentRenamedSuccess', { newName }), 'success');
            setSegmentToRename(null);
            setTimeout(() => refetch(), 1000);
        } catch (err: any) {
            addToast(t('segmentRenamedError', { error: err.message }), 'error');
        }
    };
    
    const filteredSegments: Segment[] = (segments || [])
        .filter((seg: Segment) => 
            seg.Name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => new Date(b.DateAdded).getTime() - new Date(a.DateAdded).getTime());

    return (
        <div>
            <CreateSegmentModal 
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                apiKey={apiKey}
                onSuccess={handleCreateSuccess}
                onError={(msg: string) => addToast(msg, 'error')}
            />
            {segmentToRename && (
                <RenameModal
                    isOpen={!!segmentToRename}
                    onClose={() => setSegmentToRename(null)}
                    entityName={segmentToRename.Name}
                    entityType={t('segment')}
                    onSubmit={handleRenameSegment}
                />
            )}
             {segmentToEditRules && (
                <EditSegmentRulesModal
                    isOpen={!!segmentToEditRules}
                    onClose={() => setSegmentToEditRules(null)}
                    apiKey={apiKey}
                    segment={segmentToEditRules}
                    onSuccess={(name) => {
                        setSegmentToEditRules(null);
                        addToast(t('segmentRulesUpdatedSuccess', { name }), 'success');
                        refetch();
                    }}
                    onError={(msg: string) => addToast(t('segmentRulesUpdatedError', { error: msg }), 'error')}
                />
            )}
            <ConfirmModal
                isOpen={!!segmentToDelete}
                onClose={() => setSegmentToDelete(null)}
                onConfirm={confirmDeleteSegment}
                title={t('deleteSegment')}
            >
                <p>{t('confirmDeleteSegment', { segmentName: segmentToDelete })}</p>
            </ConfirmModal>
            
            <div className="view-header">
                 <div className="search-bar">
                    <Icon path={ICONS.SEARCH} />
                    <input type="search" placeholder={t('searchSegmentsPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
                    <Icon path={ICONS.PLUS} /> {t('createSegment')}
                </button>
            </div>

            {loading && <CenteredMessage><Loader /></CenteredMessage>}
            {error && <ErrorMessage error={error} />}
            {!loading && filteredSegments.length === 0 && (
                 <CenteredMessage>
                    {searchQuery ? t('noSegmentsForQuery', { query: searchQuery }) : t('noSegmentsFound')}
                </CenteredMessage>
            )}

            <div className="card-grid list-grid">
                {filteredSegments.map((seg: Segment) => (
                    <div key={seg.Name} className="card segment-card">
                        <div className="segment-card-header">
                            <h3>{seg.Name}</h3>
                            <div className="action-buttons">
                                <button className="btn-icon btn-icon-primary" onClick={() => setSegmentToEditRules(seg)} aria-label={t('editSegmentRules')}><Icon path={ICONS.SETTINGS}/></button>
                                <button className="btn-icon btn-icon-primary" onClick={() => setSegmentToRename(seg)} aria-label={t('renameSegment')}><Icon path={ICONS.PENCIL}/></button>
                                <button className="btn-icon btn-icon-danger" onClick={() => setSegmentToDelete(seg.Name)} aria-label={t('deleteSegment')}><Icon path={ICONS.DELETE}/></button>
                            </div>
                        </div>
                        <div className="segment-card-body">
                             <p>{t('rule')}:</p>
                             <div className="segment-rule">{seg.Rule}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SegmentsView;