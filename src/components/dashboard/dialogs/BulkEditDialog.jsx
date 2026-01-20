import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Combobox } from "../../ui/combobox";
import { Loader2, AlertTriangle, ArrowRight, Info } from "lucide-react";
import { toast } from 'sonner';
import { cn } from "../../../lib/utils";

export default function BulkEditDialog({
    isOpen,
    onClose,
    selectedIds,
    allTransactions,
    categories,
    cards,
    rules,
    mccMap,
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

    const selectedTransactions = useMemo(() => {
        return allTransactions.filter(t => selectedIds.includes(t.id));
    }, [allTransactions, selectedIds]);

    const uniqueCardIds = useMemo(() => {
        const ids = new Set();
        selectedTransactions.forEach(tx => {
            if (tx['Card'] && tx['Card'].length > 0) ids.add(tx['Card'][0]);
        });
        return Array.from(ids);
    }, [selectedTransactions]);

    const hasMixedCards = uniqueCardIds.length > 1;

    // Sorting logic integrated here
    const sortedCategories = useMemo(() => {
        return [...categories].sort((a, b) => a.localeCompare(b));
    }, [categories]);

    const sortedCards = useMemo(() => {
        return [...cards].sort((a, b) => a.name.localeCompare(b.name));
    }, [cards]);

    const filteredRules = useMemo(() => {
        let relevantRules = rules;
        if (selectedField === 'Applicable Rule' && !hasMixedCards && uniqueCardIds.length === 1) {
            relevantRules = rules.filter(r => r.cardId === uniqueCardIds[0]);
        }
        return [...relevantRules].sort((a, b) => (a.ruleName || '').localeCompare(b.ruleName || ''));
    }, [rules, uniqueCardIds, selectedField, hasMixedCards]);

    const handleSave = async () => {
        if (!selectedField) {
            toast.error("Please select a field to update.");
            return;
        }
        if (selectedField === 'Applicable Rule' && hasMixedCards) {
             toast.error("Cannot apply rules to transactions from different cards.");
             return;
        }
        if (!value && value !== 0) {
             toast.error("Please enter a value.");
             return;
        }

        setIsProcessing(true);

        try {
            const updates = [];
            const summaryCache = new Map();

            for (const txId of selectedIds) {
                const tx = allTransactions.find(t => t.id === txId);
                if (!tx) continue;

                const updatePayload = { id: txId, properties: {} };
                let needsSummaryUpdate = false;
                let newRuleId = null;
                let newCardId = null;

                if (selectedField === 'MCC Code') {
                    updatePayload.properties.mccCode = value;
                } else if (selectedField === 'Category') {
                    updatePayload.properties.category = value;
                } else if (selectedField === 'Applicable Rule') {
                    updatePayload.properties.applicableRuleId = value;
                    newRuleId = value;
                    newCardId = tx['Card'] ? tx['Card'][0] : null;
                    needsSummaryUpdate = true;
                } else if (selectedField === 'Card') {
                    updatePayload.properties.cardId = value;
                    newCardId = value;
                    newRuleId = tx['Applicable Rule'] ? tx['Applicable Rule'][0] : null;
                    needsSummaryUpdate = true;
                }

                if (needsSummaryUpdate && newRuleId && newCardId) {
                    const cardObj = cards.find(c => c.id === newCardId);
                    if (cardObj && tx['Transaction Date']) {
                        const month = getCurrentCashbackMonthForCard(cardObj, tx['Transaction Date']);
                        const cacheKey = `${newCardId}-${month}-${newRuleId}`;
                        let summaryId = summaryCache.get(cacheKey);

                        if (!summaryId) {
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

    const getMccDescription = (code) => {
        if (!code || !mccMap || !mccMap[code]) return null;
        return mccMap[code].vn || mccMap[code].us || 'Unknown';
    };

    const getDisplayValue = (tx, field) => {
        if (!field) return '-';
        if (field === 'MCC Code') {
             const code = tx['MCC Code'];
             if (!code) return '-';
             const desc = getMccDescription(code);
             return desc ? `${code} - ${desc}` : code;
        }
        if (field === 'Category') return tx['Category'] || 'Uncategorized';
        if (field === 'Applicable Rule') {
             const ruleId = tx['Applicable Rule']?.[0];
             const rule = rules.find(r => r.id === ruleId);
             return rule ? rule.ruleName : '-';
        }
        if (field === 'Card') {
             const cardId = tx['Card']?.[0];
             const card = cards.find(c => c.id === cardId);
             return card ? card.name : '-';
        }
        return '-';
    };

    const getNewDisplayValue = () => {
        if (!value) return null;
        if (selectedField === 'MCC Code') {
            const desc = getMccDescription(value);
            return desc ? `${value} - ${desc}` : value;
        }
        if (selectedField === 'Category') return value;
        if (selectedField === 'Applicable Rule') {
             const rule = rules.find(r => r.id === value);
             return rule ? rule.ruleName : value;
        }
        if (selectedField === 'Card') {
             const card = cards.find(c => c.id === value);
             return card ? card.name : value;
        }
        return value;
    };

    const renderInput = () => {
        if (selectedField === 'Applicable Rule' && hasMixedCards) {
            return (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800 dark:text-amber-300">
                        <p className="font-semibold">Mixed Cards Selected</p>
                        <p className="mt-1">Cannot bulk assign rules because selected transactions belong to different cards. Please filter by card first.</p>
                    </div>
                </div>
            );
        }

        switch (selectedField) {
            case 'MCC Code':
                const mccDesc = getMccDescription(value);
                return (
                    <div className="space-y-2">
                        <Input
                            placeholder="Enter MCC Code"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                        />
                        {value && (
                            <div className="flex items-start gap-2 text-xs text-muted-foreground p-2 bg-slate-50 dark:bg-slate-900/50 rounded border dark:border-slate-800">
                                <Info className="h-3.5 w-3.5 mt-0.5 text-blue-500" />
                                {mccDesc ? (
                                    <span>Match: <span className="font-medium text-slate-700 dark:text-slate-300">{mccDesc}</span></span>
                                ) : (
                                    <span className="italic text-slate-400">No known description for this code</span>
                                )}
                            </div>
                        )}
                    </div>
                );
            case 'Category':
                return (
                    <Combobox
                        options={sortedCategories.map(c => ({ value: c, label: c }))}
                        value={value}
                        onChange={setValue}
                        placeholder="Select category..."
                    />
                );
            case 'Applicable Rule':
                return (
                    <Select value={value} onValueChange={setValue} disabled={hasMixedCards}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Cashback Rule" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                            {filteredRules.map(rule => (
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
                            {sortedCards.map(card => (
                                <SelectItem key={card.id} value={card.id}>
                                    {card.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            default:
                return <div className="h-10 bg-slate-50 dark:bg-slate-900 rounded border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-sm text-slate-400">Select a field first</div>;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[900px] h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>Bulk Edit ({selectedIds.length} items)</DialogTitle>
                </DialogHeader>

                <div className="flex-1 min-h-0 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x dark:divide-slate-800">
                    {/* Left Column: Controls */}
                    <div className="w-full md:w-1/3 p-6 space-y-6 bg-white dark:bg-slate-950">
                        <div className="grid gap-2">
                            <Label>Field to Update</Label>
                            <Select value={selectedField} onValueChange={(val) => { setSelectedField(val); setValue(''); }}>
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

                    {/* Right Column: Preview */}
                    <div className="w-full md:w-2/3 flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="p-3 border-b dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900 sticky top-0">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Preview Changes</h4>
                        </div>
                        <div className="flex-1 overflow-auto p-0">
                            <Table>
                                <TableHeader className="sticky top-0 bg-slate-50 dark:bg-slate-900 z-10 shadow-sm">
                                    <TableRow>
                                        <TableHead className="w-[100px]">Date</TableHead>
                                        <TableHead>Transaction</TableHead>
                                        <TableHead className="w-[140px]">Current Value</TableHead>
                                        <TableHead className="w-[140px]">New Value</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedTransactions.map(tx => {
                                        const currentValue = getDisplayValue(tx, selectedField);
                                        const newValue = getNewDisplayValue();
                                        const isChanged = newValue && newValue !== currentValue;

                                        return (
                                            <TableRow key={tx.id}>
                                                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {tx['Transaction Date']}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    <div className="font-medium truncate max-w-[180px]" title={tx['Transaction Name']}>{tx['Transaction Name']}</div>
                                                    <div className="text-xs text-muted-foreground">{Number(tx['Amount']).toLocaleString()}</div>
                                                </TableCell>
                                                <TableCell className="text-xs text-slate-500">
                                                    {currentValue}
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {newValue ? (
                                                        <div className={cn("flex items-center gap-1 font-medium", isChanged ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500")}>
                                                            {isChanged && <ArrowRight className="h-3 w-3" />}
                                                            {newValue}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-300">-</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-4 border-t dark:border-slate-800 bg-white dark:bg-slate-950">
                    <Button variant="outline" onClick={onClose} disabled={isProcessing}>Cancel</Button>
                    <Button
                        onClick={handleSave}
                        disabled={isProcessing || !selectedField || !value || (selectedField === 'Applicable Rule' && hasMixedCards)}
                        className="min-w-[100px]"
                    >
                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update All
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
