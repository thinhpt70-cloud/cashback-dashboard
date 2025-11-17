import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Trash2, Pencil } from 'lucide-react';

export default function BulkActionBar({ selectedCount, onBulkApprove, onBulkDelete, onBulkEdit }) {
    if (selectedCount === 0) {
        return null;
    }

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-auto bg-background border dark:bg-slate-800 dark:border-slate-700 shadow-lg rounded-full z-50 p-2">
            <div className="flex items-center gap-2">
                <span className="text-sm font-semibold pl-2 pr-1">{selectedCount} selected</span>
                <Button size="sm" variant="outline" onClick={onBulkEdit} className="rounded-full">
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                </Button>
                <Button size="sm" variant="outline" onClick={onBulkApprove} className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 rounded-full">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve
                </Button>
                <Button size="sm" variant="destructive" onClick={onBulkDelete} className="rounded-full">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                </Button>
            </div>
        </div>
    );
}