import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { DollarSign, Edit2, CheckCircle } from "lucide-react";
import { calculateCashbackSplit, calculatePaymentDate, getPaymentStatus } from '../../../lib/cashback-logic';
import { toast } from "sonner";

const API_BASE_URL = '/api';

export default function CashbackTracker({
    cards = [],
    monthlySummary = [],
    onUpdate // Callback to refresh data
}) {
    const [selectedMonth, setSelectedMonth] = useState('all');
    const [editingSummary, setEditingSummary] = useState(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    // --- DERIVED DATA & CALCULATIONS ---

    const processedData = useMemo(() => {
        if (!monthlySummary || !cards) return [];

        // Create a map of cards for easy lookup
        const cardMap = new Map(cards.map(c => [c.id, c]));

        return monthlySummary.map(summary => {
            const card = cardMap.get(summary.cardId);
            if (!card) return null;

            // 1. Calculate Split
            const { total, tier1, tier2 } = calculateCashbackSplit(
                summary.actualCashback,
                summary.adjustment,
                card.overallMonthlyLimit
            );

            // 2. Determine Payment Rules
            const tier1Method = card.tier1PaymentType || 'M+1'; // Default to M+1 if missing
            const tier2Method = card.tier2PaymentType || 'M+2'; // Default to M+2 if missing (often same as T1 or later)

            // 3. Calculate Due Dates
            const tier1Date = calculatePaymentDate(summary.month, tier1Method, card.statementDay);
            const tier2Date = calculatePaymentDate(summary.month, tier2Method, card.statementDay);

            // 4. Distribute Redeemed Amount (FIFO - Pay Tier 1 first, then Tier 2)
            // Note: This is an assumption. Usually payments cover the earliest due.
            // Since T1 is usually M0/M+1 and T2 is M+1/M+2, T1 comes first.
            const redeemed = summary.amountRedeemed || 0;
            const tier1Paid = Math.min(redeemed, tier1);
            const tier2Paid = Math.max(0, redeemed - tier1);

            // 5. Determine Statuses
            const tier1Status = getPaymentStatus(tier1, tier1Paid, tier1Date);
            const tier2Status = getPaymentStatus(tier2, tier2Paid, tier2Date);

            return {
                ...summary,
                cardName: card.name,
                bankName: card.bank,
                totalEarned: total,
                tier1Amount: tier1,
                tier1Method,
                tier1Date,
                tier1Paid,
                tier1Status,
                tier2Amount: tier2,
                tier2Method,
                tier2Date,
                tier2Paid,
                tier2Status,
                remainingDue: Math.max(0, total - redeemed),
                isPoints: typeof tier1Method === 'string' && tier1Method.toLowerCase().includes('point'),
            };
        }).filter(Boolean).sort((a, b) => b.month.localeCompare(a.month)); // Sort by month desc
    }, [monthlySummary, cards]);

    const filteredData = useMemo(() => {
        if (selectedMonth === 'all') return processedData;
        return processedData.filter(d => d.month === selectedMonth);
    }, [processedData, selectedMonth]);

    // Unique months for filter
    const months = useMemo(() => [...new Set(processedData.map(d => d.month))], [processedData]);

    // Summary Stats
    const stats = useMemo(() => {
        let totalUnpaidCash = 0;
        let totalAccumulatingPoints = 0;
        let totalReceived = 0;

        processedData.forEach(item => {
            totalReceived += item.amountRedeemed || 0;

            // If it's points, we count the raw amount (assuming 1 Point = 1 VND value for tracking)
            if (item.isPoints) {
                // For points, we consider the "remaining due" as accumulating balance
                totalAccumulatingPoints += item.remainingDue;
            } else {
                totalUnpaidCash += item.remainingDue;
            }
        });

        return { totalUnpaidCash, totalAccumulatingPoints, totalReceived };
    }, [processedData]);


    // --- ACTIONS ---

    const handleEditClick = (summary) => {
        setEditingSummary({
            id: summary.id,
            adjustment: summary.adjustment || 0,
            notes: summary.notes || '',
            amountRedeemed: summary.amountRedeemed || 0,
            cardName: summary.cardName,
            month: summary.month
        });
        setIsEditDialogOpen(true);
    };

    const handleSaveEdit = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/monthly-summary/${editingSummary.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    adjustment: Number(editingSummary.adjustment),
                    notes: editingSummary.notes,
                    amountRedeemed: Number(editingSummary.amountRedeemed)
                })
            });

            if (!res.ok) throw new Error('Failed to update');

            toast.success("Updated successfully");
            setIsEditDialogOpen(false);
            if (onUpdate) onUpdate();

        } catch (err) {
            console.error(err);
            toast.error("Failed to update summary");
        }
    };

    const handleMarkFullReceived = async (item) => {
        try {
            // Set redeemed to match the total earned amount
            const fullAmount = item.totalEarned;

            const res = await fetch(`${API_BASE_URL}/monthly-summary/${item.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amountRedeemed: fullAmount
                })
            });

            if (!res.ok) throw new Error('Failed to mark as received');

            toast.success(`Marked ${item.cardName} (${item.month}) as fully received`);
            if (onUpdate) onUpdate();

        } catch (err) {
            console.error(err);
            toast.error("Failed to update status");
        }
    };

    // --- RENDER HELPERS ---

    const formatDate = (date) => {
        if (!date) return '-';
        if (date === 'Accumulating') return 'Accumulating';
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', { style: 'decimal' }).format(amount);
    };

    return (
        <div className="space-y-6">

            {/* Top Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unclaimed Cashback</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats.totalUnpaidCash)} ₫</div>
                        <p className="text-xs text-muted-foreground">Pending payment from banks</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Accumulating Points</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats.totalAccumulatingPoints)}</div>
                        <p className="text-xs text-muted-foreground">Value in points equivalent</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Received (Lifetime)</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats.totalReceived)} ₫</div>
                        <p className="text-xs text-muted-foreground">Total settled cashback</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-2">
                 <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by Month" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Months</SelectItem>
                        {months.map(m => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Main Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Cashback Tracker</CardTitle>
                    <CardDescription>Monitor payments, adjustments, and due dates.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Month</TableHead>
                                    <TableHead>Card</TableHead>
                                    <TableHead className="text-right">Total Earned</TableHead>
                                    <TableHead className="text-right">Adjustment</TableHead>
                                    <TableHead className="text-right">Received</TableHead>
                                    <TableHead>Payment 1</TableHead>
                                    <TableHead>Payment 2</TableHead>
                                    <TableHead className="text-right">Remaining</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredData.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.month}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span>{item.cardName}</span>
                                                <span className="text-xs text-muted-foreground">{item.bankName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-green-600">
                                            {formatCurrency(item.totalEarned)}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground">
                                            {item.adjustment !== 0 ? (
                                                 <span className={item.adjustment > 0 ? "text-green-600" : "text-red-600"}>
                                                    {item.adjustment > 0 ? '+' : ''}{formatCurrency(item.adjustment)}
                                                 </span>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(item.amountRedeemed)}
                                        </TableCell>

                                        {/* Tier 1 Payment Info */}
                                        <TableCell>
                                            <div className="flex flex-col space-y-1 text-sm">
                                                <div className="flex items-center space-x-2">
                                                    <Badge variant="outline">{item.tier1Method}</Badge>
                                                    <span className="font-medium">{formatCurrency(item.tier1Amount)}</span>
                                                </div>
                                                {item.tier1Amount > 0 && (
                                                    <div className="flex items-center space-x-2 text-xs">
                                                        <span className="text-muted-foreground">Due: {formatDate(item.tier1Date)}</span>
                                                        <Badge className={item.tier1Status.color + " h-5 px-1"}>
                                                            {item.tier1Status.label}
                                                        </Badge>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* Tier 2 Payment Info */}
                                        <TableCell>
                                            {item.tier2Amount > 0 ? (
                                                <div className="flex flex-col space-y-1 text-sm">
                                                    <div className="flex items-center space-x-2">
                                                        <Badge variant="outline">{item.tier2Method}</Badge>
                                                        <span className="font-medium">{formatCurrency(item.tier2Amount)}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-2 text-xs">
                                                        <span className="text-muted-foreground">Due: {formatDate(item.tier2Date)}</span>
                                                        <Badge className={item.tier2Status.color + " h-5 px-1"}>
                                                            {item.tier2Status.label}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">-</span>
                                            )}
                                        </TableCell>

                                        <TableCell className="text-right font-bold text-red-600">
                                            {item.remainingDue > 0 ? formatCurrency(item.remainingDue) : '-'}
                                        </TableCell>

                                        <TableCell className="text-right">
                                            <div className="flex justify-end space-x-2">
                                                {item.remainingDue > 0 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        title="Mark as Fully Received"
                                                        onClick={() => handleMarkFullReceived(item)}
                                                    >
                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEditClick(item)}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Cashback Details</DialogTitle>
                        <DialogDescription>
                            {editingSummary?.cardName} - {editingSummary?.month}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Adjustment</Label>
                            <Input
                                type="number"
                                value={editingSummary?.adjustment}
                                onChange={(e) => setEditingSummary({...editingSummary, adjustment: e.target.value})}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Received Amount</Label>
                            <Input
                                type="number"
                                value={editingSummary?.amountRedeemed}
                                onChange={(e) => setEditingSummary({...editingSummary, amountRedeemed: e.target.value})}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Notes</Label>
                            <Textarea
                                value={editingSummary?.notes}
                                onChange={(e) => setEditingSummary({...editingSummary, notes: e.target.value})}
                                className="col-span-3"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveEdit}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
