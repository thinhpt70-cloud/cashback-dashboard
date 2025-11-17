import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from 'src/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'src/components/ui/table';
import { Badge } from 'src/components/ui/badge';
import { Button } from 'src/components/ui/button';

export default function NeedsSyncingDialog({ isOpen, onClose, needsSyncing, onRetry, onRemove }) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Transactions Awaiting Sync</DialogTitle>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Transaction</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {needsSyncing.map((tx) => (
                                <TableRow key={tx.id}>
                                    <TableCell>{tx['Transaction Name']}</TableCell>
                                    <TableCell>{tx['Amount']}</TableCell>
                                    <TableCell>{tx['Transaction Date']}</TableCell>
                                    <TableCell>
                                        <Badge variant={tx.status === 'error' ? 'destructive' : 'default'}>
                                            {tx.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={() => onRetry(tx.id)} disabled={tx.status === 'pending'}>
                                                Retry
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => onRemove(tx.id)}>
                                                Remove
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    );
}
