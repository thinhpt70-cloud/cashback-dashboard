import React from 'react';
import { Button } from '../../ui/button';

export default function QuickAddButtons({ vendors, onSelect }) {
    if (!vendors || vendors.length === 0) {
        return null;
    }

    return (
        <div className="mb-4 space-y-2">
            <label className="text-sm font-medium">Quick Add</label>
            <div className="flex flex-wrap gap-2">
                {vendors.map(vendor => (
                    <Button
                        key={vendor.id}
                        variant="outline"
                        size="sm"
                        onClick={() => onSelect(vendor)}
                        className="h-8"
                    >
                        {vendor.name}
                    </Button>
                ))}
            </div>
        </div>
    );

}