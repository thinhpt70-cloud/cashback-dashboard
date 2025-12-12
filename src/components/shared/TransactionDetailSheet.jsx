import React, { useMemo } from 'react';
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
    // Hooks should be at the top level
    // We derive data from the transaction object

    // Currency helper
    const currency = currencyFn || ((n) => (n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }));

    // Data Parsing
    const {
        cleanNotes,
        discounts,
        fees
    } = useMemo(() => {
        if (!transaction?.notes) return { cleanNotes: '', discounts: [], fees: [] };

        let noteText = transaction.notes;
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
    }, [transaction]);

    if (!transaction) return null;

    // Status logic
    const isCompleted = true; // Placeholder for now
    const statusColor = isCompleted ? "bg-emerald-100 text-emerald-800" : "bg-yellow-100 text-yellow-800";
    const statusText = isCompleted ? "Completed" : "Pending";

    // Data Resolution
    const cardId = transaction['Card'] && transaction['Card'][0];
    const cardName = transaction['Card Name'] || (allCards && allCards.find(c => c.id === cardId)?.name) || "Unknown Card";

    const ruleId = transaction['Applicable Rule'] && transaction['Applicable Rule'][0];
    const ruleName = (rules && rules.find(r => r.id === ruleId)?.ruleName) || "No Rule Applied";

    const summaryIdRaw = transaction['Card Summary Category'] && transaction['Card Summary Category'][0];
    const summaryName = (monthlyCategorySummary && monthlyCategorySummary.find(s => s.id === summaryIdRaw)?.summaryId) || summaryIdRaw || "N/A";

    // Rate calculation
    const rate = (transaction['Amount'] && transaction['Amount'] > 0)
        ? (transaction.estCashback / transaction['Amount'])
        : 0;

    // Foreign Currency Helpers
    const isInternational = transaction['Method'] === 'International';
    const foreignAmount = transaction['foreignCurrencyAmount'];
    const conversionFee = transaction['conversionFee'];
    const vndAmount = transaction['Amount'];

    // Calculations for display
    // Exchange Rate = (VND - Fee) / Foreign
    // Fee % = Fee / (VND - Fee)
    let displayExchangeRate = 0;
    let displayFeePercent = 0;

    if (isInternational && foreignAmount > 0 && vndAmount > 0) {
        const amountBeforeFee = vndAmount - (conversionFee || 0);
        if (amountBeforeFee > 0) {
            displayExchangeRate = amountBeforeFee / foreignAmount;
            if (conversionFee > 0) {
                displayFeePercent = (conversionFee / amountBeforeFee) * 100;
            }
        }
    }

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
                                {transaction['Transaction Name']}
                            </SheetTitle>
                            {transaction.merchantLookup && (
                                <SheetDescription className="text-sm mt-1">
                                    {transaction.merchantLookup}
                                </SheetDescription>
                            )}
                        </div>

                        <div className="flex flex-col gap-1">
                            <span className="text-3xl font-extrabold text-primary tracking-tight">
                                {currency(transaction['Amount'])}
                            </span>
                            {isInternational && (
                                <span className="text-sm text-muted-foreground">
                                    ≈ {foreignAmount?.toLocaleString()} (Original)
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
                                <DetailRow icon={Calendar} label="Date" value={transaction['Transaction Date']} />
                                <DetailRow icon={Store} label="Merchant" value={transaction.merchantLookup || transaction['Transaction Name']} />
                                <DetailRow icon={CreditCard} label="Card" value={cardName} />
                                <DetailRow icon={Globe} label="Method" value={transaction['Method'] || 'POS'} />
                                <DetailRow icon={Receipt} label="MCC Code" value={transaction['MCC Code'] || 'N/A'} className="font-mono" />
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
                                        +{currency(transaction.estCashback)}
                                    </span>
                                </div>

                                {isInternational && (
                                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-md text-sm space-y-2 border">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Foreign Amount</span>
                                            <span className="font-mono">{foreignAmount}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Exchange Rate</span>
                                            <span className="font-mono">{displayExchangeRate.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">% Conversion Fee</span>
                                            <span className="font-mono text-slate-600">{displayFeePercent.toFixed(2)}%</span>
                                        </div>
                                         <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-800 mt-1">
                                            <span className="text-muted-foreground">Conversion Fee</span>
                                            <span className="text-red-500 font-medium">+{currency(conversionFee)}</span>
                                        </div>
                                    </div>
                                )}

                                {(discounts.length > 0 || fees.length > 0 || transaction.otherDiscounts > 0 || transaction.otherFees > 0) && (
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
                                        {discounts.length === 0 && transaction.otherDiscounts > 0 && (
                                             <div className="flex justify-between">
                                                <span className="text-muted-foreground">Discounts</span>
                                                <span className="text-emerald-600 font-medium">-{currency(transaction.otherDiscounts)}</span>
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
                                        {fees.length === 0 && transaction.otherFees > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Additional Fees</span>
                                                <span className="text-red-500 font-medium">+{currency(transaction.otherFees)}</span>
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
                                        <Badge variant="secondary">{transaction['Category'] || "Uncategorized"}</Badge>
                                    </div>
                                } />

                                <DetailRow icon={Layers} label="Sub-Category" value={
                                    (transaction.subCategory && transaction.subCategory.length > 0) ? (
                                        <div className="flex gap-1 flex-wrap">
                                            {transaction.subCategory.map(sc => <Badge key={sc} variant="outline" className="text-xs">{sc}</Badge>)}
                                        </div>
                                    ) : "None"
                                } />

                                <DetailRow icon={FileText} label="Paid For" value={transaction['paidFor'] || "N/A"} />
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
                                        <p className="text-xs font-mono truncate bg-slate-100 dark:bg-slate-800 p-1 rounded">{transaction.id}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground">Summary Category</p>
                                        <p className="text-xs truncate text-slate-600 dark:text-slate-400">{summaryName}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground">Statement Month</p>
                                        <p className="text-sm">{transaction['Statement Month'] || "N/A"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground">Cashback Month</p>
                                        <p className="text-sm">{transaction['Cashback Month'] || "N/A"}</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2">
                                        <Checkbox checked={transaction['Match']} disabled />
                                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            Matched Rule
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Checkbox checked={transaction['Automated']} disabled />
                                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            Automated
                                        </label>
                                    </div>
                                </div>

                                {transaction['billingDate'] && (
                                    <DetailRow icon={Calendar} label="Billing Date" value={transaction['billingDate']} />
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
                        <Button variant="outline" className="flex-1" onClick={() => onEdit(transaction)}>
                            Edit
                        </Button>
                        <Button variant="destructive" className="flex-1" onClick={() => onDelete(transaction.id, transaction['Transaction Name'])}>
                            Delete
                        </Button>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}