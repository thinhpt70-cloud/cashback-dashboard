import { useState, useCallback } from 'react';

export default function useSharedTransactionsDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    const openDialog = useCallback(async ({ title, description, fetchPromise }) => {
        setTitle(title || '');
        setDescription(description || '');
        setTransactions([]);
        setIsOpen(true);
        setIsLoading(true);

        try {
            const data = await fetchPromise;
            setTransactions(data);
        } catch (err) {
            console.error('Error fetching transactions for dialog:', err);
            // Optionally could set an error state here, but for now just clear list
            setTransactions([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const closeDialog = useCallback(() => {
        setIsOpen(false);
        setTransactions([]);
        setTitle('');
        setDescription('');
    }, []);

    const updateTransactions = useCallback((action, payload) => {
        setTransactions(prev => {
            if (action === 'update') {
                return prev.map(tx => tx.id === payload.id ? payload : tx);
            } else if (action === 'delete') {
                const idToDelete = payload;
                return prev.filter(tx => tx.id !== idToDelete);
            } else if (action === 'bulkDelete') {
                const idsSet = new Set(payload);
                return prev.filter(tx => !idsSet.has(tx.id));
            } else if (action === 'bulkUpdate') {
                const updatedIds = new Set(payload.map(t => t.id));
                return prev.map(tx => updatedIds.has(tx.id) ? payload.find(u => u.id === tx.id) : tx);
            }
            return prev;
        });
    }, []);

    return {
        isOpen,
        isLoading,
        transactions,
        title,
        description,
        openDialog,
        closeDialog,
        updateTransactions
    };
}
