import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Lightbulb, AlertTriangle, Sparkles, DollarSign, ShoppingCart, ArrowUpCircle, Award } from 'lucide-react';
import { cn } from '@/lib/utils'; // Import cn utility

// --- ADDED: Date calculation utilities ---
import { calculateDaysLeftInCashbackMonth, calculateDaysUntilStatement } from '@/lib/date';

// --- NEW SUB-COMPONENT: RateStatusBadge ---
function RateStatusBadge({ suggestion }) {
    if (suggestion.isBoosted) {
        return (
            // Using green for active boost, which works well on light/dark
            <Badge variant="default" className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white dark:text-green-100 text-xs h-5 px-2">
                ✨ Tier 2 Active
            </Badge>
        );
    }

    if (suggestion.hasTier2) {
        return (
             // Adding specific dark mode styles for the outline badge
            <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700 text-xs h-5 px-2">
                Tier 2 Available
            </Badge>
        );
    }

    // --- MODIFIED: Return null for standard rate ---
    return null; 
}

// --- NEW SUB-COMPONENT: SuggestionInfoCallout (for Accordion Content) ---
function SuggestionInfoCallout({ suggestion, currencyFn }) {
    const s = suggestion;

    if (s.isBoosted) {
        return (
            <div className="flex items-start gap-3 text-sm p-3 rounded-md bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-800">
                <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="font-semibold text-green-800 dark:text-green-300">Tier 2 Active</p>
                    <p className="text-green-700 dark:text-green-400 text-xs">
                        This card has met its {currencyFn(s.tier2MinSpend)} spend requirement, unlocking a higher cashback rate or an increased category limit.
                    </p>
                </div>
            </div>
        );
    }

    if (s.hasTier2) {
        return (
            <div className="flex items-start gap-3 text-sm p-3 rounded-md bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800">
                <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="font-semibold text-blue-800 dark:text-blue-300">Tier 2 Available</p>
                    <p className="text-blue-700 dark:text-blue-400 text-xs">
                        Spend {currencyFn(s.tier2MinSpend - s.currentSpend)} more on this card to unlock a better rate of <span className="font-bold">{(s.tier2Rate * 100).toFixed(1)}%</span>.
                    </p>
                </div>
            </div>
        );
    }
    
    return null;
}

// --- NEW SUB-COMPONENT: SuggestionDetails (for Accordion Content) ---
function SuggestionDetails({ suggestion, currencyFn }) {
    const s = suggestion; // for brevity

    // --- MODIFIED: Improved daysLeft display logic ---
    let daysLeftDisplay;
    let daysLeftColor = "text-foreground dark:text-slate-200"; // Default color

    if (s.daysLeft === null) {
        daysLeftDisplay = "Completed";
        daysLeftColor = "text-emerald-600"; // Green color as requested
    } else if (s.daysLeft === 0) {
        daysLeftDisplay = "0 days (Cycle ends today)";
    } else {
        daysLeftDisplay = s.daysLeft === 1 ? `${s.daysLeft} day` : `${s.daysLeft} days`; // Handle plural
    }

    return (
        <div className="space-y-4">
            
            {/* 1. Status Details (Alerts) - Now more descriptive */}
            <div className="space-y-2">
                <SuggestionInfoCallout suggestion={s} currencyFn={currencyFn} />

                {!s.hasMetMinSpend && (
                    <div className="flex items-start gap-2 text-sm p-3 rounded-md bg-orange-50 dark:bg-orange-900/50 border border-orange-200 dark:border-orange-800">
                        <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-orange-800 dark:text-orange-300">Minimum Spend Not Met</p>
                            <p className="text-orange-700 dark:text-orange-400 text-xs">
                                Spend <span className="font-bold">{currencyFn(s.minimumMonthlySpend - s.currentSpend)}</span> more on this card to activate this rate.
                            </p>
                        </div>
                    </div>
                )}
                {s.hasBetterChallenger && s.challengerDetails && (
                     <div className="flex items-start gap-2 text-sm p-3 rounded-md bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800">
                        <ArrowUpCircle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-blue-800 dark:text-blue-300">Better Offer Available</p>
                            <p className="text-blue-700 dark:text-blue-400 text-xs">
                                <span className="font-bold">{s.challengerDetails.cardName}</span> offers <span className="font-bold">{(s.challengerDetails.rate * 100).toFixed(1)}%</span>.
                            </p>
                            <p className="text-blue-700 dark:text-blue-400 text-xs mt-1">
                                It's not active because its {currencyFn(s.challengerDetails.minSpend)} min. spend is not met (Current: {currencyFn(s.challengerDetails.currentSpend)}).
                            </p>
                        </div>
                    </div>
                )}
            </div>
            
            {/* 2. Card & Cycle Stats */}
            <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400">Card Status</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm p-3 rounded-md bg-slate-50 dark:bg-slate-800 border dark:border-slate-700">
                    <div className="space-y-0.5">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Days Left in Cycle</p>
                        {/* --- MODIFIED: Use new display string and color class --- */}
                        <p className={cn("font-medium", daysLeftColor)}>{daysLeftDisplay}</p>
                    </div>
                    {/* --- RE-ADDED: Cycle Status, but only if not 'Completed' --- */}
                    {s.cycleStatus !== 'Completed' && s.daysLeft !== null && (
                        <div className="space-y-0.5">
                            <p className="text-xs text-slate-500 dark:text-slate-400">Cycle Status</p>
                            <p className="font-medium text-slate-800 dark:text-slate-200">{s.cycleStatus}</p>
                        </div>
                    )}
                    <div className="space-y-0.5">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Total Card Spend</p>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{currencyFn(s.currentSpend)}</p>
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-xs text-slate-500 dark:text-slate-400">This Category's CB</p>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{currencyFn(s.currentCategoryCashback)}</p>
                    </div>
                </div>
            </div>

            {/* 3. Rule Breakdown */}
            <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400">Rule Breakdown</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm p-3 rounded-md bg-slate-50 dark:bg-slate-800 border dark:border-slate-700">
                    <div className="space-y-0.5">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Base Rate</p>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{(s.tier1Rate * 100).toFixed(1)}%</p>
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Base Category Limit</p>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{s.categoryLimit === Infinity ? 'Unlimited' : currencyFn(s.categoryLimit)}</p>
                    </div>
                    {s.hasTier2 && (
                        <>
                            <div className="space-y-0.5">
                                <p className="text-xs text-slate-500 dark:text-slate-400">Tier 2 Rate</p>
                                <p className="font-medium text-slate-800 dark:text-slate-200">{(s.tier2Rate * 100).toFixed(1)}%</p>
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-xs text-slate-500 dark:text-slate-400">Tier 2 Category Limit</p>
                                <p className="font-medium text-slate-800 dark:text-slate-200">{s.tier2CategoryLimit === Infinity ? 'Unlimited' : currencyFn(s.tier2CategoryLimit)}</p>
                            </div>
                        </>
                    )}
                    {s.transactionLimit > 0 && (
                        <div className="space-y-0.5">
                            <p className="text-xs text-slate-500 dark:text-slate-400">Max / Transaction</p>
                            <p className="font-medium text-slate-800 dark:text-slate-200">{currencyFn(s.transactionLimit)}</p>
                        </div>
                    )}
                    {s.secondaryTransactionLimit > 0 && (
                        <div className="space-y-0.5">
                            <p className="text-xs text-slate-500 dark:text-slate-400">2nd Tx Limit</p>
                            <p className="font-medium text-slate-800 dark:text-slate-200">{currencyFn(s.secondaryTransactionLimit)}</p>
                        </div>
                    )}
                </div>
            </div>
            
            {/* --- REMOVED: Original Stats Footer --- */}
        </div>
    );
}


