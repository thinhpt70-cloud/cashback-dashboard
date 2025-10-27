import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/card";
import { Badge } from "../../../ui/badge";
// --- REMOVED: Dialog imports
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../../ui/dialog";
// --- ADDED: Accordion imports
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../../ui/accordion";
import { Lightbulb, AlertTriangle, Sparkles, DollarSign, ShoppingCart, ArrowUpCircle, Award } from 'lucide-react';

// --- NEW SUB-COMPONENT: RateInfoText ---
// No changes
function RateInfoText({ suggestion, currencyFn }) {
    if (!suggestion) return null;

    const { isBoosted, hasTier2, tier2MinSpend, currentSpend, tier2Rate } = suggestion;

    if (isBoosted) {
        return (
            <p className="text-sm text-indigo-600 font-medium">
                ✨ Tier 2 rate active! (Met {currencyFn(tier2MinSpend)} spend)
            </p>
        );
    }

    if (hasTier2) {
        return (
            <p className="text-sm text-slate-600">
                Spend {currencyFn(tier2MinSpend - currentSpend)} more to unlock {(tier2Rate * 100).toFixed(1)}%.
            </p>
        );
    }

    return (
        <p className="text-sm text-slate-600">
            Standard cashback rate.
        </p>
    );
}

// --- *** UPDATED SUB-COMPONENT: HeroSuggestion *** ---
// Refactored layout to be horizontal and match concept image
function HeroSuggestion({ suggestion, currencyFn }) {
    const s = suggestion; // for brevity

    return (
        <div className="p-4 rounded-lg border bg-white shadow-sm">
            {/* Header: Top Pick Badge + Card Name */}
            <div className="flex items-center justify-between gap-2">
                <Badge variant="default" className="bg-sky-600 w-fit">
                    <Award className="h-4 w-4 mr-1.5" />
                    TOP PICK
                </Badge>
                <span className="text-sm font-medium text-slate-500 truncate" title={s.cardName}>{s.cardName}</span>
            </div>

            {/* Body: Split into two columns for better space use */}
            <div className="mt-2 flex items-end justify-between gap-4">
                
                {/* Left Column: Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-2xl font-semibold text-slate-800 break-words truncate" title={s.suggestionFor}>
                        {s.suggestionFor}
                    </h3>
                    <div className="mt-1">
                        <RateInfoText suggestion={s} currencyFn={currencyFn} />
                    </div>
                </div>

                {/* Right Column: Rate (large font) */}
                <div className="flex-shrink-0">
                     <p className="text-4xl font-bold text-sky-600">
                        {(s.rate * 100).toFixed(1)}%
                    </p>
                </div>
            </div>

            {/* Footer: Stats (muted style) */}
            <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-x-4 gap-y-1">
                <span className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5 text-emerald-600" /><span className="font-medium text-emerald-700">{s.remainingCategoryCap === Infinity ? 'Unlimited' : currencyFn(s.remainingCategoryCap)}</span><span>left</span></span>
                <span className="flex items-center gap-1.5"><ShoppingCart className="h-3.5 w-3.5" /><span>Spend</span><span className="font-medium text-slate-700">{s.spendingNeeded === Infinity ? 'N/A' : currencyFn(s.spendingNeeded)}</span></span>
            </div>
        </div>
    );
}

// --- REMOVED SUB-COMPONENT: SuggestionDetailDialog ---
// This component is no longer needed and is replaced by AccordionContent

// --- REMOVED SUB-COMPONENT: RunnerUpItem ---
// This component is no longer needed; its content is built directly
// into the AccordionTrigger and AccordionContent in the main component.


