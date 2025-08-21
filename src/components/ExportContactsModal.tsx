import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import Loader from './Loader';
import Icon, { ICONS } from './Icon';

const ExportContactsModal = ({ isOpen, onClose, apiKey, selectedStatuses, onSuccess, onError }: {
    isOpen: boolean;
    onClose: () => void;
    apiKey: string;
    selectedStatuses: string[];
    onSuccess: () => void;
    onError: (msg: string) => void;
}) => {
    const { t } = useTranslation();
    const [fileFormat, setFileFormat] = useState('Csv');
    const [compression, setCompression] = useState('None');
    const [fileName, setFileName] = useState('');
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const ext = compression === 'Zip' ? 'zip' : fileFormat.toLowerCase();
            setFileName(`contacts-export.${ext}`);
        } else {
            // Reset state on close
            setFileFormat('Csv');
            setCompression('None');
            setFileName('');
            setIsExporting(false);
        }
    }, [isOpen, fileFormat, compression]);

    const handleExport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedStatuses.length === 0) {
            onError('No statuses selected for export.');
            return;
        }

        setIsExporting(true);

        const rule = selectedStatuses.map(s => `Status = '${s}'`).join(' OR ');

        const body = {
            FileFormat: fileFormat,
            Rule: rule,
            CompressionFormat: compression,
            FileName: fileName,
        };

        try {
            // ElasticEmail API for export returns a text response with the URL
            const response = await fetch('https://api.elasticemail.com/v4/contacts/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-ElasticEmail-ApiKey': apiKey,
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.Error || 'An unknown API error occurred.';
                } catch (e) {
                    // response was not json, use default message
                }
                throw new Error(errorMessage);
            }

            const downloadUrl = await response.text();

            // Trigger download
            const link = document.createElement('a');
            link.href = downloadUrl;
            if (fileName) {
                link.setAttribute('download', fileName);
            }
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            onSuccess();
        } catch (err: any) {
            onError(err.message);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('exportContacts')}>
            <form onSubmit={handleExport} className="modal-form">
                <div className="info-message">
                    <strong>{t('selectedForExport')}:</strong>
                    <p>{selectedStatuses.join(', ')}</p>
                </div>

                <div className="form-group">
                    <label htmlFor="fileFormat">{t('fileFormat')}</label>
                    <select id="fileFormat" value={fileFormat} onChange={e => setFileFormat(e.target.value)}>
                        <option value="Csv">CSV</option>
                        <option value="Xml">XML</option>
                        <option value="Json">JSON</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="compression">{t('compression')}</label>
                    <select id="compression" value={compression} onChange={e => setCompression(e.target.value)}>
                        <option value="None">None</option>
                        <option value="Zip">Zip</option>
                    </select>
                </div>
                
                <div className="form-group">
                    <label htmlFor="fileName">{t('fileNameOptional')}</label>
                    <input id="fileName" type="text" value={fileName} onChange={e => setFileName(e.target.value)} placeholder={`contacts-export.${fileFormat.toLowerCase()}`} />
                </div>

                <div className="form-actions" style={{ marginTop: '1rem' }}>
                    <button type="button" className="btn" onClick={onClose} disabled={isExporting}>{t('cancel')}</button>
                    <button type="submit" className="btn btn-primary" disabled={isExporting}>
                        {isExporting ? <Loader /> : <><Icon path={ICONS.DOWNLOAD} /> <span>{t('export')}</span></>}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ExportContactsModal;
