import React from 'react';
import { Wallet, Snowflake, Trophy, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

// Helper to determine the color of the rate badge
const getRateBadgeClass = (rate) => {
    if (rate >= 0.15) return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800';
    if (rate >= 0.10) return 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800';
    return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700';
};

// --- WINNER CARD COMPONENT ---
const WinnerCard = ({ item, onSelectCard, selectedCardId, currencyFn }) => {
    const { card, rule, calculatedCashback, remainingCategoryCashback } = item;
    const isSelected = card.id === selectedCardId;

    return (
        <button
            type="button"
            onClick={() => onSelectCard(card.id, rule.id)}
            className={cn(
                "w-full text-left relative overflow-hidden rounded-xl border-2 transition-all p-4 shadow-md group",
                isSelected
                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20"
                    : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 hover:border-emerald-200 dark:hover:border-emerald-800"
            )}
        >
            {/* Background Decoration */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-emerald-400/20 to-sky-400/20 blur-2xl rounded-full pointer-events-none" />

            <div className="relative flex justify-between items-start mb-2">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-amber-500 fill-amber-500" />
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500">Best Option</span>
                    </div>
                    <h3 className="font-bold text-lg leading-tight pr-8 text-slate-900 dark:text-slate-100">{card.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{rule.ruleName}</p>
                </div>

                <div className="text-right">
                     <Badge className={cn("text-base px-2.5 py-0.5 font-bold", getRateBadgeClass(rule.rate))}>
                        {(rule.rate * 100).toFixed(1)}%
                    </Badge>
                </div>
            </div>

            <div className="relative pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-end justify-between">
                <div>
                     <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Wallet className="h-3.5 w-3.5" />
                        Cap left: <span className="font-semibold text-slate-700 dark:text-slate-300">{isFinite(remainingCategoryCashback) ? currencyFn(remainingCategoryCashback) : 'Unlimited'}</span>
                    </span>
                </div>

                {calculatedCashback > 0 && (
                     <div className="text-right">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Estimated</p>
                        <p className="text-xl font-bold text-emerald-600 dark:text-emerald-500">+{currencyFn(calculatedCashback)}</p>
                    </div>
                )}
            </div>

            {isSelected && (
                <div className="absolute inset-0 border-2 border-emerald-500 rounded-xl pointer-events-none ring-2 ring-emerald-500/20" />
            )}
        </button>
    );
};


// Sub-component for rendering other recommendation items
const RecommendationItem = ({ item, rank, onSelectCard, selectedCardId, currencyFn }) => {
    const { card, rule, calculatedCashback } = item;
    const isSelected = card.id === selectedCardId;

    const isFrozen = item.rule.status === 'Inactive';
    const isCappedOrIneligible = !item.isMinSpendMet || item.isCategoryCapReached || item.isMonthlyCapReached;

    return (
        <button
            type="button"
            onClick={() => onSelectCard(card.id, rule.id)}
            className={cn(
                "w-full text-left border rounded-lg p-3 transition-all space-y-2 flex items-center justify-between gap-3",
                isSelected ? "bg-sky-50 border-sky-400 dark:bg-sky-950/30 dark:border-sky-700" : "bg-card hover:bg-muted/50",
                isCappedOrIneligible && "bg-muted opacity-60 grayscale"
            )}
        >
            <div className="flex items-center gap-3 min-w-0">
                {/* Compact Rank/Status Indicator */}
                 <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                    isFrozen ? "bg-slate-100 text-slate-400" : (isSelected ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-500 dark:bg-slate-800")
                 )}>
                    {isFrozen ? <Snowflake className="h-4 w-4" /> : `#${rank}`}
                 </div>

                <div className="min-w-0">
                    <p className="font-semibold text-sm truncate leading-tight">{card.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{rule.ruleName}</p>
                </div>
            </div>

            <div className="text-right shrink-0">
                 <div className="flex flex-col items-end gap-0.5">
                    <Badge variant="outline" className={cn("text-xs px-1.5 py-0", getRateBadgeClass(rule.rate))}>
                        {(rule.rate * 100).toFixed(1)}%
                    </Badge>
                     {calculatedCashback > 0 && !isCappedOrIneligible ? (
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-500">
                            +{currencyFn(calculatedCashback)}
                        </span>
                    ) : (
                         isCappedOrIneligible && (
                             <span className="text-[10px] text-orange-600 font-medium">Limited</span>
                         )
                    )}
                </div>
            </div>
        </button>
    );
};

export default function CardRecommendations({ recommendations, onSelectCard, currencyFn, selectedCardId }) {
    if (!recommendations || recommendations.length === 0) {
        return null;
    }

    // Separate cards into eligible and ineligible groups
    const eligible = recommendations.filter(r => !r.isCategoryCapReached && !r.isMonthlyCapReached && r.isMinSpendMet && r.rule.status !== 'Inactive');
    const ineligible = recommendations.filter(r => r.isCategoryCapReached || r.isMonthlyCapReached || !r.isMinSpendMet || r.rule.status === 'Inactive');

    // Deprioritize inactive rules within the eligible list
    eligible.sort((a, b) => {
        if (a.rule.status === 'Inactive' && b.rule.status !== 'Inactive') return 1;
        if (a.rule.status !== 'Inactive' && b.rule.status === 'Inactive') return -1;
        return 0;
    });

    const winner = eligible.length > 0 ? eligible[0] : null;
    const runnersUp = eligible.length > 1 ? eligible.slice(1) : [];

    return (
        <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Star className="h-4 w-4 text-emerald-500" />
                    Recommended Cards
                </h4>
            </div>

            {/* Winner Card */}
            {winner && (
                <WinnerCard
                    item={winner}
                    onSelectCard={onSelectCard}
                    selectedCardId={selectedCardId}
                    currencyFn={currencyFn}
                />
            )}

            {/* Runners Up - Compact List */}
            {runnersUp.length > 0 && (
                <div className="space-y-2 pt-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">Other Options</p>
                    {runnersUp.map((item, index) => (
                        <RecommendationItem
                            key={item.rule.id}
                            item={item}
                            rank={index + 2}
                            onSelectCard={onSelectCard}
                            selectedCardId={selectedCardId}
                            currencyFn={currencyFn}
                        />
                    ))}
                </div>
            )}

            {/* Ineligible List */}
            {ineligible.length > 0 && (
                <Accordion type="single" collapsible className="w-full pt-2">
                    <AccordionItem value="ineligible-cards" className="border-none">
                        <AccordionTrigger className="text-xs text-muted-foreground hover:no-underline justify-center py-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
                            Show {ineligible.length} unavailable options
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="pt-2 space-y-2">
                                {ineligible.map((item) => (
                                    <RecommendationItem 
                                        key={item.rule.id} 
                                        item={item} 
                                        // Rank for ineligible is just a placeholder
                                        rank="-"
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
