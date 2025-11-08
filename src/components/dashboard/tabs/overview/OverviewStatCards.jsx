// src/components/dashboard/tabs/overview/StatCards.jsx
import React from 'react';
import StatCard from "../../../shared/StatCard";
import { Wallet, DollarSign, TrendingUp } from "lucide-react";

export default function StatCards({ stats, currencyFn }) {
    if (!stats) {
        return (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                <StatCard title="Total Spend" value="..." icon={<Wallet className="h-4 w-4 text-muted-foreground" />} />
                <StatCard title="Est. Cashback" value="..." icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} />
                <StatCard title="Effective Rate" value="..." icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} />
            </div>
        );
    }
    return (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <StatCard
                title="Total Spend"
                value={currencyFn(stats.totalSpend)}
                numericValue={stats.totalSpend}
                icon={<Wallet className="h-4 w-4 text-muted-foreground" />}
                currentMonthLabel={stats.label}
                lastMonthValue={stats.prevMonthSpend}
                sparklineData={stats.spendSparkline}
                invertTrendColor={true}
                currencyFn={currencyFn}
            />
            <StatCard
                title="Est. Cashback"
                value={currencyFn(stats.totalCashback)}
                numericValue={stats.totalCashback}
                icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
                currentMonthLabel={stats.label}
                lastMonthValue={stats.prevMonthCashback}
                sparklineData={stats.cashbackSparkline}
                currencyFn={currencyFn}
            />
            <StatCard
                title="Effective Rate"
                value={`${(stats.effectiveRate * 100).toFixed(2)}%`}
                numericValue={stats.effectiveRate}
                icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
                currentMonthLabel={stats.label}
                lastMonthValue={stats.prevMonthRate}
                sparklineData={stats.rateSparkline}
            />
        </div>
    );
}
