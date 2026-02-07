import React from "react";
import { Eye, FilePenLine, Trash2, Loader2 } from "lucide-react";
import { Button } from "../../ui/button";
import { Checkbox } from "../../ui/checkbox";
import { TableCell, TableRow } from "../../ui/table";
import { cn } from "../../../lib/utils";

const TransactionRow = React.memo(({
    transaction: tx,
    isSelected,
    activeColumns,
    onSelect,
    onViewDetails,
    onEdit,
    onDelete,
    isDeleting,
    isUpdating
}) => {
    const isProcessing = isDeleting || isUpdating;

    return (
        <TableRow
            onClick={() => !isProcessing && onViewDetails && onViewDetails(tx)}
            className={cn(
                "cursor-pointer transition-opacity duration-200",
                isSelected && "bg-slate-50 dark:bg-slate-800/50",
                isProcessing && "opacity-50 pointer-events-none"
            )}
        >
            <TableCell className="p-2" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => onSelect(tx.id, checked)}
                    aria-label={`Select ${tx['Transaction Name']}`}
                />
            </TableCell>
            <TableCell className="px-2">
                {/* Spacer/Indicator could go here */}
            </TableCell>

            {/* Dynamic Cells */}
            {activeColumns.map(col => (
                <TableCell key={col.id} className={col.cellClass || ""}>
                    {col.renderCell(tx)}
                </TableCell>
            ))}

            {/* Actions Column - Fixed */}
            <TableCell className="text-center">
                <div className="flex items-center justify-center gap-1 min-w-[80px]" onClick={(e) => e.stopPropagation()}>
                    {isProcessing ? (
                        <div className="flex items-center gap-2">
                             <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                             {isUpdating && <span className="text-xs text-muted-foreground">Syncing...</span>}
                        </div>
                    ) : (
                        <>
                            {/* Fixed View Details Button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-slate-500 hover:text-slate-700"
                                onClick={() => onViewDetails(tx)}
                                title="View Details"
                                aria-label={`View details for ${tx['Transaction Name']}`}
                            >
                                <Eye className="h-4 w-4" />
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-slate-500 hover:text-slate-700"
                                onClick={() => onEdit(tx)}
                                title="Edit"
                                aria-label={`Edit ${tx['Transaction Name']}`}
                            >
                                <FilePenLine className="h-4 w-4" />
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive/90"
                                onClick={() => onDelete(tx.id, tx['Transaction Name'])}
                                title="Delete"
                                aria-label={`Delete ${tx['Transaction Name']}`}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                </div>
            </TableCell>
        </TableRow>
    );
});

TransactionRow.displayName = 'TransactionRow';

export default TransactionRow;
