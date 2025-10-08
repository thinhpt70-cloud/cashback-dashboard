import React, { useMemo, useState } from 'react';
import { Lightbulb, Sparkles, AlertTriangle, DollarSign, ShoppingCart, ChevronUp, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from './ui/button';

export default function EnhancedSuggestions({ rules, cards, monthlyCategorySummary, monthlySummary, activeMonth, currencyFn }) {
    // NEW: State to manage the visible slice of suggestions
    const [startIndex, setStartIndex] = useState(0);

    const suggestions = useMemo(() => {
        if (!Array.isArray(rules)) return [];
        
        const MINIMUM_RATE_THRESHOLD = 0.02;

        const candidates = rules.flatMap(rule => {
            if (rule.rate < MINIMUM_RATE_THRESHOLD || rule.status !== 'Active') return [];
            const applicableCategories = rule.applicableCategories?.length ? rule.applicableCategories : [rule.ruleName];
            return applicableCategories.map(category => ({
                ...rule,
                suggestionFor: category,
                parentRuleName: rule.ruleName,
            }));
        });

        const enrichedCandidates = candidates.map(candidate => {
            const card = cards.find(c => c.id === candidate.cardId);
            if (!card || card.status !== 'Active') return null;

            const categorySummary = monthlyCategorySummary.find(s => s.cardId === candidate.cardId && s.month === activeMonth && s.summaryId.endsWith(candidate.suggestionFor));
            const currentCashbackForCategory = categorySummary?.cashback || 0;

            const cardSummary = monthlySummary.find(s => s.cardId === candidate.cardId && s.month === activeMonth);
            const currentTotalSpendForCard = cardSummary?.spend || 0;
            
            const remainingCategoryCap = card.limitPerCategory > 0 ? Math.max(0, card.limitPerCategory - currentCashbackForCategory) : Infinity;
            
            const hasMetMinSpend = card.minimumMonthlySpend > 0 ? currentTotalSpendForCard >= card.minimumMonthlySpend : true;
            
            const spendingNeeded = remainingCategoryCap === Infinity ? Infinity : remainingCategoryCap / candidate.rate;

            return { ...candidate, cardName: card.name, remainingCategoryCap, hasMetMinSpend, spendingNeeded };
        }).filter(c => c && c.remainingCategoryCap > 0);

        enrichedCandidates.sort((a, b) => {
            if (b.rate !== a.rate) return b.rate - a.rate;
            if (b.hasMetMinSpend !== a.hasMetMinSpend) return b.hasMetMinSpend ? 1 : -1;
            return b.remainingCategoryCap - a.remainingCategoryCap;
        });

        return enrichedCandidates;
    }, [rules, cards, monthlyCategorySummary, monthlySummary, activeMonth]);

    const top5Suggestions = suggestions.slice(0, 5);

    // NEW: Logic to handle scrolling
    const VISIBLE_ITEMS = 4; // Set how many items to show at once
    const canScrollUp = startIndex > 0;
    const canScrollDown = startIndex < top5Suggestions.length - VISIBLE_ITEMS;
    
    const handleScroll = (direction) => {
        if (direction === 'up' && canScrollUp) {
            setStartIndex(prev => prev - 1);
        } else if (direction === 'down' && canScrollDown) {
            setStartIndex(prev => prev + 1);
        }
    };

    const visibleSuggestions = top5Suggestions.slice(startIndex, startIndex + VISIBLE_ITEMS);

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                {/* CHANGED: Header now includes navigation buttons */}
                <div className="flex justify-between items-center">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-sky-500" />
                        Top Cashback Opportunities
                    </CardTitle>
                    {top5Suggestions.length > VISIBLE_ITEMS && (
                         <div className="flex items-center gap-1">
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleScroll('up')} disabled={!canScrollUp}>
                                <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleScroll('down')} disabled={!canScrollDown}>
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </CardHeader>
            {/* CHANGED: CardContent now grows and hides overflow */}
            <CardContent className="flex-grow overflow-hidden">
                {top5Suggestions.length > 0 ? (
                    <div className="space-y-3">
                        {/* CHANGED: Now maps over the 'visibleSuggestions' slice */}
                        {visibleSuggestions.map((s, index) => (
                            <div key={`${s.id}-${s.suggestionFor}`} className="p-3 rounded-lg border bg-slate-50 shadow-sm">
                                <div className="flex justify-between items-start gap-3">
                                    <div>
                                        <p className="font-semibold text-slate-800">
                                            <span className="text-sky-600 mr-2">#{startIndex + index + 1}</span>
                                            {s.category}
                                        </p>
                                        <p className="text-sm text-slate-500 ml-7">{s.cardName}</p>
                                    </div>
                                    {/* CHANGED: Badge is now smaller and has a different style */}
                                    <Badge variant="outline" className="text-base font-bold text-sky-700 bg-sky-100 border-sky-200 px-2.5 py-1">
                                        {(s.rate * 100).toFixed(1)}%
                                    </Badge>
                                </div>
                                
                                <div className="mt-2 pt-2 border-t border-slate-200 text-xs text-slate-600 flex justify-between items-center flex-wrap gap-x-4 gap-y-1">
                                    <span className="flex items-center gap-1.5">
                                        <DollarSign className="h-3.5 w-3.5 text-emerald-600"/>
                                        <span className="font-medium text-emerald-700">{s.remainingCategoryCap === Infinity ? 'Unlimited' : currencyFn(s.remainingCategoryCap)}</span>
                                        <span>left</span>
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <ShoppingCart className="h-3.5 w-3.5"/>
                                        <span>Spend</span>
                                        <span className="font-medium text-slate-800">{s.spendingNeeded === Infinity ? 'N/A' : currencyFn(s.spendingNeeded)}</span>
                                    </span>
                                </div>

                                {!s.hasMetMinSpend && (
                                    <div className="mt-2 flex items-center gap-2 text-xs text-orange-700 bg-orange-50 p-2 rounded-md border border-orange-200">
                                        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                                        <span>Minimum spend not met on this card.</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center p-4 rounded-lg bg-emerald-50 h-full min-h-[200px]">
                        <Sparkles className="h-8 w-8 text-emerald-500 mb-2" />
                        <p className="font-semibold text-emerald-800">All Top Tiers Maxed Out!</p>
                        <p className="text-xs text-emerald-700 mt-1">No high-tier cashback opportunities (2%+) are available right now.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}