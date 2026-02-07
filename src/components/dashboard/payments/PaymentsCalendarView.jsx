import React, { useState, useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, isSameDay, startOfMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '../../ui/dialog';

export default function PaymentsCalendarView({ paymentData, currencyFn, onLogPayment }) {
    const [selectedDate, setSelectedDate] = useState();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogContent, setDialogContent] = useState(null);

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

    const handleDayClick = (day, modifiers) => {
        const dateKey = format(day, 'yyyy-MM-dd');
        const dayEvents = events.get(dateKey);

        if (dayEvents && dayEvents.length > 0) {
            setSelectedDate(day);
            setDialogContent(dayEvents);
            setIsDialogOpen(true);
        }
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

    // Custom Day Content to show indicators
    const footer = selectedDate ? `Selected: ${format(selectedDate, 'PP')}` : "Pick a day.";

    return (
        <div className="flex flex-col items-center bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
            <style>{`
                .rdp-day_selected {
                    background-color: var(--primary) !important;
                    color: var(--primary-foreground) !important;
                }
                .rdp-button:hover:not([disabled]) {
                    background-color: var(--accent);
                    color: var(--accent-foreground);
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
                classNames={{
                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                    month: "space-y-4",
                    caption: "flex justify-center pt-1 relative items-center",
                    caption_label: "text-sm font-medium",
                    nav: "space-x-1 flex items-center",
                    nav_button: cn(
                        "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-slate-200 rounded-md flex items-center justify-center transition-opacity"
                    ),
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex",
                    head_cell:
                        "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                    row: "flex w-full mt-2",
                    cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                    day: cn(
                        "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
                    ),
                    day_range_end: "day-range-end",
                    day_selected:
                        "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                    day_today: "bg-accent text-accent-foreground",
                    day_outside:
                        "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                    day_disabled: "text-muted-foreground opacity-50",
                    day_range_middle:
                        "aria-selected:bg-accent aria-selected:text-accent-foreground",
                    day_hidden: "invisible",
                }}
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
                            <div className="relative w-full h-full flex items-center justify-center">
                                <span>{date.getDate()}</span>
                                <div className="absolute bottom-1 flex gap-0.5">
                                    {hasStatement && (
                                        <div className="h-1 w-1 rounded-full bg-blue-400" title="Statement Date" />
                                    )}
                                    {hasDue && (
                                        <div className={cn("h-1 w-1 rounded-full",
                                            isPaid ? "bg-emerald-400" : (isOverdue ? "bg-red-500" : "bg-orange-400")
                                        )} title="Payment Due" />
                                    )}
                                </div>
                            </div>
                        );
                    }
                }}
            />

            <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-blue-400" />
                    <span>Statement Issued</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-orange-400" />
                    <span>Payment Due</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span>Paid</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    <span>Overdue</span>
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedDate ? format(selectedDate, 'MMMM do, yyyy') : 'Details'}</DialogTitle>
                        <DialogDescription>Events for this day</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        {dialogContent && dialogContent.map((evt, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border bg-slate-50 dark:bg-slate-900/50">
                                {evt.type === 'due' ? (
                                    evt.isPaid ?
                                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" /> :
                                    <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                                ) : (
                                    <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                                )}
                                <div className="flex-1">
                                    <h4 className="font-semibold text-sm">
                                        {evt.type === 'due' ? 'Payment Due' : 'Statement Issued'}
                                    </h4>
                                    <p className="text-sm text-muted-foreground">{evt.statement.card.name}</p>

                                    {evt.type === 'due' && (
                                        <div className="mt-2 text-sm font-medium">
                                            {evt.isPaid ? (
                                                <span className="text-emerald-600">Paid Full Amount</span>
                                            ) : (
                                                <div className="flex flex-col">
                                                    <span>Due: {currencyFn(evt.amount)}</span>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="mt-2 h-7 text-xs w-fit"
                                                        onClick={() => {
                                                            onLogPayment(evt.statement);
                                                            setIsDialogOpen(false);
                                                        }}
                                                    >
                                                        Log Payment
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
