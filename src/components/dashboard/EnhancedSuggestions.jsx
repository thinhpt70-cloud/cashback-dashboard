import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Lightbulb, ChevronUp, ChevronDown, AlertTriangle, Sparkles, DollarSign, ShoppingCart } from 'lucide-react';

export default function EnhancedSuggestions({ rules, cards, monthlyCategorySummary, monthlySummary, activeMonth, currencyFn, getCurrentCashbackMonthForCard }) {
    const [startIndex, setStartIndex] = useState(0);

    const isLiveView = activeMonth === 'live';

    const suggestions = useMemo(() => {
        const MINIMUM_RATE_THRESHOLD = 0.02;

        const allCandidates = rules.flatMap(rule => {
            if (rule.rate < MINIMUM_RATE_THRESHOLD || rule.status !== 'Active') return [];
            
            const card = cards.find(c => c.id === rule.cardId);
            if (!card || card.status === 'Closed') return [];

            const monthForCard = isLiveView ? getCurrentCashbackMonthForCard(card) : activeMonth;

            const categorySummary = monthlyCategorySummary.find(s => s.cardId === rule.cardId && s.month === monthForCard && s.summaryId.endsWith(rule.ruleName));
            const cardSummary = monthlySummary.find(s => s.cardId === rule.cardId && s.month === monthForCard);
            
            const currentCashbackForCategory = categorySummary?.cashback || 0;
            const currentTotalSpendForCard = cardSummary?.spend || 0;
            const remainingCategoryCap = card.limitPerCategory > 0 ? Math.max(0, card.limitPerCategory - currentCashbackForCategory) : Infinity;
            
            if (remainingCategoryCap === 0) return [];
            
            const hasMetMinSpend = card.minimumMonthlySpend > 0 ? currentTotalSpendForCard >= card.minimumMonthlySpend : true;
            const spendingNeeded = remainingCategoryCap === Infinity ? Infinity : remainingCategoryCap / rule.rate;
            const categories = rule.category?.length ? rule.category : [rule.ruleName];
            
            return categories.map(cat => ({
                ...rule, suggestionFor: cat, parentRuleName: rule.ruleName, cardName: card.name,
                remainingCategoryCap, hasMetMinSpend, spendingNeeded
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
                if (finalChoice.hasMetMinSpend && bestUnqualified) {
                    if (bestUnqualified.rate > finalChoice.rate || bestUnqualified.remainingCategoryCap > finalChoice.remainingCategoryCap) {
                        hasBetterChallenger = true;
                    }
                }
                finalChoice = { ...finalChoice, hasBetterChallenger };
            }
            return finalChoice;
        }).filter(Boolean);

        bestCardPerCategory.sort((a, b) => {
            if (a.hasMetMinSpend !== b.hasMetMinSpend) return a.hasMetMinSpend ? -1 : 1;
            if (b.rate !== a.rate) return b.rate - a.rate;
            return b.remainingCategoryCap - a.remainingCategoryCap;
        });

        return bestCardPerCategory;
    }, [rules, cards, monthlyCategorySummary, monthlySummary, activeMonth, isLiveView, getCurrentCashbackMonthForCard]);

    const topSuggestions = suggestions;
    const VISIBLE_ITEMS = 5;
    
    const canScrollUp = startIndex > 0;
    const canScrollDown = startIndex < topSuggestions.length - VISIBLE_ITEMS;

    const handleScroll = (direction) => {
        if (direction === 'up' && canScrollUp) setStartIndex(prev => prev - 1);
        else if (direction === 'down' && canScrollDown) setStartIndex(prev => prev + 1);
    };

    const visibleSuggestions = topSuggestions.slice(startIndex, startIndex + VISIBLE_ITEMS);

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-sky-500" />
                        Top Cashback Opportunities
                    </CardTitle>
                    {topSuggestions.length > VISIBLE_ITEMS && (
                         <div className="flex items-center gap-1">
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleScroll('up')} disabled={!canScrollUp}><ChevronUp className="h-4 w-4" /></Button>
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleScroll('down')} disabled={!canScrollDown}><ChevronDown className="h-4 w-4" /></Button>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                {visibleSuggestions.length > 0 ? (
                    <div className="space-y-3">
                        {visibleSuggestions.map((s, index) => (
                            <div key={`${s.id}-${s.suggestionFor}`} className="p-3 rounded-lg border bg-slate-50/70 shadow-sm">
                                <div className="flex justify-between items-start gap-3">
                                    <div>
                                        <p className="font-semibold text-slate-800">
                                            <span className="text-sky-600 mr-2">#{startIndex + index + 1}</span>
                                            {s.suggestionFor}
                                        </p>
                                        <div className="flex items-center gap-1.5 text-sm text-slate-500 ml-7">
                                            <span>{s.cardName}</span>
                                            {!s.hasMetMinSpend && (
                                                <TooltipProvider delayDuration={100}>
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <AlertTriangle className="h-4 w-4 text-orange-400" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Minimum spend not met on this card.</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                            {s.hasBetterChallenger && (
                                                <TooltipProvider delayDuration={100}>
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <Sparkles className="h-4 w-4 text-blue-500" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>A better card exists but its minimum spend is not met.</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-base font-bold text-sky-700 bg-sky-100 border-sky-200 px-2.5 py-1">{(s.rate * 100).toFixed(1)}%</Badge>
                                </div>
                                <div className="mt-2 pt-2 border-t border-slate-200 text-xs text-slate-600 flex justify-between items-center flex-wrap gap-x-4 gap-y-1">
                                    <span className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5 text-emerald-600"/><span className="font-medium text-emerald-700">{s.remainingCategoryCap === Infinity ? 'Unlimited' : currencyFn(s.remainingCategoryCap)}</span><span>left</span></span>
                                    <span className="flex items-center gap-1.5"><ShoppingCart className="h-3.5 w-3.5"/><span>Spend</span><span className="font-medium text-slate-800">{s.spendingNeeded === Infinity ? 'N/A' : currencyFn(s.spendingNeeded)}</span></span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center p-4 rounded-lg bg-emerald-50 h-full min-h-[200px]">
                        <Sparkles className="h-8 w-8 text-emerald-500 mb-2" />
                        <p className="font-semibold text-emerald-800">All Qualified Tiers Maxed Out!</p>
                        <p className="text-xs text-emerald-700 mt-1">No high-tier opportunities are available on cards that have met their minimum spend.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}