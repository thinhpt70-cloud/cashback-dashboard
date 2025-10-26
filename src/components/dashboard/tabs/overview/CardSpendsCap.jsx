import React, { useState, useMemo } from 'react';
import { ChevronDown, CheckCircle2, Circle, Unlock, Lock } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { Progress } from '../../../ui/progress';
import { calculateDaysLeftInCashbackMonth, calculateDaysUntilStatement } from '../../../../lib/date';

function CategoryCapsUsage({ card, rules, activeMonth, monthlyCategorySummary, currencyFn, isTier2Met }) {
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
            
            return { 
                id: summary.id, 
                category: categoryName, 
                currentCashback, 
                limit: categoryLimit,
                usedPct, 
                remaining,
                isBoosted
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
                            <div className="flex justify-between items-center text-sm mb-1.5">
                                <p className="font-medium text-slate-700 min-w-0 pr-4 truncate" title={cap.category}>
                                    {cap.category}
                                    {cap.isBoosted && ' ✨'}
                                </p>
                                <span className="font-mono text-xs font-semibold text-slate-500">{cap.usedPct}%</span>
                            </div>
                            <Progress 
                                value={cap.usedPct} 
                                className="h-2" 
                                indicatorClassName={cn(
                                    cap.isBoosted ? "bg-indigo-500" : "bg-sky-500" // Use boost color
                                )} 
                            />
                            <div className="flex justify-between items-center text-xs text-muted-foreground mt-1.5">
                                <span>{currencyFn(cap.currentCashback)} / {currencyFn(cap.limit)}</span>
                                <span className="font-medium">{currencyFn(cap.remaining)} left</span>
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

export default function CardSpendsCap({ cards, rules, activeMonth, monthlySummary, monthlyCategorySummary, currencyFn, getCurrentCashbackMonthForCard }) {
    const [expandedCardId, setExpandedCardId] = useState(null);

    const isLiveView = activeMonth === 'live';

    const handleToggleExpand = (cardId) => {
        setExpandedCardId(prevId => (prevId === cardId ? null : cardId));
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
        <Card className="flex flex-col h-full">
            <CardHeader>
                <CardTitle>Card Spends Cap</CardTitle>
            </CardHeader>
            <CardContent>
                {cardSpendsCapProgress.length > 0 ? (
                    <div className="space-y-1">
                        {cardSpendsCapProgress.map(p => (
                            <div 
                                key={p.cardId} 
                                className={cn(
                                    "border-b last:border-b-0 py-1 transition-colors duration-300"
                                )}
                            >
                                <div 
                                    className="flex flex-col gap-2 p-2 cursor-pointer hover:bg-muted/50 rounded-md"
                                    onClick={() => handleToggleExpand(p.cardId)}
                                >
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
                                                expandedCardId === p.cardId && "rotate-180"
                                            )} />
                                        </div>
                                    </div>                                 
                                    {p.monthlyLimit > 0 && (
                                        <div className="flex items-center gap-3 w-full text-sm">
                                            <span className={cn(
                                                "font-medium w-32 shrink-0",
                                                p.isCapReached ? "text-slate-500" : "text-emerald-600"
                                            )}>
                                                {p.isCapReached ? "✓ Maximized" : `${currencyFn(p.monthlyLimit - p.currentCashback)} left`}
                                            </span>
                                            <Progress value={p.usedCapPct} indicatorClassName={getProgressColor(p.usedCapPct)} className="h-1.5 flex-grow" />
                                            <span className={cn(
                                                "text-xs w-40 shrink-0 text-right",
                                                p.isCapReached ? "text-slate-400" : "text-muted-foreground"
                                            )}>
                                                {currencyFn(p.currentCashback)} / {currencyFn(p.monthlyLimit)}
                                            </span>
                                        </div>
                                    )}
                                    {(p.minSpend > 0 || (p.cashbackType === '2 Tier' && p.tier2MinSpend > 0)) && (
                                        <div className="flex items-center gap-2 flex-wrap mt-2">
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

                                {/* --- Expandable Section --- */}
                                <div className={cn( "overflow-hidden transition-all duration-300 ease-in-out",
                                    expandedCardId === p.cardId ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                                )}>
                                    {expandedCardId === p.cardId && (
                                        <div className="py-4 border-t"> 
                                            <CategoryCapsUsage
                                                card={p.card}
                                                rules={rules.filter(r => r.cardId === p.cardId)}
                                                activeMonth={p.activeMonth}
                                                monthlyCategorySummary={monthlyCategorySummary}
                                                currencyFn={currencyFn}
                                                isTier2Met={p.isTier2Met}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No monthly limits or minimums defined for your active cards.</p>
                )}
            </CardContent>
        </Card>
    );
}