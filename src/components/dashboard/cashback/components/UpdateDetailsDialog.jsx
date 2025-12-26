import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtYMShort } from "@/lib/formatters";

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

export function UpdateDetailsDialog({ isOpen, onClose, onSave, item }) {
    const [adjustment, setAdjustment] = useState('');
    const [amountRedeemed, setAmountRedeemed] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (isOpen && item) {
            setAdjustment(formatCurrency(item.adjustment));
            setAmountRedeemed(formatCurrency(item.amountRedeemed));
            setNotes(item.notes || '');
        }
    }, [isOpen, item]);

    if (!item) return null;

    const isPoints = item.isPoints;
    const typeLabel = isPoints ? "Points" : "Cashback";
    const redeemedLabel = isPoints ? "Redeemed" : "Received";

    // Calculations
    const numEarned = Number(item.totalEarned) || 0;
    const numAdj = Number(parseCurrency(adjustment)) || 0;
    const numRedeemed = Number(parseCurrency(amountRedeemed)) || 0;

    const totalAvailable = numEarned + numAdj;
    const remainingDue = totalAvailable - numRedeemed;

    // Validation
    const isOverRedeemed = remainingDue < 0;

    const handleSave = () => {
        if (isOverRedeemed && !isPoints) {
            // For cashback, usually we don't want to pay more than due, but strict blocking depends on user preference.
            // Given the prompt "Add validation rules", I'll treat it as a warning or error.
            // Let's allow it but show warning, or block if it's strictly points redemption.
        }

        onSave({
            ...item,
            adjustment: numAdj,
            amountRedeemed: numRedeemed,
            notes
        });
    };

    const handleNumberInput = (setter) => (e) => {
        const rawValue = e.target.value;
        const cleanVal = rawValue.replace(/[^0-9-.]/g, '');

        if (cleanVal.endsWith('.')) {
             setter(cleanVal);
             return;
        }

        if (cleanVal.includes('.') && cleanVal.split('.')[1].length > 0) {
             // Has decimals.
             const parts = cleanVal.split('.');
             const integerPart = parts[0];
             const decimalPart = parts[1];
             setter(`${new Intl.NumberFormat('en-US').format(integerPart)}.${decimalPart}`);
             return;
        }

        setter(cleanVal ? new Intl.NumberFormat('en-US').format(cleanVal) : '');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={cn("text-[10px] h-5 px-2 font-normal", isPoints ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-emerald-50 text-emerald-700 border-emerald-200")}>
                            {typeLabel} Record
                        </Badge>
                        <span className="text-sm text-slate-500 font-medium">{fmtYMShort(item.month)}</span>
                    </div>
                    <DialogTitle className="text-xl">{item.cardName}</DialogTitle>
                    <DialogDescription>
                        Update the financial details for this period.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-6">
                    {/* Calculator Visualization */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                        {/* Row 1: Earned */}
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 font-medium">Original Earned</span>
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{formatCurrency(numEarned)}</span>
                        </div>

                        {/* Row 2: Adjustment */}
                        <div className="flex justify-between items-center text-sm">
                            <Label htmlFor="adjustment" className="text-slate-500 font-medium flex items-center gap-2">
                                + Adjustment
                                <Badge variant="secondary" className="text-[9px] h-4 px-1 py-0 font-normal text-slate-500">Manual</Badge>
                            </Label>
                            <div className="w-[140px]">
                                <Input
                                    id="adjustment"
                                    value={adjustment}
                                    onChange={handleNumberInput(setAdjustment)}
                                    className="h-8 text-right font-mono text-sm bg-white dark:bg-slate-950"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="h-px bg-slate-200 dark:bg-slate-700" />

                        {/* Row 3: Total Available */}
                        <div className="flex justify-between items-center text-sm bg-slate-100 dark:bg-slate-800/80 -mx-4 px-4 py-2">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">Total Available</span>
                            <span className="font-mono font-bold text-base">{formatCurrency(totalAvailable)}</span>
                        </div>

                        {/* Row 4: Redeemed/Received */}
                        <div className="flex justify-between items-center text-sm pt-1">
                            <Label htmlFor="redeemed" className="text-slate-500 font-medium flex items-center gap-2">
                                - {redeemedLabel}
                                <Badge variant="secondary" className="text-[9px] h-4 px-1 py-0 font-normal text-slate-500">Paid</Badge>
                            </Label>
                            <div className="w-[140px]">
                                <Input
                                    id="redeemed"
                                    value={amountRedeemed}
                                    onChange={handleNumberInput(setAmountRedeemed)}
                                    className={cn("h-8 text-right font-mono text-sm bg-white dark:bg-slate-950", isOverRedeemed && "border-red-500 focus-visible:ring-red-500")}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="h-px bg-slate-200 dark:bg-slate-700" />

                        {/* Row 5: Remaining */}
                        <div className="flex justify-between items-center">
                             <span className={cn("text-sm font-bold", remainingDue < 0 ? "text-red-600" : "text-emerald-600")}>
                                {remainingDue < 0 ? "Overpaid / Excess" : "Remaining Due"}
                             </span>
                             <span className={cn("font-mono font-bold text-lg", remainingDue < 0 ? "text-red-600" : "text-emerald-600")}>
                                {remainingDue < 0 ? '-' : ''}{formatCurrency(Math.abs(remainingDue))}
                             </span>
                        </div>
                    </div>

                    {isOverRedeemed && (
                         <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>
                                Warning: The {redeemedLabel.toLowerCase()} amount exceeds the total available. This will result in a negative balance.
                            </span>
                        </div>
                    )}

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="resize-none h-20"
                            placeholder="Add details about adjustment or payment..."
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} className="bg-slate-900 dark:bg-slate-100">Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
