'use client';
import { useEffect, useState } from 'react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useMarkets(mode: 'all' | 'new24h' = 'all') {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetcher(`/api/markets?mode=${mode}`);
      if (response.error) {
        throw new Error(response.error);
      }
      setData(response);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60_000);
    return () => clearInterval(interval);
  }, [mode]);

  return {
    data,
    error,
    isLoading,
    refresh: loadData,
  };
}