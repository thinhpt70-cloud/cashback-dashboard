import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Gift, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Helper for currency formatting
const formatCurrency = (value) => {
    if (value === '' || value === undefined || value === null) return '';
    return new Intl.NumberFormat('en-US').format(value);
};

// Helper to parse currency string back to number
const parseCurrency = (value) => {
    if (!value) return '';
    return String(value).replace(/,/g, '');
};

const QUICK_AMOUNTS = [100000, 200000, 300000, 500000];

export function RedeemPointsDialog({ isOpen, onClose, onConfirm, target }) {
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState(null);
    const [redemptionDate, setRedemptionDate] = useState('');

    // Reset state when dialog opens
    useEffect(() => {
        if (isOpen) {
            setAmount('');
            setNotes('');
            setError(null);
            // Default to current local datetime in format YYYY-MM-DDTHH:MM
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            setRedemptionDate(now.toISOString().slice(0, 16));
        }
    }, [isOpen]);

    if (!target) return null;

    const currentBalance = target.totalPoints || 0;
    const numericAmount = Number(parseCurrency(amount));
    const remainingBalance = currentBalance - (numericAmount || 0);
    const isValid = numericAmount > 0 && remainingBalance >= 0;

    const handleAmountChange = (e) => {
        const rawValue = e.target.value;
        const numericValue = rawValue.replace(/[^0-9]/g, '');

        // Prevent typing more than balance
        if (Number(numericValue) > currentBalance) {
            setError("Amount exceeds available balance");
        } else {
            setError(null);
        }

        setAmount(formatCurrency(numericValue));
    };

    const handleQuickSelect = (value) => {
        if (value > currentBalance) {
            setError("Amount exceeds available balance");
            // Still set it so user sees they clicked it, but show error
        } else {
            setError(null);
        }
        setAmount(formatCurrency(value));
    };

    const handleMax = () => {
        setAmount(formatCurrency(currentBalance));
        setError(null);
    };

    const handleSubmit = () => {
        if (!isValid) return;
        // Format YYYY-MM-DDTHH:MM back to cleaner format or pass as is
        // We'll pass as YYYY-MM-DD HH:MM string to match regex expectation
        const formattedDate = redemptionDate.replace('T', ' ');
        onConfirm({ amount: numericAmount, notes, date: formattedDate });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                            <Gift className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        Redeem Points
                    </DialogTitle>
                    <DialogDescription>
                        Use your accumulated points for rewards or statement credits.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Hero: Balance Visualization Split */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 p-4 text-white shadow-md">
                            <div className="relative z-10">
                                <p className="text-indigo-100 text-[10px] font-medium uppercase tracking-wider mb-1">Available</p>
                                <h3 className="text-2xl font-bold tracking-tight truncate" title={formatCurrency(currentBalance)}>
                                    {formatCurrency(currentBalance)}
                                </h3>
                            </div>
                            <div className="absolute top-0 right-0 -mr-6 -mt-6 h-20 w-20 rounded-full bg-white/10 blur-2xl" />
                        </div>

                        <div className={cn("relative overflow-hidden rounded-xl p-4 shadow-md transition-colors",
                            remainingBalance < 0 ? "bg-red-50 border border-red-100" : "bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800"
                        )}>
                             <div className="relative z-10">
                                <p className="text-slate-500 text-[10px] font-medium uppercase tracking-wider mb-1">After Redeem</p>
                                <h3 className={cn("text-2xl font-bold tracking-tight truncate",
                                     remainingBalance < 0 ? "text-red-600" : "text-slate-900 dark:text-slate-100"
                                )}>
                                    {remainingBalance < 0 ? '-' : ''}{formatCurrency(Math.abs(remainingBalance))}
                                </h3>
                            </div>
                        </div>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="redeem-amount">Amount</Label>
                                <div className="relative">
                                    <Input
                                        id="redeem-amount"
                                        value={amount}
                                        onChange={handleAmountChange}
                                        placeholder="0"
                                        className={cn("pl-3 pr-10 font-semibold", error && "border-red-500 focus-visible:ring-red-500")}
                                        autoFocus
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-xs">pts</div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="redeem-date">Date & Time</Label>
                                <Input
                                    id="redeem-date"
                                    type="datetime-local"
                                    value={redemptionDate}
                                    onChange={(e) => setRedemptionDate(e.target.value)}
                                    className="text-sm font-sans"
                                />
                            </div>
                        </div>
                        {error && (
                            <p className="text-xs text-red-500 flex items-center gap-1 -mt-2">
                                <AlertCircle className="h-3 w-3" /> {error}
                            </p>
                        )}

                        {/* Quick Select */}
                        <div>
                            <Label className="text-xs text-slate-500 mb-2 block">Quick Select</Label>
                            <div className="flex flex-wrap gap-2">
                                {QUICK_AMOUNTS.map((amt) => (
                                    <Badge
                                        key={amt}
                                        variant="outline"
                                        className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all px-3 py-1.5 h-auto text-sm font-normal"
                                        onClick={() => handleQuickSelect(amt)}
                                    >
                                        {formatCurrency(amt)}
                                    </Badge>
                                ))}
                                <Badge
                                    variant="outline"
                                    className="cursor-pointer bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 active:scale-95 transition-all px-3 py-1.5 h-auto text-sm font-medium"
                                    onClick={handleMax}
                                >
                                    Max
                                </Badge>
                            </div>
                        </div>

                        <div className="space-y-2 pt-2">
                            <Label htmlFor="redeem-notes">Notes (Optional)</Label>
                            <Input
                                id="redeem-notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="e.g. Agoda voucher, Statement credit..."
                                className="text-sm"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!isValid || !!error}
                        className={cn("min-w-[100px]", isValid ? "bg-indigo-600 hover:bg-indigo-700" : "")}
                    >
                        Confirm
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
