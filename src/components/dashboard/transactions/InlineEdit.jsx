import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

export default function InlineEdit({ value, onSave }) {
    const [isEditing, setEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);

    const handleSave = () => {
        onSave(currentValue);
        setEditing(false);
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-2">
                <Input value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} />
                <Button size="icon" onClick={handleSave}><Check className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => setEditing(false)}><X className="h-4 w-4" /></Button>
            </div>
        );
    }

    return (
        <div onClick={() => setEditing(true)} className="hover:bg-slate-100 p-2 rounded-md cursor-pointer">
            {value}
        </div>
    );
}