import React, { useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '../../ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../ui/table';
import { Skeleton } from '../../ui/skeleton';

export default function TransactionDetailsDialog({ isOpen, onClose, details, transactions, isLoading, currencyFn }) {
    // Calculates the totals for cashback and amount only when transactions change
    const totals = useMemo(() => {
        return transactions.reduce((acc, tx) => {
            acc.totalCashback += tx.estCashback || 0;
            acc.totalAmount += tx['Amount'] || 0;
            return acc;
        }, { totalCashback: 0, totalAmount: 0 });
    }, [transactions]);

    // Sort transactions from oldest to newest before rendering
    const sortedTransactions = useMemo(() => {
        // Create a shallow copy to avoid mutating the original prop array
        return [...transactions].sort((a, b) => 
            new Date(a['Transaction Date']) - new Date(b['Transaction Date'])
        );
    }, [transactions]);


    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl w-full max-w-md bg-white">
            <DialogHeader>
            <DialogTitle>
                Transactions for {details.cardName}
            </DialogTitle>
            <DialogDescription>
                Statement Month: {details.monthLabel}
            </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto pr-4">
                {isLoading ? (                    
                    <div className="space-y-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                    <Skeleton className="h-5 w-24" />
                                </div>
                            ))}
                    </div>
                ) : transactions.length > 0 ? (
                    <>
                        {/* --- Mobile View --- */}
                        {/* This view is hidden on screens 'sm' and larger */}
                        <div className="space-y-3 sm:hidden">
                            {sortedTransactions.map(tx => (
                                <div key={tx.id} className="p-3 border rounded-lg">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex-1">
                                            <p className="font-semibold break-words">{tx['Transaction Name']}</p>
                                            <p className="text-xs text-muted-foreground">{tx['Transaction Date']}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="font-medium">{currencyFn(tx['Amount'])}</p>
                                            <p className="text-sm font-medium text-emerald-600">{currencyFn(tx.estCashback)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {/* Mobile Totals Footer */}
                            <div className="pt-3 mt-3 border-t font-medium">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Total Amount:</span>
                                    <span>{currencyFn(totals.totalAmount)}</span>
                                </div>
                                <div className="flex justify-between items-center text-emerald-600">
                                    <span className="text-muted-foreground">Total Cashback:</span>
                                    <span>{currencyFn(totals.totalCashback)}</span>
                                </div>
                            </div>
                        </div>

                        {/* --- Desktop View (Existing Table) --- */}
                        {/* This table is hidden by default and shown on screens 'sm' and larger */}
                        <Table className="hidden sm:table">
                            <TableHeader>
                                <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Transaction</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Cashback</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedTransactions.map(tx => (
                                <TableRow key={tx.id}>
                                    <TableCell>{tx['Transaction Date']}</TableCell>
                                    <TableCell className="font-medium">{tx['Transaction Name']}</TableCell>
                                    <TableCell className="text-right">{currencyFn(tx['Amount'])}</TableCell>
                                    <TableCell className="text-right text-emerald-600 font-medium">{currencyFn(tx.estCashback)}</TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                            <tfoot className="border-t-2 font-semibold">
                                <TableRow>
                                    <TableCell colSpan={2}>Totals</TableCell>
                                    <TableCell className="text-right">{currencyFn(totals.totalAmount)}</TableCell>
                                    <TableCell className="text-right text-emerald-600">
                                        {currencyFn(totals.totalCashback)}
                                    </TableCell>
                                </TableRow>
                            </tfoot>
                        </Table>
                    </>
                ) : (
                    <div className="flex justify-center items-center h-48 text-muted-foreground">
                    <p>No transactions found for this period.</p>
                    </div>
                )}
            </div>
        </DialogContent>
        </Dialog>
    );
}