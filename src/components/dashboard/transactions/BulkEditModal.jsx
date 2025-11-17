import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

export default function BulkEditModal({ isOpen, onClose, onBulkEdit, transactions }) {
    const [field, setField] = useState('');
    const [value, setValue] = useState('');

    const handleApply = () => {
        onBulkEdit(field, value);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Bulk Edit Transactions</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Select onValueChange={setField}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select field to edit" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="MCC Code">MCC Code</SelectItem>
                            <SelectItem value="Applicable Rule">Applicable Rule</SelectItem>
                            <SelectItem value="Card Summary Category">Card Summary Category</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input 
                        placeholder="Enter new value"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleApply}>Apply to All</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}