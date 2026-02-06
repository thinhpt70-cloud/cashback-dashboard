import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { getCurrentCashbackMonthForCard, getTodaysMonth, getPastNMonths } from '../lib/date'; // This import now gets the correct function

const API_BASE_URL = '/api';

export default function useCashbackData(isAuthenticated) {
    
    // --- STATE MANAGEMENT ---
    const [allCards, setAllCards] = useState([]); // NEW: Stores ALL cards, including Closed
    const [cards, setCards] = useState([]); // Stores only Active/Frozen cards (filtered)
    const [rules, setRules] = useState([]);
    const [monthlySummary, setMonthlySummary] = useState([]);
    const [mccMap, setMccMap] = useState({});
    const [monthlyCategorySummary, setMonthlyCategorySummary] = useState([]);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [commonVendors, setCommonVendors] = useState([]);
    const [reviewTransactions, setReviewTransactions] = useState([]);
    const [reviewLoading, setReviewLoading] = useState(false); // Separate loading state
    const [definitions, setDefinitions] = useState({ categories: [], methods: [], paidFor: [], foreignCurrencies: [], subCategories: [] });

    // --- NEW LOADING STATES ---
    const [isShellReady, setIsShellReady] = useState(false); // Critical data for UI shell
    const [isDashboardLoading, setIsDashboardLoading] = useState(true); // Data for dashboard content

    // Kept for backwards compatibility if needed, or mapped to !isShellReady
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- DATA FETCHING ---
    const fetchData = useCallback(async (isSilent = false, skipStatic = false) => {
        let hasShellLoaded = false; // Local variable to track shell loading status

        if (!isSilent) {
            setLoading(true);
            setIsDashboardLoading(true);
            setIsShellReady(false);
        }
        setError(null);

        try {
            // --- STAGE 1: CRITICAL SHELL DATA ---
            // Fetch minimal data required to render the Sidebar, Header, and basic actions (Add Tx, Finder)
            if (!skipStatic) {
                const [cardsRes, rulesRes, mccRes, definitionsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/cards?includeClosed=true`),
                    fetch(`${API_BASE_URL}/rules`),
                    fetch(`${API_BASE_URL}/mcc-codes`),
                    fetch(`${API_BASE_URL}/definitions`),
                ]);

                if (!cardsRes.ok || !rulesRes.ok || !mccRes.ok || !definitionsRes.ok) {
                    throw new Error('Failed to fetch critical shell data.');
                }

                const cardsData = await cardsRes.json();
                const rulesData = await rulesRes.json();
                const mccData = await mccRes.json();
                const definitionsData = await definitionsRes.json();

                setAllCards(cardsData);
                setCards(cardsData.filter(c => c.status !== 'Closed'));
                setRules(rulesData);
                setMccMap(mccData.mccDescriptionMap || {});
                setDefinitions(definitionsData);
                setAllCategories(definitionsData.categories || []);

                // Shell is ready! The UI can render now.
                hasShellLoaded = true;
                if (!isSilent) {
                    setIsShellReady(true);
                    setLoading(false); // Dismiss full-screen skeleton
                }
            } else {
                // If skipping static, we assume shell is already loaded or we don't block
                hasShellLoaded = true;
            }

            // --- STAGE 2: DASHBOARD CONTENT ---
            // Fetch data needed for Overview charts, StatCards, and Activity Feed
            const currentMonth = getTodaysMonth();
            const pastMonths = getPastNMonths(currentMonth, 3);
            const monthsToFetch = [...new Set([...pastMonths, currentMonth])].join(',');

            // MOVED: monthly-category-summary is now fetched here to prevent empty state flash in widgets
            const [monthlyRes, recentTxRes, monthlyCatRes] = await Promise.all([
                fetch(`${API_BASE_URL}/monthly-summary`),
                fetch(`${API_BASE_URL}/recent-transactions`),
                fetch(`${API_BASE_URL}/monthly-category-summary?months=${monthsToFetch}`),
            ]);

             if (!monthlyRes.ok || !recentTxRes.ok || !monthlyCatRes.ok) {
                throw new Error('Failed to fetch dashboard content.');
            }

            const monthlyData = await monthlyRes.json();
            const recentTxData = await recentTxRes.json();
            const monthlyCatData = await monthlyCatRes.json();

            setMonthlySummary(monthlyData);
            setRecentTransactions(recentTxData);
            setMonthlyCategorySummary(monthlyCatData);

            if (!isSilent) {
                setIsDashboardLoading(false); // Dashboard widgets can now replace skeletons
            }

            // --- STAGE 3: BACKGROUND DATA ---
            // Fetch heavy or secondary data that isn't immediately critical
            const [commonVendorsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/common-vendors`),
            ]);

            if (commonVendorsRes.ok) {
                const commonVendorsData = await commonVendorsRes.json();
                setCommonVendors(commonVendorsData);
            }

        } catch (err) {
            setError("Failed to fetch data. Please check the backend.");
            console.error(err);
            if (isSilent) {
                toast.error("Failed to refresh data.");
            }
            // Even if Stage 2/3 fails, ensure we unblock the UI if Stage 1 succeeded (using local variable)
            if (hasShellLoaded) {
                 setIsShellReady(true);
                 setLoading(false);
                 setIsDashboardLoading(false);
            }
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // New dedicated function to lazy load category summaries for a specific month
    const fetchCategorySummaryForMonth = useCallback(async (month) => {
        try {
            const res = await fetch(`${API_BASE_URL}/monthly-category-summary?months=${month}`);
            if (!res.ok) throw new Error('Failed to fetch category summary');
            const newData = await res.json();

            setMonthlyCategorySummary(prevData => {
                // Create a Map of existing items by ID to avoid duplicates
                const existingMap = new Map(prevData.map(item => [item.id, item]));

                // Add new items to the map
                newData.forEach(item => {
                    existingMap.set(item.id, item);
                });

                return Array.from(existingMap.values());
            });
        } catch (err) {
            console.error(`Failed to fetch category summary for ${month}:`, err);
            toast.error("Could not load category summary data.");
        }
    }, []);

    // New dedicated function for lazy-loading review transactions
    const fetchReviewTransactions = useCallback(async () => {
        setReviewLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/transactions/needs-review`);
            if (!res.ok) throw new Error('Failed to fetch review transactions');
            const data = await res.json();
            setReviewTransactions(data);
        } catch (err) {
            console.error("Failed to fetch review transactions:", err);
            toast.error("Could not load transactions for review.");
        } finally {
            setReviewLoading(false);
        }
    }, []);

    // --- This effect triggers the initial data fetch ---
    useEffect(() => {
        // Only fetch data if the user is authenticated.
        if (isAuthenticated) {
            fetchData();
        } else {
            // If the user logs out, we can clear the data and set loading to false.
            setLoading(false);
            setIsShellReady(false);
        }
    }, [isAuthenticated, fetchData]); // It runs when auth status changes.

    const liveSummary = useMemo(() => {
        // Wait until both cards and summary data are loaded
        if (!monthlySummary || monthlySummary.length === 0 || !cards || cards.length === 0) {
            return { liveSpend: 0, liveCashback: 0 };
        }

        // --- NEW "STATEMENT CYCLE" LOGIC ---
        
        // Create a fast lookup map for summaries
        const summaryMap = new Map();
        monthlySummary.forEach(s => {
            const key = `${s.cardId}-${s.month}`;
            summaryMap.set(key, s);
        });

        let totalSpend = 0;
        let totalCashback = 0;

        // Iterate over each card to find its current statement cycle
        cards.forEach(card => {
            // 1. Get the card's specific in-progress month (e.g., "202410" or "202411")
            const currentMonthForCard = getCurrentCashbackMonthForCard(card);

            // 2. Find the summary for that specific card and that specific month
            const summary = summaryMap.get(`${card.id}-${currentMonthForCard}`);

            // 3. Add its spend and cashback to the totals
            if (summary) {
                totalSpend += summary.spend || 0;
                totalCashback += summary.cashback || 0;
            }
        });

        return {
            liveSpend: totalSpend,
            liveCashback: totalCashback,
        };
        // Add `cards` to the dependency array
    }, [monthlySummary, cards]); 

    // --- Return everything the component needs ---
    return {
        // Data states
        cards,    // Filtered (Active/Frozen)
        allCards, // Complete list (including Closed)
        rules,
        monthlySummary,
        liveSummary, // This is now calculated with the new logic
        mccMap,
        monthlyCategorySummary,
        recentTransactions,
        allCategories,
        commonVendors,
        reviewTransactions,
        
        // Derived data, calculated on demand and memoized for performance
        cashbackRules: useMemo(() => rules.map(r => ({ ...r, name: r.ruleName })), [rules]),
        monthlyCashbackCategories: useMemo(() => monthlyCategorySummary.map(c => ({ ...c, name: c.summaryId })), [monthlyCategorySummary]),
        
        // State setters for optimistic UI updates
        setRecentTransactions,
        setReviewTransactions,
        
        // Status states
        loading, // Kept for backward compatibility, same as !isShellReady
        isShellReady, // NEW: Use this to unblock the main UI
        isDashboardLoading, // NEW: Use this for widget loading skeletons
        error,
        reviewLoading,
        
        // Action
        refreshData: fetchData, // Provide the fetch function under a clearer name
        fetchReviewTransactions,
        fetchCategorySummaryForMonth, // Expose the new function
        definitions,
    };
}