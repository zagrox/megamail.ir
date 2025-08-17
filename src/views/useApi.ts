import { useState, useEffect } from 'react';
import { apiFetch } from '../api/elasticEmail';

const useApi = (endpoint: string, apiKey: string, params: Record<string, any> = {}, refetchIndex = 0) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{message: string, endpoint: string} | null>(null);
  
  const paramsString = JSON.stringify(params);

  useEffect(() => {
    if (!apiKey || !endpoint) {
        setLoading(false);
        return;
    };

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFetch(endpoint, apiKey, { params: JSON.parse(paramsString) });
        setData(result);
      } catch (err: any) {
        setError({message: err.message, endpoint});
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint, apiKey, paramsString, refetchIndex]);

  return { data, loading, error };
};

export default useApi;