'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { RecommendRequest, RecommendResponse } from '@/types/api';

/**
 * Holds the last search so `/results` can render what `/recommend` already
 * fetched.
 *
 * The provider sits in the root layout, above both routes, so a client-side
 * navigation between them does not unmount it and the results page never
 * refetches on render. The request is kept alongside the response because the
 * empty state has to say which budget and duration came back with nothing, and
 * because it lets the form be filled back in when refining a search.
 *
 * This is deliberately in memory only. A hard refresh of `/results` loses it,
 * and the page handles that by sending the user back to the form rather than
 * silently refetching — a refresh should not quietly re-run a search.
 */

export interface RecommendationSearch {
  request: RecommendRequest;
  response: RecommendResponse;
}

interface RecommendationContextValue {
  search: RecommendationSearch | null;
  saveSearch: (search: RecommendationSearch) => void;
  clearSearch: () => void;
}

const RecommendationContext = createContext<
  RecommendationContextValue | undefined
>(undefined);

export function RecommendationProvider({ children }: { children: ReactNode }) {
  const [search, setSearch] = useState<RecommendationSearch | null>(null);

  const saveSearch = useCallback((next: RecommendationSearch) => {
    setSearch(next);
  }, []);

  const clearSearch = useCallback(() => {
    setSearch(null);
  }, []);

  const value = useMemo(
    () => ({ search, saveSearch, clearSearch }),
    [search, saveSearch, clearSearch]
  );

  return (
    <RecommendationContext.Provider value={value}>
      {children}
    </RecommendationContext.Provider>
  );
}

/** Throws outside the provider, so a missing provider fails loudly in dev. */
export function useRecommendation(): RecommendationContextValue {
  const context = useContext(RecommendationContext);
  if (context === undefined) {
    throw new Error(
      'useRecommendation must be used inside a RecommendationProvider.'
    );
  }
  return context;
}
