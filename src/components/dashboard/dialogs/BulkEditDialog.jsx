
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Combobox } from "../../ui/combobox";
import { Loader2 } from "lucide-react";
import { toast } from 'sonner';

export default function BulkEditDialog({
    isOpen,
    onClose,
    selectedIds,
    allTransactions,
    categories,
    cards,
    rules,
    getCurrentCashbackMonthForCard,
    onUpdateComplete
}) {
    const [selectedField, setSelectedField] = useState('');
    const [value, setValue] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Reset state when dialog opens
    useEffect(() => {
        if (isOpen) {
            setSelectedField('');
            setValue('');
            setIsProcessing(false);
        }
    }, [isOpen]);

    const handleSave = async () => {
        if (!selectedField) {
            toast.error("Please select a field to update.");
            return;
        }
        if (!value && value !== 0) { // Allow 0 as a value
             toast.error("Please enter a value.");
             return;
        }

        setIsProcessing(true);

        try {
            const updates = [];
            const summaryCache = new Map(); // Cache summary IDs to avoid redundant calls

            for (const txId of selectedIds) {
                const tx = allTransactions.find(t => t.id === txId);
                if (!tx) continue;

                const updatePayload = { id: txId, properties: {} };
                let needsSummaryUpdate = false;
                let newRuleId = null;
                let newCardId = null;

                // Prepare the specific field update
                if (selectedField === 'MCC Code') {
                    updatePayload.properties.mccCode = value;
                } else if (selectedField === 'Category') {
                    updatePayload.properties.category = value;
                } else if (selectedField === 'Applicable Rule') {
                    updatePayload.properties.applicableRuleId = value;
                    newRuleId = value;
                    newCardId = tx['Card'] ? tx['Card'][0] : null; // Keep existing card
                    needsSummaryUpdate = true;
                } else if (selectedField === 'Card') {
                    updatePayload.properties.cardId = value;
                    newCardId = value;

                    // If we change card, we might need to update the rule if the old rule doesn't apply?
                    // For now, let's assume we keep the rule if possible, OR the user should update rule too.
                    // But critically, changing card DEFINITELY changes the summary category.
                    newRuleId = tx['Applicable Rule'] ? tx['Applicable Rule'][0] : null;
                    needsSummaryUpdate = true;
                }

                // --- Complex Logic: Recalculate Summary Category ---
                if (needsSummaryUpdate && newRuleId && newCardId) {
                    const cardObj = cards.find(c => c.id === newCardId);
                    if (cardObj && tx['Transaction Date']) {
                        const month = getCurrentCashbackMonthForCard(cardObj, tx['Transaction Date']);

                        // Check cache first
                        const cacheKey = `${newCardId}-${month}-${newRuleId}`;
                        let summaryId = summaryCache.get(cacheKey);

                        if (!summaryId) {
                            // Fetch or create summary from backend
                            const res = await fetch('/api/summaries', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    cardId: newCardId,
                                    month: month,
                                    ruleId: newRuleId
                                }),
                            });

                            if (res.ok) {
                                const data = await res.json();
                                summaryId = data.id;
                                summaryCache.set(cacheKey, summaryId);
                            } else {
                                console.error("Failed to get summary ID for bulk update");
                            }
                        }

                        if (summaryId) {
                            updatePayload.properties.cardSummaryCategoryId = summaryId;
                        }
                    }
                }

                updates.push(updatePayload);
            }

            // Send batch update
            const res = await fetch('/api/transactions/batch-update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates }),
            });

            if (!res.ok) throw new Error("Batch update failed");

            const updatedTransactions = await res.json();
            onUpdateComplete(updatedTransactions);
            toast.success("Transactions updated successfully.");
            onClose();

        } catch (error) {
            console.error(error);
            toast.error("Failed to update transactions.");
        } finally {
            setIsProcessing(false);
        }
    };

    // Helper to render the correct input based on selected field
    const renderInput = () => {
        switch (selectedField) {
            case 'MCC Code':
                return (
                     <Input
                        placeholder="Enter MCC Code"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                    />
                );
            case 'Category':
                return (
                    <Combobox
                        options={categories.map(c => ({ value: c, label: c }))}
                        value={value}
                        onChange={setValue}
                        placeholder="Select category..."
                    />
                );
            case 'Applicable Rule':
                return (
                    <Select value={value} onValueChange={setValue}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Cashback Rule" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                            {rules.map(rule => (
                                <SelectItem key={rule.id} value={rule.id}>
                                    {rule.ruleName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            case 'Card':
                return (
                    <Select value={value} onValueChange={setValue}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Card" />
                        </SelectTrigger>
                        <SelectContent>
                            {cards.map(card => (
                                <SelectItem key={card.id} value={card.id}>
                                    {card.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            default:
                return <div className="h-10 bg-slate-50 rounded border border-dashed flex items-center justify-center text-sm text-slate-400">Select a field first</div>;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Bulk Edit ({selectedIds.length} items)</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Field to Update</Label>
                        <Select value={selectedField} onValueChange={setSelectedField}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select field..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="MCC Code">MCC Code</SelectItem>
                                <SelectItem value="Category">Category</SelectItem>
                                <SelectItem value="Applicable Rule">Applicable Rule</SelectItem>
                                <SelectItem value="Card">Card</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>New Value</Label>
                        {renderInput()}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isProcessing}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isProcessing || !selectedField || !value}>
                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update All
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
