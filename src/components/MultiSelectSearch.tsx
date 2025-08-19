import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Icon, { ICONS } from './Icon';
import Loader from './Loader';

interface Item {
    id: string;
    name: string;
}

interface MultiSelectSearchProps {
    items: Item[];
    selectedItems: string[];
    onSelectionChange: (selected: string[]) => void;
    placeholder: string;
    loading: boolean;
}

const MultiSelectSearch: React.FC<MultiSelectSearchProps> = ({
    items,
    selectedItems,
    onSelectionChange,
    placeholder,
    loading
}) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) && !selectedItems.includes(item.id)
    );

    const handleSelect = (item: Item) => {
        onSelectionChange([...selectedItems, item.id]);
        setSearchTerm('');
        setIsOpen(false);
    };

    const handleRemove = (itemToRemove: string) => {
        onSelectionChange(selectedItems.filter(item => item !== itemToRemove));
    };

    const selectedItemsData = selectedItems.map(id => items.find(item => item.id === id)).filter(Boolean) as Item[];

    return (
        <div className="multi-select-container" ref={containerRef}>
            <div className="multi-select-input-wrapper">
                <Icon path={ICONS.HASH} className="multi-select-icon" />
                <input
                    type="search"
                    className="multi-select-input"
                    placeholder={placeholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                />
            </div>
            {isOpen && (
                <ul className="multi-select-dropdown">
                    {loading ? (
                         <li className="multi-select-message"><Loader /></li>
                    ) : filteredItems.length > 0 ? (
                        filteredItems.slice(0, 7).map(item => (
                            <li key={item.id} className="multi-select-dropdown-item" onClick={() => handleSelect(item)}>
                                {item.name}
                            </li>
                        ))
                    ) : (
                         <li className="multi-select-message">{t('noResultsFound')}</li>
                    )}
                </ul>
            )}
            {selectedItemsData.length > 0 && (
                <div className="multi-select-tags">
                    {selectedItemsData.map(item => (
                        <div key={item.id} className="multi-select-tag">
                            <span>{item.name}</span>
                            <button
                                type="button"
                                className="multi-select-tag-remove"
                                onClick={() => handleRemove(item.id)}
                                aria-label={`Remove ${item.name}`}
                            >
                                &times;
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MultiSelectSearch;
