import React, { useState, useMemo } from 'react';
import { ChevronDown, CheckCircle2, Circle, Unlock, Lock, Infinity, Eye } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Card, CardContent } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { Progress } from '../../../ui/progress';
import { Button } from '../../../ui/button';
import { calculateDaysLeftInCashbackMonth, calculateDaysUntilStatement } from '../../../../lib/date';

import { toast } from 'sonner';
import ViewTransactionsDialog from '../../dialogs/ViewTransactionsDialog';

const API_BASE_URL = '/api';

function CategoryCapsUsage({ card, rules, activeMonth, monthlyCategorySummary, currencyFn, isTier2Met, onSelectCategory }) {
    const categoryCapData = useMemo(() => {
        const rulesMap = new Map(rules.map(r => [r.ruleName, r]));

        const summaries = monthlyCategorySummary.filter(
            summary => summary.cardId === card.id && summary.month === activeMonth
        );
        if (!summaries.length) return [];
        
        const data = summaries.map(summary => {
            let categoryName = 'Unknown Category';
            if (summary.summaryId) {
                const parts = summary.summaryId.split(' - ');
                if (parts.length > 1) categoryName = parts.slice(1).join(' - ');
            }

            const rule = rulesMap.get(categoryName);
            const currentCashback = summary.cashback || 0;
            
            const baseCategoryLimit = rule?.categoryLimit ?? summary.categoryLimit ?? 0;
            const baseTier2CategoryLimit = rule?.tier2CategoryLimit ?? 0;
            const baseRate = rule?.rate ?? 0;
            const baseTier2Rate = rule?.tier2Rate ?? 0;

            const isTier2LimitActive = isTier2Met && baseTier2CategoryLimit > 0;
            const isTier2RateActive = isTier2Met && baseTier2Rate > baseRate;
            const isBoosted = isTier2LimitActive || isTier2RateActive;
            
            const categoryLimit = isTier2LimitActive ? baseTier2CategoryLimit : baseCategoryLimit;
            
            const usedPct = categoryLimit > 0 ? Math.min(100, Math.round((currentCashback / categoryLimit) * 100)) : 0;
            const remaining = categoryLimit - currentCashback;
            const isCompleted = usedPct >= 100;
            
            return { 
                id: summary.id, 
                category: categoryName, 
                currentCashback, 
                limit: categoryLimit,
                usedPct, 
                remaining,
                isBoosted,
                isCompleted 
            };
        });

        return data.sort((a, b) => b.usedPct - a.usedPct);

    }, [card, rules, activeMonth, monthlyCategorySummary, isTier2Met]);

    return (
        <div className="px-4">
            <h4 className="text-sm font-semibold text-muted-foreground mb-4">CATEGORY CAPS USAGE</h4>
            {categoryCapData.length > 0 ? (
                <div className="space-y-4">
                    {categoryCapData.map(cap => (
                        <div key={cap.id}>
                            <div className="flex justify-between items-start text-sm mb-1.5 gap-2">
                                <p className="font-medium text-slate-700 dark:text-slate-300 flex-1 min-w-0 break-words" title={cap.category}>
                                    {cap.category}
                                    {cap.isBoosted && ' ✨'}
                                </p>
                                {cap.limit > 0 && (
                                    <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400 flex-shrink-0">{cap.usedPct}%</span>
                                )}
                            </div>
                            {cap.limit > 0 ? (
                                <Progress
                                    value={cap.usedPct}
                                    className="h-2"
                                    indicatorClassName={cn(
                                        cap.isCompleted ? "bg-emerald-500" : "bg-black dark:bg-slate-200"
                                    )}
                                />
                            ) : (
                                <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                    <Infinity className="h-4 w-4 text-gray-500" />
                                </div>
                            )}
                            <div className="flex justify-between items-center text-xs text-muted-foreground mt-1.5">
                                <span>
                                    {currencyFn(cap.currentCashback)}{cap.limit > 0 ? ` / ${currencyFn(cap.limit)}` : ''}
                                </span>
                                <div className="flex items-center">
                                    {cap.limit > 0 && (
                                        <span className="font-medium mr-2">
                                            {`${currencyFn(cap.remaining)} left`}
                                        </span>
                                    )}
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onSelectCategory({ categoryName: cap.category, cardId: card.id })}>
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-4">
                    <p className="text-xs text-muted-foreground">No specific category data for this month.</p>
                </div>
            )}
        </div>
    );
}

// --- SingleCapCard component ---
// This component renders an individual Card for each item in the progress list.
function SingleCapCard({ 
    p, 
    isExpanded, 
    onToggleExpand, 
    currencyFn, 
    rules, 
    monthlyCategorySummary, 
    getProgressColor, 
    getDotColorClass, 
    DaysLeftBadge,
    onSelectCategory
}) {
    return (
        <Card key={p.cardId} className="w-full">
            {/* Clickable Header Area */}
            <div 
                className="flex flex-col gap-2 p-3 cursor-pointer"
                onClick={() => onToggleExpand(p.cardId)}
            >
                {/* Card Name and Days Left */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className={cn(
                            "w-2 h-2 rounded-full flex-shrink-0",
                            getDotColorClass(p.dotStatus)
                        )} />
                        <p className={cn(
                            "font-semibold truncate",
                            { "text-slate-400 font-normal": p.isCapReached }
                        )} title={p.cardName}>{p.cardName}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <DaysLeftBadge status={p.cycleStatus} days={p.daysLeft} />
                        <ChevronDown className={cn( "h-5 w-5 text-muted-foreground transition-transform duration-200 flex-shrink-0",
                            isExpanded && "rotate-180"
                        )} />
                    </div>
                </div>
                
                {/* Progress Bar and Figures */}
                {p.monthlyLimit > 0 && (
                    <div className="space-y-1.5">
                        {/* Key Figures (responsive) */}
                        <div className="flex justify-between items-center w-full text-sm">
                            <span className={cn(
                                "font-medium",
                                p.isCapReached ? "text-slate-500" : "text-emerald-600"
                            )}>
                                {p.isCapReached ? "✓ Maximized" : `${currencyFn(p.monthlyLimit - p.currentCashback)} left`}
                            </span>
                            <span className={cn(
                                "text-xs text-right",
                                p.isCapReached ? "text-slate-400" : "text-muted-foreground"
                            )}>
                                {currencyFn(p.currentCashback)} / {currencyFn(p.monthlyLimit)}
                            </span>
                        </div>
                        {/* Progress Bar */}
                        <Progress value={p.usedCapPct} indicatorClassName={getProgressColor(p.usedCapPct)} className="h-1.5 w-full" />
                    </div>
                )}

                {/* Status Badges */}
                {(p.minSpend > 0 || (p.cashbackType === '2 Tier' && p.tier2MinSpend > 0)) && (
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                        {/* Min Spend Tag */}
                        {p.minSpend > 0 && (
                            <Badge
                                variant="outline"
                                className={cn(
                                    "text-xs h-5 px-1.5 font-semibold flex items-center gap-1.5",
                                    p.minSpendMet
                                        ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                        : "bg-yellow-100 text-yellow-800 border-yellow-200"
                                )}
                            >
                                {p.minSpendMet ? (
                                    <>
                                        <CheckCircle2 className="h-3 w-3" />
                                        <span>Min. Spend Met</span>
                                    </>
                                ) : (
                                    <>
                                        <Circle className="h-3 w-3" />
                                        <span>
                                            Min Spend: {currencyFn(p.currentSpend)} / {currencyFn(p.minSpend)} ({p.minSpendPct}%)
                                        </span>
                                    </>
                                )}
                            </Badge>
                        )}
                        {/* Tier 2 Tag */}
                        {p.cashbackType === '2 Tier' && p.tier2MinSpend > 0 && (
                            <Badge
                                variant="outline"
                                className={cn(
                                    "text-xs h-5 px-1.5 font-semibold flex items-center gap-1.5",
                                    p.isTier2Met
                                        ? "bg-emerald-100 text-emerald-800 border-emerald-200" // Unlocked = Green
                                        : "bg-blue-100 text-blue-800 border-blue-200" // Locked = Blue
                                )}
                            >
                                {p.isTier2Met ? (
                                    <>
                                        <Unlock className="h-3 w-3" />
                                        <span>Tier 2 Unlocked</span>
                                    </>
                                ) : (
                                    <>
                                        <Lock className="h-3 w-3" />
                                        <span>
                                            Tier 2: {currencyFn(p.currentSpend)} / {currencyFn(p.tier2MinSpend)} ({p.tier2SpendPct}%)
                                        </span>
                                    </>
                                )}
                            </Badge>
                        )}
                    </div>
                )}
            </div>

            {/* Expandable Section */}
            <div className={cn( "overflow-hidden transition-all duration-300 ease-in-out",
                isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
            )}>
                {isExpanded && (
                    <div className="py-4 border-t"> 
                        <CategoryCapsUsage
                            card={p.card}
                            rules={rules.filter(r => r.cardId === p.cardId)}
                            activeMonth={p.activeMonth}
                            monthlyCategorySummary={monthlyCategorySummary}
                            currencyFn={currencyFn}
                            isTier2Met={p.isTier2Met}
                            onSelectCategory={onSelectCategory}
                        />
                    </div>
                )}
            </div>
        </Card>
    );
}

// --- REFACTORED CardSpendsCap Component ---
export default function CardSpendsCap({ cards, rules, activeMonth, monthlySummary, monthlyCategorySummary, currencyFn, getCurrentCashbackMonthForCard }) {
    const [expandedCardId, setExpandedCardId] = useState(null);
    const [dialogState, setDialogState] = useState({
        isOpen: false,
        isLoading: false,
        categoryName: null,
        transactions: [],
    });

    const isLiveView = activeMonth === 'live';

    const handleToggleExpand = (cardId) => {
        setExpandedCardId(prevId => (prevId === cardId ? null : cardId));
    };

    const handleSelectCategory = async ({ categoryName, cardId }) => {
        setDialogState({ isOpen: true, isLoading: true, categoryName, transactions: [] });

        try {
            const card = cards.find(c => c.id === cardId);
            if (!card) throw new Error("Card not found");

            const monthForCard = isLiveView ? getCurrentCashbackMonthForCard(card) : activeMonth;

            const res = await fetch(`${API_BASE_URL}/transactions?month=${monthForCard.replace('-', '')}&filterBy=cashbackMonth&cardId=${cardId}`);
            if (!res.ok) throw new Error('Failed to fetch transactions');

            const allTransactions = await res.json();

            const filtered = allTransactions.filter(t => {
                const summaryCategories = t['Card Summary Category'];
                if (!Array.isArray(summaryCategories) || summaryCategories.length === 0) {
                    return false;
                }
                return summaryCategories.some(summary => summary.includes(categoryName));
            });

            setDialogState({ isOpen: true, isLoading: false, categoryName, transactions: filtered });

        } catch (err) {
            console.error(err);
            toast.error("Could not load transaction details.");
            setDialogState({ isOpen: false, isLoading: false, categoryName: null, transactions: [] });
        }
    };

    const cardSpendsCapProgress = useMemo(() => {
        return cards
            .filter(card => card.status !== 'Closed')
            .filter(card => card.overallMonthlyLimit > 0 || card.minimumMonthlySpend > 0 || (card.cashbackType === '2 Tier' && (card.tier2Limit > 0 || card.tier2MinSpend > 0)))
            .map(card => {
                const monthForCard = isLiveView ? getCurrentCashbackMonthForCard(card) : activeMonth;
                const cardMonthSummary = monthlySummary.find(
                    summary => summary.cardId === card.id && summary.month === monthForCard
                );

                const currentCashback = cardMonthSummary?.cashback || 0;
                const currentSpend = cardMonthSummary?.spend || 0;

                const isTier2Met = card.cashbackType === '2 Tier' && card.tier2MinSpend > 0 && currentSpend >= card.tier2MinSpend;
                const cardTierLimit = isTier2Met ? card.tier2Limit : card.overallMonthlyLimit;

                const dynamicLimit = cardMonthSummary?.monthlyCashbackLimit;
                const monthlyLimit = dynamicLimit > 0 ? dynamicLimit : cardTierLimit;

                const usedCapPct = monthlyLimit > 0 ? Math.min(100, Math.round((currentCashback / monthlyLimit) * 100)) : 0;
                const isCapReached = usedCapPct >= 100;

                const minSpend = card.minimumMonthlySpend || 0;
                const minSpendMet = minSpend > 0 ? currentSpend >= minSpend : true;
                const minSpendPct = minSpend > 0 ? Math.min(100, Math.round((currentSpend / minSpend) * 100)) : 100;

                const tier2SpendPct = card.tier2MinSpend > 0 ? Math.min(100, Math.round((currentSpend / card.tier2MinSpend) * 100)) : 0;

                const { days, status } = card.useStatementMonthForPayments
                    ? calculateDaysLeftInCashbackMonth(monthForCard)
                    : calculateDaysUntilStatement(card.statementDay, monthForCard);

                let dotStatus = 'gray'; // Default
                
                if (isCapReached) {
                    dotStatus = 'green'; // Fully capped
                } else if (!minSpendMet && minSpend > 0) {
                    dotStatus = 'yellow'; // Requires action: Minimum Spend not met
                } else if (minSpendMet && !isCapReached) {
                    dotStatus = 'blue'; // In progress: Minimums met, not capped
                }
                // 'gray' remains for default (e.g., no min spend, not capped)

                return {
                    card, cardId: card.id, cardName: card.name, currentCashback,
                    currentSpend, monthlyLimit, usedCapPct, minSpend, minSpendMet,
                    minSpendPct, daysLeft: days, cycleStatus: status, isCapReached,
                    activeMonth: monthForCard,
                    isTier2Met,
                    cashbackType: card.cashbackType,
                    tier2MinSpend: card.tier2MinSpend,
                    tier2Limit: card.tier2Limit,
                    tier2SpendPct,
                    dotStatus,
                };
            })
            .sort((a, b) => {
                 if (a.isCapReached !== b.isCapReached) return a.isCapReached ? 1 : -1; // Capped cards last
                 if (a.minSpendMet !== b.minSpendMet) return a.minSpendMet ? -1 : 1; // Unmet min spend cards last among uncapped
                 // Prioritize 2 Tier cards that met Tier 2
                 if (a.cashbackType === '2 Tier' && b.cashbackType !== '2 Tier') {
                     if (a.isTier2Met) return -1;
                 }
                 if (a.cashbackType !== '2 Tier' && b.cashbackType === '2 Tier') {
                      if (b.isTier2Met) return 1;
                 }
                 if (a.cashbackType === '2 Tier' && b.cashbackType === '2 Tier') {
                     if(a.isTier2Met !== b.isTier2Met) return a.isTier2Met ? -1 : 1;
                 }
                 // Otherwise sort by percentage used (higher percentage first)
                 return b.usedCapPct - a.usedCapPct;
            });
    }, [cards, activeMonth, monthlySummary, isLiveView, getCurrentCashbackMonthForCard]);

    const getProgressColor = (percentage) => {
        if (percentage >= 100) return "bg-emerald-500";
        if (percentage > 85) return "bg-orange-500";
        return "bg-sky-500";
    };

    const getDotColorClass = (status) => {
        switch (status) {
            case 'green': return "bg-emerald-500";
            case 'blue': return "bg-blue-500";
            case 'yellow': return "bg-yellow-500";
            default: return "bg-slate-400";
        }
    };

    const DaysLeftBadge = ({ status, days }) => (
        <Badge
            variant="outline"
            className={cn( "text-xs h-6 px-2 font-semibold justify-center",
                status === 'Completed' && "bg-emerald-100 text-emerald-800 border-emerald-200"
            )}
        >
            {status === 'Completed' ? 'Done' : `${days} days left`}
        </Badge>
    );

    return (
        // This div replaces the original outer <Card>
        <div>
            {/* This h3 replaces the original <CardTitle> */}
            <h3 className="text-lg font-semibold mb-4 px-1">Card Spends Cap</h3>

            {/* This div replaces the original <CardContent> */}
            <div>
                {cardSpendsCapProgress.length > 0 ? (
                    <div className="space-y-4"> {/* This stacks the new <SingleCapCard> components */}
                        {cardSpendsCapProgress.map(p => (
                            <SingleCapCard
                                key={p.cardId}
                                p={p}
                                isExpanded={expandedCardId === p.cardId}
                                onToggleExpand={handleToggleExpand}
                                currencyFn={currencyFn}
                                rules={rules}
                                monthlyCategorySummary={monthlyCategorySummary}
                                getProgressColor={getProgressColor}
                                getDotColorClass={getDotColorClass}
                                DaysLeftBadge={DaysLeftBadge}
                                onSelectCategory={handleSelectCategory}
                            />
                        ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="pt-6"> {/* Add pt-6 to match default CardContent padding */}
                            <p className="text-sm text-muted-foreground text-center py-4">No monthly limits or minimums defined for your active cards.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
            <ViewTransactionsDialog
                isOpen={dialogState.isOpen}
                isLoading={dialogState.isLoading}
                onClose={() => setDialogState({ isOpen: false, isLoading: false, categoryName: null, transactions: [] })}
                transactions={dialogState.transactions}
                categoryName={dialogState.categoryName}
                currencyFn={currencyFn}
            />
        </div>
    );
}