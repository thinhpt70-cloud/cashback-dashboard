import React, { useState, useMemo } from "react";
import { CreditCard, Wallet, DollarSign, TrendingUp, AlertTriangle, Snowflake } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "../../ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../ui/accordion";
import { Badge } from "../../ui/badge";
import { Progress } from "../../ui/progress";
import { cn } from "../../../lib/utils";
import { cardThemes } from "../../../lib/constants";
import { getCurrentCashbackMonthForCard, calculateFeeCycleProgress } from "../../../lib/date";
import StatCard from "../../shared/StatCard";
import CardInfoSheet from "../dialogs/CardInfoSheet";

export default function CardsTab({
  cards,
  allCards,
  monthlySummary,
  activeMonth,
  rules,
  currencyFn,
  fmtYMShortFn,
  mccMap,
  isDesktop
}) {
  const [cardView, setCardView] = useState('month'); // 'month', 'ytd', or 'roi'

  // Sort cards
  const sortedCards = useMemo(() => {
    const statusOrder = {
      'Active': 1,
      'Frozen': 2,
      'Closed': 3,
    };
    return [...allCards].sort((a, b) => { // Use allCards here to include Closed ones
      const statusDiff = (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
      if (statusDiff !== 0) {
        return statusDiff;
      }
      return a.name.localeCompare(b.name);
    });
  }, [allCards]);

  // Calculate stats for the "My Cards" tab
  const cardsTabStats = useMemo(() => {
    const totalYtdSpending = allCards.reduce((acc, card) => acc + (card.totalSpendingYtd || 0), 0);
    const totalYtdCashback = allCards.reduce((acc, card) => acc + (card.estYtdCashback || 0), 0);
    const totalAnnualFee = allCards.reduce((acc, card) => acc + (card.annualFee || 0), 0);
    const overallEffectiveRate = totalYtdSpending > 0 ? (totalYtdCashback / totalYtdSpending) * 100 : 0;
    const numberOfCards = allCards.length;

    return {
      totalYtdSpending,
      totalYtdCashback,
      totalAnnualFee,
      overallEffectiveRate,
      numberOfCards
    };
  }, [allCards]);

  const isLiveView = activeMonth === 'live';
  const activeAndFrozenCards = sortedCards.filter(c => c.status !== 'Closed');
  const closedCards = sortedCards.filter(c => c.status === 'Closed');

  const renderCard = (card) => {
    const monthForCard = isLiveView ? getCurrentCashbackMonthForCard(card) : activeMonth;
    const summaryForCard = monthlySummary.find(s => s.cardId === card.id && s.month === monthForCard);

    return (
      <EnhancedCard
        key={card.id}
        card={card}
        activeMonth={monthForCard}
        cardMonthSummary={summaryForCard}
        rules={rules.filter(r => r.cardId === card.id)}
        currencyFn={currencyFn}
        fmtYMShortFn={fmtYMShortFn}
        calculateFeeCycleProgressFn={calculateFeeCycleProgress}
        view={cardView}
        mccMap={mccMap}
        isDesktop={isDesktop}
      />
    );
  };

  return (
    <div className="space-y-4 pt-4">
      <CardsOverviewMetrics stats={cardsTabStats} currencyFn={currencyFn} />
      <Tabs defaultValue="month" value={cardView} onValueChange={(value) => setCardView(value)}>
        <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 p-1 text-muted-foreground">
          <TabsTrigger value="month" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
            This Month
          </TabsTrigger>
          <TabsTrigger value="ytd" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
            Year to Date
          </TabsTrigger>
          <TabsTrigger value="roi" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
            ROI & Fees
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {activeAndFrozenCards.map(renderCard)}
      </div>

      {closedCards.length > 0 && (
        <Accordion type="single" collapsible className="w-full pt-4">
          <AccordionItem value="closed-cards">
            <AccordionTrigger className="text-base font-semibold text-muted-foreground">
              Show Closed Cards ({closedCards.length})
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pt-4">
                {closedCards.map(renderCard)}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}

function CardsOverviewMetrics({ stats, currencyFn }) {
  if (!stats) {
    return null;
  }

  const isFeeCovered = stats.totalYtdCashback >= stats.totalAnnualFee;
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
      <StatCard
        title="Total Spending"
        value={currencyFn(stats.totalYtdSpending)}
        icon={<Wallet className="h-4 w-4 text-muted-foreground" />}
      />
      <StatCard
        title="Total Cashback"
        value={currencyFn(stats.totalYtdCashback)}
        icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
      />
      <StatCard
        title="% Rate"
        value={`${stats.overallEffectiveRate.toFixed(2)}%`}
        icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
      />
      <StatCard
        title="Est. Annual Fee"
        value={currencyFn(stats.totalAnnualFee)}
        icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}
        valueClassName={isFeeCovered ? 'text-emerald-600' : 'text-orange-500'}
      />
      <StatCard
        title="No. of Cards"
        value={stats.numberOfCards}
        icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
      />
    </div>
  );
}

function MetricItem({ label, value, valueClassName, icon: Icon, isPrimary = false }) {
  return (
    <div className="p-2 bg-slate-50/70 dark:bg-slate-800/50 rounded-lg">
      <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mb-0.5">
        {Icon && <Icon className="h-3.5 w-3.5 mr-1.5" />}
        <span>{label}</span>
      </div>
      <p className={cn(
        "font-bold transition-all duration-300",
        isPrimary ? "text-xl text-slate-800 dark:text-slate-200" : "text-base text-slate-700 dark:text-slate-300",
        valueClassName
      )}>
        {value}
      </p>
    </div>
  );
}

function EnhancedCard({ card, activeMonth, cardMonthSummary, rules, currencyFn, fmtYMShortFn, calculateFeeCycleProgressFn, view, mccMap, isDesktop }) {
  const totalSpendMonth = cardMonthSummary?.spend || 0;
  const estCashbackMonth = cardMonthSummary?.cashback || 0;
  const monthlyEffectiveRate = totalSpendMonth > 0 ? (estCashbackMonth / totalSpendMonth) * 100 : 0;
  const ytdEffectiveRate = card.totalSpendingYtd > 0 ? (card.estYtdCashback / card.totalSpendingYtd) * 100 : 0;
  const totalValue = (card.estYtdCashback || 0) - (card.annualFee || 0);
  const { daysPast, progressPercent } = calculateFeeCycleProgressFn(card.cardOpenDate, card.nextAnnualFeeDate);
  const theme = cardThemes[card.bank] || cardThemes['default'];

  const getStatusClasses = (status) => {
    switch (status) {
      case 'Active': return 'bg-emerald-100 text-emerald-800';
      case 'Frozen': return 'bg-sky-100 text-sky-800';
      case 'Closed': return 'bg-slate-200 text-slate-600';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const formattedOpenDate = card.cardOpenDate ? new Date(card.cardOpenDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
  const formattedNextFeeDate = card.nextAnnualFeeDate ? new Date(card.nextAnnualFeeDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

  return (
    <div className={cn(
      "bg-card text-card-foreground rounded-xl shadow-md overflow-hidden transition-all duration-300 flex flex-col relative",
      card.status === 'Closed' && 'filter grayscale',
      card.status === 'Frozen' && 'opacity-75'
    )}>
      <div className={cn(
        "relative rounded-t-xl p-4 flex-shrink-0 overflow-hidden",
        theme.gradient,
        theme.textColor
      )}>
        {card.status === 'Frozen' && (
          <Snowflake
            className="absolute -right-4 -top-4 h-24 w-24 text-white/20"
            strokeWidth={1.5}
          />
        )}
        <div className="relative z-10">
          <div className="flex justify-between items-center">
            <p className="font-bold text-base">{card.bank}</p>
            <Badge variant="outline" className={cn('capitalize rounded-md h-6 text-xs', getStatusClasses(card.status))}>
              {card.status}
            </Badge>
          </div>
          <div className="flex justify-between items-end mt-2 gap-4">
            <p className="font-mono text-base tracking-wider flex-shrink-0">•••• {card.last4}</p>
            <p className="font-semibold text-base truncate text-right min-w-0">{card.name}</p>
          </div>
        </div>
      </div>

      <div className="p-4 flex-grow flex flex-col">
        <div className="text-xs text-slate-500 dark:text-slate-400 grid grid-cols-2 gap-x-4">
          <p>Statement: <span className="font-medium text-slate-600 dark:text-slate-300">Day {card.statementDay}</span></p>
          <p>Payment Due: <span className="font-medium text-slate-600 dark:text-slate-300">Day {card.paymentDueDay}</span></p>
        </div>

        <div className="flex-grow flex flex-col justify-center mt-4">
          {view === 'month' && (
            <div className="grid grid-cols-2 gap-3">
              <MetricItem
                label={`${fmtYMShortFn(activeMonth)}'s Rate`}
                value={`${monthlyEffectiveRate.toFixed(2)}%`}
                valueClassName={monthlyEffectiveRate >= 2 ? 'text-emerald-600' : 'text-slate-800'}
              />
              {progressPercent > 0 && (
                <MetricItem
                  label={`Card Progress`}
                  value={`${progressPercent}%`}
                />
              )}
              <MetricItem label="Spend" value={currencyFn(totalSpendMonth)} />
              <MetricItem label="Cashback" value={currencyFn(estCashbackMonth)} />
            </div>
          )}

          {view === 'ytd' && (
            <div className="grid grid-cols-2 gap-3">
              <MetricItem
                label="YTD Effective Rate"
                value={`${ytdEffectiveRate.toFixed(2)}%`}
                isPrimary={true}
                valueClassName={ytdEffectiveRate >= 2 ? 'text-emerald-600' : 'text-slate-800'}
              />
              <div className="space-y-1.5">
                <MetricItem label="Total Spend" value={currencyFn(card.totalSpendingYtd)} />
                <MetricItem label="Total Cashback" value={currencyFn(card.estYtdCashback)} />
              </div>
            </div>
          )}

          {view === 'roi' && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-3">
                <MetricItem label="Annual Fee" value={currencyFn(card.annualFee)} />
                <MetricItem
                  label="Net Value"
                  value={currencyFn(totalValue)}
                  valueClassName={totalValue >= 0 ? 'text-emerald-600' : 'text-red-500'}
                />
              </div>
              {progressPercent > 0 && (
                <div>
                  <div className="flex justify-between text-xs mb-1 text-slate-500">
                    <span>Fee Cycle Progress ({daysPast} days past)</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <Progress value={progressPercent} />
                </div>
              )}
              <div className="text-xs text-slate-500 grid grid-cols-2 gap-x-4">
                <p>Opened: <span className="font-medium text-slate-600">{formattedOpenDate}</span></p>
                <p>Next Fee: <span className="font-medium text-slate-600">{formattedNextFeeDate}</span></p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-auto pt-4 flex justify-end">
          <CardInfoSheet
            card={card}
            rules={rules}
            mccMap={mccMap}
            isDesktop={isDesktop}
          />
        </div>
      </div>
    </div>
  );
}
