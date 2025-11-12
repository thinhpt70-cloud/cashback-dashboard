// src/components/dashboard/tabs/OverviewTab.jsx

import React from 'react';

// Import overview tab components
import CardSpendsCap from "./overview/CardSpendsCap";
import EnhancedSuggestions from "./overview/EnhancedSuggestions";
import SpendByCardChart from "./overview/SpendByCardChart";
import CardPerformanceLineChart from "./overview/CardPerformanceLineChart";
import RecentTransactions from './overview/RecentTransactions';
import SpendVsCashbackTrendChart from "./overview/SpendVsCashbackTrendChart";
import StatCards from './overview/OverviewStatCards';
import CashbackByCardChart from "./overview/CashbackByCardChart";


export default function OverviewTab({
  displayStats,
  currency,
  cards,
  rules,
  activeMonth,
  monthlySummary,
  monthlyCategorySummary,
  getCurrentCashbackMonthForCard,
  recentTransactions,
  cardMap,
  monthlyChartData,
  cardPerformanceData,
  cardColorMap,
  overviewChartStats
}) {
  return (
    <div className="space-y-4 pt-4">
      {/* --- 1. UNIFIED DYNAMIC COMPONENTS --- */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* LEFT COLUMN */}
        <div className="lg:w-7/12 flex flex-col gap-4">
          <StatCards stats={displayStats} currencyFn={currency} />

          <CardSpendsCap
            cards={cards}
            rules={rules}
            activeMonth={activeMonth}
            monthlySummary={monthlySummary}
            monthlyCategorySummary={monthlyCategorySummary}
            currencyFn={currency}
            getCurrentCashbackMonthForCard={getCurrentCashbackMonthForCard}
          />
        </div>

        {/* --- RIGHT COLUMN (REVISED LAYOUT) --- */}
        <div className="lg:w-5/12 flex flex-col gap-4">
          {/* EnhancedSuggestions is first, with a max-height on desktop */}
          <EnhancedSuggestions
            rules={rules}
            cards={cards}
            monthlyCategorySummary={monthlyCategorySummary}
            monthlySummary={monthlySummary}
            activeMonth={activeMonth}
            currencyFn={currency}
            getCurrentCashbackMonthForCard={getCurrentCashbackMonthForCard}
            className="lg:max-h-[800px]"
          />

          {/* RecentTransactions is second, and will fill remaining space */}
          <RecentTransactions
            transactions={recentTransactions}
            cardMap={cardMap}
            currencyFn={currency}
          />
        </div>
      </div>

      {/* --- 3. UNIFIED CONTEXTUAL COMPONENTS --- */}

      <div className="grid gap-4">
        <SpendVsCashbackTrendChart data={monthlyChartData} />
      </div>

      <div className="mt-4">
        <CardPerformanceLineChart
          data={cardPerformanceData}
          cards={cards}
          currencyFn={currency}
          cardColorMap={cardColorMap}
        />
      </div>

      {/* --- 4. CONDITIONAL HISTORICAL CHARTS --- */}
      {/* These charts only render for historical months */}
      {activeMonth !== 'live' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SpendByCardChart
            spendData={overviewChartStats.spendByCard}
            currencyFn={currency}
            cardColorMap={cardColorMap}
          />
          <CashbackByCardChart
            cashbackData={overviewChartStats.cashbackByCard}
            currencyFn={currency}
            cardColorMap={cardColorMap}
          />
        </div>
      )}
    </div>
  );
}