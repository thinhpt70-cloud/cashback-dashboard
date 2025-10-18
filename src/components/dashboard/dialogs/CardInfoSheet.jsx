import React, { useState, useMemo } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../../ui/sheet';
import { Info, Search, ChevronDown } from 'lucide-react';
import { cn } from '../../../lib/utils';

export default function CardInfoSheet({ card, rules, mccMap, isDesktop, useIOSKeyboardGapFix }) {
    // --- State for search and expansion ---
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedRuleId, setExpandedRuleId] = useState(null);
    const currency = (n) => (n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

    // --- HOOKS & HELPERS ---
    useIOSKeyboardGapFix();
    const side = isDesktop ? 'right' : 'bottom';
    
    // This variable prevents auto-focus on mobile and will be spread onto the component
    const sheetProps = isDesktop ? {} : { onOpenAutoFocus: (e) => e.preventDefault() };

    // --- Helper function and memoized data ---
    const isFeeCovered = card.estYtdCashback >= card.annualFee;
    const representativeTxCapRule = rules.find(rule => rule.capPerTransaction > 0);
    const infoItems = [
        { label: "Credit Limit", value: currency(card.creditLimit) },
        { label: "Card Number", value: `**** **** **** ${card.last4}` },
        { label: "Statement Day", value: `~ Day ${card.statementDay}` },
        { label: "Payment Due Day", value: `~ Day ${card.paymentDueDay}` },
        { label: "Monthly Interest", value: `${(card.interestRateMonthly * 100).toFixed(2)}%` },
        {
            label: "Annual Fee",
            value: currency(card.annualFee),
            valueClassName: isFeeCovered ? 'text-emerald-600' : 'text-red-500'
        },
    ];

    // --- Filtering logic for the search functionality ---
    const filteredAndSortedRules = useMemo(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        const isMccSearch = /^\d+$/.test(searchTerm.trim());

        if (!searchTerm.trim()) {
            return [...rules].sort((a, b) => {
                if (a.status === 'Active' && b.status !== 'Active') return -1;
                if (a.status !== 'Active' && b.status === 'Active') return 1;
                return a.ruleName.localeCompare(b.ruleName);
            });
        }

        const filtered = rules.filter(rule => {
            const mccList = rule.mccCodes ? rule.mccCodes.split(',').map(m => m.trim()) : [];
            if (isMccSearch) {
                return mccList.some(code => code.includes(searchTerm.trim()));
            }
            const nameMatch = rule.ruleName.toLowerCase().includes(lowercasedFilter);
            if (nameMatch) return true;
            for (const code of mccList) {
                const mccName = mccMap[code]?.vn || '';
                if (mccName.toLowerCase().includes(lowercasedFilter)) {
                    return true;
                }
            }
            return false;
        });

        return filtered.sort((a, b) => {
            if (a.status === 'Active' && b.status !== 'Active') return -1;
            if (a.status !== 'Active' && b.status === 'Active') return 1;
            return a.ruleName.localeCompare(b.ruleName);
        });
    }, [rules, searchTerm, mccMap]);


    const handleToggleExpand = (ruleId) => {
        setExpandedRuleId(prevId => (prevId === ruleId ? null : ruleId));
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs">
                    <Info className="mr-1.5 h-3.5 w-3.5" /> More info
                </Button>
            </SheetTrigger>
            <SheetContent
                side={side}
                className={cn(
                    "flex flex-col p-0",
                    isDesktop ? "w-full sm:max-w-2xl" : "h-[90dvh]"
                )}
                {...sheetProps}
            >
                <SheetHeader className="px-6 pt-6 shrink-0">
                    <SheetTitle>{card.name}</SheetTitle>
                    <p className="text-sm text-muted-foreground">{card.bank} &ndash; {card.cardType} Card</p>
                </SheetHeader>
                <div className="flex-grow overflow-y-auto px-6 pb-6">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm py-4">
                        {infoItems.map(item => (
                            <div key={item.label}>
                                <p className="text-muted-foreground">{item.label}</p>
                                <p className={cn("font-medium", item.valueClassName)}>{item.value}</p>
                            </div>
                        ))}
                    </div>

                    <div>
                        <h4 className="font-semibold text-sm mb-2">Cashback Details</h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm p-3 bg-muted rounded-lg">
                            {representativeTxCapRule && (
                                <div>
                                    <p className="text-muted-foreground">Max per Tx</p>
                                    <p className="font-medium">{currency(representativeTxCapRule.capPerTransaction)}</p>
                                </div>
                            )}
                            {card.limitPerCategory > 0 && (
                                <div>
                                    <p className="text-muted-foreground">Max per Cat</p>
                                    <p className="font-medium">{currency(card.limitPerCategory)}</p>
                                </div>
                            )}
                            {card.overallMonthlyLimit > 0 && (
                                <div>
                                    <p className="text-muted-foreground">Max per Month</p>
                                    <p className="font-medium">{currency(card.overallMonthlyLimit)}</p>
                                </div>
                            )}
                            {card.minimumMonthlySpend > 0 && (
                                <div>
                                    <p className="text-muted-foreground">Min. Spending</p>
                                    <p className="font-medium">{currency(card.minimumMonthlySpend)}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-4">
                        <h4 className="font-semibold text-sm mb-2">Cashback Rules</h4>
                        <div className="relative mb-3">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search by name, MCC code, or category..."
                                className="w-full pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            {filteredAndSortedRules.length > 0 ? filteredAndSortedRules.map(rule => {
                                const isExpanded = expandedRuleId === rule.id;
                                const fullMccList = rule.mccCodes ? rule.mccCodes.split(',').map(m => m.trim()).filter(Boolean) : [];
                                const isMccSearch = /^\d+$/.test(searchTerm.trim());
                                const mccsToDisplay = isMccSearch
                                    ? fullMccList.filter(code => code.includes(searchTerm.trim()))
                                    : fullMccList;

                                return (
                                    <div key={rule.id} className="border rounded-md overflow-hidden">
                                        <div
                                            onClick={() => handleToggleExpand(rule.id)}
                                            className={cn(
                                                "flex justify-between items-center p-3 cursor-pointer hover:bg-muted/50",
                                                rule.status !== 'Active' && "opacity-60"
                                            )}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <span className={cn("h-2 w-2 rounded-full", rule.status === 'Active' ? "bg-emerald-500" : "bg-slate-400")} />
                                                <span className="font-medium text-primary">{rule.ruleName}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-base text-foreground">{(rule.rate * 100).toFixed(1)}%</span>
                                                <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="p-3 border-t bg-slate-50/70">
                                                {mccsToDisplay.length > 0 ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        {mccsToDisplay.map(code => (
                                                            <Badge key={code} variant="secondary" className="font-normal">
                                                                <span className="font-mono">{code}</span>
                                                                {mccMap[code]?.vn && (
                                                                    <span className="ml-1.5">{`: ${mccMap[code].vn}`}</span>
                                                                )}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-muted-foreground">No specific MCC codes are linked to this rule.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            }) : (
                                <p className="text-sm text-center text-muted-foreground py-4">No rules match your search.</p>
                            )}
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}