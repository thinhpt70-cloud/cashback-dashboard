import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { getCurrentCashbackMonthForCard } from '../lib/date';

const API_BASE_URL = '/api';

export default function useCashbackData(isAuthenticated) {
    
    // --- STATE MANAGEMENT ---
    const [cards, setCards] = useState([]);
    const [rules, setRules] = useState([]);
    const [monthlySummary, setMonthlySummary] = useState([]);
    const [mccMap, setMccMap] = useState({});
    const [monthlyCategorySummary, setMonthlyCategorySummary] = useState([]);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [commonVendors, setCommonVendors] = useState([]);
    const [reviewTransactions, setReviewTransactions] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- DATA FETCHING ---
    const fetchData = useCallback(async (isSilent = false) => {
        if (!isSilent) {
            setLoading(true);
        }
        setError(null);
        try {
            // This array now includes the new '/api/monthly-category-summary' endpoint
            const [
                cardsRes, 
                rulesRes, 
                monthlyRes, 
                mccRes, 
                monthlyCatRes,
                recentTxRes,
                categoriesRes,
                commonVendorsRes,
                reviewTxRes
            ] = await Promise.all([
                fetch(`${API_BASE_URL}/cards`),
                fetch(`${API_BASE_URL}/rules`),
                fetch(`${API_BASE_URL}/monthly-summary`),
                fetch(`${API_BASE_URL}/mcc-codes`),
                fetch(`${API_BASE_URL}/monthly-category-summary`), // Fetches data for the optimized overview
                fetch(`${API_BASE_URL}/recent-transactions`),
                fetch(`${API_BASE_URL}/categories`),
                fetch(`${API_BASE_URL}/common-vendors`),
                fetch(`${API_BASE_URL}/transactions/needs-review`) // New endpoint for transactions needing review
            ]);

            // Check if all network responses are successful
            if (!cardsRes.ok || !rulesRes.ok || !monthlyRes.ok || !mccRes.ok || !monthlyCatRes.ok || !recentTxRes.ok || !categoriesRes.ok || !commonVendorsRes.ok || !reviewTxRes.ok) {
                throw new Error('A network response was not ok. Please check the server.');
            }

            // Parse all JSON data from the responses
            const cardsData = await cardsRes.json();
            const rulesData = await rulesRes.json();
            const monthlyData = await monthlyRes.json();
            const mccData = await mccRes.json();
            const monthlyCatData = await monthlyCatRes.json();
            const recentTxData = await recentTxRes.json(); 
            const categoriesData = await categoriesRes.json(); 
            const commonVendorsData = await commonVendorsRes.json();
            const reviewTxData = await reviewTxRes.json(); // New data for transactions needing review

            // Set all the state variables for the application
            setCards(cardsData);
            setRules(rulesData);
            setMonthlySummary(monthlyData);
            setMccMap(mccData.mccDescriptionMap || {});
            setMonthlyCategorySummary(monthlyCatData); // Set the new state for the overview tab
            setRecentTransactions(recentTxData); // Set the new state
            setAllCategories(categoriesData); // Set the new state for all categories
            setCommonVendors(commonVendorsData);
            setReviewTransactions(reviewTxData); // Set the new state for review transactions

        } catch (err) {
            setError("Failed to fetch data. Please check the backend, .env configuration, and Notion permissions.");
            console.error(err);
            if (isSilent) { // Only show toast on background refresh fails
                toast.error("Failed to refresh data in the background.");
            }
        } finally {
            if (!isSilent) {
                setLoading(false);
            }
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
        }
    }, [isAuthenticated, fetchData]); // It runs when auth status changes.

    const liveSummary = useMemo(() => {
        // Wait until monthlySummary is loaded
        if (!monthlySummary || monthlySummary.length === 0) {
        return { liveSpend: 0, liveCashback: 0 };
        }

        // Get the current month in 'YYYYMM' format
        const currentMonth = getCurrentCashbackMonthForCard();
        
        // --- FIX: Sum totals for ALL cards using the correct properties ---
        let totalSpend = 0;
        let totalCashback = 0;

        monthlySummary.forEach(summary => {
            if (summary.month === currentMonth) {
                // USE 'spend' and 'cashback', NOT 'totalSpend' and 'totalCashback'
                totalSpend += summary.spend || 0;
                totalCashback += summary.cashback || 0;
            }
        });

        // Return the data in the format CashbackDashboard expects
        return {
            liveSpend: totalSpend,
            liveCashback: totalCashback,
        };
    }, [monthlySummary]); // This recalculates only when monthlySummary changes

    // --- Return everything the component needs ---
    return {
        // Data states
        cards,
        rules,
        monthlySummary,
        liveSummary,
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
        loading,
        error,
        
        // Action
        refreshData: fetchData, // Provide the fetch function under a clearer name
    };
}