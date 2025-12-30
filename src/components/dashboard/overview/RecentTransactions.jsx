// RecentTransactions.jsx

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, History } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { 
    subWeeks, 
    startOfDay, 
    parseISO, 
    format, 
    startOfWeek, 
    endOfWeek, 
    startOfMonth, 
    endOfMonth, 
    isWithinInterval 
} from 'date-fns';

export default function RecentTransactions({ transactions, cardMap, currencyFn, isLoading }) { // NEW PROP
    const [activityFilter, setActivityFilter] = useState('thisWeek'); // 'thisWeek', 'lastWeek', 'thisMonth'

    const filterLabels = {
        thisWeek: 'This Week',
        lastWeek: 'Last Week',
        thisMonth: 'This Month',
    };

    const filteredTransactions = useMemo(() => {
        const today = startOfDay(new Date());
        const options = { weekStartsOn: 1 };
        let interval;

        if (activityFilter === 'thisWeek') {
            interval = {
                start: startOfWeek(today, options),
                end: endOfWeek(today, options)
            };
        } else if (activityFilter === 'lastWeek') {
            const lastWeekDay = subWeeks(today, 1);
            interval = {
                start: startOfWeek(lastWeekDay, options),
                end: endOfWeek(lastWeekDay, options)
            };
        } else if (activityFilter === 'thisMonth') {
            interval = {
                start: startOfMonth(today),
                end: endOfMonth(today)
            };
        } else {
            return transactions; // Fallback
        }

        // Filter transactions that are within the calculated interval
        return transactions.filter(tx => {
            try {
                const txDate = parseISO(tx['Transaction Date']);
                return isWithinInterval(txDate, interval);
            } catch (e) {
                console.error("Error parsing date:", tx['Transaction Date']);
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

    if (!transactions && !isLoading) return null;

    return (
        <Card className="flex flex-col lg:flex-1 lg:min-h-0 max-h-[600px]">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    <span>Recent Activity</span>
                </CardTitle>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="ml-auto gap-1">
                            <span>{filterLabels[activityFilter]}</span>
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setActivityFilter('thisWeek')}>
                            This Week
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setActivityFilter('lastWeek')}>
                            Last Week
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setActivityFilter('thisMonth')}>
                            This Month
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0 p-4">
                {/* List Headers */}
                <div className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 px-2 flex-shrink-0">
                    <div className="flex-1 min-w-0">Name</div>
                    <div className="w-28 text-left px-2 flex-shrink-0 hidden sm:block">Date</div>
                    <div className="w-28 text-right flex-shrink-0">Amount</div>
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto">
                    {/* SKELETON LOADING STATE */}
                    {isLoading ? (
                        [1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center p-2 rounded-md border border-slate-100 dark:border-slate-800">
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                                <div className="hidden sm:block w-28 px-2">
                                    <Skeleton className="h-4 w-20" />
                                </div>
                                <div className="w-28 flex flex-col items-end space-y-1">
                                    <Skeleton className="h-4 w-16" />
                                    <Skeleton className="h-3 w-12" />
                                </div>
                            </div>
                        ))
                    ) : filteredTransactions.length === 0 ? (
                        <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-8">
                            No activity for this period.
                        </div>
                    ) : (
                        filteredTransactions.map(tx => {
                            const card = tx['Card'] && tx['Card'][0] ? cardMap.get(tx['Card'][0]) : null;
                            const cardName = card ? card.name : 'Unknown Card';
                            return (
                                <div key={tx.id} className="flex items-center p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800">
                                    {/* Name Column */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-800 dark:text-slate-200 truncate" title={tx['Transaction Name']}>
                                            {tx['Transaction Name']}
                                        </p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{cardName}</p>
                                    </div>
                                    {/* Date Column */}
                                    <div className="w-28 text-sm text-slate-600 dark:text-slate-300 text-left px-2 flex-shrink-0 hidden sm:block">
                                        {formatDate(tx['Transaction Date'])}
                                    </div>
                                    {/* Amount Column */}
                                    <div className="w-28 text-right flex-shrink-0">
                                        <p className="font-semibold text-slate-900 dark:text-slate-100">{currencyFn(tx['Amount'])}</p>
                                        <p className="text-sm text-emerald-600 dark:text-emerald-500 font-medium">+ {currencyFn(tx.estCashback)}</p>
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
