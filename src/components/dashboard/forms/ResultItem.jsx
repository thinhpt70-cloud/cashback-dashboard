import React from 'react';
import { Badge } from '../../ui/badge';
import { Globe, History } from 'lucide-react';

export default function ResultItem({ result, onSelect, isHistory }) {
    // Safely extract data based on its source (History vs General)
    const merchantName = result[1];
    const mcc = result[2];
    const vietnameseCategory = result[4];
    // English category only exists for history items
    const englishCategory = isHistory ? result[3] : null;

    return (
        <div
            onClick={() => onSelect(result)}
            className="flex items-center gap-4 rounded-lg p-3 cursor-pointer transition-colors hover:bg-muted"
        >
            {/* Left Side: Icon */}
            <div className="text-muted-foreground">
                {isHistory ? <History className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
            </div>

            {/* Center: Text Content */}
            <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{merchantName}</p>
                <p className="text-sm text-muted-foreground truncate">
                    {vietnameseCategory}
                    {englishCategory && ` (${englishCategory})`}
                </p>
            </div>

            {/* Right Side: MCC Tag */}
            <Badge variant="outline" className="font-mono text-sm py-1 px-2">
                {mcc}
            </Badge>
        </div>
    );
}