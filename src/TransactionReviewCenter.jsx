import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./components/ui/accordion";
import { AlertTriangle, FilePenLine, CalendarClock, Wallet, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from "./components/ui/badge";

/**
 * A component that displays a list of automated transactions that require user review.
 * It provides a "Quick Approve" option and a full "Review" option.
 *
 * @param {object[]} transactions - Array of transaction objects needing review.
 * @param {function} onReview - Callback function to open the full edit form for a transaction.
 * @param {function} onApprove - Callback function invoked after a transaction is successfully quick-approved.
 * @param {function} currencyFn - A function to format numbers as currency.
 * @param {Map} cardMap - Map of card IDs to card objects.
 * @param {Map} rulesMap - Map of rule IDs to rule objects.
 * @param {object} mccMap - Object mapping MCC codes to descriptions.
 */
export function TransactionReviewCenter({ transactions, onReview, onApprove, currencyFn, cardMap, rulesMap, mccMap }) {
    if (!transactions || transactions.length === 0) {
        return null; // Don't render anything if there are no items to review
    }

    /**
     * Handles the "Quick Approve" action.
     * @param {object} tx - The transaction object to be approved.
     */
    const handleApproveClick = async (tx) => {
        const newName = tx.merchantLookup || tx['Transaction Name'].substring(6);
        
        try {
            const response = await fetch(`/api/transactions/${tx.id}/approve`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newName: newName }),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Server responded with an error.');
            }
            
            const updatedTransaction = await response.json();
            onApprove(updatedTransaction); // Call parent handler to update UI state
            toast.success(`'${newName}' has been approved.`);
            
        } catch (error)
        {
            console.error('Quick Approve failed:', error);
            toast.error(`Could not approve transaction: ${error.message}`);
        }
    };

    return (
        <Card className="border-orange-500/50 bg-orange-50/30">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-6 w-6 text-orange-500" />
                        <div>
                            <CardTitle className="text-lg text-orange-800">
                                Transaction Review Needed
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                You have <span className="font-bold">{transactions.length}</span> automated transaction(s) with missing details.
                            </p>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="review-list">
                        <AccordionTrigger>Show Items for Review</AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-4 pt-2">
                                {transactions.map(tx => {
                                    const isApprovable = tx['Transaction Name'].startsWith('Email_') && tx['MCC Code'] && tx['Applicable Rule'];
                                    
                                    // Get additional details using the provided maps
                                    const card = tx['Card'] ? cardMap.get(tx['Card'][0]) : null;
                                    const rule = tx['Applicable Rule'] ? rulesMap.get(tx['Applicable Rule'][0]) : null;
                                    const mccDescription = tx['MCC Code'] ? mccMap[tx['MCC Code']]?.vn || 'Unknown' : 'N/A';
                                    const summaryId = tx['Card Summary Category'] ? tx['Card Summary Category'][0] : 'N/A';

                                    return (
                                        <div key={tx.id} className="p-3 border rounded-md bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                            {/* Main Info Section */}
                                            <div className="flex-1 space-y-2 w-full">
                                                <p className="font-semibold">{tx['Transaction Name']}</p>
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                                                    <span className="flex items-center gap-1.5"><CalendarClock className="h-3 w-3" /> {tx['Transaction Date']}</span>
                                                    <span className="flex items-center gap-1.5"><Wallet className="h-3 w-3" /> {currencyFn(tx['Amount'])}</span>
                                                    {tx.estCashback > 0 && (
                                                         <span className="flex items-center gap-1.5 font-medium text-emerald-600"><CheckCircle className="h-3 w-3" /> {currencyFn(tx.estCashback)}</span>
                                                    )}
                                                </div>

                                                {/* Additional Details Section */}
                                                <div className="text-xs text-slate-600 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 pt-2 border-t mt-2">
                                                    <div>
                                                        <p className="font-semibold text-slate-400">Card</p>
                                                        <p>{card ? card.name : 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-400">MCC</p>
                                                        <p className="truncate" title={`${tx['MCC Code']} - ${mccDescription}`}>{tx['MCC Code'] ? `${tx['MCC Code']} - ${mccDescription}` : 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-400">Rule</p>
                                                        <p>{rule ? rule.ruleName : 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-400">Summary ID</p>
                                                        <p className="truncate" title={summaryId}>{summaryId}</p>
                                                    </div>
                                                </div>

                                                {/* Highlight what's still missing */}
                                                <div className="pt-1">
                                                    {!tx['MCC Code'] && <Badge variant="destructive">Missing MCC</Badge>}
                                                    {!tx['Applicable Rule'] && <Badge variant="destructive" className="ml-1">Missing Rule</Badge>}
                                                </div>
                                            </div>
                                            
                                            {/* Buttons Section */}
                                            <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
                                                {isApprovable && (
                                                    <Button size="sm" variant="outline" onClick={() => handleApproveClick(tx)} className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700">
                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                        Quick Approve
                                                    </Button>
                                                )}
                                                <Button size="sm" onClick={() => onReview(tx)}>
                                                    <FilePenLine className="mr-2 h-4 w-4" />
                                                    Review
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
    );
}