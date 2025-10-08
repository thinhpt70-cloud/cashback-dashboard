import React, { useMemo } from 'react';
import { Lightbulb, Sparkles, AlertTriangle, DollarSign, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";

export default function EnhancedSuggestions({ rules, cards, monthlyCategorySummary, monthlySummary, activeMonth, currencyFn }) {
        const suggestions = useMemo(() => {
            if (!Array.isArray(rules)) return [];
            
            const MINIMUM_RATE_THRESHOLD = 0.02; // Ignore any offer below 2%

            const candidates = rules.flatMap(rule => {
                if (rule.rate < MINIMUM_RATE_THRESHOLD) return [];
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

                const categorySummary = monthlyCategorySummary.find(s => s.cardId === candidate.cardId && s.month === activeMonth && s.summaryId.endsWith(candidate.parentRuleName));
                const currentCashbackForCategory = categorySummary?.cashback || 0;

                const cardSummary = monthlySummary.find(s => s.cardId === candidate.cardId && s.month === activeMonth);
                const currentTotalSpendForCard = cardSummary?.spend || 0;
                
                const remainingCategoryCap = candidate.limitPerCategory > 0 ? Math.max(0, candidate.limitPerCategory - currentCashbackForCategory) : Infinity;
                
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

        return (
            <Card className="h-full flex flex-col">
                <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-sky-500" />
                        Top 5 Cashback Opportunities
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                    {top5Suggestions.length > 0 ? (
                        <div className="space-y-3">
                            {top5Suggestions.map((s, index) => (
                                <div key={`${s.id}-${s.suggestionFor}`} className="p-3 rounded-lg border bg-slate-50 shadow-sm">
                                    <div className="flex justify-between items-start gap-3">
                                        <div>
                                            <p className="font-semibold text-slate-800">
                                                <span className="text-sky-600 mr-2">#{index + 1}</span>
                                                {s.suggestionFor}
                                            </p>
                                            <p className="text-sm text-slate-500 ml-7">{s.cardName}</p>
                                        </div>
                                        <Badge className="text-xl font-bold bg-sky-500 text-white py-1 px-4">
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
    

