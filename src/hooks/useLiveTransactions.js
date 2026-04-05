import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const API_BASE_URL = '/api';

export default function useLiveTransactions() {
    const [liveTransactions, setLiveTransactions] = useState([]);
    const [liveCursor, setLiveCursor] = useState(null);
    const [liveHasMore, setLiveHasMore] = useState(false);
    const [isLiveLoading, setIsLiveLoading] = useState(false);
    const [isLiveAppending, setIsLiveAppending] = useState(false);
    const [liveSearchTerm, setLiveSearchTerm] = useState('');
    const [liveDateRange, setLiveDateRange] = useState(undefined);
    const [liveSort, setLiveSort] = useState({ key: 'Transaction Date', direction: 'descending' });
    const [liveCardFilter, setLiveCardFilter] = useState('all');
    const [liveCategoryFilter, setLiveCategoryFilter] = useState('all');
    const [liveMethodFilter, setLiveMethodFilter] = useState('all');

    const fetchLiveTransactions = useCallback(async (cursor = null, search = '', isAppend = false, dateRangeOverride = null, sortOverride = null, filterOverride = null) => {
        if (isAppend) {
            setIsLiveAppending(true);
        } else {
            setIsLiveLoading(true);
        }

        try {
            const params = new URLSearchParams();
            if (cursor) params.append('cursor', cursor);
            if (search) params.append('search', search);

            const range = dateRangeOverride !== null ? dateRangeOverride : liveDateRange;
            if (range && range.from) {
                params.append('startDate', format(range.from, 'yyyy-MM-dd'));
                if (range.to) {
                    params.append('endDate', format(range.to, 'yyyy-MM-dd'));
                } else {
                    params.append('endDate', format(range.from, 'yyyy-MM-dd'));
                }
            }

            const sort = sortOverride || liveSort;
            if (sort) {
                params.append('sortKey', sort.key);
                params.append('sortDirection', sort.direction);
            }

            // Apply Filters
            const card = filterOverride?.card ?? liveCardFilter;
            if (card && card !== 'all') params.append('cardId', card);

            const category = filterOverride?.category ?? liveCategoryFilter;
            if (category && category !== 'all') params.append('category', category);

            const method = filterOverride?.method ?? liveMethodFilter;
            if (method && method !== 'all') params.append('method', method);

            const res = await fetch(`${API_BASE_URL}/transactions/query?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch live transactions');

            const data = await res.json();

            setLiveTransactions(prev => isAppend ? [...prev, ...data.results] : data.results);
            setLiveCursor(data.nextCursor);
            setLiveHasMore(data.hasMore);
        } catch (error) {
            console.error("Error fetching live transactions:", error);
            toast.error("Failed to load transactions.");
        } finally {
            if (isAppend) {
                setIsLiveAppending(false);
            } else {
                setIsLiveLoading(false);
            }
        }
    }, [liveDateRange, liveSort, liveCardFilter, liveCategoryFilter, liveMethodFilter]);

    const handleLiveLoadMore = useCallback(() => {
        if (liveHasMore && liveCursor) {
            fetchLiveTransactions(liveCursor, liveSearchTerm, true);
        }
    }, [liveHasMore, liveCursor, liveSearchTerm, fetchLiveTransactions]);

    const handleLiveSearch = useCallback((term) => {
        setLiveSearchTerm(term);
        // Reset list and fetch new results
        fetchLiveTransactions(null, term, false);
    }, [fetchLiveTransactions]);

    const handleLiveDateRangeChange = useCallback((range) => {
        setLiveDateRange(range);
        // Reset list and fetch new results
        fetchLiveTransactions(null, liveSearchTerm, false, range);
    }, [fetchLiveTransactions, liveSearchTerm]);

    const handleLiveSortChange = useCallback((newSortConfig) => {
        setLiveSort(newSortConfig);
        // Reset list and fetch new results with new sort
        // Explicitly pass newSortConfig to avoid race conditions with state update
        setLiveTransactions([]);
        setLiveCursor(null);
        setLiveHasMore(false);
        fetchLiveTransactions(null, liveSearchTerm, false, null, newSortConfig);
    }, [fetchLiveTransactions, liveSearchTerm]);

    const handleLiveFilterChange = useCallback(({ type, value }) => {
        // Create an override object to pass to fetch
        const filterOverride = {};

        if (type === 'card') {
            setLiveCardFilter(value);
            filterOverride.card = value;
        } else if (type === 'category') {
            setLiveCategoryFilter(value);
            filterOverride.category = value;
        } else if (type === 'method') {
            setLiveMethodFilter(value);
            filterOverride.method = value;
        }

        // Reset and Fetch
        setLiveTransactions([]);
        setLiveCursor(null);
        setLiveHasMore(false);
        fetchLiveTransactions(null, liveSearchTerm, false, null, null, filterOverride);
    }, [fetchLiveTransactions, liveSearchTerm]);

    return {
        liveTransactions, setLiveTransactions,
        liveCursor, setLiveCursor,
        liveHasMore, setLiveHasMore,
        isLiveLoading, setIsLiveLoading,
        isLiveAppending, setIsLiveAppending,
        liveSearchTerm, setLiveSearchTerm,
        liveDateRange, setLiveDateRange,
        liveSort, setLiveSort,
        liveCardFilter, setLiveCardFilter,
        liveCategoryFilter, setLiveCategoryFilter,
        liveMethodFilter, setLiveMethodFilter,
        fetchLiveTransactions,
        handleLiveLoadMore,
        handleLiveSearch,
        handleLiveDateRangeChange,
        handleLiveSortChange,
        handleLiveFilterChange
    };
}
