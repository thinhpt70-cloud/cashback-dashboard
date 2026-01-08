import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from 'src/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'src/components/ui/table';
import { Badge } from 'src/components/ui/badge';
import { Button } from 'src/components/ui/button';
import { Loader2, RefreshCw, Trash2, AlertCircle } from 'lucide-react';
import { cn } from 'src/lib/utils';

export default function SyncQueueSheet({ isOpen, onOpenChange, queue, onRetry, onRemove, isSyncing }) {
    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col h-full">
                <SheetHeader className="p-6 border-b">
                    <div className="flex items-center justify-between">
                        <SheetTitle>Sync Queue</SheetTitle>
                        {isSyncing && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    </div>
                    <SheetDescription>
                        Transactions waiting to be saved to the database.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-0">
                    {queue.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                            <p>All caught up!</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Transaction</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {queue.map((tx) => (
                                    <TableRow key={tx.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{tx['Transaction Name'] || tx.merchant}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {tx['Transaction Date'] || tx.date} • {tx['Amount'] || tx.amount}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={tx.status === 'error' ? 'destructive' : 'secondary'}
                                                className={cn("flex w-fit items-center gap-1", tx.status === 'pending' && "animate-pulse")}
                                            >
                                                {tx.status === 'error' && <AlertCircle className="h-3 w-3" />}
                                                {tx.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {tx.status === 'error' && (
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600" onClick={() => onRetry(tx.id)}>
                                                        <RefreshCw className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => onRemove(tx.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
