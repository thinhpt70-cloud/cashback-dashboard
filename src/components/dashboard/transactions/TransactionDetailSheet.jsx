import React from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
    SheetClose
} from "../../ui/sheet";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import {
    Calendar,
    CreditCard,
    DollarSign,
    Tag,
    Store,
    FileText,
    Hash,
    MapPin,
    Clock
} from "lucide-react";

export default function TransactionDetailSheet({ transaction, isOpen, onClose, onEdit, onDelete, currencyFn, fmtDateFn }) {
    if (!transaction) return null;

    const currency = currencyFn || ((n) => (n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }));

    // Status logic (simplified or passed in)
    const isCompleted = true; // Assuming completed for now as it's in the list
    const statusColor = isCompleted ? "bg-emerald-100 text-emerald-800" : "bg-yellow-100 text-yellow-800";
    const statusText = isCompleted ? "Completed" : "Pending";

    // Rate calculation
    const rate = (transaction['Amount'] && transaction['Amount'] > 0)
        ? (transaction.estCashback / transaction['Amount'])
        : 0;

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="font-mono text-xs text-muted-foreground">
                            {transaction.id.slice(0, 8)}...
                        </Badge>
                        <Badge className={statusColor}>{statusText}</Badge>
                    </div>
                    <SheetTitle className="text-xl font-bold leading-tight">
                        {transaction['Transaction Name']}
                    </SheetTitle>
                    {transaction.merchantLookup && (
                        <SheetDescription className="text-sm">
                            {transaction.merchantLookup}
                        </SheetDescription>
                    )}
                    <div className="mt-4 flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-primary">
                            {currency(transaction['Amount'])}
                        </span>
                    </div>
                </SheetHeader>

                <div className="my-6 h-[1px] w-full bg-slate-200 dark:bg-slate-800" />

                <div className="space-y-6">
                    {/* Key Details Section */}
                    <div className="grid gap-4">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Transaction Details</h4>

                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                <Calendar className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium">Date</p>
                                <p className="text-sm text-muted-foreground">{transaction['Transaction Date']}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                <CreditCard className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium">Card</p>
                                <p className="text-sm text-muted-foreground">{transaction['Card Name'] || "Unknown Card"}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                <Tag className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium">Category</p>
                                <div className="flex gap-2 mt-1">
                                    <Badge variant="secondary">{transaction['Category'] || "Uncategorized"}</Badge>
                                    {transaction.subCategory && <Badge variant="outline">{transaction.subCategory}</Badge>}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                <Store className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium">MCC Code</p>
                                <p className="text-sm text-muted-foreground font-mono">{transaction['MCC Code'] || "N/A"}</p>
                            </div>
                        </div>
                    </div>

                    <div className="h-[1px] w-full bg-slate-200 dark:bg-slate-800" />

                    {/* Cashback Section */}
                    <div className="grid gap-4">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Cashback & Rewards</h4>

                        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 flex justify-between items-center">
                            <div>
                                <p className="text-sm text-emerald-800 font-medium">Estimated Cashback</p>
                                <p className="text-xs text-emerald-600">Based on {(rate * 100).toFixed(1)}% rate</p>
                            </div>
                            <span className="text-lg font-bold text-emerald-700">
                                +{currency(transaction.estCashback)}
                            </span>
                        </div>
                    </div>

                    {/* Additional Details (Notes, Fees, etc.) */}
                    {(transaction.notes || transaction.otherFees > 0 || transaction.otherDiscounts > 0) && (
                        <>
                            <div className="h-[1px] w-full bg-slate-200 dark:bg-slate-800" />
                            <div className="grid gap-4">
                                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Additional Info</h4>

                                {transaction.notes && (
                                    <div className="flex gap-3">
                                        <FileText className="h-4 w-4 text-slate-400 mt-1" />
                                        <div>
                                            <p className="text-sm font-medium">Notes</p>
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{transaction.notes}</p>
                                        </div>
                                    </div>
                                )}

                                {transaction.otherFees > 0 && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Additional Fees</span>
                                        <span className="font-medium text-red-600">+{currency(transaction.otherFees)}</span>
                                    </div>
                                )}

                                {transaction.otherDiscounts > 0 && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Discounts</span>
                                        <span className="font-medium text-emerald-600">-{currency(transaction.otherDiscounts)}</span>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <SheetFooter className="mt-8 gap-2 sm:gap-0">
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
