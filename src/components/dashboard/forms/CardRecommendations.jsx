import React from 'react';
// <-- FIX: Import the Snowflake icon -->
import { AlertTriangle, Wallet, Snowflake } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

// Helper to determine the color of the rate badge
const getRateBadgeClass = (rate) => {
    // <-- FIX: Added dark mode classes for all rate colors -->
    if (rate >= 0.15) return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800';
    if (rate >= 0.10) return 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800';
    return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700';
};

// Helper to get specific warning text
const getWarningText = (item) => {
    // <-- FIX: Prioritize the 'Frozen' status message -->
    if (item.rule.status === 'Inactive') return "Rule is inactive";
    if (!item.isMinSpendMet) return "Minimum spend not met";
    if (item.isCategoryCapReached) return "Category cap reached";
    if (item.isMonthlyCapReached) return "Monthly cap reached";
    return "A limit has been reached"; // Fallback
};

// Sub-component for rendering each recommendation item
const RecommendationItem = ({ item, rank, onSelectCard, selectedCardId, currencyFn }) => {
    const { card, rule, calculatedCashback, remainingCategoryCashback } = item;
    const isSelected = card.id === selectedCardId;
    
    // This check is still correct
    const isFrozen = item.rule.status === 'Inactive';
    
    // <-- MODIFIED: 'isCappedOrIneligible' no longer includes 'isFrozen' -->
    // This variable now only tracks *actual* spending caps.
    const isCappedOrIneligible = !item.isMinSpendMet || item.isCategoryCapReached || item.isMonthlyCapReached;

    return (
        <button
            type="button"
            onClick={() => onSelectCard(card.id, rule.id)}
            className={cn(
                "w-full text-left border rounded-lg p-2.5 transition-all space-y-2",
                // 'isSelected && !isCappedOrIneligible' will now work for Inactive cards
                isSelected && !isCappedOrIneligible ? "bg-sky-50 border-sky-400 dark:bg-sky-950 dark:border-sky-700 shadow-sm" : "bg-background hover:bg-muted/50",
                // An inactive card (isFrozen=true, isCappedOrIneligible=false) will no longer get this style
                isCappedOrIneligible && "bg-muted opacity-60 grayscale"
            )}
        >
            {/* Top Row: Rank, Name, Rate */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                    {rank && (
                        <span className={cn(
                            "text-lg font-bold mt-px",
                            isSelected && !isCappedOrIneligible ? "text-sky-600 dark:text-sky-400" : "text-slate-400 dark:text-slate-500"
                        )}>
                            #{rank}
                        </span>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-primary truncate">{card.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{rule.ruleName}</p>
                    </div>
                </div>
                <div className="text-right flex-shrink-0 space-y-1">
                        <Badge variant="outline" className={cn("text-sm font-bold", getRateBadgeClass(rule.rate))}>
                        {(rule.rate * 100).toFixed(1)}%
                    </Badge>
                    {calculatedCashback > 0 && (
                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-500">
                            + {currencyFn(calculatedCashback)}
                        </p>
                    )}
                </div>
            </div>

            {/* Bottom Row: Info/Warnings */}
            <div className="pt-2 border-t text-xs flex items-center justify-between gap-x-3">
                {/* <-- MODIFIED: Show warning if 'isCappedOrIneligible' OR 'isFrozen' --> */}
                {isCappedOrIneligible || isFrozen ? (
                    <span className={cn(
                        "flex items-center gap-1.5 font-medium",
                        isFrozen ? "text-sky-600 dark:text-sky-500" : "text-orange-600 dark:text-orange-500"
                    )}>
                        {isFrozen ? <Snowflake className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                        {getWarningText(item)}
                    </span>
                ) : (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Wallet className="h-3.5 w-3.5" />
                        Cap left:
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                            {isFinite(remainingCategoryCashback) ? currencyFn(remainingCategoryCashback) : 'Unlimited'}
                        </span>
                    </span>
                )}
            </div>
        </button>
    );
};

export default function CardRecommendations({ recommendations, onSelectCard, currencyFn, selectedCardId }) {
    if (!recommendations || recommendations.length === 0) {
        return null;
    }

    // Separate cards into eligible and ineligible groups
    // <-- FIX: Update filters to account for rule.status === 'Frozen' -->
    const eligible = recommendations.filter(r => !r.isCategoryCapReached && !r.isMonthlyCapReached && r.isMinSpendMet && r.rule.status !== 'Frozen');
    const ineligible = recommendations.filter(r => r.isCategoryCapReached || r.isMonthlyCapReached || !r.isMinSpendMet || r.rule.status === 'Frozen');

    return (
        <div className="space-y-3 pt-4">
            {/* <-- FIX: Added dark mode text color --> */}
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Recommended Cards</h4>
            
            {/* Render eligible cards first */}
            <div className="space-y-2">
                {eligible.map((item, index) => (
                    <RecommendationItem 
                        key={item.rule.id} 
                        item={item} 
                        rank={index + 1} 
                        onSelectCard={onSelectCard}
                        selectedCardId={selectedCardId}
                        currencyFn={currencyFn}
                    />
                ))}
            </div>

            {/* Render ineligible cards inside an Accordion */}
            {ineligible.length > 0 && (
                <Accordion type="single" collapsible className="w-full pt-1">
                    <AccordionItem value="ineligible-cards" className="border-none">
                        <AccordionTrigger className="text-xs text-muted-foreground hover:no-underline justify-center py-2">
                            Show {ineligible.length} ineligible options
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="pt-2 space-y-2">
                                {ineligible.map((item) => (
                                    <RecommendationItem 
                                        key={item.rule.id} 
                                        item={item} 
                                        onSelectCard={onSelectCard}
                                        selectedCardId={selectedCardId}
                                        currencyFn={currencyFn}
                                    />
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            )}
        </div>
    );
}