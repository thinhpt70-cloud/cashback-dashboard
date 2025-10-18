// src/TransactionReviewCenter.jsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./components/ui/accordion";
import { AlertTriangle, FilePenLine, CalendarClock, Wallet, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * A component that displays a list of automated transactions that require user review.
 * It provides a "Quick Approve" option for transactions that have most data filled in,
 * and a full "Review" option for those with significant missing information.
 *
 * @param {object[]} transactions - Array of transaction objects needing review.
 * @param {function} onReview - Callback function to open the full edit form for a transaction.
 * @param {function} onApprove - Callback function invoked after a transaction is successfully quick-approved.
 * @param {function} currencyFn - A function to format numbers as currency.
 */
export function TransactionReviewCenter({ transactions, onReview, onApprove, currencyFn }) {
    if (!transactions || transactions.length === 0) {
        return null; // Don't render anything if there are no items to review
    }

    /**
     * Handles the "Quick Approve" action. It sends a PATCH request to the backend
     * to update the transaction's name and then calls the onApprove callback.
     * @param {object} tx - The transaction object to be approved.
     */
    const handleApproveClick = async (tx) => {
        // The new name will be the 'merchantLookup' field if it exists, otherwise the raw name without the "Email_" prefix.
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
            
        } catch (error) {
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
                            <div className="space-y-3 pt-2">
                                {transactions.map(tx => {
                                    // A transaction is eligible for "Quick Approve" if its name has the "Email_" prefix,
                                    // but the critical MCC Code and Applicable Rule have already been found and filled in by the automation.
                                    const isApprovable = tx['Transaction Name'].startsWith('Email_') && tx['MCC Code'] && tx['Applicable Rule'];
                                    
                                    return (
                                        <div key={tx.id} className="p-3 border rounded-md bg-white flex justify-between items-center gap-4">
                                            <div className="flex-1">
                                                <p className="font-semibold">{tx['Transaction Name']}</p>
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                                    <span className="flex items-center gap-1.5"><CalendarClock className="h-3 w-3" /> {tx['Transaction Date']}</span>
                                                    <span className="flex items-center gap-1.5"><Wallet className="h-3 w-3" /> {currencyFn(tx['Amount'])}</span>
                                                </div>
                                                <div className="text-xs text-orange-600 font-medium mt-1">
                                                    {/* Highlight what's still missing */}
                                                    {!tx['MCC Code'] && <span>• Missing MCC </span>}
                                                    {!tx['Applicable Rule'] && <span>• Missing Rule</span>}
                                                </div>
                                            </div>
                                            
                                            {/* Conditionally render the correct button based on whether it's approvable or needs a full review */}
                                            {isApprovable ? (
                                                <Button size="sm" variant="outline" onClick={() => handleApproveClick(tx)} className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700">
                                                    <CheckCircle className="mr-2 h-4 w-4" />
                                                    Quick Approve
                                                </Button>
                                            ) : (
                                                <Button size="sm" onClick={() => onReview(tx)}>
                                                    <FilePenLine className="mr-2 h-4 w-4" />
                                                    Review
                                                </Button>
                                            )}
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