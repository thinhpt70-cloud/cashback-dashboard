import React, { useState, useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, CheckCircle, Calendar, Wallet, FilePenLine, History, DollarSign } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';

export default function PaymentsCalendarView({ paymentData, currencyFn, fmtYMShortFn, onLogPayment, onLogStatement, onViewTransactions }) {
    const [selectedDate, setSelectedDate] = useState();

    // Flatten paymentData to get all statements
    const allStatements = useMemo(() => {
        if (!paymentData) return [];
        return paymentData.flatMap(group => {
            const statements = [];
            if (group.mainStatement) statements.push(group.mainStatement);
            // We could also include past statements if we want a full history view
            // For now, let's focus on main statements (active ones) to avoid clutter
            return statements;
        });
    }, [paymentData]);

    const events = useMemo(() => {
        const map = new Map();
        allStatements.forEach(stmt => {
            // Payment Due Date Event
            if (stmt.paymentDateObj) {
                const dateKey = format(stmt.paymentDateObj, 'yyyy-MM-dd');
                if (!map.has(dateKey)) map.set(dateKey, []);

                const remaining = (stmt.statementAmount || 0) - (stmt.paidAmount || 0);
                const isPaid = remaining <= 0 && (stmt.statementAmount > 0);

                map.get(dateKey).push({
                    type: 'due',
                    statement: stmt,
                    isPaid,
                    amount: remaining > 0 ? remaining : stmt.statementAmount
                });
            }

            // Statement Date Event
            if (stmt.statementDateObj) {
                const dateKey = format(stmt.statementDateObj, 'yyyy-MM-dd');
                if (!map.has(dateKey)) map.set(dateKey, []);
                map.get(dateKey).push({
                    type: 'statement',
                    statement: stmt
                });
            }
        });
        return map;
    }, [allStatements]);

    const handleDayClick = (day) => {
        setSelectedDate(day);
    };

    const modifiers = {
        hasEvent: (date) => events.has(format(date, 'yyyy-MM-dd')),
        hasDue: (date) => {
             const evts = events.get(format(date, 'yyyy-MM-dd'));
             return evts && evts.some(e => e.type === 'due');
        },
        hasStatement: (date) => {
             const evts = events.get(format(date, 'yyyy-MM-dd'));
             return evts && evts.some(e => e.type === 'statement');
        }
    };

    const modifiersStyles = {
        hasEvent: { fontWeight: 'bold' }
    };

    const selectedDayEvents = useMemo(() => {
        if (!selectedDate) return [];
        const dateKey = format(selectedDate, 'yyyy-MM-dd');
        return events.get(dateKey) || [];
    }, [selectedDate, events]);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm w-full">
                <style>{`
                    .rdp-day_selected {
                        background-color: var(--primary) !important;
                        color: var(--primary-foreground) !important;
                    }
                    .rdp-button:hover:not([disabled]) {
                        background-color: var(--accent);
                        color: var(--accent-foreground);
                    }
                    .rdp {
                        margin: 0;
                    }
                `}</style>
                <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    onDayClick={handleDayClick}
                    modifiers={modifiers}
                    modifiersStyles={modifiersStyles}
                    showOutsideDays
                    className="p-3"
                    components={{
                        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
                        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
                        DayContent: ({ date, ...props }) => {
                            const dateKey = format(date, 'yyyy-MM-dd');
                            const dayEvents = events.get(dateKey);

                            const hasDue = dayEvents?.some(e => e.type === 'due');
                            const hasStatement = dayEvents?.some(e => e.type === 'statement');
                            const isPaid = dayEvents?.every(e => e.type !== 'due' || e.isPaid); // All dues paid
                            const isOverdue = hasDue && !isPaid && date < new Date().setHours(0,0,0,0);

                            return (
                                <div className="relative w-full h-full flex items-center justify-center p-2">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{date.getDate()}</span>
                                    <div className="absolute bottom-1 flex gap-0.5">
                                        {hasStatement && (
                                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 ring-1 ring-white dark:ring-slate-950" title="Statement Date" />
                                        )}
                                        {hasDue && (
                                            <div className={cn("h-1.5 w-1.5 rounded-full ring-1 ring-white dark:ring-slate-950",
                                                isPaid ? "bg-emerald-500" : (isOverdue ? "bg-red-500" : "bg-orange-500")
                                            )} title="Payment Due" />
                                        )}
                                    </div>
                                </div>
                            );
                        }
                    }}
                />

                <div className="w-full max-w-md mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                     <div className="grid grid-cols-2 md:flex md:flex-wrap justify-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                            <span>Statement Issued</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-orange-500" />
                            <span>Payment Due</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span>Paid</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-red-500" />
                            <span>Overdue</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Details Section */}
            <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm min-h-[200px]">
                 {!selectedDate ? (
                     <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-8">
                         <Calendar className="h-12 w-12 mb-3 opacity-50" />
                         <p className="text-lg font-medium">Select a date</p>
                         <p className="text-sm">Click on a date in the calendar to view payment details.</p>
                     </div>
                 ) : (
                     <div className="space-y-6">
                         <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                             <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                 {format(selectedDate, 'MMMM do, yyyy')}
                             </h3>
                             <Badge variant="outline" className="text-slate-500">
                                 {selectedDayEvents.length} Event{selectedDayEvents.length !== 1 && 's'}
                             </Badge>
                         </div>

                         {selectedDayEvents.length === 0 ? (
                             <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                                 <p>No payment events scheduled for this day.</p>
                             </div>
                         ) : (
                             <div className="space-y-4">
                                 {selectedDayEvents.map((evt, idx) => (
                                     <div key={idx} className="flex flex-col md:flex-row gap-4 p-4 rounded-xl border bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
                                         {/* Icon Column */}
                                         <div className="flex-shrink-0">
                                             <div className={cn("h-10 w-10 rounded-full flex items-center justify-center",
                                                 evt.type === 'due'
                                                     ? (evt.isPaid ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" : "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400")
                                                     : "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                                             )}>
                                                 {evt.type === 'due' ? (
                                                     evt.isPaid ? <CheckCircle className="h-5 w-5" /> : <DollarSign className="h-5 w-5" />
                                                 ) : (
                                                     <FilePenLine className="h-5 w-5" />
                                                 )}
                                             </div>
                                         </div>

                                         {/* Content Column */}
                                         <div className="flex-1 space-y-3">
                                             <div>
                                                 <div className="flex items-center gap-2 mb-1">
                                                     <Badge variant="outline" className={cn(
                                                         evt.type === 'due' ? "border-orange-200 text-orange-700 dark:text-orange-400" : "border-blue-200 text-blue-700 dark:text-blue-400"
                                                     )}>
                                                         {evt.type === 'due' ? 'Payment Due' : 'Statement Issued'}
                                                     </Badge>
                                                     <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                         {evt.statement.card.name}
                                                     </span>
                                                 </div>
                                                 {evt.type === 'due' && !evt.isPaid && (
                                                     <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                                                         {currencyFn(evt.amount)}
                                                         <span className="text-sm font-normal text-slate-500 ml-2">due</span>
                                                     </p>
                                                 )}
                                                 {evt.type === 'statement' && (
                                                     <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                                         Statement period ending {fmtYMShortFn ? fmtYMShortFn(evt.statement.month) : evt.statement.month}.
                                                         Total Statement: {currencyFn(evt.statement.statementAmount)}.
                                                     </p>
                                                 )}
                                             </div>

                                             {/* Actions Row */}
                                             <div className="flex flex-wrap gap-2 pt-2">
                                                 <Button
                                                     size="sm"
                                                     variant="outline"
                                                     className="h-8 text-xs"
                                                     onClick={() => onViewTransactions(evt.statement.card.id, evt.statement.card.name, evt.statement.month, fmtYMShortFn(evt.statement.month))}
                                                 >
                                                     <History className="h-3.5 w-3.5 mr-1.5" />
                                                     View Transactions
                                                 </Button>

                                                 {evt.type === 'statement' && (
                                                      <Button
                                                         size="sm"
                                                         variant="outline"
                                                         className="h-8 text-xs"
                                                         disabled={evt.statement.isSynthetic}
                                                         onClick={() => onLogStatement(evt.statement)}
                                                      >
                                                          <FilePenLine className="h-3.5 w-3.5 mr-1.5" />
                                                          Log Statement
                                                      </Button>
                                                 )}

                                                 {evt.type === 'due' && !evt.isPaid && (
                                                     <Button
                                                         size="sm"
                                                         className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-none"
                                                         onClick={() => onLogPayment(evt.statement)}
                                                     >
                                                         <Wallet className="h-3.5 w-3.5 mr-1.5" />
                                                         Log Payment
                                                     </Button>
                                                 )}

                                                 {evt.type === 'due' && evt.isPaid && (
                                                     <div className="flex items-center text-sm text-emerald-600 font-medium px-2">
                                                         <CheckCircle className="h-4 w-4 mr-1.5" />
                                                         Paid in Full
                                                     </div>
                                                 )}
                                             </div>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         )}
                     </div>
                 )}
            </div>
        </div>
    );
}
