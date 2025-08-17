import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { apiUploadV4 } from '../../api/elasticEmail';
import { FileInfo } from '../../api/types';
import Modal from '../Modal';
import Loader from '../Loader';

const FileUploadModal = ({ isOpen, onClose, apiKey, onSuccess, onError }: { isOpen: boolean; onClose: () => void; apiKey: string; onSuccess: (fileInfo: FileInfo) => void; onError: (msg: string) => void; }) => {
    const { t } = useTranslation();
    const [file, setFile] = useState<File | null>(null);
    const [expiresAfterDays, setExpiresAfterDays] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    const handleFileChange = (files: FileList | null) => {
        if (files && files.length > 0) {
            setFile(files[0]);
        }
    };

    const handleDragEvents = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
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
        if (expiresAfterDays) {
            formData.append('expiresAfterDays', expiresAfterDays);
        }

        try {
            const fileInfo = await apiUploadV4('/files', apiKey, formData);
            onSuccess(fileInfo);
        } catch (err: any) {
            onError(err.message);
        } finally {
            setIsUploading(false);
        }
    };
    
    useEffect(() => {
        if (!isOpen) {
            setFile(null);
            setExpiresAfterDays('');
            setIsUploading(false);
            setDragOver(false);
        }
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('uploadModalTitle')}>
            <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                    <label>{t('file')}</label>
                    <div
                        className={`file-dropzone ${dragOver ? 'drag-over' : ''}`}
                        onClick={() => document.getElementById('file-upload-input-reusable')?.click()}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragEvents}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file" id="file-upload-input-reusable"
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
                     <label htmlFor="expiresAfterDays-reusable">{t('expiresAfterDays')}</label>
                     <input type="number" id="expiresAfterDays-reusable" value={expiresAfterDays} onChange={e => setExpiresAfterDays(e.target.value)} placeholder={t('leaveEmptyNoExpiry')} min="1" />
                </div>
                <div className="form-actions" style={{marginTop: '1rem'}}>
                     <button type="submit" className="btn btn-primary full-width" disabled={!file || isUploading}>
                        {isUploading ? <Loader /> : t('uploadFile')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default FileUploadModal;
