import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import useApi from './useApi';
import useApiV4 from '../hooks/useApiV4';
import { apiFetch, apiFetchV4, apiUploadV4 } from '../api/elasticEmail';
import { Contact, List } from '../api/types';
import { formatDateForDisplay } from '../utils/helpers';
import CenteredMessage from '../components/CenteredMessage';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { useToast } from '../contexts/ToastContext';
import Modal from '../components/Modal';
import Icon, { ICONS } from '../components/Icon';
import Badge from '../components/Badge';
import ConfirmModal from '../components/ConfirmModal';
import { useStatusStyles } from '../hooks/useStatusStyles';

const STATUS_ORDER = [
    'Active', 'Engaged', 'Transactional', 'Bounced', 'Unsubscribed',
    'Abuse', 'Inactive', 'Stale', 'NotConfirmed'
];

const STATUS_TO_V2_ENUM: { [key: string]: number } = {
    'Transactional': -2,
    'Engaged': -1,
    'Active': 0,
    'Bounced': 1,
    'Unsubscribed': 2,
    'Abuse': 3,
    'Inactive': 4,
    'Stale': 5,
    'NotConfirmed': 6
};

const V2_ENUM_TO_STATUS: { [key: number]: string } = {
    '-2': 'Transactional',
    '-1': 'Engaged',
    '0': 'Active',
    '1': 'Bounced',
    '2': 'Unsubscribed',
    '3': 'Abuse',
    '4': 'Inactive',
    '5': 'Stale',
    '6': 'NotConfirmed'
};

