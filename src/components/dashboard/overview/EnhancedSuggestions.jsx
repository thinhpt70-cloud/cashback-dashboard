import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Lightbulb, AlertTriangle, Sparkles, DollarSign, ShoppingCart, ArrowUpCircle, Award } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from '@/lib/utils';
import { calculateDaysLeftInCashbackMonth, calculateDaysUntilStatement } from '@/lib/date';

function RateStatusBadge({ suggestion }) {
    if (suggestion.isBoosted) {
        return (
            <Badge variant="default" className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white dark:text-green-100 text-[10px] h-4 px-1.5 whitespace-nowrap overflow-hidden text-ellipsis shrink-3 min-w-[30px] rounded-sm">
                ✨ Tier 2
            </Badge>
        );
    }
    if (suggestion.hasTier2) {
        return (
            <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700 text-[10px] h-4 px-1.5 whitespace-nowrap overflow-hidden text-ellipsis shrink-3 min-w-[30px] rounded-sm">
                Tier 2 Avail
            </Badge>
        );
    }
    return null; 
}

// Circular indicator showing progress roughly
function CircularIndicator({ progress, colorClass }) {
    const radius = 10;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - progress * circumference;

    return (
        <div className="relative inline-flex items-center justify-center shrink-0">
            <svg className="transform -rotate-90 w-6 h-6">
                <circle
                    className="text-slate-200 dark:text-slate-700"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="12"
                    cy="12"
                />
                <circle
                    className={colorClass || "text-primary"}
                    strokeWidth="3"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="12"
                    cy="12"
                />
            </svg>
        </div>
    );
}

function SuggestionInfoCallout({ suggestion, currencyFn }) {
    const s = suggestion;

    if (s.isBoosted) {
        return (
            <div className="flex items-start gap-3 text-sm p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30">
                <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                <div>
                    <p className="font-medium text-green-900 dark:text-green-300">Tier 2 Active</p>
                    <p className="text-green-700 dark:text-green-400/80 text-sm mt-0.5 leading-snug">
                        This card has met its {currencyFn(s.tier2MinSpend)} spend requirement, unlocking a higher cashback rate or an increased category limit.
                    </p>
                </div>
            </div>
        );
    }

    if (s.hasTier2) {
        return (
            <div className="flex items-start gap-3 text-sm p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30">
                <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                    <p className="font-medium text-blue-900 dark:text-blue-300">Tier 2 Available</p>
                    <p className="text-blue-700 dark:text-blue-400/80 text-sm mt-0.5 leading-snug">
                        Spend {currencyFn(s.tier2MinSpend - s.currentSpend)} more on this card to unlock a better rate of <span className="font-medium">{(s.tier2Rate * 100).toFixed(1)}%</span>.
                    </p>
                </div>
            </div>
        );
    }
    
    return null;
}

