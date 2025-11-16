import React from 'react';
import { Checkbox } from '../ui/checkbox';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

const TransactionCard = ({
    transaction,
    currencyFn,
    isSelected,
    onSelect,
    onClick,
    isExpanded,
    onEdit,
    onDelete,
    getMccDescription,
    cardMap 
}) => {
    const {
        'Transaction Name': name,
        'Amount': amount,
        estCashback,
        'Transaction Date': date,
        'Card': card, 
        'Category': category,
        'MCC Code': mcc,
        'Notes': notes
    } = transaction;

    // Look up the card name using the map
    const cardName = card ? (cardMap.get(card[0])?.name || 'N/A') : 'N/A';

    const cashbackRate = amount ? (estCashback / amount) * 100 : 0;

    const handleCardClick = (e) => {
        // Prevent card click when clicking checkbox or buttons
        if (e.target.closest('button, [role="checkbox"]')) {
            return;
        }
        onClick(transaction.id);
    };

    return (
        <Card
            // CHANGED: Added shadow-none
            className={`mb-1 transition-all shadow-none ${isSelected ? 'bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500' : ''}`}
            onClick={handleCardClick}
        >
            <CardContent className="px-2 py-2 flex items-center">
                <div className="mr-2">
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => onSelect(transaction.id, checked)}
                    />
                </div>

                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <p className="font-semibold text-sm">{name}</p>
                    </div>
                    <div className="flex justify-between items-center mt-0.5">
                        <div>
                            <p className="text-muted-foreground text-xs">Amount</p>
                            <p className="font-bold text-sm">{currencyFn(amount)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-muted-foreground text-xs">Cashback</p>
                            <p className="font-bold text-sm text-green-600 dark:text-green-400">{currencyFn(estCashback)}</p>
                        </div>
                        <div className="text-right">
                             <Badge variant="secondary">{cashbackRate.toFixed(1)}%</Badge>
                        </div>
                    </div>
                </div>
            </CardContent>

            {isExpanded && (
                <CardContent className="px-2 pt-1 pb-2 border-t">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <div>
                            <p className="text-muted-foreground">Date</p>
                            <p>{date}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Card</p>
                            {/* --- START: MODIFICATION --- */}
                            <p>{cardName}</p>
                            {/* --- END: MODIFICATION --- */}
                        </div>
                        <div>
                            <p className="text-muted-foreground">Category</p>
                            <p>{category || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">MCC</p>
                            <p>{mcc} - {getMccDescription(mcc)}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-muted-foreground">Notes</p>
                            <p>{notes || 'N/A'}</p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                        {onEdit && <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(transaction); }}>Edit</Button>}
                        {onDelete && <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(transaction.id, name); }}>Delete</Button>}
                    </div>
                </CardContent>
            )}
        </Card>
    );
};

export default TransactionCard;