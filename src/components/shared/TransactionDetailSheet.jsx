import React, { useMemo, useState, useEffect } from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "../ui/sheet";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
    Calendar,
    CreditCard,
    Tag,
    Store,
    Layers,
    FileText,
    Receipt,
    Globe,
    AlertCircle,
    CheckCircle2,
    Percent,
    ArrowLeft
} from "lucide-react";
import { Checkbox } from "../ui/checkbox";
import { cn } from "../../lib/utils";
import mccData from '../../lib/MCC.json';

export default function TransactionDetailSheet({
    transaction,
    isOpen,
    onClose,
    onEdit,
    onDelete,
    currencyFn,
    allCards,
    rules,
    monthlyCategorySummary
}) {
    // 1. Maintain local copy of data to persist during closing animation
    const [displayTransaction, setDisplayTransaction] = useState(transaction);

    useEffect(() => {
        if (transaction) {
            setDisplayTransaction(transaction);
        }
    }, [transaction]);

    // Use displayTransaction for rendering
    const currentTransaction = displayTransaction;

    // Currency helper
    const currency = currencyFn || ((n) => (n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }));

    // Data Parsing
    const {
        cleanNotes,
        discounts,
        fees
    } = useMemo(() => {
        if (!currentTransaction?.notes) return { cleanNotes: '', discounts: [], fees: [] };

        let noteText = currentTransaction.notes;
        let discountData = [];
        let feeData = [];

        // Parse Discounts
        const discountMatch = noteText.match(/Discounts: (\[.*\])/);
        if (discountMatch) {
            try {
                discountData = JSON.parse(discountMatch[1]);
                noteText = noteText.replace(discountMatch[0], '');
            } catch (e) {
                console.error("Failed to parse discounts", e);
            }
        }

        // Parse Fees
        const feeMatch = noteText.match(/Fees: (\[.*\])/);
        if (feeMatch) {
            try {
                feeData = JSON.parse(feeMatch[1]);
                noteText = noteText.replace(feeMatch[0], '');
            } catch (e) {
                console.error("Failed to parse fees", e);
            }
        }

        return {
            cleanNotes: noteText.trim(),
            discounts: discountData,
            fees: feeData
        };
    }, [currentTransaction]);

    // Only return null if we have NEVER had a transaction (initial state)
    if (!currentTransaction) return null;

    // Status logic
    const isCompleted = true; // Placeholder for now
    const statusColor = isCompleted ? "bg-emerald-100 text-emerald-800" : "bg-yellow-100 text-yellow-800";
    const statusText = isCompleted ? "Completed" : "Pending";

    // Data Resolution
    const cardId = currentTransaction['Card'] && currentTransaction['Card'][0];
    const cardName = currentTransaction['Card Name'] || (allCards && allCards.find(c => c.id === cardId)?.name) || "Unknown Card";

    const ruleId = currentTransaction['Applicable Rule'] && currentTransaction['Applicable Rule'][0];
    const ruleName = (rules && rules.find(r => r.id === ruleId)?.ruleName) || "No Rule Applied";

    const summaryIdRaw = currentTransaction['Card Summary Category'] && currentTransaction['Card Summary Category'][0];
    const summaryName = (monthlyCategorySummary && monthlyCategorySummary.find(s => s.id === summaryIdRaw)?.summaryId) || summaryIdRaw || "N/A";

    // Rate calculation
    const rate = (currentTransaction['Amount'] && currentTransaction['Amount'] > 0)
        ? (currentTransaction.estCashback / currentTransaction['Amount'])
        : 0;

    // Foreign Currency Helpers
    // Logic: Show foreign fields if any foreign data is present, regardless of "Method"
    const foreignAmount = currentTransaction['foreignCurrencyAmount'];
    const conversionFee = currentTransaction['conversionFee'];
    const vndAmount = currentTransaction['Amount'];
    const hasForeignData = (foreignAmount && foreignAmount !== 'N/A') || (conversionFee && conversionFee > 0);

    // Calculations for display
    let displayExchangeRate = currentTransaction['exchangeRate'] || 0;
    let displayFeePercent = 0;

    if (hasForeignData && foreignAmount > 0 && vndAmount > 0) {
        const amountBeforeFee = vndAmount - (conversionFee || 0);

        if (amountBeforeFee > 0 && conversionFee > 0) {
            displayFeePercent = (conversionFee / amountBeforeFee) * 100;
        }
    }

    // Method Badge Logic
    const getMethodBadge = (method) => {
        const m = method || 'POS';
        switch (m) {
            case 'POS': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">POS</Badge>;
            case 'eCom': return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">eCom</Badge>;
            case 'International': return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">International</Badge>;
            default: return <Badge variant="secondary">{m}</Badge>;
        }
    };

    // MCC Description Logic
    const mccCode = currentTransaction['MCC Code'];
    const mccDesc = mccCode ? (mccData.mccDescriptionMap[mccCode]?.vn || 'Unknown') : '';
    const displayMcc = mccCode ? `${mccCode} - ${mccDesc}` : 'N/A';

    // Helper to render a row
    const DetailRow = ({ icon: Icon, label, value, subValue, className }) => (
        <div className={cn("flex items-start gap-3", className)}>
            <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
                <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{label}</p>
                <div className="text-sm text-slate-500 dark:text-slate-400 break-words">{value}</div>
                {subValue && <div className="text-xs text-slate-400 mt-0.5">{subValue}</div>}
            </div>
        </div>
    );

    const SectionHeader = ({ title }) => (
         <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">{title}</h4>
    );

    const Separator = () => <div className="h-px bg-slate-200 dark:bg-slate-800 my-6" />;

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-full sm:max-w-md flex flex-col h-full p-0 gap-0">
                
                {/* Header with Back Button logic */}
                <div className="p-6 pb-2">
                     <Button variant="ghost" size="sm" className="mb-2 -ml-2 text-slate-500 hover:text-slate-900" onClick={() => onClose(false)}>
                        <ArrowLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                    <SheetHeader className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Badge className={statusColor}>{statusText}</Badge>
                        </div>
                        <div>
                            <SheetTitle className="text-xl font-bold leading-tight break-words">
                                {currentTransaction['Transaction Name']}
                            </SheetTitle>
                            {currentTransaction.merchantLookup && (
                                <SheetDescription className="text-sm mt-1">
                                    {currentTransaction.merchantLookup}
                                </SheetDescription>
                            )}
                        </div>

                        <div className="flex flex-col gap-1">
                            <span className="text-3xl font-extrabold text-primary tracking-tight">
                                {currency(currentTransaction['Amount'])}
                            </span>
                            {hasForeignData && (
                                <span className="text-sm text-muted-foreground">
                                    {foreignAmount} {currentTransaction['foreignCurrency'] ? `${currentTransaction['foreignCurrency']} ` : ''}
                                </span>
                            )}
                        </div>
                    </SheetHeader>
                </div>

                {/* Scrollable Wrapper */}
                <div className="flex-1 overflow-y-auto px-6 pb-6">
                    <Separator />

                    <div className="space-y-6">
                        {/* 1. Transaction Info */}
                        <div>
                            <SectionHeader title="Transaction Info" />
                            <div className="grid gap-4">
                                <DetailRow icon={Calendar} label="Date" value={currentTransaction['Transaction Date']} />
                                <DetailRow icon={Store} label="Merchant" value={currentTransaction.merchantLookup || currentTransaction['Transaction Name']} />
                                <DetailRow icon={CreditCard} label="Card" value={cardName} />
                                <DetailRow icon={Globe} label="Method" value={getMethodBadge(currentTransaction['Method'])} />
                                <DetailRow icon={Receipt} label="MCC Code" value={displayMcc} className="font-mono" />
                            </div>
                        </div>

                        <Separator />

                        {/* 2. Payment & Cashback */}
                        <div>
                            <SectionHeader title="Payment & Cashback" />
                            <div className="grid gap-4">
                                <DetailRow icon={CheckCircle2} label="Applied Rule" value={ruleName} />

                                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 flex justify-between items-center">
                                    <div className="flex gap-3 items-center">
                                        <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                            <Percent className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Estimated Cashback</p>
                                            <p className="text-xs text-emerald-600 dark:text-emerald-400">{(rate * 100).toFixed(1)}% Rate</p>
                                        </div>
                                    </div>
                                    <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                                        +{currency(currentTransaction.estCashback)}
                                    </span>
                                </div>

                                {hasForeignData && (
                                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-md text-sm space-y-2 border">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Foreign Amount</span>
                                            <span className="font-medium">
                                                {foreignAmount} {currentTransaction['foreignCurrency'] ? `${currentTransaction['foreignCurrency']} ` : ''}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Exchange Rate</span>
                                            <span className="font-medium">{displayExchangeRate.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">% Conversion Fee</span>
                                            <span className="font-medium">{displayFeePercent.toFixed(2)}%</span>
                                        </div>
                                         <div className="flex justify-between">
                                            <span className="text-muted-foreground">Conversion Fee</span>
                                            <span className="text-red-500 font-medium">+{currency(conversionFee)}</span>
                                        </div>
                                    </div>
                                )}

                                {(discounts.length > 0 || fees.length > 0 || currentTransaction.otherDiscounts > 0 || currentTransaction.otherFees > 0) && (
                                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-md text-sm space-y-3 border">
                                        {/* Display Parsed Discounts */}
                                        {discounts.length > 0 && (
                                            <div className="space-y-1">
                                                <p className="text-xs font-semibold text-emerald-600 uppercase">Discounts</p>
                                                {discounts.map((d, i) => (
                                                    <div key={i} className="flex justify-between text-xs">
                                                        <span className="text-slate-600">{d.description || `Discount ${i+1}`}</span>
                                                        <span className="text-emerald-600 font-mono">-{d.amount}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Fallback to legacy field if parsed list is empty but total > 0 */}
                                        {discounts.length === 0 && currentTransaction.otherDiscounts > 0 && (
                                             <div className="flex justify-between">
                                                <span className="text-muted-foreground">Discounts</span>
                                                <span className="text-emerald-600 font-medium">-{currency(currentTransaction.otherDiscounts)}</span>
                                            </div>
                                        )}

                                        {/* Display Parsed Fees */}
                                        {fees.length > 0 && (
                                            <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800">
                                                <p className="text-xs font-semibold text-red-600 uppercase">Fees</p>
                                                {fees.map((f, i) => (
                                                    <div key={i} className="flex justify-between text-xs">
                                                        <span className="text-slate-600">{f.description || `Fee ${i+1}`}</span>
                                                        <span className="text-red-500 font-mono">+{f.amount}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                         {/* Fallback to legacy field */}
                                        {fees.length === 0 && currentTransaction.otherFees > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Additional Fees</span>
                                                <span className="text-red-500 font-medium">+{currency(currentTransaction.otherFees)}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* 3. Category */}
                        <div>
                            <SectionHeader title="Categorization" />
                            <div className="grid gap-4">
                                <DetailRow icon={Tag} label="Category" value={
                                    <div className="flex gap-2 flex-wrap">
                                        <Badge variant="secondary">{currentTransaction['Category'] || "Uncategorized"}</Badge>
                                    </div>
                                } />

                                <DetailRow icon={Layers} label="Sub-Category" value={
                                    (currentTransaction.subCategory && currentTransaction.subCategory.length > 0) ? (
                                        <div className="flex gap-1 flex-wrap">
                                            {currentTransaction.subCategory.map(sc => <Badge key={sc} variant="outline" className="text-xs">{sc}</Badge>)}
                                        </div>
                                    ) : "None"
                                } />

                                <DetailRow icon={FileText} label="Paid For" value={currentTransaction['paidFor'] || "N/A"} />
                            </div>
                        </div>

                        <Separator />

                        {/* 4. Other Information */}
                        <div>
                            <SectionHeader title="Other Information" />
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground">Transaction ID</p>
                                        <p className="text-xs font-mono truncate bg-slate-100 dark:bg-slate-800 p-1 rounded">{currentTransaction.id}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground">Summary Category</p>
                                        <p className="text-xs truncate text-slate-600 dark:text-slate-400">{summaryName}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground">Statement Month</p>
                                        <p className="text-sm">{currentTransaction['Statement Month'] || "N/A"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground">Cashback Month</p>
                                        <p className="text-sm">{currentTransaction['Cashback Month'] || "N/A"}</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2">
                                        <Checkbox checked={currentTransaction['Match']} disabled />
                                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            Matched Rule
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Checkbox checked={currentTransaction['Automated']} disabled />
                                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            Automated
                                        </label>
                                    </div>
                                </div>

                                {currentTransaction['billingDate'] && (
                                    <DetailRow icon={Calendar} label="Billing Date" value={currentTransaction['billingDate']} />
                                )}

                                {cleanNotes && (
                                    <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md border border-amber-100 dark:border-amber-900/50">
                                        <div className="flex gap-2 items-start">
                                            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                                            <div className="space-y-1">
                                                <p className="text-xs font-bold text-amber-800 dark:text-amber-200">Notes</p>
                                                <p className="text-xs text-amber-700 dark:text-amber-300 whitespace-pre-wrap">{cleanNotes}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer fixed at the bottom */}
                <SheetFooter className="p-6 border-t bg-white dark:bg-slate-950 gap-2 sm:gap-0 mt-auto">
                    <div className="flex w-full gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => onEdit(currentTransaction)}>
                            Edit
                        </Button>
                        <Button variant="destructive" className="flex-1" onClick={() => onDelete(currentTransaction.id, currentTransaction['Transaction Name'])}>
                            Delete
                        </Button>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
