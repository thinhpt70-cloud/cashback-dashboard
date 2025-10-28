import React, { useRef, useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card'; // Adjusted path
import { Button } from '../../../ui/button'; // Adjusted path
import { Badge } from '../../../ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function RecentTransactionsCarousel({ transactions, cardMap, currencyFn }) {
    const scrollContainerRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScrollability = () => {
        const container = scrollContainerRef.current;
        if (container) {
            setCanScrollLeft(container.scrollLeft > 0);
            setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth);
        }
    };

    useEffect(() => {
        // A slight delay to ensure the container has rendered and can be measured
        setTimeout(checkScrollability, 100); 

        const container = scrollContainerRef.current;
        container?.addEventListener('scroll', checkScrollability);
        window.addEventListener('resize', checkScrollability);
        return () => {
            container?.removeEventListener('scroll', checkScrollability);
            window.removeEventListener('resize', checkScrollability);
        };
    }, [transactions]);

    const handleScroll = (direction) => {
        const container = scrollContainerRef.current;
        if (container) {
            const scrollAmount = container.clientWidth * 0.8;
            container.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
        }
    };

    if (!transactions || transactions.length === 0) return null;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent className="relative px-12">
                {canScrollLeft && (
                    <Button variant="outline" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full" onClick={() => handleScroll('left')}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                )}
                <div 
                    ref={scrollContainerRef} 
                    className="flex gap-4 overflow-x-auto pb-4 scroll-smooth"
                    // THIS IS THE CORRECTED STYLE OBJECT
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {transactions.map(tx => {
                        const card = tx['Card'] ? cardMap.get(tx['Card'][0]) : null;
                        return (
                            <div key={tx.id} className="flex-shrink-0 w-64 border rounded-lg p-3 space-y-2">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold truncate" title={tx['Transaction Name']}>{tx['Transaction Name']}</p>
                                        <p className="text-xs text-gray-500">{tx['Transaction Date']}</p>
                                    </div>
                                    {card && <Badge variant="outline" className="text-xs h-5 shrink-0">{card.name}</Badge>}
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-lg">{currencyFn(tx['Amount'])}</p>
                                    <p className="text-sm text-emerald-600 font-medium">+ {currencyFn(tx.estCashback)}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
                {canScrollRight && (
                    <Button variant="outline" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full" onClick={() => handleScroll('right')}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}