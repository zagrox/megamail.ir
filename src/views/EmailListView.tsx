import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useApiV4 from '../hooks/useApiV4';
import { apiFetch, apiFetchV4 } from '../api/elasticEmail';
import { List } from '../api/types';
import { formatDateRelative } from '../utils/helpers';
import CenteredMessage from '../components/CenteredMessage';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { useToast } from '../contexts/ToastContext';
import RenameModal from '../components/RenameModal';
import Icon, { ICONS } from '../components/Icon';
import ConfirmModal from '../components/ConfirmModal';


const EmailListView = ({ apiKey, setView }: { apiKey: string, setView: (view: string, data?: any) => void }) => {
    const { t, i18n } = useTranslation();
    const { addToast } = useToast();
    const [refetchIndex, setRefetchIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [newListName, setNewListName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [listToRename, setListToRename] = useState<List | null>(null);
    const [listToDelete, setListToDelete] = useState<List | null>(null);
    const [listCounts, setListCounts] = useState<Record<string, { count: number | null; loading: boolean; error: boolean }>>({});


    const LISTS_PER_PAGE = 25;
    const [currentPage, setCurrentPage] = useState(1);
    
    const { data: lists, loading, error } = useApiV4('/lists', apiKey, { limit: 1000 }, refetchIndex);
    const refetch = () => setRefetchIndex(i => i + 1);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const handleCreateList = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newListName) return;
        setIsSubmitting(true);
        try {
            await apiFetchV4('/lists', apiKey, { method: 'POST', body: { ListName: newListName } });
            addToast(t('listCreatedSuccess', { listName: newListName }), 'success');
            setNewListName('');
            refetch();
        } catch (err: any) {
            addToast(t('listCreatedError', { error: err.message }), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const confirmDeleteList = async () => {
        if (!listToDelete) return;
        const listName = listToDelete.ListName;
        try {
            await apiFetchV4(`/lists/${encodeURIComponent(listName)}`, apiKey, { method: 'DELETE' });
            addToast(t('listDeletedSuccess', { listName }), 'success');
            refetch();
        } catch (err: any) {
            addToast(t('listDeletedError', { error: err.message }), 'error');
        } finally {
            setListToDelete(null);
        }
    };

    const handleRenameList = async (newName: string) => {
        if (!listToRename) return;
        try {
            await apiFetchV4(`/lists/${encodeURIComponent(listToRename.ListName)}`, apiKey, {
                method: 'PUT',
                body: { ListName: newName }
            });
            addToast(t('listRenamedSuccess', { newName }), 'success');
            setListToRename(null);
            refetch();
        } catch (err: any) {
            addToast(t('listRenamedError', { error: err.message }), 'error');
            setListToRename(null);
        }
    };
    
    const filteredLists: List[] = (lists || [])
        .filter((list: List) =>
            list.ListName.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => new Date(b.DateAdded).getTime() - new Date(a.DateAdded).getTime());
    
    const totalPages = Math.ceil(filteredLists.length / LISTS_PER_PAGE);
    const paginatedLists = filteredLists.slice(
        (currentPage - 1) * LISTS_PER_PAGE,
        currentPage * LISTS_PER_PAGE
    );

    useEffect(() => {
        if (paginatedLists && apiKey) {
            paginatedLists.forEach((list: List) => {
                const listName = list.ListName;
                if (!listCounts[listName]) { // Fetch only if not already fetched/fetching
                    setListCounts(prev => ({ ...prev, [listName]: { count: null, loading: true, error: false } }));
    
                    apiFetch('/contact/count', apiKey, { params: { rule: `listname = '${listName.replace(/'/g, "''")}'` } })
                        .then(count => {
                            setListCounts(prev => ({ ...prev, [listName]: { count: Number(count), loading: false, error: false } }));
                        })
                        .catch(err => {
                            console.error(`Failed to fetch count for list ${listName}:`, err);
                            setListCounts(prev => ({ ...prev, [listName]: { count: null, loading: false, error: true } }));
                        });
                }
            });
        }
    }, [paginatedLists, apiKey]);


    return (
        <div>
            {listToRename && (
                 <RenameModal
                    isOpen={!!listToRename}
                    onClose={() => setListToRename(null)}
                    entityName={listToRename.ListName}
                    entityType={t('list')}
                    onSubmit={handleRenameList}
                />
            )}

            {listToDelete && (
                <ConfirmModal
                    isOpen={!!listToDelete}
                    onClose={() => setListToDelete(null)}
                    onConfirm={confirmDeleteList}
                    title={t('deleteList')}
                    isDestructive={true}
                    confirmText={t('delete')}
                >
                    <p>{t('confirmDeleteList', { listName: listToDelete.ListName })}</p>
                </ConfirmModal>
            )}

            <div className="view-header">
                <div className="search-bar" style={{flexGrow: 1, marginRight: '1rem'}}>
                    <Icon path={ICONS.SEARCH} />
                    <input
                        type="search"
                        placeholder={t('searchListsPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        disabled={loading}
                    />
                </div>
                <form className="create-list-form" onSubmit={handleCreateList}>
                    <input
                        type="text"
                        placeholder={t('newListNamePlaceholder')}
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        disabled={isSubmitting}
                        required
                    />
                    <button type="submit" className="btn btn-primary" disabled={!newListName || isSubmitting}>
                        {isSubmitting ? <Loader /> : (
                            <>
                                <Icon path={ICONS.PLUS} />
                                <span>{t('createList')}</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
            
            {loading && <CenteredMessage><Loader /></CenteredMessage>}
            {error && <ErrorMessage error={error} />}
            
            {!loading && !error && (
                filteredLists.length === 0 ? (
                    <CenteredMessage>
                        {searchQuery ? t('noListsForQuery', { query: searchQuery }) : t('noListsFound')}
                    </CenteredMessage>
                ) : (
                    <>
                    <div className="table-container">
                        <table className="simple-table">
                            <thead>
                                <tr>
                                    <th>{t('name')}</th>
                                    <th>{t('contacts')}</th>
                                    <th>{t('dateAdded')}</th>
                                    <th style={{ textAlign: i18n.dir() === 'rtl' ? 'left' : 'right' }}>{t('action')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedLists.map((list: List) => {
                                    const countInfo = listCounts[list.ListName];
                                    return (
                                        <tr key={list.ListName}>
                                            <td>
                                                <button className="table-link-button" onClick={() => setView('ListDetail', { list })}>
                                                    <strong>{list.ListName}</strong>
                                                </button>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                {countInfo?.loading || !countInfo ? <div className="table-container td .loader"><Loader/></div> :
                                                 countInfo.error ? 'N/A' :
                                                 countInfo.count !== null ? countInfo.count.toLocaleString(i18n.language) : '-'}
                                            </td>
                                            <td>{formatDateRelative(list.DateAdded, i18n.language)}</td>
                                            <td>
                                                <div className="action-buttons" style={{justifyContent: 'flex-end'}}>
                                                    <button className="btn-icon btn-icon-primary" onClick={() => setListToRename(list)} aria-label={t('renameList')}><Icon path={ICONS.PENCIL}/></button>
                                                    <button className="btn-icon btn-icon-danger" onClick={() => setListToDelete(list)} aria-label={t('deleteList')}><Icon path={ICONS.DELETE}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                     {totalPages > 1 && (
                        <div className="pagination-controls">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1 || loading}>
                                <Icon path={ICONS.CHEVRON_LEFT} />
                                <span>{t('previous')}</span>
                            </button>
                            <span className="pagination-page-info">Page {currentPage} of {totalPages}</span>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || loading}>
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

export default EmailListView;