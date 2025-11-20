import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FilePenLine, CheckCircle, Trash2, CalendarClock, Wallet } from 'lucide-react';
import InlineEdit from './InlineEdit';

export default function TransactionCard({ transaction, isSelected, onSelect, currencyFn, cardMap, rulesMap, mccMap, summaryMap, onReview, onApprove, onDelete, onInlineEdit }) {
    const {
        'Transaction Name': name,
        'Transaction Date': date,
        'Amount': amount,
        'MCC Code': mcc,
        'Applicable Rule': ruleId,
        'Card Summary Category': summaryId,
        'Card': cardId,
        'Match': match,
        'Est. Cashback': estCashback
    } = transaction;

    const card = cardId ? cardMap.get(cardId[0]) : null;
    const rule = ruleId ? rulesMap.get(ruleId[0]) : null;
    const summary = summaryId ? summaryMap.get(summaryId[0]) : null;
    const summaryName = summary ? summary.summaryId : 'N/A';
    const isApprovable = mcc && ruleId && summaryId && match;
    
    const handleApproveClick = async () => {
        onApprove(transaction);
    };

    return (
        <div className={`p-3 border rounded-md bg-white dark:bg-slate-900 flex flex-col gap-4 ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
            <div className="flex justify-between items-start">
                <div className="flex-1 space-y-2">
                    <p className="font-semibold">{name}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1.5"><CalendarClock className="h-3 w-3" /> {date}</span>
                        <span className="flex items-center gap-1.5"><Wallet className="h-3 w-3" /> {currencyFn(amount)}</span>
                        {estCashback > 0 && (
                            <span className="flex items-center gap-1.5 font-medium text-emerald-600"><CheckCircle className="h-3 w-3" /> {currencyFn(estCashback)}</span>
                        )}
                    </div>
                </div>
                <Checkbox checked={isSelected} onCheckedChange={(checked) => onSelect(transaction.id, checked)} className="ml-4" />
            </div>

            <div className="text-xs text-slate-600 grid grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t mt-2">
                <div>
                    <p className="font-semibold text-slate-400 dark:text-slate-500">Card</p>
                    <p>{card ? card.name : 'N/A'}</p>
                </div>
                <div className={!mcc ? 'p-2 rounded-lg bg-red-50 dark:bg-red-900/50' : ''}>
                    <p className="font-semibold text-slate-400 dark:text-slate-500">MCC</p>
                    <InlineEdit
                        value={mcc || ''}
                        onSave={(newValue) => onInlineEdit(transaction.id, { 'MCC Code': newValue })}
                    />
                </div>
                <div className={!rule ? 'p-2 rounded-lg bg-red-50 dark:bg-red-900/50' : ''}>
                    <p className="font-semibold text-slate-400 dark:text-slate-500">Rule</p>
                    <InlineEdit
                        value={rule ? rule.ruleName : ''}
                        onSave={(newValue) => onInlineEdit(transaction.id, { 'Applicable Rule': newValue })}
                    />
                </div>
                <div>
                    <p className="font-semibold text-slate-400 dark:text-slate-500">Category</p>
                    <InlineEdit
                        value={transaction.Category || ''}
                        onSave={(newValue) => onInlineEdit(transaction.id, { 'Category': newValue })}
                    />
                </div>
                <div>
                    <p className="font-semibold text-slate-400 dark:text-slate-500">Status</p>
                    <p>{isApprovable ? 'Quick Approve' : 'Missing Info'}</p>
                </div>
                <div>
                    <p className="font-semibold text-slate-400 dark:text-slate-500">Method</p>
                    <p>Automated</p>
                </div>
                <div>
                    <p className="font-semibold text-slate-400 dark:text-slate-500">Final Amount</p>
                    <p>{currencyFn(amount)}</p>
                </div>
            </div>

            <div className="flex items-center gap-2 self-end">
                {isApprovable && (
                    <Button size="sm" variant="outline" onClick={handleApproveClick} className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                    </Button>
                )}
                <Button size="sm" onClick={() => onReview(transaction)}>
                    <FilePenLine className="mr-2 h-4 w-4" />
                    Review
                </Button>
                <Button size="sm" variant="destructive" onClick={() => onDelete(transaction.id, name)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}