// --- REFACTORED MAIN COMPONENT ---
export default function EnhancedSuggestions({ rules, cards, monthlyCategorySummary, monthlySummary, activeMonth, currencyFn, getCurrentCashbackMonthForCard }) {
    
    // --- Core logic is preserved as requested ---
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

            const remainingCategoryCap = effectiveCategoryLimit > 0 ? Math.max(0, effectiveCategoryLimit - currentCashbackForCategory) : Infinity;

            if (remainingCategoryCap === 0) return [];
            
            const hasMetMinSpend = card.minimumMonthlySpend > 0 ? currentTotalSpendForCard >= card.minimumMonthlySpend : true;
            const spendingNeeded = remainingCategoryCap === Infinity ? Infinity : remainingCategoryCap / effectiveRate;
            
            const categories = rule.category?.length ? rule.category : [rule.ruleName];
            
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
                currentSpend: currentTotalSpendForCard
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
                    if (bestUnqualified.rate > finalChoice.rate || (bestUnqualified.rate === finalChoice.rate && bestUnqualified.remainingCategoryCap > finalChoice.remainingCategoryCap)) {
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
    }, [rules, cards, monthlyCategorySummary, monthlySummary, activeMonth, getCurrentCashbackMonthForCard]);

    const topSuggestion = suggestions[0];
    const otherSuggestions = suggestions.slice(1);

    return (
        // --- UPDATED: Added max-h-[600px] to main card
        <Card className="flex flex-col h-full max-h-[600px]">
            <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-sky-500" />
                    Top Cashback Opportunities
                </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col">
                {/* Scenario 1: No suggestions (Unchanged) */}
                {suggestions.length === 0 && (
                    <div className="flex flex-col items-center justify-center text-center p-4 rounded-lg bg-emerald-50 h-full min-h-[200px]">
                        <Sparkles className="h-8 w-8 text-emerald-500 mb-2" />
                        <p className="font-semibold text-emerald-800">All Qualified Tiers Maxed Out!</p>
                        <p className="text-xs text-emerald-700 mt-1">No high-tier opportunities are available on cards that have met their minimum spend.</p>
                    </div>
                )}

                {/* Scenarios 2 & 3: At least one suggestion exists */}
                {suggestions.length > 0 && (
                    <div className="space-y-3 flex flex-col flex-1">
                        <HeroSuggestion 
                            suggestion={topSuggestion} 
                            currencyFn={currencyFn} 
                        />

                        {/* Scenario 3: More than one suggestion */}
                        {otherSuggestions.length > 0 && (
                            <div className="flex flex-col flex-1 min-h-0">
                                <div className="flex items-center gap-3 my-3">
                                    <h4 className="text-sm font-medium text-slate-600">Other Suggestions</h4>
                                    <div className="flex-grow border-t border-slate-200"></div>
                                </div>
                                
                                {/* --- UPDATED: Replaced scrolling div with Accordion --- */}
                                <Accordion type="single" collapsible className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2">
                                    {otherSuggestions.map((s, index) => {
                                        const hasStatus = !s.hasMetMinSpend || s.hasBetterChallenger;

                                        return (
                                            <AccordionItem 
                                                key={`${s.id}-${s.suggestionFor}`} 
                                                value={s.suggestionFor}
                                                className="rounded-lg border bg-white shadow-sm overflow-hidden" // Item is styled as a card
                                            >
                                                <AccordionTrigger className="p-3 hover:no-underline hover:bg-slate-50 w-full text-left data-[state=open]:border-b border-slate-200">
                                                    {/* Content from old RunnerUpItem (top half) */}
                                                    <div className="w-full">
                                                        <div className="flex justify-between items-center gap-3">
                                                            <div className="flex items-baseline gap-2 flex-1 min-w-0">
                                                                <span className="text-sm font-semibold text-sky-600">#{index + 2}</span>
                                                                <p className="font-medium text-slate-800 truncate" title={s.suggestionFor}>{s.suggestionFor}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                <span className="text-xs text-slate-500 hidden sm:block">{s.cardName}</span>
                                                                <Badge variant="outline" className="text-base font-bold text-sky-700 bg-sky-100 border-sky-200">
                                                                    {(s.rate * 100).toFixed(1)}%
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <span className="text-xs text-slate-500 sm:hidden ml-7 -mt-1 block">{s.cardName}</span>
                                                    </div>
                                                </AccordionTrigger>
                                                
                                                <AccordionContent className="p-4 pt-3 bg-white">
                                                    {/* Content from old SuggestionDetailDialog */}
                                                    <div className="space-y-3">
                                                        {/* 1. Rate Tier Info */}
                                                        <RateInfoText suggestion={s} currencyFn={currencyFn} />

                                                        {/* 2. Stats */}
                                                        <div className="pt-3 border-t border-slate-200 text-xs text-slate-600 flex justify-between items-center flex-wrap gap-x-4 gap-y-1">
                                                            <span className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5 text-emerald-600" /><span className="font-medium text-emerald-700">{s.remainingCategoryCap === Infinity ? 'Unlimited' : currencyFn(s.remainingCategoryCap)}</span><span>left</span></span>
                                                            <span className="flex items-center gap-1.5"><ShoppingCart className="h-3.5 w-3.5" /><span>Spend</span><span className="font-medium text-slate-800">{s.spendingNeeded === Infinity ? 'N/A' : currencyFn(s.spendingNeeded)}</span></span>
                                                        </div>

                                                        {/* 3. Status Details (Alerts) */}
                                                        {hasStatus && (
                                                            <div className="space-y-2 pt-3 border-t border-slate-200">
                                                                {!s.hasMetMinSpend && (
                                                                    <div className="flex items-start gap-2 text-sm p-3 rounded-md bg-orange-50 border border-orange-200">
                                                                        <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                                                                        <div>
                                                                            <p className="font-semibold text-orange-800">Minimum Spend Not Met</p>
                                                                            <p className="text-orange-700 text-xs">This rate is not active until you meet the card's minimum spend requirement.</p>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {s.hasBetterChallenger && (
                                                                    <div className="flex items-start gap-2 text-sm p-3 rounded-md bg-blue-50 border border-blue-200">
                                                                        <ArrowUpCircle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                                                        <div>
                                                                            <p className="font-semibold text-blue-800">Better Offer Available</p>
                                                                            <p className="text-blue-700 text-xs">A card with a higher rate or cap exists, but its minimum spend is not currently met.</p>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        )
                                    })}
                                </Accordion>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}