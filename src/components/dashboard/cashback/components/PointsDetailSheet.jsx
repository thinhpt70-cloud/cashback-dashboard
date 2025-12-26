import React from 'react';
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from "@/components/ui/sheet";
import {
    Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edit2, ClipboardCheck, Eye } from "lucide-react";
import useMediaQuery from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import { fmtYMShort } from "@/lib/formatters";
import { isStatementFinalized } from "@/lib/cashback-logic";

export function PointsDetailSheet({ isOpen, onClose, cardData, onEdit, onToggleReviewed, onViewTransactions, currencyFn }) {
    const isDesktop = useMediaQuery("(min-width: 768px)");

    if (!cardData) return null;

    const Content = (
        <div className="space-y-6 flex-1 min-h-0 flex flex-col">
            {/* Header Stats */}
            <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                        <p className="text-xs text-slate-500 uppercase font-semibold">Current Balance</p>
                        <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                            {currencyFn(cardData.totalPoints)}
                        </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                        <p className="text-xs text-slate-500 uppercase font-semibold">Amount Redeemed</p>
                        <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                            {cardData.totalAmountRedeemed ? currencyFn(cardData.totalAmountRedeemed) : '0'}
                        </p>
                    </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-500 uppercase font-semibold">Minimum Redemption</p>
                    <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                        {cardData.minPointsRedeem ? currencyFn(cardData.minPointsRedeem) : '0'}
                    </p>
                </div>
            </div>

            {/* History List */}
            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-2 px-1">
                     <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Monthly Breakdown</h3>
                     <span className="text-xs text-slate-500">{cardData.items.length} records</span>
                </div>

                <ScrollArea className="flex-1 pr-4 -mr-4">
                    <div className="space-y-3 pb-4">
                        {cardData.items.slice().reverse().map((item) => { // Reverse to show newest first
                            const earned = item.totalEarned || 0;
                            const redeemed = item.amountRedeemed || 0;
                            const adjustment = item.adjustment || 0;
                            const remaining = item.remainingDue || 0;
                            const hasNotes = item.notes && item.notes.trim().length > 0;
                            const isReviewed = item.reviewed;
                            const isStatementFinished = isStatementFinalized(item.month, cardData.statementDay);

                            return (
                                <div key={item.id} className="group relative border border-slate-200 dark:border-slate-800 rounded-lg p-3 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors bg-white dark:bg-slate-950">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{fmtYMShort(item.month)}</span>
                                                {remaining > 0 ? (
                                                    !isStatementFinished ? (
                                                        <Badge variant="outline" className="text-[10px] bg-orange-50 text-orange-700 border-orange-200 px-1 py-0 h-5">Pending</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 px-1 py-0 h-5">Active</Badge>
                                                    )
                                                ) : (
                                                    <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-200 px-1 py-0 h-5">Settled</Badge>
                                                )}
                                                {isReviewed && (
                                                    <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-600 border-indigo-200 px-1 py-0 h-5 flex items-center gap-1">
                                                        <ClipboardCheck className="h-2.5 w-2.5" />
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-1 -mr-2 -mt-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={cn("h-6 w-6 transition-opacity", isReviewed ? "text-indigo-600 opacity-100" : "opacity-30 group-hover:opacity-100 text-slate-400 hover:text-indigo-600")}
                                                onClick={() => onToggleReviewed(item)}
                                                title={isReviewed ? "Mark Unreviewed" : "Mark Reviewed"}
                                            >
                                                <ClipboardCheck className="h-3 w-3" />
                                            </Button>
                                            
                                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-50 group-hover:opacity-100" onClick={() => onViewTransactions(item)}>
                                                <Eye className="h-3 w-3" />
                                            </Button>
                                            
                                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-50 group-hover:opacity-100" onClick={() => onEdit(item)}>
                                                <Edit2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                                        <div className="flex justify-between pr-2">
                                            <span>Earned:</span>
                                            <span className="font-medium">{currencyFn(earned)}</span>
                                        </div>
                                        <div className="flex justify-between pl-2 border-l border-slate-100 dark:border-slate-800">
                                            <span>Redeemed:</span>
                                            <span className={cn("font-medium", redeemed > 0 ? "text-indigo-600" : "")}>{currencyFn(redeemed)}</span>
                                        </div>
                                        <div className="flex justify-between pr-2">
                                            <span>Adj:</span>
                                            <span className={cn("font-medium", adjustment !== 0 ? "text-orange-600" : "")}>{currencyFn(adjustment)}</span>
                                        </div>
                                        <div className="flex justify-between pl-2 border-l border-slate-100 dark:border-slate-800">
                                            <span className="font-bold text-slate-900 dark:text-slate-200">Remaining:</span>
                                            <span className="font-bold text-emerald-600 dark:text-emerald-500">{currencyFn(remaining)}</span>
                                        </div>
                                    </div>

                                    {hasNotes && (
                                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 italic bg-slate-50/50 dark:bg-slate-900/50 p-1.5 rounded">
                                            {item.notes}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );

    if (isDesktop) {
        return (
            <Sheet open={isOpen} onOpenChange={onClose}>
                <SheetContent className="sm:max-w-md flex flex-col h-full">
                    <SheetHeader className="mb-4">
                        <SheetTitle className="flex items-center gap-2">
                             <div className="h-6 w-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-[10px] font-bold text-indigo-700 shrink-0">
                                {cardData.bankName ? cardData.bankName.substring(0,2) : 'CB'}
                            </div>
                            {cardData.cardName}
                        </SheetTitle>
                        <SheetDescription>
                            Points history and redemption details
                        </SheetDescription>
                    </SheetHeader>
                    {Content}
                </SheetContent>
            </Sheet>
        );
    }

    return (
        <Drawer open={isOpen} onOpenChange={onClose}>
            <DrawerContent className="h-[85vh]">
                <DrawerHeader className="text-left">
                    <DrawerTitle className="flex items-center gap-2">
                         <div className="h-6 w-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-[10px] font-bold text-indigo-700 shrink-0">
                            {cardData.bankName ? cardData.bankName.substring(0,2) : 'CB'}
                        </div>
                        {cardData.cardName}
                    </DrawerTitle>
                    <DrawerDescription>
                        Points history and redemption details
                    </DrawerDescription>
                </DrawerHeader>
                <div className="px-4 flex-1 overflow-hidden pb-8 flex flex-col">
                    {Content}
                </div>
            </DrawerContent>
        </Drawer>
    );
}