// --- REMOVED: HeroSuggestion component ---
// This is no longer a separate component and will be built directly in the main return.


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

    const topSuggestion = suggestions[0];
    const otherSuggestions = suggestions.slice(1);

    return (
        <Card className="flex flex-col h-full max-h-[600px]">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    <span>Top Cashback Opportunities</span>
                </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col min-h-0 overflow-y-auto">
                {/* Scenario 1: No suggestions */}
                {suggestions.length === 0 && (
                    <div className="flex flex-col items-center justify-center text-center p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/50 h-full min-h-[200px]">
                        <Sparkles className="h-8 w-8 text-emerald-500 mb-2" />
                        <p className="font-semibold text-emerald-800 dark:text-emerald-300">All Qualified Tiers Maxed Out!</p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">No high-tier opportunities are available on cards that have met their minimum spend.</p>
                    </div>
                )}

                {/* Scenarios 2 & 3: At least one suggestion exists */}
                {suggestions.length > 0 && (
                    // --- MODIFIED: Added min-h-0 here ---
                    <div className="space-y-3 flex flex-col flex-1 min-h-0"> 
                        
                        {/* --- MODIFIED: Top Pick is now an Accordion --- */}
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem 
                                value="top-pick"
                                className="border-2 border-sky-500 bg-sky-50 dark:bg-sky-900/40 dark:border-sky-700 shadow-md rounded-lg overflow-hidden"
                            >
                                <AccordionTrigger className="p-4 hover:no-underline hover:bg-sky-100/50 dark:hover:bg-sky-900/60 data-[state=open]:border-b border-sky-200 dark:border-sky-800 items-start">
                                    <div className="w-full space-y-3">
                                        {/* Header: Top Pick Badge + Card Name */}
                                        <div className="flex items-center justify-between gap-2">
                                            <Badge variant="default" className="bg-sky-600 dark:bg-sky-600 w-fit">
                                                <Award className="h-4 w-4 mr-1.5" />
                                                TOP PICK
                                            </Badge>
                                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400 truncate" title={topSuggestion.cardName}>{topSuggestion.cardName}</span>
                                        </div>

                                        {/* Body: Split into two columns */}
                                         <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                                            {/* Left Column: Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    {!topSuggestion.hasMetMinSpend && (
                                                        <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0" />
                                                    )}
                                                    {topSuggestion.hasBetterChallenger && (
                                                        <ArrowUpCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                                                    )}
                                                     <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 break-words" title={topSuggestion.suggestionFor}>
                                                        {topSuggestion.suggestionFor}
                                                    </h3>
                                                </div>
                                                <div className="mt-1.5 flex gap-2 items-center">
                                                    {/* Badge only shows for special cases */}
                                                    {(topSuggestion.isBoosted || topSuggestion.hasTier2) && (
                                                        <RateStatusBadge suggestion={topSuggestion} />
                                                    )}
                                                </div>
                                            </div>
                                            {/* Right Column: Rate */}
                                            <div className="flex-shrink-0 sm:text-right">
                                                <p className="text-4xl font-bold text-sky-700 dark:text-sky-400">
                                                    {(topSuggestion.rate * 100).toFixed(1)}%
                                                </p>
                                            </div>
                                        </div>

                                        {/* Footer: Stats */}
                                        <div className="pt-3 border-t border-sky-200 dark:border-sky-800 text-xs text-slate-600 dark:text-slate-400 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-x-4 gap-y-1">
                                            <span className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5 text-emerald-600" /><span className="font-medium text-emerald-700 dark:text-emerald-400">{topSuggestion.remainingCategoryCap === Infinity ? 'Unlimited' : currencyFn(topSuggestion.remainingCategoryCap)}</span><span>left</span></span>
                                            <span className="flex items-center gap-1.5"><ShoppingCart className="h-3.5 w-3.5" /><span>Spend</span><span className="font-medium text-slate-800 dark:text-slate-200">{topSuggestion.spendingNeeded === Infinity ? 'N/A' : currencyFn(topSuggestion.spendingNeeded)}</span></span>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-4 pt-3 bg-white dark:bg-slate-900 max-h-[400px] overflow-y-auto">
                                    <SuggestionDetails 
                                        suggestion={topSuggestion}
                                        currencyFn={currencyFn}
                                    />
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                        

                        {/* Scenario 3: More than one suggestion */}
                        {otherSuggestions.length > 0 && (
                            <div className="flex flex-col flex-1 min-h-0">
                                <div className="flex items-center gap-3 my-3">
                                    <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400">Other Suggestions</h4>
                                    <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                                </div>
                                
                                <Accordion type="single" collapsible className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2">
                                    {otherSuggestions.map((s, index) => {
                                        return (
                                            <AccordionItem 
                                                key={`${s.id}-${s.suggestionFor}`} 
                                                value={s.suggestionFor}
                                                className="rounded-lg border bg-card shadow-sm overflow-hidden" // Item is styled as a card
                                            >
                                                <AccordionTrigger className="p-3 hover:no-underline hover:bg-slate-50 dark:hover:bg-slate-800/60 w-full text-left data-[state=open]:border-b border-slate-200 dark:border-slate-700 items-start">
                                                    <div className="w-full space-y-2">
                                                        {/* --- MODIFIED: Main Info Row --- */}
                                                        <div className="flex justify-between items-center gap-3">
                                                            {/* Left side: Rank, Icons, Category, Badge */}
                                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                <span className="text-sm font-semibold text-sky-600 dark:text-sky-400">#{index + 2}</span>
                                                                {!s.hasMetMinSpend && (
                                                                    <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                                                                )}
                                                                {s.hasBetterChallenger && (
                                                                    <ArrowUpCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                                                )}
                                                                <p className="font-medium text-slate-800 dark:text-slate-200 truncate" title={s.suggestionFor}>{s.suggestionFor}</p>
                                                                {/* --- MODIFIED: Badge is here, and conditional --- */}
                                                                {(s.isBoosted || s.hasTier2) && (
                                                                    <RateStatusBadge suggestion={s} />
                                                                )}
                                                            </div>
                                                            {/* Right side: Card Name, Rate */}
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">{s.cardName}</span>
                                                                <Badge variant="outline" className="text-base font-bold text-sky-700 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/50 border-sky-200 dark:border-sky-800">
                                                                    {(s.rate * 100).toFixed(1)}%
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <span className="text-xs text-slate-500 dark:text-slate-400 sm:hidden ml-7 -mt-1 block">{s.cardName}</span>

                                                        {/* --- MOVED: Stats Footer is now in the trigger --- */}
                                                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex justify-between items-center flex-wrap gap-x-4 gap-y-1">
                                                            <span className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5 text-emerald-600" /><span className="font-medium text-emerald-700 dark:text-emerald-400">{s.remainingCategoryCap === Infinity ? 'Unlimited' : currencyFn(s.remainingCategoryCap)}</span><span>left</span></span>
                                                            <span className="flex items-center gap-1.5"><ShoppingCart className="h-3.5 w-3.5" /><span>Spend</span><span className="font-medium text-slate-800 dark:text-slate-200">{s.spendingNeeded === Infinity ? 'N/A' : currencyFn(s.spendingNeeded)}</span></span>
                                                        </div>
                                                    </div>
                                                </AccordionTrigger>
                                                
                                                <AccordionContent className="p-4 pt-3 bg-white dark:bg-slate-900 max-h-[400px] overflow-y-auto">
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
