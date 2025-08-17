import { useState, useEffect, useCallback } from 'react';
import { apiFetchV4 } from '../api/elasticEmail';

const useApiV4 = (endpoint: string, apiKey: string, params: Record<string, any> = {}, refetchIndex = 0) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{message: string, endpoint: string} | null>(null);

  const paramsString = JSON.stringify(params);

  const fetchData = useCallback(async () => {
    if (!apiKey || !endpoint) {
        setLoading(false);
        setData(null);
        return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await apiFetchV4(endpoint, apiKey, { params: JSON.parse(paramsString) });
      setData(result);
    } catch (err: any) {
      setError({ message: err.message, endpoint });
    } finally {
      setLoading(false);
    }
  }, [endpoint, apiKey, paramsString]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refetchIndex]);

  return { data, loading, error, refetch: fetchData };
};

export default useApiV4;