const ContactStatusFilter = ({ apiKey, selectedStatuses, onStatusChange }: { apiKey: string, selectedStatuses: string[], onStatusChange: (status: string) => void }) => {
    const { t, i18n } = useTranslation();
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    useEffect(() => {
        if (!apiKey) {
            setIsLoading(false);
            return;
        }

        const fetchCounts = async () => {
            setIsLoading(true);
            setFetchError(null);
            
            const promises = STATUS_ORDER.map(status => {
                const apiStatusEnum = STATUS_TO_V2_ENUM[status];
                // Use numeric enum for rule if available, otherwise fallback to string.
                const rule = apiStatusEnum !== undefined ? `Status = ${apiStatusEnum}` : `Status = '${status}'`;
                
                return apiFetch('/contact/count', apiKey, { params: { rule } })
                    .then(count => ({ status, count: Number(count) }))
                    .catch(() => ({ status, count: -1 })); // Use -1 to flag an error
            });

            try {
                const results = await Promise.all(promises);
                const newCounts: Record<string, number> = {};
                results.forEach(result => {
                    newCounts[result.status] = result.count;
                });
                setCounts(newCounts);
            } catch (e: any) {
                setFetchError(e.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCounts();
    }, [apiKey]);
    
    return (
        <div className="card contact-status-filter">
            <div className="card-header">
                <h3>{t('status')}</h3>
            </div>
            <div className="card-body">
                {isLoading && <CenteredMessage><Loader /></CenteredMessage>}
                {fetchError && <p style={{fontSize: '0.8rem', color: 'var(--danger-color)', padding: '0 0.5rem'}}>{t('error')}: {fetchError}</p>}
                {!isLoading && !fetchError && STATUS_ORDER.map(status => {
                    const count = counts[status];
                    
                    return (
                        <div key={status} className="contact-status-filter-item" onClick={() => onStatusChange(status)}>
                            <label className="custom-checkbox">
                                <input
                                    type="checkbox"
                                    checked={selectedStatuses.includes(status)}
                                    onChange={() => onStatusChange(status)}
                                />
                                <span className="checkbox-checkmark"></span>
                                <span className="checkbox-label">{status}</span>
                            </label>
                            <span className="badge">
                                {count === -1 
                                 ? <Icon path={ICONS.COMPLAINT} title={t('error')} style={{width: '1em', height: '1em', color: 'var(--danger-color)'}}/> 
                                 : (count !== undefined ? Number(count).toLocaleString(i18n.language) : <Loader />)
                                }
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


const ContactDetailModal = ({ isOpen, onClose, contactData, isLoading, error }: { isOpen: boolean; onClose: () => void; contactData: Contact | null; isLoading: boolean; error: string | null; }) => {
    const { t, i18n } = useTranslation();
    const { getStatusStyle } = useStatusStyles();
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isLoading ? t('loading') : contactData?.Email || t('contactDetails')}>
            {isLoading && <CenteredMessage><Loader /></CenteredMessage>}
            {error && <ErrorMessage error={{ endpoint: 'GET /contacts/{email}', message: error || t('unknownError') }} />}
            {contactData && (
                <div className="contact-details-grid">
                    <dt>{t('email')}</dt><dd>{contactData.Email}</dd>
                    <dt>{t('status')}</dt><dd>{(() => {
                        const statusStyle = getStatusStyle(contactData.Status);
                        return <Badge text={statusStyle.text} type={statusStyle.type} iconPath={statusStyle.iconPath} />
                    })()}</dd>
                    <dt>{t('firstName')}</dt><dd>{contactData.FirstName || '-'}</dd>
                    <dt>{t('lastName')}</dt><dd>{contactData.LastName || '-'}</dd>
                    <dt>{t('source')}</dt><dd>{contactData.Source || '-'}</dd>
                    <dt>{t('dateAdded')}</dt><dd>{formatDateForDisplay(contactData.DateAdded, i18n.language)}</dd>
                    <dt>{t('dateUpdated')}</dt><dd>{formatDateForDisplay(contactData.DateUpdated, i18n.language)}</dd>
                    <dt>{t('statusChangeDate')}</dt><dd>{formatDateForDisplay(contactData.StatusChangeDate, i18n.language)}</dd>
                    
                    <div className="grid-separator"><h4>{t('activity')}</h4></div>
                    
                    <dt>{t('totalSent')}</dt><dd>{contactData.Activity?.TotalSent?.toLocaleString(i18n.language) ?? '0'}</dd>
                    <dt>{t('totalOpened')}</dt><dd>{contactData.Activity?.TotalOpened?.toLocaleString(i18n.language) ?? '0'}</dd>
                    <dt>{t('totalClicked')}</dt><dd>{contactData.Activity?.TotalClicked?.toLocaleString(i18n.language) ?? '0'}</dd>
                    <dt>{t('totalFailed')}</dt><dd>{contactData.Activity?.TotalFailed?.toLocaleString(i18n.language) ?? '0'}</dd>
                    <dt>{t('lastSent')}</dt><dd>{formatDateForDisplay(contactData.Activity?.LastSent, i18n.language)}</dd>
                    <dt>{t('lastOpened')}</dt><dd>{formatDateForDisplay(contactData.Activity?.LastOpened, i18n.language)}</dd>
                    <dt>{t('lastClicked')}</dt><dd>{formatDateForDisplay(contactData.Activity?.LastClicked, i18n.language)}</dd>
                    <dt>{t('lastFailed')}</dt><dd>{formatDateForDisplay(contactData.Activity?.LastFailed, i18n.language)}</dd>

                    <div className="grid-separator"><h4>{t('customFields')}</h4></div>
                    
                    {contactData.CustomFields && Object.keys(contactData.CustomFields).length > 0 ? (
                         Object.entries(contactData.CustomFields).map(([key, value]) => (
                             <React.Fragment key={key}>
                                 <dt>{key}</dt>
                                 <dd>{String(value) || '-'}</dd>
                             </React.Fragment>
                         ))
                    ) : (
                        <dd className="full-width-dd">{t('noCustomFields')}</dd>
                    )}
                </div>
            )}
        </Modal>
    );
};

const ImportContactsModal = ({ isOpen, onClose, apiKey, onSuccess, onError }: { isOpen: boolean; onClose: () => void; apiKey: string; onSuccess: () => void; onError: (msg: string) => void; }) => {
    const { t } = useTranslation();
    const [file, setFile] = useState<File | null>(null);
    const [listName, setListName] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const { data: lists, loading: listsLoading } = useApiV4('/lists', apiKey, {}, isOpen ? 1 : 0);

    const handleFileChange = (files: FileList | null) => {
        if (files && files.length > 0) {
            if (files[0].type === 'text/csv' || files[0].name.endsWith('.csv')) {
                setFile(files[0]);
            } else {
                onError(t('invalidFileType'));
            }
        }
    };

    const handleDragEvents = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };
    const handleDragEnter = (e: React.DragEvent) => { handleDragEvents(e); setDragOver(true); };
    const handleDragLeave = (e: React.DragEvent) => { handleDragEvents(e); setDragOver(false); };
    const handleDrop = (e: React.DragEvent) => {
        handleDragEvents(e);
        setDragOver(false);
        handleFileChange(e.dataTransfer.files);
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        if (listName) {
            formData.append('listName', listName);
        }

        try {
            await apiUploadV4('/contacts/import', apiKey, formData);
            onSuccess();
        } catch (err: any) {
            onError(err.message);
        } finally {
            setIsUploading(false);
        }
    };
    
    useEffect(() => {
        if (!isOpen) {
            setFile(null);
            setListName('');
            setIsUploading(false);
            setDragOver(false);
        }
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('importContactsTitle')}>
            <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                    <label>{t('uploadCsvFile')}</label>
                    <div
                        className={`file-dropzone ${dragOver ? 'drag-over' : ''}`}
                        onClick={() => document.getElementById('csv-input')?.click()}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragEvents}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file" id="csv-input" accept=".csv, text/csv"
                            onChange={(e) => handleFileChange(e.target.files)}
                            style={{ display: 'none' }}
                        />
                         {file ? (
                            <p className="file-name">{t('selectedFile', { fileName: file.name })}</p>
                        ) : (
                            <p><strong>{t('clickToBrowse')}</strong> {t('orDragAndDrop')}</p>
                        )}
                    </div>
                </div>

                <div className="form-group">
                     <label htmlFor="listName">{t('addToListOptional')}</label>
                     <select id="listName" value={listName} onChange={e => setListName(e.target.value)} disabled={listsLoading}>
                         <option value="">{t('dontAddToList')}</option>
                         {lists?.map((l: List) => <option key={l.ListName} value={l.ListName}>{l.ListName}</option>)}
                     </select>
                </div>
                <div className="form-actions" style={{marginTop: '1rem'}}>
                     <button type="submit" className="btn btn-primary full-width" disabled={!file || isUploading}>
                        {isUploading ? <Loader /> : t('startImport')}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

const ContactCard = React.memo(({ contact, onView, onDelete }: { contact: Contact; onView: (email: string) => void; onDelete: (email: string) => void; }) => {
    const { t, i18n } = useTranslation();
    const { getStatusStyle } = useStatusStyles();
    const statusStyle = getStatusStyle(contact.Status);

    return (
        <div className="card contact-card">
            <div className="contact-card-main">
                <div className="contact-card-info">
                    <h4 className="contact-card-name">{contact.FirstName || contact.LastName ? `${contact.FirstName || ''} ${contact.LastName || ''}`.trim() : contact.Email}</h4>
                    <p className="contact-card-email">{contact.Email}</p>
                </div>
                <div className="contact-card-status">
                    <Badge text={statusStyle.text} type={statusStyle.type} iconPath={statusStyle.iconPath} />
                </div>
            </div>
            <div className="contact-card-footer">
                <small>{t('dateAdded')}: {formatDateForDisplay(contact.DateAdded, i18n.language)}</small>
                <div className="action-buttons">
                    <button className="btn-icon btn-icon-primary" onClick={() => onView(contact.Email)} aria-label={t('viewContactDetails')}>
                        <Icon path={ICONS.EYE} />
                    </button>
                    <button className="btn-icon btn-icon-danger" onClick={() => onDelete(contact.Email)} aria-label={t('deleteContact')}>
                        <Icon path={ICONS.DELETE} />
                    </button>
                </div>
            </div>
        </div>
    );
});

const AddContactForm = ({ onSubmit }: { onSubmit: (data: {Email: string, FirstName: string, LastName: string}) => void }) => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ Email: email, FirstName: firstName, LastName: lastName });
    };

    return (
        <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-group">
                <label htmlFor="email">{t('emailAddress')}</label>
                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-grid">
                 <div className="form-group">
                    <label htmlFor="firstName">{t('firstName')}</label>
                    <input id="firstName" type="text" value={firstName} onChange={e => setFirstName(e.target.value)} />
                </div>
                 <div className="form-group">
                    <label htmlFor="lastName">{t('lastName')}</label>
                    <input id="lastName" type="text" value={lastName} onChange={e => setLastName(e.target.value)} />
                </div>
            </div>
            <button type="submit" className="btn btn-primary full-width">{t('addContact')}</button>
        </form>
    );
};

const ContactsView = ({ apiKey }: { apiKey: string }) => {
    const { t } = useTranslation();
    const { addToast } = useToast();
    const [refetchIndex, setRefetchIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [offset, setOffset] = useState(0);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedContactDetails, setSelectedContactDetails] = useState<Contact | null>(null);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [contactToDelete, setContactToDelete] = useState<string | null>(null);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

    const CONTACTS_PER_PAGE = 20;
    
    const useV2Api = selectedStatuses.length > 0;

    const v2Rule = useMemo(() => {
        const statusClauses = selectedStatuses.map(s => {
            const apiStatusEnum = STATUS_TO_V2_ENUM[s];
            if (apiStatusEnum !== undefined) {
                return `Status = ${apiStatusEnum}`;
            }
            return `Status = '${s}'`;
        });
        const statusRule = `(${statusClauses.join(' OR ')})`;

        if (searchQuery) {
            const escapedSearch = searchQuery.replace(/'/g, "''");
            const searchRule = `(Email CONTAINS '${escapedSearch}' OR FirstName CONTAINS '${escapedSearch}' OR LastName CONTAINS '${escapedSearch}')`;
            return `${statusRule} AND ${searchRule}`;
        }
        
        return statusRule;
    }, [selectedStatuses, searchQuery]);
    
    // V4 API call for when no status filter is active
    const { data: v4Data, loading: v4Loading, error: v4Error } = useApiV4(
        !useV2Api ? '/contacts' : '',
        apiKey,
        { limit: CONTACTS_PER_PAGE, offset, search: searchQuery },
        refetchIndex
    );
    
    // V2 API call for when a status filter is active
    const { data: v2Data, loading: v2Loading, error: v2Error } = useApi(
        useV2Api ? '/contact/list' : '',
        apiKey,
        { rule: v2Rule, limit: CONTACTS_PER_PAGE, offset },
        refetchIndex
    );

    const v2ContactsMapped = useMemo(() => {
        if (!v2Data) return [];
        return v2Data.map((c: any) => ({
            Email: c.email,
            FirstName: c.firstname,
            LastName: c.lastname,
            Status: V2_ENUM_TO_STATUS[c.status as number] || 'Unknown',
            Source: c.source,
            DateAdded: c.dateadded,
        }));
    }, [v2Data]);

    const contacts = useV2Api ? v2ContactsMapped : v4Data;
    const loading = useV2Api ? v2Loading : v4Loading;
    const error = useV2Api ? v2Error : v4Error;

    const refetch = () => setRefetchIndex(i => i + 1);

    const handleStatusChange = (status: string) => {
        setSelectedStatuses(prev => {
            const newSelection = prev.includes(status)
                ? prev.filter(s => s !== status)
                : [...prev, status];
            
            setOffset(0); // Reset pagination on filter change
            return newSelection;
        });
    };

    const handleAddContact = async (contactData: {Email: string, FirstName: string, LastName: string}) => {
        try {
            await apiFetchV4('/contacts', apiKey, { method: 'POST', body: [contactData] });
            addToast(t('contactAddedSuccess', { email: contactData.Email }), 'success');
            setIsAddModalOpen(false);
            refetch();
        } catch (err: any) {
            addToast(t('contactAddedError', { error: err.message }), 'error');
        }
    };
    
    const confirmDeleteContact = async () => {
        if (!contactToDelete) return;
        try {
            await apiFetchV4(`/contacts/${encodeURIComponent(contactToDelete)}`, apiKey, { method: 'DELETE' });
            addToast(t('contactDeletedSuccess', { email: contactToDelete }), 'success');
            refetch();
        } catch (err: any) {
            addToast(t('contactDeletedError', { error: err.message }), 'error');
        } finally {
            setContactToDelete(null);
        }
    };

    const handleViewContact = useCallback(async (email: string) => {
        setIsDetailModalOpen(true);
        setIsDetailLoading(true);
        setDetailError(null);
        setSelectedContactDetails(null);
        try {
            const details = await apiFetchV4(`/contacts/${encodeURIComponent(email)}`, apiKey);
            setSelectedContactDetails(details);
        } catch (err: any) {
            setDetailError(err.message || t('contactDetailsError'));
        } finally {
            setIsDetailLoading(false);
        }
    }, [apiKey, t]);

    return (
        <div>
            <ImportContactsModal 
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                apiKey={apiKey}
                onSuccess={() => {
                    setIsImportModalOpen(false);
                    addToast(t('importSuccessMessage'), 'success');
                    setTimeout(refetch, 2000);
                }}
                onError={(message) => {
                    addToast(t('importFailedError', { error: message }), 'error');
                }}
            />
            <Modal title={t('addNewContact')} isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}>
                <AddContactForm onSubmit={handleAddContact} />
            </Modal>
            <ConfirmModal
                isOpen={!!contactToDelete}
                onClose={() => setContactToDelete(null)}
                onConfirm={confirmDeleteContact}
                title={t('deleteContact')}
            >
                <p>{t('confirmDeleteContact', { email: contactToDelete })}</p>
            </ConfirmModal>
            <ContactDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => { setIsDetailModalOpen(false); setSelectedContactDetails(null); }}
                contactData={selectedContactDetails}
                isLoading={isDetailLoading}
                error={detailError}
            />

            <div className="contacts-view-layout">
                <ContactStatusFilter
                    apiKey={apiKey}
                    selectedStatuses={selectedStatuses}
                    onStatusChange={handleStatusChange}
                />

                <div className="contacts-view-main">
                    <div className="view-header contacts-header">
                        <div className="search-bar">
                             <Icon path={ICONS.SEARCH} />
                            <input
                                type="search"
                                placeholder={t('searchContactsPlaceholder')}
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setOffset(0);
                                }}
                            />
                        </div>
                        <div className="header-actions">
                            <button className="btn" onClick={() => setIsImportModalOpen(true)}>
                                <Icon path={ICONS.UPLOAD} /> {t('importContacts')}
                            </button>
                            <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
                                <Icon path={ICONS.USER_PLUS} /> {t('addContact')}
                            </button>
                        </div>
                    </div>

                    {loading && <CenteredMessage><Loader /></CenteredMessage>}
                    {error && <ErrorMessage error={error} />}

                    {!loading && !error && (
                        <>
                            {contacts?.length > 0 ? (
                                <div className="contacts-grid">
                                    {contacts.map((contact: Contact) => (
                                        <ContactCard 
                                            key={contact.Email} 
                                            contact={contact} 
                                            onView={handleViewContact} 
                                            onDelete={setContactToDelete} 
                                        />
                                    ))}
                                </div>
                            ) : (
                                <CenteredMessage>
                                {searchQuery ? t('noContactsForQuery', { query: searchQuery }) : t('noContactsFound')}
                                </CenteredMessage>
                            )}

                            {contacts && (contacts.length > 0 || offset > 0) && (
                                <div className="pagination-controls">
                                    <button onClick={() => setOffset(o => Math.max(0, o - CONTACTS_PER_PAGE))} disabled={offset === 0 || loading}>
                                        <Icon path={ICONS.CHEVRON_LEFT} />
                                        <span>{t('previous')}</span>
                                    </button>
                                    <span className="pagination-page-info">{t('page', { page: offset / CONTACTS_PER_PAGE + 1 })}</span>
                                    <button onClick={() => setOffset(o => o + CONTACTS_PER_PAGE)} disabled={!contacts || contacts.length < CONTACTS_PER_PAGE || loading}>
                                        <span>{t('next')}</span>
                                        <Icon path={ICONS.CHEVRON_RIGHT} />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContactsView;