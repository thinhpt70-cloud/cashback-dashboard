import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { getCurrentCashbackMonthForCard } from '../lib/date';

export default function useTransactionSync(cards, monthlySummary, monthlyCategorySummary, onTransactionSynced) {
    const [queue, setQueue] = useState([]);
    const [isSyncing, setIsSyncing] = useState(false);
    
    // Use refs to access latest data inside the async loop without adding them to dependency array
    // which would restart the effect loop constantly.
    const cardsRef = useRef(cards);
    const monthlySummaryRef = useRef(monthlySummary);
    
    useEffect(() => {
        cardsRef.current = cards;
    }, [cards]);

    useEffect(() => {
        monthlySummaryRef.current = monthlySummary;
    }, [monthlySummary]);

    // Load from local storage on mount
    useEffect(() => {
        const storedQueue = localStorage.getItem('needsSyncing');
        if (storedQueue) {
            try {
                setQueue(JSON.parse(storedQueue));
            } catch (e) {
                console.error("Failed to parse sync queue", e);
            }
        }
    }, []);

    // Save to local storage whenever queue changes
    useEffect(() => {
        localStorage.setItem('needsSyncing', JSON.stringify(queue));
    }, [queue]);

    const addToQueue = useCallback((transaction) => {
        setQueue(prev => [...prev, transaction]);
    }, []);

    const retryTransaction = useCallback((id) => {
        setQueue(prev => prev.map(tx => tx.id === id ? { ...tx, status: 'pending' } : tx));
    }, []);

    const removeTransaction = useCallback((id) => {
        setQueue(prev => prev.filter(tx => tx.id !== id));
    }, []);

    // Processing Loop
    useEffect(() => {
        const processQueue = async () => {
            if (isSyncing) return;
            
            // Find the first pending item
            const pendingTx = queue.find(tx => tx.status === 'pending');
            if (!pendingTx) return;

            setIsSyncing(true);
            
            try {
                // --- Summary Logic (recreated from Dashboard) ---
                let finalSummaryId = null;
                const cardId = pendingTx['Card'] ? pendingTx['Card'][0] : null;
                const ruleId = pendingTx['Applicable Rule'] ? pendingTx['Applicable Rule'][0] : null;
                
                // Use refs for current data
                const currentCards = cardsRef.current;
                const currentSummaries = monthlySummaryRef.current;
                
                const cardForTx = cardId ? currentCards.find(c => c.id === cardId) : null;

                if (ruleId && cardForTx) {
                    const cbMonth = getCurrentCashbackMonthForCard(cardForTx, pendingTx['Transaction Date']);
                    
                    // Check if summary already exists in our local data to avoid unnecessary API call?
                    // The original code always calls API to 'ensure' it exists. We'll stick to that for safety.
                    // But we can check if we already have it in currentSummaries to maybe skip?
                    // For now, keep original logic: call /api/summaries
                    
                    const summaryResponse = await fetch('/api/summaries', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            cardId: cardId,
                            month: cbMonth,
                            ruleId: ruleId
                        }),
                    });
                    
                    if (!summaryResponse.ok) throw new Error('Failed to create/fetch monthly summary.');
                    const newSummary = await summaryResponse.json();
                    finalSummaryId = newSummary.id;
                }

                // --- Payload Construction ---
                const apiPayload = {
                    merchant: pendingTx['Transaction Name'],
                    amount: pendingTx['Amount'],
                    date: pendingTx['Transaction Date'],
                    cardId: cardId,
                    category: pendingTx['Category'],
                    mccCode: pendingTx['MCC Code'],
                    merchantLookup: pendingTx['merchantLookup'],
                    applicableRuleId: ruleId,
                    cardSummaryCategoryId: finalSummaryId || pendingTx['Card Summary Category']?.[0], // Fallback if summary logic didn't run
                    notes: pendingTx['notes'],
                    otherDiscounts: pendingTx['otherDiscounts'],
                    otherFees: pendingTx['otherFees'],
                    foreignCurrencyAmount: pendingTx['foreignCurrencyAmount'],
                    exchangeRate: pendingTx['exchangeRate'],
                    foreignCurrency: pendingTx['foreignCurrency'],
                    conversionFee: pendingTx['conversionFee'],
                    paidFor: pendingTx['paidFor'],
                    subCategory: pendingTx['subCategory'],
                    billingDate: pendingTx['billingDate'],
                    method: pendingTx['Method'],
                };

                const isNewTransaction = pendingTx.id.includes('T') && pendingTx.id.includes('Z'); // Simple check for temp ID

                let response;
                if (isNewTransaction) {
                    response = await fetch('/api/transactions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(apiPayload),
                    });
                } else {
                    response = await fetch(`/api/transactions/${pendingTx.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(apiPayload),
                    });
                }

                if (!response.ok) {
                    const errorBody = await response.json().catch(() => ({}));
                    throw new Error(errorBody.error || 'Server rejected transaction');
                }

                const syncedTransaction = await response.json();

                // Success! Remove from queue
                setQueue(prev => prev.filter(t => t.id !== pendingTx.id));
                
                // Notify parent
                if (onTransactionSynced) {
                    onTransactionSynced(syncedTransaction);
                }

            } catch (error) {
                console.error("Sync failed for tx:", pendingTx['Transaction Name'], error);
                // Mark as error
                setQueue(prev => prev.map(t => t.id === pendingTx.id ? { ...t, status: 'error', errorMessage: error.message } : t));
                toast.error(`Sync failed for "${pendingTx['Transaction Name']}"`);
            } finally {
                setIsSyncing(false);
            }
        };

        if (queue.length > 0 && !isSyncing) {
            processQueue();
        }
    }, [queue, isSyncing, onTransactionSynced]); // Logic depends on queue state

    return {
        queue,
        isSyncing,
        addToQueue,
        retryTransaction,
        removeTransaction
    };
}
