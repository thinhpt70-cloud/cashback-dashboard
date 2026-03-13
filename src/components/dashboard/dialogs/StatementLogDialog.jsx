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
import { Check, Info } from 'lucide-react';

export default function StatementLogDialog({ isOpen, onClose, statement, onSave, currencyFn, fmtYMShortFn }) {
    const [amount, setAmount] = useState('');
    const inputRef = useRef(null);

    // Calculate derived values and apply Math.ceil as requested
    const spend = Math.ceil(statement?.spend || 0);
    const cashback = Math.ceil(statement?.cashback || 0);
    const estimatedBalance = Math.ceil(spend - cashback);
    const statementAmount = Math.ceil(statement?.statementAmount || 0);

    useEffect(() => {
        if (isOpen && statement) {
            // Pre-fill with the existing statement amount if it's greater than 0,
            // otherwise, use the estimated balance as a suggestion.
            const currentAmount = statementAmount > 0 ? statementAmount : estimatedBalance;
            
            setAmount(currentAmount > 0 ? currentAmount.toLocaleString('en-US') : '');

            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 150);

            return () => clearTimeout(timer);
        }
    }, [isOpen, statement, statementAmount, estimatedBalance]);

    const handleAmountChange = (e) => {
        const value = e.target.value.replace(/,/g, '');
        if (!isNaN(value) && value.length <= 15) {
            setAmount(value ? Number(value).toLocaleString('en-US') : '');
        } else if (value === '') {
            setAmount('');
        }
    };

    const handleSave = () => {
        const numericAmount = Math.ceil(parseFloat(String(amount).replace(/,/g, '')));
        if (isNaN(numericAmount)) return;

        onSave(statement.id, numericAmount);
        onClose();
    };

    if (!statement) return null;

    const fillAmount = (val) => {
        if (val > 0) {
            setAmount(val.toLocaleString('en-US'));
        } else {
            setAmount('0');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Log Official Statement Amount</DialogTitle>
                    <DialogDescription>For {statement.card.name} - {fmtYMShortFn(statement.month)}</DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    {/* Modern Summary Card */}
                    <div className="bg-gray-50 border rounded-lg p-4 space-y-3">
                        <div className="flex items-center text-sm font-medium text-gray-500 mb-1">
                            <Info className="w-4 h-4 mr-1.5" />
                            Statement Breakdown
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">Total Spend</span>
                                <span className="font-medium">{currencyFn(spend)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">Applicable Cashback</span>
                                <span className="font-medium text-emerald-600">-{currencyFn(cashback)}</span>
                            </div>
                            <div className="pt-2 border-t flex justify-between items-center">
                                <span className="font-medium text-gray-900">Estimated Balance</span>
                                <span className="font-bold text-gray-900">{currencyFn(estimatedBalance)}</span>
                            </div>
                        </div>

                        {statementAmount > 0 && (
                            <div className="pt-2 border-t flex justify-between items-center text-sm bg-blue-50 -mx-4 -mb-4 p-3 rounded-b-lg border-blue-100">
                                <span className="font-medium text-blue-800">Current Logged Amount</span>
                                <span className="font-bold text-blue-700">{currencyFn(statementAmount)}</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label htmlFor="statement-amount" className="text-sm font-medium">
                                Official Statement Amount
                            </label>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => fillAmount(estimatedBalance)}
                                    className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                                >
                                    Use Estimated
                                </button>
                                {statementAmount > 0 && statementAmount !== estimatedBalance && (
                                    <button
                                        type="button"
                                        onClick={() => fillAmount(statementAmount)}
                                        className="text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                                    >
                                        Use Current
                                    </button>
                                )}
                            </div>
                        </div>

                        <Input
                            ref={inputRef}
                            id="statement-amount"
                            type="text"
                            inputMode="numeric"
                            value={amount}
                            onChange={handleAmountChange}
                            placeholder="Enter official amount from bank"
                            className="text-lg font-medium tracking-wide"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">Cancel</Button>
                    <Button onClick={handleSave} className="w-full sm:w-auto gap-2">
                        <Check className="w-4 h-4" />
                        Save Amount
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
