import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/card";
import { Badge } from "../../../ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../../ui/accordion";
import { Lightbulb, AlertTriangle, Sparkles, DollarSign, ShoppingCart, ArrowUpCircle, Award, CalendarClock, Info } from 'lucide-react';
import { calculateDaysLeftInCashbackMonth, calculateDaysUntilStatement } from '../../../../lib/date';

// --- NEW SUB-COMPONENT: RateStatusBadge ---
function RateStatusBadge({ suggestion }) {
    if (suggestion.isBoosted) {
        return (
            <Badge variant="default" className="bg-indigo-600 hover:bg-indigo-700 text-xs">
                ✨ Tier 2 Active
            </Badge>
        );
    }

    if (suggestion.hasTier2) {
        return (
            <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50 text-xs">
                Tier 2 Available
            </Badge>
        );
    }

    return <Badge variant="outline" className="text-xs">Standard Rate</Badge>;
}

// --- NEW SUB-COMPONENT: SuggestionDetails (for Accordion Content) ---
function SuggestionDetails({ suggestion, currencyFn }) {
    const s = suggestion; // for brevity

    return (
        <div className="space-y-4">
            
            {/* 1. Status Details (Alerts) - Now more descriptive */}
            <div className="space-y-2">
                {!s.hasMetMinSpend && (
                    <div className="flex items-start gap-2 text-sm p-3 rounded-md bg-orange-50 border border-orange-200">
                        <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-orange-800">Minimum Spend Not Met</p>
                            <p className="text-orange-700 text-xs">
                                Spend <span className="font-bold">{currencyFn(s.minimumMonthlySpend - s.currentSpend)}</span> more on this card to activate this rate.
                            </p>
                        </div>
                    </div>
                )}
                {s.hasBetterChallenger && s.challengerDetails && (
                     <div className="flex items-start gap-2 text-sm p-3 rounded-md bg-blue-50 border border-blue-200">
                        <ArrowUpCircle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-blue-800">Better Offer Available</p>
                            <p className="text-blue-700 text-xs">
                                <span className="font-bold">{s.challengerDetails.cardName}</span> offers <span className="font-bold">{(s.challengerDetails.rate * 100).toFixed(1)}%</span>.
                            </p>
                            <p className="text-blue-700 text-xs mt-1">
                                It's not active because its {currencyFn(s.challengerDetails.minSpend)} min. spend is not met (Current: {currencyFn(s.challengerDetails.currentSpend)}).
                            </p>
                        </div>
                    </div>
                )}
            </div>
            
            {/* 2. Card & Cycle Stats */}
            <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-600">Card Status</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm p-3 rounded-md bg-slate-50 border">
                    <div className="space-y-0.5">
                        <p className="text-xs text-slate-500">Days Left in Cycle</p>
                        <p className="font-medium text-slate-800">{s.daysLeft} days</p>
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-xs text-slate-500">Cycle Status</p>
                        <p className="font-medium text-slate-800">{s.cycleStatus}</p>
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-xs text-slate-500">Total Card Spend</p>
                        <p className="font-medium text-slate-800">{currencyFn(s.currentSpend)}</p>
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-xs text-slate-500">This Category's CB</p>
                        <p className="font-medium text-slate-800">{currencyFn(s.currentCategoryCashback)}</p>
                    </div>
                </div>
            </div>

            {/* 3. Rule Breakdown */}
            <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-600">Rule Breakdown</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm p-3 rounded-md bg-slate-50 border">
                    <div className="space-y-0.5">
                        <p className="text-xs text-slate-500">Base Rate</p>
                        <p className="font-medium text-slate-800">{(s.tier1Rate * 100).toFixed(1)}%</p>
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-xs text-slate-500">Base Category Limit</p>
                        <p className="font-medium text-slate-800">{s.categoryLimit === Infinity ? 'Unlimited' : currencyFn(s.categoryLimit)}</p>
                    </div>
                    {s.hasTier2 && (
                        <>
                            <div className="space-y-0.5">
                                <p className="text-xs text-slate-500">Tier 2 Rate</p>
                                <p className="font-medium text-slate-800">{(s.tier2Rate * 100).toFixed(1)}%</p>
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-xs text-slate-500">Tier 2 Category Limit</p>
                                <p className="font-medium text-slate-800">{s.tier2CategoryLimit === Infinity ? 'Unlimited' : currencyFn(s.tier2CategoryLimit)}</p>
                            </div>
                        </>
                    )}
                    {s.transactionLimit > 0 && (
                        <div className="space-y-0.5">
                            <p className="text-xs text-slate-500">Max / Transaction</p>
                            <p className="font-medium text-slate-800">{currencyFn(s.transactionLimit)}</p>
                        </div>
                    )}
                    {s.secondaryTransactionLimit > 0 && (
                        <div className="space-y-0.5">
                            <p className="text-xs text-slate-500">2nd Tx Limit</p>
                            <p className="font-medium text-slate-800">{currencyFn(s.secondaryTransactionLimit)}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 4. Original Stats Footer */}
            <div className="pt-4 border-t border-slate-200 text-xs text-slate-600 flex justify-between items-center flex-wrap gap-x-4 gap-y-1">
                <span className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5 text-emerald-600" /><span className="font-medium text-emerald-700">{s.remainingCategoryCap === Infinity ? 'Unlimited' : currencyFn(s.remainingCategoryCap)}</span><span>left</span></span>
                <span className="flex items-center gap-1.5"><ShoppingCart className="h-3.5 w-3.5" /><span>Spend</span><span className="font-medium text-slate-800">{s.spendingNeeded === Infinity ? 'N/A' : currencyFn(s.spendingNeeded)}</span></span>
            </div>
        </div>
    );
}


// --- UPDATED SUB-COMPONENT: HeroSuggestion ---
function HeroSuggestion({ suggestion, currencyFn }) {
    const s = suggestion; // for brevity

    return (
        <div className="p-4 rounded-lg border-2 border-sky-500 bg-sky-50 shadow-md">
            {/* Header: Top Pick Badge + Card Name */}
            <div className="flex items-center justify-between gap-2">
                <Badge variant="default" className="bg-sky-600 w-fit">
                    <Award className="h-4 w-4 mr-1.5" />
                    TOP PICK
                </Badge>
                <span className="text-sm font-medium text-slate-600 truncate" title={s.cardName}>{s.cardName}</span>
            </div>

            {/* Body: Split into two columns */}
            <div className="mt-3 flex items-start justify-between gap-4">
                
                {/* Left Column: Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        {/* --- ADDED: Alert Icons --- */}
                        {!s.hasMetMinSpend && (
                            <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0" />
                        )}
                        {s.hasBetterChallenger && (
                             <ArrowUpCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                        )}
                        <h3 className="text-xl font-semibold text-slate-800 break-words truncate" title={s.suggestionFor}>
                            {s.suggestionFor}
                        </h3>
                    </div>
                    <div className="mt-1.5">
                        <RateStatusBadge suggestion={s} />
                    </div>
                </div>

                {/* Right Column: Rate (smaller font) */}
                <div className="flex-shrink-0 sm:text-right">
                     <p className="text-4xl font-bold text-sky-700">
                        {(s.rate * 100).toFixed(1)}%
                    </p>
                </div>
            </div>

            {/* Footer: Stats (reduced margins) */}
            <div className="mt-4 pt-3 border-t border-sky-200 text-xs text-slate-600 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-x-4 gap-y-1">
                <span className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5 text-emerald-600" /><span className="font-medium text-emerald-700">{s.remainingCategoryCap === Infinity ? 'Unlimited' : currencyFn(s.remainingCategoryCap)}</span><span>left</span></span>
                <span className="flex items-center gap-1.5"><ShoppingCart className="h-3.5 w-3.5" /><span>Spend</span><span className="font-medium text-slate-800">{s.spendingNeeded === Infinity ? 'N/A' : currencyFn(s.spendingNeeded)}</span></span>
            </div>
        </div>
    );
}


// --- REFACTORED MAIN COMPONENT ---
export default function EnhancedSuggestions({ rules, cards, monthlyCategorySummary, monthlySummary, activeMonth, currencyFn, getCurrentCashbackMonthForCard }) {
    
    // --- UPDATED: Core logic hook ---
    const suggestions = useMemo(() => {
        const MINIMUM_RATE_THRESHOLD = 0.02;

        const allCandidates = rules.flatMap(rule => {
            const card = cards.find(c => c.id === rule.cardId);
            if (!card || card.status === 'Closed' || rule.status !== 'Active') return [];

            const monthForCard = activeMonth === 'live' ? getCurrentCashbackMonthForCard(card) : activeMonth;
            
            const cardSummary = monthlySummary.find(s => s.cardId === rule.cardId && s.month === monthForCard);
            const categorySummary = monthlyCategorySummary.find(s => s.cardId === rule.cardId && s.month === monthForCard && s.summaryId.endsWith(rule.ruleName));
            
            const currentTotalSpendForCard = cardSummary?.spend || 0;
            const currentCashbackForCategory = categorySummary?.cashback || 0; // <-- ADDED: Get this value

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

            // --- ADDED: Date/Cycle Calculation ---
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
                // --- ADDED: New properties for enhanced details ---
                minimumMonthlySpend: card.minimumMonthlySpend || 0, // <-- Pass min spend
                currentCategoryCashback: currentCashbackForCategory, // <-- Pass current category CB
                daysLeft: days,       // <-- Pass days left
                cycleStatus: status,  // <-- Pass cycle status
                categoryLimit: rule.categoryLimit || Infinity, // <-- Pass base T1 limit
                tier2CategoryLimit: rule.tier2CategoryLimit || Infinity, // <-- Pass T2 limit
                transactionLimit: rule.transactionLimit || 0, // <-- Pass tx limit
                secondaryTransactionLimit: rule.secondaryTransactionLimit || 0 // <-- Pass 2nd tx limit
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
                let challengerDetails = null; // <-- ADDED: Challenger details object

                if (finalChoice.hasMetMinSpend && bestUnqualified) {
                    if (bestUnqualified.rate > finalChoice.rate || (bestUnqualified.rate === finalChoice.rate && bestUnqualified.remainingCategoryCap > finalChoice.remainingCategoryCap)) {
                        hasBetterChallenger = true;
                        // --- ADDED: Store the challenger's details ---
                        challengerDetails = {
                            cardName: bestUnqualified.cardName,
                            rate: bestUnqualified.rate,
                            minSpend: bestUnqualified.minimumMonthlySpend,
                            currentSpend: bestUnqualified.currentSpend
                        };
                    }
                }
                finalChoice = { ...finalChoice, hasBetterChallenger, challengerDetails }; // <-- Pass details
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
        <Card className="flex flex-col h-full max-h-[600px]">
            <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-sky-500" />
                    Top Cashback Opportunities
                </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col min-h-0">
                {/* Scenario 1: No suggestions */}
                {suggestions.length === 0 && (
                    <div className="flex flex-col items-center justify-center text-center p-4 rounded-lg bg-emerald-50 h-full min-h-[200px]">
                        <Sparkles className="h-8 w-8 text-emerald-500 mb-2" />
                        <p className="font-semibold text-emerald-800">All Qualified Tiers Maxed Out!</p>
                        <p className="text-xs text-emerald-700 mt-1">No high-tier opportunities are available on cards that have met their minimum spend.</p>
                    </div>
                )}

                {/* Scenarios 2 & 3: At least one suggestion exists */}
                {suggestions.length > 0 && (
                    <div className="space-y-3 flex flex-col flex-1 min-h-0">
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
                                
                                <Accordion type="single" collapsible className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2">
                                    {otherSuggestions.map((s, index) => {
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
                                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                <span className="text-sm font-semibold text-sky-600">#{index + 2}</span>
                                                                {/* --- ADDED: Alert Icons --- */}
                                                                {!s.hasMetMinSpend && (
                                                                    <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                                                                )}
                                                                {s.hasBetterChallenger && (
                                                                    <ArrowUpCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                                                )}
                                                                <p className="font-medium text-slate-800 truncate" title={s.suggestionFor}>{s.suggestionFor}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                <span className="text-xs text-slate-500 hidden sm:block">{s.cardName}</span>
                                                                <Badge variant="outline" className="text-base font-bold text-sky-700 bg-sky-100 border-sky-200">
                                                                    {(s.rate * 100).toFixed(1)}%
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-slate-500 sm:hidden ml-7 -mt-1 block">{s.cardName}</span>
                                                            {/* --- REPLACED: Added RateStatusBadge --- */}
                                                            <div className="ml-7 mt-1">
                                                                <RateStatusBadge suggestion={s} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </AccordionTrigger>
                                                
                                                <AccordionContent className="p-4 pt-3 bg-white">
                                                    {/* --- REPLACED: Old content with new details component --- */}
                                                    <SuggestionDetails 
                                                        suggestion={s}
                                                        currencyFn={currencyFn}
                                                    />
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