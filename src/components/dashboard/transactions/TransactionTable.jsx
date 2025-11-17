import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FilePenLine, CheckCircle, Trash2 } from 'lucide-react';
import InlineEdit from './InlineEdit';

const TransactionTableRow = ({ transaction, isSelected, onSelect, currencyFn, cardMap, rulesMap, mccMap, summaryMap, onReview, onApprove, onDelete, onInlineEdit }) => {
    const {
        'Transaction Name': name,
        'Transaction Date': date,
        'Amount': amount,
        'MCC Code': mcc,
        'Applicable Rule': ruleId,
        'Card Summary Category': summaryId,
        'Match': match
    } = transaction;

    const rule = ruleId ? rulesMap.get(ruleId[0]) : null;
    const summary = summaryId ? summaryMap.get(summaryId[0]) : null;
    const summaryName = summary ? summary.summaryId : 'N/A';
    const isApprovable = mcc && ruleId && summaryId && match;

    const handleApproveClick = async () => {
        const newName = transaction.merchantLookup || name.substring(6);
        onApprove({ ...transaction, 'Transaction Name': newName });
    };

    return (
        <TableRow className={isSelected ? 'bg-blue-50 dark:bg-blue-900' : ''}>
            <TableCell className="w-[40px]">
                <Checkbox checked={isSelected} onCheckedChange={(checked) => onSelect(transaction.id, checked)} />
            </TableCell>
            <TableCell>
                <p className="font-semibold">{name}</p>
                <p className="text-xs text-muted-foreground">{date}</p>
            </TableCell>
            <TableCell className="text-right">{currencyFn(amount)}</TableCell>
            <TableCell className={!mcc ? 'bg-red-50 dark:bg-red-900/50' : ''}>
                <InlineEdit 
                    value={mcc || ''}
                    onSave={(newValue) => onInlineEdit(transaction.id, { 'MCC Code': newValue })}
                />
            </TableCell>
            <TableCell className={!rule ? 'bg-red-50 dark:bg-red-900/50' : ''}>
                <InlineEdit
                    value={rule ? rule.ruleName : ''}
                    onSave={(newValue) => onInlineEdit(transaction.id, { 'Applicable Rule': newValue })}
                />
            </TableCell>
            <TableCell>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger><p className="truncate max-w-[150px]">{summaryName}</p></TooltipTrigger>
                        <TooltipContent>{summaryName}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </TableCell>
            <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                    {isApprovable && (
                        <Button size="icon" variant="ghost" onClick={handleApproveClick} className="text-emerald-600 h-8 w-8">
                            <CheckCircle className="h-4 w-4" />
                        </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => onReview(transaction)} className="h-8 w-8">
                        <FilePenLine className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => onDelete(transaction.id, name)} className="text-destructive h-8 w-8">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
};

export default function TransactionTable({ transactions, selected, onSelect, onSelectAll, ...props }) {
    const isAllSelected = selected.length > 0 && selected.length === transactions.length;

    return (
        <div className="hidden md:block">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[40px]">
                            <Checkbox checked={isAllSelected} onCheckedChange={onSelectAll} />
                        </TableHead>
                        <TableHead>Transaction</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>MCC</TableHead>
                        <TableHead>Rule</TableHead>
                        <TableHead>Summary ID</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions.map(tx => (
                        <TransactionTableRow
                            key={tx.id}
                            transaction={tx}
                            isSelected={selected.includes(tx.id)}
                            onSelect={onSelect}
                            {...props}
                        />
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}