import React, { useState, useMemo } from 'react';
import {
    CheckCircle, AlertTriangle, Filter, Edit2, Clock, Calendar, Wallet,
    Coins, Gift, TrendingUp, List, ArrowDown, Eye, Info, Lock, ClipboardCheck, X
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Checkbox } from "../../ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "../../ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Progress } from "../../ui/progress";
import { Card, CardContent, CardHeader, CardFooter } from "../../ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../ui/table";
import { cn } from "@/lib/utils";
import StatCard from "../../shared/StatCard";
import SharedTransactionsDialog from '@/components/shared/SharedTransactionsDialog';
import { PointsDetailSheet } from './components/PointsDetailSheet';
import { RedeemPointsDialog } from './components/RedeemPointsDialog';
import { UpdateDetailsDialog } from './components/UpdateDetailsDialog';

import { calculateCashbackSplit, calculatePaymentDate, getPaymentStatus, isStatementFinalized, RE_REDEMPTION_LOG } from '../../../lib/cashback-logic';
import { fmtYMShort } from '../../../lib/formatters';

// ==========================================
// 1. HELPERS & SUB-COMPONENTS
// ==========================================

const API_BASE_URL = '/api';

const currency = (n) => new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 0 }).format(n);

function getCardActivities(items, statementDay) {
    const activities = [];
    const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'});

    items.forEach(item => {
        const getYearMonth = (mStr) => {
            if (mStr.includes('-')) {
                const parts = mStr.split('-');
                return [Number(parts[0]), Number(parts[1])];
            }
            if (mStr.length === 6) {
                return [Number(mStr.substring(0, 4)), Number(mStr.substring(4, 6))];
            }
            return [new Date().getFullYear(), new Date().getMonth() + 1]; // Fallback
        };

        const [y, m] = getYearMonth(item.month);

        // 1. Earned
        if (item.totalEarned > 0) {
            // Calculate Statement Date: Month + Statement Day
            const daysInMonth = new Date(y, m, 0).getDate(); // Day 0 of next month = last day of current
            const day = Math.min(statementDay || 1, daysInMonth);

            const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            activities.push({
                type: 'earned',
                amount: item.totalEarned,
                date: dateStr,
                displayDate: fmtDate(dateStr),
                desc: 'Points Added'
            });
        }

        // 2. Redeemed
        if (item.notes) {
            // Use shared Regex
            const regex = new RegExp(RE_REDEMPTION_LOG); // Copy regex
            const legacyDateRegex = /(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})\s+redemption/i;

            let match;
            while ((match = regex.exec(item.notes)) !== null) {
                // Remove commas before parsing number
                const amountStr = match[1].replace(/,/g, '');
                const amount = Number(amountStr);

                let dateRaw = match[2];
                let noteContent = match[3];

                // Legacy: Check if noteContent contains a date like "31 Oct 2025 redemption"
                if (!dateRaw && noteContent) {
                    const dateMatch = noteContent.match(legacyDateRegex);
                    if (dateMatch) {
                        const day = dateMatch[1];
                        const monthStr = dateMatch[2];
                        const year = dateMatch[3];
                        const month = new Date(`${monthStr} 1 2000`).getMonth() + 1; // Parse month name
                        dateRaw = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        noteContent = 'Redemption'; // Normalize description
                    }
                }

                let dateStr = dateRaw;
                if (!dateStr) {
                    // Fallback to item month end
                     const daysInMonth = new Date(y, m, 0).getDate();
                     dateStr = `${y}-${String(m).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
                }

                // If dateStr contains time, we want to show it in displayDate?
                // The current fmtDate only shows Day-Month-Year.
                // For "Recent Activity" on card, keeping it compact is usually better,
                // but we can support time if needed. The request asked for "History view" explicitly to show time.
                // For here, we'll keep standard date format but ensure dateStr is valid string for sorting.

                activities.push({
                    type: 'redeemed',
                    amount: amount,
                    date: dateStr,
                    displayDate: fmtDate(dateStr),
                    desc: noteContent || 'Redeemed'
                });
            }
        }
    });

    return activities.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
}

function CashVoucherCard({ item, onMarkReceived, onEdit, onViewTransactions, onToggleReviewed, statementDay, isSelectionMode, isSelected, onToggleSelect }) {
    const isPaid = item.remainingDue <= 0;
    const isReviewed = item.reviewed;
    
    // 1. Calculate paid status for specific tiers
    const tier1Paid = (item.amountRedeemed || 0) >= item.tier1Amount;
    const tier2Paid = (item.amountRedeemed || 0) >= (item.tier1Amount + item.tier2Amount);
    const hasTier2 = item.tier2Amount > 0;

    // 2. Calculate specific overdue status for each tier
    const isTier1Overdue = !tier1Paid && item.tier1Status?.status === 'overdue';
    const isTier2Overdue = hasTier2 && !tier2Paid && item.tier2Status?.status === 'overdue';

    // 3. Global card overdue status (for the border)
    const isCardOverdue = !isPaid && (isTier1Overdue || isTier2Overdue);
    const isStatementPending = !isStatementFinalized(item.month, statementDay);

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        if (dateStr === 'Accumulating') return 'Accumulating';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'});
    };

    return (
        <Card className={cn(
            "group relative flex flex-col justify-between transition-all duration-200 hover:shadow-lg",
            isPaid
                ? "border-slate-200 dark:border-slate-800 opacity-70 bg-slate-50/50 dark:bg-slate-900/20"
                : isCardOverdue
                    ? "border-red-200 dark:border-red-900/50 bg-red-50/20 shadow-red-100/20"
                    : "border-emerald-200 dark:border-emerald-800/50 bg-white dark:bg-slate-950"
        )}>
            {/* Header */}
            <CardHeader className="p-4 pb-2 flex-row items-start justify-between space-y-0">
                <div className="flex items-center gap-3">
                    {isSelectionMode && (
                        <Checkbox
                            checked={isSelected}
                            onCheckedChange={onToggleSelect}
                            className="mr-1"
                        />
                    )}
                    <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0 uppercase border border-slate-200 dark:border-slate-700">
                        {item.bankName ? item.bankName.substring(0,2) : 'CB'}
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 leading-tight line-clamp-1">{item.cardName}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-slate-500 font-medium">{fmtYMShort(item.month)}</p>
                            {isReviewed && (
                                <Badge variant="outline" className="text-[10px] h-4 px-1 py-0 font-normal text-indigo-600 border-indigo-200 bg-indigo-50 dark:bg-indigo-950/30 flex items-center gap-1">
                                    <ClipboardCheck className="h-2.5 w-2.5" /> Reviewed
                                </Badge>
                            )}
                            {isStatementPending && !isPaid && (
                                <Badge variant="secondary" className="text-[10px] h-4 px-1 py-0 font-normal bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200">
                                    <Info className="h-2.5 w-2.5 mr-1" /> Pending
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex gap-1 -mr-2 -mt-2">
                     <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-7 w-7 transition-opacity", isReviewed ? "text-indigo-600 opacity-100" : "opacity-30 group-hover:opacity-100 text-slate-400 hover:text-indigo-600")}
                        onClick={() => onToggleReviewed(item)}
                        title={isReviewed ? "Mark Unreviewed" : "Mark Reviewed"}
                    >
                        <ClipboardCheck className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-30 group-hover:opacity-100 transition-opacity" onClick={() => onViewTransactions(item)}>
                         <Eye className="h-4 w-4 text-slate-500" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-30 group-hover:opacity-100 transition-opacity" onClick={() => onEdit(item)}>
                        <Edit2 className="h-4 w-4 text-slate-500" />
                    </Button>
                </div>
            </CardHeader>

            {/* Body */}
            <CardContent className="p-4 py-3 border-t border-b border-dashed border-slate-100 dark:border-slate-800/50 my-1 relative">
                 {/* Voucher Cutouts */}
                 <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-50 dark:bg-slate-900 rounded-full border-r border-slate-200 dark:border-slate-800 z-10" />
                 <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-50 dark:bg-slate-900 rounded-full border-l border-slate-200 dark:border-slate-800 z-10" />

                <div className="text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Total Earned</p>
                    <div className="flex items-baseline justify-center gap-1">
                        <span className={cn("text-2xl font-bold tracking-tight", isPaid ? "text-slate-400" : "text-emerald-600 dark:text-emerald-500")}>
                            {currency(item.totalEarned)}
                        </span>
                        <span className="text-xs font-medium text-slate-400">₫</span>
                    </div>
                    {item.tier2Amount > 0 && (
                        <div className="mt-2 flex justify-center gap-3 text-[10px] text-slate-500 bg-slate-50 dark:bg-slate-900/50 rounded-full py-0.5 px-3 mx-auto w-fit">
                            <span>P: <b className="text-slate-700 dark:text-slate-300">{currency(item.tier1Amount)}</b></span>
                            <span className="text-slate-300">|</span>
                            <span>E: <b className="text-slate-700 dark:text-slate-300">{currency(item.tier2Amount)}</b></span>
                        </div>
                    )}
                </div>
            </CardContent>

            {/* Footer */}
            <CardFooter className="p-4 block space-y-3">
                {!isPaid && (
                    <div className="flex justify-between items-start text-xs">
                        <span className="text-slate-500 mt-0.5 font-medium">Expected Payment</span>
                        
                        <div className="flex flex-col items-end gap-1.5">
                            {/* Tier 1 Date */}
                            <div className="flex items-center gap-1.5">
                                 {hasTier2 && <span className="text-slate-400 text-[10px] uppercase tracking-wide">Tier 1</span>}
                                 <span className={cn("font-medium flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800", isTier1Overdue && "bg-red-50 text-red-600 border-red-100")}>
                                    {isTier1Overdue && <AlertTriangle className="h-3 w-3" />}
                                    {formatDate(item.tier1Date)}
                                    {tier1Paid && hasTier2 && <CheckCircle className="h-3 w-3 text-emerald-500" />}
                                </span>
                            </div>
                            
                            {/* Tier 2 Date */}
                            {hasTier2 && (
                                 <div className="flex items-center gap-1.5">
                                     <span className="text-slate-400 text-[10px] uppercase tracking-wide">Tier 2</span>
                                     <span className={cn("font-medium flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800", isTier2Overdue && "bg-red-50 text-red-600 border-red-100")}>
                                        {isTier2Overdue && <AlertTriangle className="h-3 w-3" />}
                                        {formatDate(item.tier2Date)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Buttons */}
                {isPaid ? (
                    <div className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-lg cursor-default">
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Settled & Reviewed</span>
                    </div>
                ) : (
                    <div className="grid gap-2">
                        {/* Tier 1 Button */}
                        {!tier1Paid && (
                            <Button
                                size="sm"
                                onClick={() => onMarkReceived(item, 'tier1')}
                                disabled={isStatementPending}
                                className={cn(
                                    "w-full h-9 text-xs font-semibold shadow-sm",
                                    isStatementPending
                                        ? "opacity-60 cursor-not-allowed bg-slate-100 text-slate-500 hover:bg-slate-100"
                                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                )}
                            >
                                {isStatementPending ? "Pending Statement" : (hasTier2 ? "Mark Tier 1 Received" : "Mark Received")}
                            </Button>
                        )}

                        {/* Tier 2 Button */}
                        {hasTier2 && tier1Paid && !tier2Paid && (
                            <Button
                                size="sm"
                                onClick={() => onMarkReceived(item, 'tier2')}
                                disabled={isStatementPending}
                                className={cn(
                                    "w-full h-9 text-xs font-semibold shadow-sm",
                                    isStatementPending
                                        ? "opacity-60 cursor-not-allowed bg-slate-100 text-slate-500 hover:bg-slate-100"
                                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                )}
                            >
                                {isStatementPending ? "Pending Statement" : "Mark Tier 2 Received"}
                            </Button>
                        )}
                    </div>
                )}
            </CardFooter>
        </Card>
    );
}

function PointsLoyaltyCard({ cardName, bankName, totalPoints, minPointsRedeem, onRedeem, onViewDetails, items, statementDay }) {
    const isRedeemable = totalPoints >= (minPointsRedeem || 0);
    const progress = minPointsRedeem > 0 ? Math.min((totalPoints / minPointsRedeem) * 100, 100) : 100;

    // Get Activities
    const activities = useMemo(() => getCardActivities(items || [], statementDay), [items, statementDay]);

    return (
        <div className="group relative flex flex-col justify-between border border-slate-200 dark:border-slate-800 rounded-xl p-4 transition-all duration-200 hover:shadow-md bg-white dark:bg-slate-950">
             {/* Header */}
             <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-indigo-50 dark:bg-indigo-900/50 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0 uppercase border border-indigo-100 dark:border-indigo-800">
                        {bankName ? bankName.substring(0,2) : 'CB'}
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 leading-tight line-clamp-1">{cardName}</h3>
                        <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Points Rewards</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-80 hover:opacity-100 transition-opacity" onClick={onViewDetails}>
                     <List className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                </Button>
            </div>

            {/* Body */}
            <div className={cn("text-center py-4 border-t border-slate-100 dark:border-slate-800 my-1", activities.length === 0 && "border-b")}>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Available Balance</p>
                <div className="flex items-baseline justify-center gap-1">
                    <span className="text-2xl font-black tracking-tight text-indigo-600 dark:text-indigo-400">
                        {currency(totalPoints)}
                    </span>
                    <span className="text-xs font-medium text-slate-400">pts</span>
                </div>

                {/* Min Redeem Progress */}
                {minPointsRedeem > 0 && (
                    <div className="mt-3 px-4">
                        <div className="flex justify-between text-[10px] mb-1.5 font-medium">
                            <span className={cn(isRedeemable ? "text-emerald-600" : "text-slate-400")}>
                                {isRedeemable ? "Redeemable" : "Accumulating"}
                            </span>
                            <span className="text-slate-400">{currency(minPointsRedeem)} min</span>
                        </div>
                        <Progress value={progress} className="h-1.5 bg-slate-100 dark:bg-slate-800" indicatorClassName={isRedeemable ? "bg-emerald-500" : "bg-indigo-400"} />
                    </div>
                )}
            </div>

            {/* Recent Activity */}
            {activities.length > 0 && (
                <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2">Recent Activity</p>
                    <div className="space-y-2">
                        {activities.map((act, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs">
                                <div className="flex flex-col">
                                    <span className="font-medium text-slate-700 dark:text-slate-300 line-clamp-1 max-w-[120px]" title={act.desc}>
                                        {act.desc}
                                    </span>
                                    <span className="text-[10px] text-slate-400">{act.displayDate}</span>
                                </div>
                                <span className={cn("font-bold", act.type === 'earned' ? "text-emerald-600" : "text-orange-600")}>
                                    {act.type === 'earned' ? '+' : '-'}{currency(act.amount)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

             {/* Footer */}
             <div className="mt-3">
                 <Button
                    onClick={onRedeem}
                    disabled={!isRedeemable}
                    className={cn(
                        "w-full h-8 text-xs font-semibold shadow-sm",
                         !isRedeemable ? "opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 hover:bg-slate-100" : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    )}
                 >
                    {!isRedeemable ? (
                        <>
                            <Lock className="h-3 w-3 mr-1.5" />
                            {minPointsRedeem > 0 ? `Reach ${currency(minPointsRedeem)}` : "Unavailable"}
                        </>
                    ) : (
                        <>
                            <Gift className="h-3 w-3 mr-1.5" />
                            Redeem Points
                        </>
                    )}
                </Button>
             </div>

            <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-50 dark:bg-slate-900 rounded-full border-r border-slate-200 dark:border-slate-800" />
            <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-50 dark:bg-slate-900 rounded-full border-l border-slate-200 dark:border-slate-800" />
        </div>
    );
}

// ==========================================
// 2. MAIN COMPONENT
// ==========================================

export default function CashbackTracker({
    cards,
    monthlySummary,
    onUpdate,
    rules,
    monthlyCategorySummary,
    onEditTransaction,
    onTransactionDeleted,
    onBulkDelete
}) {
    // --- STATE ---
    const [mainTab, setMainTab] = useState('cash'); // 'cash' | 'points'
    const [cashViewMode, setCashViewMode] = useState('month'); // 'month' | 'card' | 'list'
    const [statusFilter, setStatusFilter] = useState('unpaid');

    // New state for list view grouping
    const [listGroupBy, setListGroupBy] = useState('month'); // 'month' | 'card'
    const [showAllGroups, setShowAllGroups] = useState(false); // For accordion logic

    // Selection State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());

    // Dialog States
    const [editingSummary, setEditingSummary] = useState(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isRedeemDialogOpen, setIsRedeemDialogOpen] = useState(false);
    const [redeemTarget, setRedeemTarget] = useState(null); // { cardName, balance, items: [] }
    const [optimisticData, setOptimisticData] = useState({});

    // Points Details Sheet
    const [pointsDetailOpen, setPointsDetailOpen] = useState(false);
    const [selectedPointsCardId, setSelectedPointsCardId] = useState(null);

    // Shared Transaction Dialog
    const [txDialog, setTxDialog] = useState({
        isOpen: false,
        isLoading: false,
        transactions: [],
        title: ''
    });

    // --- DATA PROCESSING ---
    const { cashItems, pointsByCard, stats, cardMap } = useMemo(() => {
        if (!monthlySummary || !cards) return { cashItems: [], pointsByCard: [], stats: null, cardMap: new Map() };

        const cMap = new Map(cards.map(c => [c.id, c]));

        const cash = [];
        const points = [];
        const pCardMap = {}; // Group points by card for the Points Tab

        monthlySummary.forEach(originalSummary => {
            // Apply optimistic override if exists
            const optimistic = optimisticData[originalSummary.id] || {};
            const summary = {
                ...originalSummary,
                ...optimistic,
                // Ensure reviewed status is taken from optimistic data if present, otherwise fallback to original
                reviewed: optimistic.reviewed !== undefined ? optimistic.reviewed : (originalSummary.reviewed || false)
            };

            const card = cMap.get(summary.cardId);
            if (!card) return;

            const { total, tier1, tier2 } = calculateCashbackSplit(summary.actualCashback, summary.adjustment, card.overallMonthlyLimit);
            const tier1Method = card.tier1PaymentType || 'M+1';
            const tier2Method = card.tier2PaymentType || 'M+2';
            const redeemed = summary.amountRedeemed || 0;
            const tier1Paid = Math.min(redeemed, tier1);
            const tier2Paid = Math.max(0, redeemed - tier1);

            // Dates & Status (Note: paymentDueDay is no longer used for calc, but kept in signature or removed based on logic)
            // Updated to remove paymentDueDay from call as per new logic requirements
            const tier1Date = calculatePaymentDate(summary.month, tier1Method, card.statementDay);
            const tier1Status = getPaymentStatus(tier1, tier1Paid, tier1Date);
            const tier2Date = calculatePaymentDate(summary.month, tier2Method, card.statementDay);
            const tier2Status = getPaymentStatus(tier2, tier2Paid, tier2Date);

            // Note: If limit is 0, tier2 is 0. If isPoints is true, we generally assume the whole thing is points.
            // But logic supports split. For simplicity in categorization:
            // If primary tier is points, we treat as points item.
            const isPointsItem = (tier1Method && String(tier1Method).toLowerCase().includes('point'));

            const remainingDue = Math.max(0, total - redeemed);

            const item = {
                ...summary,
                cardName: card.name,
                bankName: card.bank,
                statementDay: card.statementDay, // Add statementDay for pending logic
                totalEarned: total,
                tier1Amount: tier1, tier1Date, tier1Status,
                tier2Amount: tier2, tier2Date, tier2Status,
                remainingDue,
                isPoints: isPointsItem,
                // reviewed is already merged in 'summary' above, but we keep it explicit if needed.
                // We don't need to re-default it here as 'summary' already has the merged value.
                reviewed: summary.reviewed,
            };

            if (isPointsItem) {
                points.push(item);
                // Aggregate for Points Tab
                if (!pCardMap[card.id]) {
                    pCardMap[card.id] = {
                        cardId: card.id,
                        cardName: card.name,
                        bankName: card.bank,
                        minPointsRedeem: card.minPointsRedeem || 0, // Ensure this is mapped
                        totalAmountRedeemed: card.totalAmountRedeemed || 0,
                        statementDay: card.statementDay,
                        totalPoints: 0,
                        totalRedeemed: 0,
                        history: [],
                        items: [] // Keep track of raw items for FIFO redemption
                    };
                }
                // Only add to total if it hasn't been "redeemed" in our logic
                pCardMap[card.id].totalPoints += remainingDue;
                pCardMap[card.id].totalRedeemed += (item.amountRedeemed || 0);
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

        // Stats Calculation
        const totalCashback = cash.reduce((sum, item) => sum + item.totalEarned, 0);
        const amountReceived = cash.reduce((sum, item) => sum + (item.amountRedeemed || 0), 0);
        const amountPending = cash.reduce((sum, item) => sum + item.remainingDue, 0);

        const uniqueMonths = new Set(cash.map(i => i.month)).size;
        const avgMonthlyEarnings = uniqueMonths > 0 ? totalCashback / uniqueMonths : 0;

        const stats = {
            totalCashback,
            amountReceived,
            amountPending,
            avgMonthlyEarnings
        };

        return { cashItems: cash, pointsItems: points, pointsByCard: Object.values(pCardMap), stats, cardMap: cMap };
    }, [monthlySummary, cards, optimisticData]);

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
        const mode = cashViewMode === 'list' ? listGroupBy : cashViewMode;

        if (mode === 'month') {
            filteredCashItems.forEach(item => {
                // Use original YYYYMM as ID for sorting, but format the title
                if (!groups[item.month]) groups[item.month] = {
                    id: item.month,
                    title: fmtYMShort(item.month),
                    items: [],
                    due: 0,
                    earned: 0
                };
                groups[item.month].items.push(item);

                // Only count as "Due" for the header if the statement is finalized
                if (isStatementFinalized(item.month, item.statementDay)) {
                    groups[item.month].due += item.remainingDue;
                }

                groups[item.month].earned += item.totalEarned;
            });
            // Sort by ID (YYYYMM) descending
            return Object.values(groups).sort((a, b) => b.id.localeCompare(a.id));
        } else {
            filteredCashItems.forEach(item => {
                const key = item.cardName;
                if (!groups[key]) groups[key] = { title: key, bank: item.bankName, items: [], due: 0, earned: 0 };
                groups[key].items.push(item);

                // Only count as "Due" for the header if the statement is finalized
                if (isStatementFinalized(item.month, item.statementDay)) {
                    groups[key].due += item.remainingDue;
                }

                groups[key].earned += item.totalEarned;
            });
            return Object.values(groups).sort((a, b) => b.due - a.due || a.title.localeCompare(b.title));
        }
    }, [filteredCashItems, cashViewMode, listGroupBy]);

    // --- ACTIONS ---
    const handleEditClick = (item) => {
        setEditingSummary({
            id: item.id,
            adjustment: item.adjustment || 0,
            notes: item.notes || '',
            amountRedeemed: item.amountRedeemed || 0,
            cardName: item.cardName,
            month: item.month,
            isPoints: item.isPoints, // PASSING CONTEXT
            totalEarned: item.totalEarned // PASSING CONTEXT
        });
        setIsEditDialogOpen(true);
    };

    const handleSaveEdit = async (updatedItem) => {
        // Updated to receive updatedItem from dialog component
        try {
            const res = await fetch(`${API_BASE_URL}/monthly-summary/${updatedItem.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    adjustment: Number(updatedItem.adjustment),
                    notes: updatedItem.notes,
                    amountRedeemed: Number(updatedItem.amountRedeemed)
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

    // --- REVIEWED LOGIC ---
    const handleToggleReviewed = async (item) => {
        const newStatus = !item.reviewed;

        // Optimistic
        setOptimisticData(prev => ({
            ...prev,
            [item.id]: { reviewed: newStatus }
        }));

        try {
            const res = await fetch(`${API_BASE_URL}/monthly-summary/${item.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reviewed: newStatus })
            });

            if (!res.ok) throw new Error("Failed to update review status");

            if (onUpdate) onUpdate();
            toast.success(newStatus ? "Marked as Reviewed" : "Marked as Unreviewed");

        } catch (err) {
            console.error(err);
            toast.error("Failed to update status");
            // Revert
            setOptimisticData(prev => {
                const newState = { ...prev };
                delete newState[item.id];
                return newState;
            });
        }
    };

    // --- BULK SELECTION LOGIC ---
    const toggleSelectionMode = () => {
        setIsSelectionMode(prev => {
            if (prev) setSelectedIds(new Set()); // Clear on exit
            return !prev;
        });
    };

    const handleToggleSelect = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleBulkReview = async (status) => {
        const ids = Array.from(selectedIds);
        if (ids.length === 0) return;

        // Optimistic
        const optimisticUpdates = {};
        ids.forEach(id => {
            optimisticUpdates[id] = { reviewed: status };
        });
        setOptimisticData(prev => ({ ...prev, ...optimisticUpdates }));

        try {
            const res = await fetch(`${API_BASE_URL}/monthly-summary/bulk-review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids, reviewed: status })
            });

            if (!res.ok) throw new Error("Bulk update failed");

            toast.success(`Updated ${ids.length} items`);
            setSelectedIds(new Set());
            setIsSelectionMode(false);
            if (onUpdate) onUpdate();

        } catch (err) {
            console.error(err);
            toast.error("Failed to update items");
            // Revert is complex here, generally rely on refetch or specific error handling
            // For now, clear optimistic to prevent stuck state
            setOptimisticData(prev => {
                const newState = { ...prev };
                ids.forEach(id => delete newState[id]);
                return newState;
            });
        }
    };


    const handleMarkReceived = async (item, tier = 'full') => {
        // 0. Calculate values
        const originalAmountRedeemed = item.amountRedeemed || 0;
        let newAmountRedeemed = item.totalEarned; // Default full

        // Logic for partial/sequential tiers
        if (tier === 'tier1') {
            newAmountRedeemed = item.tier1Amount;
        } else if (tier === 'tier2') {
            // Tier 2 implies Tier 1 is already paid, so total is full amount
            newAmountRedeemed = item.tier1Amount + item.tier2Amount;
        }

        // 1. Optimistic Update
        setOptimisticData(prev => ({
            ...prev,
            [item.id]: { amountRedeemed: newAmountRedeemed }
        }));

        // 2. Define Revert Function (for Undo)
        const revert = () => {
             setOptimisticData(prev => ({
                ...prev,
                [item.id]: { amountRedeemed: originalAmountRedeemed }
            }));

            // We must send a request to server to ensure it rolls back
            // (in case the previous request already succeeded)
             fetch(`${API_BASE_URL}/monthly-summary/${item.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amountRedeemed: originalAmountRedeemed })
            }).then(() => {
                 if (onUpdate) onUpdate();
            }).catch(err => {
                 console.error("Undo failed", err);
                 toast.error("Failed to undo");
            });
        };

        // 3. Show Toast with Undo
        toast.success(`Updated ${item.cardName} payment status`, {
            action: {
                label: 'Undo',
                onClick: () => revert()
            }
        });

        // 4. Perform API Call
        try {
            const res = await fetch(`${API_BASE_URL}/monthly-summary/${item.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amountRedeemed: newAmountRedeemed
                })
            });

            if (!res.ok) throw new Error('Failed to mark as received');

            // Success - trigger update to eventual consistency
            if (onUpdate) onUpdate();

        } catch (err) {
            console.error(err);
            toast.error("Failed to update status");
            // Revert optimistic update on error
            setOptimisticData(prev => {
                const newState = { ...prev };
                delete newState[item.id];
                return newState;
            });
        }
    };

    const handleOpenRedeem = (cardData) => {
        setRedeemTarget(cardData);
        // Cleaned up reset of other states as they are now handled inside the dialog component
        setIsRedeemDialogOpen(true);
    };

    const handleOpenDetails = (cardData) => {
        setSelectedPointsCardId(cardData.cardId);
        setPointsDetailOpen(true);
    };

    const handleRedeemConfirm = async ({ amount, notes, date }) => {
        // Refactored to accept object from RedeemPointsDialog
        const amountToRedeem = Number(amount);

        // Validation handled in dialog, double check here
        if (!redeemTarget || isNaN(amountToRedeem) || amountToRedeem <= 0) {
            toast.error("Invalid amount");
            return;
        }

        if (amountToRedeem > redeemTarget.totalPoints) {
             toast.error("Cannot redeem more than available balance");
             return;
        }

        // FIFO Logic
        let remainingToRedeem = amountToRedeem;
        const updates = [];

        // We need to iterate over the items that have remaining balance
        // The items are already sorted by month ASC in pointsByCard logic
        const items = redeemTarget.items.filter(i => i.remainingDue > 0);

        // Use provided date or fallback to current YYYY-MM-DD HH:MM
        let dateStr = date;
        if (!dateStr) {
             const now = new Date();
             // Simple format if user cleared input for some reason
             dateStr = now.toISOString().slice(0, 16).replace('T', ' ');
        }

        for (const item of items) {
            if (remainingToRedeem <= 0) break;

            const availableInItem = item.remainingDue;
            const redeemFromThis = Math.min(remainingToRedeem, availableInItem);

            // Calculate new total redeemed for this item
            // current redeemed + this redemption
            const newAmountRedeemed = (item.amountRedeemed || 0) + redeemFromThis;

            // Append notes if provided
            // Format: [Redeemed <amount> on <YYYY-MM-DD HH:MM>: <note>]
            const noteEntry = `[Redeemed ${redeemFromThis} on ${dateStr}${notes ? ': ' + notes : ''}]`;
            const newNotes = item.notes ? `${item.notes}\n${noteEntry}` : noteEntry;

            updates.push({
                id: item.id,
                amountRedeemed: newAmountRedeemed,
                notes: newNotes,
                // Store original for undo
                originalAmountRedeemed: item.amountRedeemed || 0,
                originalNotes: item.notes
            });

            remainingToRedeem -= redeemFromThis;
        }

        // 1. Optimistic Update
        const optimisticUpdates = {};
        updates.forEach(u => {
            optimisticUpdates[u.id] = {
                amountRedeemed: u.amountRedeemed,
                notes: u.notes
            };
        });

        setOptimisticData(prev => ({
            ...prev,
            ...optimisticUpdates
        }));

        // Close dialog immediately
        setIsRedeemDialogOpen(false);

        // 2. Define Revert Function (for Undo)
        const revert = () => {
             // Revert local state
             const revertUpdates = {};
             updates.forEach(u => {
                 revertUpdates[u.id] = {
                     amountRedeemed: u.originalAmountRedeemed,
                     notes: u.originalNotes
                 };
             });

             setOptimisticData(prev => ({
                ...prev,
                ...revertUpdates
            }));

            // Send requests to server to roll back
            Promise.all(updates.map(u =>
                 fetch(`${API_BASE_URL}/monthly-summary/${u.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amountRedeemed: u.originalAmountRedeemed,
                        notes: u.originalNotes
                    })
                })
            )).then(() => {
                 if (onUpdate) onUpdate();
            }).catch(err => {
                 console.error("Undo failed", err);
                 toast.error("Failed to undo redemption");
            });
        };

        // 3. Show Toast
        toast.success(`Redeemed ${amountToRedeem} points from ${redeemTarget.cardName}`, {
            action: {
                label: 'Undo',
                onClick: () => revert()
            }
        });

        try {
            // Execute all updates
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

            if (onUpdate) onUpdate();

        } catch (err) {
            console.error(err);
            toast.error("Failed to process redemption");
            // Revert optimistic update on error
            setOptimisticData(prev => {
                const newState = { ...prev };
                updates.forEach(u => delete newState[u.id]);
                return newState;
            });
        }
    };

    const handleViewTransactions = async (item) => {
        setTxDialog({
            isOpen: true,
            isLoading: true,
            transactions: [],
            title: `Transactions - ${item.cardName} (${fmtYMShort(item.month)})`
        });

        try {
            // 1. Fetch transactions using the dedicated API filters
            // The API handles the logic: matches 'Cashback Month' formula AND 'Card' relation
            const res = await fetch(`${API_BASE_URL}/transactions?month=${item.month}&filterBy=cashbackMonth&cardId=${item.cardId}`);
            
            if (!res.ok) throw new Error('Failed to fetch transactions');

            const allTransactions = await res.json();

            // 2. FIX: Removed the incorrect client-side filtering.
            // The API has already returned exactly what we need (transactions for this card in this month).
            
            setTxDialog({
                isOpen: true,
                isLoading: false,
                transactions: allTransactions, // <--- Pass the API results directly
                title: `Transactions - ${item.cardName} (${fmtYMShort(item.month)})`
            });

        } catch (err) {
            console.error(err);
            toast.error("Could not load transactions");
            setTxDialog({ isOpen: false, isLoading: false, transactions: [], title: '' });
        }
    };

    const handleUndoRedemption = async (event) => {
        if (!event || !event.contributors || event.contributors.length === 0) return;

        const updates = event.contributors.map(c => {
             // 1. Strip the log from notes
             // Since regex is global, we need to be careful. String replace of the exact original log is safest.
             // But notes might have trailing newlines.

             // Find the original item from monthlySummary
             const item = monthlySummary.find(i => i.id === c.itemId);
             if(!item) return null;

             let newNotes = item.notes.replace(c.originalLog, '').trim();
             // Clean up extra newlines if any
             newNotes = newNotes.replace(/\n\s*\n/g, '\n').trim();

             // 2. Reduce amountRedeemed
             // If we just undo, we subtract.
             // Note: If user edited AMOUNT manually outside of this flow, this logic assumes consistent state.
             const newAmount = Math.max(0, (item.amountRedeemed || 0) - c.amount);

             return {
                 id: item.id,
                 notes: newNotes,
                 amountRedeemed: newAmount,
                 // For optimistic
                 originalNotes: item.notes,
                 originalAmount: item.amountRedeemed
             };
        }).filter(Boolean);

        if (updates.length === 0) return;

        // Optimistic Update
        const optimisticUpdates = {};
        updates.forEach(u => {
            optimisticUpdates[u.id] = { amountRedeemed: u.amountRedeemed, notes: u.notes };
        });
        setOptimisticData(prev => ({ ...prev, ...optimisticUpdates }));

        toast.promise(
            Promise.all(updates.map(u =>
                 fetch(`${API_BASE_URL}/monthly-summary/${u.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amountRedeemed: u.amountRedeemed,
                        notes: u.notes
                    })
                })
            )),
            {
                loading: 'Reverting redemption...',
                success: () => {
                    if (onUpdate) onUpdate();
                    return 'Redemption reverted successfully';
                },
                error: (err) => {
                    // Revert optimistic
                    setOptimisticData(prev => {
                        const newState = { ...prev };
                        updates.forEach(u => delete newState[u.id]);
                        return newState;
                    });
                    return 'Failed to revert redemption';
                }
            }
        );
    };

    // --- HELPER FOR LIST VIEW ---
    const renderListView = () => {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                     <span className="text-sm text-slate-500 font-medium">Group By:</span>
                     <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        <button
                            onClick={() => setListGroupBy('month')}
                            className={cn("px-3 py-1 rounded-md text-xs font-semibold transition-all", listGroupBy === 'month' ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100" : "text-slate-500")}
                        >
                            Month
                        </button>
                        <button
                            onClick={() => setListGroupBy('card')}
                            className={cn("px-3 py-1 rounded-md text-xs font-semibold transition-all", listGroupBy === 'card' ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100" : "text-slate-500")}
                        >
                            Card
                        </button>
                     </div>
                </div>

                <div className="rounded-md border bg-white dark:bg-slate-950">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {isSelectionMode && <TableHead className="w-[30px] p-2"><div className="w-4" /></TableHead>}
                                <TableHead className="w-[120px]">Month</TableHead>
                                <TableHead>Card</TableHead>
                                <TableHead className="text-right">Total Earned</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                                <TableHead className="text-right">Tier 1</TableHead>
                                <TableHead className="text-right">Tier 2</TableHead>
                                <TableHead className="text-center w-[120px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {groupedCashData.map(group => (
                                <React.Fragment key={group.title}>
                                    <TableRow className="bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-100 dark:hover:bg-slate-800/50">
                                        <TableCell colSpan={isSelectionMode ? 8 : 7} className="font-bold text-slate-700 dark:text-slate-300 py-2">
                                            {group.title} <span className="text-slate-400 font-normal text-xs ml-2">({group.items.length} items)</span>
                                        </TableCell>
                                    </TableRow>
                                    {group.items.map(item => {
                                        const isPaid = item.remainingDue <= 0;
                                        const tier1Paid = (item.amountRedeemed || 0) >= item.tier1Amount;
                                        const isStatementPending = !isStatementFinalized(item.month, item.statementDay);
                                        const isReviewed = item.reviewed;

                                        const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'}) : '-';

                                        return (
                                            <TableRow key={item.id} className="group hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                                {isSelectionMode && (
                                                    <TableCell className="p-2">
                                                        <Checkbox
                                                            checked={selectedIds.has(item.id)}
                                                            onCheckedChange={() => handleToggleSelect(item.id)}
                                                        />
                                                    </TableCell>
                                                )}
                                                <TableCell className="font-mono text-slate-600 dark:text-slate-400 py-3">
                                                    <div className="flex items-center gap-2">
                                                        {fmtYMShort(item.month)}
                                                        {isReviewed && <Badge variant="outline" className="text-[9px] h-4 px-1 py-0 text-indigo-600 border-indigo-200">Reviewed</Badge>}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <div className="font-medium text-slate-900 dark:text-slate-100">{item.cardName}</div>
                                                    <div className="text-[10px] text-slate-400">{item.bankName}</div>
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-emerald-600 py-3">
                                                    {currency(item.totalEarned)}
                                                </TableCell>
                                                <TableCell className="text-right py-3">
                                                    <Badge variant={isPaid ? "outline" : "default"} className={cn("text-[10px]", isPaid ? "text-emerald-600 border-emerald-200" : isStatementPending ? "bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200" : "bg-slate-600")}>
                                                        {isPaid ? "Settled" : isStatementPending ? "Stmt Pending" : "Unpaid"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right py-3">
                                                    <div className="text-xs">
                                                        <div>{currency(item.tier1Amount)}</div>
                                                        <div className={cn("text-[10px]", item.tier1Status?.status === 'overdue' ? "text-red-500" : "text-slate-400")}>
                                                            {formatDate(item.tier1Date)}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right py-3">
                                                    {item.tier2Amount > 0 ? (
                                                        <div className="text-xs">
                                                            <div>{currency(item.tier2Amount)}</div>
                                                            <div className={cn("text-[10px]", item.tier2Status?.status === 'overdue' ? "text-red-500" : "text-slate-400")}>
                                                                {formatDate(item.tier2Date)}
                                                            </div>
                                                        </div>
                                                    ) : <span className="text-slate-300">-</span>}
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <div className="flex justify-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600" onClick={() => handleViewTransactions(item)} title="View Transactions">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className={cn("h-8 w-8", isReviewed ? "text-indigo-600" : "text-slate-400 hover:text-indigo-600")}
                                                            onClick={() => handleToggleReviewed(item)}
                                                            title={isReviewed ? "Mark Unreviewed" : "Mark Reviewed"}
                                                        >
                                                            <ClipboardCheck className="h-4 w-4" />
                                                        </Button>
                                                        {!isPaid && (
                                                            <Button
                                                                size="sm"
                                                                disabled={isStatementPending}
                                                                className={cn("h-8 text-[10px] px-2", isStatementPending ? "opacity-50" : "bg-emerald-600 hover:bg-emerald-700 text-white")}
                                                                onClick={() => handleMarkReceived(item, !tier1Paid ? 'tier1' : 'tier2')}
                                                            >
                                                                {isStatementPending ? "Pending" : (!tier1Paid ? (item.tier2Amount > 0 ? "Pay T1" : "Pay") : "Pay T2")}
                                                            </Button>
                                                        )}
                                                        {isPaid && <CheckCircle className="h-5 w-5 text-emerald-500 opacity-50 ml-1" />}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        );
    };

    // --- RENDER ---
    return (
        <div className="space-y-6">

            {/* MAIN TAB SWITCHER */}
            <div className="flex justify-center">
                <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-full inline-flex">
                    <button
                        onClick={() => setMainTab('cash')}
                        className={cn("px-6 py-2 rounded-full text-sm font-semibold transition-all", mainTab === 'cash' ? "bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200")}
                    >
                        Balances
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
                <div className="space-y-6">

                    {/* Stats Cards */}
                    {stats && (
                        <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
                            <StatCard
                                title="Total Cashback"
                                value={currency(stats.totalCashback)}
                                numericValue={stats.totalCashback}
                                icon={<Wallet className="h-4 w-4 text-muted-foreground" />}
                                currencyFn={currency}
                            />
                            <StatCard
                                title="Received"
                                value={currency(stats.amountReceived)}
                                numericValue={stats.amountReceived}
                                icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
                                currencyFn={currency}
                            />
                            <StatCard
                                title="Pending"
                                value={currency(stats.amountPending)}
                                numericValue={stats.amountPending}
                                icon={<Clock className="h-4 w-4 text-muted-foreground" />}
                                currencyFn={currency}
                                invertTrendColor={true} // High pending might be considered 'bad' or just needs distinct color
                            />
                            <StatCard
                                title="Avg. Monthly"
                                value={currency(stats.avgMonthlyEarnings)}
                                numericValue={stats.avgMonthlyEarnings}
                                icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
                                currencyFn={currency}
                            />
                        </div>
                    )}

                    {/* Controls */}
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                        <Tabs value={cashViewMode} onValueChange={setCashViewMode} className="w-full md:w-auto">
                            <TabsList>
                                <TabsTrigger value="month" className="gap-2"><Clock className="h-4 w-4"/> By Month</TabsTrigger>
                                <TabsTrigger value="card" className="gap-2"><Calendar className="h-4 w-4"/> By Card</TabsTrigger>
                                <TabsTrigger value="list" className="gap-2"><List className="h-4 w-4"/> List View</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <Button
                                variant={isSelectionMode ? "secondary" : "outline"}
                                size="sm"
                                onClick={toggleSelectionMode}
                                className={cn("gap-2", isSelectionMode ? "bg-slate-200 dark:bg-slate-800" : "")}
                            >
                                {isSelectionMode ? <X className="h-4 w-4" /> : <ClipboardCheck className="h-4 w-4" />}
                                {isSelectionMode ? "Cancel" : "Select"}
                            </Button>
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
                        cashViewMode === 'list' ? renderListView() : (
                            <div className="space-y-8">
                                {/* First Group (Always Visible) */}
                                {groupedCashData.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex items-end justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                                            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2 text-slate-800 dark:text-slate-100">
                                                {groupedCashData[0].title}
                                                {groupedCashData[0].due > 0 && <Badge variant="destructive" className="ml-2">{currency(groupedCashData[0].due)} ₫ Due</Badge>}
                                            </h2>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {groupedCashData[0].items.map(item => (
                                                <CashVoucherCard
                                                    key={item.id}
                                                    item={item}
                                                    statementDay={item.statementDay}
                                                    onMarkReceived={handleMarkReceived}
                                                    onEdit={handleEditClick}
                                                    onViewTransactions={handleViewTransactions}
                                                    onToggleReviewed={handleToggleReviewed}
                                                    isSelectionMode={isSelectionMode}
                                                    isSelected={selectedIds.has(item.id)}
                                                    onToggleSelect={() => handleToggleSelect(item.id)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Remaining Groups Accordion */}
                                {groupedCashData.length > 1 && (
                                    <div className="relative">
                                        {/* Button to show remaining */}
                                        {!showAllGroups && (
                                            <div className="flex justify-center mt-6">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setShowAllGroups(true)}
                                                    className="gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                                                >
                                                    <ArrowDown className="h-4 w-4" />
                                                    View remaining {groupedCashData.length - 1} {cashViewMode === 'month' ? 'months' : 'cards'}
                                                </Button>
                                            </div>
                                        )}

                                        {/* Hidden Groups */}
                                        {showAllGroups && (
                                            <div className="space-y-8 mt-8 animate-in fade-in slide-in-from-top-4 duration-300">
                                                {groupedCashData.slice(1).map((group) => (
                                                    <div key={group.title} className="space-y-3">
                                                        <div className="flex items-end justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                                                            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2 text-slate-800 dark:text-slate-100">
                                                                {group.title}
                                                                {group.due > 0 && <Badge variant="destructive" className="ml-2">{currency(group.due)} ₫ Due</Badge>}
                                                            </h2>
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                                            {group.items.map(item => (
                                                                <CashVoucherCard
                                                                    key={item.id}
                                                                    item={item}
                                                                    statementDay={item.statementDay}
                                                                    onMarkReceived={handleMarkReceived}
                                                                    onEdit={handleEditClick}
                                                                    onViewTransactions={handleViewTransactions}
                                                                    onToggleReviewed={handleToggleReviewed}
                                                                    isSelectionMode={isSelectionMode}
                                                                    isSelected={selectedIds.has(item.id)}
                                                                    onToggleSelect={() => handleToggleSelect(item.id)}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="flex justify-center pt-4">
                                                     <Button
                                                        variant="ghost"
                                                        onClick={() => setShowAllGroups(false)}
                                                        className="text-xs text-slate-400 hover:text-slate-600"
                                                    >
                                                        Collapse history
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    )}
                </div>
            )}

            {/* ===== POINTS VIEW ===== */}
            {mainTab === 'points' && (
                <div className="space-y-6">

                    {/* Points Hero Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Available Balance */}
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

                        {/* Redeemed Balance */}
                        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 -mr-10 -mt-10 bg-white/10 h-64 w-64 rounded-full blur-3xl pointer-events-none"></div>
                            <div className="relative z-10">
                                <p className="text-emerald-100 font-medium mb-1">Total Redeemed</p>
                                <h2 className="text-4xl font-bold tracking-tight">
                                    {currency(pointsByCard.reduce((acc, c) => acc + (c.totalRedeemed || 0), 0))} <span className="text-lg font-normal opacity-80">pts</span>
                                </h2>
                                <p className="text-sm text-emerald-200 mt-2"> realized value</p>
                            </div>
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
                                    minPointsRedeem={card.minPointsRedeem}
                                    onRedeem={() => handleOpenRedeem(card)}
                                    onViewDetails={() => handleOpenDetails(card)}
                                    items={card.items}
                                    statementDay={card.statementDay}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* EDIT DIALOG (CASH & POINTS) */}
            <UpdateDetailsDialog
                isOpen={isEditDialogOpen}
                onClose={() => setIsEditDialogOpen(false)}
                onSave={handleSaveEdit}
                item={editingSummary}
            />

            {/* REDEEM DIALOG (POINTS) */}
            <RedeemPointsDialog
                isOpen={isRedeemDialogOpen}
                onClose={() => setIsRedeemDialogOpen(false)}
                onConfirm={handleRedeemConfirm}
                target={redeemTarget}
            />

            {/* BULK ACTION BAR */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 dark:bg-slate-100/90 text-white dark:text-slate-900 px-6 py-3 rounded-full shadow-lg backdrop-blur-sm z-50 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-200">
                    <span className="text-sm font-semibold">{selectedIds.size} Selected</span>
                    <div className="h-4 w-px bg-white/20 dark:bg-black/20" />
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-white dark:text-slate-900 hover:bg-white/20 dark:hover:bg-black/10 h-8"
                        onClick={() => handleBulkReview(true)}
                    >
                        Mark Reviewed
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-white dark:text-slate-900 hover:bg-white/20 dark:hover:bg-black/10 h-8"
                        onClick={() => handleBulkReview(false)}
                    >
                        Unmark
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-white dark:hover:text-slate-900 hover:bg-transparent h-8 w-8 ml-2"
                        onClick={() => setSelectedIds(new Set())}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            <PointsDetailSheet
                isOpen={pointsDetailOpen}
                onClose={() => setPointsDetailOpen(false)}
                cardData={pointsByCard.find(c => c.cardId === selectedPointsCardId)}
                onEdit={handleEditClick}
                onToggleReviewed={handleToggleReviewed}
                onViewTransactions={handleViewTransactions}
                onUndoRedemption={handleUndoRedemption}
                currencyFn={currency}
            />

            <SharedTransactionsDialog
                isOpen={txDialog.isOpen}
                isLoading={txDialog.isLoading}
                onClose={() => setTxDialog(prev => ({ ...prev, isOpen: false }))}
                transactions={txDialog.transactions}
                title={txDialog.title}
                description="List of transactions associated with this cashback period."
                currencyFn={currency}
                cardMap={cardMap}
                rules={rules}
                allCards={cards}
                monthlyCategorySummary={monthlyCategorySummary}
                onEdit={onEditTransaction}
                onDelete={onTransactionDeleted}
                onBulkDelete={onBulkDelete}
            />

        </div>
    );
}
