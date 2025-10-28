// RecentTransactions.jsx

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { subWeeks, subMonths, startOfDay, isAfter, parseISO, format } from 'date-fns';

export default function RecentTransactions({ transactions, cardMap, currencyFn }) {
    const [activityFilter, setActivityFilter] = useState('week'); // 'week', '2week', 'month'

    const filterLabels = {
        week: 'This Week',
        '2week': 'Last 2 Weeks',
        month: 'This Month',
    };

    const filteredTransactions = useMemo(() => {
        const now = startOfDay(new Date());
        let startDate;

        if (activityFilter === 'week') {
            startDate = subWeeks(now, 1);
        } else if (activityFilter === '2week') {
            startDate = subWeeks(now, 2);
        } else if (activityFilter === 'month') {
            startDate = subMonths(now, 1);
        } else {
            return transactions; // Fallback
        }

        return transactions.filter(tx => {
            try {
                const txDate = parseISO(tx['Transaction Date']);
                return isAfter(txDate, startDate);
            } catch (e) {
                return false;
            }
        });
    }, [transactions, activityFilter]);

    // Helper to format date
    const formatDate = (dateString) => {
        try {
            return format(parseISO(dateString), 'dd MMM yyyy');
        } catch (e) {
            return dateString; // Fallback
        }
    };

    if (!transactions) return null;

    return (
        <Card className="flex flex-col lg:h-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Activity</CardTitle>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="ml-auto gap-1">
                            <span>{filterLabels[activityFilter]}</span>
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setActivityFilter('week')}>
                            This Week
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setActivityFilter('2week')}>
                            Last 2 Weeks
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setActivityFilter('month')}>
                            This Month
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent className="flex-1 lg:overflow-y-auto p-4">
                {/* List Headers */}
                <div className="flex items-center text-sm font-medium text-slate-500 mb-2 px-2">
                    <div className="flex-1 min-w-0">Name</div>
                    <div className="w-28 text-left px-2 flex-shrink-0">Date</div>
                    <div className="w-28 text-right flex-shrink-0">Amount</div>
                </div>

                {/* List Container */}
                <div className="space-y-2">
                    {filteredTransactions.length === 0 ? (
                        <div className="text-center text-sm text-slate-500 py-8">
                            No activity for this period.
                        </div>
                    ) : (
                        filteredTransactions.map(tx => {
                            const card = tx['Card'] ? cardMap.get(tx['Card'][0]) : null;
                            const cardName = card ? card.name : 'Unknown Card';
                            return (
                                <div key={tx.id} className="flex items-center p-2 rounded-md hover:bg-slate-50">
                                    {/* Name Column */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-800 truncate" title={tx['Transaction Name']}>
                                            {tx['Transaction Name']}
                                        </p>
                                        <p className="text-sm text-slate-500">{cardName}</p>
                                    </div>
                                    {/* Date Column */}
                                    <div className="w-28 text-sm text-slate-600 text-left px-2 flex-shrink-0">
                                        {formatDate(tx['Transaction Date'])}
                                    </div>
                                    {/* Amount Column */}
                                    <div className="w-28 text-right flex-shrink-0">
                                        <p className="font-semibold text-slate-900">{currencyFn(tx['Amount'])}</p>
                                        <p className="text-sm text-emerald-600 font-medium">+ {currencyFn(tx.estCashback)}</p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </CardContent>
        </Card>
    );
}