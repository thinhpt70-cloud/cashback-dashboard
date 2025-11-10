import React from 'react';
import { Loader2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '../../ui/dialog';

export default function ViewTransactionsDialog({ isOpen, onClose, transactions, categoryName, currencyFn, isLoading }) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Transactions for {categoryName}</DialogTitle>
                    <DialogDescription>
                        Here are the transactions for the selected category.
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : transactions.length > 0 ? (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-2">Date</th>
                                    <th className="text-left p-2">Transaction</th>
                                    <th className="text-right p-2">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map(t => (
                                    <tr key={t.id} className="border-b">
                                        <td className="p-2">{t['Transaction Date']}</td>
                                        <td className="p-2">{t['Transaction Name']}</td>
                                        <td className="text-right p-2">{currencyFn(t['Amount'])}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="flex justify-center items-center h-48">
                            <p className="text-muted-foreground">No transactions found for this category.</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
