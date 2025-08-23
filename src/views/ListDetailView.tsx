import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import useApiV4 from '../hooks/useApiV4';
import { Contact, List } from '../api/types';
import CenteredMessage from '../components/CenteredMessage';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import Icon, { ICONS } from '../components/Icon';
import Badge from '../components/Badge';
import { useStatusStyles } from '../hooks/useStatusStyles';

const ListDetailView = ({ apiKey, list, onBack, setView }: {
    apiKey: string;
    list: List | null;
    onBack: () => void;
    setView: (view: string, data?: any) => void;
}) => {
    const { t, i18n } = useTranslation();
    const { getStatusStyle } = useStatusStyles();
    const [searchQuery, setSearchQuery] = useState('');
    const [offset, setOffset] = useState(0);
    const [refetchIndex, setRefetchIndex] = useState(0);

    const CONTACTS_PER_PAGE = 20;
    const listName = list?.ListName || '';

    const { data: allContacts, loading, error } = useApiV4(
        listName ? `/lists/${encodeURIComponent(listName)}/contacts` : '',
        apiKey,
        { limit: 10000 }, // Fetch a large number for client-side search/pagination
        refetchIndex
    );
    
    const filteredContacts = React.useMemo(() => {
        if (!Array.isArray(allContacts)) return [];
        const lowercasedQuery = searchQuery.toLowerCase();
        if (!lowercasedQuery) return allContacts;
        
        return allContacts.filter(c =>
            c.Email.toLowerCase().includes(lowercasedQuery) ||
            (c.FirstName || '').toLowerCase().includes(lowercasedQuery) ||
            (c.LastName || '').toLowerCase().includes(lowercasedQuery)
        );
    }, [allContacts, searchQuery]);
    
    const paginatedContacts = React.useMemo(() => {
        return filteredContacts.slice(offset, offset + CONTACTS_PER_PAGE);
    }, [filteredContacts, offset]);

    if (!list) {
        return (
            <CenteredMessage>
                <div className="info-message warning">
                    <p>No list selected.</p>
                </div>
            </CenteredMessage>
        );
    }
    
    return (
        <div>
            <div className="view-header" style={{flexWrap: 'nowrap'}}>
                <button className="btn btn-secondary" onClick={onBack} style={{whiteSpace: 'nowrap'}}>
                    <Icon path={ICONS.CHEVRON_LEFT} />
                    <span>{t('emailLists')}</span>
                </button>
                <div style={{flexGrow: 1, display: 'flex', justifyContent: 'center'}}>
                    <h2 className="content-header" style={{margin: 0, borderBottom: 'none'}}>{t('contactsInList', { listName })}</h2>
                </div>
                <div className="header-actions" style={{display: 'flex', justifyContent: 'flex-end'}}>
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
                            disabled={loading}
                        />
                    </div>
                </div>
            </div>
            
            {loading && <CenteredMessage><Loader /></CenteredMessage>}
            {error && <ErrorMessage error={error} />}
            
            {!loading && !error && (
                 (paginatedContacts.length === 0) ? (
                    <CenteredMessage style={{height: '50vh'}}>
                        <div className="info-message">
                            <strong>{searchQuery ? t('noContactsForQuery', { query: searchQuery }) : t('listHasNoContacts')}</strong>
                        </div>
                    </CenteredMessage>
                ) : (
                    <>
                    <div className="table-container">
                        <table className="simple-table">
                            <thead>
                                <tr>
                                    <th>{t('email')}</th>
                                    <th>{t('name')}</th>
                                    <th>{t('status')}</th>
                                    <th style={{ textAlign: i18n.dir() === 'rtl' ? 'left' : 'right' }}>{t('action')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedContacts.map((contact: Contact) => {
                                    const statusStyle = getStatusStyle(contact.Status);
                                    return (
                                        <tr key={contact.Email}>
                                            <td>
                                                <button 
                                                    className="table-link-button" 
                                                    onClick={() => setView('ContactDetail', { contactEmail: contact.Email, origin: { view: 'ListDetail', data: { list } } })}
                                                >
                                                    <strong>{contact.Email}</strong>
                                                </button>
                                            </td>
                                            <td>{`${contact.FirstName || ''} ${contact.LastName || ''}`.trim() || '-'}</td>
                                            <td><Badge text={statusStyle.text} type={statusStyle.type} iconPath={statusStyle.iconPath} /></td>
                                            <td>
                                                <div className="action-buttons" style={{justifyContent: 'flex-end'}}>
                                                   <button className="btn-icon btn-icon-danger" aria-label={t('deleteContact')}><Icon path={ICONS.DELETE}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {(filteredContacts.length > CONTACTS_PER_PAGE || offset > 0) && (
                        <div className="pagination-controls">
                            <button onClick={() => setOffset(o => Math.max(0, o - CONTACTS_PER_PAGE))} disabled={offset === 0 || loading}>
                                <Icon path={ICONS.CHEVRON_LEFT} />
                                <span>{t('previous')}</span>
                            </button>
                            <span className="pagination-page-info">{t('page', { page: offset / CONTACTS_PER_PAGE + 1 })}</span>
                            <button onClick={() => setOffset(o => o + CONTACTS_PER_PAGE)} disabled={offset + CONTACTS_PER_PAGE >= filteredContacts.length || loading}>
                                <span>{t('next')}</span>
                                <Icon path={ICONS.CHEVRON_RIGHT} />
                            </button>
                        </div>
                    )}
                    </>
                )
            )}
        </div>
    );
};
export default ListDetailView;