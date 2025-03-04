import { useSearchParams, useParams } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback } from 'react';

type ParamType<T> = {
  params: T;
  error: string | null;
  refresh: string | null;
};

export function useSafeParams<T extends Record<string, string>>(expectedParams: (keyof T)[]) {
  const params = useParams<T>();
  const searchParams = useSearchParams();
  const refresh = searchParams.get('refresh');
  const [error, setError] = useState<string | null>(null);
  const [validatedParams, setValidatedParams] = useState<T>({} as T);
  const [refreshTrigger, setRefreshTrigger] = useState(false);

  const memoizedExpectedParams = useMemo(() => expectedParams, [expectedParams]);

  const validateParams = useCallback(() => {
    try {
      const validated: Partial<T> = {};
      const missingParams: (keyof T)[] = [];

      memoizedExpectedParams.forEach((param) => {
        if (params[param] && typeof params[param] === 'string') {
          validated[param] = params[param] as T[keyof T];
        } else {
          missingParams.push(param);
        }
      });

      if (missingParams.length > 0) {
        throw new Error(`Missing required parameters: ${missingParams.join(', ')}`);
      }

      return validated as T;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid parameters');
      return null;
    }
  }, [params, memoizedExpectedParams]);

  useEffect(() => {
    const validParams = validateParams();
    // Only update if validParams is not null and different from current validatedParams
    if (validParams && JSON.stringify(validParams) !== JSON.stringify(validatedParams)) {
      setValidatedParams(validParams);
      setError(null);
    } else if (!validParams && Object.keys(validatedParams).length > 0) {
      // Reset validatedParams if validation failed and we had previous valid params
      setValidatedParams({} as T);
    }
  }, [params, memoizedExpectedParams, refreshTrigger]); // Remove validateParams from dependencies

  const forceRefresh = () => setRefreshTrigger(prev => !prev);

  return {
    validatedParams,
    error,
    refresh,
    forceRefresh
  };
}