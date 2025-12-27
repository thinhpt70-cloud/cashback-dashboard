import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Gift, AlertCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import useMediaQuery from '@/hooks/useMediaQuery';

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

const QUICK_AMOUNTS = [200000, 300000, 500000];

export function RedeemPointsDialog({ isOpen, onClose, onConfirm, target }) {
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [date, setDate] = useState('');
    const [error, setError] = useState(null);
    const isDesktop = useMediaQuery("(min-width: 768px)");

    // Reset state when dialog opens
    useEffect(() => {
        if (isOpen) {
            setAmount('');
            setNotes('');
            // Default to current local time in YYYY-MM-DDTHH:MM format
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            setDate(`${year}-${month}-${day}T${hours}:${minutes}`);
            setError(null);
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
        onConfirm({ amount: numericAmount, notes, date });
    };

    const DialogWrapper = isDesktop ? Dialog : Drawer;
    const ContentWrapper = isDesktop ? DialogContent : DrawerContent;
    const HeaderWrapper = isDesktop ? DialogHeader : DrawerHeader;
    const TitleWrapper = isDesktop ? DialogTitle : DrawerTitle;
    const DescriptionWrapper = isDesktop ? DialogDescription : DrawerDescription;
    const FooterWrapper = isDesktop ? DialogFooter : DrawerFooter;

    // Props for Drawer to fix iOS keyboard issues
    const drawerProps = !isDesktop ? { repositionInputs: false } : {};

    const content = (
        <div className={cn("space-y-6", isDesktop ? "py-4" : "p-4 pb-0")}>
            {/* Hero: Balance Visualization (Split Cards) */}
            <div className="grid grid-cols-2 gap-3">
                    {/* Card 1: Available */}
                <div className="relative overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Available</p>
                        <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{formatCurrency(currentBalance)}</h3>
                </div>

                {/* Card 2: After Redeem */}
                <div className={cn(
                    "relative overflow-hidden rounded-xl border p-4 transition-colors",
                    isValid ? "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800" : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-80"
                )}>
                    <p className={cn("text-[10px] font-bold uppercase tracking-wider mb-1", isValid ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500")}>New Balance</p>
                    <h3 className={cn("text-xl font-bold tracking-tight flex items-center gap-1",
                        remainingBalance < 0 ? "text-red-500" : (isValid ? "text-indigo-700 dark:text-indigo-300" : "text-slate-900 dark:text-slate-100")
                    )}>
                        {remainingBalance < 0 ? '-' : ''}{formatCurrency(Math.abs(remainingBalance))}
                        {isValid && <ArrowRight className="h-3 w-3 opacity-50" />}
                    </h3>
                </div>
            </div>

            {/* Inputs */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="redeem-amount">Amount to Redeem</Label>
                    <div className="relative">
                        <Input
                            id="redeem-amount"
                            value={amount}
                            onChange={handleAmountChange}
                            placeholder="0"
                            className={cn("pl-4 pr-12 text-lg font-semibold", error && "border-red-500 focus-visible:ring-red-500")}
                            autoFocus={isDesktop}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">pts</div>
                    </div>
                    {error && (
                        <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                            <AlertCircle className="h-3 w-3" /> {error}
                        </p>
                    )}
                </div>

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

                <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                        <Label htmlFor="redeem-date">Date & Time</Label>
                        <Input
                            id="redeem-date"
                            type="datetime-local"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="text-sm w-full appearance-none block min-w-0" // Fixed for iOS
                        />
                    </div>
                        <div className="space-y-2">
                        <Label htmlFor="redeem-notes">Notes (Optional)</Label>
                        <Textarea
                            id="redeem-notes"
                            value={notes}
                            onChange={(e) => {
                                setNotes(e.target.value);
                                // Simple auto-grow
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                            placeholder="e.g. Voucher"
                            className="text-sm min-h-[80px] resize-none overflow-hidden"
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <DialogWrapper open={isOpen} onOpenChange={onClose} {...drawerProps}>
            <ContentWrapper className={cn("sm:max-w-md", !isDesktop && "max-h-[96vh]")}>
                <HeaderWrapper className={cn(!isDesktop && "text-left")}>
                    <TitleWrapper className="flex items-center gap-2 text-xl">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                            <Gift className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        Redeem Points
                    </TitleWrapper>
                    <DescriptionWrapper>
                        Use your accumulated points for rewards or statement credits.
                    </DescriptionWrapper>
                </HeaderWrapper>

                {content}

                <FooterWrapper className={cn("pt-2", !isDesktop && "pb-8 px-4")}>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!isValid || !!error}
                        className={cn("min-w-[100px]", isValid ? "bg-indigo-600 hover:bg-indigo-700" : "")}
                    >
                        Confirm
                    </Button>
                </FooterWrapper>
            </ContentWrapper>
        </DialogWrapper>
    );
}
