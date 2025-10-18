import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../ui/dialog';
import ResultItem from './ResultItem';

export default function MccSearchResultsDialog({ open, onOpenChange, results, onSelect }) {
    // 1. We use useMemo to automatically group results into "History" and "General"
    const { historyResults, generalResults } = useMemo(() => {
        const history = results.filter(r => r[0] === 'Your History');
        const general = results.filter(r => r[0] !== 'Your History');
        return { historyResults: history, generalResults: general };
    }, [results]);

    const handleSelect = (result) => {
        onSelect(result);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl bg-background">
                <DialogHeader>
                    <DialogTitle>MCC Search Results</DialogTitle>
                    <DialogDescription>
                        Select the most relevant merchant category code
                    </DialogDescription>
                </DialogHeader>
                {/* 2. The main container is now a flexible div, not a table */}
                <div className="max-h-[60vh] overflow-y-auto space-y-6 p-1">
                    {/* 3. Render the "History" section only if there are history results */}
                    {historyResults.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm text-muted-foreground px-3">From Your History</h4>
                            <div className="space-y-1">
                                {historyResults.map((result, index) => (
                                    <ResultItem key={`hist-${index}`} result={result} onSelect={handleSelect} isHistory={true} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 4. Render the "General" section only if there are general results */}
                    {generalResults.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm text-muted-foreground px-3">External Suggestions</h4>
                            <div className="space-y-1">
                                {generalResults.map((result, index) => (
                                    <ResultItem key={`gen-${index}`} result={result} onSelect={handleSelect} isHistory={false} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}