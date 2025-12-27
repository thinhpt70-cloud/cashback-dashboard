import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';

export default function StatementLogDialog({ isOpen, onClose, statement, onSave, currencyFn, fmtYMShortFn }) {
    const [amount, setAmount] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen && statement) {
            // Pre-fill with the existing statement amount if it's greater than 0,
            // otherwise, use the estimated balance as a suggestion.
            const estimatedBalance = (statement.spend || 0) - (statement.cashback || 0);
            const currentAmount = statement.statementAmount > 0 ? statement.statementAmount : estimatedBalance;
            
            setAmount(currentAmount > 0 ? currentAmount.toLocaleString('en-US') : '');

            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 150);

            return () => clearTimeout(timer);
        }
    }, [isOpen, statement]);

    const handleAmountChange = (e) => {
        const value = e.target.value.replace(/,/g, '');
        if (!isNaN(value) && value.length <= 15) {
            setAmount(value ? Number(value).toLocaleString('en-US') : '');
        } else if (value === '') {
            setAmount('');
        }
    };

    const handleSave = () => {
        const numericAmount = parseFloat(String(amount).replace(/,/g, ''));
        if (isNaN(numericAmount)) return;

        onSave(statement.id, numericAmount);
        onClose();
    };

    if (!statement) return null;

    const estimatedBalance = (statement.spend || 0) - (statement.cashback || 0);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Log Official Statement Amount</DialogTitle>
                    <DialogDescription>For {statement.card.name} - {fmtYMShortFn(statement.month)}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="text-sm">
                        <p>Estimated Balance: <span className="font-medium">{currencyFn(estimatedBalance)}</span></p>
                        <p>Current Statement Amount: <span className="font-medium text-blue-600">{currencyFn(statement.statementAmount)}</span></p>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="statement-amount" className="text-sm font-medium">Official Statement Amount</label>
                        <Input
                            ref={inputRef}
                            id="statement-amount"
                            type="text"
                            inputMode="numeric"
                            value={amount}
                            onChange={handleAmountChange}
                            placeholder="Enter official amount from bank"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save Amount</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}