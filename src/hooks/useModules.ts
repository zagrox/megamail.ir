import { useState, useEffect } from 'react';
import { DIRECTUS_CRM_URL } from '../api/config';
import { Module } from '../api/types';

let cachedModules: Module[] | null = null;

const useModules = () => {
    const [modules, setModules] = useState<Module[] | null>(cachedModules);
    const [loading, setLoading] = useState(!cachedModules);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (cachedModules) {
            return;
        }

        const fetchModules = async () => {
            try {
                const response = await fetch(`${DIRECTUS_CRM_URL}/items/modules?fields=id,modulename,moduleprice,moduledetails,status,modulepro,modulediscount`);
                if (!response.ok) {
                    throw new Error('Failed to fetch modules');
                }
                const data = await response.json();
                cachedModules = data.data;
                setModules(cachedModules);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchModules();
    }, []);

    return { modules, loading, error };
};

export default useModules;