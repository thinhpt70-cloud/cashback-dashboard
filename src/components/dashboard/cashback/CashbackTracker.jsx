import React, { useState, useMemo } from 'react';
import {
    CheckCircle, AlertTriangle, Filter, Edit2, Clock, Calendar, Wallet,
    Coins, Gift
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../../ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "../../ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { cn } from "@/lib/utils";

import { calculateCashbackSplit, calculatePaymentDate, getPaymentStatus } from '../../../lib/cashback-logic';

// ==========================================
// 1. HELPERS & SUB-COMPONENTS
// ==========================================

const API_BASE_URL = '/api';

const currency = (n) => new Intl.NumberFormat('en-US', { style: 'decimal' }).format(n);

function CashVoucherCard({ item, onMarkReceived, onEdit }) {
    const isPaid = item.remainingDue <= 0;
    const isOverdue = !isPaid && (item.tier1Status?.status === 'overdue' || item.tier2Status?.status === 'overdue');
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        if (dateStr === 'Accumulating') return 'Accumulating';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-GB', {day: 'numeric', month: 'short'});
    };

    return (
        <div className={cn(
            "group relative flex flex-col justify-between border rounded-xl p-4 transition-all duration-200 hover:shadow-md bg-white dark:bg-slate-950",
            isPaid
                ? "border-slate-200 dark:border-slate-800 opacity-60"
                : isOverdue
                    ? "border-red-300 dark:border-red-900 bg-red-50/10"
                    : "border-emerald-500/50 dark:border-emerald-500/50 border-dashed"
        )}>
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0 uppercase">
                        {item.bankName ? item.bankName.substring(0,2) : 'CB'}
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 leading-tight line-clamp-1">{item.cardName}</h3>
                        <p className="text-xs text-slate-500 font-medium">{item.month}</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onEdit(item)}>
                    <Edit2 className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                </Button>
            </div>

            {/* Body */}
            <div className="text-center py-2 border-t border-b border-slate-100 dark:border-slate-800 my-1">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Earned</p>
                <div className="flex items-baseline justify-center gap-1">
                    <span className={cn("text-2xl font-black tracking-tight", isPaid ? "text-slate-400" : "text-emerald-600 dark:text-emerald-500")}>
                        {currency(item.totalEarned)}
                    </span>
                    <span className="text-xs font-medium text-slate-400">₫</span>
                </div>
                {item.tier2Amount > 0 && (
                    <div className="mt-1 flex justify-center gap-3 text-[10px] text-slate-500">
                        <span>Pri: <b>{currency(item.tier1Amount)}</b></span>
                        <span className="text-slate-300">|</span>
                        <span>Exc: <b>{currency(item.tier2Amount)}</b></span>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-3 space-y-3">
                {!isPaid && (
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Due Date:</span>
                        <span className={cn("font-medium flex items-center gap-1", isOverdue ? "text-red-600" : "text-slate-700 dark:text-slate-300")}>
                            {isOverdue && <AlertTriangle className="h-3 w-3" />}
                            {formatDate(item.tier1Date)}
                        </span>
                    </div>
                )}
                {isPaid ? (
                    <div className="w-full py-1.5 flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 rounded-md cursor-default">
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Settled</span>
                    </div>
                ) : (
                    <Button onClick={() => onMarkReceived(item)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm h-8 text-xs font-semibold">
                        Mark Received
                    </Button>
                )}
            </div>

            <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-50 dark:bg-slate-900 rounded-full border-r border-slate-200 dark:border-slate-800" />
            <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-50 dark:bg-slate-900 rounded-full border-l border-slate-200 dark:border-slate-800" />
        </div>
    );
}

function PointsLoyaltyCard({ cardName, bankName, totalPoints, lastUpdated, onRedeem, history }) {
    return (
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
            {/* Card Header (Visual) */}
            <div className="h-20 bg-gradient-to-r from-indigo-500 to-purple-600 p-4 relative">
                <div className="absolute top-0 right-0 p-3 opacity-20">
                    <Coins className="h-16 w-16 text-white" />
                </div>
                <div className="relative z-10 flex flex-col justify-between h-full">
                    <div className="flex justify-between items-start">
                        <span className="text-white/90 text-xs font-bold tracking-wider uppercase">{bankName}</span>
                        <Badge variant="outline" className="bg-white/10 text-white border-white/20 backdrop-blur-sm">Points</Badge>
                    </div>
                    <h3 className="text-white font-bold text-lg truncate">{cardName}</h3>
                </div>
            </div>

            {/* Card Body */}
            <div className="p-5">
                <div className="mb-6">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium mb-1">Available Balance</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{currency(totalPoints)}</span>
                        <span className="text-sm font-medium text-slate-500">pts</span>
                    </div>
                    {lastUpdated && (
                        <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Last updated: {lastUpdated}
                        </p>
                    )}
                </div>

                <div className="space-y-3">
                    <Button onClick={onRedeem} className="w-full bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm">
                        <Gift className="h-4 w-4 mr-2" /> Redeem Points
                    </Button>

                    {/* Mini History Preview */}
                    {history && history.length > 0 && (
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                            <p className="text-xs font-semibold text-slate-500 mb-2">Recent Earnings</p>
                            <div className="space-y-2">
                                {history.slice(0, 2).map((h, i) => (
                                    <div key={i} className="flex justify-between text-xs">
                                        <span className="text-slate-600 dark:text-slate-300">{h.month}</span>
                                        <span className="font-mono font-medium text-emerald-600">+{currency(h.amount)}</span>
                                    </div>
                                ))}
                                {history.length > 2 && (
                                    <p className="text-[10px] text-center text-slate-400 italic">+{history.length - 2} more records</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ==========================================
// 2. MAIN COMPONENT
// ==========================================

export default function CashbackTracker({
    cards,
    monthlySummary,
    onUpdate
}) {
    // --- STATE ---
    const [mainTab, setMainTab] = useState('cash'); // 'cash' | 'points'
    const [cashViewMode, setCashViewMode] = useState('month'); // 'month' | 'card'
    const [statusFilter, setStatusFilter] = useState('all');

    // Dialog States
    const [editingSummary, setEditingSummary] = useState(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isRedeemDialogOpen, setIsRedeemDialogOpen] = useState(false);
    const [redeemTarget, setRedeemTarget] = useState(null); // { cardName, balance, items: [] }
    const [redeemAmount, setRedeemAmount] = useState('');
    const [redeemNotes, setRedeemNotes] = useState('');

    // --- DATA PROCESSING ---
    const { cashItems, pointsByCard } = useMemo(() => {
        if (!monthlySummary || !cards) return { cashItems: [], pointsByCard: [] };

        const cardMap = new Map(cards.map(c => [c.id, c]));

        const cash = [];
        const points = [];
        const pCardMap = {}; // Group points by card for the Points Tab

        monthlySummary.forEach(summary => {
            const card = cardMap.get(summary.cardId);
            if (!card) return;

            const { total, tier1, tier2 } = calculateCashbackSplit(summary.actualCashback, summary.adjustment, card.overallMonthlyLimit);
            const tier1Method = card.tier1PaymentType || 'M+1';
            const tier2Method = card.tier2PaymentType || 'M+2';
            const redeemed = summary.amountRedeemed || 0;
            const tier1Paid = Math.min(redeemed, tier1);
            const tier2Paid = Math.max(0, redeemed - tier1);

            // Dates & Status
            const tier1Date = calculatePaymentDate(summary.month, tier1Method, card.statementDay);
            const tier1Status = getPaymentStatus(tier1, tier1Paid, tier1Date);
            const tier2Date = calculatePaymentDate(summary.month, tier2Method, card.statementDay);
            const tier2Status = getPaymentStatus(tier2, tier2Paid, tier2Date);

            // Note: If limit is 0, tier2 is 0. If isPoints is true, we generally assume the whole thing is points.
            // But logic supports split. For simplicity in categorization:
            // If primary tier is points, we treat as points item.
            const isPointsItem = (tier1Method && tier1Method.toLowerCase().includes('point'));

            const remainingDue = Math.max(0, total - redeemed);

            const item = {
                ...summary,
                cardName: card.name,
                bankName: card.bank,
                totalEarned: total,
                tier1Amount: tier1, tier1Date, tier1Status,
                tier2Amount: tier2, tier2Date, tier2Status,
                remainingDue,
                isPoints: isPointsItem,
            };

            if (isPointsItem) {
                points.push(item);
                // Aggregate for Points Tab
                if (!pCardMap[card.id]) {
                    pCardMap[card.id] = {
                        cardId: card.id,
                        cardName: card.name,
                        bankName: card.bank,
                        totalPoints: 0,
                        history: [],
                        items: [] // Keep track of raw items for FIFO redemption
                    };
                }
                // Only add to total if it hasn't been "redeemed" in our logic
                pCardMap[card.id].totalPoints += remainingDue;
                pCardMap[card.id].items.push(item);
                if (remainingDue > 0) {
                    pCardMap[card.id].history.push({ month: summary.month, amount: remainingDue });
                }
            } else {
                cash.push(item);
            }
        });

        // Sort history inside points cards
        Object.values(pCardMap).forEach(pc => {
            pc.history.sort((a, b) => b.month.localeCompare(a.month)); // Descending for history display
            pc.items.sort((a, b) => a.month.localeCompare(b.month));   // Ascending for FIFO redemption
        });

        return { cashItems: cash, pointsItems: points, pointsByCard: Object.values(pCardMap) };
    }, [monthlySummary, cards]);

    // --- CASH FILTERING & GROUPING ---
    const filteredCashItems = useMemo(() => {
        return cashItems.filter(item => {
            if (statusFilter === 'all') return true;
            if (statusFilter === 'completed') return item.remainingDue <= 0;
            if (statusFilter === 'unpaid') return item.remainingDue > 0;
            if (statusFilter === 'overdue') return item.remainingDue > 0 && (item.tier1Status?.status === 'overdue' || item.tier2Status?.status === 'overdue');
            return true;
        });
    }, [cashItems, statusFilter]);

    const groupedCashData = useMemo(() => {
        const groups = {};
        if (cashViewMode === 'month') {
            filteredCashItems.forEach(item => {
                if (!groups[item.month]) groups[item.month] = { title: item.month, items: [], due: 0, earned: 0 };
                groups[item.month].items.push(item);
                groups[item.month].due += item.remainingDue;
                groups[item.month].earned += item.totalEarned;
            });
            return Object.values(groups).sort((a, b) => b.title.localeCompare(a.title));
        } else {
            filteredCashItems.forEach(item => {
                const key = item.cardName;
                if (!groups[key]) groups[key] = { title: key, bank: item.bankName, items: [], due: 0, earned: 0 };
                groups[key].items.push(item);
                groups[key].due += item.remainingDue;
                groups[key].earned += item.totalEarned;
            });
            return Object.values(groups).sort((a, b) => b.due - a.due || a.title.localeCompare(b.title));
        }
    }, [filteredCashItems, cashViewMode]);

    // --- ACTIONS ---
    const handleEditClick = (item) => {
        setEditingSummary({
            id: item.id,
            adjustment: item.adjustment || 0,
            notes: item.notes || '',
            amountRedeemed: item.amountRedeemed || 0,
            cardName: item.cardName,
            month: item.month
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
            const fullAmount = item.totalEarned;
            const res = await fetch(`${API_BASE_URL}/monthly-summary/${item.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amountRedeemed: fullAmount
                })
            });

            if (!res.ok) throw new Error('Failed to mark as received');

            toast.success(`Marked ${item.cardName} as received`);
            if (onUpdate) onUpdate();
        } catch (err) {
            console.error(err);
            toast.error("Failed to update status");
        }
    };

    const handleOpenRedeem = (cardData) => {
        setRedeemTarget(cardData);
        setRedeemAmount('');
        setRedeemNotes('');
        setIsRedeemDialogOpen(true);
    };

    const handleRedeemConfirm = async () => {
        const amountToRedeem = Number(redeemAmount);
        if (!redeemTarget || isNaN(amountToRedeem) || amountToRedeem <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        if (amountToRedeem > redeemTarget.totalPoints) {
             toast.error("Cannot redeem more than available balance");
             return;
        }

        try {
            // FIFO Logic
            let remainingToRedeem = amountToRedeem;
            const updates = [];

            // We need to iterate over the items that have remaining balance
            // The items are already sorted by month ASC in pointsByCard logic
            const items = redeemTarget.items.filter(i => i.remainingDue > 0);

            for (const item of items) {
                if (remainingToRedeem <= 0) break;

                const availableInItem = item.remainingDue;
                const redeemFromThis = Math.min(remainingToRedeem, availableInItem);

                // Calculate new total redeemed for this item
                // current redeemed + this redemption
                const newAmountRedeemed = (item.amountRedeemed || 0) + redeemFromThis;

                // Append notes if provided
                const newNotes = redeemNotes
                    ? (item.notes ? `${item.notes}\n[Redeemed ${redeemFromThis}: ${redeemNotes}]` : `[Redeemed ${redeemFromThis}: ${redeemNotes}]`)
                    : item.notes;

                updates.push({
                    id: item.id,
                    amountRedeemed: newAmountRedeemed,
                    notes: newNotes
                });

                remainingToRedeem -= redeemFromThis;
            }

            // Execute all updates
            // In a real app, maybe batch this. Here we do sequential or parallel fetch.
            // Parallel is fine.
            await Promise.all(updates.map(u =>
                 fetch(`${API_BASE_URL}/monthly-summary/${u.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amountRedeemed: u.amountRedeemed,
                        notes: u.notes
                    })
                })
            ));

            toast.success(`Redeemed ${amountToRedeem} points from ${redeemTarget.cardName}`);
            setIsRedeemDialogOpen(false);
            if (onUpdate) onUpdate();

        } catch (err) {
            console.error(err);
            toast.error("Failed to process redemption");
        }
    };

    // --- RENDER ---
    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* MAIN TAB SWITCHER */}
            <div className="flex justify-center">
                <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-full inline-flex">
                    <button
                        onClick={() => setMainTab('cash')}
                        className={cn("px-6 py-2 rounded-full text-sm font-semibold transition-all", mainTab === 'cash' ? "bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200")}
                    >
                        Cashback
                    </button>
                    <button
                        onClick={() => setMainTab('points')}
                        className={cn("px-6 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2", mainTab === 'points' ? "bg-white dark:bg-slate-950 text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200")}
                    >
                        <Coins className="h-4 w-4" /> Rewards Points
                    </button>
                </div>
            </div>

            {/* ===== CASH VIEW ===== */}
            {mainTab === 'cash' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                    {/* Controls */}
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                        <Tabs value={cashViewMode} onValueChange={setCashViewMode} className="w-full md:w-auto">
                            <TabsList>
                                <TabsTrigger value="month" className="gap-2"><Clock className="h-4 w-4"/> By Month</TabsTrigger>
                                <TabsTrigger value="card" className="gap-2"><Calendar className="h-4 w-4"/> By Card</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative w-full md:w-[200px]">
                                <Filter className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-full pl-9">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Show All</SelectItem>
                                        <SelectItem value="unpaid">Unpaid Only</SelectItem>
                                        <SelectItem value="overdue">Overdue Only</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Cash Content */}
                    {groupedCashData.length === 0 ? (
                        <div className="text-center py-20 opacity-50 border-2 border-dashed border-slate-200 rounded-xl">
                            <Wallet className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                            <p className="text-slate-500">No cash records found.</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {groupedCashData.map((group) => (
                                <div key={group.title} className="space-y-3">
                                    <div className="flex items-end justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                                        <h2 className="text-lg font-bold tracking-tight flex items-center gap-2 text-slate-800 dark:text-slate-100">
                                            {group.title}
                                            {group.due > 0 && <Badge variant="destructive" className="ml-2">{currency(group.due)} ₫ Due</Badge>}
                                        </h2>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {group.items.map(item => (
                                            <CashVoucherCard key={item.id} item={item} onMarkReceived={handleMarkFullReceived} onEdit={handleEditClick} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ===== POINTS VIEW ===== */}
            {mainTab === 'points' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">

                    {/* Points Hero Stats */}
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mr-10 -mt-10 bg-white/10 h-64 w-64 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="relative z-10">
                            <p className="text-indigo-100 font-medium mb-1">Total Rewards Value</p>
                            <h2 className="text-4xl font-bold tracking-tight">
                                {currency(pointsByCard.reduce((acc, c) => acc + c.totalPoints, 0))} <span className="text-lg font-normal opacity-80">pts</span>
                            </h2>
                            <p className="text-sm text-indigo-200 mt-2"> across {pointsByCard.length} cards</p>
                        </div>
                    </div>

                    {/* Points Card Grid */}
                    {pointsByCard.length === 0 ? (
                        <div className="text-center py-20 opacity-50 border-2 border-dashed border-slate-200 rounded-xl">
                            <Coins className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                            <p className="text-slate-500">No points cards active.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pointsByCard.map(card => (
                                <PointsLoyaltyCard
                                    key={card.cardId}
                                    cardName={card.cardName}
                                    bankName={card.bankName}
                                    totalPoints={card.totalPoints}
                                    lastUpdated={card.history[0]?.month || 'N/A'}
                                    history={card.history}
                                    onRedeem={() => handleOpenRedeem(card)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* EDIT DIALOG (CASH) */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Details</DialogTitle>
                        <DialogDescription>{editingSummary?.cardName} • {editingSummary?.month}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Adj.</Label>
                            <Input type="number" value={editingSummary?.adjustment} onChange={(e) => setEditingSummary({...editingSummary, adjustment: e.target.value})} className="col-span-3"/>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Received</Label>
                            <Input type="number" value={editingSummary?.amountRedeemed} onChange={(e) => setEditingSummary({...editingSummary, amountRedeemed: e.target.value})} className="col-span-3"/>
                        </div>
                        <div className="grid gap-2">
                            <Label>Notes</Label>
                            <Textarea value={editingSummary?.notes} onChange={(e) => setEditingSummary({...editingSummary, notes: e.target.value})}/>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveEdit}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* REDEEM DIALOG (POINTS) */}
            <Dialog open={isRedeemDialogOpen} onOpenChange={setIsRedeemDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Gift className="h-5 w-5 text-indigo-600" /> Redeem Points
                        </DialogTitle>
                        <DialogDescription>
                            {redeemTarget?.cardName} (Bal: {currency(redeemTarget?.totalPoints || 0)})
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800 text-sm text-indigo-700 dark:text-indigo-300">
                            Confirming this will mark points as "Redeemed" in your ledger. This action helps track what you've spent vs. accumulated.
                        </div>
                        <div className="grid gap-2">
                            <Label>Amount to Redeem</Label>
                            <Input
                                type="number"
                                placeholder="Enter points amount..."
                                value={redeemAmount}
                                onChange={(e) => setRedeemAmount(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Redemption Notes (Optional)</Label>
                            <Input
                                placeholder="e.g., Agoda voucher, Statement credit..."
                                value={redeemNotes}
                                onChange={(e) => setRedeemNotes(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRedeemDialogOpen(false)}>Cancel</Button>
                        <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleRedeemConfirm}>Confirm Redemption</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
