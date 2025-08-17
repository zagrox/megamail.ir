
import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useApiV4 from '../../hooks/useApiV4';
import { FileInfo } from '../../api/types';
import { formatBytes, formatDateForDisplay } from '../../utils/helpers';
import { ELASTIC_EMAIL_API_V4_BASE } from '../../api/config';
import Modal from '../Modal';
import Loader from '../Loader';
import ErrorMessage from '../ErrorMessage';
import CenteredMessage from '../CenteredMessage';
import Icon, { ICONS } from '../Icon';
import FileUploadModal from './FileUploadModal';
import ActionStatus from '../ActionStatus';

const imageFileExtensions = /\.(jpe?g|png|gif|webp|svg)$/i;

const FileGridCardSelect = ({ fileInfo, apiKey, onSelect }: { fileInfo: FileInfo, apiKey: string, onSelect: (file: FileInfo) => void }) => {
    const downloadUrl = `${ELASTIC_EMAIL_API_V4_BASE}/files/${encodeURIComponent(fileInfo.FileName)}?apiKey=${apiKey}`;

    return (
        <div className="card file-grid-card" onClick={() => onSelect(fileInfo)}>
            <div className="file-grid-card-preview">
                <img src={downloadUrl} alt={fileInfo.FileName} className="file-grid-card-thumbnail" loading="lazy" />
            </div>
            <div className="file-grid-card-overlay"></div>
            <div className="file-grid-card-info">
                <h4 className="file-grid-card-name" title={fileInfo.FileName}>{fileInfo.FileName}</h4>
                <p className="file-grid-card-meta">{formatBytes(fileInfo.Size)}</p>
            </div>
        </div>
    );
};

const FileListCardSelect = ({ fileInfo, apiKey, onSelect }: { fileInfo: FileInfo, apiKey: string, onSelect: (file: FileInfo) => void }) => {
    const downloadUrl = `${ELASTIC_EMAIL_API_V4_BASE}/files/${encodeURIComponent(fileInfo.FileName)}?apiKey=${apiKey}`;

    return (
        <div className="card file-card clickable" onClick={() => onSelect(fileInfo)} style={{padding: '0.75rem'}}>
            <div className="file-card-icon-wrapper" style={{width: 40, height: 40}}>
                 <img src={downloadUrl} alt={fileInfo.FileName} className="file-card-thumbnail" loading="lazy" />
            </div>
            <div className="file-card-info">
                <h4 className="file-card-name" title={fileInfo.FileName}>{fileInfo.FileName}</h4>
                <p className="file-card-meta">{formatDateForDisplay(fileInfo.DateAdded)}</p>
            </div>
        </div>
    );
};


