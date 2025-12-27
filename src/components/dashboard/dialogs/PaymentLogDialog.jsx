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

export default function PaymentLogDialog({ isOpen, onClose, statement, onSave, currencyFn, fmtYMShortFn }) {
    const [amount, setAmount] = useState('');
    const inputRef = useRef(null);
    
    useEffect(() => {
        if (isOpen) {
            // Pre-fill with remaining amount and format it with commas
            const remaining = (statement.statementAmount || 0) - (statement.paidAmount || 0);
            setAmount(remaining > 0 ? remaining.toLocaleString('en-US') : '');

            // Add a short delay before focusing to allow the dialog to animate in
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 150);

            return () => clearTimeout(timer);
        }
    }, [isOpen, statement]);

    // Handler to format the input with commas
    const handleAmountChange = (e) => {
        const value = e.target.value.replace(/,/g, ''); // Remove existing commas
        if (!isNaN(value) && value.length <= 15) {
            // Format the number with commas, or set to empty if input is cleared
            setAmount(value ? Number(value).toLocaleString('en-US') : '');
        } else if (value === '') {
            setAmount('');
        }
    };

    const handleSave = () => {
        // Parse the comma-separated string back to a number
        const numericAmount = parseFloat(String(amount).replace(/,/g, ''));
        if (isNaN(numericAmount) || numericAmount <= 0) return;

        const newPaidAmount = (statement.paidAmount || 0) + numericAmount;
        onSave(statement.id, newPaidAmount);
        onClose();
    };

    if (!statement) return null;
    
    const remaining = (statement.statementAmount || 0) - (statement.paidAmount || 0);
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Log Payment</DialogTitle>
                    <DialogDescription>For {statement.card.name} - {fmtYMShortFn(statement.month)}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="text-sm">
                        <p>Actual Balance: <span className="font-medium">{currencyFn(statement.statementAmount)}</span></p>
                        <p>Currently Paid: <span className="font-medium">{currencyFn(statement.paidAmount)}</span></p>
                        <p className="font-bold">Remaining: <span className="text-red-600">{currencyFn(remaining)}</span></p>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="payment-amount" className="text-sm font-medium">Amount to Log</label>
                        <Input 
                            ref={inputRef}
                            id="payment-amount" 
                            type="text"
                            inputMode="numeric"
                            value={amount}
                            onChange={handleAmountChange}
                            placeholder="Enter amount paid"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save Payment</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}