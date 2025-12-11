import React from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "../../ui/sheet";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import {
    Calendar,
    CreditCard,
    Tag,
    Store,
    FileText,
    Receipt,
    Globe,
    AlertCircle,
    CheckCircle2,
    DollarSign,
    Percent
} from "lucide-react";
import { Checkbox } from "../../ui/checkbox";
import { cn } from "../../../lib/utils";

export default function TransactionDetailSheet({ transaction, isOpen, onClose, onEdit, onDelete, currencyFn, allCards, rules }) {
    if (!transaction) return null;

    const currency = currencyFn || ((n) => (n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }));

    // Status logic (simplified or passed in)
    const isCompleted = true; // Assuming completed for now as it's in the list
    const statusColor = isCompleted ? "bg-emerald-100 text-emerald-800" : "bg-yellow-100 text-yellow-800";
    const statusText = isCompleted ? "Completed" : "Pending";

    // Data Resolution
    const cardId = transaction['Card'] && transaction['Card'][0];
    const cardName = transaction['Card Name'] || (allCards && allCards.find(c => c.id === cardId)?.name) || "Unknown Card";

    const ruleId = transaction['Applicable Rule'] && transaction['Applicable Rule'][0];
    const ruleName = (rules && rules.find(r => r.id === ruleId)?.ruleName) || "No Rule Applied";

    const summaryId = transaction['Card Summary Category'] && transaction['Card Summary Category'][0];

    // Rate calculation
    const rate = (transaction['Amount'] && transaction['Amount'] > 0)
        ? (transaction.estCashback / transaction['Amount'])
        : 0;

    // Foreign Currency Helpers
    const isInternational = transaction['Method'] === 'International';
    const foreignAmount = transaction['foreignCurrencyAmount'];
    const conversionFee = transaction['conversionFee'];

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
            <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader className="mb-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <Badge className={statusColor}>{statusText}</Badge>
                         <div className="text-xs text-muted-foreground font-mono">{transaction.id.slice(0, 8)}...</div>
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
                                        <span>{foreignAmount}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Conversion Fee</span>
                                        <span className="text-red-500">+{currency(conversionFee)}</span>
                                    </div>
                                </div>
                            )}

                             {(transaction.otherDiscounts > 0 || transaction.otherFees > 0) && (
                                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-md text-sm space-y-2 border">
                                     {transaction.otherDiscounts > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Discounts</span>
                                            <span className="text-emerald-600 font-medium">-{currency(transaction.otherDiscounts)}</span>
                                        </div>
                                    )}
                                    {transaction.otherFees > 0 && (
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
                                    <p className="text-xs font-medium text-muted-foreground">Summary ID</p>
                                    <p className="text-xs truncate text-slate-600 dark:text-slate-400">{summaryId || "N/A"}</p>
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

                             {transaction.notes && (
                                <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md border border-amber-100 dark:border-amber-900/50">
                                    <div className="flex gap-2 items-start">
                                        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-amber-800 dark:text-amber-200">Notes</p>
                                            <p className="text-xs text-amber-700 dark:text-amber-300 whitespace-pre-wrap">{transaction.notes}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <SheetFooter className="mt-8 gap-2 sm:gap-0 sticky bottom-0 bg-background pt-4 border-t">
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
