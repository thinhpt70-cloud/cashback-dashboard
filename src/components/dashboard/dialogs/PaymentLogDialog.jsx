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
import { Plus, ArrowRight } from 'lucide-react';

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
    
    const currentPaid = statement.paidAmount || 0;
    const totalDue = statement.statementAmount || 0;
    const remaining = totalDue - currentPaid;
    
    // Calculate projected values
    const numericInput = parseFloat(String(amount).replace(/,/g, '')) || 0;
    const newTotalPaid = currentPaid + numericInput;
    const newRemaining = Math.max(0, totalDue - newTotalPaid);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Log Payment</DialogTitle>
                    <DialogDescription>For {statement.card.name} - {fmtYMShortFn(statement.month)}</DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Visual Summary */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Statement Balance:</span>
                            <span className="font-semibold">{currencyFn(totalDue)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Currently Paid:</span>
                            <span className="font-medium">{currencyFn(currentPaid)}</span>
                        </div>
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between font-bold">
                            <span>Remaining Due:</span>
                            <span className={remaining > 0 ? "text-red-600" : "text-emerald-600"}>{currencyFn(remaining)}</span>
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="space-y-2">
                        <label htmlFor="payment-amount" className="text-sm font-medium flex items-center gap-2">
                            <Plus className="h-4 w-4 text-emerald-600" />
                            Amount to Add
                        </label>
                        <Input 
                            ref={inputRef}
                            id="payment-amount" 
                            type="text"
                            inputMode="numeric"
                            value={amount}
                            onChange={handleAmountChange}
                            placeholder="Enter amount to add"
                            className="text-lg font-medium"
                        />
                    </div>

                    {/* Projected Result */}
                    {numericInput > 0 && (
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/30 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="flex items-center justify-between text-sm text-emerald-800 dark:text-emerald-300">
                                <span className="font-medium">New Total Paid:</span>
                                <div className="flex items-center gap-2 font-bold">
                                    <span className="opacity-50 line-through text-xs">{currencyFn(currentPaid)}</span>
                                    <ArrowRight className="h-3 w-3" />
                                    <span>{currencyFn(newTotalPaid)}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                                <span>New Remaining:</span>
                                <span className="font-bold">{currencyFn(newRemaining)}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={numericInput <= 0}>Confirm Payment</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
