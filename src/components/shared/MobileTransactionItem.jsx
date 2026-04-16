import React from "react";
import { Loader2, Check } from "lucide-react";
import { cn } from "../../lib/utils";
import { formatTransactionDate } from "../../lib/date";
import MethodIndicator from "./MethodIndicator";

const MobileTransactionItem = React.memo(({
    transaction,
    isSelected,
    onSelect,
    onClick,
    cardMap,
    ruleMap,
    currencyFn,
    isDeleting,
    isUpdating
}) => {
    const tx = transaction;
    const card = tx['Card'] ? cardMap.get(tx['Card'][0]) : null;
    const effectiveDate = tx['billingDate'] || tx['Transaction Date'];
    const isProcessing = isDeleting || isUpdating;

    // Attempt to get a short acronym for the icon if method is not defined
    const getInitials = (name) => {
        if (!name || typeof name !== 'string') return "?";
        const parts = name.trim().split(/\s+/);
        if (parts.length > 1) {
            return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };


    let ruleName = null;
    if (ruleMap && tx['Applicable Rule'] && tx['Applicable Rule'].length > 0) {
        const ruleId = tx['Applicable Rule'][0];
        const rule = ruleMap.get(ruleId);
        if (rule) {
            ruleName = rule.ruleName || rule.name;
            if (ruleName && ruleName.includes('-')) {
                ruleName = ruleName.split('-')[1].trim();
            }
        }
    }

    return (
        <div
            className={cn(
                "relative flex items-center gap-3 p-3.5 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-3xl transition-all cursor-pointer border border-transparent",
                isSelected
                    ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20"
                    : "",
                isProcessing && "opacity-60 pointer-events-none"
            )}
            onClick={() => !isProcessing && onClick && onClick(tx)}
        >
            {isProcessing && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/20 dark:bg-black/20 backdrop-blur-[1px] rounded-3xl">
                    <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
                </div>
            )}
            {/* Main Content */}
            <div
                className="flex-1 min-w-0 flex items-center justify-between gap-3 outline-none rounded-md focus-visible:ring-2 focus-visible:ring-blue-500"
                tabIndex={0}
                role="button"
                aria-label={`View details for ${tx['Transaction Name']}, ${currencyFn(tx['Amount'])}`}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        onClick && onClick(tx);
                    }
                }}
            >
                {/* Left Side: Method Icon, Name, Date/Card */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* The square rounded icon like the stock ticker symbols (also acts as Checkbox) */}
                    <div
                        className={cn(
                            "relative shrink-0 flex items-center justify-center w-[36px] h-[36px] rounded-lg shadow-sm font-medium text-xs tracking-tight cursor-pointer transition-colors",
                            isSelected
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                        )}
                        onClick={(e) => { e.stopPropagation(); onSelect && onSelect(tx.id, !isSelected); }}
                    >
                         {isSelected ? <Check className="w-4 h-4" /> : getInitials(tx['Transaction Name'])}
                         {/* Optional tiny indicator for Method */}
                         {!isSelected && (
                             <div className="absolute -top-1 -right-1 p-0.5 bg-white dark:bg-slate-950 rounded-full">
                                <MethodIndicator method={tx['Method']} />
                             </div>
                         )}
                    </div>

                    <div className="flex flex-col min-w-0 flex-1 justify-center h-full gap-0.5">
                        <h4 className="text-[14px] font-semibold text-slate-900 dark:text-slate-100 truncate tracking-tight">
                            {tx['Transaction Name']}
                        </h4>
                        <div className="flex flex-col text-[11px] text-slate-500 dark:text-slate-400 tracking-wide font-medium min-w-0">
                            <span className="truncate whitespace-nowrap">{formatTransactionDate(effectiveDate)}</span>
                            {ruleName && (
                                <span className="truncate min-w-0 text-slate-400 dark:text-slate-500">{ruleName}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side: Category, Amount, Cashback */}
                <div className="flex flex-col items-end justify-center gap-1 shrink-0 ml-auto pl-1">
                    {/* Top Row: Category Pill & Amount */}
                    <div className="flex items-center gap-2">
                        {tx['Category'] && (
                            <span className="hidden sm:flex text-[10px] font-semibold tracking-wider text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-full shadow-sm">
                                {tx['Category']}
                            </span>
                        )}
                        <div className="flex flex-col items-end gap-0.5">
                             <span className="text-[13px] font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap leading-none">
                                 {currencyFn(tx['Amount'])}
                             </span>
                        </div>
                    </div>

                    {/* Bottom Row: Cashback/Rate */}
                    {tx.estCashback > 0 && (
                        <div className="flex flex-col items-end gap-0.5 mt-0.5">
                            <span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap leading-none">
                                +{currencyFn(tx.estCashback)}
                            </span>
                            {tx.rate > 0 && (
                                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 px-1 rounded">
                                    {(tx.rate * 100).toFixed(1)}%
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

export default MobileTransactionItem;
