import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import ReviewControls from './ReviewControls';
import TransactionTable from './TransactionTable';
import TransactionCard from './TransactionCard';
import BulkActionBar from './BulkActionBar';
import BulkEditModal from './BulkEditModal';

/**
 * A component that displays a list of automated transactions that require user review.
 * It provides bulk actions, sorting, filtering, and inline editing capabilities.
 *
 * @param {object[]} transactions - Array of transaction objects needing review.
 * @param {function} onReview - Callback function to open the full edit form for a transaction.
 * @param {function} onApprove - Callback function invoked after a transaction is successfully quick-approved.
 * @param {function} currencyFn - A function to format numbers as currency.
 * @param {Map} cardMap - Map of card IDs to card objects.
 * @param {Map} rulesMap - Map of rule IDs to rule objects.
 * @param {object} mccMap - Object mapping MCC codes to descriptions.
 * @param {Map} summaryMap - Map of summary IDs to summary objects.
 * @param {function} onDelete - Callback function for deleting a transaction.
 * @param {function} onBulkDelete - Callback function for bulk deleting transactions.
 * @param {function} onInlineEdit - Callback function for handling inline edits.
 * @param {function} onBulkEdit - Callback function for handling bulk edits.
 */
export default function TransactionReviewCenter({
    transactions,
    onReview,
    onApprove,
    currencyFn,
    cardMap,
    rulesMap,
    mccMap,
    summaryMap,
    onDelete,
    onBulkDelete,
    onInlineEdit,
    onBulkEdit
}) {
    const [selected, setSelected] = useState([]);
    const [sort, setSort] = useState({ key: 'Transaction Date', order: 'desc' });
    const [filter, setFilter] = useState('');
    const [group, setGroup] = useState(null);
    const [isBulkEditOpen, setBulkEditOpen] = useState(false);

    const displayedTransactions = useMemo(() => {
        let filtered = transactions.filter(tx => tx['Transaction Name'].toLowerCase().includes(filter.toLowerCase()));

        filtered.sort((a, b) => {
            if (sort.order === 'asc') {
                return a[sort.key] > b[sort.key] ? 1 : -1;
            }
            return a[sort.key] < b[sort.key] ? 1 : -1;
        });
        
        if (group && group !== 'None') {
            const grouped = filtered.reduce((acc, tx) => {
                const key = tx[group] ? (Array.isArray(tx[group]) ? tx[group][0] : tx[group]) : 'Uncategorized';
                if (!acc[key]) {
                    acc[key] = [];
                }
                acc[key].push(tx);
                return acc;
            }, {});
            return grouped;
        }
        
        return filtered;
    }, [transactions, sort, filter, group]);

    if (!transactions || transactions.length === 0) {
        return (
            <div className="text-center py-4">
                <p className="text-muted-foreground">No transactions to review.</p>
            </div>
        );
    }
    
    const handleSelect = (id, isSelected) => {
        setSelected(prev => isSelected ? [...prev, id] : prev.filter(txId => txId !== id));
    };

    const handleSelectAll = (isSelected) => {
        setSelected(isSelected ? displayedTransactions.map(tx => tx.id) : []);
    };
    
    const handleApproveClick = async (tx) => {
        const newName = tx.merchantLookup || tx['Transaction Name'].substring(6);
        
        try {
            const response = await fetch(`/api/transactions/${tx.id}/approve`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newName: newName }),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Server responded with an error.');
            }
            
            const updatedTransaction = await response.json();
            onApprove(updatedTransaction); // Call parent handler to update UI state
            toast.success(`'${newName}' has been approved.`);
            
        } catch (error)
        {
            console.error('Quick Approve failed:', error);
            toast.error(`Could not approve transaction: ${error.message}`);
        }
    };

    const handleBulkApprove = async () => {
        try {
            const response = await fetch('/api/transactions/bulk-approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selected }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Server responded with an error.');
            }

            const updatedTransactions = await response.json();
            updatedTransactions.forEach(tx => onApprove(tx));
            toast.success(`${selected.length} transactions have been approved.`);
            setSelected([]);
        } catch (error) {
            console.error('Bulk Approve failed:', error);
            toast.error(`Could not approve transactions: ${error.message}`);
        }
    };
    
    const handleBulkEdit = async (field, value) => {
        try {
            const response = await fetch('/api/transactions/bulk-edit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selected, field, value }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Server responded with an error.');
            }

            const updatedTransactions = await response.json();
            updatedTransactions.forEach(tx => onApprove(tx));
            toast.success(`${selected.length} transactions have been updated.`);
            setSelected([]);
        } catch (error) {
            console.error('Bulk Edit failed:', error);
            toast.error(`Could not edit transactions: ${error.message}`);
        }
    };

    return (
        <>
            <BulkEditModal 
                isOpen={isBulkEditOpen}
                onClose={() => setBulkEditOpen(false)}
                onBulkEdit={handleBulkEdit}
            />
            <Card className="shadow-none border-none">
                <ReviewControls 
                    sort={sort}
                setSort={setSort}
                filter={filter}
                setFilter={setFilter}
                group={group}
                setGroup={setGroup}
            />
            <CardContent className="p-0">
                {group && group !== 'None' ? (
                    Object.entries(displayedTransactions).map(([groupKey, groupTransactions]) => (
                        <div key={groupKey} className="mb-8">
                            <h3 className="text-lg font-semibold p-4 bg-slate-50 dark:bg-slate-800 border-b border-t">{cardMap.get(groupKey)?.name || mccMap[groupKey]?.vn || groupKey}</h3>
                            <TransactionTable 
                                transactions={groupTransactions} 
                                selected={selected}
                                onSelect={handleSelect}
                                onSelectAll={(isSelected) => handleSelectAll(isSelected, groupTransactions)}
                                currencyFn={currencyFn}
                                cardMap={cardMap}
                                rulesMap={rulesMap}
                                mccMap={mccMap}
                                summaryMap={summaryMap}
                                onReview={onReview}
                                onApprove={handleApproveClick}
                                onDelete={onDelete}
                                onInlineEdit={onInlineEdit}
                            />
                             <div className="md:hidden space-y-2 p-4">
                                {groupTransactions.map(tx => (
                                    <TransactionCard 
                                        key={tx.id}
                                        transaction={tx}
                                        selected={selected.includes(tx.id)}
                                        onSelect={handleSelect}
                                        currencyFn={currencyFn}
                                        cardMap={cardMap}
                                        rulesMap={rulesMap}
                                        mccMap={mccMap}
                                        summaryMap={summaryMap}
                                        onReview={onReview}
                                        onApprove={handleApproveClick}
                                        onDelete={onDelete}
                                        onInlineEdit={onInlineEdit}
                                    />
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <>
                        <TransactionTable 
                            transactions={displayedTransactions} 
                            selected={selected}
                            onSelect={handleSelect}
                            onSelectAll={handleSelectAll}
                            currencyFn={currencyFn}
                            cardMap={cardMap}
                            rulesMap={rulesMap}
                            mccMap={mccMap}
                            summaryMap={summaryMap}
                            onReview={onReview}
                            onApprove={handleApproveClick}
                            onDelete={onDelete}
                            onInlineEdit={onInlineEdit}
                        />
                        <div className="md:hidden space-y-2 p-4">
                            {displayedTransactions.map(tx => (
                                <TransactionCard 
                                    key={tx.id}
                                    transaction={tx}
                                    selected={selected.includes(tx.id)}
                                    onSelect={handleSelect}
                                    currencyFn={currencyFn}
                                    cardMap={cardMap}
                                    rulesMap={rulesMap}
                                    mccMap={mccMap}
                                    summaryMap={summaryMap}
                                    onReview={onReview}
                                    onApprove={handleApproveClick}
                                    onDelete={onDelete}
                                    onInlineEdit={onInlineEdit}
                                />
                            ))}
                        </div>
                    </>
                )}
            </CardContent>
            <BulkActionBar
                selectedCount={selected.length}
                onBulkApprove={handleBulkApprove}
                onBulkDelete={() => onBulkDelete(selected)}
                onBulkEdit={() => setBulkEditOpen(true)}
            />
        </Card>
        </>
    );
}