import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import { ScrollArea } from "../../ui/scroll-area";
import { Loader2, Check, ArrowRight, AlertTriangle } from "lucide-react";
import { toast } from 'sonner';
import { cn } from "../../../lib/utils";

export default function BulkApproveDialog({ isOpen, onClose, selectedIds, onApproveComplete }) {
    const [isLoading, setIsLoading] = useState(false);
    const [analysis, setAnalysis] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && selectedIds.length > 0) {
            analyzeTransactions();
        } else {
            setAnalysis([]);
        }
    }, [isOpen, selectedIds]);

    const analyzeTransactions = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/transactions/analyze-approval', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds })
            });
            if (!res.ok) throw new Error("Analysis failed");
            const data = await res.json();
            setAnalysis(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to analyze transactions.");
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            // Send the specific updates calculated by the analysis
            const itemsToUpdate = analysis.map(item => ({
                id: item.id,
                updates: item.updates
            }));

            const res = await fetch('/api/transactions/bulk-approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: itemsToUpdate })
            });

            if (!res.ok) throw new Error("Approval failed");

            const updated = await res.json();
            toast.success(`Processed ${updated.length} transactions.`);
            onApproveComplete(); // Refresh parent
            onClose();

        } catch (error) {
            console.error(error);
            toast.error("Failed to process transactions.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Calculate summary counts
    const approvableCount = analysis.filter(i => i.status === 'approved').length;
    const skippedCount = analysis.filter(i => i.status !== 'approved').length;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Auto Approve Transactions</DialogTitle>
                    <DialogDescription>
                        Review the proposed changes.
                        <span className="block mt-1 font-medium text-foreground">
                            {approvableCount} to be approved, {skippedCount} to be renamed (review needed).
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden p-1">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <ScrollArea className="h-[400px] border rounded-md">
                            <div className="space-y-1 p-4">
                                {analysis.map((item) => {
                                    const isApproved = item.status === 'approved';

                                    return (
                                        <div key={item.id} className={cn(
                                            "flex flex-col sm:flex-row gap-4 p-3 border-b last:border-0 transition-colors rounded-md",
                                            !isApproved && "bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/50",
                                            isApproved && "hover:bg-slate-50 dark:hover:bg-slate-900"
                                        )}>
                                            {/* Status Icon */}
                                            <div className="flex items-start justify-center pt-1">
                                                {isApproved ? (
                                                    <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                                                        <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                                    </div>
                                                ) : (
                                                    <div className="h-6 w-6 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center" title={item.reason}>
                                                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Original */}
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs text-muted-foreground mb-1">Original</div>
                                                <div className="font-medium truncate" title={item.currentName}>
                                                    {item.currentName}
                                                </div>
                                            </div>

                                            {/* Arrow */}
                                            <div className="hidden sm:flex items-center justify-center text-muted-foreground">
                                                <ArrowRight className="h-4 w-4" />
                                            </div>

                                            {/* Proposed */}
                                            <div className="flex-1 min-w-0">
                                                <div className={cn("text-xs font-medium mb-1", isApproved ? "text-emerald-600 dark:text-emerald-500" : "text-amber-600 dark:text-amber-500")}>
                                                    {isApproved ? "Proposed" : "Rename Only"}
                                                </div>
                                                <div className={cn("font-medium truncate", isApproved ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400")} title={item.newName}>
                                                    {item.newName}
                                                </div>
                                                {/* Changes Summary */}
                                                <div className="mt-1 text-xs text-slate-500 space-y-0.5">
                                                    {item.logs.map((log, i) => (
                                                        <div key={i} className="flex items-center gap-1">
                                                            <Check className={cn("h-3 w-3", isApproved ? "text-emerald-500" : "text-slate-400")} />
                                                            <span>{log}</span>
                                                        </div>
                                                    ))}
                                                    {!isApproved && (
                                                        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-500 font-medium">
                                                            <AlertTriangle className="h-3 w-3" />
                                                            <span>Reason: {item.reason}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm} disabled={isSubmitting || isLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Check className="mr-2 h-4 w-4" />
                                Confirm Auto Approve
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
