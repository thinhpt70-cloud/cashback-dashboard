// src/components/dashboard/tabs/overview/OverviewSnapshotCard.jsx
import React from 'react';
import { Card, CardContent } from '../../../ui/card'; // Adjusted path
import { Wallet, DollarSign, TrendingUp } from 'lucide-react';
import { currency } from '../../../../lib/formatters'; // Adjust path if needed
import { cn } from '../../../../lib/utils'; // Adjust path if needed

function MetricItem({ icon: Icon, label, value, valueClassName, isPrimary = false }) {
    return (
        <div className={cn("flex flex-col", isPrimary ? "gap-1" : "gap-0.5")}>
            <div className="flex items-center text-xs text-muted-foreground">
                {Icon && <Icon className="h-3.5 w-3.5 mr-1.5" />}
                <span>{label}</span>
            </div>
            <p className={cn(
                "font-semibold leading-tight tracking-tight",
                isPrimary ? "text-2xl text-foreground" : "text-base text-foreground",
                valueClassName
            )}>
                {value}
            </p>
        </div>
    );
}


export default function OverviewSnapshotCard({ totalSpend, totalCashback, effectiveRate }) {
    const rateText = `${(effectiveRate * 100).toFixed(2)}%`;
    const rateColor = effectiveRate >= 0.02 ? 'text-emerald-600' : 'text-slate-600';

    return (
        <Card className="w-full shadow-lg border border-slate-200">
            <CardContent className="p-4 space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Month Snapshot</h3>
                <div className="grid grid-cols-2 gap-4">
                     <MetricItem
                        icon={Wallet}
                        label="Total Spend"
                        value={currency(totalSpend)}
                        isPrimary={true}
                    />
                    <MetricItem
                        icon={DollarSign}
                        label="Est. Cashback"
                        value={currency(totalCashback)}
                        isPrimary={true}
                        valueClassName="text-emerald-600"
                    />
                   
                </div>
                 <div className="pt-3 border-t">
                     <MetricItem
                        icon={TrendingUp}
                        label="Effective Rate"
                        value={rateText}
                        valueClassName={rateColor}
                    />
                 </div>
            </CardContent>
        </Card>
    );
}