function SuggestionPopupContent({ suggestion: s, currencyFn }) {
    let daysLeftDisplay;
    let daysLeftColor = "text-foreground dark:text-slate-200";

    if (s.daysLeft === null) {
        daysLeftDisplay = "Completed";
        daysLeftColor = "text-emerald-600";
    } else if (s.daysLeft === 0) {
        daysLeftDisplay = "0 days (Cycle ends today)";
    } else {
        daysLeftDisplay = s.daysLeft === 1 ? `${s.daysLeft} day` : `${s.daysLeft} days`;
    }

    return (
        <div className="space-y-6">
            <DialogHeader>
                <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                    {s.suggestionFor}
                </DialogTitle>
                <DialogDescription>
                    {s.cardName}
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
                <SuggestionInfoCallout suggestion={s} currencyFn={currencyFn} />

                {!s.hasMetMinSpend && (
                    <div className="flex items-start gap-3 text-sm p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/30">
                        <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-orange-900 dark:text-orange-300">Minimum Spend Not Met</p>
                            <p className="text-orange-700 dark:text-orange-400/80 text-sm mt-0.5 leading-snug">
                                Spend <span className="font-medium">{currencyFn(s.minimumMonthlySpend - s.currentSpend)}</span> more on this card to activate this rate.
                            </p>
                        </div>
                    </div>
                )}

                {s.hasBetterChallenger && s.challengerDetails && (
                     <div className="flex items-start gap-3 text-sm p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30">
                        <ArrowUpCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-blue-900 dark:text-blue-300">Better Offer Available</p>
                            <p className="text-blue-700 dark:text-blue-400/80 text-sm mt-0.5 leading-snug">
                                <span className="font-medium">{s.challengerDetails.cardName}</span> offers <span className="font-medium">{(s.challengerDetails.rate * 100).toFixed(1)}%</span>.
                            </p>
                            <p className="text-blue-700 dark:text-blue-400/80 text-sm mt-1 leading-snug">
                                It's not active because its {currencyFn(s.challengerDetails.minSpend)} min. spend is not met (Current: {currencyFn(s.challengerDetails.currentSpend)}).
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1 p-4 bg-muted/50 rounded-2xl">
                        <span className="text-sm text-muted-foreground">Cashback Rate</span>
                        <span className="text-xl font-medium">{(s.rate * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex flex-col gap-1 p-4 bg-muted/50 rounded-2xl">
                        <span className="text-sm text-muted-foreground">Days Left</span>
                        <span className={cn("text-xl font-medium", daysLeftColor)}>{daysLeftDisplay}</span>
                    </div>
                    <div className="flex flex-col gap-1 p-4 bg-muted/50 rounded-2xl">
                        <span className="text-sm text-muted-foreground">Remaining CB</span>
                        <span className="text-xl font-medium">{s.remainingCategoryCap === Infinity ? 'Unlimited' : currencyFn(s.remainingCategoryCap)}</span>
                    </div>
                    <div className="flex flex-col gap-1 p-4 bg-muted/50 rounded-2xl">
                        <span className="text-sm text-muted-foreground">Remaining Spend</span>
                        <span className="text-xl font-medium">{s.spendingNeeded === Infinity ? 'N/A' : currencyFn(s.spendingNeeded)}</span>
                    </div>
                    {s.transactionLimit > 0 && (
                        <div className="flex flex-col gap-1 p-4 bg-muted/50 rounded-2xl">
                            <span className="text-sm text-muted-foreground">Max / Trans</span>
                            <span className="text-xl font-medium">{currencyFn(s.transactionLimit)}</span>
                        </div>
                    )}
                    {s.secondaryTransactionLimit > 0 && (
                        <div className="flex flex-col gap-1 p-4 bg-muted/50 rounded-2xl">
                            <span className="text-sm text-muted-foreground">2nd Tx Limit</span>
                            <span className="text-xl font-medium">{currencyFn(s.secondaryTransactionLimit)}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


export default function EnhancedSuggestions({ rules, cards, monthlyCategorySummary, monthlySummary, activeMonth, currencyFn, getCurrentCashbackMonthForCard, isLoading }) {
    const suggestions = useMemo(() => {
        const MINIMUM_RATE_THRESHOLD = 0.02;

        const allCandidates = rules.flatMap(rule => {
            const card = cards.find(c => c.id === rule.cardId);
            if (!card || card.status === 'Closed' || rule.status !== 'Active') return [];

            const monthForCard = activeMonth === 'live' ? getCurrentCashbackMonthForCard(card) : activeMonth;
            
            const cardSummary = monthlySummary.find(s => s.cardId === rule.cardId && s.month === monthForCard);
            const categorySummary = monthlyCategorySummary.find(s => s.cardId === rule.cardId && s.month === monthForCard && s.summaryId.endsWith(rule.ruleName));
            
            const currentTotalSpendForCard = cardSummary?.spend || 0;
            const currentCashbackForCategory = categorySummary?.cashback || 0; 

            const isTier2Met = card.cashbackType === '2 Tier' && card.tier2MinSpend > 0 && currentTotalSpendForCard >= card.tier2MinSpend;
            const effectiveRate = isTier2Met && rule.tier2Rate ? rule.tier2Rate : rule.rate;
            const effectiveCategoryLimit = (isTier2Met && rule.tier2CategoryLimit) ? rule.tier2CategoryLimit : rule.categoryLimit;
            const isBoosted = isTier2Met && (rule.tier2Rate > rule.rate || rule.tier2CategoryLimit > rule.categoryLimit);

            const hasTier2 = card.cashbackType === '2 Tier' && (rule.tier2Rate > rule.rate || rule.tier2CategoryLimit > rule.categoryLimit);

            if (effectiveRate < MINIMUM_RATE_THRESHOLD) return [];

            const cardTierLimit = isTier2Met ? card.tier2Limit : card.overallMonthlyLimit;
            const dynamicLimit = cardSummary?.monthlyCashbackLimit;
            const effectiveCardLimit = dynamicLimit > 0 ? dynamicLimit : cardTierLimit;

            const remainingCardCap = effectiveCardLimit > 0
                ? Math.max(0, effectiveCardLimit - (cardSummary?.cashback || 0))
                : Infinity;

            let remainingCategoryCap = effectiveCategoryLimit > 0 ? Math.max(0, effectiveCategoryLimit - currentCashbackForCategory) : Infinity;

            remainingCategoryCap = Math.min(remainingCategoryCap, remainingCardCap);

            if (remainingCategoryCap === 0) return [];
            
            const hasMetMinSpend = card.minimumMonthlySpend > 0 ? currentTotalSpendForCard >= card.minimumMonthlySpend : true;
            const spendingNeeded = remainingCategoryCap === Infinity ? Infinity : remainingCategoryCap / effectiveRate;
            
            const categories = rule.category?.length ? rule.category : [rule.ruleName];

            const { days, status } = card.useStatementMonthForPayments
                ? calculateDaysLeftInCashbackMonth(monthForCard)
                : calculateDaysUntilStatement(card.statementDay, monthForCard);
            
            return categories.map(cat => ({
                ...rule,
                rate: effectiveRate,
                suggestionFor: cat, 
                parentRuleName: rule.ruleName, 
                cardName: card.name,
                remainingCategoryCap, 
                hasMetMinSpend, 
                spendingNeeded,
                isBoosted,
                hasTier2,
                tier1Rate: rule.rate,
                tier2Rate: rule.tier2Rate,
                tier2MinSpend: card.tier2MinSpend || 0,
                currentSpend: currentTotalSpendForCard,
                minimumMonthlySpend: card.minimumMonthlySpend || 0, 
                currentCategoryCashback: currentCashbackForCategory, 
                daysLeft: days,       
                cycleStatus: status,  
                categoryLimit: rule.categoryLimit || Infinity, 
                tier2CategoryLimit: rule.tier2CategoryLimit || Infinity, 
                transactionLimit: rule.transactionLimit || 0, 
                secondaryTransactionLimit: rule.secondaryTransactionLimit || 0 
            }));
        }).filter(Boolean);

        const groupedByCategory = allCandidates.reduce((acc, candidate) => {
            const category = candidate.suggestionFor;
            if (!acc[category]) acc[category] = [];
            acc[category].push(candidate);
            return acc;
        }, {});

        const bestCardPerCategory = Object.values(groupedByCategory).map(group => {
            const qualifiedCards = group.filter(c => c.hasMetMinSpend);
            const unqualifiedCards = group.filter(c => !c.hasMetMinSpend);
            
            const ranker = (a, b) => (b.rate - a.rate) || (b.remainingCategoryCap - a.remainingCategoryCap);
            
            qualifiedCards.sort(ranker);
            unqualifiedCards.sort(ranker);
            const bestQualified = qualifiedCards[0];
            const bestUnqualified = unqualifiedCards[0];

            let finalChoice = bestQualified || bestUnqualified;

            if (finalChoice) {
                let hasBetterChallenger = false;
                let challengerDetails = null; 

                if (finalChoice.hasMetMinSpend && bestUnqualified) {
                    if (bestUnqualified.rate > finalChoice.rate || (bestUnqualified.rate === finalChoice.rate && bestUnqualified.remainingCategoryCap > finalChoice.remainingCategoryCap)) {
                        hasBetterChallenger = true;
                        challengerDetails = {
                            cardName: bestUnqualified.cardName,
                            rate: bestUnqualified.rate,
                            minSpend: bestUnqualified.minimumMonthlySpend,
                            currentSpend: bestUnqualified.currentSpend
                        };
                    }
                }
                finalChoice = { ...finalChoice, hasBetterChallenger, challengerDetails }; 
            }
            return finalChoice;
        }).filter(Boolean);

        bestCardPerCategory.sort((a, b) => {
            if (a.hasMetMinSpend !== b.hasMetMinSpend) return a.hasMetMinSpend ? -1 : 1;
            if (b.rate !== a.rate) return b.rate - a.rate;
            return b.remainingCategoryCap - a.remainingCategoryCap;
        });

        return bestCardPerCategory;
    }, [rules, cards, monthlyCategorySummary, monthlySummary, activeMonth, getCurrentCashbackMonthForCard]);

    return (
        <Card className="flex flex-col h-full max-h-[380px]">
            <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    Top Cashback Opportunities
                </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden">
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map(i => (
                           <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                        ))}
                    </div>
                ) : (
                    <>
                    {suggestions.length === 0 && (
                        <div className="flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-muted/40 h-full min-h-[200px]">
                            <Sparkles className="h-8 w-8 text-emerald-500 mb-2 opacity-80" />
                            <p className="font-medium text-foreground">All Qualified Tiers Maxed Out!</p>
                            <p className="text-sm text-muted-foreground mt-1">No high-tier opportunities are available on cards that have met their minimum spend.</p>
                        </div>
                    )}

                    {suggestions.length > 0 && (
                        <div className="space-y-2 flex flex-col flex-1">
                            {suggestions.map((s, index) => {
                                const isTopPick = index === 0;

                                // Calculate simple progress if there's a category limit
                                let progress = 0.05; // Base tiny progress
                                if (s.categoryLimit !== Infinity && s.currentCategoryCashback > 0) {
                                    // Make progress relative to the limit
                                    const limit = s.hasTier2 ? s.tier2CategoryLimit : s.categoryLimit;
                                    if (limit > 0) {
                                        progress = Math.min(1, s.currentCategoryCashback / limit);
                                    }
                                }

                                const colorClasses = [
                                    "text-blue-600",
                                    "text-emerald-500",
                                    "text-purple-500",
                                    "text-orange-500",
                                    "text-sky-400"
                                ];
                                const circleColor = isTopPick ? "text-primary" : colorClasses[index % colorClasses.length];

                                return (
                                    <Dialog key={`${s.id}-${s.suggestionFor}`}>
                                        <DialogTrigger asChild>
                                            <button
                                                className={cn(
                                                    "w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-colors",
                                                    isTopPick
                                                        ? "bg-muted/50 border border-border shadow-sm hover:bg-muted/70"
                                                        : "bg-transparent hover:bg-muted/30"
                                                )}
                                            >
                                                <CircularIndicator progress={progress} colorClass={circleColor} />

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        {!s.hasMetMinSpend && (
                                                            <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
                                                        )}
                                                        {s.hasBetterChallenger && (
                                                            <ArrowUpCircle className="h-4 w-4 text-blue-500 shrink-0" />
                                                        )}
                                                        <span className="font-medium text-base text-foreground truncate block">
                                                            {s.suggestionFor}
                                                        </span>
                                                        {(s.isBoosted || s.hasTier2) && (
                                                            <div className="hidden sm:block ml-1">
                                                                <RateStatusBadge suggestion={s} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-sm text-muted-foreground truncate">{s.cardName}</span>
                                                        {(s.isBoosted || s.hasTier2) && (
                                                            <div className="sm:hidden">
                                                                <RateStatusBadge suggestion={s} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="shrink-0 flex flex-col items-end gap-1">
                                                    {isTopPick && (
                                                        <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted font-bold text-[9px] px-1.5 py-0 h-[18px] uppercase tracking-wider">
                                                            Top Pick
                                                        </Badge>
                                                    )}
                                                    <div className="font-semibold text-xl text-foreground">
                                                        {(s.rate * 100).toFixed(1)}%
                                                    </div>
                                                </div>
                                            </button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-md">
                                            <SuggestionPopupContent suggestion={s} currencyFn={currencyFn} />
                                        </DialogContent>
                                    </Dialog>
                                );
                            })}
                        </div>
                    )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
