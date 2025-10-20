import React from 'react';
import { AlertTriangle, Wallet } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../ui/accordion';
import { cn } from '../../../lib/utils';

// Helper to determine the color of the rate badge
const getRateBadgeClass = (rate) => {
    if (rate >= 0.15) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (rate >= 0.10) return 'bg-sky-100 text-sky-800 border-sky-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
};

// Helper to get specific warning text
const getWarningText = (item) => {
    if (!item.isMinSpendMet) return "Minimum spend not met";
    if (item.isCategoryCapReached) return "Category cap reached";
    if (item.isMonthlyCapReached) return "Monthly cap reached";
    return "A limit has been reached"; // Fallback
};

// Sub-component for rendering each recommendation item
const RecommendationItem = ({ item, rank, onSelectCard, selectedCardId, currencyFn }) => {
    const { card, rule, calculatedCashback, remainingCategoryCashback } = item;
    const isSelected = card.id === selectedCardId;
    const isCappedOrIneligible = !item.isMinSpendMet || item.isCategoryCapReached || item.isMonthlyCapReached;

    return (
        <button
            type="button"
            onClick={() => onSelectCard(card.id, rule.id)}
            className={cn(
                "w-full text-left border rounded-lg p-2.5 transition-all space-y-2",
                isSelected && !isCappedOrIneligible ? "bg-sky-50 border-sky-400 shadow-sm" : "bg-white hover:bg-slate-50",
                isCappedOrIneligible && "bg-slate-50 opacity-60 grayscale"
            )}
        >
            {/* Top Row: Rank, Name, Rate */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                    {rank && (
                        <span className={cn(
                            "text-lg font-bold mt-px",
                            isSelected && !isCappedOrIneligible ? "text-sky-600" : "text-slate-400"
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
                        <p className="text-xs font-semibold text-emerald-600">
                            + {currencyFn(calculatedCashback)}
                        </p>
                    )}
                </div>
            </div>

            {/* Bottom Row: Info/Warnings */}
            <div className="pt-2 border-t text-xs flex items-center justify-between gap-x-3">
                {isCappedOrIneligible ? (
                    <span className="flex items-center gap-1.5 font-medium text-orange-600">
                        <AlertTriangle className="h-3.5 w-3.5" /> {getWarningText(item)}
                    </span>
                ) : (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Wallet className="h-3.5 w-3.5" />
                        Cap left:
                        <span className="font-semibold text-slate-700">
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
    const eligible = recommendations.filter(r => !r.isCategoryCapReached && !r.isMonthlyCapReached && r.isMinSpendMet);
    const ineligible = recommendations.filter(r => r.isCategoryCapReached || r.isMonthlyCapReached || !r.isMinSpendMet);

    return (
        <div className="space-y-3 pt-4">
            <h4 className="text-sm font-medium text-slate-700">Recommended Cards</h4>
            
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