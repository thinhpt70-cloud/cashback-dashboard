import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { getCurrentCashbackMonthForCard } from '../lib/date';

export default function useTransactionSync({ cards, monthlySummary, monthlyCategorySummary, onSyncSuccess }) {
    const [queue, setQueue] = useState([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isSheetOpen, setSheetOpen] = useState(false);

    // Load queue from localStorage on mount
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

    // Save queue to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('needsSyncing', JSON.stringify(queue));
    }, [queue]);

    // Background Sync Loop
    useEffect(() => {
        const syncTransactions = async () => {
            setIsSyncing(true);

            try {
                // Iterate through a copy of the queue to avoid issues if state changes mid-loop
                // However, we only process one at a time and rely on the latest state for the next iteration?
                // Actually, the loop iterates over the `queue` captured in closure.
                // We should re-check status inside loop if we were doing parallel, but here serial is fine.
                
                // We only want to process pending items.
                const pendingItems = queue.filter(t => t.status === 'pending');

                for (const transaction of pendingItems) {
                    try {
                        let finalSummaryId = null;

                        // --- Summary Logic ---
                        const cardId = transaction['Card'] ? transaction['Card'][0] : null;
                        const ruleId = transaction['Applicable Rule'] ? transaction['Applicable Rule'][0] : null;
                        const cardForTx = cardId ? cards.find(c => c.id === cardId) : null;

                        if (ruleId && cardForTx) {
                            const cbMonth = getCurrentCashbackMonthForCard(cardForTx, transaction['Transaction Date']);

                            // Check if we need to create a summary.
                            // Note: ideally we should check if it already exists in `monthlySummary` prop to avoid API call,
                            // but the logic in Dashboard was to always call /api/summaries which presumably handles "get or create".
                            // For safety/consistency with existing logic, we keep the API call.
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

                        // --- API Payload Construction ---
                        const apiPayload = {
                            merchant: transaction['Transaction Name'],
                            amount: transaction['Amount'],
                            date: transaction['Transaction Date'],
                            cardId: cardId,
                            category: transaction['Category'],
                            mccCode: transaction['MCC Code'],
                            merchantLookup: transaction['merchantLookup'],
                            applicableRuleId: ruleId,
                            cardSummaryCategoryId: finalSummaryId,
                            notes: transaction['notes'],
                            otherDiscounts: transaction['otherDiscounts'],
                            otherFees: transaction['otherFees'],
                            foreignCurrencyAmount: transaction['foreignCurrencyAmount'],
                            exchangeRate: transaction['exchangeRate'],
                            foreignCurrency: transaction['foreignCurrency'],
                            conversionFee: transaction['conversionFee'],
                            paidFor: transaction['paidFor'],
                            subCategory: transaction['subCategory'],
                            billingDate: transaction['billingDate'],
                            method: transaction['Method'],
                        };

                        const isNewTransaction = transaction.id.toString().includes('T') && transaction.id.toString().includes('Z'); // Simple check for temp ID

                        let response;
                        if (isNewTransaction) {
                            response = await fetch('/api/transactions', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(apiPayload),
                            });
                        } else {
                            response = await fetch(`/api/transactions/${transaction.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(apiPayload),
                            });
                        }

                        if (!response.ok) {
                            const errorBody = await response.json().catch(() => ({}));
                            throw new Error(errorBody.error || 'Server Error');
                        }

                        const syncedTransaction = await response.json();

                        // Success! Remove from queue.
                        setQueue(prevQueue => prevQueue.filter(t => t.id !== transaction.id));

                        // Trigger success callback (updates UI)
                        if (onSyncSuccess) {
                            onSyncSuccess(syncedTransaction, transaction.id);
                        }

                        toast.success(`Synced "${syncedTransaction['Transaction Name'] || 'Transaction'}"`);

                    } catch (error) {
                        console.error('Error syncing transaction:', error);
                        // Mark as error in queue
                        setQueue(prevQueue =>
                            prevQueue.map(t => t.id === transaction.id ? { ...t, status: 'error', errorMessage: error.message } : t)
                        );
                    }
                }
            } finally {
                setIsSyncing(false);
            }
        };

        // Trigger sync if there are pending items and we aren't already syncing
        if (queue.some(t => t.status === 'pending') && !isSyncing) {
            syncTransactions();
        }
    }, [queue, isSyncing, cards, monthlySummary, onSyncSuccess]);


    const addToQueue = useCallback((transaction) => {
        const item = { ...transaction, status: 'pending' };
        setQueue(prev => [...prev, item]);

        // Optionally open the sheet if user wants visibility, but usually we keep it background unless error.
        // User requested "sleek SyncQueueSheet", usually background sync is invisible unless error.
        // We won't auto-open.
    }, []);

    const retry = useCallback((id) => {
        setQueue(prev => prev.map(t => t.id === id ? { ...t, status: 'pending' } : t));
    }, []);

    const remove = useCallback((id) => {
        setQueue(prev => prev.filter(t => t.id !== id));
    }, []);

    return {
        queue,
        addToQueue,
        retry,
        remove,
        isSyncing,
        isSheetOpen,
        setSheetOpen
    };
}
