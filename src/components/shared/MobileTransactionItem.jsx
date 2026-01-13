import React from "react";
import { Checkbox } from "../ui/checkbox";
import { cn } from "../../lib/utils";
import { formatDateTime } from "../../lib/date";
import MethodIndicator from "./MethodIndicator";

const MobileTransactionItem = React.memo(({
    transaction,
    isSelected,
    onSelect,
    onClick,
    cardMap,
    currencyFn
}) => {
    const tx = transaction;
    const card = tx['Card'] ? cardMap.get(tx['Card'][0]) : null;
    const effectiveDate = tx['billingDate'] || tx['Transaction Date'];

    return (
        <div
            className={cn(
                "relative flex items-center gap-3 p-3 bg-white dark:bg-slate-950 rounded-xl shadow-sm border transition-all cursor-pointer",
                isSelected
                    ? "border-blue-500 bg-blue-50/30 dark:bg-blue-900/20 ring-1 ring-blue-500/20"
                    : "border-slate-100 hover:border-slate-200 dark:border-slate-800"
            )}
            onClick={() => onClick && onClick(tx)}
        >
            {/* Checkbox Area */}
            <div className="shrink-0" onClick={(e) => { e.stopPropagation(); onSelect && onSelect(tx.id, !isSelected); }}>
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onSelect && onSelect(tx.id, !isSelected)}
                    aria-label={`Select ${tx['Transaction Name']}`}
                    className={cn("h-5 w-5 rounded border data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 bg-white border-slate-300")}
                />
            </div>

            {/* Main Content */}
            <div
                className="flex-1 min-w-0 flex flex-col gap-1.5 outline-none rounded-md focus-visible:ring-2 focus-visible:ring-blue-500 -m-1 p-1"
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
                {/* Top Row: Name & Amount */}
                <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <MethodIndicator method={tx['Method']} />
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate leading-tight">
                            {tx['Transaction Name']}
                        </h4>
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap leading-tight">
                        {currencyFn(tx['Amount'])}
                    </span>
                </div>

                {/* Bottom Row: Metadata & Cashback */}
                <div className="flex justify-between items-start">
                    {/* Left: Date • Card */}
                    <div className="flex flex-col gap-0.5 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        <div className="flex items-center gap-1.5">
                            <span>{formatDateTime(effectiveDate)}</span>
                            <span className="w-0.5 h-0.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                            <span className="truncate max-w-[90px] text-slate-600 dark:text-slate-300">{card ? card.name : 'Unknown'}</span>
                        </div>
                        {tx['Category'] && <span className="text-slate-400 dark:text-slate-500">{tx['Category']}</span>}
                    </div>

                    {/* Right: Cashback & Rate */}
                    <div className="flex flex-col items-end gap-0.5">
                        <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-[4px] border border-emerald-100 dark:border-emerald-900">
                            <span className="text-[10px] font-bold">+{currencyFn(tx.estCashback)}</span>
                        </div>
                        {tx.rate > 0 && (
                            <span className="text-[9px] font-medium text-emerald-600/80 dark:text-emerald-500/80">
                                {(tx.rate * 100).toFixed(1)}% Rate
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

export default MobileTransactionItem;