const MediaManagerModal = ({ isOpen, onClose, apiKey, onSelect }: { isOpen: boolean, onClose: () => void, apiKey: string, onSelect: (file: FileInfo) => void }) => {
    const { t } = useTranslation();
    const [refetchIndex, setRefetchIndex] = useState(0);
    const { data: allFiles, loading, error } = useApiV4(isOpen ? '/files' : '', apiKey, { limit: 1000 }, isOpen ? refetchIndex : 0);

    const [actionStatus, setActionStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState('DateAdded-descending');
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const FILES_PER_PAGE = viewMode === 'grid' ? 12 : 8;

    const refetch = () => setRefetchIndex(i => i + 1);

    const handleUploadSuccess = () => {
        setIsUploadModalOpen(false);
        setActionStatus({ type: 'success', message: t('fileUploadSuccess') });
        setTimeout(refetch, 1000);
    };

    const handleUploadError = (message: string) => {
        setActionStatus({ type: 'error', message: `${t('fileUploadError', { error: '' })} ${message}` });
    };

    const sortedAndFilteredFiles = useMemo(() => {
        if (!Array.isArray(allFiles)) return [];
        const [key, direction] = sortOrder.split('-') as [keyof FileInfo, 'ascending' | 'descending'];

        return allFiles
            .filter(file => imageFileExtensions.test(file.FileName))
            .filter(file => file.FileName.toLowerCase().includes(searchQuery.toLowerCase()))
            .sort((a, b) => {
                const aValue = a[key];
                const bValue = b[key];
                let comparison = 0;
                if (key === 'DateAdded') comparison = new Date(aValue as string).getTime() - new Date(bValue as string).getTime();
                else if (key === 'FileName') comparison = (aValue as string).localeCompare(bValue as string);
                else comparison = (aValue as number) - (bValue as number);
                return direction === 'descending' ? -comparison : comparison;
            });
    }, [allFiles, searchQuery, sortOrder]);

    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
            setSortOrder('DateAdded-descending');
            setCurrentPage(1);
        }
    }, [isOpen]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, sortOrder, viewMode]);

    const { paginatedFiles, totalPages } = useMemo(() => {
        const total = Math.ceil(sortedAndFilteredFiles.length / FILES_PER_PAGE);
        const paginated = sortedAndFilteredFiles.slice(
            (currentPage - 1) * FILES_PER_PAGE,
            currentPage * FILES_PER_PAGE
        );
        return { paginatedFiles: paginated, totalPages: total };
    }, [sortedAndFilteredFiles, currentPage, FILES_PER_PAGE]);

    const sortOptions = {
        "DateAdded-descending": "Recent first",
        "DateAdded-ascending": "Oldest first",
        "FileName-ascending": "Name (A-Z)",
        "FileName-descending": "Name (Z-A)",
        "Size-descending": "Size (Largest)",
        "Size-ascending": "Size (Smallest)",
    };
    
    // The wrapper div is necessary to scope the CSS for a larger modal
    if (!isOpen) return null;
    return (
        <div className="media-manager-modal">
             <FileUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                apiKey={apiKey}
                onSuccess={handleUploadSuccess}
                onError={handleUploadError}
            />
            <Modal isOpen={isOpen} onClose={onClose} title={t('mediaLibrary')}>
                <div className="media-manager-modal-content">
                    <ActionStatus status={actionStatus} onDismiss={() => setActionStatus(null)} />
                   
                    <div className="view-header">
                        <div className="search-bar">
                            <Icon path={ICONS.SEARCH}/>
                            <input type="search" placeholder={t('search')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                        </div>
                        <div className="header-actions">
                            <div className="view-switcher">
                                <button onClick={() => setViewMode('list')} className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}><Icon path={ICONS.EMAIL_LISTS} /></button>
                                <button onClick={() => setViewMode('grid')} className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}><Icon path={ICONS.DASHBOARD} /></button>
                            </div>
                            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                                {Object.entries(sortOptions).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                            </select>
                            <button className="btn btn-primary" onClick={() => setIsUploadModalOpen(true)}>
                                <Icon path={ICONS.UPLOAD} /> {t('uploadFile')}
                            </button>
                        </div>
                    </div>

                    {loading && <div style={{flexGrow: 1, display: 'flex'}}><CenteredMessage style={{width: '100%'}}><Loader /></CenteredMessage></div>}
                    {error && <ErrorMessage error={error} />}

                    {!loading && !error && (
                        <>
                            {paginatedFiles.length === 0 ? (
                                <div style={{flexGrow: 1, display: 'flex'}}><CenteredMessage style={{width: '100%'}}>
                                    <div className="info-message">
                                        <strong>{searchQuery ? t('noImagesFound') : t('noImagesFound')}</strong>
                                        {!searchQuery && <p>{t('uploadNewFilePrompt')}</p>}
                                    </div>
                                </CenteredMessage></div>
                            ) : (
                                <div className={`file-container-view ${viewMode === 'grid' ? 'file-grid-view' : 'file-list-view'}`}>
                                    {paginatedFiles.map((file: FileInfo) => (
                                        viewMode === 'grid' ? (
                                            <FileGridCardSelect key={file.FileName} fileInfo={file} apiKey={apiKey} onSelect={onSelect} />
                                        ) : (
                                            <FileListCardSelect key={file.FileName} fileInfo={file} apiKey={apiKey} onSelect={onSelect} />
                                        )
                                    ))}
                                </div>
                            )}
                            
                             {totalPages > 1 && (
                                <div className="pagination-controls">
                                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><Icon path={ICONS.CHEVRON_LEFT} /><span>{t('previous')}</span></button>
                                    <span className="pagination-page-info">{t('page', { page: `${currentPage} / ${totalPages}` })}</span>
                                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><span>{t('next')}</span><Icon path={ICONS.CHEVRON_RIGHT} /></button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default MediaManagerModal;
