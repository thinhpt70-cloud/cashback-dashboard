import React, { useState, useMemo } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { Progress } from '../../../ui/progress';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../../../ui/tooltip';
import { calculateDaysLeftInCashbackMonth, calculateDaysUntilStatement } from '../../../../lib/date';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../../ui/dialog";

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
            <h4 className="text-sm font-semibold text-center text-muted-foreground mb-4">Category Caps Usage</h4>
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

                // --- DOT LOGIC ---
                let dotStatus = 'gray'; // Default
                let dotTooltip = card.name; // Default tooltip

                if (card.cashbackType === '2 Tier') {
                    if (isTier2Met && isCapReached) { // Met Tier 2 minimum and maxed out cashback
                        dotStatus = 'green';
                        dotTooltip = "Tier 2 met & cashback limit reached";
                    } else if (minSpendMet && isCapReached && !isTier2Met) { // Met Tier 1 minimum and maxed out cashback, but NOT Tier 2
                         dotStatus = 'blue';
                         dotTooltip = "Tier 1 met & cashback limit reached (Tier 2 not met)";
                    } else if (!minSpendMet) { // Didn't meet even Tier 1 minimum
                         dotStatus = 'yellow';
                         dotTooltip = "Minimum spend not met";
                    } else if (!isCapReached && isTier2Met) { // Met Tier 2 minimum but NOT maxed out cashback yet
                        dotStatus = 'gray'; // Or another color if you want to distinguish this state
                        dotTooltip = "Tier 2 met, cashback limit not reached";
                    } else if (!isCapReached && !isTier2Met && minSpendMet) { // Met Tier 1 minimum but NOT Tier 2 minimum and NOT maxed out cashback yet
                         dotStatus = 'gray'; // Or another color
                         dotTooltip = "Tier 1 met, Tier 2 not met, cashback limit not reached";
                    } else { // Default if none of the above match (e.g., T2 not met, cap not reached, min spend met)
                        dotStatus = 'gray';
                        dotTooltip = card.name;
                    }

                } else { // It's a 1 Tier card
                    if (minSpendMet && isCapReached) { // Met minimum criteria and maxed out cashback
                        dotStatus = 'green';
                        dotTooltip = "Minimum spend met & cashback limit reached";
                    } else if (!minSpendMet && minSpend > 0) { // Did NOT meet minimum criteria (and minimum criteria exists)
                        dotStatus = 'yellow';
                        dotTooltip = "Minimum spend not met";
                    } else if (!isCapReached && minSpendMet){ // Met minimum but not capped
                        dotStatus = 'gray';
                        dotTooltip = "Minimum spend met, cashback limit not reached";
                    } else { // Default if none of the above match (e.g., no minimum, not capped)
                        dotStatus = 'gray';
                        dotTooltip = card.name;
                    }
                }


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
                    dotTooltip
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
        <Card className="lg:col-span-3">
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
                                    "border-b last:border-b-0 py-1 transition-colors duration-300",
                                    { "bg-slate-50 rounded-md": p.isCapReached }
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

                                            {/* DESKTOP: Tooltip Trigger */}
                                            <TooltipProvider delayDuration={100}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild className="hidden md:inline-flex cursor-pointer">
                                                        <Info className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                    </TooltipTrigger>
                                                    <TooltipContent><p>{p.dotTooltip}</p></TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>

                                            {/* MOBILE: Dialog Trigger */}
                                            <Dialog>
                                                <DialogTrigger asChild className="md:hidden" onClick={(e) => e.stopPropagation()}>
                                                    <Info className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                </DialogTrigger>
                                                <DialogContent onClick={(e) => e.stopPropagation()}>
                                                    <DialogHeader>
                                                        <DialogTitle>{p.cardName} Status</DialogTitle>
                                                        <DialogDescription className="pt-2">
                                                            {p.dotTooltip}
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                </DialogContent>
                                            </Dialog>
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
                                                p.isCapReached ? "text-slate-400" : "text-emerald-600"
                                            )}>
                                                {currencyFn(p.monthlyLimit - p.currentCashback)} left
                                            </span>
                                            <Progress value={p.usedCapPct} indicatorClassName={getProgressColor(p.usedCapPct)} className="h-1.5 flex-grow" />
                                            <span className={cn(
                                                "text-xs w-40 shrink-0 text-right font-mono",
                                                p.isCapReached ? "text-slate-400" : "text-muted-foreground"
                                            )}>
                                                {currencyFn(p.currentCashback)} / {currencyFn(p.monthlyLimit)}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className={cn( "overflow-hidden transition-all duration-300 ease-in-out",
                                    expandedCardId === p.cardId ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                                )}>
                                    {expandedCardId === p.cardId && (
                                        <div className="py-4 border-t space-y-4">
                                            {p.minSpend > 0 && (
                                                <div className="px-4">
                                                     <h4 className="text-sm font-semibold text-center text-muted-foreground mb-3">Minimum Spend Progress</h4>
                                                     <Progress value={p.minSpendPct} className="h-2" indicatorClassName={p.minSpendMet ? "bg-emerald-500" : "bg-yellow-500"} />
                                                     <div className="flex justify-between items-center text-xs text-muted-foreground mt-1.5">
                                                         <span className={cn("font-semibold", p.minSpendMet ? "text-emerald-600" : "text-yellow-600")}>
                                                             {p.minSpendMet ? 'Met' : `${currencyFn(p.minSpend - p.currentSpend)} to go`}
                                                         </span>
                                                         <span>{currencyFn(p.currentSpend)} / {currencyFn(p.minSpend)}</span>
                                                     </div>
                                                </div>
                                            )}

                                            {p.cashbackType === '2 Tier' && p.tier2MinSpend > 0 && (
                                                <div className="pt-2 px-4">
                                                    {p.isTier2Met ? (
                                                        // --- UPDATED: Unlocked State ---
                                                        <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3 text-center">
                                                            <p className="font-semibold text-emerald-800">✨ Tier 2 Unlocked!</p>
                                                            {p.tier2Limit > 0 && (
                                                                <p className="text-xs text-emerald-700 mt-1">
                                                                    Your monthly cap is now <span className="font-bold">{currencyFn(p.tier2Limit)}</span>.
                                                                </p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        // --- UPDATED: Locked State ---
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-center text-muted-foreground mb-3">Tier 2 Progress</h4>
                                                            {p.tier2Limit > 0 && (
                                                                <p className="text-xs text-center text-muted-foreground -mt-2 mb-3">
                                                                    Tier 2 monthly cap: <span className="font-semibold text-slate-700">{currencyFn(p.tier2Limit)}</span>
                                                                </p>
                                                            )}
                                                            <Progress value={p.tier2SpendPct} className="h-2" indicatorClassName="bg-blue-500" />
                                                            <div className="flex justify-between items-center text-xs text-muted-foreground mt-1.5">
                                                                <span className="font-semibold text-blue-600">
                                                                    {currencyFn(p.tier2MinSpend - p.currentSpend)} to go
                                                                </span>
                                                                <span>{currencyFn(p.currentSpend)} / {currencyFn(p.tier2MinSpend)}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

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