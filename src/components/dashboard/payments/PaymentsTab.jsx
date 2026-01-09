import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, Wallet, CalendarClock, AlertTriangle, Check, Plus, History, FilePenLine, List, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '../../../lib/utils';
import StatCard from '../../shared/StatCard';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../ui/accordion';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../../ui/tooltip';

import PaymentLogDialog from '../dialogs/PaymentLogDialog';
import StatementLogDialog from '../dialogs/StatementLogDialog';

const API_BASE_URL = '/api';

export default function PaymentsTab({ cards, monthlySummary, currencyFn, fmtYMShortFn, daysLeftFn, onViewTransactions }) {
    const [paymentData, setPaymentData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isStatementDialogOpen, setStatementDialogOpen] = useState(false); // State for the new dialog
    const [activeStatement, setActiveStatement] = useState(null);
    const [isLoadingMore, setIsLoadingMore] = useState({});

    const handleLoadMore = useCallback(async (cardId) => {
        setIsLoadingMore(prev => ({ ...prev, [cardId]: true }));
        const cardData = paymentData.find(p => p.mainStatement.card.id === cardId);

        if (!cardData || !cardData.remainingPastSummaries || cardData.remainingPastSummaries.length === 0) {
            setIsLoadingMore(prev => ({ ...prev, [cardId]: false }));
            return;
        }

        const summariesToProcess = cardData.remainingPastSummaries.slice(0, 3);
        const remainingSummaries = cardData.remainingPastSummaries.slice(3);

        try {
            const statementPromises = summariesToProcess.map(async (stmt) => {
                const res = await fetch(`${API_BASE_URL}/transactions?month=${stmt.month}&filterBy=statementMonth&cardId=${cardId}`);
                if (!res.ok) throw new Error('Failed to fetch transactions');
                const transactions = await res.json();
                const spend = transactions.reduce((acc, tx) => acc + (tx['Amount'] || 0), 0);
                const cashback = transactions.reduce((acc, tx) => acc + (tx.estCashback || 0), 0);
                return { ...stmt, spend, cashback };
            });

            const newPastStatements = await Promise.all(statementPromises);

            setPaymentData(currentData =>
                currentData.map(cd => {
                    if (cd.mainStatement.card.id === cardId) {
                        return {
                            ...cd,
                            pastStatements: [...cd.pastStatements, ...newPastStatements],
                            remainingPastSummaries: remainingSummaries
                        };
                    }
                    return cd;
                })
            );
        } catch (error) {
            console.error("Error loading more statements:", error);
            toast.error("Could not load more statements.");
        } finally {
            setIsLoadingMore(prev => ({ ...prev, [cardId]: false }));
        }
    }, [paymentData]);

    const partitionStatements = (allStatements) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activeWindowStatements = allStatements
            .filter(s => s.statementDateObj && s.paymentDateObj && today >= s.statementDateObj && today <= s.paymentDateObj)
            .sort((a, b) => a.paymentDateObj - b.paymentDateObj);

        if (activeWindowStatements.length > 0) {
            const mainStatement = activeWindowStatements[0];
            const otherStatements = allStatements.filter(s => s.id !== mainStatement.id);

            const upcomingStatements = otherStatements.filter(s => s.daysLeft !== null).sort((a, b) => a.daysLeft - b.daysLeft);
            const pastStatements = otherStatements.filter(s => s.daysLeft === null).sort((a, b) => b.paymentDateObj - a.paymentDateObj);

            return {
                mainStatement,
                upcomingStatements,
                pastStatements
            };
        }

        const upcoming = allStatements.filter(s => s.daysLeft !== null).sort((a, b) => a.daysLeft - b.daysLeft);
        const past = allStatements.filter(s => s.daysLeft === null).sort((a, b) => b.paymentDateObj - a.paymentDateObj);

        const firstUnpaidUpcomingIndex = upcoming.findIndex(s => (s.statementAmount - (s.paidAmount || 0)) > 0);
        const firstUnpaidPastIndex = past.findIndex(s => (s.statementAmount - (s.paidAmount || 0)) > 0);

        let mainStatement = null;
        let finalUpcoming = [...upcoming];
        let finalPast = [...past];

        if (firstUnpaidUpcomingIndex !== -1) {
            mainStatement = finalUpcoming[firstUnpaidUpcomingIndex];
            finalUpcoming.splice(firstUnpaidUpcomingIndex, 1);
        } else if (firstUnpaidPastIndex !== -1) {
            mainStatement = finalPast[firstUnpaidPastIndex];
            finalPast.splice(firstUnpaidPastIndex, 1);
        } else {
            if (finalUpcoming.length > 0) {
                mainStatement = finalUpcoming.shift();
            } else if (finalPast.length > 0) {
                mainStatement = finalPast.shift();
            }
        }

        return {
            mainStatement: mainStatement,
            upcomingStatements: finalUpcoming,
            pastStatements: finalPast
        };
    };

    useEffect(() => {
        const calculatePaymentData = async () => {
            if (cards.length === 0 || monthlySummary.length === 0) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);

            const dataPromises = cards.map(async (card) => {
                const allCardSummaries = monthlySummary.filter(s => s.cardId === card.id);
                if (allCardSummaries.length === 0) return null;

                let finalResult;

                const createStatementObject = (stmt) => {
                    const year = parseInt(stmt.month.slice(0, 4), 10);
                    const month = parseInt(stmt.month.slice(4, 6), 10);

                    const statementDateObj = new Date(year, month - 1, card.statementDay);
                    statementDateObj.setHours(0, 0, 0, 0);

                    const calculatedStatementDate = `${statementDateObj.getFullYear()}-${String(statementDateObj.getMonth() + 1).padStart(2, '0')}-${String(statementDateObj.getDate()).padStart(2, '0')}`;

                    let paymentMonth = month;
                    if (card.paymentDueDay < card.statementDay) paymentMonth += 1;

                    const dueDate = new Date(year, paymentMonth - 1, card.paymentDueDay);
                    dueDate.setHours(0, 0, 0, 0);

                    const paymentDate = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`;

                    return { ...stmt, statementDateObj, statementDate: calculatedStatementDate, paymentDateObj: dueDate, daysLeft: daysLeftFn(paymentDate), paymentDate, card };
                };

                const processAndFinalize = (processedStatements, remainingPastSummaries = []) => {
                    const { mainStatement, upcomingStatements, pastStatements } = partitionStatements(processedStatements);
                    const pastDueStatements = pastStatements.filter(s => (s.statementAmount - (s.paidAmount || 0)) > 0);
                    const nextUpcomingStatement = upcomingStatements.length > 0 ? upcomingStatements[0] : null;

                    return {
                        mainStatement,
                        upcomingStatements,
                        pastStatements,
                        pastDueStatements,
                        nextUpcomingStatement,
                        remainingPastSummaries
                    };
                };

                if (card.useStatementMonthForPayments) {
                    // NEW: Decoupled Statement Logic & Fetch-on-Demand Optimization

                    // 1. Calculate Current Expected Statement Month
                    const today = new Date();
                    let targetDate = new Date(today.getFullYear(), today.getMonth(), 1);
                    if (today.getDate() > card.statementDay) {
                        targetDate.setMonth(targetDate.getMonth() + 1);
                    }

                    // 2. Generate Target Months (Current + Past 3)
                    const targetMonths = [];
                    for (let i = 0; i < 4; i++) {
                        const y = targetDate.getFullYear();
                        const m = String(targetDate.getMonth() + 1).padStart(2, '0');
                        targetMonths.push(`${y}${m}`);
                        targetDate.setMonth(targetDate.getMonth() - 1);
                    }

                    // 3. Process Target Months
                    const statementPromises = targetMonths.map(async (month) => {
                        // A. Find existing summary (if any)
                        const existingSummary = allCardSummaries.find(s => s.month === month);

                        // B. OPTIMIZATION: If finalized, skip fetch
                        if (existingSummary && (existingSummary.statementAmount > 0 || existingSummary.reviewed)) {
                            return createStatementObject(existingSummary);
                        }

                        // C. Fetch Active/Missing Data
                        try {
                            const res = await fetch(`${API_BASE_URL}/transactions?month=${month}&filterBy=statementMonth&cardId=${card.id}`);
                            if (!res.ok) throw new Error('Failed');
                            const transactions = await res.json();
                            const spend = transactions.reduce((acc, tx) => acc + (tx['Amount'] || 0), 0);
                            const cashback = transactions.reduce((acc, tx) => acc + (tx.estCashback || 0), 0);

                            const base = existingSummary || {
                                id: `synthetic-${card.id}-${month}`,
                                month: month,
                                cardId: card.id,
                                statementAmount: 0,
                                paidAmount: 0,
                                isSynthetic: true
                            };

                            return createStatementObject({ ...base, spend, cashback });

                        } catch (err) {
                            console.error(`Fetch failed for ${month}`, err);
                            return existingSummary ? createStatementObject(existingSummary) : null;
                        }
                    });

                    const activeStatements = (await Promise.all(statementPromises)).filter(Boolean);

                    // 4. Handle Older Statements (Not in target window)
                    const activeMonthsSet = new Set(activeStatements.map(s => s.month));
                    const olderSummaries = allCardSummaries
                        .filter(s => !activeMonthsSet.has(s.month))
                        .map(createStatementObject);

                    // 5. Partition
                    finalResult = processAndFinalize(activeStatements, olderSummaries);

                } else {
                    const finalStatements = allCardSummaries.map(createStatementObject);
                    finalResult = processAndFinalize(finalStatements);
                }
                 return finalResult;
            });

            const resolvedData = (await Promise.all(dataPromises)).filter(Boolean);

            resolvedData.sort((a, b) => {
                const aDays = a.mainStatement?.daysLeft;
                const bDays = b.mainStatement?.daysLeft;
                if (aDays !== null && bDays === null) return -1;
                if (aDays === null && bDays !== null) return 1;
                if (aDays !== null && bDays !== null) return aDays - bDays;
                return b.mainStatement?.paymentDateObj - a.mainStatement?.paymentDateObj;
            });

            setPaymentData(resolvedData);
            setIsLoading(false);
        };
        calculatePaymentData();
    }, [cards, monthlySummary, daysLeftFn]);

    const handleLogPaymentClick = (statement) => {
        setActiveStatement(statement);
        setDialogOpen(true);
    };

    const handleLogStatementClick = (statement) => {
        setActiveStatement(statement);
        setStatementDialogOpen(true);
    };

    const paymentGroups = useMemo(() => {
        if (!paymentData) {
            return { pastDue: [], upcoming: [], completed: [] };
        }

        const pastDue = [];
        const upcoming = [];
        const completed = [];
        const closed = []; // NEW: Bucket for Closed cards

        paymentData.forEach(p => {
            if (!p.mainStatement) {
                return;
            }

            // Check if card is closed
            if (p.mainStatement.card && p.mainStatement.card.status === 'Closed') {
                closed.push(p);
                return; // Skip the rest of logic for closed cards, they go straight to their own bucket
            }

            const {
                daysLeft,
                statementAmount: rawStatementAmount = 0,
                paidAmount = 0,
                spend = 0,
                cashback = 0
            } = p.mainStatement;

            const finalStatementAmount = rawStatementAmount > 0 ? rawStatementAmount : (spend - cashback);
            const remaining = finalStatementAmount - paidAmount;

            if (daysLeft === null && remaining > 0) {
                pastDue.push(p);
            }
            else if (daysLeft !== null && remaining > 0) {
                upcoming.push(p);
            }
            else {
                completed.push(p);
            }
        });

        return { pastDue, upcoming, completed, closed };
    }, [paymentData]);

    const handleSavePayment = async (statementId, newPaidAmount) => {
        try {
            const response = await fetch(`${API_BASE_URL}/monthly-summary/${statementId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ paidAmount: newPaidAmount }),
            });

            if (!response.ok) {
                throw new Error('Failed to save payment to Notion.');
            }

            setPaymentData(currentData =>
                currentData.map(group => {
                    if (group.mainStatement.id === statementId) {
                        const updatedStatement = { ...group.mainStatement, paidAmount: newPaidAmount };
                        return { ...group, mainStatement: updatedStatement };
                    }
                    return group;
                })
            );
            toast.success("Payment logged successfully!");

        } catch (error) {
            console.error("Error saving payment:", error);
            toast.error("Could not save payment. Please try again.");
        }
    };

    const handleSaveStatement = async (statementId, newAmount) => {
        try {
            const response = await fetch(`${API_BASE_URL}/monthly-summary/${statementId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ statementAmount: newAmount }),
            });

            if (!response.ok) {
                throw new Error('Failed to save statement amount to Notion.');
            }

            setPaymentData(currentData =>
                currentData.map(group => {
                    if (group.mainStatement.id === statementId) {
                        const updatedStatement = { ...group.mainStatement, statementAmount: newAmount };
                        return { ...group, mainStatement: updatedStatement };
                    }
                    return group;
                })
            );
            toast.success("Statement amount updated successfully!");

        } catch (error) {
            console.error("Error saving statement amount:", error);
            toast.error("Could not update statement amount. Please try again.");
        }
    };

    const summaryStats = useMemo(() => {
        const upcomingBills = paymentData.filter(p => p.mainStatement.daysLeft !== null && (p.mainStatement.statementAmount - (p.mainStatement.paidAmount || 0) > 0));

        const totalDue = upcomingBills.reduce((acc, curr) => acc + (curr.mainStatement.statementAmount - (curr.mainStatement.paidAmount || 0)), 0);
        const nextPayment = upcomingBills.length > 0 ? upcomingBills[0] : null;

        return {
            totalDue,
            billCount: upcomingBills.length,
            nextPaymentAmount: nextPayment ? (nextPayment.mainStatement.statementAmount - (nextPayment.mainStatement.paidAmount || 0)) : 0,
            nextPaymentCard: nextPayment ? nextPayment.mainStatement.card.name : 'N/A',
        };
    }, [paymentData]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Calculating payment schedules...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <StatCard title="Total Upcoming" value={currencyFn(summaryStats.totalDue)} icon={<Wallet className="h-4 w-4 text-muted-foreground" />} />
                <StatCard title="Upcoming Bills" value={summaryStats.billCount} icon={<CalendarClock className="h-4 w-4 text-muted-foreground" />} />
                <StatCard title="Next Payment" value={currencyFn(summaryStats.nextPaymentAmount)} icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />} valueClassName="text-orange-600" />
            </div>
            <div className="space-y-8">
                {paymentGroups.pastDue.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-red-600">Past Due</h2>
                        {paymentGroups.pastDue.map(({ mainStatement, ...rest }) => (
                            <PaymentCard
                                key={mainStatement.id}
                                statement={mainStatement}
                                {...rest}
                                onLogPayment={handleLogPaymentClick}
                                onLogStatement={handleLogStatementClick}
                                onViewTransactions={onViewTransactions}
                                currencyFn={currencyFn}
                                fmtYMShortFn={fmtYMShortFn}
                                onLoadMore={handleLoadMore}
                                isLoadingMore={isLoadingMore}
                            />
                        ))}
                    </div>
                )}

                {paymentGroups.upcoming.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-slate-700">Upcoming</h2>
                        {paymentGroups.upcoming.map(({ mainStatement, ...rest }) => (
                            <PaymentCard
                                key={mainStatement.id}
                                statement={mainStatement}
                                {...rest}
                                onLogPayment={handleLogPaymentClick}
                                onLogStatement={handleLogStatementClick}
                                onViewTransactions={onViewTransactions}
                                currencyFn={currencyFn}
                                fmtYMShortFn={fmtYMShortFn}
                                onLoadMore={handleLoadMore}
                                isLoadingMore={isLoadingMore}
                            />
                        ))}
                    </div>
                )}

                {paymentGroups.completed.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-slate-700">Completed</h2>
                        {paymentGroups.completed.map(({ mainStatement, ...rest }) => (
                            <PaymentCard
                                key={mainStatement.id}
                                statement={mainStatement}
                                {...rest}
                                onLogPayment={handleLogPaymentClick}
                                onLogStatement={handleLogStatementClick}
                                onViewTransactions={onViewTransactions}
                                currencyFn={currencyFn}
                                fmtYMShortFn={fmtYMShortFn}
                                onLoadMore={handleLoadMore}
                                isLoadingMore={isLoadingMore}
                            />
                        ))}
                    </div>
                )}

                {paymentGroups.closed.length > 0 && (
                    <Accordion type="single" collapsible className="w-full pt-4">
                        <AccordionItem value="closed-cards-payments">
                            <AccordionTrigger className="text-base font-semibold text-muted-foreground">
                                Show Closed Cards ({paymentGroups.closed.length})
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-4 pt-4">
                                    {paymentGroups.closed.map(({ mainStatement, ...rest }) => (
                                        <PaymentCard
                                            key={mainStatement.id}
                                            statement={mainStatement}
                                            {...rest}
                                            onLogPayment={handleLogPaymentClick}
                                            onLogStatement={handleLogStatementClick}
                                            onViewTransactions={onViewTransactions}
                                            currencyFn={currencyFn}
                                            fmtYMShortFn={fmtYMShortFn}
                                            onLoadMore={handleLoadMore}
                                            isLoadingMore={isLoadingMore}
                                        />
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                )}
            </div>
            {activeStatement && (
                 <PaymentLogDialog
                    isOpen={dialogOpen}
                    onClose={() => setDialogOpen(false)}
                    statement={activeStatement}
                    onSave={handleSavePayment}
                    currencyFn={currencyFn}
                    fmtYMShortFn={fmtYMShortFn}
                />
            )}
            {activeStatement && (
                 <StatementLogDialog
                    isOpen={isStatementDialogOpen}
                    onClose={() => setStatementDialogOpen(false)}
                    statement={activeStatement}
                    onSave={handleSaveStatement}
                    currencyFn={currencyFn}
                    fmtYMShortFn={fmtYMShortFn}
                />
            )}
        </div>
    );
}

function PaymentCard({ statement, upcomingStatements, pastStatements, pastDueStatements, nextUpcomingStatement, onLogPayment, onLogStatement, onViewTransactions, currencyFn, fmtYMShortFn, onLoadMore, isLoadingMore }) {
    const [historyOpen, setHistoryOpen] = useState(false);

    // --- UPDATED: Balance Calculation Logic ---
    const {
        card,
        daysLeft,
        statementAmount: rawStatementAmount = 0, // Get the raw amount
        paidAmount = 0,
        spend = 0,
        cashback = 0,
        statementDateObj
    } = statement;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isNotFinalized = statementDateObj && today < statementDateObj;

    // Calculate estimated balance first
    const estimatedBalance = spend - cashback;
    // Use the actual amount if it exists, otherwise fall back to the estimated balance
    const statementAmount = rawStatementAmount > 0 ? rawStatementAmount : estimatedBalance;

    const remaining = statementAmount - paidAmount;
    // A card is considered "paid" if there was a balance and it's now cleared.
    const isPaid = statementAmount > 0 && remaining <= 0;
    // No payment is needed if the final balance is zero or negative (e.g., cashback > spend).
    const noPaymentNeeded = statementAmount <= 0;
    const isPartiallyPaid = paidAmount > 0 && !isPaid;

    const getStatus = () => {
        if (noPaymentNeeded) return {
            text: 'No Payment Needed',
            className: 'bg-slate-100 text-slate-600',
            icon: <Check className="h-3 w-3 mr-1.5" />
        };
        if (isPaid) return {
            text: 'Fully Paid',
            className: 'bg-emerald-100 text-emerald-800',
            icon: <Check className="h-3 w-3 mr-1.5" />
        };
        if (isPartiallyPaid) return {
            text: 'Partially Paid',
            className: 'bg-yellow-100 text-yellow-800'
        };
        if (daysLeft === null) return {
            text: 'Completed',
            className: 'bg-slate-100 text-slate-600'
        };
         if (daysLeft <= 3) return {
            text: `${daysLeft} days left`,
            className: 'bg-red-100 text-red-800'
        };
        if (daysLeft <= 7) return {
            text: `${daysLeft} days left`,
            className: 'bg-yellow-100 text-yellow-800'
        };
        return {
            text: `${daysLeft} days left`,
            className: 'bg-slate-100 text-slate-800'
        };
    };

    const status = getStatus();

    return (
        <div className={cn("bg-card text-card-foreground rounded-xl shadow-sm overflow-hidden border",
            (isPaid || noPaymentNeeded) && "opacity-80",
            !isPaid && daysLeft !== null && daysLeft <= 3 && "border-2 border-red-500",
            isPartiallyPaid && "border-2 border-yellow-500"
        )}>
            {pastDueStatements && pastDueStatements.length > 0 && (
                <div className="p-4 bg-orange-50 border-b border-orange-200">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-orange-500 mt-0-5 flex-shrink-0" />
                        <div>
                            <h4 className="font-bold text-sm text-orange-800">Past Due Payments Found</h4>
                            <div className="mt-1 text-xs text-orange-700 space-y-1">
                                {pastDueStatements.map(stmt => (
                                    <div key={stmt.id} className="flex justify-between items-center">
                                        <span>Statement for {fmtYMShortFn(stmt.month)}:</span>
                                        <div className="text-xs text-slate-500 mt-2 flex items-center gap-4">
                                            <span>Statement Date: <span className="font-medium text-slate-600">{statement.statementDate}</span></span>
                                            <span>Payment Due: <span className="font-medium text-slate-600">{statement.paymentDate}</span></span>
                                        </div>
                                        <span className="font-semibold ml-2">{currencyFn(stmt.statementAmount - (stmt.paidAmount || 0))}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-4">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-lg">{card.name} <span className="text-base font-medium text-slate-400">•••• {card.last4}</span></p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                            <span>
                                Statement: <span className="font-medium text-slate-600 dark:text-slate-300">{fmtYMShortFn(statement.month)}</span>
                            </span>
                            <span className="text-slate-400">•</span>
                            <span>
                                Issued: <span className="font-medium text-slate-600 dark:text-slate-300">{statement.statementDate}</span>
                            </span>
                            <span className="text-slate-400">•</span>
                            <span>
                                Due: <span className="font-medium text-slate-600 dark:text-slate-300">{statement.paymentDate}</span>
                            </span>
                        </div>
                    </div>
                    <div className={cn("text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 inline-flex items-center", status.className)}>
                        {status.icon}{status.text}
                    </div>
                </div>

                {/* --- NEW: "Not Finalized" Banner --- */}
                {isNotFinalized && (
                    <div className="mb-4 p-3 rounded-lg bg-sky-50 border border-sky-200">
                        <div className="flex items-start gap-3">
                            <CalendarClock className="h-5 w-5 text-sky-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="font-bold text-sm text-sky-800">Statement Not Finalized</h4>
                                <p className="mt-1 text-xs text-sky-700">
                                    This balance is an active estimate and will be finalized on the statement date.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-col md:flex-row gap-4">
                    {noPaymentNeeded ? (
                        <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 flex flex-col items-center justify-center text-center h-40">
                            <Wallet className="h-8 w-8 text-slate-400 dark:text-slate-500 mb-2" />
                            <p className="font-semibold text-slate-700 dark:text-slate-300">No Balance This Month</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">You're all clear for this statement cycle.</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 bg-slate-100/80 dark:bg-slate-800/50 rounded-lg p-3">
                                {/* Label changed from ACTUAL BALANCE */}
                                <div className="flex items-center gap-2">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">STATEMENT BALANCE</p>
                                    {/* Move the badge logic here and remove the top margin */}
                                    {(rawStatementAmount === 0 || rawStatementAmount === null) && <Badge variant="outline">Estimated</Badge>}
                                </div>
                                <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-200 tracking-tight">{currencyFn(statementAmount)}</p>
                                <div className="mt-2 space-y-1 text-sm">
                                    <div className="flex justify-between items-center"><span className="text-slate-500 dark:text-slate-400">Paid:</span><span className="font-medium text-slate-600 dark:text-slate-300">{currencyFn(paidAmount)}</span></div>
                                    <div className="flex justify-between items-center font-bold"><span className="text-slate-500 dark:text-slate-400">Remaining:</span><span className={cn(isPaid ? "text-emerald-600" : "text-red-600")}>{currencyFn(remaining)}</span></div>
                                </div>
                            </div>
                            <div className="w-full md:w-64 bg-slate-50/70 dark:bg-slate-800/30 rounded-lg p-3">
                                {/* Label changed from ESTIMATED BALANCE */}
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">SPEND SUMMARY</p>
                                <p className="text-2xl font-bold text-slate-500 dark:text-slate-400 tracking-tight">{currencyFn(estimatedBalance)}</p>
                                <div className="mt-2 space-y-1 text-sm">
                                    <div className="flex justify-between items-center"><span className="text-slate-500 dark:text-slate-400">Total Spend:</span><span className="font-medium text-slate-600 dark:text-slate-300">{currencyFn(spend)}</span></div>
                                    <div className="flex justify-between items-center"><span className="text-slate-500 dark:text-slate-400">Cashback:</span><span className="font-medium text-emerald-600">-{currencyFn(cashback)}</span></div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="mt-4 flex justify-end items-center gap-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button onClick={() => onViewTransactions(card.id, card.name, statement.month, fmtYMShortFn(statement.month))} variant="outline" size="icon" className="sm:w-auto sm:px-3">
                                    <History className="h-4 w-4" />
                                    <span className="hidden sm:inline ml-1.5">Transaction Details</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="sm:hidden"><p>Transaction Details</p></TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    onClick={() => onLogStatement(statement)}
                                    disabled={statement.isSynthetic}
                                    variant="outline"
                                    size="icon"
                                    className="sm:w-auto sm:px-3"
                                >
                                    <FilePenLine className="h-4 w-4" />
                                    <span className="hidden sm:inline ml-1.5">Log Statement</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{statement.isSynthetic ? "Wait for month to finalize" : "Log Statement Amount"}</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    onClick={() => setHistoryOpen(!historyOpen)}
                                    variant="outline"
                                    size="icon"
                                    className="sm:w-auto sm:px-3"
                                >
                                    <List className="h-4 w-4" />
                                    <span className="hidden sm:inline ml-1.5">Statements</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="sm:hidden"><p>Statements</p></TooltipContent>
                        </Tooltip>

                        {!noPaymentNeeded && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        onClick={() => onLogPayment(statement)}
                                        disabled={isPaid || statement.isSynthetic}
                                        size="icon"
                                        className="sm:w-auto sm:px-3"
                                    >
                                        {isPaid ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                        <span className="hidden sm:inline ml-1.5">{isPaid ? 'Paid' : 'Log Payment'}</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{statement.isSynthetic ? "Wait for month to finalize" : (isPaid ? 'Paid' : 'Log Payment')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </TooltipProvider>
                </div>
            </div>

            {isPaid && nextUpcomingStatement && (
                <div className="p-4 border-t border-slate-200 bg-slate-50/50">
                    <div className="p-4 rounded-lg bg-sky-50 border border-sky-200">
                        {/* Header Section */}
                        <div className="flex items-center gap-2 mb-3">
                            <CalendarClock className="h-5 w-5 text-sky-600" />
                            <h4 className="font-bold text-sm text-sky-800">Next Statement Preview</h4>
                        </div>

                        {/* Horizontally Aligned Content */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center md:text-left">
                            {/* --- Statement Month --- */}
                            <div>
                                <p className="text-xs text-sky-700 font-semibold uppercase tracking-wider">Statement Month</p>
                                <p className="text-lg font-bold text-sky-900">{fmtYMShortFn(nextUpcomingStatement.month)}</p>
                            </div>

                            {/* --- NEW: Est. Statement Due --- */}
                            <div>
                                <p className="text-xs text-sky-700 font-semibold uppercase tracking-wider">Est. Statement Due</p>
                                <p className="text-lg font-bold text-sky-900">{nextUpcomingStatement.statementDate}</p>
                            </div>

                            {/* --- Est. Payment Due --- */}
                            <div>
                                <p className="text-xs text-sky-700 font-semibold uppercase tracking-wider">Est. Payment Due</p>
                                <p className="text-lg font-bold text-sky-900">{nextUpcomingStatement.paymentDate}</p>
                            </div>

                            {/* --- Current Est. Balance --- */}
                            <div className="md:text-right">
                                <p className="text-xs text-sky-700 font-semibold uppercase tracking-wider">Current Est. Balance</p>
                                <p className="text-2xl font-extrabold text-sky-900 tracking-tight">
                                    {currencyFn(nextUpcomingStatement.spend - nextUpcomingStatement.cashback)}
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {historyOpen && (
                <div className="p-4 border-t border-slate-200 bg-slate-50/50 space-y-4">
                    <StatementHistoryTable title="Upcoming Statements" statements={upcomingStatements} currencyFn={currencyFn} fmtYMShortFn={fmtYMShortFn} onViewTransactions={onViewTransactions} />
                    <StatementHistoryTable title="Past Statements" statements={pastStatements} remainingCount={statement.remainingPastSummaries?.length || 0} onLoadMore={() => onLoadMore(statement.card.id)} isLoadingMore={isLoadingMore[statement.card.id]} currencyFn={currencyFn} fmtYMShortFn={fmtYMShortFn} onViewTransactions={onViewTransactions} />
                </div>
            )}
        </div>
    );
}

function StatementHistoryTable({ title, statements, remainingCount, onLoadMore, isLoadingMore, currencyFn, fmtYMShortFn, onViewTransactions }) {
    if (!statements || statements.length === 0) {
        return null; // Don't render anything if there are no statements
    }

    return (
        <div>
            <h3 className="text-sm font-semibold mb-2 text-slate-600 dark:text-slate-300">{title}</h3>
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm whitespace-nowrap">
                    <thead className="text-left text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800">
                        <tr>
                            <th className="sticky left-0 bg-slate-100 dark:bg-slate-800 p-2 font-medium">Month</th>
                            <th className="p-2 font-medium">Status</th>
                            <th className="p-2 font-medium">Statement Date</th>
                            <th className="p-2 font-medium">Payment Date</th>
                            <th className="p-2 font-medium text-right">Spend</th>
                            <th className="p-2 font-medium text-right">Cashback</th>
                            <th className="p-2 font-medium text-right">Actual Balance</th>
                            <th className="p-2 font-medium text-right">Paid</th>
                            <th className="p-2 font-medium text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
                        {statements.map(stmt => {
                            let statusBadge;
                            if (stmt.daysLeft === null) {
                                statusBadge = <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full">Completed</span>;
                            } else {
                                statusBadge = <span className="bg-sky-100 text-sky-800 text-xs font-bold px-2 py-0.5 rounded-full">Upcoming</span>;
                            }

                            return (
                                <tr key={stmt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="sticky left-0 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2"><span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium px-2 py-1 rounded-md text-xs">{fmtYMShortFn(stmt.month)}</span></td>
                                    <td className="p-2">{statusBadge}</td>
                                    <td className="p-2">{stmt.statementDate}</td>
                                    <td className="p-2">{stmt.paymentDate}</td>
                                    <td className="p-2 text-right">{currencyFn(stmt.spend)}</td>
                                    <td className="p-2 text-right text-emerald-600">-{currencyFn(stmt.cashback)}</td>
                                    <td className="p-2 text-right font-bold text-slate-700 dark:text-slate-300">{currencyFn(stmt.statementAmount)}</td>
                                    <td className="p-2 text-right">{currencyFn(stmt.paidAmount)}</td>
                                    <td className="p-2 text-center">
                                        <button
                                            onClick={() => onViewTransactions(stmt.card.id, stmt.card.name, stmt.month, fmtYMShortFn(stmt.month))}
                                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                        >
                                            <List className="h-5 w-5"/>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    {remainingCount > 0 && (
                        <tfoot className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <td colSpan="9" className="text-center p-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={onLoadMore}
                                        disabled={isLoadingMore}
                                    >
                                        {isLoadingMore ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <ChevronDown className="mr-2 h-4 w-4" />
                                        )}
                                        Load More ({remainingCount} remaining)
                                    </Button>
                                </td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    );
}
