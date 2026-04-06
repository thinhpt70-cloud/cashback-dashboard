import React, { useState, useEffect, useMemo } from 'react';
import { Settings } from 'lucide-react';
import { getTimezone, setTimezone } from '../../../lib/timezone';

export default function SettingsTab() {
    const [selectedTimezone, setSelectedTimezone] = useState('');

    useEffect(() => {
        setSelectedTimezone(getTimezone());
    }, []);

    const timezones = useMemo(() => {
        if (typeof Intl !== 'undefined' && typeof Intl.supportedValuesOf === 'function') {
            return Intl.supportedValuesOf('timeZone');
        }
        // Fallback for older environments
        return ['Asia/Ho_Chi_Minh', 'UTC'];
    }, []);

    const handleTimezoneChange = (e) => {
        const newTz = e.target.value;
        setSelectedTimezone(newTz);
        setTimezone(newTz);
        // Force a reload to apply the new timezone across the app instantly
        window.location.reload();
    };

    return (
        <div className="space-y-6 max-w-2xl">
            <div className="flex flex-col space-y-1.5">
                <h3 className="text-2xl font-semibold leading-none tracking-tight">Settings</h3>
                <p className="text-sm text-muted-foreground">Manage your dashboard preferences and application settings.</p>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow">
                <div className="p-6">
                    <h3 className="font-semibold leading-none tracking-tight mb-4 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-muted-foreground" />
                        Localization
                    </h3>

                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="timezone-select">
                                Timezone
                            </label>
                            <p className="text-[0.8rem] text-muted-foreground">
                                Select the timezone used for displaying transaction dates and dashboard metrics. The page will reload after changing this setting.
                            </p>
                            <select
                                id="timezone-select"
                                value={selectedTimezone}
                                onChange={handleTimezoneChange}
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {timezones.map((tz) => (
                                    <option key={tz} value={tz}>
                                        {tz}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SheetTrigger } from '@/components/ui/sheet';
import { useTheme } from '@/components/ui/theme-provider';

const MobileThemeToggle = () => {
  const { setTheme } = useTheme();

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="theme-toggle" className="border-none">
        <AccordionTrigger className="w-full justify-start h-10 p-2 hover:no-underline">
          <Button variant="ghost" className="w-full justify-start h-10">
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 mr-3" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 mr-3" />
            <span>Toggle Theme</span>
          </Button>
        </AccordionTrigger>
        <AccordionContent className="flex flex-col gap-2">
          <SheetTrigger asChild>
            <Button variant="ghost" className="w-full justify-start h-10" onClick={() => setTheme('light')}>
              <Sun className="h-5 w-5 mr-3" />
              <span>Light</span>
            </Button>
          </SheetTrigger>
          <SheetTrigger asChild>
            <Button variant="ghost" className="w-full justify-start h-10" onClick={() => setTheme('dark')}>
              <Moon className="h-5 w-5 mr-3" />
              <span>Dark</span>
            </Button>
          </SheetTrigger>
          <SheetTrigger asChild>
            <Button variant="ghost" className="w-full justify-start h-10" onClick={() => setTheme('system')}>
              <Monitor className="h-5 w-5 mr-3" />
              <span>System</span>
            </Button>
          </SheetTrigger>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default MobileThemeToggle;
import React from 'react';
import { Menu, Plus, Search, RefreshCw, LogOut, Loader2 } from "lucide-react";
import { Button } from "../../ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../../ui/sheet";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "../../ui/drawer";
import MobileThemeToggle from "./MobileThemeToggle";
import AddTransactionForm from "../forms/AddTransactionForm";
import { cn } from "../../../lib/utils";
import { fmtYMShort } from '../../../lib/formatters';

export default function DashboardHeader({
    activeView, setActiveView, isFinderOpen, setIsFinderOpen, handleLogout, refreshData,
    needsSyncing, isSyncing, isSyncingSheetOpen, setIsSyncingSheetOpen,
    activeMonth, setActiveMonth, availableMonths,
    isAddTxDialogOpen, setIsAddTxDialogOpen,
    duplicateTransaction, editingTransaction, setEditingTransaction,
    addToQueue, handleTransactionAdded, handleTransactionUpdated,
    isDesktop, addTxSheetSide,
    cards, allCategories, definitions, cashbackRules, monthlyCashbackCategories,
    mccMap, commonVendors, monthlySummary, monthlyCategorySummary,
    getCurrentCashbackMonthForCard, navItems
}) {
    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 shadow-sm sm:px-6 md:px-6">
            <div className="md:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-56 p-2 flex flex-col">
                        <div>
                            <div className="flex items-center justify-center h-16 border-b mb-2">
                                <img src="/favicon.svg" alt="Cardifier" className="h-8 w-8" />
                            </div>
                            <nav className="space-y-2">
                            {navItems.map((item) => (
                                <SheetTrigger asChild key={item.view}>
                                    <Button
                                        variant={activeView === item.view ? 'default' : 'ghost'}
                                        className="w-full justify-start h-10"
                                        onClick={() => setActiveView(item.view)}
                                    >
                                        <item.icon className="h-5 w-5 mr-3" />
                                        <span>{item.label}</span>
                                    </Button>
                                </SheetTrigger>
                            ))}
                        </nav>
                        <div className="mt-auto flex flex-col gap-2 pt-2 border-t">
                            <SheetTrigger asChild>
                                <Button variant="ghost" className="w-full justify-start h-10" onClick={() => setIsFinderOpen(true)}>
                                    <Search className="h-5 w-5 mr-3" />
                                    <span>Card Finder</span>
                                </Button>
                            </SheetTrigger>
                            <SheetTrigger asChild>
                                <Button variant="ghost" className="w-full justify-start h-10" onClick={() => refreshData(false)}>
                                    <RefreshCw className="h-5 w-5 mr-3" />
                                    <span>Refresh</span>
                                </Button>
                            </SheetTrigger>
                            <MobileThemeToggle />
                            <SheetTrigger asChild>
                                <Button variant="ghost" className="w-full justify-start h-10" onClick={handleLogout}>
                                    <LogOut className="h-5 w-5 mr-3" />
                                    <span>Logout</span>
                                </Button>
                            </SheetTrigger>
                        </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
            <h1 className="text-xl font-semibold md:hidden">Cardifer</h1>
            <h1 className="text-xl font-semibold hidden md:flex items-center gap-2 shrink-0 dark:text-white">
                <span className="hidden md:inline">Cardifier | Cashback Optimizer</span>
            </h1>

            {/* Right-aligned container for all controls */}
            <div className="ml-auto flex items-center gap-2">
                {/* Status Indicator for Sync */}
                {needsSyncing.length > 0 && (
                     <Button
                         variant="ghost"
                         size="sm"
                         className="h-8 gap-1.5 px-2 text-muted-foreground hover:text-foreground"
                         onClick={() => setIsSyncingSheetOpen(true)}
                     >
                        {isSyncing ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span className="hidden sm:inline text-xs">Syncing...</span>
                            </>
                        ) : (
                            <>
                                <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                                <span className="hidden sm:inline text-xs">Saved Offline</span>
                            </>
                        )}
                     </Button>
                )}

                {/* Month Selector - visible on all screen sizes */}
                {availableMonths && availableMonths.length > 0 && (
                    <select
                        value={activeMonth}
                        onChange={(e) => setActiveMonth(e.target.value)}
                        className="h-10 text-sm rounded-md border border-input bg-transparent px-3 py-1 shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                        <option value="live">Live View</option>
                        {availableMonths.map(m => (
                            <option key={m} value={m}>{fmtYMShort(m)}</option>
                        ))}
                    </select>
                )}

                {/* --- Desktop Controls (hidden on mobile) --- */}
                <div className="hidden md:flex items-center gap-2">
                    <Sheet open={isAddTxDialogOpen && isDesktop} onOpenChange={setIsAddTxDialogOpen}>
                        <SheetTrigger asChild>
                            <Button variant="default" className="h-10">
                                <Plus className="mr-2 h-4 w-4" />
                                New Transaction
                            </Button>
                        </SheetTrigger>
                        <SheetContent
                            side={addTxSheetSide}
                            className={cn(
                                "flex flex-col p-0",
                                "w-full sm:max-w-2xl",
                                !isDesktop && "h-[90vh]"
                            )}
                        >
                            <SheetHeader className="px-6 pt-6">
                                <SheetTitle>Add a New Transaction</SheetTitle>
                            </SheetHeader>
                            <div className="flex-grow overflow-y-auto px-6 pb-6">
                                <AddTransactionForm
                                    cards={cards}
                                    categories={allCategories}
                                    definitions={definitions}
                                    rules={cashbackRules}
                                    monthlyCategories={monthlyCashbackCategories}
                                    mccMap={mccMap}
                                    onTransactionAdded={handleTransactionAdded}
                                    commonVendors={commonVendors}
                                    monthlySummary={monthlySummary}
                                    monthlyCategorySummary={monthlyCategorySummary}
                                    getCurrentCashbackMonthForCard={getCurrentCashbackMonthForCard}
                                    addToQueue={addToQueue}
                                    prefillData={duplicateTransaction}
                                />
                            </div>
                        </SheetContent>
                    </Sheet>
                    <Sheet open={!!editingTransaction} onOpenChange={(isOpen) => !isOpen && setEditingTransaction(null)}>
                        <SheetContent
                            side={addTxSheetSide}
                            className={cn("flex flex-col p-0", "w-full sm:max-w-2xl", !isDesktop && "h-[90vh]")}
                        >
                            <SheetHeader className="px-6 pt-6">
                                <SheetTitle>Edit Transaction</SheetTitle>
                            </SheetHeader>
                            <div className="flex-grow overflow-y-auto px-6 pb-6">
                                <AddTransactionForm
                                    cards={cards}
                                    categories={allCategories}
                                    definitions={definitions}
                                    rules={cashbackRules}
                                    monthlyCategories={monthlyCashbackCategories}
                                    mccMap={mccMap}
                                    commonVendors={commonVendors}
                                    monthlySummary={monthlySummary}
                                    monthlyCategorySummary={monthlyCategorySummary}
                                    getCurrentCashbackMonthForCard={getCurrentCashbackMonthForCard}
                                    initialData={editingTransaction}
                                    onTransactionUpdated={handleTransactionUpdated}
                                    onClose={() => setEditingTransaction(null)}
                                    addToQueue={addToQueue}
                                />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

                {/* --- Mobile Controls (hidden on desktop) --- */}
                <div className="flex items-center gap-2 md:hidden">
                    <Drawer open={isAddTxDialogOpen && !isDesktop} onOpenChange={setIsAddTxDialogOpen}>
                        <DrawerTrigger asChild>
                            <Button variant="default" size="icon" className="h-10 w-10 rounded-full shadow-lg">
                                <Plus className="h-6 w-6" />
                            </Button>
                        </DrawerTrigger>
                        <DrawerContent className="h-[90vh]">
                            <DrawerHeader>
                                <DrawerTitle>Add Transaction</DrawerTitle>
                            </DrawerHeader>
                            <div className="px-4 pb-4 overflow-y-auto">
                                <AddTransactionForm
                                    cards={cards}
                                    categories={allCategories}
                                    definitions={definitions}
                                    rules={cashbackRules}
                                    monthlyCategories={monthlyCashbackCategories}
                                    mccMap={mccMap}
                                    onTransactionAdded={handleTransactionAdded}
                                    commonVendors={commonVendors}
                                    monthlySummary={monthlySummary}
                                    monthlyCategorySummary={monthlyCategorySummary}
                                    getCurrentCashbackMonthForCard={getCurrentCashbackMonthForCard}
                                    addToQueue={addToQueue}
                                    prefillData={duplicateTransaction}
                                    onClose={() => setIsAddTxDialogOpen(false)}
                                />
                            </div>
                        </DrawerContent>
                    </Drawer>

                    {/* Mobile Edit Transaction Drawer */}
                    {editingTransaction && !isDesktop && (
                         <Drawer open={!!editingTransaction} onOpenChange={(isOpen) => !isOpen && setEditingTransaction(null)}>
                            <DrawerContent className="h-[90vh]">
                                <DrawerHeader>
                                    <DrawerTitle>Edit Transaction</DrawerTitle>
                                </DrawerHeader>
                                <div className="px-4 pb-4 overflow-y-auto">
                                    <AddTransactionForm
                                        cards={cards}
                                        categories={allCategories}
                                        rules={cashbackRules}
                                        monthlyCategories={monthlyCashbackCategories}
                                        mccMap={mccMap}
                                        commonVendors={commonVendors}
                                        monthlySummary={monthlySummary}
                                        monthlyCategorySummary={monthlyCategorySummary}
                                        getCurrentCashbackMonthForCard={getCurrentCashbackMonthForCard}
                                        initialData={editingTransaction}
                                        onTransactionUpdated={handleTransactionUpdated}
                                        onClose={() => setEditingTransaction(null)}
                                        addToQueue={addToQueue}
                                    />
                                </div>
                            </DrawerContent>
                        </Drawer>
                    )}
                </div>
            </div>
        </header>
    );
}
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/ui/theme-provider";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export function ModeToggle({ isCollapsed }) {
  const { theme, setTheme } = useTheme();

  const handleToggle = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("light");
    } else {
      setTheme("light");
    }
  };

  if (isCollapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-full justify-center h-10"
              onClick={handleToggle}
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Toggle Theme</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start h-10">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 mr-3" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 mr-3" />
          <span>Toggle Theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
import React, { useState, useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, CheckCircle, Calendar, Wallet, FilePenLine, History, DollarSign } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { getZonedDate } from '../../../lib/timezone';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';

export default function PaymentsCalendarView({ paymentData, currencyFn, fmtYMShortFn, onLogPayment, onLogStatement, onViewTransactions }) {
    const [selectedDate, setSelectedDate] = useState();

    // Flatten paymentData to get all statements
    const allStatements = useMemo(() => {
        if (!paymentData) return [];
        return paymentData.flatMap(group => {
            const statements = [];
            if (group.mainStatement) statements.push(group.mainStatement);
            // We could also include past statements if we want a full history view
            // For now, let's focus on main statements (active ones) to avoid clutter
            return statements;
        });
    }, [paymentData]);

    const events = useMemo(() => {
        const map = new Map();
        allStatements.forEach(stmt => {
            // Payment Due Date Event
            if (stmt.paymentDateObj) {
                const dateKey = format(stmt.paymentDateObj, 'yyyy-MM-dd');
                if (!map.has(dateKey)) map.set(dateKey, []);

                const remaining = (stmt.statementAmount || 0) - (stmt.paidAmount || 0);
                const isPaid = remaining <= 0 && (stmt.statementAmount > 0);

                map.get(dateKey).push({
                    type: 'due',
                    statement: stmt,
                    isPaid,
                    amount: remaining > 0 ? remaining : stmt.statementAmount
                });
            }

            // Statement Date Event
            if (stmt.statementDateObj) {
                const dateKey = format(stmt.statementDateObj, 'yyyy-MM-dd');
                if (!map.has(dateKey)) map.set(dateKey, []);
                map.get(dateKey).push({
                    type: 'statement',
                    statement: stmt
                });
            }
        });
        return map;
    }, [allStatements]);

    const handleDayClick = (day) => {
        setSelectedDate(day);
    };

    const modifiers = {
        hasEvent: (date) => events.has(format(date, 'yyyy-MM-dd')),
        hasDue: (date) => {
             const evts = events.get(format(date, 'yyyy-MM-dd'));
             return evts && evts.some(e => e.type === 'due');
        },
        hasStatement: (date) => {
             const evts = events.get(format(date, 'yyyy-MM-dd'));
             return evts && evts.some(e => e.type === 'statement');
        }
    };

    const modifiersStyles = {
        hasEvent: { fontWeight: 'bold' }
    };

    const selectedDayEvents = useMemo(() => {
        if (!selectedDate) return [];
        const dateKey = format(selectedDate, 'yyyy-MM-dd');
        return events.get(dateKey) || [];
    }, [selectedDate, events]);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm w-full">
                <style>{`
                    .rdp-day_selected {
                        background-color: var(--primary) !important;
                        color: var(--primary-foreground) !important;
                    }
                    .rdp-button:hover:not([disabled]) {
                        background-color: var(--accent);
                        color: var(--accent-foreground);
                    }
                    .rdp {
                        margin: 0;
                    }
                `}</style>
                <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    onDayClick={handleDayClick}
                    modifiers={modifiers}
                    modifiersStyles={modifiersStyles}
                    showOutsideDays
                    className="p-3"
                    components={{
                        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
                        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
                        DayContent: ({ date, ...props }) => {
                            const dateKey = format(date, 'yyyy-MM-dd');
                            const dayEvents = events.get(dateKey);

                            const hasDue = dayEvents?.some(e => e.type === 'due');
                            const hasStatement = dayEvents?.some(e => e.type === 'statement');
                            const isPaid = dayEvents?.every(e => e.type !== 'due' || e.isPaid); // All dues paid
                            const isOverdue = hasDue && !isPaid && date < getZonedDate().setHours(0,0,0,0);

                            return (
                                <div className="relative w-full h-full flex items-center justify-center p-2">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{date.getDate()}</span>
                                    <div className="absolute bottom-1 flex gap-0.5">
                                        {hasStatement && (
                                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 ring-1 ring-white dark:ring-slate-950" title="Statement Date" />
                                        )}
                                        {hasDue && (
                                            <div className={cn("h-1.5 w-1.5 rounded-full ring-1 ring-white dark:ring-slate-950",
                                                isPaid ? "bg-emerald-500" : (isOverdue ? "bg-red-500" : "bg-orange-500")
                                            )} title="Payment Due" />
                                        )}
                                    </div>
                                </div>
                            );
                        }
                    }}
                />

                <div className="w-full max-w-md mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                     <div className="grid grid-cols-2 md:flex md:flex-wrap justify-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                            <span>Statement Issued</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-orange-500" />
                            <span>Payment Due</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span>Paid</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-red-500" />
                            <span>Overdue</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Details Section */}
            <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm min-h-[200px]">
                 {!selectedDate ? (
                     <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-8">
                         <Calendar className="h-12 w-12 mb-3 opacity-50" />
                         <p className="text-lg font-medium">Select a date</p>
                         <p className="text-sm">Click on a date in the calendar to view payment details.</p>
                     </div>
                 ) : (
                     <div className="space-y-6">
                         <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                             <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                 {format(selectedDate, 'MMMM do, yyyy')}
                             </h3>
                             <Badge variant="outline" className="text-slate-500">
                                 {selectedDayEvents.length} Event{selectedDayEvents.length !== 1 && 's'}
                             </Badge>
                         </div>

                         {selectedDayEvents.length === 0 ? (
                             <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                                 <p>No payment events scheduled for this day.</p>
                             </div>
                         ) : (
                             <div className="space-y-4">
                                 {selectedDayEvents.map((evt, idx) => (
                                     <div key={idx} className="flex flex-col md:flex-row gap-4 p-4 rounded-xl border bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
                                         {/* Icon Column */}
                                         <div className="flex-shrink-0">
                                             <div className={cn("h-10 w-10 rounded-full flex items-center justify-center",
                                                 evt.type === 'due'
                                                     ? (evt.isPaid ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" : "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400")
                                                     : "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                                             )}>
                                                 {evt.type === 'due' ? (
                                                     evt.isPaid ? <CheckCircle className="h-5 w-5" /> : <DollarSign className="h-5 w-5" />
                                                 ) : (
                                                     <FilePenLine className="h-5 w-5" />
                                                 )}
                                             </div>
                                         </div>

                                         {/* Content Column */}
                                         <div className="flex-1 space-y-3">
                                             <div>
                                                 <div className="flex items-center gap-2 mb-1">
                                                     <Badge variant="outline" className={cn(
                                                         evt.type === 'due' ? "border-orange-200 text-orange-700 dark:text-orange-400" : "border-blue-200 text-blue-700 dark:text-blue-400"
                                                     )}>
                                                         {evt.type === 'due' ? 'Payment Due' : 'Statement Issued'}
                                                     </Badge>
                                                     <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                         {evt.statement.card.name}
                                                     </span>
                                                 </div>
                                                 {evt.type === 'due' && !evt.isPaid && (
                                                     <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                                                         {currencyFn(evt.amount)}
                                                         <span className="text-sm font-normal text-slate-500 ml-2">due</span>
                                                     </p>
                                                 )}
                                                 {evt.type === 'statement' && (
                                                     <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                                         Statement period ending {fmtYMShortFn ? fmtYMShortFn(evt.statement.month) : evt.statement.month}.
                                                         Total Statement: {currencyFn(evt.statement.statementAmount)}.
                                                     </p>
                                                 )}
                                             </div>

                                             {/* Actions Row */}
                                             <div className="flex flex-wrap gap-2 pt-2">
                                                 <Button
                                                     size="sm"
                                                     variant="outline"
                                                     className="h-8 text-xs"
                                                     onClick={() => onViewTransactions(evt.statement.card.id, evt.statement.card.name, evt.statement.month, fmtYMShortFn(evt.statement.month))}
                                                 >
                                                     <History className="h-3.5 w-3.5 mr-1.5" />
                                                     View Transactions
                                                 </Button>

                                                 {evt.type === 'statement' && (
                                                      <Button
                                                         size="sm"
                                                         variant="outline"
                                                         className="h-8 text-xs"
                                                         disabled={evt.statement.isSynthetic}
                                                         onClick={() => onLogStatement(evt.statement)}
                                                      >
                                                          <FilePenLine className="h-3.5 w-3.5 mr-1.5" />
                                                          Log Statement
                                                      </Button>
                                                 )}

                                                 {evt.type === 'due' && !evt.isPaid && (
                                                     <Button
                                                         size="sm"
                                                         className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-none"
                                                         onClick={() => onLogPayment(evt.statement)}
                                                     >
                                                         <Wallet className="h-3.5 w-3.5 mr-1.5" />
                                                         Log Payment
                                                     </Button>
                                                 )}

                                                 {evt.type === 'due' && evt.isPaid && (
                                                     <div className="flex items-center text-sm text-emerald-600 font-medium px-2">
                                                         <CheckCircle className="h-4 w-4 mr-1.5" />
                                                         Paid in Full
                                                     </div>
                                                 )}
                                             </div>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         )}
                     </div>
                 )}
            </div>
        </div>
    );
}
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, Wallet, CalendarClock, AlertTriangle, Check, Plus, History, FilePenLine, List, ChevronDown, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '../../../lib/utils';
import StatCard from '../../shared/StatCard';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../ui/accordion';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../../ui/tooltip';

import PaymentLogDialog from '../dialogs/PaymentLogDialog';
import StatementLogDialog from '../dialogs/StatementLogDialog';
import PaymentsCalendarView from './PaymentsCalendarView';

import { calculateCashbackSplit, calculatePaymentDate } from '../../../lib/cashback-logic';
import { getZonedDate } from '../../../lib/timezone';


export default function PaymentsTab({ cards, monthlySummary, currencyFn, fmtYMShortFn, daysLeftFn, onViewTransactions }) {
    const [paymentData, setPaymentData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isStatementDialogOpen, setStatementDialogOpen] = useState(false);
    const [activeStatement, setActiveStatement] = useState(null);
    const [isLoadingMore, setIsLoadingMore] = useState({});
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'

    // --- LOGIC: Calculate Cashback Credits ---
    const getApplicableCredits = useCallback((cardId, statementDateObj, paymentDateObj) => {
        if (!monthlySummary || !statementDateObj || !paymentDateObj) return 0;

        // Define Window: From (Statement Date - 35 days) to (Payment Date)
        // We look back ~1 month to capture credits that might have appeared on the statement itself,
        // as well as credits appearing after statement but before due date.
        // A safer window for "New Credits" might be strictly > PreviousStatementDate.
        // But simplifying: Any credit landing <= PaymentDate and > (PaymentDate - 45 days)
        // This is a heuristic. A better approach is to strictly check dates against the current cycle.

        const windowEnd = paymentDateObj.getTime();
        const windowStart = new Date(statementDateObj).setMonth(statementDateObj.getMonth() - 1); // Approx start of cycle

        let totalCredits = 0;

        monthlySummary.forEach(item => {
            // Only care about this card
            if (item.cardId !== cardId) return;
            // Only care if there is cashback
            if ((item.actualCashback || 0) <= 0) return;

            const card = cards.find(c => c.id === cardId);
            if (!card) return;

            const { tier1, tier2 } = calculateCashbackSplit(item.actualCashback, item.adjustment, card.overallMonthlyLimit);

            // Check Tier 1
            const t1Date = calculatePaymentDate(item.month, card.tier1PaymentType || 'M+1', card.statementDay);
            if (t1Date instanceof Date) {
                const t = t1Date.getTime();
                if (t > windowStart && t <= windowEnd) {
                    totalCredits += tier1;
                }
            }

            // Check Tier 2
            if (tier2 > 0) {
                 const t2Date = calculatePaymentDate(item.month, card.tier2PaymentType || 'M+2', card.statementDay);
                 if (t2Date instanceof Date) {
                    const t = t2Date.getTime();
                    if (t > windowStart && t <= windowEnd) {
                        totalCredits += tier2;
                    }
                 }
            }
        });

        return totalCredits;
    }, [monthlySummary, cards]);


    const handleLoadMore = useCallback(async (cardId) => {
        setIsLoadingMore(prev => ({ ...prev, [cardId]: true }));
        const cardData = paymentData.find(p => p.mainStatement.card.id === cardId);

        if (!cardData || !cardData.remainingPastSummaries || cardData.remainingPastSummaries.length === 0) {
            setIsLoadingMore(prev => ({ ...prev, [cardId]: false }));
            return;
        }

        const summariesToProcess = cardData.remainingPastSummaries.slice(0, 3);
        const remainingSummaries = cardData.remainingPastSummaries.slice(3);

        try {
            const statementPromises = summariesToProcess.map(async (stmt) => {
                const res = await fetch(`${API_BASE_URL}/transactions?month=${stmt.month}&filterBy=statementMonth&cardId=${cardId}`);
                if (!res.ok) throw new Error('Failed to fetch transactions');
                const transactions = await res.json();
                const spend = transactions.reduce((acc, tx) => acc + (tx['Amount'] || 0), 0);
                // Note: We don't use 'estCashback' from transactions for the balance calc anymore,
                // but we keep it for reference or if getApplicableCredits fails.
                return { ...stmt, spend };
            });

            const newPastStatements = await Promise.all(statementPromises);

            setPaymentData(currentData =>
                currentData.map(cd => {
                    if (cd.mainStatement.card.id === cardId) {
                        return {
                            ...cd,
                            pastStatements: [...cd.pastStatements, ...newPastStatements],
                            remainingPastSummaries: remainingSummaries
                        };
                    }
                    return cd;
                })
            );
        } catch (error) {
            console.error("Error loading more statements:", error);
            toast.error("Could not load more statements.");
        } finally {
            setIsLoadingMore(prev => ({ ...prev, [cardId]: false }));
        }
    }, [paymentData]);

    const partitionStatements = (allStatements) => {
        const today = getZonedDate();
        today.setHours(0, 0, 0, 0);

        // Sort by payment date
        const sortedStatements = [...allStatements].sort((a, b) => a.paymentDateObj - b.paymentDateObj);

        // 1. Prioritize ANY unpaid statement that has passed its statement date (Actual bill to pay)
        const firstUnpaidFinalizedIndex = sortedStatements.findIndex(s => {
            const isFinalized = s.statementDateObj && today >= s.statementDateObj;
            const remaining = s.statementAmount > 0 ? (s.statementAmount - (s.paidAmount || 0)) : ((s.finalAmount || s.spend) - (s.applicableCashback || 0) - (s.paidAmount || 0));
            return isFinalized && remaining > 0;
        });

        // 2. If no unpaid finalized statement, look for the current active window estimate
        const activeWindowIndex = sortedStatements.findIndex(s => s.statementDateObj && s.paymentDateObj && today >= s.statementDateObj && today <= s.paymentDateObj);

        // 3. If neither, fallback to the first unpaid of any kind
        const firstUnpaidIndex = sortedStatements.findIndex(s => {
            const remaining = s.statementAmount > 0 ? (s.statementAmount - (s.paidAmount || 0)) : ((s.finalAmount || s.spend) - (s.applicableCashback || 0) - (s.paidAmount || 0));
            return remaining > 0;
        });

        let mainStatement = null;
        let otherStatements = [...sortedStatements];

        if (firstUnpaidFinalizedIndex !== -1) {
            mainStatement = otherStatements[firstUnpaidFinalizedIndex];
            otherStatements.splice(firstUnpaidFinalizedIndex, 1);
        } else if (activeWindowIndex !== -1) {
            mainStatement = otherStatements[activeWindowIndex];
            otherStatements.splice(activeWindowIndex, 1);
        } else if (firstUnpaidIndex !== -1) {
            mainStatement = otherStatements[firstUnpaidIndex];
            otherStatements.splice(firstUnpaidIndex, 1);
        } else if (otherStatements.length > 0) {
            mainStatement = otherStatements[0];
            otherStatements.splice(0, 1);
        }

        const upcomingStatements = otherStatements.filter(s => s.daysLeft !== null).sort((a, b) => a.daysLeft - b.daysLeft);
        const pastStatements = otherStatements.filter(s => s.daysLeft === null).sort((a, b) => b.paymentDateObj - a.paymentDateObj);

        return {
            mainStatement,
            upcomingStatements,
            pastStatements
        };
    };

    useEffect(() => {
        const calculatePaymentData = async () => {
            if (cards.length === 0 || monthlySummary.length === 0) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);

            const dataPromises = cards.map(async (card) => {
                const allCardSummaries = monthlySummary.filter(s => s.cardId === card.id);
                if (allCardSummaries.length === 0) return null;

                let finalResult;

                const createStatementObject = (stmt) => {
                    let year, month;
                    if (stmt.month.includes('-')) {
                        year = parseInt(stmt.month.split('-')[0], 10);
                        month = parseInt(stmt.month.split('-')[1], 10);
                    } else {
                        year = parseInt(stmt.month.slice(0, 4), 10);
                        month = parseInt(stmt.month.slice(4, 6), 10);
                    }

                    const statementDateObj = new Date(year, month - 1, card.statementDay);
                    statementDateObj.setHours(0, 0, 0, 0);

                    const calculatedStatementDate = `${statementDateObj.getFullYear()}-${String(statementDateObj.getMonth() + 1).padStart(2, '0')}-${String(statementDateObj.getDate()).padStart(2, '0')}`;

                    let paymentMonth = month;
                    if (card.paymentDueDay < card.statementDay) paymentMonth += 1;

                    const dueDate = new Date(year, paymentMonth - 1, card.paymentDueDay);
                    dueDate.setHours(0, 0, 0, 0);

                    const paymentDate = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`;

                    // --- NEW: Calculate Applicable Cashback Credits ---
                    const applicableCashback = getApplicableCredits(card.id, statementDateObj, dueDate);

                    return {
                        ...stmt,
                        statementDateObj,
                        statementDate: calculatedStatementDate,
                        paymentDateObj: dueDate,
                        daysLeft: daysLeftFn(paymentDate),
                        paymentDate,
                        card,
                        applicableCashback // Pass this new field
                    };
                };

                const processAndFinalize = (processedStatements, remainingPastSummaries = []) => {
                    const { mainStatement, upcomingStatements, pastStatements } = partitionStatements(processedStatements);
                    const pastDueStatements = pastStatements.filter(s => (s.statementAmount - (s.paidAmount || 0)) > 0);
                    const nextUpcomingStatement = upcomingStatements.length > 0 ? upcomingStatements[0] : null;

                    return {
                        mainStatement,
                        upcomingStatements,
                        pastStatements,
                        pastDueStatements,
                        nextUpcomingStatement,
                        remainingPastSummaries
                    };
                };

                if (card.useStatementMonthForPayments) {
                    const today = getZonedDate();
                    let targetDate = new Date(today.getFullYear(), today.getMonth(), 1);
                    if (today.getDate() > card.statementDay) {
                        targetDate.setMonth(targetDate.getMonth() + 1);
                    }

                    const targetMonths = [];
                    for (let i = 0; i < 4; i++) {
                        const y = targetDate.getFullYear();
                        const m = String(targetDate.getMonth() + 1).padStart(2, '0');
                        targetMonths.push(`${y}${m}`);
                        targetDate.setMonth(targetDate.getMonth() - 1);
                    }

                    const statementPromises = targetMonths.map(async (month) => {
                        const existingSummary = allCardSummaries.find(s => s.month === month);

                        if (existingSummary && (existingSummary.statementAmount > 0 || existingSummary.reviewed)) {
                            return createStatementObject(existingSummary);
                        }

                        try {
                            const res = await fetch(`${API_BASE_URL}/transactions?month=${month}&filterBy=statementMonth&cardId=${card.id}`);
                            if (!res.ok) throw new Error('Failed');
                            const transactions = await res.json();
                            const spend = transactions.reduce((acc, tx) => acc + (tx['Amount'] || 0), 0);
                            const cashback = transactions.reduce((acc, tx) => acc + (tx.estCashback || 0), 0);

                            const base = existingSummary || {
                                id: `synthetic-${card.id}-${month}`,
                                month: month,
                                cardId: card.id,
                                statementAmount: 0,
                                paidAmount: 0,
                                isSynthetic: true
                            };

                            return createStatementObject({ ...base, spend, cashback });

                        } catch (err) {
                            console.error(`Fetch failed for ${month}`, err);
                            return existingSummary ? createStatementObject(existingSummary) : null;
                        }
                    });

                    const activeStatements = (await Promise.all(statementPromises)).filter(Boolean);

                    const activeMonthsSet = new Set(activeStatements.map(s => s.month));
                    const olderSummaries = allCardSummaries
                        .filter(s => !activeMonthsSet.has(s.month))
                        .map(createStatementObject);

                    finalResult = processAndFinalize(activeStatements, olderSummaries);

                } else {
                    const finalStatements = allCardSummaries.map(createStatementObject);
                    finalResult = processAndFinalize(finalStatements);
                }
                 return finalResult;
            });

            const resolvedData = (await Promise.all(dataPromises)).filter(Boolean);

            resolvedData.sort((a, b) => {
                const aDays = a.mainStatement?.daysLeft;
                const bDays = b.mainStatement?.daysLeft;
                if (aDays !== null && bDays === null) return -1;
                if (aDays === null && bDays !== null) return 1;
                if (aDays !== null && bDays !== null) return aDays - bDays;
                return b.mainStatement?.paymentDateObj - a.mainStatement?.paymentDateObj;
            });

            setPaymentData(resolvedData);
            setIsLoading(false);
        };
        calculatePaymentData();
    }, [cards, monthlySummary, daysLeftFn, getApplicableCredits]);

    const handleLogPaymentClick = (statement) => {
        setActiveStatement(statement);
        setDialogOpen(true);
    };

    const handleLogStatementClick = (statement) => {
        setActiveStatement(statement);
        setStatementDialogOpen(true);
    };

    const paymentGroups = useMemo(() => {
        if (!paymentData) {
            return { actionRequired: [], currentStatements: [], upcoming: [], completed: [], closed: [] };
        }

        const actionRequired = [];
        const currentStatements = [];
        const upcoming = [];
        const completed = [];
        const closed = [];

        const today = getZonedDate();
        today.setHours(0, 0, 0, 0);

        paymentData.forEach(p => {
            if (!p.mainStatement) {
                return;
            }

            if (p.mainStatement.card && p.mainStatement.card.status === 'Closed') {
                closed.push(p);
                return;
            }

            const {
                daysLeft,
                statementAmount: rawStatementAmount = 0,
                paidAmount = 0,
                spend = 0,
                finalAmount = 0,
                applicableCashback = 0,
                statementDateObj,
                month
            } = p.mainStatement;

            const baseAmount = p.mainStatement.card.useStatementMonthForPayments ? spend : (finalAmount || spend);
            const estimatedBalance = baseAmount - applicableCashback;
            const finalStatementAmount = rawStatementAmount > 0 ? rawStatementAmount : estimatedBalance;
            const remaining = finalStatementAmount - paidAmount;

            const isPaid = finalStatementAmount > 0 && remaining <= 0;
            const noPaymentNeeded = finalStatementAmount <= 0;
            const isFinalized = statementDateObj && today >= statementDateObj;

            // Calculate cycles difference for "No Payment Needed" screen
            // Compare statement month to current month
            // `month` format is either YYYYMM or YYYY-MM
            let stmtYear, stmtMonth;
            if (month.includes('-')) {
                stmtYear = parseInt(month.split('-')[0], 10);
                stmtMonth = parseInt(month.split('-')[1], 10);
            } else {
                stmtYear = parseInt(month.slice(0, 4), 10);
                stmtMonth = parseInt(month.slice(4, 6), 10);
            }
            const currentYear = today.getFullYear();
            const currentMonth = today.getMonth() + 1;

            const cyclesDiff = (currentYear - stmtYear) * 12 + (currentMonth - stmtMonth);
            p.mainStatement.isMoreThanTwoCycles = cyclesDiff > 2 && (isPaid || noPaymentNeeded);
            p.mainStatement.isFinalized = isFinalized;

            if (daysLeft === null && remaining > 0) {
                // Past due date
                actionRequired.push(p);
            } else if (daysLeft !== null && remaining > 0 && isFinalized) {
                // Unpaid, in the payment window (finalized)
                currentStatements.push(p);
            } else if (daysLeft !== null && remaining > 0 && !isFinalized) {
                // Unpaid, but not yet finalized (provisional) -> move to upcoming
                upcoming.push(p);
            } else if (isPaid && p.nextUpcomingStatement) {
                const nextBaseAmount = p.mainStatement.card.useStatementMonthForPayments ? p.nextUpcomingStatement.spend : (p.nextUpcomingStatement.finalAmount || p.nextUpcomingStatement.spend);
                const nextEstimatedBalance = nextBaseAmount - p.nextUpcomingStatement.applicableCashback;

                if (nextEstimatedBalance > 0) {
                    upcoming.push(p);
                } else {
                    completed.push(p);
                }
            } else {
                // Completed / No Payment Needed
                completed.push(p);
            }
        });

        // Sort Action Required: highest priority (past due) first, then soonest payment date
        actionRequired.sort((a, b) => {
            const aDays = a.mainStatement.daysLeft;
            const bDays = b.mainStatement.daysLeft;
            if (aDays === null && bDays !== null) return -1;
            if (aDays !== null && bDays === null) return 1;
            if (aDays !== null && bDays !== null) return aDays - bDays;
            return a.mainStatement.paymentDateObj - b.mainStatement.paymentDateObj;
        });

        return { actionRequired, currentStatements, upcoming, completed, closed };
    }, [paymentData]);

    const handleSavePayment = async (statementId, newPaidAmount) => {
        try {
            const response = await fetch(`${API_BASE_URL}/monthly-summary/${statementId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ paidAmount: newPaidAmount }),
            });

            if (!response.ok) {
                throw new Error('Failed to save payment to Notion.');
            }

            setPaymentData(currentData =>
                currentData.map(group => {
                    if (group.mainStatement.id === statementId) {
                        const updatedStatement = { ...group.mainStatement, paidAmount: newPaidAmount };
                        return { ...group, mainStatement: updatedStatement };
                    }
                    return group;
                })
            );
            toast.success("Payment logged successfully!");

        } catch (error) {
            console.error("Error saving payment:", error);
            toast.error("Could not save payment. Please try again.");
        }
    };

    const handleSaveStatement = async (statementId, newAmount) => {
        try {
            const response = await fetch(`${API_BASE_URL}/monthly-summary/${statementId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ statementAmount: newAmount }),
            });

            if (!response.ok) {
                throw new Error('Failed to save statement amount to Notion.');
            }

            setPaymentData(currentData =>
                currentData.map(group => {
                    if (group.mainStatement.id === statementId) {
                        const updatedStatement = { ...group.mainStatement, statementAmount: newAmount };
                        return { ...group, mainStatement: updatedStatement };
                    }
                    return group;
                })
            );
            toast.success("Statement amount updated successfully!");

        } catch (error) {
            console.error("Error saving statement amount:", error);
            toast.error("Could not update statement amount. Please try again.");
        }
    };

    const summaryStats = useMemo(() => {
        const calculateRemaining = (p) => {
            const { rawStatementAmount = 0, finalAmount = 0, spend = 0, applicableCashback = 0, paidAmount = 0, statementAmount = 0 } = p.mainStatement;

            // if statementAmount is available (from API logic), use it.
            if (statementAmount > 0) return statementAmount - paidAmount;

            const baseAmount = p.mainStatement.card.useStatementMonthForPayments ? spend : (finalAmount || spend);
            const estimatedBalance = baseAmount - applicableCashback;
            const finalStatementAmount = rawStatementAmount > 0 ? rawStatementAmount : estimatedBalance;
            return finalStatementAmount - paidAmount;
        };

        const attentionRequiredAmount = paymentGroups.actionRequired.reduce((acc, curr) => acc + calculateRemaining(curr), 0);
        const currentStatementsCount = paymentGroups.currentStatements.length;

        let currentStatementsAmount = 0;
        let currentStatementsFinalizedAmount = 0;

        paymentGroups.currentStatements.forEach(p => {
            const remaining = calculateRemaining(p);
            currentStatementsAmount += remaining;
            if (p.mainStatement.isFinalized) {
                currentStatementsFinalizedAmount += remaining;
            }
        });

        let upcomingStatementAmount = 0;
        paymentGroups.upcoming.forEach(p => {
            const { statementAmount: rawStatementAmount = 0, finalAmount = 0, spend = 0, applicableCashback = 0, paidAmount = 0 } = p.mainStatement;
            const baseAmount = p.mainStatement.card.useStatementMonthForPayments ? spend : (finalAmount || spend);
            const estimatedBalance = baseAmount - applicableCashback;
            const finalStatementAmount = rawStatementAmount > 0 ? rawStatementAmount : estimatedBalance;
            const remaining = finalStatementAmount - paidAmount;
            const isPaid = finalStatementAmount > 0 && remaining <= 0;

            if (isPaid && p.nextUpcomingStatement) {
                const nextBaseAmount = p.mainStatement.card.useStatementMonthForPayments ? p.nextUpcomingStatement.spend : (p.nextUpcomingStatement.finalAmount || p.nextUpcomingStatement.spend);
                const nextEstimatedBalance = nextBaseAmount - p.nextUpcomingStatement.applicableCashback;
                upcomingStatementAmount += nextEstimatedBalance;
            } else if (!isPaid) {
                upcomingStatementAmount += estimatedBalance;
            }
        });

        return {
            attentionRequiredAmount,
            currentStatementsCount,
            currentStatementsAmount,
            currentStatementsFinalizedAmount,
            upcomingStatementAmount
        };
    }, [paymentGroups]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Calculating payment schedules...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 flex-1 w-full">
                    <StatCard title="Attention Required" value={currencyFn(summaryStats.attentionRequiredAmount)} icon={<AlertTriangle className="h-4 w-4 text-red-600" />} />
                    <StatCard title="Current Statements" value={summaryStats.currentStatementsCount} icon={<CalendarClock className="h-4 w-4 text-slate-600" />} />
                    <StatCard
                        title="Current Statement Amount"
                        value={currencyFn(summaryStats.currentStatementsAmount)}
                        icon={<Wallet className="h-4 w-4 text-slate-600" />}
                        currentMonthLabel={`Finalized Amount: ${currencyFn(summaryStats.currentStatementsFinalizedAmount)}`}
                    />
                    <StatCard title="Upcoming Amount" value={currencyFn(summaryStats.upcomingStatementAmount)} icon={<CalendarDays className="h-4 w-4 text-sky-600" />} />
                </div>

                {/* View Toggle */}
                <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex shrink-0">
                    <Button
                        variant={viewMode === 'list' ? 'white' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className={cn("h-8 gap-2", viewMode === 'list' && "bg-white dark:bg-slate-900 shadow-sm")}
                    >
                        <List className="h-4 w-4" />
                        List
                    </Button>
                    <Button
                        variant={viewMode === 'calendar' ? 'white' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('calendar')}
                        className={cn("h-8 gap-2", viewMode === 'calendar' && "bg-white dark:bg-slate-900 shadow-sm")}
                    >
                        <CalendarDays className="h-4 w-4" />
                        Calendar
                    </Button>
                </div>
            </div>

            {viewMode === 'calendar' ? (
                 <PaymentsCalendarView
                    paymentData={paymentData}
                    currencyFn={currencyFn}
                    fmtYMShortFn={fmtYMShortFn}
                    onLogPayment={handleLogPaymentClick}
                    onLogStatement={handleLogStatementClick}
                    onViewTransactions={onViewTransactions}
                 />
            ) : (
                <div className="space-y-8 animate-in fade-in duration-300">
                    {paymentGroups.actionRequired.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-red-600 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                Attention Required
                            </h2>
                            {paymentGroups.actionRequired.map(({ mainStatement, ...rest }) => (
                                <PaymentCard
                                    key={mainStatement.id}
                                    statement={mainStatement}
                                    {...rest}
                                    onLogPayment={handleLogPaymentClick}
                                    onLogStatement={handleLogStatementClick}
                                    onViewTransactions={onViewTransactions}
                                    currencyFn={currencyFn}
                                    fmtYMShortFn={fmtYMShortFn}
                                    onLoadMore={handleLoadMore}
                                    isLoadingMore={isLoadingMore}
                                />
                            ))}
                        </div>
                    )}

                    {paymentGroups.currentStatements.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-slate-700 dark:text-white flex items-center gap-2">
                                <CalendarClock className="h-5 w-5" />
                                Current Statements
                            </h2>
                            {paymentGroups.currentStatements.map(({ mainStatement, ...rest }) => (
                                <PaymentCard
                                    key={mainStatement.id}
                                    statement={mainStatement}
                                    {...rest}
                                    onLogPayment={handleLogPaymentClick}
                                    onLogStatement={handleLogStatementClick}
                                    onViewTransactions={onViewTransactions}
                                    currencyFn={currencyFn}
                                    fmtYMShortFn={fmtYMShortFn}
                                    onLoadMore={handleLoadMore}
                                    isLoadingMore={isLoadingMore}
                                />
                            ))}
                        </div>
                    )}

                    {paymentGroups.upcoming.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-sky-600 flex items-center gap-2">
                                <CalendarDays className="h-5 w-5" />
                                Upcoming
                            </h2>
                            {paymentGroups.upcoming.map(({ mainStatement, ...rest }) => (
                                <PaymentCard
                                    key={mainStatement.id}
                                    statement={mainStatement}
                                    {...rest}
                                    onLogPayment={handleLogPaymentClick}
                                    onLogStatement={handleLogStatementClick}
                                    onViewTransactions={onViewTransactions}
                                    currencyFn={currencyFn}
                                    fmtYMShortFn={fmtYMShortFn}
                                    onLoadMore={handleLoadMore}
                                    isLoadingMore={isLoadingMore}
                                    isUpcomingView={true}
                                />
                            ))}
                        </div>
                    )}

                    {paymentGroups.completed.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-emerald-600 flex items-center gap-2">
                                <Check className="h-5 w-5" />
                                Completed / No Payment Needed
                            </h2>
                            {paymentGroups.completed.map(({ mainStatement, ...rest }) => (
                                <PaymentCard
                                    key={mainStatement.id}
                                    statement={mainStatement}
                                    {...rest}
                                    onLogPayment={handleLogPaymentClick}
                                    onLogStatement={handleLogStatementClick}
                                    onViewTransactions={onViewTransactions}
                                    currencyFn={currencyFn}
                                    fmtYMShortFn={fmtYMShortFn}
                                    onLoadMore={handleLoadMore}
                                    isLoadingMore={isLoadingMore}
                                />
                            ))}
                        </div>
                    )}

                    {paymentGroups.closed.length > 0 && (
                        <Accordion type="single" collapsible className="w-full pt-4">
                            <AccordionItem value="closed-cards-payments">
                                <AccordionTrigger className="text-base font-semibold text-muted-foreground">
                                    Show Closed Cards ({paymentGroups.closed.length})
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-4 pt-4">
                                        {paymentGroups.closed.map(({ mainStatement, ...rest }) => (
                                            <PaymentCard
                                                key={mainStatement.id}
                                                statement={mainStatement}
                                                {...rest}
                                                onLogPayment={handleLogPaymentClick}
                                                onLogStatement={handleLogStatementClick}
                                                onViewTransactions={onViewTransactions}
                                                currencyFn={currencyFn}
                                                fmtYMShortFn={fmtYMShortFn}
                                                onLoadMore={handleLoadMore}
                                                isLoadingMore={isLoadingMore}
                                            />
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    )}
                </div>
            )}

            {activeStatement && (
                 <PaymentLogDialog
                    isOpen={dialogOpen}
                    onClose={() => setDialogOpen(false)}
                    statement={activeStatement}
                    onSave={handleSavePayment}
                    currencyFn={currencyFn}
                    fmtYMShortFn={fmtYMShortFn}
                />
            )}
            {activeStatement && (
                 <StatementLogDialog
                    isOpen={isStatementDialogOpen}
                    onClose={() => setStatementDialogOpen(false)}
                    statement={activeStatement}
                    onSave={handleSaveStatement}
                    currencyFn={currencyFn}
                    fmtYMShortFn={fmtYMShortFn}
                />
            )}
        </div>
    );
}

function PaymentCard({ statement, upcomingStatements, pastStatements, pastDueStatements, nextUpcomingStatement, onLogPayment, onLogStatement, onViewTransactions, currencyFn, fmtYMShortFn, onLoadMore, isLoadingMore, isUpcomingView }) {
    const [historyOpen, setHistoryOpen] = useState(false);

    // Determine if the main statement is fully paid
    const isMainStatementPaid = useMemo(() => {
        const { statementAmount: rawStatementAmount = 0, finalAmount = 0, spend = 0, applicableCashback = 0, paidAmount = 0, card } = statement;
        const baseAmount = card.useStatementMonthForPayments ? spend : (finalAmount || spend);
        const estimatedBalance = baseAmount - applicableCashback;
        const finalStatementAmount = rawStatementAmount > 0 ? rawStatementAmount : estimatedBalance;
        return finalStatementAmount > 0 && (finalStatementAmount - paidAmount) <= 0;
    }, [statement]);

    // Swap statements for Upcoming view only if the main statement is fully paid
    const displayStatement = isUpcomingView && isMainStatementPaid && nextUpcomingStatement ? { ...nextUpcomingStatement, card: statement.card } : statement;
    const completedStatement = isUpcomingView && isMainStatementPaid && nextUpcomingStatement ? statement : null;

    const {
        card,
        daysLeft,
        statementAmount: rawStatementAmount = 0,
        paidAmount = 0,
        spend = 0,
        finalAmount = 0,
        applicableCashback = 0, // New logic
        statementDateObj,
        isMoreThanTwoCycles
    } = displayStatement;

    const today = getZonedDate();
    today.setHours(0, 0, 0, 0);
    const isNotFinalized = statementDateObj && today < statementDateObj;

    // Use 'finalAmount' if available, otherwise 'spend'
    const baseAmount = card.useStatementMonthForPayments ? spend : (finalAmount || spend);

    // Use the NEW applicableCashback for the deduction
    const estimatedBalance = baseAmount - applicableCashback;

    // If rawStatementAmount is set (manual override or finalized), use it. Else use estimated.
    const statementAmount = rawStatementAmount > 0 ? rawStatementAmount : estimatedBalance;

    const remaining = statementAmount - paidAmount;
    const isPaid = statementAmount > 0 && remaining <= 0;
    const noPaymentNeeded = statementAmount <= 0;
    const isPartiallyPaid = paidAmount > 0 && !isPaid;

    // Conditionally show minimalistic view
    const shouldShowMinimalView = noPaymentNeeded || (isMoreThanTwoCycles && remaining === 0);

    const getStatus = () => {
        if (noPaymentNeeded) return {
            text: 'No Payment Needed',
            className: 'bg-slate-100 text-slate-600',
            icon: <Check className="h-3 w-3 mr-1.5" />
        };
        if (isPaid) return {
            text: 'Fully Paid',
            className: 'bg-emerald-100 text-emerald-800',
            icon: <Check className="h-3 w-3 mr-1.5" />
        };
        if (daysLeft === null && remaining > 0) {
            const overdueDays = Math.floor((getZonedDate() - new Date(displayStatement.paymentDate)) / (1000 * 60 * 60 * 24));
            return {
                text: `${overdueDays > 0 ? overdueDays + ' Days Overdue' : 'Overdue'}`,
                className: 'bg-red-100 text-red-800 border border-red-200 shadow-sm animate-pulse',
                icon: <AlertTriangle className="h-3 w-3 mr-1.5 text-red-600" />
            };
        }
        if (daysLeft !== null && daysLeft < 0 && remaining > 0) {
            const overdueDays = Math.abs(daysLeft);
            return {
                text: `${overdueDays} Days Overdue`,
                className: 'bg-red-100 text-red-800 border border-red-200 shadow-sm animate-pulse',
                icon: <AlertTriangle className="h-3 w-3 mr-1.5 text-red-600" />
            };
        }
        if (isPartiallyPaid) return {
            text: 'Partially Paid',
            className: 'bg-yellow-100 text-yellow-800'
        };
        if (daysLeft === null) return {
            text: 'Completed',
            className: 'bg-slate-100 text-slate-600'
        };
         if (daysLeft <= 3) return {
            text: `${daysLeft} days left`,
            className: 'bg-red-100 text-red-800'
        };
        if (daysLeft <= 7) return {
            text: `${daysLeft} days left`,
            className: 'bg-yellow-100 text-yellow-800'
        };
        return {
            text: `${daysLeft} days left`,
            className: 'bg-slate-100 text-slate-800'
        };
    };

    const status = getStatus();
    const isPastDue = (daysLeft === null && remaining > 0) || (daysLeft !== null && daysLeft < 0 && remaining > 0);

    return (
        <div className={cn("bg-card text-card-foreground rounded-xl shadow-sm overflow-hidden border flex flex-col",
            (isPaid || shouldShowMinimalView) && "opacity-80",
            !isPaid && daysLeft !== null && daysLeft <= 3 && "border-2 border-red-500",
            isPartiallyPaid && !isPastDue && "border-2 border-yellow-500",
            isPastDue && "border-2 border-red-500"
        )}>
            {pastDueStatements && pastDueStatements.length > 0 && (
                <div className="p-4 bg-orange-50 border-b border-orange-200">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-orange-500 mt-0-5 flex-shrink-0" />
                        <div>
                            <h4 className="font-bold text-sm text-orange-800">Past Due Payments Found</h4>
                            <div className="mt-1 text-xs text-orange-700 space-y-1">
                                {pastDueStatements.map(stmt => (
                                    <div key={stmt.id} className="flex justify-between items-center">
                                        <span>Statement for {fmtYMShortFn(stmt.month)}:</span>
                                        <div className="text-xs text-slate-500 mt-2 flex items-center gap-4">
                                            <span>Statement Date: <span className="font-medium text-slate-600">{stmt.statementDate}</span></span>
                                            <span>Payment Due: <span className="font-medium text-slate-600">{stmt.paymentDate}</span></span>
                                        </div>
                                        <span className="font-semibold ml-2">{currencyFn(stmt.statementAmount - (stmt.paidAmount || 0))}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className={cn("p-4 transition-colors", isUpcomingView && "bg-sky-50/50 dark:bg-sky-900/10")}>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <p className={cn("font-bold text-lg", isUpcomingView ? "text-sky-900 dark:text-sky-100" : "text-slate-800 dark:text-slate-200")}>{card.name} <span className={cn("text-base font-medium", isUpcomingView ? "text-sky-600/60 dark:text-sky-400/60" : "text-slate-400")}>•••• {card.last4}</span></p>
                        </div>
                        {!(shouldShowMinimalView && isMoreThanTwoCycles) && (
                            <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-sm", isUpcomingView ? "text-sky-700/80 dark:text-sky-300/80" : "text-slate-500 dark:text-slate-400")}>
                                <span>
                                    Statement: <span className={cn("font-medium", isUpcomingView ? "text-sky-800 dark:text-sky-200" : "text-slate-600 dark:text-slate-300")}>{fmtYMShortFn(displayStatement.month)}</span>
                                </span>
                                <span className={isUpcomingView ? "text-sky-400/50" : "text-slate-400"}>•</span>
                                <span>
                                    Issued: <span className={cn("font-medium", isUpcomingView ? "text-sky-800 dark:text-sky-200" : "text-slate-600 dark:text-slate-300")}>{displayStatement.statementDate}</span>
                                </span>
                                <span className={isUpcomingView ? "text-sky-400/50" : "text-slate-400"}>•</span>
                                <span>
                                    Due: <span className={cn("font-medium", isUpcomingView ? "text-sky-800 dark:text-sky-200" : "text-slate-600 dark:text-slate-300")}>{displayStatement.paymentDate}</span>
                                </span>
                            </div>
                        )}
                    </div>
                    <div className={cn("text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 inline-flex items-center", isUpcomingView ? "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300" : status.className)}>
                        {isUpcomingView ? <CalendarDays className="h-3 w-3 mr-1.5" /> : status.icon}
                        {isUpcomingView ? "Upcoming" : status.text}
                    </div>
                </div>

                {isNotFinalized && (
                    <div className="mb-4 p-3 rounded-lg bg-sky-50 border border-sky-200">
                        <div className="flex items-start gap-3">
                            <CalendarClock className="h-5 w-5 text-sky-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="font-bold text-sm text-sky-800">Statement Not Finalized</h4>
                                <p className="mt-1 text-xs text-sky-700">
                                    This balance is an active estimate and will be finalized on the statement date.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-col md:flex-row gap-4">
                    {shouldShowMinimalView ? (
                        <div className={cn("flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 flex flex-col items-center justify-center text-center", isMoreThanTwoCycles ? "h-auto" : "h-32")}>
                            <Wallet className="h-8 w-8 text-slate-400 dark:text-slate-500 mb-2" />
                            <p className="font-semibold text-slate-700 dark:text-slate-300">{noPaymentNeeded ? "No Balance This Month" : "Statement Fully Paid"}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{noPaymentNeeded ? "You're all clear for this statement cycle." : "No further payments needed for this statement cycle."}</p>
                            {isMoreThanTwoCycles && (
                                <p className="text-xs text-slate-500 mt-3 font-medium bg-slate-100/80 px-3 py-1.5 rounded-full inline-flex items-center gap-2 flex-wrap">
                                    <History className="h-3 w-3 flex-shrink-0" />
                                    <span>Most Recent Statement: <span className="font-semibold">{fmtYMShortFn(displayStatement.month)}</span></span>
                                    <span className="text-slate-300 mx-1">•</span>
                                    <span>Payment Date: <span className="font-semibold">{displayStatement.paymentDate}</span></span>
                                    <span className="text-slate-300 mx-1">•</span>
                                    <span>Amount: <span className="font-semibold">{currencyFn(statementAmount)}</span></span>
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className={cn("flex-1 rounded-lg p-4", isUpcomingView ? "bg-sky-50 dark:bg-sky-900/20" : "bg-slate-100/80 dark:bg-slate-800/50")}>
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <p className={cn("text-xs font-bold uppercase tracking-wide", isUpcomingView ? "text-sky-700 dark:text-sky-300" : "text-slate-500 dark:text-slate-400")}>
                                        {isNotFinalized && !rawStatementAmount ? "Estimated Statement Balance" : "Statement Balance"}
                                    </p>
                                    {(rawStatementAmount === 0 || rawStatementAmount === null) && isNotFinalized && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-yellow-50 text-yellow-700 border-yellow-200">Estimated</Badge>}
                                    {rawStatementAmount > 0 && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-emerald-50 text-emerald-700 border-emerald-200">Logged</Badge>}
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                                <div>
                                    <p className={cn("text-3xl font-extrabold tracking-tight", isUpcomingView ? "text-sky-900 dark:text-sky-100" : "text-slate-800 dark:text-slate-200")}>{currencyFn(statementAmount)}</p>

                                    {isNotFinalized && !rawStatementAmount && (
                                        <div className={cn("mt-2 text-xs", isUpcomingView ? "text-sky-600/80 dark:text-sky-400/80" : "text-slate-500 dark:text-slate-400")}>
                                            <span>Spend: <span className={cn("font-medium", isUpcomingView ? "text-sky-800 dark:text-sky-200" : "text-slate-600 dark:text-slate-300")}>{currencyFn(spend)}</span></span>
                                        </div>
                                    )}
                                </div>

                                <div className="w-full md:w-64 space-y-2 flex flex-col justify-end">
                                    <div className={cn("flex flex-col gap-1.5 w-full rounded border p-2 text-xs shadow-sm", isUpcomingView ? "bg-white/80 dark:bg-sky-900/50 border-sky-100 dark:border-sky-800" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800")}>
                                        <div className={cn("flex justify-between items-center", isUpcomingView ? "text-sky-700 dark:text-sky-300" : "text-slate-500 dark:text-slate-400")}>
                                            <span>Cashback Earned:</span>
                                            <span className="font-semibold text-emerald-600">+{currencyFn(displayStatement.actualCashback || 0)}</span>
                                        </div>
                                        <div className={cn("flex justify-between items-center border-t pt-1.5", isUpcomingView ? "text-sky-700 dark:text-sky-300 border-sky-100 dark:border-sky-800" : "text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800")}>
                                            <span>Credits Applied:</span>
                                            <span className="font-semibold text-emerald-600">-{currencyFn(applicableCashback)}</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-sm mb-1.5 px-0.5 mt-2">
                                        <span className={isUpcomingView ? "text-sky-700 dark:text-sky-300" : "text-slate-500 dark:text-slate-400"}>Paid: <span className={cn("font-medium", isUpcomingView ? "text-sky-900 dark:text-sky-100" : "text-slate-700 dark:text-slate-300")}>{currencyFn(paidAmount)}</span></span>
                                        <span className={cn("font-bold", isUpcomingView ? "text-sky-900 dark:text-sky-100" : "text-slate-700 dark:text-slate-300")}>Remaining: <span className={cn(isPaid ? "text-emerald-600" : "text-red-600")}>{currencyFn(remaining)}</span></span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
                                        <div
                                            className={cn("h-full rounded-full transition-all duration-500", isPaid ? "bg-emerald-500" : "bg-blue-500")}
                                            style={{ width: `${Math.min(100, (paidAmount / statementAmount) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-4 flex justify-end items-center gap-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button onClick={() => onViewTransactions(card.id, card.name, displayStatement.month, fmtYMShortFn(displayStatement.month))} variant="outline" size="icon" className="sm:w-auto sm:px-3">
                                    <History className="h-4 w-4" />
                                    <span className="hidden sm:inline ml-1.5">Statement Details</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="sm:hidden"><p>Statement Details</p></TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    onClick={() => onLogStatement(displayStatement)}
                                    disabled={displayStatement.isSynthetic}
                                    variant="outline"
                                    size="icon"
                                    className="sm:w-auto sm:px-3"
                                >
                                    <FilePenLine className="h-4 w-4" />
                                    <span className="hidden sm:inline ml-1.5">Log Statement</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{displayStatement.isSynthetic ? "Wait for month to finalize" : "Log Statement Amount"}</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    onClick={() => setHistoryOpen(!historyOpen)}
                                    variant="outline"
                                    size="icon"
                                    className="sm:w-auto sm:px-3"
                                >
                                    <List className="h-4 w-4" />
                                    <span className="hidden sm:inline ml-1.5">View All</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="sm:hidden"><p>View All</p></TooltipContent>
                        </Tooltip>

                        {!shouldShowMinimalView && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        onClick={() => onLogPayment(displayStatement)}
                                        disabled={isPaid || displayStatement.isSynthetic}
                                        size="icon"
                                        className="sm:w-auto sm:px-3"
                                    >
                                        {isPaid ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                        <span className="hidden sm:inline ml-1.5">{isPaid ? 'Paid' : 'Log Payment'}</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{displayStatement.isSynthetic ? "Wait for month to finalize" : (isPaid ? 'Paid' : 'Log Payment')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </TooltipProvider>
                </div>
            </div>

            {!isUpcomingView && isPaid && nextUpcomingStatement && (
                <div className="p-4 border-t border-slate-200 bg-slate-50/50">
                    <div className="p-4 rounded-lg bg-sky-50 border border-sky-200">
                        {/* Header Section */}
                        <div className="flex items-center gap-2 mb-3">
                            <CalendarClock className="h-5 w-5 text-sky-600" />
                            <h4 className="font-bold text-sm text-sky-800">Next Statement Preview</h4>
                        </div>

                        <div className="flex flex-col gap-3">
                            {/* Row 1: Simple text line for dates */}
                            <div className="text-sm text-sky-800 font-medium">
                                <span>{fmtYMShortFn(nextUpcomingStatement.month)}</span>
                                <span className="text-sky-400 mx-2">•</span>
                                <span>Issued: {nextUpcomingStatement.statementDate}</span>
                                <span className="text-sky-400 mx-2">•</span>
                                <span>Due: {nextUpcomingStatement.paymentDate}</span>
                            </div>

                            {/* Row 2: Balances */}
                            <div className="flex justify-between items-center pt-2 border-t border-sky-200/50">
                                <div>
                                    <p className="text-xs text-sky-700 font-semibold uppercase tracking-wider mb-0.5">Balance</p>
                                    <p className="text-xl font-extrabold text-sky-900 tracking-tight">
                                        {currencyFn(nextUpcomingStatement.spend - nextUpcomingStatement.applicableCashback)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-sky-700 font-semibold uppercase tracking-wider mb-0.5">Paid</p>
                                    <p className="text-lg font-bold text-sky-900 tracking-tight">
                                        {currencyFn(nextUpcomingStatement.paidAmount || 0)}
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {isUpcomingView && completedStatement && (
                <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex order-last">
                    <div className="p-4 rounded-lg bg-slate-100 border border-slate-200 w-full">
                        {/* Header Section */}
                        <div className="flex items-center gap-2 mb-3">
                            <Check className="h-5 w-5 text-slate-500" />
                            <h4 className="font-bold text-sm text-slate-700">Current Statement</h4>
                            <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0 h-4 bg-slate-200 text-slate-600 border-slate-300">Fully Paid</Badge>
                        </div>

                        <div className="flex flex-col gap-3">
                            {/* Row 1: Simple text line for dates */}
                            <div className="text-sm text-slate-700 font-medium flex flex-wrap gap-x-2 gap-y-1">
                                <span>{fmtYMShortFn(completedStatement.month)}</span>
                                <span className="text-slate-400">•</span>
                                <span>Issued: {completedStatement.statementDate}</span>
                                <span className="text-slate-400">•</span>
                                <span>Due: {completedStatement.paymentDate}</span>
                            </div>

                            {/* Row 2: Balances */}
                            <div className="flex justify-between items-center pt-2 border-t border-slate-200/80">
                                <div>
                                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Balance</p>
                                    <p className="text-xl font-extrabold text-slate-800 tracking-tight">
                                        {currencyFn(completedStatement.statementAmount || completedStatement.finalAmount || completedStatement.spend)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Amount Paid</p>
                                    <p className="text-xl font-extrabold text-slate-800 tracking-tight">
                                        {currencyFn(completedStatement.paidAmount || (completedStatement.statementAmount || completedStatement.finalAmount || completedStatement.spend))}
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {historyOpen && (() => {
                // Combine and deduplicate statements
                const allStmts = [statement, displayStatement, completedStatement, ...(upcomingStatements || []), ...(pastStatements || [])].filter(Boolean);
                const uniqueStmts = Array.from(new Map(allStmts.map(s => [s.id, s])).values());

                // Sort by payment date descending (like pastStatements) or ascending?
                // Let's sort ascending for upcoming, descending for past to match previous behavior

                const today = getZonedDate();
                today.setHours(0, 0, 0, 0);

                const currentAndUpcomingList = uniqueStmts.filter(s => s.daysLeft !== null).sort((a, b) => a.paymentDateObj - b.paymentDateObj);
                const pastList = uniqueStmts.filter(s => s.daysLeft === null).sort((a, b) => b.paymentDateObj - a.paymentDateObj);

                return (
                    <div className="p-4 border-t border-slate-200 bg-slate-50/50 space-y-4">
                        <StatementHistoryTable
                            title="Current & Upcoming Statements"
                            statements={currentAndUpcomingList}
                            currencyFn={currencyFn}
                            fmtYMShortFn={fmtYMShortFn}
                            onViewTransactions={onViewTransactions}
                            onLogStatement={onLogStatement}
                            onLogPayment={onLogPayment}
                        />
                        <StatementHistoryTable
                            title="Past Statements"
                            statements={pastList}
                            remainingCount={statement.remainingPastSummaries?.length || 0}
                            onLoadMore={() => onLoadMore(statement.card.id)}
                            isLoadingMore={isLoadingMore[statement.card.id]}
                            currencyFn={currencyFn}
                            fmtYMShortFn={fmtYMShortFn}
                            onViewTransactions={onViewTransactions}
                            onLogStatement={onLogStatement}
                            onLogPayment={onLogPayment}
                        />
                    </div>
                );
            })()}
        </div>
    );
}

function StatementHistoryTable({ title, statements, remainingCount, onLoadMore, isLoadingMore, currencyFn, fmtYMShortFn, onViewTransactions, onLogStatement, onLogPayment }) {
    if (!statements || statements.length === 0) {
        return null; // Don't render anything if there are no statements
    }

    return (
        <div>
            <h3 className="text-sm font-semibold mb-2 text-slate-600 dark:text-slate-300">{title}</h3>
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full min-w-[1000px] text-sm whitespace-nowrap table-fixed">
                    <colgroup>
                        <col className="w-[8%]" />
                        <col className="w-[10%]" />
                        <col className="w-[12%]" />
                        <col className="w-[12%]" />
                        <col className="w-[12%]" />
                        <col className="w-[12%]" />
                        <col className="w-[12%]" />
                        <col className="w-[12%]" />
                        <col className="w-[10%]" />
                    </colgroup>
                    <thead className="text-left text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800">
                        <tr>
                            <th className="sticky left-0 bg-slate-100 dark:bg-slate-800 p-2 font-medium">Month</th>
                            <th className="p-2 font-medium">Status</th>
                            <th className="p-2 font-medium">Statement Date</th>
                            <th className="p-2 font-medium">Payment Date</th>
                            <th className="p-2 font-medium text-right">Spend</th>
                            <th className="p-2 font-medium text-right">Cashback</th>
                            <th className="p-2 font-medium text-right">Actual Balance</th>
                            <th className="p-2 font-medium text-right">Paid</th>
                            <th className="p-2 font-medium text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
                        {statements.map(stmt => {
                            const today = getZonedDate();
                            today.setHours(0, 0, 0, 0);

                            const finalStatementAmount = stmt.statementAmount > 0 ? stmt.statementAmount : ((stmt.card?.useStatementMonthForPayments ? stmt.spend : (stmt.finalAmount || stmt.spend)) - (stmt.applicableCashback || stmt.cashback || 0));
                            const remaining = finalStatementAmount - (stmt.paidAmount || 0);

                            let statusBadge;
                            if (remaining <= 0) {
                                statusBadge = <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full">Completed</span>;
                            } else if (stmt.daysLeft === null || (stmt.daysLeft !== null && stmt.daysLeft < 0)) {
                                statusBadge = <span className="bg-red-100 text-red-800 border border-red-200 text-xs font-bold px-2 py-0.5 rounded-full">Overdue</span>;
                            } else if (stmt.statementDateObj && today >= stmt.statementDateObj && today <= stmt.paymentDateObj) {
                                statusBadge = <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full">Current</span>;
                            } else {
                                statusBadge = <span className="bg-sky-100 text-sky-800 text-xs font-bold px-2 py-0.5 rounded-full">Upcoming</span>;
                            }

                            return (
                                <tr key={stmt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="sticky left-0 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2"><span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium px-2 py-1 rounded-md text-xs">{fmtYMShortFn(stmt.month)}</span></td>
                                    <td className="p-2">{statusBadge}</td>
                                    <td className="p-2">{stmt.statementDate}</td>
                                    <td className="p-2">{stmt.paymentDate}</td>
                                    <td className="p-2 text-right">{currencyFn(stmt.spend)}</td>
                                    <td className="p-2 text-right text-emerald-600">-{currencyFn(stmt.applicableCashback || stmt.cashback)}</td>
                                    <td className="p-2 text-right font-bold text-slate-700 dark:text-slate-300">{currencyFn(stmt.statementAmount > 0 ? stmt.statementAmount : (stmt.card?.useStatementMonthForPayments ? stmt.spend : (stmt.finalAmount || stmt.spend)) - (stmt.applicableCashback || stmt.cashback || 0))}</td>
                                    <td className="p-2 text-right">{currencyFn(stmt.paidAmount)}</td>
                                    <td className="p-2 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            onClick={() => onLogStatement && onLogStatement(stmt)}
                                                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-50"
                                                            disabled={stmt.isSynthetic}
                                                        >
                                                            <FilePenLine className="h-4 w-4" />
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Log Statement Amount</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            onClick={() => onLogPayment && onLogPayment(stmt)}
                                                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-50"
                                                            disabled={stmt.isSynthetic}
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Log Payment</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            onClick={() => onViewTransactions(stmt.card.id, stmt.card.name, stmt.month, fmtYMShortFn(stmt.month))}
                                                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                                        >
                                                            <List className="h-4 w-4" />
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>View Statement Details</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    {remainingCount > 0 && (
                        <tfoot className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <td colSpan="9" className="text-center p-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={onLoadMore}
                                        disabled={isLoadingMore}
                                    >
                                        {isLoadingMore ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <ChevronDown className="mr-2 h-4 w-4" />
                                        )}
                                        Load More ({remainingCount} remaining)
                                    </Button>
                                </td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    );
}
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtYMShort } from "@/lib/formatters";
import useMediaQuery from '@/hooks/useMediaQuery';

// Helper for currency formatting
const formatCurrency = (value) => {
    if (value === '' || value === undefined || value === null) return '';
    return new Intl.NumberFormat('en-US').format(value);
};

// Helper to parse currency string back to number
const parseCurrency = (value) => {
    if (!value) return '';
    return String(value).replace(/,/g, '');
};

export function UpdateDetailsDialog({ isOpen, onClose, onSave, item }) {
    const [adjustment, setAdjustment] = useState('');
    const [amountRedeemed, setAmountRedeemed] = useState('');
    const [notes, setNotes] = useState('');
    const isDesktop = useMediaQuery("(min-width: 768px)");

    useEffect(() => {
        if (isOpen && item) {
            setAdjustment(formatCurrency(item.adjustment));
            setAmountRedeemed(formatCurrency(item.amountRedeemed));
            setNotes(item.notes || '');
        }
    }, [isOpen, item]);

    if (!item) return null;

    const isPoints = item.isPoints;
    const typeLabel = isPoints ? "Points" : "Cashback";
    const redeemedLabel = isPoints ? "Redeemed" : "Received";

    // Calculations
    // Note: item.totalEarned from backend includes the ORIGINAL adjustment.
    // To get the Base Earned, we subtract the ORIGINAL adjustment.
    // Then we add the NEW adjustment to get the Final Amount.
    const originalEarnedWithAdj = Number(item.totalEarned) || 0;
    const originalAdj = Number(item.adjustment) || 0;
    const baseEarned = originalEarnedWithAdj - originalAdj;

    const numAdj = Number(parseCurrency(adjustment)) || 0;
    const numRedeemed = Number(parseCurrency(amountRedeemed)) || 0;

    const finalAmount = baseEarned + numAdj;
    const remainingDue = finalAmount - numRedeemed;

    // Validation
    const isOverRedeemed = remainingDue < 0;

    const handleSave = () => {
        if (isOverRedeemed && !isPoints) {
            // For cashback, usually we don't want to pay more than due, but strict blocking depends on user preference.
            // Given the prompt "Add validation rules", I'll treat it as a warning or error.
            // Let's allow it but show warning, or block if it's strictly points redemption.
        }

        onSave({
            ...item,
            adjustment: numAdj,
            amountRedeemed: numRedeemed,
            notes
        });
    };

    const handleMaxRedeem = () => {
        if (finalAmount > 0) {
             setAmountRedeemed(formatCurrency(finalAmount));
        }
    };

    const handleNumberInput = (setter) => (e) => {
        const rawValue = e.target.value;
        const cleanVal = rawValue.replace(/[^0-9-.]/g, '');

        if (cleanVal.endsWith('.')) {
             setter(cleanVal);
             return;
        }

        if (cleanVal.includes('.') && cleanVal.split('.')[1].length > 0) {
             // Has decimals.
             const parts = cleanVal.split('.');
             const integerPart = parts[0];
             const decimalPart = parts[1];
             setter(`${new Intl.NumberFormat('en-US').format(integerPart)}.${decimalPart}`);
             return;
        }

        setter(cleanVal ? new Intl.NumberFormat('en-US').format(cleanVal) : '');
    };

    const DialogWrapper = isDesktop ? Dialog : Drawer;
    const ContentWrapper = isDesktop ? DialogContent : DrawerContent;
    const HeaderWrapper = isDesktop ? DialogHeader : DrawerHeader;
    const TitleWrapper = isDesktop ? DialogTitle : DrawerTitle;
    const DescriptionWrapper = isDesktop ? DialogDescription : DrawerDescription;
    const FooterWrapper = isDesktop ? DialogFooter : DrawerFooter;

    // Props for Drawer to fix iOS keyboard issues
    const drawerProps = !isDesktop ? { repositionInputs: false } : {};

    const content = (
        <div className={cn("space-y-6", isDesktop ? "py-4" : "p-4 pb-0")}>
            {/* Calculator Visualization */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                {/* Row 1: Earned */}
                <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Base Earned</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{formatCurrency(baseEarned)}</span>
                </div>

                {/* Row 2: Adjustment */}
                <div className="flex justify-between items-center text-sm">
                    <Label htmlFor="adjustment" className="text-slate-500 font-medium flex items-center gap-2">
                        + Adjustment
                        <Badge variant="secondary" className="text-[9px] h-4 px-1 py-0 font-normal text-slate-500">Manual</Badge>
                    </Label>
                    <div className="w-[140px]">
                        <Input
                            id="adjustment"
                            value={adjustment}
                            onChange={handleNumberInput(setAdjustment)}
                            className="h-8 text-right font-mono text-base md:text-sm bg-white dark:bg-slate-950"
                            placeholder="0"
                            autoFocus={isDesktop}
                        />
                    </div>
                </div>

                <div className="h-px bg-slate-200 dark:bg-slate-700" />

                {/* Row 3: Final Amount */}
                <div className="flex justify-between items-center text-sm bg-slate-100 dark:bg-slate-800/80 -mx-4 px-4 py-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Final Amount</span>
                    <span className="font-mono font-bold text-base">{formatCurrency(finalAmount)}</span>
                </div>

                {/* Row 4: Redeemed/Received */}
                <div className="flex justify-between items-center text-sm pt-1">
                    <Label htmlFor="redeemed" className="text-slate-500 font-medium flex items-center gap-2">
                        - {redeemedLabel}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 px-1.5 text-[10px] text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 ml-1"
                            onClick={handleMaxRedeem}
                        >
                            Max
                        </Button>
                    </Label>
                    <div className="w-[140px]">
                        <Input
                            id="redeemed"
                            value={amountRedeemed}
                            onChange={handleNumberInput(setAmountRedeemed)}
                            className={cn("h-8 text-right font-mono text-base md:text-sm bg-white dark:bg-slate-950", isOverRedeemed && "border-red-500 focus-visible:ring-red-500")}
                            placeholder="0"
                        />
                    </div>
                </div>

                <div className="h-px bg-slate-200 dark:bg-slate-700" />

                {/* Row 5: Remaining */}
                <div className="flex justify-between items-center">
                        <span className={cn("text-sm font-bold", remainingDue < 0 ? "text-red-600" : "text-emerald-600")}>
                        {remainingDue < 0 ? "Overpaid / Excess" : "Remaining"}
                        </span>
                        <span className={cn("font-mono font-bold text-lg", remainingDue < 0 ? "text-red-600" : "text-emerald-600")}>
                        {remainingDue < 0 ? '-' : ''}{formatCurrency(Math.abs(remainingDue))}
                        </span>
                </div>
            </div>

            {isOverRedeemed && (
                    <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>
                        Warning: The {redeemedLabel.toLowerCase()} amount exceeds the total available. This will result in a negative balance.
                    </span>
                </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="resize-none h-20"
                    placeholder="Add details about adjustment or payment..."
                />
            </div>
        </div>
    );

    return (
        <DialogWrapper open={isOpen} onOpenChange={onClose} {...drawerProps}>
            <ContentWrapper className={cn("sm:max-w-[500px]", !isDesktop && "max-h-[96vh]")}>
                <HeaderWrapper className={cn(!isDesktop && "text-left")}>
                    <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={cn("text-[10px] h-5 px-2 font-normal", isPoints ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-emerald-50 text-emerald-700 border-emerald-200")}>
                            {typeLabel} Record
                        </Badge>
                        <span className="text-sm text-slate-500 font-medium">{fmtYMShort(item.month)}</span>
                    </div>
                    <TitleWrapper className="text-xl">{item.cardName}</TitleWrapper>
                    <DescriptionWrapper>
                        Update the financial details for this period.
                    </DescriptionWrapper>
                </HeaderWrapper>

                {content}

                <FooterWrapper className={cn("pt-2", !isDesktop && "pb-8 px-4 flex-col gap-2")}>
                    {isDesktop ? (
                        <>
                            <Button variant="outline" onClick={onClose}>Cancel</Button>
                            <Button onClick={handleSave} className="bg-slate-900 dark:bg-slate-100">Save Changes</Button>
                        </>
                    ) : (
                        <>
                            <Button onClick={handleSave} className="w-full bg-slate-900 dark:bg-slate-100">Save Changes</Button>
                            <Button
                                variant="ghost"
                                onClick={onClose}
                                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                                Cancel
                            </Button>
                        </>
                    )}
                </FooterWrapper>
            </ContentWrapper>
        </DialogWrapper>
    );
}
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Gift, AlertCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import useMediaQuery from '@/hooks/useMediaQuery';
import { getZonedDate } from '../../../../lib/timezone';

// Helper for currency formatting
const formatCurrency = (value) => {
    if (value === '' || value === undefined || value === null) return '';
    return new Intl.NumberFormat('en-US').format(value);
};

// Helper to parse currency string back to number
const parseCurrency = (value) => {
    if (!value) return '';
    return String(value).replace(/,/g, '');
};

const QUICK_AMOUNTS = [200000, 300000, 500000];

export function RedeemPointsDialog({ isOpen, onClose, onConfirm, target }) {
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [date, setDate] = useState('');
    const [error, setError] = useState(null);
    const isDesktop = useMediaQuery("(min-width: 768px)");

    // Reset state when dialog opens
    useEffect(() => {
        if (isOpen) {
            setAmount('');
            setNotes('');
            // Default to current local time in YYYY-MM-DDTHH:MM format
            const now = getZonedDate();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            setDate(`${year}-${month}-${day}T${hours}:${minutes}`);
            setError(null);
        }
    }, [isOpen]);

    if (!target) return null;

    const currentBalance = target.totalPoints || 0;
    const numericAmount = Number(parseCurrency(amount));
    const remainingBalance = currentBalance - (numericAmount || 0);
    const isValid = numericAmount > 0 && remainingBalance >= 0;

    const handleAmountChange = (e) => {
        const rawValue = e.target.value;
        const numericValue = rawValue.replace(/[^0-9]/g, '');

        // Prevent typing more than balance
        if (Number(numericValue) > currentBalance) {
            setError("Amount exceeds available balance");
        } else {
            setError(null);
        }

        setAmount(formatCurrency(numericValue));
    };

    const handleQuickSelect = (value) => {
        if (value > currentBalance) {
            setError("Amount exceeds available balance");
            // Still set it so user sees they clicked it, but show error
        } else {
            setError(null);
        }
        setAmount(formatCurrency(value));
    };

    const handleMax = () => {
        setAmount(formatCurrency(currentBalance));
        setError(null);
    };

    const handleSubmit = () => {
        if (!isValid) return;
        onConfirm({ amount: numericAmount, notes, date });
    };

    const DialogWrapper = isDesktop ? Dialog : Drawer;
    const ContentWrapper = isDesktop ? DialogContent : DrawerContent;
    const HeaderWrapper = isDesktop ? DialogHeader : DrawerHeader;
    const TitleWrapper = isDesktop ? DialogTitle : DrawerTitle;
    const DescriptionWrapper = isDesktop ? DialogDescription : DrawerDescription;
    const FooterWrapper = isDesktop ? DialogFooter : DrawerFooter;

    // Props for Drawer to fix iOS keyboard issues
    const drawerProps = !isDesktop ? { repositionInputs: false } : {};

    const content = (
        <div className={cn("space-y-6", isDesktop ? "py-4" : "p-4 pb-0")}>
            {/* Hero: Balance Visualization (Split Cards) */}
            <div className="grid grid-cols-2 gap-3">
                    {/* Card 1: Available */}
                <div className="relative overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Available</p>
                        <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{formatCurrency(currentBalance)}</h3>
                </div>

                {/* Card 2: After Redeem */}
                <div className={cn(
                    "relative overflow-hidden rounded-xl border p-4 transition-colors",
                    isValid ? "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800" : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-80"
                )}>
                    <p className={cn("text-[10px] font-bold uppercase tracking-wider mb-1", isValid ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500")}>New Balance</p>
                    <h3 className={cn("text-xl font-bold tracking-tight flex items-center gap-1",
                        remainingBalance < 0 ? "text-red-500" : (isValid ? "text-indigo-700 dark:text-indigo-300" : "text-slate-900 dark:text-slate-100")
                    )}>
                        {remainingBalance < 0 ? '-' : ''}{formatCurrency(Math.abs(remainingBalance))}
                        {isValid && <ArrowRight className="h-3 w-3 opacity-50" />}
                    </h3>
                </div>
            </div>

            {/* Inputs */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="redeem-amount">Amount to Redeem</Label>
                    <div className="relative">
                        <Input
                            id="redeem-amount"
                            value={amount}
                            onChange={handleAmountChange}
                            placeholder="0"
                            className={cn("pl-4 pr-12 text-lg font-semibold", error && "border-red-500 focus-visible:ring-red-500")}
                            autoFocus={isDesktop}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">pts</div>
                    </div>
                    {error && (
                        <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                            <AlertCircle className="h-3 w-3" /> {error}
                        </p>
                    )}
                </div>

                {/* Quick Select */}
                <div>
                    <Label className="text-xs text-slate-500 mb-2 block">Quick Select</Label>
                    <div className="flex flex-wrap gap-2">
                        {QUICK_AMOUNTS.map((amt) => (
                            <Badge
                                key={amt}
                                variant="outline"
                                className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all px-3 py-1.5 h-auto text-sm font-normal"
                                onClick={() => handleQuickSelect(amt)}
                            >
                                {formatCurrency(amt)}
                            </Badge>
                        ))}
                        <Badge
                            variant="outline"
                            className="cursor-pointer bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 active:scale-95 transition-all px-3 py-1.5 h-auto text-sm font-medium"
                            onClick={handleMax}
                        >
                            Max
                        </Badge>
                    </div>
                </div>

                <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                        <Label htmlFor="redeem-date">Date & Time</Label>
                        <Input
                            id="redeem-date"
                            type="datetime-local"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="text-base md:text-sm w-full appearance-none block min-w-0" // Fixed for iOS
                        />
                    </div>
                        <div className="space-y-2">
                        <Label htmlFor="redeem-notes">Notes (Optional)</Label>
                        <Textarea
                            id="redeem-notes"
                            value={notes}
                            onChange={(e) => {
                                setNotes(e.target.value);
                                // Simple auto-grow
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                            placeholder="e.g. Voucher"
                            className="text-base md:text-sm min-h-[80px] resize-none overflow-hidden"
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <DialogWrapper open={isOpen} onOpenChange={onClose} {...drawerProps}>
            <ContentWrapper className={cn("sm:max-w-md", !isDesktop && "max-h-[96vh]")}>
                <HeaderWrapper className={cn(!isDesktop && "text-left")}>
                    <TitleWrapper className="flex items-center gap-2 text-xl">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                            <Gift className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        Redeem Points
                    </TitleWrapper>
                    <DescriptionWrapper>
                        Use your accumulated points for rewards or statement credits.
                    </DescriptionWrapper>
                </HeaderWrapper>

                {content}

                <FooterWrapper className={cn("pt-2", !isDesktop && "pb-8 px-4")}>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!isValid || !!error}
                        className={cn("min-w-[100px]", isValid ? "bg-indigo-600 hover:bg-indigo-700" : "")}
                    >
                        Confirm
                    </Button>
                </FooterWrapper>
            </ContentWrapper>
        </DialogWrapper>
    );
}
import React, { useState, useMemo } from 'react';
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from "@/components/ui/sheet";
import {
    Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Edit2, ClipboardCheck, Eye, Trash2, ArrowDown } from "lucide-react";
import useMediaQuery from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import { fmtYMShort } from "@/lib/formatters";
import { getZonedDate, getTimezone } from "../../../../lib/timezone";
import { isStatementFinalized, groupRedemptionEvents } from "@/lib/cashback-logic";

export function PointsDetailSheet({ isOpen, onClose, cardData, onEdit, onToggleReviewed, onViewTransactions, onUndoRedemption, currencyFn }) {
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const [viewMode, setViewMode] = useState('monthly'); // 'monthly' | 'history'

    const historyEvents = useMemo(() => {
        if (!cardData || viewMode !== 'history') return [];
        return groupRedemptionEvents(cardData.items, cardData.statementDay);
    }, [cardData, viewMode]);

    if (!cardData) return null;

    // --- Renderers ---

    const renderMonthlyView = () => (
        <div className="space-y-3 pb-4">
            {cardData.items.slice().reverse().map((item) => { // Reverse to show newest first
                const earned = item.totalEarned || 0;
                const redeemed = item.amountRedeemed || 0;
                const adjustment = item.adjustment || 0;
                const remaining = item.remainingDue || 0;
                const hasNotes = item.notes && item.notes.trim().length > 0;
                const isReviewed = item.reviewed;
                const isStatementFinished = isStatementFinalized(item.month, cardData.statementDay);

                // Calculate base earned (Option A: Display base earned separate from adjustment)
                const baseEarned = earned - adjustment;
                const finalAmount = baseEarned + adjustment;

                return (
                    <div key={item.id} className="group relative border border-slate-200 dark:border-slate-800 rounded-lg p-3 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors bg-white dark:bg-slate-950">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{fmtYMShort(item.month)}</span>
                                    {remaining > 0 ? (
                                        !isStatementFinished ? (
                                            <Badge variant="outline" className="text-[10px] bg-orange-50 text-orange-700 border-orange-200 px-1 py-0 h-5">Pending</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 px-1 py-0 h-5">Active</Badge>
                                        )
                                    ) : (
                                        <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-200 px-1 py-0 h-5">Settled</Badge>
                                    )}
                                    {isReviewed && (
                                        <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-600 border-indigo-200 px-1 py-0 h-5 flex items-center gap-1">
                                            <ClipboardCheck className="h-2.5 w-2.5" />
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-1 -mr-2 -mt-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn("h-6 w-6 transition-opacity", isReviewed ? "text-indigo-600 opacity-100" : "opacity-30 group-hover:opacity-100 text-slate-400 hover:text-indigo-600")}
                                    onClick={() => onToggleReviewed(item)}
                                    title={isReviewed ? "Mark Unreviewed" : "Mark Reviewed"}
                                >
                                    <ClipboardCheck className="h-3 w-3" />
                                </Button>

                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-50 group-hover:opacity-100" onClick={() => onViewTransactions(item)}>
                                    <Eye className="h-3 w-3" />
                                </Button>

                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-50 group-hover:opacity-100" onClick={() => onEdit(item)}>
                                    <Edit2 className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                            <div className="flex justify-between pr-2">
                                <span>Base Earned:</span>
                                <span className="font-medium">{currencyFn(baseEarned)}</span>
                            </div>
                            <div className="flex justify-between pl-2 border-l border-slate-100 dark:border-slate-800">
                                <span>Adjustment:</span>
                                <span className={cn("font-medium", adjustment !== 0 ? "text-orange-600" : "")}>{currencyFn(adjustment)}</span>
                            </div>

                            <div className="col-span-2 border-t border-dashed border-slate-100 dark:border-slate-800 my-1"></div>

                            <div className="flex justify-between pr-2 col-span-2 font-semibold text-slate-700 dark:text-slate-300">
                                <span>Final Amount:</span>
                                <span>{currencyFn(finalAmount)}</span>
                            </div>

                            <div className="col-span-2 border-b border-dashed border-slate-100 dark:border-slate-800 my-1"></div>

                            <div className="flex justify-between pr-2">
                                <span>Redeemed:</span>
                                <span className={cn("font-medium", redeemed > 0 ? "text-indigo-600" : "")}>{currencyFn(redeemed)}</span>
                            </div>
                            <div className="flex justify-between pl-2 border-l border-slate-100 dark:border-slate-800">
                                <span className="font-bold text-slate-900 dark:text-slate-200">Remaining:</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-500">{currencyFn(remaining)}</span>
                            </div>
                        </div>

                        {hasNotes && (
                            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 italic bg-slate-50/50 dark:bg-slate-900/50 p-1.5 rounded">
                                {item.notes}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );

    const renderHistoryView = () => (
        <div className="space-y-3 pb-4">
             {historyEvents.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">
                    No history found.
                </div>
            )}
            {historyEvents.map((event) => {
                const isEarned = event.type === 'earned';
                const today = getZonedDate();
                today.setHours(0, 0, 0, 0);

                let dateDisplay;
                let eventDateObj;

                if (isEarned) {
                     eventDateObj = new Date(event.date);
                     dateDisplay = eventDateObj.toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric', timeZone: getTimezone()});
                } else {
                     // Check if it has time
                     const hasTime = event.date && event.date.includes(':');
                     eventDateObj = new Date(event.date.includes(' ') ? event.date.replace(' ', 'T') : event.date);

                     if (hasTime) {
                         dateDisplay = eventDateObj.toLocaleString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                            timeZone: getTimezone()
                        }).replace(',', '');
                     } else {
                         dateDisplay = eventDateObj.toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric', timeZone: getTimezone()});
                     }
                }

                const isUpcoming = isEarned && eventDateObj > today;

                if (isEarned) {
                    return (
                        <div key={event.id} className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0 border",
                                    isUpcoming
                                        ? "bg-slate-50 dark:bg-slate-800 text-slate-400 border-dashed border-slate-300 dark:border-slate-700"
                                        : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-transparent"
                                )}>
                                    <ArrowDown className="h-4 w-4 rotate-180" />
                                </div>
                                <div>
                                    <p className={cn("text-sm font-semibold", isUpcoming ? "text-slate-500" : "text-slate-900 dark:text-slate-100")}>
                                        {isUpcoming ? "Expected" : "Points Earned"}
                                    </p>
                                    <p className="text-[10px] text-slate-500">{dateDisplay}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={cn("text-sm font-bold", isUpcoming ? "text-slate-400" : "text-emerald-600")}>
                                    +{currencyFn(event.amount)}
                                </p>
                                <div className="flex justify-end gap-1 mt-1">
                                    <Button variant="ghost" size="icon" className="h-5 w-5 text-slate-300 hover:text-slate-600" onClick={() => onViewTransactions(event.item)}>
                                        <Eye className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-5 w-5 text-slate-300 hover:text-slate-600" onClick={() => onEdit(event.item)}>
                                        <Edit2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    );
                } else {
                    // Redemption
                    return (
                         <Accordion key={event.id} type="single" collapsible className="w-full">
                            <AccordionItem value={event.id} className="border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 px-3">
                                <AccordionTrigger className="hover:no-underline py-3">
                                    <div className="flex items-center justify-between w-full pr-2">
                                        <div className="flex items-center gap-3 text-left">
                                            <div className="h-8 w-8 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                                                <ArrowDown className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">{event.note || "Redemption"}</p>
                                                <p className="text-[10px] text-slate-500">{dateDisplay}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">-{currencyFn(event.amount)}</p>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-3 pt-1 border-t border-slate-100 dark:border-slate-800 mt-2">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Source Breakdown</p>
                                        {event.contributors.map((c, idx) => (
                                            <div key={idx} className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                                                <span>{fmtYMShort(c.month)}</span>
                                                <span>-{currencyFn(c.amount)}</span>
                                            </div>
                                        ))}

                                        <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                                             <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                onClick={() => onUndoRedemption(event)}
                                            >
                                                <Trash2 className="h-3 w-3 mr-1.5" />
                                                Undo Redemption
                                            </Button>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    );
                }
            })}
        </div>
    );

    const Content = (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-2 px-1 shrink-0">
                <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <button
                        onClick={() => setViewMode('monthly')}
                        className={cn("px-2 py-1 text-xs rounded-md transition-all font-medium", viewMode === 'monthly' ? "bg-white dark:bg-slate-950 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-slate-500 hover:text-slate-700")}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setViewMode('history')}
                        className={cn("px-2 py-1 text-xs rounded-md transition-all font-medium", viewMode === 'history' ? "bg-white dark:bg-slate-950 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-slate-500 hover:text-slate-700")}
                    >
                        History
                    </button>
                </div>
                <span className="text-xs text-slate-500">
                    {viewMode === 'monthly' ? `${cardData.items.length} records` : `${historyEvents.length} events`}
                </span>
            </div>

            <ScrollArea className="flex-1 pr-4 -mr-4">
                <div className="flex flex-col gap-4 mb-4">
                    {/* Header Stats - Now inside scroll */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                            <p className="text-xs text-slate-500 uppercase font-semibold">Current Balance</p>
                            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                {currencyFn(cardData.totalPoints)}
                            </p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                            <p className="text-xs text-slate-500 uppercase font-semibold">Amount Redeemed</p>
                            <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                                {cardData.totalAmountRedeemed ? currencyFn(cardData.totalAmountRedeemed) : '0'}
                            </p>
                        </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                        <p className="text-xs text-slate-500 uppercase font-semibold">Minimum Redemption:</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            {cardData.minPointsRedeem ? currencyFn(cardData.minPointsRedeem) : '0'}
                        </p>
                    </div>
                </div>

                {viewMode === 'monthly' ? renderMonthlyView() : renderHistoryView()}
            </ScrollArea>
        </div>
    );

    if (isDesktop) {
        return (
            <Sheet open={isOpen} onOpenChange={onClose}>
                <SheetContent className="sm:max-w-md flex flex-col h-full">
                    <SheetHeader className="mb-4">
                        <SheetTitle className="flex items-center gap-2">
                             <div className="h-6 w-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-[10px] font-bold text-indigo-700 shrink-0">
                                {cardData.bankName ? cardData.bankName.substring(0,2) : 'CB'}
                            </div>
                            {cardData.cardName}
                        </SheetTitle>
                        <SheetDescription>
                            Points history and redemption details
                        </SheetDescription>
                    </SheetHeader>
                    {Content}
                </SheetContent>
            </Sheet>
        );
    }

    return (
        <Drawer open={isOpen} onOpenChange={onClose}>
            <DrawerContent className="h-[85vh]">
                <DrawerHeader className="text-left">
                    <DrawerTitle className="flex items-center gap-2">
                         <div className="h-6 w-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-[10px] font-bold text-indigo-700 shrink-0">
                            {cardData.bankName ? cardData.bankName.substring(0,2) : 'CB'}
                        </div>
                        {cardData.cardName}
                    </DrawerTitle>
                    <DrawerDescription>
                        Points history and redemption details
                    </DrawerDescription>
                </DrawerHeader>
                <div className="px-4 flex-1 overflow-hidden pb-8 flex flex-col">
                    {Content}
                </div>
            </DrawerContent>
        </Drawer>
    );
}
import React, { useState, useMemo } from 'react';
import {
    CheckCircle, AlertTriangle, Filter, Edit2, Clock, Calendar, Wallet,
    Coins, Gift, TrendingUp, List, ArrowDown, Eye, Info, Lock, ClipboardCheck, X
} from "lucide-react";
import { toast } from "sonner";

import { getZonedDate, getTimezone } from "../../../lib/timezone";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Checkbox } from "../../ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "../../ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Progress } from "../../ui/progress";
import { Card, CardContent, CardHeader, CardFooter } from "../../ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../ui/table";
import { cn } from "@/lib/utils";
import StatCard from "../../shared/StatCard";
import SharedTransactionsDialog from '@/components/shared/SharedTransactionsDialog';
import { PointsDetailSheet } from './components/PointsDetailSheet';
import { RedeemPointsDialog } from './components/RedeemPointsDialog';
import { UpdateDetailsDialog } from './components/UpdateDetailsDialog';

import { calculateCashbackSplit, calculatePaymentDate, getPaymentStatus, isStatementFinalized, RE_REDEMPTION_LOG } from '../../../lib/cashback-logic';
import { fmtYMShort } from '../../../lib/formatters';

// ==========================================
// 1. HELPERS & SUB-COMPONENTS
// ==========================================


const currency = (n) => new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 0 }).format(n);

function getCardActivities(items, statementDay) {
    const activities = [];
    const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric', timeZone: getTimezone()});
    const fmtDateTime = (d) => {
        const date = new Date(d);
        // Display format: 30 Oct 2025 18:59
        return isNaN(date.getTime()) ? d : date.toLocaleString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).replace(',', '');
    };

    items.forEach(item => {
        const getYearMonth = (mStr) => {
            if (mStr.includes('-')) {
                const parts = mStr.split('-');
                return [Number(parts[0]), Number(parts[1])];
            }
            if (mStr.length === 6) {
                return [Number(mStr.substring(0, 4)), Number(mStr.substring(4, 6))];
            }
            return [getZonedDate().getFullYear(), getZonedDate().getMonth() + 1]; // Fallback
        };

        const [y, m] = getYearMonth(item.month);

        // 1. Earned
        if (item.totalEarned > 0) {
            // Calculate Statement Date: Month + Statement Day
            const daysInMonth = new Date(y, m, 0).getDate(); // Day 0 of next month = last day of current
            const day = Math.min(statementDay || 1, daysInMonth);

            const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            activities.push({
                type: 'earned',
                amount: item.totalEarned,
                date: dateStr,
                displayDate: fmtDate(dateStr),
                desc: 'Points Added'
            });
        }

        // 2. Redeemed
        if (item.notes) {
            // Use shared Regex
            const regex = new RegExp(RE_REDEMPTION_LOG); // Copy regex
            const legacyDateRegex = /(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})\s+redemption/i;

            let match;
            while ((match = regex.exec(item.notes)) !== null) {
                // Remove commas before parsing number
                const amountStr = match[1].replace(/,/g, '');
                const amount = Number(amountStr);

                let dateRaw = match[2];
                let noteContent = match[3];

                // Legacy: Check if noteContent contains a date like "31 Oct 2025 redemption"
                if (!dateRaw && noteContent) {
                    const dateMatch = noteContent.match(legacyDateRegex);
                    if (dateMatch) {
                        const day = dateMatch[1];
                        const monthStr = dateMatch[2];
                        const year = dateMatch[3];
                        const month = new Date(`${monthStr} 1 2000`).getMonth() + 1; // Parse month name
                        dateRaw = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        noteContent = 'Redemption'; // Normalize description
                    }
                }

                let dateStr = dateRaw;
                if (!dateStr) {
                    // Fallback to item month end
                     const daysInMonth = new Date(y, m, 0).getDate();
                     dateStr = `${y}-${String(m).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
                }

                // If the regex captured a time (e.g. 2023-10-30 14:30), we should display it.
                // Our fmtDateTime handles complete strings if they parse correctly.
                // Replace space in "YYYY-MM-DD HH:MM" with "T" for Safari parsing if needed,
                // but Chrome handles space. Safest is T.
                // However, the regex output is directly what we have.
                // Let's create a safe parseable string for the Date constructor.
                const safeDateStr = dateStr.includes(' ') ? dateStr.replace(' ', 'T') : dateStr;

                activities.push({
                    type: 'redeemed',
                    amount: amount,
                    date: dateStr, // Keep original for sort
                    displayDate: dateStr.includes(':') ? fmtDateTime(safeDateStr) : fmtDate(safeDateStr),
                    desc: noteContent || 'Redeemed'
                });
            }
        }
    });

    return activities.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
}

function CashVoucherCard({ item, onMarkReceived, onEdit, onViewTransactions, onToggleReviewed, statementDay, isSelectionMode, isSelected, onToggleSelect }) {
    const isPaid = item.remainingDue <= 0;
    const isReviewed = item.reviewed;

    // 1. Calculate paid status for specific tiers
    const tier1Paid = (item.amountRedeemed || 0) >= item.tier1Amount;
    const tier2Paid = (item.amountRedeemed || 0) >= (item.tier1Amount + item.tier2Amount);
    const hasTier2 = item.tier2Amount > 0;

    // 2. Calculate specific overdue status for each tier
    const isTier1Overdue = !tier1Paid && item.tier1Status?.status === 'overdue';
    const isTier2Overdue = hasTier2 && !tier2Paid && item.tier2Status?.status === 'overdue';

    // 3. Global card overdue status (for the border)
    const isCardOverdue = !isPaid && (isTier1Overdue || isTier2Overdue);
    const isStatementPending = !isStatementFinalized(item.month, statementDay);

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        if (dateStr === 'Accumulating') return 'Accumulating';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'});
    };

    return (
        <Card className={cn(
            "group relative flex flex-col justify-between transition-all duration-200 hover:shadow-lg",
            isPaid
                ? "border-slate-200 dark:border-slate-800 opacity-70 bg-slate-50/50 dark:bg-slate-900/20"
                : isCardOverdue
                    ? "border-red-200 dark:border-red-900/50 bg-red-50/20 shadow-red-100/20"
                    : "border-emerald-200 dark:border-emerald-800/50 bg-white dark:bg-slate-950"
        )}>
            {/* Header */}
            <CardHeader className="p-4 pb-2 flex-row items-start justify-between space-y-0">
                <div className="flex items-center gap-3">
                    {isSelectionMode && (
                        <Checkbox
                            checked={isSelected}
                            onCheckedChange={onToggleSelect}
                            className="mr-1"
                        />
                    )}
                    <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0 uppercase border border-slate-200 dark:border-slate-700">
                        {item.bankName ? item.bankName.substring(0,2) : 'CB'}
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 leading-tight line-clamp-1">{item.cardName}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-slate-500 font-medium">{fmtYMShort(item.month)}</p>
                            {isReviewed && (
                                <Badge variant="outline" className="text-[10px] h-4 px-1 py-0 font-normal text-indigo-600 border-indigo-200 bg-indigo-50 dark:bg-indigo-950/30 flex items-center gap-1">
                                    <ClipboardCheck className="h-2.5 w-2.5" /> Reviewed
                                </Badge>
                            )}
                            {isStatementPending && !isPaid && (
                                <Badge variant="secondary" className="text-[10px] h-4 px-1 py-0 font-normal bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200">
                                    <Info className="h-2.5 w-2.5 mr-1" /> Pending
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex gap-1 -mr-2 -mt-2">
                     <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-7 w-7 transition-opacity", isReviewed ? "text-indigo-600 opacity-100" : "opacity-30 group-hover:opacity-100 text-slate-400 hover:text-indigo-600")}
                        onClick={() => onToggleReviewed(item)}
                        title={isReviewed ? "Mark Unreviewed" : "Mark Reviewed"}
                    >
                        <ClipboardCheck className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-30 group-hover:opacity-100 transition-opacity" onClick={() => onViewTransactions(item)}>
                         <Eye className="h-4 w-4 text-slate-500" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-30 group-hover:opacity-100 transition-opacity" onClick={() => onEdit(item)}>
                        <Edit2 className="h-4 w-4 text-slate-500" />
                    </Button>
                </div>
            </CardHeader>

            {/* Body */}
            <CardContent className="p-4 py-3 border-t border-b border-dashed border-slate-100 dark:border-slate-800/50 my-1 relative">
                 {/* Voucher Cutouts */}
                 <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-50 dark:bg-slate-900 rounded-full border-r border-slate-200 dark:border-slate-800 z-10" />
                 <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-50 dark:bg-slate-900 rounded-full border-l border-slate-200 dark:border-slate-800 z-10" />

                <div className="text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Total Earned</p>
                    <div className="flex items-baseline justify-center gap-1">
                        <span className={cn("text-2xl font-bold tracking-tight", isPaid ? "text-slate-400" : "text-emerald-600 dark:text-emerald-500")}>
                            {currency(item.totalEarned)}
                        </span>
                        <span className="text-xs font-medium text-slate-400">₫</span>
                    </div>
                    {item.tier2Amount > 0 && (
                        <div className="mt-2 flex justify-center gap-3 text-[10px] text-slate-500 bg-slate-50 dark:bg-slate-900/50 rounded-full py-0.5 px-3 mx-auto w-fit">
                            <span>P: <b className="text-slate-700 dark:text-slate-300">{currency(item.tier1Amount)}</b></span>
                            <span className="text-slate-300">|</span>
                            <span>E: <b className="text-slate-700 dark:text-slate-300">{currency(item.tier2Amount)}</b></span>
                        </div>
                    )}
                </div>
            </CardContent>

            {/* Footer */}
            <CardFooter className="p-4 block space-y-3">
                {!isPaid && (
                    <div className="flex justify-between items-start text-xs">
                        <span className="text-slate-500 mt-0.5 font-medium">Expected Payment</span>

                        <div className="flex flex-col items-end gap-1.5">
                            {/* Tier 1 Date */}
                            <div className="flex items-center gap-1.5">
                                 {hasTier2 && <span className="text-slate-400 text-[10px] uppercase tracking-wide">Tier 1</span>}
                                 <span className={cn("font-medium flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800", isTier1Overdue && "bg-red-50 text-red-600 border-red-100")}>
                                    {isTier1Overdue && <AlertTriangle className="h-3 w-3" />}
                                    {formatDate(item.tier1Date)}
                                    {tier1Paid && hasTier2 && <CheckCircle className="h-3 w-3 text-emerald-500" />}
                                </span>
                            </div>

                            {/* Tier 2 Date */}
                            {hasTier2 && (
                                 <div className="flex items-center gap-1.5">
                                     <span className="text-slate-400 text-[10px] uppercase tracking-wide">Tier 2</span>
                                     <span className={cn("font-medium flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800", isTier2Overdue && "bg-red-50 text-red-600 border-red-100")}>
                                        {isTier2Overdue && <AlertTriangle className="h-3 w-3" />}
                                        {formatDate(item.tier2Date)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Buttons */}
                {isPaid ? (
                    <div className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-lg cursor-default">
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Settled & Reviewed</span>
                    </div>
                ) : (
                    <div className="grid gap-2">
                        {/* Tier 1 Button */}
                        {!tier1Paid && (
                            <Button
                                size="sm"
                                onClick={() => onMarkReceived(item, 'tier1')}
                                disabled={isStatementPending}
                                className={cn(
                                    "w-full h-9 text-xs font-semibold shadow-sm",
                                    isStatementPending
                                        ? "opacity-60 cursor-not-allowed bg-slate-100 text-slate-500 hover:bg-slate-100"
                                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                )}
                            >
                                {isStatementPending ? "Pending Statement" : (hasTier2 ? "Mark Tier 1 Received" : "Mark Received")}
                            </Button>
                        )}

                        {/* Tier 2 Button */}
                        {hasTier2 && tier1Paid && !tier2Paid && (
                            <Button
                                size="sm"
                                onClick={() => onMarkReceived(item, 'tier2')}
                                disabled={isStatementPending}
                                className={cn(
                                    "w-full h-9 text-xs font-semibold shadow-sm",
                                    isStatementPending
                                        ? "opacity-60 cursor-not-allowed bg-slate-100 text-slate-500 hover:bg-slate-100"
                                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                )}
                            >
                                {isStatementPending ? "Pending Statement" : "Mark Tier 2 Received"}
                            </Button>
                        )}
                    </div>
                )}
            </CardFooter>
        </Card>
    );
}

function PointsLoyaltyCard({ cardName, bankName, totalPoints, minPointsRedeem, onRedeem, onViewDetails, items, statementDay }) {
    const isRedeemable = totalPoints >= (minPointsRedeem || 0);
    const progress = minPointsRedeem > 0 ? Math.min((totalPoints / minPointsRedeem) * 100, 100) : 100;

    // Get Activities
    const activities = useMemo(() => getCardActivities(items || [], statementDay), [items, statementDay]);

    return (
        <div className="group relative flex flex-col justify-between border border-slate-200 dark:border-slate-800 rounded-xl p-4 transition-all duration-200 hover:shadow-md bg-white dark:bg-slate-950">
             {/* Header */}
             <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-indigo-50 dark:bg-indigo-900/50 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0 uppercase border border-indigo-100 dark:border-indigo-800">
                        {bankName ? bankName.substring(0,2) : 'CB'}
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 leading-tight line-clamp-1">{cardName}</h3>
                        <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Points Rewards</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-80 hover:opacity-100 transition-opacity" onClick={onViewDetails}>
                     <List className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                </Button>
            </div>

            {/* Body */}
            <div className={cn("text-center py-4 border-t border-slate-100 dark:border-slate-800 my-1", activities.length === 0 && "border-b")}>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Available Balance</p>
                <div className="flex items-baseline justify-center gap-1">
                    <span className="text-2xl font-black tracking-tight text-indigo-600 dark:text-indigo-400">
                        {currency(totalPoints)}
                    </span>
                    <span className="text-xs font-medium text-slate-400">pts</span>
                </div>

                {/* Min Redeem Progress */}
                {minPointsRedeem > 0 && (
                    <div className="mt-3 px-4">
                        <div className="flex justify-between text-[10px] mb-1.5 font-medium">
                            <span className={cn(isRedeemable ? "text-emerald-600" : "text-slate-400")}>
                                {isRedeemable ? "Redeemable" : "Accumulating"}
                            </span>
                            <span className="text-slate-400">{currency(minPointsRedeem)} min</span>
                        </div>
                        <Progress value={progress} className="h-1.5 bg-slate-100 dark:bg-slate-800" indicatorClassName={isRedeemable ? "bg-emerald-500" : "bg-indigo-400"} />
                    </div>
                )}
            </div>

            {/* Recent Activity */}
            {activities.length > 0 && (
                <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2">Recent Activity</p>
                    <div className="space-y-2">
                        {activities.map((act, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs">
                                <div className="flex flex-col">
                                    <span className="font-medium text-slate-700 dark:text-slate-300 line-clamp-1 max-w-[120px]" title={act.desc}>
                                        {act.desc}
                                    </span>
                                    <span className="text-[10px] text-slate-400">{act.displayDate}</span>
                                </div>
                                <span className={cn("font-bold", act.type === 'earned' ? "text-emerald-600" : "text-orange-600")}>
                                    {act.type === 'earned' ? '+' : '-'}{currency(act.amount)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

             {/* Footer */}
             <div className="mt-3">
                 <Button
                    onClick={onRedeem}
                    disabled={!isRedeemable}
                    className={cn(
                        "w-full h-8 text-xs font-semibold shadow-sm",
                         !isRedeemable ? "opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 hover:bg-slate-100" : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    )}
                 >
                    {!isRedeemable ? (
                        <>
                            <Lock className="h-3 w-3 mr-1.5" />
                            {minPointsRedeem > 0 ? `Reach ${currency(minPointsRedeem)}` : "Unavailable"}
                        </>
                    ) : (
                        <>
                            <Gift className="h-3 w-3 mr-1.5" />
                            Redeem Points
                        </>
                    )}
                </Button>
             </div>

            <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-50 dark:bg-slate-900 rounded-full border-r border-slate-200 dark:border-slate-800" />
            <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-50 dark:bg-slate-900 rounded-full border-l border-slate-200 dark:border-slate-800" />
        </div>
    );
}

// ==========================================
// 2. MAIN COMPONENT
// ==========================================

export default function CashbackTracker({
    cards,
    monthlySummary,
    onUpdate,
    rules,
    monthlyCategorySummary,
    onEditTransaction,
    onTransactionDeleted,
    onBulkDelete
}) {
    // --- STATE ---
    const [mainTab, setMainTab] = useState('cash'); // 'cash' | 'points'
    const [cashViewMode, setCashViewMode] = useState('month'); // 'month' | 'card' | 'list'
    const [statusFilter, setStatusFilter] = useState('unpaid');

    // New state for list view grouping
    const [listGroupBy, setListGroupBy] = useState('month'); // 'month' | 'card'
    const [showAllGroups, setShowAllGroups] = useState(false); // For accordion logic

    // Selection State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());

    // Dialog States
    const [editingSummary, setEditingSummary] = useState(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isRedeemDialogOpen, setIsRedeemDialogOpen] = useState(false);
    const [redeemTarget, setRedeemTarget] = useState(null); // { cardName, balance, items: [] }
    const [optimisticData, setOptimisticData] = useState({});

    // Points Details Sheet
    const [pointsDetailOpen, setPointsDetailOpen] = useState(false);
    const [selectedPointsCardId, setSelectedPointsCardId] = useState(null);

    // Shared Transaction Dialog
    const [txDialog, setTxDialog] = useState({
        isOpen: false,
        isLoading: false,
        transactions: [],
        title: ''
    });

    // --- DATA PROCESSING ---
    const { cashItems, pointsByCard, stats, cardMap } = useMemo(() => {
        if (!monthlySummary || !cards) return { cashItems: [], pointsByCard: [], stats: null, cardMap: new Map() };

        const cMap = new Map(cards.map(c => [c.id, c]));

        const cash = [];
        const points = [];
        const pCardMap = {}; // Group points by card for the Points Tab

        monthlySummary.forEach(originalSummary => {
            // Apply optimistic override if exists
            const optimistic = optimisticData[originalSummary.id] || {};
            const summary = {
                ...originalSummary,
                ...optimistic,
                // Ensure reviewed status is taken from optimistic data if present, otherwise fallback to original
                reviewed: optimistic.reviewed !== undefined ? optimistic.reviewed : (originalSummary.reviewed || false)
            };

            const card = cMap.get(summary.cardId);
            if (!card) return;

            const { total, tier1, tier2 } = calculateCashbackSplit(summary.actualCashback, summary.adjustment, card.overallMonthlyLimit);
            const tier1Method = card.tier1PaymentType || 'M+1';
            const tier2Method = card.tier2PaymentType || 'M+2';
            const redeemed = summary.amountRedeemed || 0;
            const tier1Paid = Math.min(redeemed, tier1);
            const tier2Paid = Math.max(0, redeemed - tier1);

            // Dates & Status (Note: paymentDueDay is no longer used for calc, but kept in signature or removed based on logic)
            // Updated to remove paymentDueDay from call as per new logic requirements
            const tier1Date = calculatePaymentDate(summary.month, tier1Method, card.statementDay);
            const tier1Status = getPaymentStatus(tier1, tier1Paid, tier1Date);
            const tier2Date = calculatePaymentDate(summary.month, tier2Method, card.statementDay);
            const tier2Status = getPaymentStatus(tier2, tier2Paid, tier2Date);

            // Note: If limit is 0, tier2 is 0. If isPoints is true, we generally assume the whole thing is points.
            // But logic supports split. For simplicity in categorization:
            // If primary tier is points, we treat as points item.
            const isPointsItem = (tier1Method && String(tier1Method).toLowerCase().includes('point'));

            const remainingDue = Math.max(0, total - redeemed);

            const item = {
                ...summary,
                cardName: card.name,
                bankName: card.bank,
                statementDay: card.statementDay, // Add statementDay for pending logic
                totalEarned: total,
                tier1Amount: tier1, tier1Date, tier1Status,
                tier2Amount: tier2, tier2Date, tier2Status,
                remainingDue,
                isPoints: isPointsItem,
                // reviewed is already merged in 'summary' above, but we keep it explicit if needed.
                // We don't need to re-default it here as 'summary' already has the merged value.
                reviewed: summary.reviewed,
            };

            if (isPointsItem) {
                points.push(item);
                // Aggregate for Points Tab
                if (!pCardMap[card.id]) {
                    pCardMap[card.id] = {
                        cardId: card.id,
                        cardName: card.name,
                        bankName: card.bank,
                        minPointsRedeem: card.minPointsRedeem || 0, // Ensure this is mapped
                        totalAmountRedeemed: card.totalAmountRedeemed || 0,
                        statementDay: card.statementDay,
                        totalPoints: 0,
                        totalRedeemed: 0,
                        history: [],
                        items: [] // Keep track of raw items for FIFO redemption
                    };
                }
                // Only add to total if it hasn't been "redeemed" in our logic
                pCardMap[card.id].totalPoints += remainingDue;
                pCardMap[card.id].totalRedeemed += (item.amountRedeemed || 0);
                pCardMap[card.id].items.push(item);
                if (remainingDue > 0) {
                    pCardMap[card.id].history.push({ month: summary.month, amount: remainingDue });
                }
            } else {
                cash.push(item);
            }
        });

        // Sort history inside points cards
        Object.values(pCardMap).forEach(pc => {
            pc.history.sort((a, b) => b.month.localeCompare(a.month)); // Descending for history display
            pc.items.sort((a, b) => a.month.localeCompare(b.month));   // Ascending for FIFO redemption
        });

        // Stats Calculation
        const totalCashback = cash.reduce((sum, item) => sum + item.totalEarned, 0);
        const amountReceived = cash.reduce((sum, item) => sum + (item.amountRedeemed || 0), 0);
        const amountPending = cash.reduce((sum, item) => sum + item.remainingDue, 0);

        const uniqueMonths = new Set(cash.map(i => i.month)).size;
        const avgMonthlyEarnings = uniqueMonths > 0 ? totalCashback / uniqueMonths : 0;

        const stats = {
            totalCashback,
            amountReceived,
            amountPending,
            avgMonthlyEarnings
        };

        return { cashItems: cash, pointsItems: points, pointsByCard: Object.values(pCardMap), stats, cardMap: cMap };
    }, [monthlySummary, cards, optimisticData]);

    // --- CASH FILTERING & GROUPING ---
    const filteredCashItems = useMemo(() => {
        return cashItems.filter(item => {
            if (statusFilter === 'all') return true;
            if (statusFilter === 'completed') return item.remainingDue <= 0;
            if (statusFilter === 'unpaid') return item.remainingDue > 0;
            if (statusFilter === 'overdue') return item.remainingDue > 0 && (item.tier1Status?.status === 'overdue' || item.tier2Status?.status === 'overdue');
            return true;
        });
    }, [cashItems, statusFilter]);

    const groupedCashData = useMemo(() => {
        const groups = {};
        const mode = cashViewMode === 'list' ? listGroupBy : cashViewMode;

        if (mode === 'month') {
            filteredCashItems.forEach(item => {
                // Use original YYYYMM as ID for sorting, but format the title
                if (!groups[item.month]) groups[item.month] = {
                    id: item.month,
                    title: fmtYMShort(item.month),
                    items: [],
                    due: 0,
                    earned: 0
                };
                groups[item.month].items.push(item);

                // Only count as "Due" for the header if the statement is finalized
                if (isStatementFinalized(item.month, item.statementDay)) {
                    groups[item.month].due += item.remainingDue;
                }

                groups[item.month].earned += item.totalEarned;
            });
            // Sort by ID (YYYYMM) descending
            return Object.values(groups).sort((a, b) => b.id.localeCompare(a.id));
        } else {
            filteredCashItems.forEach(item => {
                const key = item.cardName;
                if (!groups[key]) groups[key] = { title: key, bank: item.bankName, items: [], due: 0, earned: 0 };
                groups[key].items.push(item);

                // Only count as "Due" for the header if the statement is finalized
                if (isStatementFinalized(item.month, item.statementDay)) {
                    groups[key].due += item.remainingDue;
                }

                groups[key].earned += item.totalEarned;
            });
            return Object.values(groups).sort((a, b) => b.due - a.due || a.title.localeCompare(b.title));
        }
    }, [filteredCashItems, cashViewMode, listGroupBy]);

    // --- ACTIONS ---
    const handleEditClick = (item) => {
        setEditingSummary({
            id: item.id,
            adjustment: item.adjustment || 0,
            notes: item.notes || '',
            amountRedeemed: item.amountRedeemed || 0,
            cardName: item.cardName,
            month: item.month,
            isPoints: item.isPoints, // PASSING CONTEXT
            totalEarned: item.totalEarned // PASSING CONTEXT
        });
        setIsEditDialogOpen(true);
    };

    const handleSaveEdit = async (updatedItem) => {
        // Updated to receive updatedItem from dialog component
        try {
            const res = await fetch(`${API_BASE_URL}/monthly-summary/${updatedItem.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    adjustment: Number(updatedItem.adjustment),
                    notes: updatedItem.notes,
                    amountRedeemed: Number(updatedItem.amountRedeemed)
                })
            });

            if (!res.ok) throw new Error('Failed to update');

            toast.success("Updated successfully");
            setIsEditDialogOpen(false);
            if (onUpdate) onUpdate();

        } catch (err) {
            console.error(err);
            toast.error("Failed to update summary");
        }
    };

    // --- REVIEWED LOGIC ---
    const handleToggleReviewed = async (item) => {
        const newStatus = !item.reviewed;

        // Optimistic
        setOptimisticData(prev => ({
            ...prev,
            [item.id]: { reviewed: newStatus }
        }));

        try {
            const res = await fetch(`${API_BASE_URL}/monthly-summary/${item.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reviewed: newStatus })
            });

            if (!res.ok) throw new Error("Failed to update review status");

            if (onUpdate) onUpdate();
            toast.success(newStatus ? "Marked as Reviewed" : "Marked as Unreviewed");

        } catch (err) {
            console.error(err);
            toast.error("Failed to update status");
            // Revert
            setOptimisticData(prev => {
                const newState = { ...prev };
                delete newState[item.id];
                return newState;
            });
        }
    };

    // --- BULK SELECTION LOGIC ---
    const toggleSelectionMode = () => {
        setIsSelectionMode(prev => {
            if (prev) setSelectedIds(new Set()); // Clear on exit
            return !prev;
        });
    };

    const handleToggleSelect = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleBulkReview = async (status) => {
        const ids = Array.from(selectedIds);
        if (ids.length === 0) return;

        // Optimistic
        const optimisticUpdates = {};
        ids.forEach(id => {
            optimisticUpdates[id] = { reviewed: status };
        });
        setOptimisticData(prev => ({ ...prev, ...optimisticUpdates }));

        try {
            const res = await fetch(`${API_BASE_URL}/monthly-summary/bulk-review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids, reviewed: status })
            });

            if (!res.ok) throw new Error("Bulk update failed");

            toast.success(`Updated ${ids.length} items`);
            setSelectedIds(new Set());
            setIsSelectionMode(false);
            if (onUpdate) onUpdate();

        } catch (err) {
            console.error(err);
            toast.error("Failed to update items");
            // Revert is complex here, generally rely on refetch or specific error handling
            // For now, clear optimistic to prevent stuck state
            setOptimisticData(prev => {
                const newState = { ...prev };
                ids.forEach(id => delete newState[id]);
                return newState;
            });
        }
    };


    const handleMarkReceived = async (item, tier = 'full') => {
        // 0. Calculate values
        const originalAmountRedeemed = item.amountRedeemed || 0;
        let newAmountRedeemed = item.totalEarned; // Default full

        // Logic for partial/sequential tiers
        if (tier === 'tier1') {
            newAmountRedeemed = item.tier1Amount;
        } else if (tier === 'tier2') {
            // Tier 2 implies Tier 1 is already paid, so total is full amount
            newAmountRedeemed = item.tier1Amount + item.tier2Amount;
        }

        // 1. Optimistic Update
        setOptimisticData(prev => ({
            ...prev,
            [item.id]: { amountRedeemed: newAmountRedeemed }
        }));

        // 2. Define Revert Function (for Undo)
        const revert = () => {
             setOptimisticData(prev => ({
                ...prev,
                [item.id]: { amountRedeemed: originalAmountRedeemed }
            }));

            // We must send a request to server to ensure it rolls back
            // (in case the previous request already succeeded)
             fetch(`${API_BASE_URL}/monthly-summary/${item.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amountRedeemed: originalAmountRedeemed })
            }).then(() => {
                 if (onUpdate) onUpdate();
            }).catch(err => {
                 console.error("Undo failed", err);
                 toast.error("Failed to undo");
            });
        };

        // 3. Show Toast with Undo
        toast.success(`Updated ${item.cardName} payment status`, {
            action: {
                label: 'Undo',
                onClick: () => revert()
            }
        });

        // 4. Perform API Call
        try {
            const res = await fetch(`${API_BASE_URL}/monthly-summary/${item.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amountRedeemed: newAmountRedeemed
                })
            });

            if (!res.ok) throw new Error('Failed to mark as received');

            // Success - trigger update to eventual consistency
            if (onUpdate) onUpdate();

        } catch (err) {
            console.error(err);
            toast.error("Failed to update status");
            // Revert optimistic update on error
            setOptimisticData(prev => {
                const newState = { ...prev };
                delete newState[item.id];
                return newState;
            });
        }
    };

    const handleOpenRedeem = (cardData) => {
        setRedeemTarget(cardData);
        // Cleaned up reset of other states as they are now handled inside the dialog component
        setIsRedeemDialogOpen(true);
    };

    const handleOpenDetails = (cardData) => {
        setSelectedPointsCardId(cardData.cardId);
        setPointsDetailOpen(true);
    };

    const handleRedeemConfirm = async ({ amount, notes, date }) => {
        // Refactored to accept object from RedeemPointsDialog
        const amountToRedeem = Number(amount);

        // Validation handled in dialog, double check here
        if (!redeemTarget || isNaN(amountToRedeem) || amountToRedeem <= 0) {
            toast.error("Invalid amount");
            return;
        }

        if (amountToRedeem > redeemTarget.totalPoints) {
             toast.error("Cannot redeem more than available balance");
             return;
        }

        // FIFO Logic
        let remainingToRedeem = amountToRedeem;
        const updates = [];

        // We need to iterate over the items that have remaining balance
        // The items are already sorted by month ASC in pointsByCard logic
        const items = redeemTarget.items.filter(i => i.remainingDue > 0);

        for (const item of items) {
            if (remainingToRedeem <= 0) break;

            const availableInItem = item.remainingDue;
            const redeemFromThis = Math.min(remainingToRedeem, availableInItem);

            // Calculate new total redeemed for this item
            // current redeemed + this redemption
            const newAmountRedeemed = (item.amountRedeemed || 0) + redeemFromThis;

            // Append notes if provided
            // Use provided date (YYYY-MM-DDTHH:mm) or fallback to simple date.
            // We want format YYYY-MM-DD HH:mm for the log.
            // Input 'date' is from datetime-local, which is YYYY-MM-DDTHH:mm
            const zonedNow = getZonedDate();
            const localZonedDateStr = `${zonedNow.getFullYear()}-${String(zonedNow.getMonth() + 1).padStart(2, '0')}-${String(zonedNow.getDate()).padStart(2, '0')} ${String(zonedNow.getHours()).padStart(2, '0')}:${String(zonedNow.getMinutes()).padStart(2, '0')}`;
            const formattedDate = date ? date.replace('T', ' ') : localZonedDateStr;

            const noteEntry = `[Redeemed ${redeemFromThis} on ${formattedDate}${notes ? ': ' + notes : ''}]`;
            const newNotes = item.notes ? `${item.notes}\n${noteEntry}` : noteEntry;

            updates.push({
                id: item.id,
                amountRedeemed: newAmountRedeemed,
                notes: newNotes,
                // Store original for undo
                originalAmountRedeemed: item.amountRedeemed || 0,
                originalNotes: item.notes
            });

            remainingToRedeem -= redeemFromThis;
        }

        // 1. Optimistic Update
        const optimisticUpdates = {};
        updates.forEach(u => {
            optimisticUpdates[u.id] = {
                amountRedeemed: u.amountRedeemed,
                notes: u.notes
            };
        });

        setOptimisticData(prev => ({
            ...prev,
            ...optimisticUpdates
        }));

        // Close dialog immediately
        setIsRedeemDialogOpen(false);

        // 2. Define Revert Function (for Undo)
        const revert = () => {
             // Revert local state
             const revertUpdates = {};
             updates.forEach(u => {
                 revertUpdates[u.id] = {
                     amountRedeemed: u.originalAmountRedeemed,
                     notes: u.originalNotes
                 };
             });

             setOptimisticData(prev => ({
                ...prev,
                ...revertUpdates
            }));

            // Send requests to server to roll back
            Promise.all(updates.map(u =>
                 fetch(`${API_BASE_URL}/monthly-summary/${u.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amountRedeemed: u.originalAmountRedeemed,
                        notes: u.originalNotes
                    })
                })
            )).then(() => {
                 if (onUpdate) onUpdate();
            }).catch(err => {
                 console.error("Undo failed", err);
                 toast.error("Failed to undo redemption");
            });
        };

        // 3. Show Toast
        toast.success(`Redeemed ${amountToRedeem} points from ${redeemTarget.cardName}`, {
            action: {
                label: 'Undo',
                onClick: () => revert()
            }
        });

        try {
            // Execute all updates
            await Promise.all(updates.map(u =>
                 fetch(`${API_BASE_URL}/monthly-summary/${u.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amountRedeemed: u.amountRedeemed,
                        notes: u.notes
                    })
                })
            ));

            if (onUpdate) onUpdate();

        } catch (err) {
            console.error(err);
            toast.error("Failed to process redemption");
            // Revert optimistic update on error
            setOptimisticData(prev => {
                const newState = { ...prev };
                updates.forEach(u => delete newState[u.id]);
                return newState;
            });
        }
    };

    const handleViewTransactions = async (item) => {
        setTxDialog({
            isOpen: true,
            isLoading: true,
            transactions: [],
            title: `Transactions - ${item.cardName} (${fmtYMShort(item.month)})`
        });

        try {
            // 1. Fetch transactions using the dedicated API filters
            // The API handles the logic: matches 'Cashback Month' formula AND 'Card' relation
            const res = await fetch(`${API_BASE_URL}/transactions?month=${item.month}&filterBy=cashbackMonth&cardId=${item.cardId}`);

            if (!res.ok) throw new Error('Failed to fetch transactions');

            const allTransactions = await res.json();

            // 2. FIX: Removed the incorrect client-side filtering.
            // The API has already returned exactly what we need (transactions for this card in this month).

            setTxDialog({
                isOpen: true,
                isLoading: false,
                transactions: allTransactions, // <--- Pass the API results directly
                title: `Transactions - ${item.cardName} (${fmtYMShort(item.month)})`
            });

        } catch (err) {
            console.error(err);
            toast.error("Could not load transactions");
            setTxDialog({ isOpen: false, isLoading: false, transactions: [], title: '' });
        }
    };

    const handleUndoRedemption = async (event) => {
        if (!event || !event.contributors || event.contributors.length === 0) return;

        const updates = event.contributors.map(c => {
             // 1. Strip the log from notes
             // Since regex is global, we need to be careful. String replace of the exact original log is safest.
             // But notes might have trailing newlines.

             // Find the original item from monthlySummary
             const item = monthlySummary.find(i => i.id === c.itemId);
             if(!item) return null;

             let newNotes = item.notes.replace(c.originalLog, '').trim();
             // Clean up extra newlines if any
             newNotes = newNotes.replace(/\n\s*\n/g, '\n').trim();

             // 2. Reduce amountRedeemed
             // If we just undo, we subtract.
             // Note: If user edited AMOUNT manually outside of this flow, this logic assumes consistent state.
             const newAmount = Math.max(0, (item.amountRedeemed || 0) - c.amount);

             return {
                 id: item.id,
                 notes: newNotes,
                 amountRedeemed: newAmount,
                 // For optimistic
                 originalNotes: item.notes,
                 originalAmount: item.amountRedeemed
             };
        }).filter(Boolean);

        if (updates.length === 0) return;

        // Optimistic Update
        const optimisticUpdates = {};
        updates.forEach(u => {
            optimisticUpdates[u.id] = { amountRedeemed: u.amountRedeemed, notes: u.notes };
        });
        setOptimisticData(prev => ({ ...prev, ...optimisticUpdates }));

        toast.promise(
            Promise.all(updates.map(u =>
                 fetch(`${API_BASE_URL}/monthly-summary/${u.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amountRedeemed: u.amountRedeemed,
                        notes: u.notes
                    })
                })
            )),
            {
                loading: 'Reverting redemption...',
                success: () => {
                    if (onUpdate) onUpdate();
                    return 'Redemption reverted successfully';
                },
                error: (err) => {
                    // Revert optimistic
                    setOptimisticData(prev => {
                        const newState = { ...prev };
                        updates.forEach(u => delete newState[u.id]);
                        return newState;
                    });
                    return 'Failed to revert redemption';
                }
            }
        );
    };

    // --- HELPER FOR LIST VIEW ---
    const renderListView = () => {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                     <span className="text-sm text-slate-500 font-medium">Group By:</span>
                     <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        <button
                            onClick={() => setListGroupBy('month')}
                            className={cn("px-3 py-1 rounded-md text-xs font-semibold transition-all", listGroupBy === 'month' ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100" : "text-slate-500")}
                        >
                            Month
                        </button>
                        <button
                            onClick={() => setListGroupBy('card')}
                            className={cn("px-3 py-1 rounded-md text-xs font-semibold transition-all", listGroupBy === 'card' ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100" : "text-slate-500")}
                        >
                            Card
                        </button>
                     </div>
                </div>

                <div className="rounded-md border bg-white dark:bg-slate-950">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {isSelectionMode && <TableHead className="w-[30px] p-2"><div className="w-4" /></TableHead>}
                                <TableHead className="w-[120px]">Month</TableHead>
                                <TableHead>Card</TableHead>
                                <TableHead className="text-right">Total Earned</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                                <TableHead className="text-right">Tier 1</TableHead>
                                <TableHead className="text-right">Tier 2</TableHead>
                                <TableHead className="text-center w-[120px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {groupedCashData.map(group => (
                                <React.Fragment key={group.title}>
                                    <TableRow className="bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-100 dark:hover:bg-slate-800/50">
                                        <TableCell colSpan={isSelectionMode ? 8 : 7} className="font-bold text-slate-700 dark:text-slate-300 py-2">
                                            {group.title} <span className="text-slate-400 font-normal text-xs ml-2">({group.items.length} items)</span>
                                        </TableCell>
                                    </TableRow>
                                    {group.items.map(item => {
                                        const isPaid = item.remainingDue <= 0;
                                        const tier1Paid = (item.amountRedeemed || 0) >= item.tier1Amount;
                                        const isStatementPending = !isStatementFinalized(item.month, item.statementDay);
                                        const isReviewed = item.reviewed;

                                        const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'}) : '-';

                                        return (
                                            <TableRow key={item.id} className="group hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                                {isSelectionMode && (
                                                    <TableCell className="p-2">
                                                        <Checkbox
                                                            checked={selectedIds.has(item.id)}
                                                            onCheckedChange={() => handleToggleSelect(item.id)}
                                                        />
                                                    </TableCell>
                                                )}
                                                <TableCell className="font-mono text-slate-600 dark:text-slate-400 py-3">
                                                    <div className="flex items-center gap-2">
                                                        {fmtYMShort(item.month)}
                                                        {isReviewed && <Badge variant="outline" className="text-[9px] h-4 px-1 py-0 text-indigo-600 border-indigo-200">Reviewed</Badge>}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <div className="font-medium text-slate-900 dark:text-slate-100">{item.cardName}</div>
                                                    <div className="text-[10px] text-slate-400">{item.bankName}</div>
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-emerald-600 py-3">
                                                    {currency(item.totalEarned)}
                                                </TableCell>
                                                <TableCell className="text-right py-3">
                                                    <Badge variant={isPaid ? "outline" : "default"} className={cn("text-[10px]", isPaid ? "text-emerald-600 border-emerald-200" : isStatementPending ? "bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200" : "bg-slate-600")}>
                                                        {isPaid ? "Settled" : isStatementPending ? "Stmt Pending" : "Unpaid"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right py-3">
                                                    <div className="text-xs">
                                                        <div>{currency(item.tier1Amount)}</div>
                                                        <div className={cn("text-[10px]", item.tier1Status?.status === 'overdue' ? "text-red-500" : "text-slate-400")}>
                                                            {formatDate(item.tier1Date)}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right py-3">
                                                    {item.tier2Amount > 0 ? (
                                                        <div className="text-xs">
                                                            <div>{currency(item.tier2Amount)}</div>
                                                            <div className={cn("text-[10px]", item.tier2Status?.status === 'overdue' ? "text-red-500" : "text-slate-400")}>
                                                                {formatDate(item.tier2Date)}
                                                            </div>
                                                        </div>
                                                    ) : <span className="text-slate-300">-</span>}
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <div className="flex justify-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600" onClick={() => handleViewTransactions(item)} title="View Transactions">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className={cn("h-8 w-8", isReviewed ? "text-indigo-600" : "text-slate-400 hover:text-indigo-600")}
                                                            onClick={() => handleToggleReviewed(item)}
                                                            title={isReviewed ? "Mark Unreviewed" : "Mark Reviewed"}
                                                        >
                                                            <ClipboardCheck className="h-4 w-4" />
                                                        </Button>
                                                        {!isPaid && (
                                                            <Button
                                                                size="sm"
                                                                disabled={isStatementPending}
                                                                className={cn("h-8 text-[10px] px-2", isStatementPending ? "opacity-50" : "bg-emerald-600 hover:bg-emerald-700 text-white")}
                                                                onClick={() => handleMarkReceived(item, !tier1Paid ? 'tier1' : 'tier2')}
                                                            >
                                                                {isStatementPending ? "Pending" : (!tier1Paid ? (item.tier2Amount > 0 ? "Pay T1" : "Pay") : "Pay T2")}
                                                            </Button>
                                                        )}
                                                        {isPaid && <CheckCircle className="h-5 w-5 text-emerald-500 opacity-50 ml-1" />}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        );
    };

    // --- RENDER ---
    return (
        <div className="space-y-6">

            {/* MAIN TAB SWITCHER */}
            <div className="flex justify-center">
                <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-full inline-flex">
                    <button
                        onClick={() => setMainTab('cash')}
                        className={cn("px-6 py-2 rounded-full text-sm font-semibold transition-all", mainTab === 'cash' ? "bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200")}
                    >
                        Balances
                    </button>
                    <button
                        onClick={() => setMainTab('points')}
                        className={cn("px-6 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2", mainTab === 'points' ? "bg-white dark:bg-slate-950 text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200")}
                    >
                        <Coins className="h-4 w-4" /> Rewards Points
                    </button>
                </div>
            </div>

            {/* ===== CASH VIEW ===== */}
            {mainTab === 'cash' && (
                <div className="space-y-6">

                    {/* Stats Cards */}
                    {stats && (
                        <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
                            <StatCard
                                title="Total Cashback"
                                value={currency(stats.totalCashback)}
                                numericValue={stats.totalCashback}
                                icon={<Wallet className="h-4 w-4 text-muted-foreground" />}
                                currencyFn={currency}
                            />
                            <StatCard
                                title="Received"
                                value={currency(stats.amountReceived)}
                                numericValue={stats.amountReceived}
                                icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
                                currencyFn={currency}
                            />
                            <StatCard
                                title="Pending"
                                value={currency(stats.amountPending)}
                                numericValue={stats.amountPending}
                                icon={<Clock className="h-4 w-4 text-muted-foreground" />}
                                currencyFn={currency}
                                invertTrendColor={true} // High pending might be considered 'bad' or just needs distinct color
                            />
                            <StatCard
                                title="Avg. Monthly"
                                value={currency(stats.avgMonthlyEarnings)}
                                numericValue={stats.avgMonthlyEarnings}
                                icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
                                currencyFn={currency}
                            />
                        </div>
                    )}

                    {/* Controls */}
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                        <Tabs value={cashViewMode} onValueChange={setCashViewMode} className="w-full md:w-auto">
                            <TabsList>
                                <TabsTrigger value="month" className="gap-2"><Clock className="h-4 w-4"/> By Month</TabsTrigger>
                                <TabsTrigger value="card" className="gap-2"><Calendar className="h-4 w-4"/> By Card</TabsTrigger>
                                <TabsTrigger value="list" className="gap-2"><List className="h-4 w-4"/> List View</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <Button
                                variant={isSelectionMode ? "secondary" : "outline"}
                                size="sm"
                                onClick={toggleSelectionMode}
                                className={cn("gap-2", isSelectionMode ? "bg-slate-200 dark:bg-slate-800" : "")}
                            >
                                {isSelectionMode ? <X className="h-4 w-4" /> : <ClipboardCheck className="h-4 w-4" />}
                                {isSelectionMode ? "Cancel" : "Select"}
                            </Button>
                            <div className="relative w-full md:w-[200px]">
                                <Filter className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-full pl-9">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Show All</SelectItem>
                                        <SelectItem value="unpaid">Unpaid Only</SelectItem>
                                        <SelectItem value="overdue">Overdue Only</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Cash Content */}
                    {groupedCashData.length === 0 ? (
                        <div className="text-center py-20 opacity-50 border-2 border-dashed border-slate-200 rounded-xl">
                            <Wallet className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                            <p className="text-slate-500">No cash records found.</p>
                        </div>
                    ) : (
                        cashViewMode === 'list' ? renderListView() : (
                            <div className="space-y-8">
                                {/* First Group (Always Visible) */}
                                {groupedCashData.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex items-end justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                                            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2 text-slate-800 dark:text-slate-100">
                                                {groupedCashData[0].title}
                                                {groupedCashData[0].due > 0 && <Badge variant="destructive" className="ml-2">{currency(groupedCashData[0].due)} ₫ Due</Badge>}
                                            </h2>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {groupedCashData[0].items.map(item => (
                                                <CashVoucherCard
                                                    key={item.id}
                                                    item={item}
                                                    statementDay={item.statementDay}
                                                    onMarkReceived={handleMarkReceived}
                                                    onEdit={handleEditClick}
                                                    onViewTransactions={handleViewTransactions}
                                                    onToggleReviewed={handleToggleReviewed}
                                                    isSelectionMode={isSelectionMode}
                                                    isSelected={selectedIds.has(item.id)}
                                                    onToggleSelect={() => handleToggleSelect(item.id)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Remaining Groups Accordion */}
                                {groupedCashData.length > 1 && (
                                    <div className="relative">
                                        {/* Button to show remaining */}
                                        {!showAllGroups && (
                                            <div className="flex justify-center mt-6">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setShowAllGroups(true)}
                                                    className="gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                                                >
                                                    <ArrowDown className="h-4 w-4" />
                                                    View remaining {groupedCashData.length - 1} {cashViewMode === 'month' ? 'months' : 'cards'}
                                                </Button>
                                            </div>
                                        )}

                                        {/* Hidden Groups */}
                                        {showAllGroups && (
                                            <div className="space-y-8 mt-8 animate-in fade-in slide-in-from-top-4 duration-300">
                                                {groupedCashData.slice(1).map((group) => (
                                                    <div key={group.title} className="space-y-3">
                                                        <div className="flex items-end justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                                                            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2 text-slate-800 dark:text-slate-100">
                                                                {group.title}
                                                                {group.due > 0 && <Badge variant="destructive" className="ml-2">{currency(group.due)} ₫ Due</Badge>}
                                                            </h2>
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                                            {group.items.map(item => (
                                                                <CashVoucherCard
                                                                    key={item.id}
                                                                    item={item}
                                                                    statementDay={item.statementDay}
                                                                    onMarkReceived={handleMarkReceived}
                                                                    onEdit={handleEditClick}
                                                                    onViewTransactions={handleViewTransactions}
                                                                    onToggleReviewed={handleToggleReviewed}
                                                                    isSelectionMode={isSelectionMode}
                                                                    isSelected={selectedIds.has(item.id)}
                                                                    onToggleSelect={() => handleToggleSelect(item.id)}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="flex justify-center pt-4">
                                                     <Button
                                                        variant="ghost"
                                                        onClick={() => setShowAllGroups(false)}
                                                        className="text-xs text-slate-400 hover:text-slate-600"
                                                    >
                                                        Collapse history
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    )}
                </div>
            )}

            {/* ===== POINTS VIEW ===== */}
            {mainTab === 'points' && (
                <div className="space-y-6">

                    {/* Points Hero Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Available Balance */}
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 -mr-10 -mt-10 bg-white/10 h-64 w-64 rounded-full blur-3xl pointer-events-none"></div>
                            <div className="relative z-10">
                                <p className="text-indigo-100 font-medium mb-1">Total Rewards Value</p>
                                <h2 className="text-4xl font-bold tracking-tight">
                                    {currency(pointsByCard.reduce((acc, c) => acc + c.totalPoints, 0))} <span className="text-lg font-normal opacity-80">pts</span>
                                </h2>
                                <p className="text-sm text-indigo-200 mt-2"> across {pointsByCard.length} cards</p>
                            </div>
                        </div>

                        {/* Redeemed Balance */}
                        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 -mr-10 -mt-10 bg-white/10 h-64 w-64 rounded-full blur-3xl pointer-events-none"></div>
                            <div className="relative z-10">
                                <p className="text-emerald-100 font-medium mb-1">Total Redeemed</p>
                                <h2 className="text-4xl font-bold tracking-tight">
                                    {currency(pointsByCard.reduce((acc, c) => acc + (c.totalRedeemed || 0), 0))} <span className="text-lg font-normal opacity-80">pts</span>
                                </h2>
                                <p className="text-sm text-emerald-200 mt-2"> realized value</p>
                            </div>
                        </div>
                    </div>

                    {/* Points Card Grid */}
                    {pointsByCard.length === 0 ? (
                        <div className="text-center py-20 opacity-50 border-2 border-dashed border-slate-200 rounded-xl">
                            <Coins className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                            <p className="text-slate-500">No points cards active.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pointsByCard.map(card => (
                                <PointsLoyaltyCard
                                    key={card.cardId}
                                    cardName={card.cardName}
                                    bankName={card.bankName}
                                    totalPoints={card.totalPoints}
                                    minPointsRedeem={card.minPointsRedeem}
                                    onRedeem={() => handleOpenRedeem(card)}
                                    onViewDetails={() => handleOpenDetails(card)}
                                    items={card.items}
                                    statementDay={card.statementDay}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* EDIT DIALOG (CASH & POINTS) */}
            <UpdateDetailsDialog
                isOpen={isEditDialogOpen}
                onClose={() => setIsEditDialogOpen(false)}
                onSave={handleSaveEdit}
                item={editingSummary}
            />

            {/* REDEEM DIALOG (POINTS) */}
            <RedeemPointsDialog
                isOpen={isRedeemDialogOpen}
                onClose={() => setIsRedeemDialogOpen(false)}
                onConfirm={handleRedeemConfirm}
                target={redeemTarget}
            />

            {/* BULK ACTION BAR */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 dark:bg-slate-100/90 text-white dark:text-slate-900 px-6 py-3 rounded-full shadow-lg backdrop-blur-sm z-50 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-200">
                    <span className="text-sm font-semibold">{selectedIds.size} Selected</span>
                    <div className="h-4 w-px bg-white/20 dark:bg-black/20" />
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-white dark:text-slate-900 hover:bg-white/20 dark:hover:bg-black/10 h-8"
                        onClick={() => handleBulkReview(true)}
                    >
                        Mark Reviewed
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-white dark:text-slate-900 hover:bg-white/20 dark:hover:bg-black/10 h-8"
                        onClick={() => handleBulkReview(false)}
                    >
                        Unmark
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-white dark:hover:text-slate-900 hover:bg-transparent h-8 w-8 ml-2"
                        onClick={() => setSelectedIds(new Set())}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            <PointsDetailSheet
                isOpen={pointsDetailOpen}
                onClose={() => setPointsDetailOpen(false)}
                cardData={pointsByCard.find(c => c.cardId === selectedPointsCardId)}
                onEdit={handleEditClick}
                onToggleReviewed={handleToggleReviewed}
                onViewTransactions={handleViewTransactions}
                onUndoRedemption={handleUndoRedemption}
                currencyFn={currency}
            />

            <SharedTransactionsDialog
                isOpen={txDialog.isOpen}
                isLoading={txDialog.isLoading}
                onClose={() => setTxDialog(prev => ({ ...prev, isOpen: false }))}
                transactions={txDialog.transactions}
                title={txDialog.title}
                description="List of transactions associated with this cashback period."
                currencyFn={currency}
                cardMap={cardMap}
                rules={rules}
                allCards={cards}
                monthlyCategorySummary={monthlyCategorySummary}
                onEdit={onEditTransaction}
                onDelete={onTransactionDeleted}
                onBulkDelete={onBulkDelete}
            />

        </div>
    );
}
import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Plus, ArrowRight } from 'lucide-react';

export default function PaymentLogDialog({ isOpen, onClose, statement, onSave, currencyFn, fmtYMShortFn }) {
    const [amount, setAmount] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            // Pre-fill with remaining amount and format it with commas
            const remaining = (statement.statementAmount || 0) - (statement.paidAmount || 0);
            setAmount(remaining > 0 ? remaining.toLocaleString('en-US') : '');

            // Add a short delay before focusing to allow the dialog to animate in
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 150);

            return () => clearTimeout(timer);
        }
    }, [isOpen, statement]);

    // Handler to format the input with commas
    const handleAmountChange = (e) => {
        const value = e.target.value.replace(/,/g, ''); // Remove existing commas
        if (!isNaN(value) && value.length <= 15) {
            // Format the number with commas, or set to empty if input is cleared
            setAmount(value ? Number(value).toLocaleString('en-US') : '');
        } else if (value === '') {
            setAmount('');
        }
    };

    const handleSave = () => {
        // Parse the comma-separated string back to a number
        const numericAmount = parseFloat(String(amount).replace(/,/g, ''));
        if (isNaN(numericAmount) || numericAmount <= 0) return;

        const newPaidAmount = (statement.paidAmount || 0) + numericAmount;
        onSave(statement.id, newPaidAmount);
        onClose();
    };

    if (!statement) return null;

    const currentPaid = statement.paidAmount || 0;
    const totalDue = statement.statementAmount || 0;
    const remaining = totalDue - currentPaid;

    // Calculate projected values
    const numericInput = parseFloat(String(amount).replace(/,/g, '')) || 0;
    const newTotalPaid = currentPaid + numericInput;
    const newRemaining = Math.max(0, totalDue - newTotalPaid);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Log Payment</DialogTitle>
                    <DialogDescription>For {statement.card.name} - {fmtYMShortFn(statement.month)}</DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Visual Summary */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Statement Balance:</span>
                            <span className="font-semibold">{currencyFn(totalDue)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Currently Paid:</span>
                            <span className="font-medium">{currencyFn(currentPaid)}</span>
                        </div>
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between font-bold">
                            <span>Remaining Due:</span>
                            <span className={remaining > 0 ? "text-red-600" : "text-emerald-600"}>{currencyFn(remaining)}</span>
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="space-y-2">
                        <label htmlFor="payment-amount" className="text-sm font-medium flex items-center gap-2">
                            <Plus className="h-4 w-4 text-emerald-600" />
                            Amount to Add
                        </label>
                        <Input
                            ref={inputRef}
                            id="payment-amount"
                            type="text"
                            inputMode="numeric"
                            value={amount}
                            onChange={handleAmountChange}
                            placeholder="Enter amount to add"
                            className="text-lg font-medium"
                        />
                    </div>

                    {/* Projected Result */}
                    {numericInput > 0 && (
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/30 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="flex items-center justify-between text-sm text-emerald-800 dark:text-emerald-300">
                                <span className="font-medium">New Total Paid:</span>
                                <div className="flex items-center gap-2 font-bold">
                                    <span className="opacity-50 line-through text-xs">{currencyFn(currentPaid)}</span>
                                    <ArrowRight className="h-3 w-3" />
                                    <span>{currencyFn(newTotalPaid)}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                                <span>New Remaining:</span>
                                <span className="font-bold">{currencyFn(newRemaining)}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={numericInput <= 0}>Confirm Payment</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../../ui/sheet';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '../../ui/drawer';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';
import { cn } from '../../../lib/utils';
import {
  Search,
  Loader2,
  Sparkles,
  Wallet,
  DollarSign,
  AlertTriangle,
  History,
  Globe,
  ExternalLink,
  Store,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Layers,
  X,
  Plane
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- SUB-COMPONENTS ---

function MethodSelector({ method, setMethod }) {
    const methods = [
        { id: 'All', label: 'All', icon: Layers },
        { id: 'POS', label: 'POS', icon: Store },
        { id: 'eCom', label: 'eCom', icon: Globe },
        { id: 'International', label: 'Int.', icon: Plane },
    ];

    return (
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            {methods.map((m) => {
                const Icon = m.icon;
                return (
                    <button
                        key={m.id}
                        type="button"
                        onClick={() => setMethod(m.id)}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-medium rounded-md transition-all",
                            method === m.id
                                ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                    >
                        <Icon className="h-3.5 w-3.5" />
                        {m.label}
                    </button>
                );
            })}
        </div>
    );
}

function QuickAmounts({ selected, onSelect }) {
    const amounts = [
        { label: '100k', value: '100,000' },
        { label: '200k', value: '200,000' },
        { label: '500k', value: '500,000' },
        { label: '1m', value: '1,000,000' },
        { label: 'Other', value: 'other' },
    ];

    return (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1 no-scrollbar">
            {amounts.map((amt) => {
                const isActive = selected === amt.value || (amt.value === 'other' && selected === 'other');
                return (
                    <button
                        key={amt.label}
                        type="button"
                        onClick={() => onSelect(amt.value)}
                        className={cn(
                            "flex-shrink-0 px-2.5 py-1 text-xs font-medium rounded-md transition-colors border",
                            isActive
                                ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 border-transparent"
                                : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-transparent hover:border-slate-300 dark:hover:border-slate-600"
                        )}
                    >
                        {amt.label}
                    </button>
                );
            })}
        </div>
    );
}


function CapProgressBar({ current, limit, label, icon: Icon, currencyFn, rate }) {
    if (!limit || limit === Infinity) return null;
    const remainingCashback = Math.max(0, limit - current);
    const percent = Math.min(100, Math.max(0, (current / limit) * 100));
    const isNearCap = percent > 85;

    // If rate is provided, show spend left. Otherwise show cashback left.
    let displayText = `${currencyFn(remainingCashback)} left`;
    if (rate && rate > 0) {
        const remainingSpend = remainingCashback / rate;
        displayText = `${currencyFn(remainingSpend)} spend left`;
    }

    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    {Icon && <Icon className="h-3 w-3" />}
                    {label}
                </span>
                <span className={cn("font-medium", isNearCap ? "text-red-600 dark:text-red-400" : "text-slate-600 dark:text-slate-300")}>
                    {displayText}
                </span>
            </div>
            <Progress value={percent} className="h-1.5" indicatorClassName={isNearCap ? "bg-red-500" : "bg-sky-500"} />
        </div>
    );
}

function RankingCard({ rank, item, currencyFn, isExpanded, onToggle }) {
    // UPDATED: Destructure isInactive and isCapped from item to be explicit, though local calculation also works
    const { card, rule, calculatedCashback, isMinSpendMet, remainingCategoryCashback, monthlyLimit, monthlyCashback, isInactive, isMonthlyCapReached, isCategoryCapReached, effectiveMethod } = item;

    // Fallback if not passed in item (safety)
    const _isInactive = isInactive ?? (rule.status !== 'Active');
    const _isCapped = (isMonthlyCapReached || isCategoryCapReached);

    const isWinner = rank === 1;

    // Rate Badge Color Logic
    const getRateColor = (rate) => {
        if (rate >= 0.15) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
        if (rate >= 0.10) return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border-sky-200 dark:border-sky-800';
        if (rate >= 0.05) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    };

    // Construct match description
    let matchDesc = "Match: Payment Method";
    if (rule.mccCodes?.length > 0) {
        matchDesc = "Match: MCC Code";
    } else if (rule.isDefault) {
        matchDesc = "Match: Default Cashback";
    }

    // Append method info if relevant
    if (effectiveMethod && effectiveMethod !== 'All') {
        matchDesc += ` (${effectiveMethod})`;
    }

    return (
        <div className={cn(
            "rounded-xl border transition-all overflow-hidden",
            isWinner
                ? "bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-800 shadow-sm"
                : "bg-slate-50 dark:bg-slate-900/50 border-transparent hover:border-slate-200 dark:hover:border-slate-700",
            (_isCapped || _isInactive) && !isWinner && "opacity-70 bg-slate-100 dark:bg-slate-900"
        )}>
            {/* --- CARD HEADER --- */}
            <div
                role="button"
                tabIndex={0}
                aria-expanded={isWinner || isExpanded}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
                className={cn("p-4 flex items-center justify-between cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500 rounded-t-xl", isWinner ? "py-5" : "py-3")}
                onClick={onToggle}
            >
                <div className="flex items-center gap-4 flex-1">
                    {/* Visual Hierarchy: Rank Indicator */}
                    {!isWinner && (
                         <div className="w-6 text-center text-sm font-bold text-slate-300 dark:text-slate-600 shrink-0">
                             {rank}
                         </div>
                    )}
                    {isWinner && (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                            <Sparkles className="h-5 w-5 fill-current" />
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className={cn("font-bold text-slate-900 dark:text-slate-100 leading-tight", isWinner ? "text-lg" : "text-base")}>
                                {card.name}
                            </h3>
                            {isWinner && <Badge className="bg-emerald-500 hover:bg-emerald-600 border-none text-white text-[10px] px-1.5 h-5 shrink-0">Best Choice</Badge>}

                            {/* Status Badges */}
                            {_isInactive && (
                                <Badge variant="destructive" className="text-[10px] h-5 px-1.5 shrink-0">Inactive</Badge>
                            )}
                            {_isCapped && (
                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 shrink-0">Maxed Out</Badge>
                            )}
                            {!isMinSpendMet && (
                                <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-amber-600 border-amber-200 dark:text-amber-400 dark:border-amber-800 shrink-0">Min Spend</Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                           <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", rule.status === 'Active' ? "bg-emerald-500" : "bg-slate-300")} />
                           <span className="truncate">{rule.ruleName}</span>
                        </p>
                    </div>
                </div>

                <div className="text-right pl-2 shrink-0">
                    <Badge variant="outline" className={cn("font-extrabold text-sm border", getRateColor(rule.rate))}>
                        {(rule.rate * 100).toFixed(1)}%
                    </Badge>
                    {calculatedCashback !== null && (
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                            +{currencyFn(calculatedCashback)}
                        </p>
                    )}
                </div>
            </div>

            {/* --- EXPANDABLE DETAILS --- */}
            <AnimatePresence initial={false}>
                {(isWinner || isExpanded) && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
                    >
                        <div className="p-4 space-y-4">
                             {/* Criteria Display (Simplified) */}
                             <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 p-2 rounded-md border border-slate-200 dark:border-slate-700">
                                {matchDesc}
                             </div>

                             {/* Warnings */}
                            {!isMinSpendMet && (
                                <div className="flex items-center gap-2 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-md border border-amber-200 dark:border-amber-800">
                                    <AlertTriangle className="h-4 w-4" />
                                    Warning: Monthly minimum spend not yet met.
                                </div>
                            )}

                            {/* Caps & Limits */}
                            <div className="grid grid-cols-1 gap-3">
                                {isFinite(remainingCategoryCashback) && (
                                    <CapProgressBar
                                        label="Category Cap"
                                        current={(item.categoryLimit || 0) - remainingCategoryCashback}
                                        limit={item.categoryLimit}
                                        icon={Wallet}
                                        currencyFn={currencyFn}
                                        rate={rule.rate}
                                    />
                                )}
                                {monthlyLimit > 0 && (
                                    <CapProgressBar
                                        label="Monthly Card Cap"
                                        current={monthlyCashback}
                                        limit={monthlyLimit}
                                        icon={CreditCard}
                                        currencyFn={currencyFn}
                                        rate={rule.rate}
                                    />
                                )}
                                {rule.capPerTransaction > 0 && (
                                    <div className="flex justify-between items-center text-xs pt-1">
                                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                            <DollarSign className="h-3 w-3" /> Max per Tx
                                        </span>
                                        <span className="font-medium text-slate-700 dark:text-slate-300">
                                            {currencyFn(rule.capPerTransaction)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button for non-winners */}
            {!isWinner && (
                 <button
                    type="button"
                    className="w-full flex justify-center py-1 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:bg-slate-100 dark:focus-visible:bg-slate-800"
                    onClick={onToggle}
                    aria-expanded={isExpanded}
                    aria-label={isExpanded ? "Collapse details" : "Show more details"}
                 >
                     {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                 </button>
            )}
        </div>
    );
}

function FinderOptionItem({ item, mccMap, onSelect, icon }) {
    const mccInfo = mccMap[item.mcc];

    // Updated Badge Logic: Blue(POS), Green(eCom), Red(International)
    const getMethodBadgeClass = (method) => {
        const m = method?.toLowerCase();
        if (m === 'pos') return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800";
        if (m === 'ecom') return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
        if (m === 'international') return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-800";
        return "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300";
    }

    return (
        <button
            onClick={() => onSelect(item.mcc, item.merchant, item.method)} // UPDATED: Pass method
            className="w-full text-left p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 group"
        >
            <div className="flex items-start gap-3">
                <div className="mt-1 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-500 dark:text-slate-400 group-hover:text-primary transition-colors">
                    {icon}
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex justify-between items-center">
                        <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{item.merchant}</p>
                        <div className="flex items-center gap-2">
                            {/* Display Method Badge if available */}
                            {item.method && (
                                <Badge variant="secondary" className={cn("text-[10px] h-5 px-1.5 border", getMethodBadgeClass(item.method))}>
                                    {item.method === 'International' ? 'Int.' : item.method}
                                </Badge>
                            )}
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-mono text-slate-500">{item.mcc}</Badge>
                        </div>
                    </div>
                    {mccInfo ? (
                        <div className="text-xs text-muted-foreground">
                            <p className="line-clamp-1">{mccInfo.en}</p>
                            <p className="line-clamp-1 text-slate-400 dark:text-slate-500 italic">{mccInfo.vn}</p>
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground">Unknown Category</p>
                    )}
                </div>
            </div>
        </button>
    );
}

// --- MAIN CONTENT WRAPPER ---
function CardFinderContent({
    allCards,
    allRules,
    mccMap,
    monthlySummary,
    monthlyCategorySummary,
    activeMonth,
    getCurrentCashbackMonthForCard,
    isDesktop
}) {
    // --- STATE ---
    const [searchTerm, setSearchTerm] = useState('');
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('All');
    const [view, setView] = useState('initial'); // 'initial', 'options', 'results'
    const [isLoading, setIsLoading] = useState(false);
    const [searchResult, setSearchResult] = useState(null);
    const [selectedMcc, setSelectedMcc] = useState(null);
    const [selectedMerchantDetails, setSelectedMerchantDetails] = useState(null);
    const [expandedCardId, setExpandedCardId] = useState(null);
    const [recentSearches, setRecentSearches] = useState([]);

    const [selectedQuickAmount, setSelectedQuickAmount] = useState(null); // 'other' or value
    const [showAmountInput, setShowAmountInput] = useState(false);

    const inputRef = useRef(null);
    const amountInputRef = useRef(null);

    // --- EFFECT: Load Recent Searches & Focus ---
    useEffect(() => {
        const searches = JSON.parse(localStorage.getItem('cardFinderSearches') || '[]');
        setRecentSearches(searches);
        const timer = setTimeout(() => inputRef.current?.focus(), 100);
        return () => clearTimeout(timer);
    }, []);

    // --- HELPERS ---
    const currency = (n) => (n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
    const cardMap = useMemo(() => new Map(allCards.map(c => [c.id, c])), [allCards]);

    // --- LOGIC: Quick Amount Selection ---
    const handleQuickAmountSelect = (value) => {
        // Toggle off if same amount selected
        if (selectedQuickAmount === value) {
            setShowAmountInput(false);
            setAmount('');
            setSelectedQuickAmount(null);
            return;
        }

        if (value === 'other') {
            setShowAmountInput(true);
            setSelectedQuickAmount('other');
            setTimeout(() => amountInputRef.current?.focus(), 50);
        } else {
            setShowAmountInput(false);
            setAmount(value);
            setSelectedQuickAmount(value);
        }
    };

    const handleClearAmount = () => {
        setAmount('');
        // Keep input visible and focused if cleared manually
        amountInputRef.current?.focus();
    }

    // --- LOGIC: Handle Search ---
    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        const term = searchTerm.trim();
        if (!term) return;

        const updatedSearches = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
        localStorage.setItem('cardFinderSearches', JSON.stringify(updatedSearches));
        setRecentSearches(updatedSearches);

        setSelectedMcc(null);
        setSelectedMerchantDetails(null);

        if (/^\d{4}$/.test(term)) {
            setIsLoading(true);
            setSelectedMcc(term);
            const info = mccMap[term];
            setSelectedMerchantDetails({
                merchant: info ? info.en : `MCC ${term}`,
                vnDesc: info ? info.vn : 'Unknown Category',
                isDirectMcc: true,
                method: null // Direct MCC has no inherent method
            });
            setView('results');
            setIsLoading(false);
        } else {
            setIsLoading(true);
            try {
                const res = await fetch(`${API_BASE_URL}/lookup-merchant?keyword=${encodeURIComponent(term)}`);
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                setSearchResult(data);
                setView('options');
            } catch (err) {
                console.error(err);
                toast.error("Could not fetch suggestions.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleOptionSelect = (mcc, merchantName, merchantMethod = null) => { // UPDATED: Accept method
        setSelectedMcc(mcc);
        const info = mccMap[mcc];
        setSelectedMerchantDetails({
            merchant: merchantName,
            enDesc: info?.en,
            vnDesc: info?.vn,
            method: merchantMethod // Store method from history
        });
        setView('results');
    };

    const handleAmountChange = (e) => {
        const value = e.target.value.replace(/,/g, '');
        if (!isNaN(value) && value.length <= 15) {
            setAmount(value ? Number(value).toLocaleString('en-US') : '');
        } else if (value === '') {
            setAmount('');
        }
    };

    // --- CALCULATION ENGINE ---
    const { rankedSuggestions, otherSuggestions } = useMemo(() => {
        if (!selectedMcc) return { rankedSuggestions: [], otherSuggestions: [] };
        const numericAmount = parseFloat(String(amount).replace(/,/g, ''));
        const isLiveView = activeMonth === 'live';

        // Determine Effective Method
        // If UI method is 'All', use the merchant's method if available.
        // If UI method is specific (POS/eCom/Int), it overrides everything.
        let effectiveMethod = 'All';
        if (method !== 'All') {
            effectiveMethod = method;
        } else if (selectedMerchantDetails?.method) {
            effectiveMethod = selectedMerchantDetails.method;
        }

        const allCandidates = allRules
            .filter(rule => {
                const ruleMethodsRaw = Array.isArray(rule.method) ? rule.method : (rule.method ? [rule.method] : []);
                const ruleMethods = ruleMethodsRaw.map(m => m.toLowerCase());

                // Use effectiveMethod for matching
                const targetMethod = effectiveMethod.toLowerCase();

                const isMethodValid =
                    targetMethod === 'all' || // Should effectively never happen for strict rules unless rule allows All
                    ruleMethods.length === 0 ||
                    ruleMethods.includes('all') ||
                    ruleMethods.includes(targetMethod);

                // Note: If effectiveMethod is 'eCom', and rule is 'POS', isMethodValid is false.
                // If effectiveMethod is 'All' (no history, UI All), and rule is 'POS', isMethodValid is true (matches 'all' logic in current code? wait)

                // Re-evaluating existing logic:
                // Old logic: currentMethod === 'all' || ... || ruleMethods.includes(currentMethod)
                // If I select 'All' in UI, I want to see everything.
                // But the user says: "if I search... Shopee & method is 'All', then... should be shown for corresponding method"
                // This means we are FILTERING by the historical method implicitly.
                // So if history says 'eCom', we act as if 'eCom' was selected.

                if (!isMethodValid) return false;

                const ruleMccCodes = Array.isArray(rule.mccCodes) ? rule.mccCodes : (rule.mccCodes ? rule.mccCodes.split(',').map(c => c.trim()) : []);
                const ruleExcludedCodes = Array.isArray(rule.excludedMccCodes) ? rule.excludedMccCodes : (rule.excludedMccCodes ? rule.excludedMccCodes.split(',').map(c => c.trim()) : []);
                const isSpecificMatch = ruleMccCodes.includes(selectedMcc);
                const isBroadRule = rule.isDefault || ruleMccCodes.length === 0;

                const isBroadMatch = isBroadRule && !ruleExcludedCodes.includes(selectedMcc);

                return isSpecificMatch || isBroadMatch;
            })
            .map(rule => {
                const card = cardMap.get(rule.cardId);
                if (!card || card.status !== 'Active') return null;

                const monthForCard = isLiveView ? getCurrentCashbackMonthForCard(card) : activeMonth;
                const cardMonthSummary = monthlySummary.find(s => s.cardId === card.id && s.month === monthForCard);

                const categorySummaryId = `${monthForCard} - ${rule.ruleName}`;
                const categoryMonthSummary = monthlyCategorySummary.find(s => s.summaryId === categorySummaryId && s.cardId === card.id);
                const categoryLimit = categoryMonthSummary?.categoryLimit || Infinity;
                const remainingCategoryCashback = categoryLimit - (categoryMonthSummary?.cashback || 0);

                const dynamicLimit = cardMonthSummary?.monthlyCashbackLimit;
                const effectiveMonthlyLimit = dynamicLimit > 0 ? dynamicLimit : card.overallMonthlyLimit;
                const monthlyCashback = cardMonthSummary?.cashback || 0;

                // Calculate remaining monthly cashback cap
                const remainingMonthlyCashback = effectiveMonthlyLimit > 0 ? (effectiveMonthlyLimit - monthlyCashback) : Infinity;

                let calculatedCashback = null;
                if (!isNaN(numericAmount) && numericAmount > 0) {
                    calculatedCashback = numericAmount * rule.rate;

                    // Cap per transaction
                    if (rule.capPerTransaction > 0) {
                        calculatedCashback = Math.min(calculatedCashback, rule.capPerTransaction);
                    }

                    // Cap by remaining category limit
                    if (isFinite(remainingCategoryCashback)) {
                         calculatedCashback = Math.min(calculatedCashback, Math.max(0, remainingCategoryCashback));
                    }

                    // Cap by remaining monthly limit
                    if (isFinite(remainingMonthlyCashback)) {
                        calculatedCashback = Math.min(calculatedCashback, Math.max(0, remainingMonthlyCashback));
                    }
                }

                const isCategoryCapReached = isFinite(remainingCategoryCashback) && remainingCategoryCashback <= 0;
                const isMonthlyCapReached = effectiveMonthlyLimit > 0 && remainingMonthlyCashback <= 0; // Updated logic

                return {
                    rule,
                    card,
                    calculatedCashback,
                    isMinSpendMet: card.minimumMonthlySpend > 0 ? (cardMonthSummary?.spend || 0) >= card.minimumMonthlySpend : true,
                    isCategoryCapReached,
                    isMonthlyCapReached,
                    isInactive: rule.status !== 'Active', // Explicitly passed
                    remainingCategoryCashback,
                    categoryLimit,
                    monthlyLimit: effectiveMonthlyLimit,
                    monthlyCashback,
                    effectiveMethod // Pass this down for display
                };
            })
            .filter(Boolean);

        // NO Grouping by Card - Show all applicable rules
        const sorted = allCandidates
            .sort((a, b) => {
                const isAActive = a.rule.status === 'Active';
                const isBActive = b.rule.status === 'Active';
                if (isAActive !== isBActive) return isAActive ? -1 : 1;

                const isACapped = a.isMonthlyCapReached || a.isCategoryCapReached;
                const isBCapped = b.isMonthlyCapReached || b.isCategoryCapReached;
                if (isACapped !== isBCapped) return isACapped ? 1 : -1;

                if (!isNaN(numericAmount) && numericAmount > 0) {
                    const diff = (b.calculatedCashback || 0) - (a.calculatedCashback || 0);
                    if (diff !== 0) return diff;
                }
                return b.rule.rate - a.rule.rate;
            });

        // Split into "Main" and "Other" (Inactive/Capped)
        const activeAndGood = [];
        const others = [];

        sorted.forEach(item => {
            if (item.rule.status !== 'Active' || item.isMonthlyCapReached || item.isCategoryCapReached) {
                others.push(item);
            } else {
                activeAndGood.push(item);
            }
        });

        return { rankedSuggestions: activeAndGood, otherSuggestions: others };

    }, [selectedMcc, amount, method, allRules, cardMap, monthlySummary, monthlyCategorySummary, activeMonth, getCurrentCashbackMonthForCard, selectedMerchantDetails]); // Added selectedMerchantDetails to deps


    // --- RENDERING ---

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 font-semibold bg-white dark:bg-slate-900">
                Card Lookup
            </div>

            {/* --- TOP: QUERY BAR --- */}
            <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm z-10 sticky top-0">
                <form onSubmit={handleSearch} className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            ref={inputRef}
                            placeholder="Search merchant (e.g., Shopee)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-emerald-500"
                        />
                         {searchTerm && (
                            <button
                                type="button"
                                onClick={() => { setSearchTerm(''); setView('initial'); setSearchResult(null); inputRef.current?.focus(); }}
                                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <span className="sr-only">Clear</span>
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    <div className="space-y-2">
                        {/* 1. Payment Method First */}
                        <MethodSelector method={method} setMethod={setMethod} />

                        {/* 2. Amount and Quick Amounts */}
                        <div>
                            <AnimatePresence>
                                {showAmountInput && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden pb-1"
                                    >
                                        <div className="relative">
                                            <Input
                                                ref={amountInputRef}
                                                placeholder="Enter amount (e.g., 1,000,000)"
                                                value={amount}
                                                onChange={handleAmountChange}
                                                inputMode="numeric"
                                                className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 pr-8 focus-visible:ring-emerald-500"
                                            />
                                            {amount && (
                                                <button
                                                    type="button"
                                                    onClick={handleClearAmount}
                                                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <QuickAmounts selected={selectedQuickAmount} onSelect={handleQuickAmountSelect} />
                        </div>
                    </div>

                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" disabled={isLoading || !searchTerm.trim()}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isLoading ? 'Searching...' : 'Find Best Card'}
                    </Button>
                </form>
            </div>

            {/* --- MIDDLE: CONTENT AREA --- */}
            <div className="flex-grow overflow-y-auto p-4">
                {/* STATE: INITIAL (Empty / History) */}
                {view === 'initial' && (
                    <div className="flex flex-col items-center justify-center text-center h-full text-slate-400 py-10">
                        <Sparkles className="h-12 w-12 mb-4 text-emerald-200 dark:text-emerald-900" />
                        <p className="font-medium text-slate-600 dark:text-slate-300">Where are you spending?</p>
                        <p className="text-sm mt-1 mb-8">Enter a merchant name to compare your cards.</p>

                        {recentSearches.length > 0 && (
                            <div className="w-full max-w-sm">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">Recent Searches</p>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {recentSearches.map(term => (
                                        <button
                                            key={term}
                                            onClick={() => { setSearchTerm(term); setTimeout(() => handleSearch(), 0); }}
                                            className="text-xs px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                                        >
                                            {term}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* STATE: OPTIONS (Search Results) */}
                {view === 'options' && searchResult && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between text-sm text-slate-500 pb-2 border-b border-slate-200 dark:border-slate-800">
                             <span>Select a category for "{searchTerm}"</span>
                             <Button variant="ghost" size="sm" onClick={() => setView('initial')} className="h-auto p-0 hover:bg-transparent">Cancel</Button>
                        </div>

                        {/* Internal Matches */}
                        {searchResult.history?.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider px-1">From Your History</h4>
                                {searchResult.history.map((item, i) => (
                                    <FinderOptionItem key={`h-${i}`} item={item} mccMap={mccMap} onSelect={handleOptionSelect} icon={<History className="h-4 w-4" />} />
                                ))}
                            </div>
                        )}

                        {/* External Matches */}
                        {searchResult.external?.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider px-1">Suggested Categories</h4>
                                {searchResult.external.map((item, i) => (
                                    <FinderOptionItem key={`e-${i}`} item={item} mccMap={mccMap} onSelect={handleOptionSelect} icon={<Globe className="h-4 w-4" />} />
                                ))}
                            </div>
                        )}

                        {!searchResult.history?.length && !searchResult.external?.length && (
                            <div className="text-center py-8">
                                <p className="text-slate-500">No direct matches found.</p>
                                <div className="mt-4 flex justify-center gap-2">
                                    <Button asChild variant="outline" size="sm">
                                        <a href={`https://www.google.com/search?q=${encodeURIComponent(searchTerm + ' mcc code')}`} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Google It
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* STATE: RESULTS (Rankings) */}
                {view === 'results' && selectedMerchantDetails && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {/* Context Header */}
                        <div className="flex items-start justify-between bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                            <div>
                                <h2 className="font-bold text-slate-900 dark:text-white leading-tight">
                                    {selectedMerchantDetails.merchant}
                                </h2>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 space-y-0.5">
                                    {selectedMerchantDetails.enDesc && <p>{selectedMerchantDetails.enDesc}</p>}
                                    {selectedMerchantDetails.vnDesc && <p className="italic">{selectedMerchantDetails.vnDesc}</p>}
                                </div>
                            </div>
                            <div className="text-right">
                                <Badge variant="secondary" className="font-mono">{selectedMcc}</Badge>
                                <Button variant="link" size="sm" onClick={() => setView('options')} className="h-auto px-0 text-xs block text-slate-400 hover:text-primary mt-1">
                                    Change
                                </Button>
                            </div>
                        </div>

                        {/* ACTIVE / GOOD RESULTS */}
                        {rankedSuggestions.length > 0 && (
                            <div className="space-y-3 pb-4">
                                {rankedSuggestions.map((item, index) => (
                                    <RankingCard
                                        key={item.rule.id}
                                        rank={index + 1}
                                        item={item}
                                        currencyFn={currency}
                                        isExpanded={expandedCardId === item.card.id}
                                        onToggle={() => setExpandedCardId(expandedCardId === item.card.id ? null : item.card.id)}
                                    />
                                ))}
                            </div>
                        )}

                        {/* OTHER (Capped/Inactive) RESULTS */}
                        {otherSuggestions.length > 0 && (
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                <details className="group">
                                    <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                                        <span>Other Cards ({otherSuggestions.length})</span>
                                        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                                    </summary>
                                    <div className="space-y-3 pt-3">
                                        {otherSuggestions.map((item, index) => (
                                            <RankingCard
                                                key={item.rule.id}
                                                rank={rankedSuggestions.length + index + 1}
                                                item={item}
                                                currencyFn={currency}
                                                isExpanded={expandedCardId === item.card.id}
                                                onToggle={() => setExpandedCardId(expandedCardId === item.card.id ? null : item.card.id)}
                                            />
                                        ))}
                                    </div>
                                </details>
                            </div>
                        )}

                        {rankedSuggestions.length === 0 && otherSuggestions.length === 0 && (
                            <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                                <p className="text-slate-500">No active cashback rules found for this category.</p>
                                <p className="text-xs text-slate-400 mt-1">Try changing the payment method or amount.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// --- TOP LEVEL WRAPPER ---
export default function BestCardFinderDialog(props) {
    const { isOpen, onOpenChange, isDesktop } = props;

    // --- DESKTOP: SHEET ---
    if (isDesktop) {
        return (
            <Sheet open={isOpen} onOpenChange={onOpenChange}>
                <SheetContent className="p-0 w-full max-w-md sm:max-w-lg border-l border-slate-200 dark:border-slate-800" side="right">
                    <SheetHeader className="sr-only">
                        <SheetTitle>Card Finder</SheetTitle>
                        <SheetDescription>Search for the best card</SheetDescription>
                    </SheetHeader>
                    <CardFinderContent {...props} />
                </SheetContent>
            </Sheet>
        );
    }

    // --- MOBILE: DRAWER ---
    return (
        <Drawer open={isOpen} onOpenChange={onOpenChange}>
            <DrawerContent className="h-[92vh] rounded-t-xl overflow-hidden flex flex-col">
                <DrawerHeader className="sr-only">
                    <DrawerTitle>Card Finder</DrawerTitle>
                    <DrawerDescription>Search for the best card</DrawerDescription>
                </DrawerHeader>
                <div className="flex-1 overflow-hidden relative">
                    <CardFinderContent {...props} />
                </div>
            </DrawerContent>
        </Drawer>
    );
}
import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Check, Info } from 'lucide-react';

export default function StatementLogDialog({ isOpen, onClose, statement, onSave, currencyFn, fmtYMShortFn }) {
    const [amount, setAmount] = useState('');
    const inputRef = useRef(null);

    // Calculate derived values and apply Math.ceil as requested
    const spend = Math.ceil(statement?.spend || 0);
    const cashback = Math.ceil(statement?.cashback || 0);
    const estimatedBalance = Math.ceil(spend - cashback);
    const statementAmount = Math.ceil(statement?.statementAmount || 0);

    useEffect(() => {
        if (isOpen && statement) {
            // Pre-fill with the existing statement amount if it's greater than 0,
            // otherwise, use the estimated balance as a suggestion.
            const currentAmount = statementAmount > 0 ? statementAmount : estimatedBalance;

            setAmount(currentAmount > 0 ? currentAmount.toLocaleString('en-US') : '');

            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 150);

            return () => clearTimeout(timer);
        }
    }, [isOpen, statement, statementAmount, estimatedBalance]);

    const handleAmountChange = (e) => {
        const value = e.target.value.replace(/,/g, '');
        if (!isNaN(value) && value.length <= 15) {
            setAmount(value ? Number(value).toLocaleString('en-US') : '');
        } else if (value === '') {
            setAmount('');
        }
    };

    const handleSave = () => {
        const numericAmount = Math.ceil(parseFloat(String(amount).replace(/,/g, '')));
        if (isNaN(numericAmount)) return;

        onSave(statement.id, numericAmount);
        onClose();
    };

    if (!statement) return null;

    const fillAmount = (val) => {
        if (val > 0) {
            setAmount(val.toLocaleString('en-US'));
        } else {
            setAmount('0');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Log Official Statement Amount</DialogTitle>
                    <DialogDescription>For {statement.card.name} - {fmtYMShortFn(statement.month)}</DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    {/* Modern Summary Card */}
                    <div className="bg-gray-50 border rounded-lg p-4 space-y-3">
                        <div className="flex items-center text-sm font-medium text-gray-500 mb-1">
                            <Info className="w-4 h-4 mr-1.5" />
                            Statement Breakdown
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">Total Spend</span>
                                <span className="font-medium">{currencyFn(spend)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">Applicable Cashback</span>
                                <span className="font-medium text-emerald-600">-{currencyFn(cashback)}</span>
                            </div>
                            <div className="pt-2 border-t flex justify-between items-center">
                                <span className="font-medium text-gray-900">Estimated Balance</span>
                                <span className="font-bold text-gray-900">{currencyFn(estimatedBalance)}</span>
                            </div>
                        </div>

                        {statementAmount > 0 && (
                            <div className="pt-2 border-t flex justify-between items-center text-sm bg-blue-50 -mx-4 -mb-4 p-3 rounded-b-lg border-blue-100">
                                <span className="font-medium text-blue-800">Current Logged Amount</span>
                                <span className="font-bold text-blue-700">{currencyFn(statementAmount)}</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label htmlFor="statement-amount" className="text-sm font-medium">
                                Official Statement Amount
                            </label>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => fillAmount(estimatedBalance)}
                                    className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                                >
                                    Use Estimated
                                </button>
                                {statementAmount > 0 && statementAmount !== estimatedBalance && (
                                    <button
                                        type="button"
                                        onClick={() => fillAmount(statementAmount)}
                                        className="text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                                    >
                                        Use Current
                                    </button>
                                )}
                            </div>
                        </div>

                        <Input
                            ref={inputRef}
                            id="statement-amount"
                            type="text"
                            inputMode="numeric"
                            value={amount}
                            onChange={handleAmountChange}
                            placeholder="Enter official amount from bank"
                            className="text-lg font-medium tracking-wide"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">Cancel</Button>
                    <Button onClick={handleSave} className="w-full sm:w-auto gap-2">
                        <Check className="w-4 h-4" />
                        Save Amount
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
import React, { useState, useMemo } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Info, Search, ChevronDown, Activity, Settings, PieChart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function CardDetailsDialog({ card, rules, mccMap, isDesktop, onUpdateCard, onUpdateRule }) {
    // --- State for search and expansion ---
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedRuleId, setExpandedRuleId] = useState(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [updatingRuleId, setUpdatingRuleId] = useState(null);

    const [analysisData, setAnalysisData] = useState([]);
    const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
    const [hasFetchedAnalysis, setHasFetchedAnalysis] = useState(false);

    const currency = (n) => (n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

    // --- Helper function and memoized data ---
    const isFeeCovered = card.estYtdCashback >= card.annualFee;
    const representativeTxCapRule = rules.find(rule => rule.capPerTransaction > 0);
    const infoItems = [
        { label: "Credit Limit", value: currency(card.creditLimit) },
        { label: "Card Number", value: `**** **** **** ${card.last4}` },
        { label: "First 6 Digits", value: card.first6 },
        { label: "Network", value: card.network },
        { label: "Statement Day", value: `~ Day ${card.statementDay}` },
        { label: "Payment Due Day", value: `~ Day ${card.paymentDueDay}` },
        { label: "Monthly Interest", value: `${(card.interestRateMonthly * 100).toFixed(2)}%` },
        {
            label: "Annual Fee",
            value: currency(card.annualFee),
            valueClassName: isFeeCovered ? 'text-emerald-600' : 'text-red-500'
        },
        { label: "Fee Waiver Threshold", value: currency(card.feeWaiverThreshold) }
    ];

    // --- Filtering logic for the search functionality ---
    const filteredAndSortedRules = useMemo(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        const isMccSearch = /^\d+$/.test(searchTerm.trim());

        if (!searchTerm.trim()) {
            return [...rules].sort((a, b) => {
                if (a.status === 'Active' && b.status !== 'Active') return -1;
                if (a.status !== 'Active' && b.status === 'Active') return 1;
                return a.ruleName.localeCompare(b.ruleName);
            });
        }

        const filtered = rules.filter(rule => {
            const mccList = rule.mccCodes ? rule.mccCodes.split(',').map(m => m.trim()) : [];
            if (isMccSearch) {
                return mccList.some(code => code.includes(searchTerm.trim()));
            }
            const nameMatch = rule.ruleName.toLowerCase().includes(lowercasedFilter);
            if (nameMatch) return true;
            for (const code of mccList) {
                const mccName = mccMap[code]?.vn || '';
                if (mccName.toLowerCase().includes(lowercasedFilter)) {
                    return true;
                }
            }
            return false;
        });

        return filtered.sort((a, b) => {
            if (a.status === 'Active' && b.status !== 'Active') return -1;
            if (a.status !== 'Active' && b.status === 'Active') return 1;
            return a.ruleName.localeCompare(b.ruleName);
        });
    }, [rules, searchTerm, mccMap]);


    const handleToggleExpand = (ruleId) => {
        setExpandedRuleId(prevId => (prevId === ruleId ? null : ruleId));
    };

    const handleStatusChange = async (newStatus) => {
        setIsUpdatingStatus(true);
        try {
            const response = await fetch(`${API_BASE_URL}/cards/${card.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) throw new Error('Failed to update card status');

            toast.success(`Card status updated to ${newStatus}`);
            if (onUpdateCard) {
                onUpdateCard({ ...card, status: newStatus });
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to update card status');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleRuleStatusChange = async (ruleId, newStatus) => {
        setUpdatingRuleId(ruleId);
        try {
            const response = await fetch(`${API_BASE_URL}/rules/${ruleId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) throw new Error('Failed to update rule status');

            toast.success(`Rule status updated to ${newStatus}`);
            if (onUpdateRule) {
                onUpdateRule(ruleId, newStatus);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to update rule status');
        } finally {
            setUpdatingRuleId(null);
        }
    };

    const fetchAnalysisData = async () => {
        if (hasFetchedAnalysis || isAnalysisLoading) return;
        setIsAnalysisLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/cards/${card.id}/analysis`);
            if (!response.ok) throw new Error('Failed to fetch analysis');
            const data = await response.json();

            // Map rule IDs to Rule Names for the chart
            const mappedData = data.map(item => {
                const rule = rules.find(r => r.id === item.ruleId);
                return {
                    ...item,
                    ruleName: rule ? rule.ruleName : 'Unassigned/Other'
                };
            }).sort((a, b) => b.totalCashback - a.totalCashback); // Sort by highest cashback

            setAnalysisData(mappedData);
            setHasFetchedAnalysis(true);
        } catch (error) {
            console.error('Error fetching analysis:', error);
            toast.error('Failed to load analysis data');
        } finally {
            setIsAnalysisLoading(false);
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs">
                    <Info className="mr-1.5 h-3.5 w-3.5" /> More info
                </Button>
            </DialogTrigger>
            <DialogContent
                className={cn(
                    "flex flex-col p-0 gap-0",
                    isDesktop ? "max-w-2xl" : "h-[90vh] w-full"
                )}
            >
                <DialogHeader className="px-6 pt-6 shrink-0 border-b pb-4">
                    <DialogTitle className="text-2xl">{card.name}</DialogTitle>
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">{card.bank} &ndash; {card.cardType} Card</p>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Status:</span>
                            <Select
                                value={card.status}
                                onValueChange={handleStatusChange}
                                disabled={isUpdatingStatus}
                            >
                                <SelectTrigger className={cn(
                                    "h-8 w-[110px] text-xs font-medium border-0 focus:ring-0",
                                    card.status === 'Active' && "bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
                                    card.status === 'Frozen' && "bg-sky-100 text-sky-800 hover:bg-sky-200",
                                    card.status === 'Closed' && "bg-slate-200 text-slate-600 hover:bg-slate-300"
                                )}>
                                    {isUpdatingStatus ? <Loader2 className="h-3 w-3 animate-spin mx-auto"/> : <SelectValue />}
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Frozen">Frozen</SelectItem>
                                    <SelectItem value="Closed">Closed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </DialogHeader>

                <Tabs defaultValue="info" className="flex flex-col flex-grow overflow-hidden" onValueChange={(val) => {
                    if (val === 'analytics') fetchAnalysisData();
                }}>
                    <TabsList className="mx-6 mt-4 grid w-full max-w-md grid-cols-3 shrink-0">
                        <TabsTrigger value="info" className="flex items-center gap-2"><Settings className="h-4 w-4"/>Info</TabsTrigger>
                        <TabsTrigger value="rules" className="flex items-center gap-2"><Activity className="h-4 w-4"/>Rules</TabsTrigger>
                        <TabsTrigger value="analytics" className="flex items-center gap-2"><PieChart className="h-4 w-4"/>Analytics</TabsTrigger>
                    </TabsList>

                    <div className="flex-grow overflow-y-auto px-6 py-4">
                        <TabsContent value="info" className="mt-0 h-full focus-visible:outline-none focus-visible:ring-0">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                                {infoItems.map(item => item.value ? (
                                    <div key={item.label}>
                                        <p className="text-muted-foreground mb-1">{item.label}</p>
                                        <p className={cn("font-medium", item.valueClassName)}>{item.value}</p>
                                    </div>
                                ) : null)}
                            </div>

                            <div className="mt-6">
                                <h4 className="font-semibold text-sm mb-3">Cashback Limits</h4>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border">
                                    {representativeTxCapRule && (
                                        <div>
                                            <p className="text-muted-foreground mb-1">Max per Tx</p>
                                            <p className="font-medium">{currency(representativeTxCapRule.capPerTransaction)}</p>
                                        </div>
                                    )}
                                    {card.limitPerCategory > 0 && (
                                        <div>
                                            <p className="text-muted-foreground mb-1">Max per Cat</p>
                                            <p className="font-medium">{currency(card.limitPerCategory)}</p>
                                        </div>
                                    )}
                                    {card.overallMonthlyLimit > 0 && (
                                        <div>
                                            <p className="text-muted-foreground mb-1">Max per Month</p>
                                            <p className="font-medium">{currency(card.overallMonthlyLimit)}</p>
                                        </div>
                                    )}
                                    {card.minimumMonthlySpend > 0 && (
                                        <div>
                                            <p className="text-muted-foreground mb-1">Min. Spending</p>
                                            <p className="font-medium">{currency(card.minimumMonthlySpend)}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="rules" className="mt-0 h-full focus-visible:outline-none focus-visible:ring-0">
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search by name, MCC code, or category..."
                                    className="w-full pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2 pb-4">
                                {filteredAndSortedRules.length > 0 ? filteredAndSortedRules.map(rule => {
                                    const isExpanded = expandedRuleId === rule.id;
                                    const fullMccList = rule.mccCodes ? rule.mccCodes.split(',').map(m => m.trim()).filter(Boolean) : [];
                                    const isMccSearch = /^\d+$/.test(searchTerm.trim());
                                    const mccsToDisplay = isMccSearch
                                        ? fullMccList.filter(code => code.includes(searchTerm.trim()))
                                        : fullMccList;

                                    return (
                                        <div key={rule.id} className="border rounded-lg overflow-hidden bg-card">
                                            <div
                                                onClick={() => handleToggleExpand(rule.id)}
                                                className={cn(
                                                    "flex justify-between items-center p-3.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                                                    rule.status !== 'Active' && "opacity-60"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className={cn("h-2.5 w-2.5 rounded-full", rule.status === 'Active' ? "bg-emerald-500" : "bg-slate-400")} />
                                                    <span className="font-medium text-[15px]">{rule.ruleName}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="font-mono text-[15px] font-semibold">{(rule.rate * 100).toFixed(1)}%</span>
                                                    <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", isExpanded && "rotate-180")} />
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div className="p-4 border-t bg-slate-50/50 dark:bg-slate-900/20">
                                                    <div className="mb-4 flex items-center justify-between">
                                                        <span className="text-sm text-muted-foreground font-medium">Status</span>
                                                        <Select
                                                            value={rule.status || 'Active'}
                                                            onValueChange={(val) => handleRuleStatusChange(rule.id, val)}
                                                            disabled={updatingRuleId === rule.id}
                                                        >
                                                            <SelectTrigger className="h-8 w-[120px] text-xs">
                                                                {updatingRuleId === rule.id ? <Loader2 className="h-3 w-3 animate-spin mx-auto"/> : <SelectValue />}
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Active">Active</SelectItem>
                                                                <SelectItem value="Inactive">Inactive</SelectItem>
                                                                <SelectItem value="Deleted">Deleted</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <p className="text-sm font-medium">Eligible MCC Codes</p>
                                                        {mccsToDisplay.length > 0 ? (
                                                            <div className="flex flex-wrap gap-2">
                                                                {mccsToDisplay.map(code => (
                                                                    <Badge key={code} variant="secondary" className="font-normal px-2.5 py-0.5 text-xs">
                                                                        <span className="font-mono mr-1.5">{code}</span>
                                                                        {mccMap[code]?.vn && (
                                                                            <span className="text-muted-foreground">{mccMap[code].vn}</span>
                                                                        )}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-muted-foreground italic">No specific MCC codes are linked to this rule.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                }) : (
                                    <div className="text-center py-8">
                                        <p className="text-sm text-muted-foreground">No rules match your search.</p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="analytics" className="mt-0 h-full focus-visible:outline-none focus-visible:ring-0 flex flex-col">
                            {isAnalysisLoading ? (
                                <div className="flex items-center justify-center h-48">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : analysisData.length > 0 ? (
                                <div className="space-y-6 pb-6">
                                    <h4 className="font-semibold text-sm">Performance by Cashback Rule</h4>
                                    <div className="h-72 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={analysisData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                                <XAxis type="number" tickFormatter={(val) => `₫${(val / 1000000).toFixed(1)}M`} />
                                                <YAxis dataKey="ruleName" type="category" width={150} tick={{ fontSize: 12 }} />
                                                <Tooltip
                                                    formatter={(value, name) => [currency(value), name === 'totalCashback' ? 'Cashback' : 'Spend']}
                                                    labelStyle={{ color: 'black' }}
                                                />
                                                <Legend />
                                                <Bar dataKey="totalCashback" name="Cashback" fill="#10b981" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="h-72 w-full mt-8">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={analysisData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                                <XAxis type="number" tickFormatter={(val) => `₫${(val / 1000000).toFixed(1)}M`} />
                                                <YAxis dataKey="ruleName" type="category" width={150} tick={{ fontSize: 12 }} />
                                                <Tooltip
                                                    formatter={(value, name) => [currency(value), name === 'totalSpend' ? 'Spend' : 'Cashback']}
                                                    labelStyle={{ color: 'black' }}
                                                />
                                                <Legend />
                                                <Bar dataKey="totalSpend" name="Spend" fill="#3b82f6" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
                                    <p className="text-muted-foreground">No transaction data available for analysis.</p>
                                </div>
                            )}
                        </TabsContent>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Combobox } from "../../ui/combobox";
import { Loader2, AlertTriangle, ArrowRight, Info } from "lucide-react";
import { toast } from 'sonner';
import { cn } from "../../../lib/utils";

export default function BulkEditDialog({
    isOpen,
    onClose,
    selectedIds,
    allTransactions,
    categories,
    cards,
    rules,
    mccMap,
    getCurrentCashbackMonthForCard,
    onUpdateComplete
}) {
    const [selectedField, setSelectedField] = useState('');
    const [value, setValue] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Reset state when dialog opens
    useEffect(() => {
        if (isOpen) {
            setSelectedField('');
            setValue('');
            setIsProcessing(false);
        }
    }, [isOpen]);

    const selectedTransactions = useMemo(() => {
        return allTransactions.filter(t => selectedIds.includes(t.id));
    }, [allTransactions, selectedIds]);

    const uniqueCardIds = useMemo(() => {
        const ids = new Set();
        selectedTransactions.forEach(tx => {
            if (tx['Card'] && tx['Card'].length > 0) ids.add(tx['Card'][0]);
        });
        return Array.from(ids);
    }, [selectedTransactions]);

    const hasMixedCards = uniqueCardIds.length > 1;

    // Sorting logic integrated here
    const sortedCategories = useMemo(() => {
        return [...categories].sort((a, b) => a.localeCompare(b));
    }, [categories]);

    const sortedCards = useMemo(() => {
        return [...cards].sort((a, b) => a.name.localeCompare(b.name));
    }, [cards]);

    const filteredRules = useMemo(() => {
        let relevantRules = rules;
        if (selectedField === 'Applicable Rule' && !hasMixedCards && uniqueCardIds.length === 1) {
            relevantRules = rules.filter(r => r.cardId === uniqueCardIds[0]);
        }
        return [...relevantRules].sort((a, b) => (a.ruleName || '').localeCompare(b.ruleName || ''));
    }, [rules, uniqueCardIds, selectedField, hasMixedCards]);

    const handleSave = async () => {
        if (!selectedField) {
            toast.error("Please select a field to update.");
            return;
        }
        if (selectedField === 'Applicable Rule' && hasMixedCards) {
             toast.error("Cannot apply rules to transactions from different cards.");
             return;
        }
        if (!value && value !== 0) {
             toast.error("Please enter a value.");
             return;
        }

        setIsProcessing(true);

        try {
            const updates = [];
            const summaryCache = new Map();

            for (const txId of selectedIds) {
                const tx = allTransactions.find(t => t.id === txId);
                if (!tx) continue;

                const updatePayload = { id: txId, properties: {} };
                let needsSummaryUpdate = false;
                let newRuleId = null;
                let newCardId = null;

                if (selectedField === 'MCC Code') {
                    updatePayload.properties.mccCode = value;
                } else if (selectedField === 'Category') {
                    updatePayload.properties.category = value;
                } else if (selectedField === 'Applicable Rule') {
                    updatePayload.properties.applicableRuleId = value;
                    newRuleId = value;
                    newCardId = tx['Card'] ? tx['Card'][0] : null;
                    needsSummaryUpdate = true;
                } else if (selectedField === 'Card') {
                    updatePayload.properties.cardId = value;
                    newCardId = value;
                    newRuleId = tx['Applicable Rule'] ? tx['Applicable Rule'][0] : null;
                    needsSummaryUpdate = true;
                }

                if (needsSummaryUpdate && newRuleId && newCardId) {
                    const cardObj = cards.find(c => c.id === newCardId);
                    if (cardObj && tx['Transaction Date']) {
                        const month = getCurrentCashbackMonthForCard(cardObj, tx['Transaction Date']);
                        const cacheKey = `${newCardId}-${month}-${newRuleId}`;
                        let summaryId = summaryCache.get(cacheKey);

                        if (!summaryId) {
                            const res = await fetch(`${API_BASE_URL}/summaries`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    cardId: newCardId,
                                    month: month,
                                    ruleId: newRuleId
                                }),
                            });

                            if (res.ok) {
                                const data = await res.json();
                                summaryId = data.id;
                                summaryCache.set(cacheKey, summaryId);
                            } else {
                                console.error("Failed to get summary ID for bulk update");
                            }
                        }

                        if (summaryId) {
                            updatePayload.properties.cardSummaryCategoryId = summaryId;
                        }
                    }
                }

                updates.push(updatePayload);
            }

            const res = await fetch(`${API_BASE_URL}/transactions/batch-update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates }),
            });

            if (!res.ok) throw new Error("Batch update failed");

            const updatedTransactions = await res.json();
            onUpdateComplete(updatedTransactions);
            toast.success("Transactions updated successfully.");
            onClose();

        } catch (error) {
            console.error(error);
            toast.error("Failed to update transactions.");
        } finally {
            setIsProcessing(false);
        }
    };

    const getMccDescription = (code) => {
        if (!code || !mccMap || !mccMap[code]) return null;
        return mccMap[code].vn || mccMap[code].us || 'Unknown';
    };

    const getDisplayValue = (tx, field) => {
        if (!field) return '-';
        if (field === 'MCC Code') {
             const code = tx['MCC Code'];
             if (!code) return '-';
             const desc = getMccDescription(code);
             return desc ? `${code} - ${desc}` : code;
        }
        if (field === 'Category') return tx['Category'] || 'Uncategorized';
        if (field === 'Applicable Rule') {
             const ruleId = tx['Applicable Rule']?.[0];
             const rule = rules.find(r => r.id === ruleId);
             return rule ? rule.ruleName : '-';
        }
        if (field === 'Card') {
             const cardId = tx['Card']?.[0];
             const card = cards.find(c => c.id === cardId);
             return card ? card.name : '-';
        }
        return '-';
    };

    const getNewDisplayValue = () => {
        if (!value) return null;
        if (selectedField === 'MCC Code') {
            const desc = getMccDescription(value);
            return desc ? `${value} - ${desc}` : value;
        }
        if (selectedField === 'Category') return value;
        if (selectedField === 'Applicable Rule') {
             const rule = rules.find(r => r.id === value);
             return rule ? rule.ruleName : value;
        }
        if (selectedField === 'Card') {
             const card = cards.find(c => c.id === value);
             return card ? card.name : value;
        }
        return value;
    };

    const renderInput = () => {
        if (selectedField === 'Applicable Rule' && hasMixedCards) {
            return (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800 dark:text-amber-300">
                        <p className="font-semibold">Mixed Cards Selected</p>
                        <p className="mt-1">Cannot bulk assign rules because selected transactions belong to different cards. Please filter by card first.</p>
                    </div>
                </div>
            );
        }

        switch (selectedField) {
            case 'MCC Code':
                const mccDesc = getMccDescription(value);
                return (
                    <div className="space-y-2">
                        <Input
                            placeholder="Enter MCC Code"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                        />
                        {value && (
                            <div className="flex items-start gap-2 text-xs text-muted-foreground p-2 bg-slate-50 dark:bg-slate-900/50 rounded border dark:border-slate-800">
                                <Info className="h-3.5 w-3.5 mt-0.5 text-blue-500" />
                                {mccDesc ? (
                                    <span>Match: <span className="font-medium text-slate-700 dark:text-slate-300">{mccDesc}</span></span>
                                ) : (
                                    <span className="italic text-slate-400">No known description for this code</span>
                                )}
                            </div>
                        )}
                    </div>
                );
            case 'Category':
                return (
                    <Combobox
                        options={sortedCategories.map(c => ({ value: c, label: c }))}
                        value={value}
                        onChange={setValue}
                        placeholder="Select category..."
                    />
                );
            case 'Applicable Rule':
                return (
                    <Select value={value} onValueChange={setValue} disabled={hasMixedCards}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Cashback Rule" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                            {filteredRules.map(rule => (
                                <SelectItem key={rule.id} value={rule.id}>
                                    {rule.ruleName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            case 'Card':
                return (
                    <Select value={value} onValueChange={setValue}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Card" />
                        </SelectTrigger>
                        <SelectContent>
                            {sortedCards.map(card => (
                                <SelectItem key={card.id} value={card.id}>
                                    {card.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            default:
                return <div className="h-10 bg-slate-50 dark:bg-slate-900 rounded border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-sm text-slate-400">Select a field first</div>;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[900px] h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>Bulk Edit ({selectedIds.length} items)</DialogTitle>
                </DialogHeader>

                <div className="flex-1 min-h-0 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x dark:divide-slate-800">
                    {/* Left Column: Controls */}
                    <div className="w-full md:w-1/3 p-6 space-y-6 bg-white dark:bg-slate-950">
                        <div className="grid gap-2">
                            <Label>Field to Update</Label>
                            <Select value={selectedField} onValueChange={(val) => { setSelectedField(val); setValue(''); }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select field..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MCC Code">MCC Code</SelectItem>
                                    <SelectItem value="Category">Category</SelectItem>
                                    <SelectItem value="Applicable Rule">Applicable Rule</SelectItem>
                                    <SelectItem value="Card">Card</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label>New Value</Label>
                            {renderInput()}
                        </div>
                    </div>

                    {/* Right Column: Preview */}
                    <div className="w-full md:w-2/3 flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="p-3 border-b dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900 sticky top-0">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Preview Changes</h4>
                        </div>
                        <div className="flex-1 overflow-auto p-0">
                            <Table>
                                <TableHeader className="sticky top-0 bg-slate-50 dark:bg-slate-900 z-10 shadow-sm">
                                    <TableRow>
                                        <TableHead className="w-[100px]">Date</TableHead>
                                        <TableHead>Transaction</TableHead>
                                        <TableHead className="w-[140px]">Current Value</TableHead>
                                        <TableHead className="w-[140px]">New Value</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedTransactions.map(tx => {
                                        const currentValue = getDisplayValue(tx, selectedField);
                                        const newValue = getNewDisplayValue();
                                        const isChanged = newValue && newValue !== currentValue;

                                        return (
                                            <TableRow key={tx.id}>
                                                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {tx['Transaction Date']}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    <div className="font-medium truncate max-w-[180px]" title={tx['Transaction Name']}>{tx['Transaction Name']}</div>
                                                    <div className="text-xs text-muted-foreground">{Number(tx['Amount']).toLocaleString()}</div>
                                                </TableCell>
                                                <TableCell className="text-xs text-slate-500">
                                                    {currentValue}
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {newValue ? (
                                                        <div className={cn("flex items-center gap-1 font-medium", isChanged ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500")}>
                                                            {isChanged && <ArrowRight className="h-3 w-3" />}
                                                            {newValue}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-300">-</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-4 border-t dark:border-slate-800 bg-white dark:bg-slate-950">
                    <Button variant="outline" onClick={onClose} disabled={isProcessing}>Cancel</Button>
                    <Button
                        onClick={handleSave}
                        disabled={isProcessing || !selectedField || !value || (selectedField === 'Applicable Rule' && hasMixedCards)}
                        className="min-w-[100px]"
                    >
                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update All
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
    ChevronsUpDown,
    ArrowUp,
    ArrowDown,
    Trash2,
    Search,
    X,
    Filter,
    Layers,
    Settings2,
    CreditCard,
    ArrowUpDown,
    ChevronDown,
    Inbox,
    FilePenLine,
    Loader2
} from "lucide-react";
import { format } from "date-fns";

import { cn } from "../../../lib/utils";
import { formatDate, formatTransactionDate } from "../../../lib/date";
import { Checkbox } from "../../ui/checkbox";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../ui/table";
import { Input } from "../../ui/input";
import { Skeleton } from "../../ui/skeleton";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../../ui/card";
import {
    Tabs,
    TabsList,
    TabsTrigger,
} from "../../ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from "../../ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "../../ui/dropdown-menu";
import MobileTransactionItem from "../../shared/MobileTransactionItem";
import MethodIndicator from "../../shared/MethodIndicator";
import TransactionRow from "./TransactionRow";
import useDebounce from "../../../hooks/useDebounce";
import BulkEditDialog from "../dialogs/BulkEditDialog";

// Moved currency function outside to be stable
const currency = (n) => (n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const TransactionsList = React.memo(({
    transactions,
    isLoading,
    activeMonth,
    cardMap,
    rules = [],
    categories: allCategoriesProp = [], // Added categories prop
    mccNameFn,
    mccMap,
    allCards,
    filterType,
    onFilterTypeChange,
    statementMonths,
    isDesktop,
    onTransactionDeleted,
    onEditTransaction,
    onDuplicateTransaction,
    onBulkDelete,
    onBulkUpdate,
    onViewDetails = () => {},
    fmtYMShortFn,
    isServerSide = false,
    onLoadMore,
    hasMore = false,
    onSearch,
    onSortChange,
    onFilterChange,
    dateRange,
    onDateRangeChange,
    getCurrentCashbackMonthForCard,
    isAppending = false,
    processingIds = new Set(),
    syncingIds = new Set()
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [cardFilter, setCardFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [methodFilter, setMethodFilter] = useState("all");
    const [internalDateRange, setInternalDateRange] = useState(undefined);
    const [visibleCount, setVisibleCount] = useState(15);
    const [sortConfig, setSortConfig] = useState({ key: 'Transaction Date', direction: 'descending' });
    const [selectedIds, setSelectedIds] = useState([]);
    const [groupBy, setGroupBy] = useState("date");
    const [sortByValue, setSortByValue] = useState('Newest');
    const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);

    const effectiveDateRange = isServerSide ? dateRange : internalDateRange;

    const handleDateChange = (field, value) => {
        // value is 'YYYY-MM-DD' or empty
        const newRange = { ...effectiveDateRange };

        if (!value) {
            newRange[field] = undefined;
        } else {
            // Parse 'YYYY-MM-DD' to local Date to match date-fns format logic elsewhere
            const [y, m, d] = value.split('-').map(Number);
            newRange[field] = new Date(y, m - 1, d);
        }

        if (isServerSide && onDateRangeChange) {
            onDateRangeChange(newRange);
        } else {
            setInternalDateRange(newRange);
        }
    };

    // ------------------------------------------------------------------
    // 1. Column Configuration
    // ------------------------------------------------------------------
    const ruleMap = useMemo(() => {
        if (!rules) return new Map();
        return new Map(rules.map(r => [r.id, r]));
    }, [rules]);

    const getRateColor = (r) => {
        const ratePercent = r * 100;
        if (ratePercent >= 5) return "bg-emerald-100 text-emerald-800 border-emerald-200";
        if (ratePercent >= 2) return "bg-sky-100 text-sky-800 border-sky-200";
        if (ratePercent > 0) return "bg-slate-100 text-slate-700 border-slate-200";
        return "bg-gray-100 text-gray-500 border-gray-200";
    };

    const columnsConfig = useMemo(() => [
        {
            id: 'date',
            label: 'Date',
            sortKey: 'Transaction Date',
            defaultVisible: true,
            width: 'w-[170px]',
            cellClass: "whitespace-nowrap",
            renderCell: (tx) => formatTransactionDate(tx.effectiveDate)
        },
        {
            id: 'name',
            label: 'Transaction Name',
            sortKey: 'Transaction Name',
            defaultVisible: true,
            renderCell: (tx) => (
                <div className="flex items-center gap-2">
                    <MethodIndicator method={tx['Method']} />
                    <div>
                        <div className="font-medium">{tx['Transaction Name']}</div>
                        {tx.merchantLookup && <div className="text-xs text-gray-500">{tx.merchantLookup}</div>}
                    </div>
                </div>
            )
        },
        {
            id: 'amount',
            label: 'Amount',
            sortKey: 'Amount',
            defaultVisible: true,
            headerClass: "text-right",
            cellClass: "text-right",
            renderCell: (tx) => currency(tx['Amount'])
        },
        {
            id: 'estCashback',
            label: 'Est. Cashback',
            sortKey: 'estCashback',
            defaultVisible: true,
            headerClass: "text-right",
            cellClass: "text-right font-medium text-emerald-600",
            renderCell: (tx) => currency(tx.estCashback)
        },
        {
            id: 'card',
            label: 'Card Name',
            sortKey: 'Card',
            defaultVisible: true,
            renderCell: (tx) => {
                const card = tx['Card'] ? cardMap.get(tx['Card'][0]) : null;
                return card ? <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">{card.name}</Badge> : 'N/A';
            }
        },
        {
            id: 'category',
            label: 'Category',
            sortKey: 'Category',
            defaultVisible: false,
            renderCell: (tx) => tx['Category'] || ''
        },
        {
            id: 'rule',
            label: 'Applicable Rule',
            defaultVisible: false,
            renderCell: (tx) => {
                const ruleId = tx['Applicable Rule'] && tx['Applicable Rule'][0];
                const rule = ruleId ? ruleMap.get(ruleId) : null;
                const ruleName = rule ? (rule.ruleName || rule.name) : (ruleId ? ruleId.slice(0, 8) + '...' : '');
                return <span className="text-xs text-slate-600">{ruleName}</span>;
            }
        },
        {
            id: 'mcc',
            label: 'MCC Code',
            defaultVisible: false,
            renderCell: (tx) => tx['MCC Code'] ? `${tx['MCC Code']} - ${mccNameFn ? mccNameFn(tx['MCC Code']) : ''}` : ''
        },
        {
            id: 'notes',
            label: 'Notes',
            defaultVisible: false,
            renderCell: (tx) => tx['Notes'] || ''
        },
        {
            id: 'rate',
            label: 'Cashback Rate',
            sortKey: 'rate',
            defaultVisible: true,
            headerClass: "text-center",
            cellClass: "text-center",
            renderCell: (tx) => (
                <Badge variant="outline" className={cn("font-mono", getRateColor(tx.rate))}>
                    {(tx.rate * 100).toFixed(1)}%
                </Badge>
            )
        },
        {
            id: 'paidFor',
            label: 'Paid for',
            sortKey: 'Paid for',
            defaultVisible: false,
            renderCell: (tx) => tx.paidFor ? <Badge variant="secondary">{tx.paidFor}</Badge> : ''
        },
        {
            id: 'method',
            label: 'Method',
            sortKey: 'Method',
            defaultVisible: false,
            renderCell: (tx) => tx['Method'] && (
                <Badge variant="outline" className={cn(
                    "font-mono font-normal",
                    tx['Method'] === 'International' && "bg-orange-100 text-orange-800 border-orange-200",
                    tx['Method'] === 'POS' && "bg-blue-100 text-blue-800 border-blue-200",
                    tx['Method'] === 'eCom' && "bg-green-100 text-green-800 border-green-200",
                    !['International', 'POS', 'eCom'].includes(tx['Method']) && "bg-slate-100 text-slate-700 border-slate-200"
                )}>
                    {tx['Method']}
                </Badge>
            )
        }
    ], [cardMap, ruleMap, mccNameFn]);

    // Initialize visibility state based on config defaults
    const [visibleColumnIds, setVisibleColumnIds] = useState(() => {
        // We can't access columnsConfig here directly in initial render if it depends on props/memos
        // But we can recreate the initial state logic or use an effect.
        // Hardcoding defaults here to match the config above for simplicity and stability.
        return ['date', 'name', 'amount', 'estCashback', 'card', 'rate'];
    });

    const activeColumns = useMemo(() => {
        return columnsConfig.filter(col => visibleColumnIds.includes(col.id));
    }, [columnsConfig, visibleColumnIds]);

    // ------------------------------------------------------------------
    // Existing Logic (Sorting, Filtering, Grouping)
    // ------------------------------------------------------------------

    // Server-side Search Trigger
    useEffect(() => {
        if (isServerSide && onSearch) {
            onSearch(debouncedSearchTerm);
        }
    }, [debouncedSearchTerm, isServerSide, onSearch]);

    useEffect(() => {
        setSelectedIds([]);
    }, [activeMonth, filterType]);

    useEffect(() => {
        if (sortConfig.key === 'Transaction Date' && sortConfig.direction === 'descending') setSortByValue('Newest');
        else if (sortConfig.key === 'Transaction Date' && sortConfig.direction === 'ascending') setSortByValue('Oldest');
        else if (sortConfig.key === 'Amount' && sortConfig.direction === 'descending') setSortByValue('Amount: High');
        else if (sortConfig.key === 'Amount' && sortConfig.direction === 'ascending') setSortByValue('Amount: Low');
        else setSortByValue('Custom');
    }, [sortConfig]);

    const categories = useMemo(() => {
        // Use provided categories prop if available, otherwise derive from transactions
        const baseCategories = allCategoriesProp && allCategoriesProp.length > 0
            ? allCategoriesProp
            : Array.from(new Set(transactions.map(tx => tx['Category']).filter(Boolean)));

        // Ensure we sort and remove duplicates just in case
        const uniqueCategories = Array.from(new Set(baseCategories));
        uniqueCategories.sort((a, b) => a.localeCompare(b));
        return ["all", ...uniqueCategories];
    }, [transactions, allCategoriesProp]);

    const enrichedTransactions = useMemo(() => {
        return transactions.map(tx => {
            // Priority: Billing Date > Transaction Date
            const effectiveDate = tx['billingDate'] || tx['Transaction Date'];

            // ⚡ Bolt Optimization: Pre-calculate date timestamp for faster sorting
            const dateStr = effectiveDate;
            const timestamp = dateStr ? new Date(dateStr).getTime() : 0;

            return {
                ...tx,
                effectiveDate,
                rate: (tx['Amount'] && tx['Amount'] > 0) ? (tx.estCashback / tx['Amount']) : 0,
                // ⚡ Bolt Optimization: Pre-calculate lowercased search strings to avoid repeated ops in filter loop
                _searchName: (tx['Transaction Name'] || '').toLowerCase(),
                _searchMerchant: (tx.merchantLookup || '').toLowerCase(),
                _searchAmount: String(tx['Amount'] ?? ''),
                _searchDate: dateStr || '',
                _searchMcc: String(tx['MCC Code'] ?? ''),
                _dateTimestamp: isNaN(timestamp) ? 0 : timestamp
            };
        });
    }, [transactions]);

    // ⚡ Bolt Optimization: Sort FIRST, then Filter.
    // This ensures that when the user types in the search box (high frequency), we only run O(N) filter,
    // and do NOT re-run O(N log N) sort. The sorted order is preserved by filter.
    const sortedTransactions = useMemo(() => {
        let items = [...enrichedTransactions];

        if (sortConfig.key !== null) {
            items.sort((a, b) => {
                // ⚡ Bolt Optimization: Use pre-calculated timestamp for Date sorting
                if (sortConfig.key === 'Transaction Date') {
                    const aTime = a._dateTimestamp;
                    const bTime = b._dateTimestamp;
                    return sortConfig.direction === 'ascending' ? aTime - bTime : bTime - aTime;
                }

                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;

                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
                }

                return sortConfig.direction === 'ascending'
                    ? String(aValue).localeCompare(String(bValue))
                    : String(bValue).localeCompare(String(aValue));
            });
        }
        return items;
    }, [enrichedTransactions, sortConfig]);

    const filteredData = useMemo(() => {
        // Start with the ALREADY SORTED list
        let items = sortedTransactions;

        // ⚡ Bolt Optimization: Hoist toLowerCase out of loop and use pre-calculated fields
        // Skip client-side text filtering if server-side search is active
        if (!isServerSide && searchTerm) {
            const lowerCaseSearch = searchTerm.toLowerCase();
            items = items.filter(tx =>
                tx._searchName.includes(lowerCaseSearch) ||
                tx._searchMerchant.includes(lowerCaseSearch) ||
                tx._searchAmount.includes(lowerCaseSearch) ||
                tx._searchDate.includes(lowerCaseSearch) ||
                tx._searchMcc.includes(lowerCaseSearch)
            );
        }

        items = items
        .filter(tx => cardFilter === "all" || (tx['Card'] && tx['Card'][0] === cardFilter))
        .filter(tx => categoryFilter === "all" || tx['Category'] === categoryFilter)
        .filter(tx => methodFilter === "all" || tx['Method'] === methodFilter);

        // Client-side Date Range Filtering
        if (!isServerSide && effectiveDateRange?.from) {
            const fromStr = format(effectiveDateRange.from, 'yyyy-MM-dd');
            const toStr = effectiveDateRange.to ? format(effectiveDateRange.to, 'yyyy-MM-dd') : fromStr; // Default to single day if 'to' missing

            items = items.filter(tx => {
                // effectiveDate is YYYY-MM-DD
                return tx.effectiveDate >= fromStr && tx.effectiveDate <= toStr;
            });
        }

        // No need to sort here! 'items' retains the order from 'sortedTransactions'.
        return items;
    }, [sortedTransactions, searchTerm, cardFilter, categoryFilter, methodFilter, isServerSide, effectiveDateRange]);

    useEffect(() => {
        // Reset visible count when filters change or mode changes
        // For server-side, we want to start with a reasonable amount, not everything at once
        // This avoids the massive DOM lag when rendering 1000+ items
        setVisibleCount(20);
    }, [isServerSide, searchTerm, cardFilter, categoryFilter, methodFilter, effectiveDateRange]);

    const groupedData = useMemo(() => {
        // New Logic: Group all filtered data first.
        if (groupBy === 'none') {
            return { 'All Transactions': filteredData };
        }

        const groups = {};
        // Group everything (not just slice)
        filteredData.forEach(tx => {
            let key = 'Other';
            if (groupBy === 'card') {
                const cardId = tx['Card'] && tx['Card'][0];
                const card = cardMap.get(cardId);
                key = card ? card.name : 'Unknown Card';
            } else if (groupBy === 'category') {
                key = tx['Category'] || 'Uncategorized';
            } else if (groupBy === 'date') {
                key = formatDate(tx.effectiveDate) || 'No Date';
            }

            if (!groups[key]) groups[key] = [];
            groups[key].push(tx);
        });

        // Determine if current sort matches group key
        let isMatchingSort = false;
        if (groupBy === 'date' && sortConfig.key === 'Transaction Date') isMatchingSort = true;
        else if (groupBy === 'card' && sortConfig.key === 'Card') isMatchingSort = true;
        else if (groupBy === 'category' && sortConfig.key === 'Category') isMatchingSort = true;

        const sortedKeys = Object.keys(groups).sort((a, b) => {
            if (isMatchingSort) {
                // If keys match, strict adherence to sortConfig.direction
                if (groupBy === 'date') {
                    const dateA = groups[a][0].effectiveDate;
                    const dateB = groups[b][0].effectiveDate;
                    return sortConfig.direction === 'ascending'
                        ? new Date(dateA) - new Date(dateB)
                        : new Date(dateB) - new Date(dateA);
                }

                return sortConfig.direction === 'ascending'
                    ? a.localeCompare(b)
                    : b.localeCompare(a);
            }

            // Default fallback sorting for groups if not matching active sort
             if (groupBy === 'date') {
                 // Date Descending default
                 const dateA = groups[a][0].effectiveDate;
                 const dateB = groups[b][0].effectiveDate;
                 return new Date(dateB) - new Date(dateA);
             }
             // Alphabetical Ascending default
             return a.localeCompare(b);
        });

        return sortedKeys.reduce((obj, key) => {
            obj[key] = groups[key];
            return obj;
        }, {});

    }, [filteredData, groupBy, cardMap, sortConfig]);

    // Flatten the grouped data for rendering and pagination
    const flattenedTransactions = useMemo(() => {
        const list = [];
        Object.entries(groupedData).forEach(([key, items]) => {
            if (groupBy !== 'none') {
                list.push({ type: 'header', title: key, count: items.length });
            }
            items.forEach(tx => list.push({ type: 'item', ...tx }));
        });
        return list;
    }, [groupedData, groupBy]);

    const transactionsToShow = useMemo(() => {
        // If server side, we might just want to show all flattenedTransactions
        // But the previous useEffect tries to set visibleCount to large number.
        // Let's just slice safely.
        return flattenedTransactions.slice(0, visibleCount);
    }, [flattenedTransactions, visibleCount]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        const newSortConfig = { key, direction };
        setSortConfig(newSortConfig);

        if (isServerSide && onSortChange) {
            onSortChange(newSortConfig);
        }
    };

    const handleSortChange = (val) => {
        setSortByValue(val);
        let newSortConfig = null;
        if (val === 'Newest') newSortConfig = { key: 'Transaction Date', direction: 'descending' };
        else if (val === 'Oldest') newSortConfig = { key: 'Transaction Date', direction: 'ascending' };
        else if (val === 'Amount: High') newSortConfig = { key: 'Amount', direction: 'descending' };
        else if (val === 'Amount: Low') newSortConfig = { key: 'Amount', direction: 'ascending' };

        if (newSortConfig) {
            setSortConfig(newSortConfig);
            if (isServerSide && onSortChange) {
                onSortChange(newSortConfig);
            }
        }
    };

    const handleLoadMore = () => {
        const totalLoaded = flattenedTransactions.length;

        if (visibleCount < totalLoaded) {
             // If we have hidden local items, show more of them first
             setVisibleCount(prev => Math.min(prev + 20, totalLoaded));
        } else if (isServerSide && onLoadMore && hasMore) {
             // If we've shown all local items and there's more on server, fetch them
             onLoadMore();
             // We can optimistically increase count or wait for prop update
             // But usually best to let the prop update trigger re-render
             // Optionally we can bump visibleCount to ensure new items are seen immediately if needed
             // but logic above resets it on filter change, not on data append.
             // We might need a separate effect to bump visibleCount when data grows?
             // Actually, if we just fetch more, 'transactions' grows.
             // We want 'visibleCount' to grow to include the new items IF the user asked for them.

             // Let's implement an effect to auto-expand visibleCount when data appends via "Load More"
        } else {
            // Client side only load more
            setVisibleCount(prevCount => prevCount + 20);
        }
    };

    // Auto-expand visible count when server-side data is appended (not filtered/reset)
    useEffect(() => {
        if (isServerSide && isAppending) {
             // When appending finishes (loading false) or data length increases
             // We want to show the new items.
             // But here we don't know exactly how many came back easily without ref or tracking previous length.
             // A simple heuristic: if we were at the bottom (visible >= total), and total grew, update visible to total?
             // No, that re-introduces the lag if we load 1000 items.

             // Better: The user clicked "Load More". The intention is to see more.
             // Ideally we just add +20 to visibleCount, but we need to wait for data to arrive.
             // For now, let's just stick to manual "Load More" revealing local data +20 at a time.
             // So if server returns 50 items, user clicks "Load More" to see 20, then 20, then 10.
             // This keeps DOM light.
        }
    }, [isAppending, isServerSide]);

    const handleEdit = useCallback((tx) => {
        onEditTransaction(tx);
    }, [onEditTransaction]);

    const handleDelete = useCallback((txId, txName) => {
        onTransactionDeleted(txId, txName);
    }, [onTransactionDeleted]);

    const handleSelectAll = (checked) => {
        if (checked) {
            const allIds = filteredData.map(tx => tx.id);
            setSelectedIds(allIds);
        } else {
            setSelectedIds([]);
        }
    };

    // Memoized handleSelectOne to prevent re-creating it on every render
    const handleSelectOne = useCallback((txId, checked) => {
        if (checked) {
            setSelectedIds(prev => prev.includes(txId) ? prev : [...prev, txId]);
        } else {
            setSelectedIds(prev => prev.filter(id => id !== txId));
        }
    }, []);

    const handleBulkDeleteAction = () => {
        if (onBulkDelete) {
            onBulkDelete(selectedIds);
            setSelectedIds([]);
        }
    };

    const { totalAmount, totalCashback } = useMemo(() => {
        // ⚡ Bolt Optimization: Use Set for O(1) lookup instead of array.includes (O(N))
        if (selectedIds.length === 0) return { totalAmount: 0, totalCashback: 0 };
        const selectedSet = new Set(selectedIds);

        const selectedTxs = transactions.filter(tx => selectedSet.has(tx.id));
        const totalAmount = selectedTxs.reduce((sum, tx) => sum + (tx['Amount'] || 0), 0);
        const totalCashback = selectedTxs.reduce((sum, tx) => sum + (tx.estCashback || 0), 0);
        return { totalAmount, totalCashback };
    }, [selectedIds, transactions]);

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return <ChevronsUpDown className="ml-2 h-4 w-4" />;
        return sortConfig.direction === 'ascending' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
    };

    const renderMobileFilters = () => {
        return (
            <div className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm px-4 py-3 shadow-sm border-b border-slate-100/50 dark:border-slate-800/50 rounded-xl">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 py-1 select-none no-scrollbar">
                    {/* Search */}
                    <div className="relative flex items-center min-w-[140px]">
                        <Search className="absolute left-3 w-3.5 h-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder={isServerSide ? "Search Database..." : "Search..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-[30px] pl-8 pr-3 bg-slate-100 dark:bg-slate-900 rounded-full text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-500 transition-all border-none"
                        />
                        {searchTerm && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setSearchTerm('')}
                                className="absolute right-2 h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-700 p-0"
                                aria-label="Clear search"
                            >
                                <X className="w-3 h-3" />
                            </Button>
                        )}
                    </div>

                    {/* Card Filter Pill */}
                    <Select value={cardFilter} onValueChange={(val) => {
                        setCardFilter(val);
                        if (isServerSide && onFilterChange) onFilterChange({ type: 'card', value: val });
                    }}>
                        <SelectTrigger className="h-[30px] w-auto border-0 p-0 bg-transparent shadow-none focus:ring-0 [&>span]:hidden [&>svg]:hidden">
                             <div className={cn(
                                "flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all border cursor-pointer",
                                cardFilter !== 'all'
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm dark:bg-slate-100 dark:text-slate-900'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800'
                            )}>
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Card</span>
                                {cardFilter !== 'all' && (
                                    <>
                                        <span className="opacity-60">|</span>
                                        <span className="font-semibold max-w-[80px] truncate">
                                            {allCards.find(c => c.id === cardFilter)?.name || 'Selected'}
                                        </span>
                                    </>
                                )}
                                <ChevronDown className={cn("w-3 h-3 opacity-50", cardFilter !== 'all' ? 'text-white dark:text-slate-900' : '')} />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Cards</SelectItem>
                            {[...allCards].sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Category Filter Pill */}
                    <Select value={categoryFilter} onValueChange={(val) => {
                        setCategoryFilter(val);
                        if (isServerSide && onFilterChange) onFilterChange({ type: 'category', value: val });
                    }}>
                        <SelectTrigger className="h-[30px] w-auto border-0 p-0 bg-transparent shadow-none focus:ring-0 [&>span]:hidden [&>svg]:hidden">
                            <div className={cn(
                                "flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all border cursor-pointer",
                                categoryFilter !== 'all'
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm dark:bg-slate-100 dark:text-slate-900'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800'
                            )}>
                                <Filter className="w-3.5 h-3.5" />
                                <span>Cat</span>
                                {categoryFilter !== 'all' && (
                                    <>
                                        <span className="opacity-60">|</span>
                                        <span className="font-semibold max-w-[80px] truncate">{categoryFilter}</span>
                                    </>
                                )}
                                <ChevronDown className={cn("w-3 h-3 opacity-50", categoryFilter !== 'all' ? 'text-white dark:text-slate-900' : '')} />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Method Filter Pill */}
                    <Select value={methodFilter} onValueChange={(val) => {
                        setMethodFilter(val);
                        if (isServerSide && onFilterChange) onFilterChange({ type: 'method', value: val });
                    }}>
                        <SelectTrigger className="h-[30px] w-auto border-0 p-0 bg-transparent shadow-none focus:ring-0 [&>span]:hidden [&>svg]:hidden">
                            <div className={cn(
                                "flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all border cursor-pointer",
                                methodFilter !== 'all'
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm dark:bg-slate-100 dark:text-slate-900'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800'
                            )}>
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Method</span>
                                {methodFilter !== 'all' && (
                                    <>
                                        <span className="opacity-60">|</span>
                                        <span className="font-semibold max-w-[80px] truncate">{methodFilter}</span>
                                    </>
                                )}
                                <ChevronDown className={cn("w-3 h-3 opacity-50", methodFilter !== 'all' ? 'text-white dark:text-slate-900' : '')} />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Methods</SelectItem>
                            <SelectItem value="POS">POS</SelectItem>
                            <SelectItem value="eCom">eCom</SelectItem>
                            <SelectItem value="International">International</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Date Range Inputs (Mobile) */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-white dark:bg-slate-950 min-w-fit h-[30px]">
                        <input
                            type="date"
                            value={effectiveDateRange?.from ? format(effectiveDateRange.from, 'yyyy-MM-dd') : ''}
                            onChange={(e) => handleDateChange('from', e.target.value)}
                            className="bg-transparent text-xs focus:outline-none dark:text-slate-200 w-[85px]"
                            aria-label="Start Date"
                        />
                        <span className="text-slate-400 text-xs">-</span>
                        <input
                            type="date"
                            value={effectiveDateRange?.to ? format(effectiveDateRange.to, 'yyyy-MM-dd') : ''}
                            onChange={(e) => handleDateChange('to', e.target.value)}
                            className="bg-transparent text-xs focus:outline-none dark:text-slate-200 w-[85px]"
                            aria-label="End Date"
                        />
                        {(effectiveDateRange?.from || effectiveDateRange?.to) && (
                            <button
                                onClick={() => {
                                    if (isServerSide && onDateRangeChange) onDateRangeChange(undefined);
                                    else setInternalDateRange(undefined);
                                }}
                                className="ml-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                                aria-label="Clear dates"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </div>

                     {/* Group By Pill */}
                     <Select value={groupBy} onValueChange={setGroupBy}>
                        <SelectTrigger className="h-[30px] w-auto border-0 p-0 bg-transparent shadow-none focus:ring-0 [&>span]:hidden [&>svg]:hidden">
                            <div className={cn(
                                "flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all border cursor-pointer",
                                groupBy !== 'none'
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm dark:bg-slate-100 dark:text-slate-900'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800'
                            )}>
                                <Layers className="w-3.5 h-3.5" />
                                <span>Group</span>
                                {groupBy !== 'none' && (
                                    <>
                                        <span className="opacity-60">|</span>
                                        <span className="font-semibold max-w-[80px] truncate">{groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}</span>
                                    </>
                                )}
                                <ChevronDown className={cn("w-3 h-3 opacity-50", groupBy !== 'none' ? 'text-white dark:text-slate-900' : '')} />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">No Grouping</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                            <SelectItem value="category">Category</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Sort Pill */}
                    <Select value={sortByValue} onValueChange={handleSortChange}>
                        <SelectTrigger className="h-[30px] w-auto border-0 p-0 bg-transparent shadow-none focus:ring-0 [&>span]:hidden [&>svg]:hidden">
                            <div className={cn(
                                "flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all border cursor-pointer",
                                sortByValue !== 'Newest' && sortByValue !== 'Custom'
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm dark:bg-slate-100 dark:text-slate-900'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800'
                            )}>
                                <ArrowUpDown className="w-3.5 h-3.5" />
                                <span>Sort</span>
                                {sortByValue !== 'Newest' && sortByValue !== 'Custom' && (
                                    <>
                                        <span className="opacity-60">|</span>
                                        <span className="font-semibold max-w-[80px] truncate">{sortByValue}</span>
                                    </>
                                )}
                                <ChevronDown className={cn("w-3 h-3 opacity-50", sortByValue !== 'Newest' && sortByValue !== 'Custom' ? 'text-white dark:text-slate-900' : '')} />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Newest">Newest</SelectItem>
                            <SelectItem value="Oldest">Oldest</SelectItem>
                            <SelectItem value="Amount: High">Amount: High</SelectItem>
                            <SelectItem value="Amount: Low">Amount: Low</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        );
    }

    const renderContent = () => {
        // Only show full skeleton if it's an initial load (empty list)
        // If we have data but are loading (refreshing/searching), we show the overlay in CardContent instead.
        const shouldShowSkeleton = isLoading && transactions.length === 0;

        if (shouldShowSkeleton) {
             if (!isDesktop) {
                return (
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="p-3 border bg-white dark:bg-slate-950 dark:border-slate-800 rounded-lg space-y-3">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-5 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                    <div className="text-right flex-shrink-0 space-y-2">
                                        <Skeleton className="h-6 w-24 ml-auto" />
                                        <Skeleton className="h-4 w-16 ml-auto" />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center mt-2 pt-2 border-t">
                                    <Skeleton className="h-6 w-32" />
                                    <Skeleton className="h-8 w-8 rounded-md" />
                                </div>
                            </div>
                        ))}
                    </div>
                );
            }

            return (
                <div className="rounded-md">
                    <Table>
                        <TableHeader>
                             <TableRow>
                                <TableHead className="w-[30px] p-2">
                                    <Checkbox aria-label="Select all rows" />
                                </TableHead>
                                <TableHead className="w-[30px]"></TableHead>
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <TableHead key={i}><Skeleton className="h-4 w-20" /></TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: 7 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-16 mx-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            );
        }

        if (filteredData.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in duration-300">
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-full mb-3">
                        <Inbox className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No transactions found</h3>
                    <p className="text-sm text-slate-500 max-w-sm mt-1 mb-4">
                        We couldn't find any transactions matching your current filters.
                    </p>
                    {(searchTerm || cardFilter !== 'all' || categoryFilter !== 'all' || methodFilter !== 'all') && (
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSearchTerm('');
                                setCardFilter('all');
                                setCategoryFilter('all');
                                setMethodFilter('all');
                            }}
                        >
                            Clear all filters
                        </Button>
                    )}
                </div>
            );
        }

        if (!isDesktop) {
            return (
                <div className="space-y-2.5 p-3">
                    {/* Select All Row */}
                    {filteredData.length > 0 && (
                        <div className="flex items-center justify-between px-2 pt-1 pb-1">
                            <div className="flex items-center gap-2 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleSelectAll(selectedIds.length !== filteredData.length); }}>
                                <Checkbox
                                    checked={selectedIds.length > 0 && selectedIds.length === filteredData.length}
                                    onCheckedChange={handleSelectAll}
                                    aria-label="Select all transactions"
                                    className={cn("h-5 w-5 rounded border data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 bg-white border-slate-300")}
                                />
                                <span className="text-xs font-medium text-slate-500">Select All</span>
                            </div>
                            <span className="text-[10px] text-slate-400">{filteredData.length} items</span>
                        </div>
                    )}

                    {transactionsToShow.map((item, index) => {
                        if (item.type === 'header') {
                            return (
                                <div key={`header-${index}`} className="pt-2 pb-1 px-1">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{item.title} ({item.count})</span>
                                </div>
                            );
                        }

                        const tx = item;
                        const isSelected = selectedIds.includes(tx.id);
                        return (
                            <MobileTransactionItem
                                key={tx.id}
                                transaction={tx}
                                isSelected={isSelected}
                                onSelect={handleSelectOne}
                                onClick={onViewDetails}
                                cardMap={cardMap}
                                currencyFn={currency}
                                isDeleting={processingIds.has(tx.id)}
                                isUpdating={syncingIds.has(tx.id)}
                            />
                        );
                    })}
                </div>
            );
        }

        // --- DESKTOP TABLE VIEW (Refactored) ---
        return (
            <div className="rounded-md">
                 <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[30px] p-2">
                                    <Checkbox
                                        checked={selectedIds.length > 0 && selectedIds.length === filteredData.length}
                                        onCheckedChange={handleSelectAll}
                                        aria-label="Select all"
                                    />
                                </TableHead>
                                <TableHead className="w-[30px]"></TableHead>

                                {/* Dynamic Headers */}
                                {activeColumns.map(col => (
                                    <TableHead key={col.id} className={col.width || ''}>
                                        {col.sortKey ? (
                                            <Button
                                                variant="ghost"
                                                onClick={() => requestSort(col.sortKey)}
                                                className={cn(
                                                    "px-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1",
                                                    col.headerClass?.includes("text-right") ? "w-full justify-end ml-0" : "",
                                                    col.headerClass || ""
                                                )}
                                            >
                                                {col.label} <SortIcon columnKey={col.sortKey} />
                                            </Button>
                                        ) : (
                                            <div className={cn("flex items-center", col.headerClass?.includes("text-right") ? "justify-end" : "", col.headerClass || "")}>
                                                <span>{col.label}</span>
                                            </div>
                                        )}
                                    </TableHead>
                                ))}

                                <TableHead className="w-[100px] text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactionsToShow.map((item, index) => {
                                if (item.type === 'header') {
                                    return (
                                        <TableRow key={`group-${index}-${item.title}`} className="bg-slate-100/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-900">
                                            {/* colSpan = activeColumns.length + 3 (Check, Spacer, Actions) */}
                                            <TableCell colSpan={activeColumns.length + 3} className="py-2 px-4 font-semibold text-xs uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                                                {item.title} <span className="ml-1 text-slate-400 font-normal">({item.count})</span>
                                            </TableCell>
                                        </TableRow>
                                    );
                                }

                                const tx = item;
                                return (
                                    <TransactionRow
                                        key={tx.id}
                                        transaction={tx}
                                        isSelected={selectedIds.includes(tx.id)}
                                        activeColumns={activeColumns}
                                        onSelect={handleSelectOne}
                                        onViewDetails={onViewDetails}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        isDeleting={processingIds.has(tx.id)}
                                        isUpdating={syncingIds.has(tx.id)}
                                    />
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
        );
    };

    const renderBulkBar = (isStickyMobile) => (
        <div className={cn(
            "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-slate-900 text-white animate-in fade-in slide-in-from-top-2",
            isStickyMobile ? "fixed bottom-4 left-4 right-4 z-50 shadow-xl rounded-xl" : ""
        )}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pl-1 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-300 hover:text-white shrink-0"
                        onClick={() => setSelectedIds([])}
                        aria-label="Clear selection"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium whitespace-nowrap">{selectedIds.length} Selected</span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-300 ml-10 sm:ml-0">
                    <span className="whitespace-nowrap">Total: <span className="text-white font-medium">{currency(totalAmount)}</span></span>
                    <span className="hidden sm:inline">•</span>
                    <span className="whitespace-nowrap">Cashback: <span className="text-emerald-400 font-medium">{currency(totalCashback)}</span></span>
                </div>
            </div>
            <div className="flex items-center gap-2 pr-2 w-full sm:w-auto justify-end">
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsBulkEditDialogOpen(true)}
                    className="bg-white dark:bg-slate-900 w-full sm:w-auto text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800"
                >
                    <FilePenLine className="mr-2 h-3.5 w-3.5" />
                    Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={handleBulkDeleteAction} className="w-full sm:w-auto">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete ({selectedIds.length})
                </Button>
            </div>
        </div>
    );

    return (
        <Card className={cn(
            "relative",
            isDesktop ? "bg-white dark:bg-slate-950 border shadow-sm" : "bg-slate-50 dark:bg-slate-950 border-0 shadow-none"
        )}>
            {/* Mobile Bulk Bar - Rendered OUTSIDE the static header wrapper */}
            {!isDesktop && selectedIds.length > 0 && renderBulkBar(true)}

            {isDesktop ? (
                // DESKTOP LAYOUT
                <div className="sticky top-16 z-30 bg-background shadow-sm rounded-t-xl overflow-hidden">
                    {/* Desktop Bulk Bar */}
                    {selectedIds.length > 0 && renderBulkBar(false)}

                     <CardHeader className="border-b p-4">
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <CardTitle>
                                    {activeMonth === 'live'
                                        ? 'Recent Transactions'
                                        : `Transactions for ${fmtYMShortFn(activeMonth)}`
                                    }
                                </CardTitle>
                                {activeMonth !== 'live' && (
                                    <Tabs defaultValue="date" value={filterType} onValueChange={onFilterTypeChange} className="flex items-center">
                                        <TabsList className="bg-slate-100 p-1 rounded-lg">
                                            <TabsTrigger value="date">Transaction Date</TabsTrigger>
                                            <TabsTrigger value="cashbackMonth">Cashback Month</TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                )}
                            </div>

                            {/* Toolbar */}
                            <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center transition-colors">
                                <div className="flex flex-wrap gap-2 items-center w-full xl:w-auto">
                                    {/* Search */}
                                    <div className="relative w-full md:w-64">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="search"
                                            placeholder={isServerSide ? "Search Database..." : "Search..."}
                                            className="pl-8 h-10"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>

                                    {/* Native Date Range Inputs */}
                                    <div className="flex items-center gap-2 border rounded-md px-2 py-1 h-10 bg-white dark:bg-slate-950">
                                        <input
                                            type="date"
                                            value={effectiveDateRange?.from ? format(effectiveDateRange.from, 'yyyy-MM-dd') : ''}
                                            onChange={(e) => handleDateChange('from', e.target.value)}
                                            className="bg-transparent text-sm focus:outline-none dark:text-slate-200 w-[110px]"
                                            aria-label="Start Date"
                                        />
                                        <span className="text-slate-400">-</span>
                                        <input
                                            type="date"
                                            value={effectiveDateRange?.to ? format(effectiveDateRange.to, 'yyyy-MM-dd') : ''}
                                            onChange={(e) => handleDateChange('to', e.target.value)}
                                            className="bg-transparent text-sm focus:outline-none dark:text-slate-200 w-[110px]"
                                            aria-label="End Date"
                                        />
                                    </div>

                                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>

                                    {/* Card Filter */}
                                    <Select value={cardFilter} onValueChange={(val) => {
                                        setCardFilter(val);
                                        if (isServerSide && onFilterChange) onFilterChange({ type: 'card', value: val });
                                    }}>
                                        <SelectTrigger className="w-full md:w-[160px] h-10">
                                            <div className="flex items-center gap-2 truncate">
                                                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span className="truncate">
                                                    {cardFilter === 'all' ? 'All Cards' : allCards.find(c => c.id === cardFilter)?.name || 'Selected'}
                                                </span>
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Cards</SelectItem>
                                            {[...allCards].sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {/* Category Filter */}
                                    <Select value={categoryFilter} onValueChange={(val) => {
                                        setCategoryFilter(val);
                                        if (isServerSide && onFilterChange) onFilterChange({ type: 'category', value: val });
                                    }}>
                                        <SelectTrigger className="w-full md:w-[160px] h-10">
                                            <div className="flex items-center gap-2 truncate">
                                                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span className="truncate">
                                                    {categoryFilter === 'all' ? 'All Categories' : categoryFilter}
                                                </span>
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map(cat => (
                                                <SelectItem key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>

                                    {/* Method Filter */}
                                    <Select value={methodFilter} onValueChange={(val) => {
                                        setMethodFilter(val);
                                        if (isServerSide && onFilterChange) onFilterChange({ type: 'method', value: val });
                                    }}>
                                        <SelectTrigger className="w-full md:w-[160px] h-10">
                                            <div className="flex items-center gap-2 truncate">
                                                <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span className="truncate">
                                                    {methodFilter === 'all' ? 'All Methods' : methodFilter}
                                                </span>
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Methods</SelectItem>
                                            <SelectItem value="POS">POS</SelectItem>
                                            <SelectItem value="eCom">eCom</SelectItem>
                                            <SelectItem value="International">International</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>

                                    {/* Group By */}
                                    <Select value={groupBy} onValueChange={setGroupBy}>
                                        <SelectTrigger
                                            className={cn(
                                                "hidden md:flex h-10 w-10 p-0 items-center justify-center [&>svg]:hidden",
                                                groupBy !== 'none' && "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-slate-100"
                                            )}
                                            aria-label="Group by"
                                        >
                                            <div className="flex items-center justify-center">
                                                <Layers className={cn(
                                                    "h-4 w-4",
                                                    groupBy === 'none' ? "text-muted-foreground" : "text-white dark:text-slate-900"
                                                )} />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No Grouping</SelectItem>
                                            <SelectItem value="card">Group by Card</SelectItem>
                                            <SelectItem value="category">Group by Category</SelectItem>
                                            <SelectItem value="date">Group by Date</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>

                                    {/* Columns Selection - REFACTORED */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="icon" className="h-10 w-10" aria-label="Columns">
                                                <Settings2 className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-[180px]">
                                            <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            {columnsConfig.map((column) => (
                                                <DropdownMenuCheckboxItem
                                                    key={column.id}
                                                    checked={visibleColumnIds.includes(column.id)}
                                                    onCheckedChange={(checked) => {
                                                        setVisibleColumnIds(prev =>
                                                            checked
                                                                ? [...prev, column.id]
                                                                : prev.filter(id => id !== column.id)
                                                        );
                                                    }}
                                                    onSelect={(e) => e.preventDefault()}
                                                >
                                                    {column.label}
                                                </DropdownMenuCheckboxItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                </div>
            ) : (
                // MOBILE HEADER (Filters Only)
                renderMobileFilters()
            )}

            <CardContent className={cn("p-0 min-h-[300px] relative")}>
                {isLoading && transactions.length > 0 && (
                     <div className="absolute inset-0 z-20 bg-white/50 dark:bg-slate-950/50 backdrop-blur-[1px] flex items-center justify-center rounded-b-xl transition-all duration-200 animate-in fade-in">
                         <div className="bg-white dark:bg-slate-900 p-3 rounded-full shadow-lg border dark:border-slate-800">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                         </div>
                     </div>
                )}
                <div className={cn("transition-opacity duration-200", isLoading && transactions.length > 0 ? "opacity-40 pointer-events-none select-none" : "")}>
                    {renderContent()}
                </div>

                <div className="mt-2 flex flex-col items-center gap-4 mb-6">
                    <p className="text-sm text-muted-foreground">
                        {isServerSide ? (
                            <>Showing <span className="font-semibold text-primary">{transactionsToShow.filter(t => t.type !== 'header').length}</span> loaded items</>
                        ) : (
                            <>Showing <span className="font-semibold text-primary">{transactionsToShow.filter(t => t.type !== 'header').length}</span> of <span className="font-semibold text-primary">{filteredData.length}</span> items</>
                        )}
                    </p>
                    {(visibleCount < flattenedTransactions.length || (isServerSide && hasMore)) && (
                        <Button onClick={handleLoadMore} variant="outline" disabled={isServerSide && (isLoading || isAppending)}>
                            {isServerSide && (isLoading || isAppending) ? 'Loading...' : 'Load More'}
                        </Button>
                    )}
                </div>
            </CardContent>

            <BulkEditDialog
                isOpen={isBulkEditDialogOpen}
                onClose={() => setIsBulkEditDialogOpen(false)}
                selectedIds={selectedIds}
                allTransactions={transactions}
                categories={categories.filter(c => c !== 'all')}
                cards={allCards}
                rules={rules}
                mccMap={mccMap}
                getCurrentCashbackMonthForCard={getCurrentCashbackMonthForCard}
                onUpdateComplete={(updatedTransactions) => {
                    if (onBulkUpdate) onBulkUpdate(updatedTransactions);
                    setSelectedIds([]);
                    setIsBulkEditDialogOpen(false);
                }}
            />
        </Card>
    );
});

TransactionsList.displayName = "TransactionsList";

export default TransactionsList;
import React, { useState, useMemo, useEffect } from 'react';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "../../ui/table";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Input } from "../../ui/input";
import { Checkbox } from "../../ui/checkbox";
import {
    Check, Trash2, FilePenLine, ChevronDown, ChevronUp,
    AlertTriangle, ArrowUp, ArrowDown, Search,
    MoreHorizontal, Loader2, Filter, Layers, X, Wand2,
    CreditCard, ArrowUpDown
} from "lucide-react";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "../../ui/dropdown-menu";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "../../ui/select";
import { cn } from "../../../lib/utils";
import { formatTransactionDate } from "../../../lib/date";
import { toast } from 'sonner';
import BulkEditDialog from '../dialogs/BulkEditDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../ui/tooltip";

const TransactionReview = React.memo(({
    transactions,
    isLoading,
    onRefresh,
    cards,
    categories,
    rules,
    getCurrentCashbackMonthForCard,
    onEditTransaction,
    isDesktop,
    mccMap,
    setReviewTransactions, // NEW PROP for Optimistic Updates
    onReviewUpdate // NEW PROP for Optimistic Main List Updates
}) => {
    // FIX 1: Set initial state to false so it does not auto-expand on load
    const [isOpen, setIsOpen] = useState(false);

    const [selectedIds, setSelectedIds] = useState(new Set());
    const [sortConfig, setSortConfig] = useState({ key: 'Transaction Date', direction: 'descending' });
    const [filters, setFilters] = useState({
        search: '',
        card: 'all',
        status: 'all'
    });
    // FIX 2 & 3: Grouping State
    const [groupBy, setGroupBy] = useState('date'); // Default to date
    const [sortByValue, setSortByValue] = useState('Newest');

    // Bulk Edit State
    const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);
    const [isProcessing] = useState(false);

    // NEW: Processing IDs to track individual loading states
    const [processingIds] = useState(new Set());

    // Sync sortConfig with sortByValue
    useEffect(() => {
        if (sortConfig.key === 'Transaction Date' && sortConfig.direction === 'descending') setSortByValue('Newest');
        else if (sortConfig.key === 'Transaction Date' && sortConfig.direction === 'ascending') setSortByValue('Oldest');
        else if (sortConfig.key === 'Amount' && sortConfig.direction === 'descending') setSortByValue('Amount: High');
        else if (sortConfig.key === 'Amount' && sortConfig.direction === 'ascending') setSortByValue('Amount: Low');
    }, [sortConfig]);

    // --- Helper: Format MCC ---
    const formatMcc = (code) => {
        if (!code) return null;
        const name = mccMap && mccMap[code] ? mccMap[code].vn : null;
        return name ? `${code} - ${name}` : code;
    };

    // --- 1. Logic to Calculate Status ---
    const enrichedTransactions = useMemo(() => {
        return transactions.map(tx => {
            let status = '';
            let statusType = 'neutral'; // neutral, warning, success, info

            // Check conditions
            const hasMcc = !!tx['MCC Code'];
            const hasRule = !!tx['Applicable Rule'] && tx['Applicable Rule'].length > 0;
            const isMatch = tx['Match'];
            const isAutomated = tx['Automated'];

            if (!hasMcc) {
                status = 'Missing MCC';
                statusType = 'warning';
            } else if (!hasRule) {
                status = 'Missing Rule';
                statusType = 'warning';
            } else if (!isMatch) {
                status = 'Mismatch';
                statusType = 'error';
            } else if (isAutomated) {
                status = 'Quick Approve';
                statusType = 'success';
            } else {
                status = 'Review Needed';
                statusType = 'info';
            }

            return {
                ...tx,
                status,
                statusType,
                // ⚡ Bolt Optimization: Pre-calculate lowercased search strings to avoid repetitive ops in filter loop
                _searchName: (tx['Transaction Name'] || '').toLowerCase(),
                _searchAmount: String(tx['Amount'] ?? ''),
                _searchMcc: tx['MCC Code'] ? String(tx['MCC Code']) : ''
            };
        });
    }, [transactions]);

    // --- 2. Filtering & Sorting ---
    const filteredData = useMemo(() => {
        let data = [...enrichedTransactions];

        // Filter by Search
        if (filters.search) {
            const lowerSearch = filters.search.toLowerCase();
            data = data.filter(tx =>
                tx._searchName.includes(lowerSearch) ||
                tx._searchAmount.includes(lowerSearch) ||
                tx._searchMcc.includes(lowerSearch)
            );
        }

        // Filter by Card
        if (filters.card !== 'all') {
            data = data.filter(tx => tx['Card'] && tx['Card'][0] === filters.card);
        }

        // Filter by Status
        if (filters.status !== 'all') {
             if (filters.status === 'automated') data = data.filter(tx => tx.status === 'Quick Approve');
             if (filters.status === 'missing') data = data.filter(tx => tx.status.includes('Missing'));
             if (filters.status === 'mismatch') data = data.filter(tx => tx.status === 'Mismatch');
        }

        // Sorting (Only applies if NOT grouped, or sorts within groups)
        if (sortConfig.key) {
            data.sort((a, b) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];

                if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }

        return data;
    }, [enrichedTransactions, filters, sortConfig]);

    // --- 3. Grouping Logic ---
    const groupedData = useMemo(() => {
        if (groupBy === 'none') {
            return { 'All Transactions': filteredData };
        }

        const groups = {};
        filteredData.forEach(tx => {
            let key = 'Other';

            if (groupBy === 'card') {
                const cardId = tx['Card'] && tx['Card'][0];
                const card = cards.find(c => c.id === cardId);
                key = card ? card.name : 'Unknown Card';
            } else if (groupBy === 'status') {
                key = tx.status;
            } else if (groupBy === 'date') {
                key = tx['Transaction Date'];
            }

            if (!groups[key]) groups[key] = [];
            groups[key].push(tx);
        });

        // Sort keys to make groups appear in order (optional)
        return Object.keys(groups).sort((a, b) => {
             // Check if Sort Key matches Group Key
             let isMatchingSort = false;
             if (groupBy === 'date' && sortConfig.key === 'Transaction Date') isMatchingSort = true;
             else if (groupBy === 'card' && sortConfig.key === 'Card') isMatchingSort = true;
             else if (groupBy === 'category' && sortConfig.key === 'Category') isMatchingSort = true;
             else if (groupBy === 'status' && sortConfig.key === 'Status') isMatchingSort = true;

             if (isMatchingSort) {
                 if (groupBy === 'date') {
                      return sortConfig.direction === 'ascending'
                          ? new Date(a) - new Date(b)
                          : new Date(b) - new Date(a);
                 }
                 return sortConfig.direction === 'ascending'
                    ? a.localeCompare(b)
                    : b.localeCompare(a);
             }

             if (groupBy === 'date') return new Date(b) - new Date(a);
             return a.localeCompare(b);
        }).reduce((obj, key) => {
            obj[key] = groups[key];
            return obj;
        }, {});
    }, [filteredData, groupBy, cards, sortConfig]);


    // --- 4. Event Handlers ---

    const handleSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleSortChange = (val) => {
        setSortByValue(val);
        if (val === 'Newest') setSortConfig({ key: 'Transaction Date', direction: 'descending' });
        else if (val === 'Oldest') setSortConfig({ key: 'Transaction Date', direction: 'ascending' });
        else if (val === 'Amount: High') setSortConfig({ key: 'Amount', direction: 'descending' });
        else if (val === 'Amount: Low') setSortConfig({ key: 'Amount', direction: 'ascending' });
    };

    const handleSelectAll = () => {
        if (selectedIds.size === filteredData.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredData.map(tx => tx.id)));
        }
    };

    const handleSelectOne = (id) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleSingleProcess = async (tx) => {
        // Optimistic Update: Immediately remove from UI
        if (setReviewTransactions) {
            setReviewTransactions(prev => prev.filter(t => t.id !== tx.id));
        }

        try {
            // STATE 1: MISMATCH (Red Status) -> FIX CATEGORY & FINALIZE
            if (tx.status === 'Mismatch') {
                const cardId = tx['Card'] && tx['Card'][0];
                const card = cards.find(c => c.id === cardId);
                const ruleId = tx['Applicable Rule'] && tx['Applicable Rule'][0];

                if (!card || !ruleId) {
                    throw new Error("Missing Card or Rule data for mismatch fix.");
                }

                // 1. Calculate correct month
                const month = getCurrentCashbackMonthForCard(card, tx['Transaction Date']);

                // 2. Find/Create Summary
                const summaryRes = await fetch(`${API_BASE_URL}/summaries`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cardId, month, ruleId })
                });

                if (!summaryRes.ok) throw new Error("Failed to resolve summary.");
                const summary = await summaryRes.json();

                // 3. Update Transaction (Link Summary + Uncheck Automated)
                const updateRes = await fetch(`${API_BASE_URL}/transactions/${tx.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        cardSummaryCategoryId: summary.id,
                        // Implicitly handled by PATCH: Automated becomes false?
                        // Actually PATCH in server.js sets 'Automated' to false automatically.
                    })
                });

                if (!updateRes.ok) throw new Error("Update failed.");

                const updatedTx = await updateRes.json();

                // Optimistic Update Main Lists
                if (onReviewUpdate) {
                    onReviewUpdate('update', tx.id, updatedTx);
                }

                toast.success("Mismatch fixed & approved.");
                onRefresh();
            }
            // STATE 2: QUICK APPROVE (Green Status) -> FINALIZE
            else if (tx.status === 'Quick Approve') {
                const res = await fetch(`${API_BASE_URL}/transactions/finalize`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: [tx.id] })
                });
                if (!res.ok) throw new Error("Finalize failed");

                // Optimistic Update Main Lists
                if (onReviewUpdate) {
                    // "Quick Approve" implies accepting it as is (Automated=false is usually the backend side effect)
                    // We optimistically update the flag locally
                    const optimisticTx = { ...tx, Automated: false };
                    onReviewUpdate('update', tx.id, optimisticTx);
                }

                toast.success("Transaction approved.");
                // Background refresh only - do not block UI
                onRefresh();
            }
        } catch (error) {
            console.error(error);
            toast.error("Process failed.");
            // Revert state if needed, but for now we assume success for speed.
            // A full refresh would correct any sync errors.
            onRefresh();
        }
    };

    const handleBulkProcess = async () => {
        const txsToProcess = filteredData.filter(tx => selectedIds.has(tx.id));
        if (txsToProcess.length === 0) return;

        const quickApproveIds = txsToProcess.filter(tx => tx.status === 'Quick Approve').map(t => t.id);

        // Optimistic Update
        if (setReviewTransactions && quickApproveIds.length > 0) {
             const idsToRemove = new Set(quickApproveIds);
             setReviewTransactions(prev => prev.filter(t => !idsToRemove.has(t.id)));
             setSelectedIds(prev => {
                 const next = new Set(prev);
                 quickApproveIds.forEach(id => next.delete(id));
                 return next;
             });
        }

        try {
            let successCount = 0;

            // 1. Process Quick Approves (Finalize)
            if (quickApproveIds.length > 0) {
                await fetch(`${API_BASE_URL}/transactions/finalize`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: quickApproveIds })
                });
                successCount += quickApproveIds.length;
            }

            if (successCount > 0) {
                toast.success(`Approved ${successCount} transactions.`);
                onRefresh();
            } else {
                toast.info("No 'Quick Approve' transactions selected.");
            }

        } catch (error) {
            console.error(error);
            toast.error("Bulk process failed.");
            onRefresh(); // Re-fetch to restore state if failed
        }
    };

    const handleSingleDelete = async (id) => {
        if (!window.confirm("Delete this transaction?")) return;

        // Optimistic Update
        if (setReviewTransactions) {
            setReviewTransactions(prev => prev.filter(t => t.id !== id));
        }

        // Optimistic Update Main Lists
        if (onReviewUpdate) {
            onReviewUpdate('delete', id);
        }

        try {
             const res = await fetch(`${API_BASE_URL}/transactions/${id}`, { method: 'DELETE' });
             if (!res.ok) throw new Error("Delete failed");

             const newSelected = new Set(selectedIds);
             newSelected.delete(id);
             setSelectedIds(newSelected);

             toast.success("Transaction deleted.");
             onRefresh();
        } catch(err) {
            toast.error("Failed to delete.");
            onRefresh();
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} transactions?`)) return;

        const ids = Array.from(selectedIds);

        // Optimistic Update
        if (setReviewTransactions) {
             const idsToRemove = new Set(ids);
             setReviewTransactions(prev => prev.filter(t => !idsToRemove.has(t.id)));
             setSelectedIds(new Set());
        }

        // Optimistic Update Main Lists
        if (onReviewUpdate) {
            onReviewUpdate('delete', ids);
        }

        try {
            const res = await fetch(`${API_BASE_URL}/transactions/bulk-delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids })
            });

            if (!res.ok) throw new Error("Delete failed");

            toast.success("Transactions deleted.");
            onRefresh(); // Background sync

        } catch (error) {
            console.error(error);
            toast.error("Failed to delete transactions.");
            onRefresh();
        }
    };

    const currency = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

    // 1. Loading State
    if (isLoading) {
        return (
            <div className="border rounded-lg bg-white dark:bg-slate-950 dark:border-slate-800 shadow-sm mb-6 overflow-hidden transition-colors">
                <div className="p-4 bg-white dark:bg-slate-950 flex justify-between items-center select-none transition-colors">
                    <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                        <h3 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center">
                            Checking transactions...
                        </h3>
                    </div>
                </div>
            </div>
        );
    }

    // 2. All Caught Up State (No transactions)
    if (transactions.length === 0) {
        return (
            <div className="border rounded-lg bg-white dark:bg-slate-950 dark:border-slate-800 shadow-sm mb-6 overflow-hidden transition-colors">
                <div className="p-4 bg-white dark:bg-slate-950 border-emerald-100 dark:border-emerald-900/50 flex justify-between items-center select-none transition-colors">
                    <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                            <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h3 className="font-semibold text-emerald-950 dark:text-emerald-100 flex items-center">
                            All caught up!
                        </h3>
                    </div>
                </div>
            </div>
        );
    }

    // --- RENDER HELPERS ---

    const renderBulkBar = () => (
         <div className="sticky top-16 z-40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-slate-900 text-white shadow-md rounded-b-xl animate-in fade-in slide-in-from-top-2 mb-4">
            <div className="flex items-center gap-4 pl-1 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                     <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-300 hover:text-white shrink-0"
                        onClick={() => setSelectedIds(new Set())}
                        aria-label="Clear selection"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium whitespace-nowrap">{selectedIds.size} Selected</span>
                </div>
            </div>
            <div className="flex items-center gap-2 pr-2 w-full sm:w-auto justify-end">
                 <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkProcess}
                    disabled={isProcessing}
                    className="bg-slate-800 border-slate-700 text-emerald-400 hover:text-emerald-300 hover:bg-slate-700"
                >
                    {isProcessing ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin"/> : <Wand2 className="mr-2 h-3.5 w-3.5" />}
                    Smart Process
                </Button>
                <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={isProcessing} className="w-full sm:w-auto">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
            </div>
        </div>
    );

    const renderMobileFilters = () => {
        return (
            <div className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm px-4 py-3 shadow-sm border-b border-slate-100/50 dark:border-slate-800/50">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 py-1 select-none no-scrollbar">
                    {/* Search */}
                    <div className="relative flex items-center min-w-[140px]">
                        <Search className="absolute left-3 w-3.5 h-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={filters.search}
                            onChange={(e) => setFilters({...filters, search: e.target.value})}
                            className="w-full h-[30px] pl-8 pr-3 bg-slate-100 dark:bg-slate-900 rounded-full text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-500 transition-all border-none"
                        />
                        {filters.search && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setFilters({...filters, search: ''})}
                                className="absolute right-2 h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-700 p-0"
                                aria-label="Clear search"
                            >
                                <X className="w-3 h-3" />
                            </Button>
                        )}
                    </div>

                    {/* Card Filter Pill */}
                    <Select value={filters.card} onValueChange={(v) => setFilters({...filters, card: v})}>
                        <SelectTrigger className="h-[30px] w-auto border-0 p-0 bg-transparent shadow-none focus:ring-0 [&>span]:hidden [&>svg]:hidden">
                             <div className={cn(
                                "flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all border cursor-pointer",
                                filters.card !== 'all'
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm dark:bg-slate-100 dark:text-slate-900'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800'
                            )}>
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Card</span>
                                {filters.card !== 'all' && (
                                    <>
                                        <span className="opacity-60">|</span>
                                        <span className="font-semibold max-w-[80px] truncate">
                                            {cards.find(c => c.id === filters.card)?.name || 'Selected'}
                                        </span>
                                    </>
                                )}
                                <ChevronDown className={cn("w-3 h-3 opacity-50", filters.card !== 'all' ? 'text-white dark:text-slate-900' : '')} />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Cards</SelectItem>
                            {[...cards].sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Status Filter Pill */}
                    <Select value={filters.status} onValueChange={(v) => setFilters({...filters, status: v})}>
                        <SelectTrigger className="h-[30px] w-auto border-0 p-0 bg-transparent shadow-none focus:ring-0 [&>span]:hidden [&>svg]:hidden">
                            <div className={cn(
                                "flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all border cursor-pointer",
                                filters.status !== 'all'
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm dark:bg-slate-100 dark:text-slate-900'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800'
                            )}>
                                <Filter className="w-3.5 h-3.5" />
                                <span>Status</span>
                                {filters.status !== 'all' && (
                                    <>
                                        <span className="opacity-60">|</span>
                                        <span className="font-semibold max-w-[80px] truncate">
                                            {filters.status === 'automated' ? 'Quick Approve' :
                                             filters.status === 'missing' ? 'Missing Info' :
                                             filters.status === 'mismatch' ? 'Mismatch' : filters.status}
                                        </span>
                                    </>
                                )}
                                <ChevronDown className={cn("w-3 h-3 opacity-50", filters.status !== 'all' ? 'text-white dark:text-slate-900' : '')} />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="automated">Quick Approve</SelectItem>
                            <SelectItem value="missing">Missing Info</SelectItem>
                            <SelectItem value="mismatch">Mismatch</SelectItem>
                        </SelectContent>
                    </Select>

                     {/* Group By Pill */}
                     <Select value={groupBy} onValueChange={setGroupBy}>
                        <SelectTrigger className="h-[30px] w-auto border-0 p-0 bg-transparent shadow-none focus:ring-0 [&>span]:hidden [&>svg]:hidden">
                            <div className={cn(
                                "flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all border cursor-pointer",
                                groupBy !== 'none'
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm dark:bg-slate-100 dark:text-slate-900'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800'
                            )}>
                                <Layers className="w-3.5 h-3.5" />
                                <span>Group</span>
                                {groupBy !== 'none' && (
                                    <>
                                        <span className="opacity-60">|</span>
                                        <span className="font-semibold max-w-[80px] truncate">{groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}</span>
                                    </>
                                )}
                                <ChevronDown className={cn("w-3 h-3 opacity-50", groupBy !== 'none' ? 'text-white dark:text-slate-900' : '')} />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">No Grouping</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                            <SelectItem value="status">Status</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Sort Pill */}
                    <Select value={sortByValue} onValueChange={handleSortChange}>
                        <SelectTrigger className="h-[30px] w-auto border-0 p-0 bg-transparent shadow-none focus:ring-0 [&>span]:hidden [&>svg]:hidden">
                            <div className={cn(
                                "flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all border cursor-pointer",
                                sortByValue !== 'Newest' && sortByValue !== 'Custom'
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm dark:bg-slate-100 dark:text-slate-900'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800'
                            )}>
                                <ArrowUpDown className="w-3.5 h-3.5" />
                                <span>Sort</span>
                                {sortByValue !== 'Newest' && sortByValue !== 'Custom' && (
                                    <>
                                        <span className="opacity-60">|</span>
                                        <span className="font-semibold max-w-[80px] truncate">{sortByValue}</span>
                                    </>
                                )}
                                <ChevronDown className={cn("w-3 h-3 opacity-50", sortByValue !== 'Newest' && sortByValue !== 'Custom' ? 'text-white dark:text-slate-900' : '')} />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Newest">Newest</SelectItem>
                            <SelectItem value="Oldest">Oldest</SelectItem>
                            <SelectItem value="Amount: High">Amount: High</SelectItem>
                            <SelectItem value="Amount: Low">Amount: Low</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        );
    }

    // 3. Review Needed State (Has transactions)
    return (
        <div className={cn(
            "border rounded-lg bg-white dark:bg-slate-950 dark:border-slate-800 shadow-sm mb-6 transition-colors relative",
            // Remove overflow-hidden on mobile when open to allow sticky header to work
            isOpen && !isDesktop ? "" : "overflow-hidden"
        )}>
            {/* Header */}
            <button
                type="button"
                className="w-full p-4 bg-orange-50 dark:bg-orange-950/30 border-b border-orange-100 dark:border-orange-900/50 flex justify-between items-center cursor-pointer select-none transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-controls="review-needed-content"
            >
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-500" />
                    <h3 className="font-semibold text-orange-900 dark:text-orange-100 flex items-center">
                        Review Needed
                        <Badge variant="secondary" className="ml-2 bg-orange-200 text-orange-800 dark:bg-orange-900 dark:text-orange-100 hover:bg-orange-300 dark:hover:bg-orange-800">
                            {transactions.length}
                        </Badge>
                    </h3>
                </div>
                <div className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors">
                    {isOpen ? <ChevronUp className="h-4 w-4 text-orange-700 dark:text-orange-300" /> : <ChevronDown className="h-4 w-4 text-orange-700 dark:text-orange-300" />}
                </div>
            </button>

            {/* Content */}
            {isOpen && (
                <div className="p-0" id="review-needed-content">
                    {/* Toolbar (Desktop) */}
                    {isDesktop && (
                        <div className="p-4 border-b dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center transition-colors">
                            <div className="flex flex-wrap gap-2 items-center w-full xl:w-auto">
                                {/* Search */}
                                <div className="relative w-full md:w-48">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search..."
                                        className="pl-8 h-9 bg-white dark:bg-slate-900"
                                        value={filters.search}
                                        onChange={(e) => setFilters({...filters, search: e.target.value})}
                                    />
                                </div>

                                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>

                                {/* Filter: Card */}
                                <Select value={filters.card} onValueChange={(v) => setFilters({...filters, card: v})}>
                                    <SelectTrigger className="w-[160px] h-9 bg-white dark:bg-slate-900">
                                        <div className="flex items-center gap-2 truncate">
                                            <Filter className="h-3.5 w-3.5 text-muted-foreground"/>
                                            <span className="truncate">{filters.card === 'all' ? 'All Cards' : cards.find(c => c.id === filters.card)?.name || 'Selected'}</span>
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Cards</SelectItem>
                                        {cards.map(card => (
                                            <SelectItem key={card.id} value={card.id}>{card.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Filter: Status */}
                                <Select value={filters.status} onValueChange={(v) => setFilters({...filters, status: v})}>
                                    <SelectTrigger className="w-[180px] h-9 bg-white dark:bg-slate-900">
                                        <div className="flex items-center gap-2">
                                            <Filter className="h-3.5 w-3.5 text-muted-foreground"/>
                                            <SelectValue placeholder="Status" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="automated">Quick Approve</SelectItem>
                                        <SelectItem value="missing">Missing Info</SelectItem>
                                        <SelectItem value="mismatch">Mismatch</SelectItem>
                                    </SelectContent>
                                </Select>

                                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>

                                {/* Group By */}
                                <Select value={groupBy} onValueChange={setGroupBy}>
                                    <SelectTrigger className="w-[180px] h-9 bg-white dark:bg-slate-900">
                                        <div className="flex items-center gap-2">
                                            <Layers className="h-3.5 w-3.5 text-muted-foreground"/>
                                            <span className="truncate">Group: {groupBy === 'none' ? 'None' : groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}</span>
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No Grouping</SelectItem>
                                        <SelectItem value="card">Group by Card</SelectItem>
                                        <SelectItem value="status">Group by Status</SelectItem>
                                        <SelectItem value="date">Group by Date</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Bulk Actions */}
                            <div className="flex items-center gap-2 w-full xl:w-auto justify-end">
                                {selectedIds.size > 0 && (
                                    <>
                                        <span className="text-sm text-muted-foreground mr-2">
                                            {selectedIds.size} selected
                                        </span>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={handleBulkProcess}
                                            disabled={isProcessing}
                                            className="bg-white dark:bg-slate-900 text-emerald-600 hover:text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                        >
                                            {isProcessing ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin"/> : <Wand2 className="mr-2 h-3.5 w-3.5" />}
                                            Smart Process
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setIsBulkEditDialogOpen(true)}
                                            disabled={isProcessing}
                                            className="bg-white dark:bg-slate-900"
                                        >
                                            <FilePenLine className="mr-2 h-3.5 w-3.5" />
                                            Edit
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-destructive hover:text-destructive bg-white dark:bg-slate-900 hover:bg-red-50 border-red-200"
                                            onClick={handleBulkDelete}
                                            disabled={isProcessing}
                                        >
                                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                                            Delete
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Mobile Filters */}
                    {!isDesktop && renderMobileFilters()}

                    {/* Mobile Bulk Bar */}
                    {!isDesktop && selectedIds.size > 0 && renderBulkBar()}

                    {/* Table / List View */}
                    <div className="overflow-x-auto max-h-[600px]">
                        {isDesktop ? (
                            <Table>
                                <TableHeader className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10 shadow-sm transition-colors">
                                    <TableRow className="hover:bg-slate-50 dark:hover:bg-slate-900 border-b-slate-200 dark:border-b-slate-800">
                                        <TableHead className="w-[40px] text-center">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:checked:bg-primary"
                                                checked={filteredData.length > 0 && selectedIds.size === filteredData.length}
                                                onChange={handleSelectAll}
                                            />
                                        </TableHead>
                                        <TableHead className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('Transaction Date')}>
                                            Date {sortConfig.key === 'Transaction Date' && (sortConfig.direction === 'ascending' ? <ArrowUp className="inline h-3 w-3"/> : <ArrowDown className="inline h-3 w-3"/>)}
                                        </TableHead>
                                        <TableHead className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('Transaction Name')}>
                                            Transaction {sortConfig.key === 'Transaction Name' && (sortConfig.direction === 'ascending' ? <ArrowUp className="inline h-3 w-3"/> : <ArrowDown className="inline h-3 w-3"/>)}
                                        </TableHead>
                                        <TableHead>Details</TableHead>
                                        <TableHead className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('Category')}>
                                            Category {sortConfig.key === 'Category' && (sortConfig.direction === 'ascending' ? <ArrowUp className="inline h-3 w-3"/> : <ArrowDown className="inline h-3 w-3"/>)}
                                        </TableHead>
                                        <TableHead>Cashback Rule</TableHead>
                                        <TableHead className="text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('Amount')}>
                                            Amount {sortConfig.key === 'Amount' && (sortConfig.direction === 'ascending' ? <ArrowUp className="inline h-3 w-3"/> : <ArrowDown className="inline h-3 w-3"/>)}
                                        </TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                                                No transactions match the filters.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        Object.entries(groupedData).map(([groupKey, groupTxs]) => (
                                            <React.Fragment key={groupKey}>
                                                {/* Group Header */}
                                                {groupBy !== 'none' && (
                                                    <TableRow className="bg-slate-100/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-900">
                                                        <TableCell colSpan={9} className="py-2 px-4 font-semibold text-xs uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                                                            {groupKey} <span className="ml-1 text-slate-400 font-normal">({groupTxs.length})</span>
                                                        </TableCell>
                                                    </TableRow>
                                                )}

                                                {/* Transactions in Group */}
                                                {groupTxs.map(tx => {
                                                    const cardName = tx['Card'] && cards.find(c => c.id === tx['Card'][0])?.name;
                                                    const ruleName = tx['Applicable Rule'] && rules.find(r => r.id === tx['Applicable Rule'][0])?.ruleName;
                                                    const isSelected = selectedIds.has(tx.id);

                                                    return (
                                                        <TableRow key={tx.id} className={cn("group transition-colors dark:border-slate-800", isSelected && "bg-slate-50 dark:bg-slate-900")}>
                                                            <TableCell className="text-center">
                                                                <input
                                                                    type="checkbox"
                                                                    className="rounded border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:checked:bg-primary"
                                                                    checked={isSelected}
                                                                    onChange={() => handleSelectOne(tx.id)}
                                                                />
                                                            </TableCell>
                                                            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                                                                {formatTransactionDate(tx['Transaction Date'])}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="font-medium text-sm dark:text-slate-200">{tx['Transaction Name']}</div>
                                                            </TableCell>
                                                            <TableCell className="text-xs space-y-1">
                                                                {cardName && <div className="flex items-center gap-1"><span className="font-semibold text-slate-500 dark:text-slate-400">Card:</span> <span className="dark:text-slate-300">{cardName}</span></div>}
                                                                {tx['MCC Code'] && <div className="flex items-center gap-1"><span className="font-semibold text-slate-500 dark:text-slate-400">MCC:</span> <span className="dark:text-slate-300">{tx['MCC Code']}</span></div>}
                                                            </TableCell>
                                                            <TableCell className="text-sm">
                                                                {tx['Category'] ? (
                                                                    <Badge variant="secondary" className="font-normal bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200">
                                                                        {tx['Category']}
                                                                    </Badge>
                                                                ) : (
                                                                    <span className="text-xs text-muted-foreground italic">Uncategorized</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-sm">
                                                                {ruleName ? (
                                                                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-slate-100 text-slate-900 hover:bg-slate-200/80 dark:bg-slate-800 dark:text-slate-50">
                                                                        {ruleName}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-xs text-muted-foreground italic">None</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-right font-medium dark:text-slate-200">
                                                                {currency(tx['Amount'])}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline" className={cn(
                                                                    "whitespace-nowrap",
                                                                    tx.statusType === 'success' && "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900",
                                                                    tx.statusType === 'warning' && "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900",
                                                                    tx.statusType === 'error' && "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900",
                                                                    tx.statusType === 'info' && "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900"
                                                                )}>
                                                                    {tx.status}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex items-center justify-end gap-1">
                                                                    {(tx.status === 'Quick Approve' || tx.status === 'Mismatch') && (
                                                                        <TooltipProvider>
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="icon"
                                                                                        aria-label="Quick Approve"
                                                                                        className={cn(
                                                                                            "h-8 w-8 transition-colors",
                                                                                            tx.status === 'Quick Approve'
                                                                                                ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                                                                : "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                                                        )}
                                                                                        onClick={() => handleSingleProcess(tx)}
                                                                                        disabled={processingIds.has(tx.id)}
                                                                                    >
                                                                                        {processingIds.has(tx.id) ? (
                                                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                                                        ) : tx.status === 'Mismatch' ? (
                                                                                            <Wand2 className="h-4 w-4" />
                                                                                        ) : (
                                                                                            <Check className="h-4 w-4" />
                                                                                        )}
                                                                                    </Button>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent>
                                                                                    {tx.status === 'Mismatch' ? 'Fix & Approve' : 'Quick Approve'}
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        </TooltipProvider>
                                                                    )}

                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-slate-500 hover:text-slate-700"
                                                                        onClick={() => onEditTransaction(tx)}
                                                                        title="Edit"
                                                                        disabled={isProcessing}
                                                                    >
                                                                        <FilePenLine className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                                                                        onClick={() => handleSingleDelete(tx.id)}
                                                                        title="Delete"
                                                                        disabled={isProcessing}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </React.Fragment>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        ) : (
                            /* Mobile List View */
                            <div className="flex flex-col gap-2 p-2">
                                {filteredData.length === 0 ? (
                                    <div className="p-4 text-center text-muted-foreground border rounded-lg">
                                        No transactions match the filters.
                                    </div>
                                ) : (
                                    Object.entries(groupedData).map(([groupKey, groupTxs]) => (
                                        <React.Fragment key={groupKey}>
                                            {groupBy !== 'none' && (
                                                <div className="py-2 px-2 font-semibold text-xs uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                                                    {groupKey} <span className="ml-1 text-slate-400 font-normal">({groupTxs.length})</span>
                                                </div>
                                            )}
                                            {groupTxs.map(tx => {
                                                const cardName = tx['Card'] && cards.find(c => c.id === tx['Card'][0])?.name;
                                                const ruleName = tx['Applicable Rule'] && rules.find(r => r.id === tx['Applicable Rule'][0])?.ruleName;
                                                const isSelected = selectedIds.has(tx.id);
                                                const formattedMcc = formatMcc(tx['MCC Code']);

                                                return (
                                                    <div
                                                        key={tx.id}
                                                        className={cn(
                                                            "border rounded-lg p-3 bg-white dark:bg-slate-900 shadow-sm transition-colors",
                                                            isSelected ? "border-primary bg-primary/5 dark:bg-primary/10" : "dark:border-slate-800"
                                                        )}
                                                    >
                                                        {/* Row 1: Checkbox & Name */}
                                                        <div className="flex gap-3 items-start">
                                                             <div className="pt-1">
                                                                <Checkbox
                                                                    checked={isSelected}
                                                                    onCheckedChange={() => handleSelectOne(tx.id)}
                                                                    aria-label={`Select ${tx['Transaction Name']}`}
                                                                />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex justify-between items-start gap-2">
                                                                    <div className="flex-col overflow-hidden">
                                                                        <p className="font-semibold text-sm truncate">{tx['Transaction Name']}</p>
                                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                                            <span>{formatTransactionDate(tx['Transaction Date'])}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right flex-shrink-0">
                                                                        <p className="font-bold text-sm">{currency(tx['Amount'])}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Row 2: Details Chips */}
                                                        <div className="flex flex-wrap gap-1.5 mt-3 ml-7">
                                                            {cardName && (
                                                                <Badge variant="outline" className="text-[10px] px-1.5 h-5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-normal">
                                                                    {cardName}
                                                                </Badge>
                                                            )}
                                                            {formattedMcc && (
                                                                <Badge variant="outline" className="text-[10px] px-1.5 h-5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-normal max-w-[150px] truncate block">
                                                                    {formattedMcc}
                                                                </Badge>
                                                            )}
                                                            {tx['Category'] && (
                                                                <Badge variant="secondary" className="text-[10px] px-1.5 h-5 font-normal">
                                                                    {tx['Category']}
                                                                </Badge>
                                                            )}
                                                             {ruleName && (
                                                                <Badge variant="outline" className="text-[10px] px-1.5 h-5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 font-normal">
                                                                    {ruleName}
                                                                </Badge>
                                                            )}
                                                        </div>

                                                        {/* Row 3: Status & Actions */}
                                                        <div className="flex justify-between items-center mt-3 ml-7 border-t pt-2 dark:border-slate-800">
                                                            <Badge variant="outline" className={cn(
                                                                "text-[10px] px-2 h-5 whitespace-nowrap",
                                                                tx.statusType === 'success' && "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900",
                                                                tx.statusType === 'warning' && "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900",
                                                                tx.statusType === 'error' && "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900",
                                                                tx.statusType === 'info' && "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900"
                                                            )}>
                                                                {tx.status}
                                                            </Badge>

                                                            <div className="flex items-center gap-2">
                                                                 <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className={cn(
                                                                        "h-7 px-3 text-xs border transition-colors",
                                                                        tx.status === 'Quick Approve'
                                                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950 dark:border-emerald-900 dark:text-emerald-400"
                                                                            : tx.status === 'Mismatch'
                                                                                ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-950 dark:border-amber-900 dark:text-amber-400"
                                                                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400"
                                                                    )}
                                                                        onClick={() => (tx.status === 'Quick Approve' || tx.status === 'Mismatch') ? handleSingleProcess(tx) : onEditTransaction(tx)}
                                                                    disabled={processingIds.has(tx.id)}
                                                                >
                                                                    {processingIds.has(tx.id) ? (
                                                                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                                                    ) : tx.status === 'Quick Approve' ? (
                                                                        <Check className="mr-2 h-3 w-3" />
                                                                        ) : tx.status === 'Mismatch' ? (
                                                                            <Wand2 className="mr-2 h-3 w-3" />
                                                                    ) : (
                                                                        <FilePenLine className="mr-2 h-3 w-3" />
                                                                    )}
                                                                        {tx.status === 'Quick Approve' ? "Approve" : tx.status === 'Mismatch' ? "Fix" : "Edit"}
                                                                </Button>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="More options">
                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuItem onClick={() => onEditTransaction(tx)}>
                                                                            <FilePenLine className="mr-2 h-4 w-4" /> Edit
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleSingleDelete(tx.id)}
                                                                            className="text-destructive"
                                                                        >
                                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </React.Fragment>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Bulk Edit Dialog */}
            <BulkEditDialog
                isOpen={isBulkEditDialogOpen}
                onClose={() => setIsBulkEditDialogOpen(false)}
                selectedIds={Array.from(selectedIds)}
                allTransactions={transactions}
                categories={categories}
                cards={cards}
                rules={rules}
                mccMap={mccMap}
                getCurrentCashbackMonthForCard={getCurrentCashbackMonthForCard}
                onUpdateComplete={() => {
                    onRefresh();
                    setSelectedIds(new Set());
                }}
            />
        </div>
    );
});

TransactionReview.displayName = "TransactionReview";

export default TransactionReview;
import React from "react";
import { Eye, FilePenLine, Trash2, Loader2 } from "lucide-react";
import { Button } from "../../ui/button";
import { Checkbox } from "../../ui/checkbox";
import { TableCell, TableRow } from "../../ui/table";
import { cn } from "../../../lib/utils";

const TransactionRow = React.memo(({
    transaction: tx,
    isSelected,
    activeColumns,
    onSelect,
    onViewDetails,
    onEdit,
    onDelete,
    isDeleting,
    isUpdating
}) => {
    const isProcessing = isDeleting || isUpdating;

    return (
        <TableRow
            onClick={() => !isProcessing && onViewDetails && onViewDetails(tx)}
            className={cn(
                "cursor-pointer transition-opacity duration-200",
                isSelected && "bg-slate-50 dark:bg-slate-800/50",
                isProcessing && "opacity-50 pointer-events-none"
            )}
        >
            <TableCell className="p-2" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => onSelect(tx.id, checked)}
                    aria-label={`Select ${tx['Transaction Name']}`}
                />
            </TableCell>
            <TableCell className="px-2">
                {/* Spacer/Indicator could go here */}
            </TableCell>

            {/* Dynamic Cells */}
            {activeColumns.map(col => (
                <TableCell key={col.id} className={col.cellClass || ""}>
                    {col.renderCell(tx)}
                </TableCell>
            ))}

            {/* Actions Column - Fixed */}
            <TableCell className="text-center">
                <div className="flex items-center justify-center gap-1 min-w-[80px]" onClick={(e) => e.stopPropagation()}>
                    {isProcessing ? (
                        <div className="flex items-center gap-2">
                             <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                             {isUpdating && <span className="text-xs text-muted-foreground">Syncing...</span>}
                        </div>
                    ) : (
                        <>
                            {/* Fixed View Details Button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-slate-500 hover:text-slate-700"
                                onClick={() => onViewDetails(tx)}
                                title="View Details"
                                aria-label={`View details for ${tx['Transaction Name']}`}
                            >
                                <Eye className="h-4 w-4" />
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-slate-500 hover:text-slate-700"
                                onClick={() => onEdit(tx)}
                                title="Edit"
                                aria-label={`Edit ${tx['Transaction Name']}`}
                            >
                                <FilePenLine className="h-4 w-4" />
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive/90"
                                onClick={() => onDelete(tx.id, tx['Transaction Name'])}
                                title="Delete"
                                aria-label={`Delete ${tx['Transaction Name']}`}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                </div>
            </TableCell>
        </TableRow>
    );
});

TransactionRow.displayName = 'TransactionRow';

export default TransactionRow;
import React from 'react';
import { Badge } from '../../ui/badge';
import { Globe, History } from 'lucide-react';

export default function ResultItem({ result, onSelect, isHistory }) {
    // Safely extract data based on its source (History vs General)
    const merchantName = result[1];
    const mcc = result[2];
    const vietnameseCategory = result[4];
    const englishCategory = result[3];

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
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Sparkles, CalendarClock, Info, X, Store, Globe, Laptop, Check, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Switch } from '../../ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Textarea } from '../../ui/textarea';
import { Combobox } from '../../ui/combobox';
import { TagsInputField } from '../../ui/tag-input';
import QuickAddButtons from './QuickAddButtons';
import CardRecommendations from './CardRecommendations';
import MccSearchResultsDialog from './MccSearchResultsDialog';
import useCardRecommendations from '../../../hooks/useCardRecommendations';
import useMediaQuery from '../../../hooks/useMediaQuery'; // Added useMediaQuery
import { useForm, FormProvider } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { getZonedDate, getTimezone } from '../../../lib/timezone';


export default function AddTransactionForm({ cards, categories, definitions, rules, monthlyCategories, mccMap, onTransactionAdded, commonVendors, monthlySummary, monthlyCategorySummary, getCurrentCashbackMonthForCard, onTransactionUpdated, initialData, prefillData, onClose, addToQueue }) {
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const form = useForm({
        defaultValues: {
            subCategory: [],
        }
    });

    // --- State Management ---
    const [merchant, setMerchant] = useState('');
    const [amount, setAmount] = useState('');

    // Initialize date state with datetime-local format support (YYYY-MM-DDTHH:mm) or just date (YYYY-MM-DD)
    const [date, setDate] = useState(() => {
        // Default to current datetime for new transactions
        const now = getZonedDate();
        // Adjust for timezone offset to get local ISO string like 'YYYY-MM-DDTHH:mm'

        const localIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        return localIso;
    });

    const [hasTime, setHasTime] = useState(true); // Default to including time for new transactions

    const [cardId, setCardId] = useState('');
    const [category, setCategory] = useState('');
    const [mccCode, setMccCode] = useState('');
    const [merchantLookup, setMerchantLookup] = useState('');
    const [applicableRuleId, setApplicableRuleId] = useState('');
    const [cardSummaryCategoryId, setCardSummaryCategoryId] = useState('new');
    const [isLookingUp, setIsLookingUp] = useState(false);
    const [lookupResults, setLookupResults] = useState([]);
    const [isLookupDialogOpen, setIsLookupDialogOpen] = useState(false);
    const [isSubmitting] = useState(false);
    const [showLookupButton, setShowLookupButton] = useState(false);
    const [mccName, setMccName] = useState('');
    const [method, setMethod] = useState('POS');

    // --- State to control recommendation visibility ---
    const [showRecommendations, setShowRecommendations] = useState(!initialData);

    // --- NEW STATE FOR THE NEW FIELDS ---
    const [notes, setNotes] = useState('');
    const [paidFor, setPaidFor] = useState('');
    const [billingDate, setBillingDate] = useState('');
    const [foreignCurrencyAmount, setForeignCurrencyAmount] = useState('');
    const [foreignCurrency, setForeignCurrency] = useState('USD');
    const [conversionFee, setConversionFee] = useState('');
    const [conversionRate, setConversionRate] = useState('');
    const [discounts, setDiscounts] = useState([]);
    const [fees, setFees] = useState([]);
    const [foreignInputMode, setForeignInputMode] = useState('vnd_known');


    const amountInputRef = useRef(null);
    const dateInputRef = useRef(null);

    useEffect(() => {
        if (mccMap && mccCode && mccMap[mccCode]) {
            setMccName(mccMap[mccCode].vn);
        } else {
            setMccName('');
        }
    }, [mccCode, mccMap]);

    useEffect(() => {
        const sourceData = initialData || prefillData;
        if (sourceData) {
            // Automatically clean the "Email_" prefix for a better user experience
            let initialMerchant = sourceData['Transaction Name'] || '';
            if (initialMerchant.startsWith('Email_')) {
                initialMerchant = initialMerchant.substring(6); // Remove "Email_"
            }

            setMerchant(initialMerchant || '');
            // Prioritize grossAmount (Base Amount) for editing, fall back to Amount (Final Amount)
            const baseAmount = sourceData['grossAmount'] !== undefined ? sourceData['grossAmount'] : sourceData['Amount'];
            setAmount((baseAmount || '').toLocaleString('en-US'));

            // --- Date Logic ---
            const initialDateStr = sourceData['Transaction Date'];
            if (initialDateStr) {
                // Check if it has time component (e.g. contains 'T' or is longer than 10 chars)
                // Note: Notion date can be "2023-10-27" (date only) or "2023-10-27T14:30:00.000+07:00"
                const hasTimeComponent = initialDateStr.includes('T') || initialDateStr.length > 10;
                setHasTime(hasTimeComponent);

                if (hasTimeComponent) {
                    // Normalize to YYYY-MM-DDTHH:mm for input[type="datetime-local"]
                    // Assuming initialDateStr is ISO-like
                    setDate(initialDateStr.slice(0, 16));
                } else {
                    setDate(initialDateStr);
                }
            } else {
                // Fallback for new/empty
                const now = getZonedDate();

                setDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
                setHasTime(true);
            }

            setCardId(sourceData['Card'] && sourceData['Card'].length > 0 ? String(sourceData['Card'][0]) : '');
            setApplicableRuleId(sourceData['Applicable Rule'] && sourceData['Applicable Rule'].length > 0 ? String(sourceData['Applicable Rule'][0]) : '');
            setCardSummaryCategoryId(sourceData['Card Summary Category'] ? sourceData['Card Summary Category'][0] : 'new'); // <-- ADDED THIS
            setCategory(sourceData['Category'] || '');
            setMccCode(sourceData['MCC Code'] || '');
            setMerchantLookup(sourceData['merchantLookup'] || '');
            const notes = sourceData['notes'] || '';
            const discountsMatch = notes.match(/Discounts: (.*)/);
            const feesMatch = notes.match(/Fees: (.*)/);
            if (discountsMatch) {
                setDiscounts(JSON.parse(discountsMatch[1]));
            }
            if (feesMatch) {
                setFees(JSON.parse(feesMatch[1]));
            }
            setNotes(notes.split('\n\nDiscounts:')[0]);
            setPaidFor(sourceData['paidFor'] || '');
            form.setValue('subCategory', sourceData['subCategory'] || []);
            setBillingDate(sourceData['billingDate'] || '');

            if (sourceData.foreignCurrencyAmount) {
                setForeignCurrencyAmount(sourceData.foreignCurrencyAmount.toLocaleString('en-US'));
                setConversionFee(sourceData.conversionFee.toLocaleString('en-US'));
                if (sourceData.exchangeRate) setConversionRate(sourceData.exchangeRate.toLocaleString('en-US'));
                if (sourceData.foreignCurrency) setForeignCurrency(sourceData.foreignCurrency);
            }

            // Set Method: Prioritize existing 'Method' field, then infer from Foreign Amount, else Default 'POS'
            if (sourceData['Method']) {
                setMethod(sourceData['Method']);
            } else if (sourceData.foreignCurrencyAmount) {
                setMethod('International');
            } else {
                setMethod('POS');
            }
        }
    }, [initialData, prefillData, form]);

    const handleVendorSelect = (vendor) => {
        setMerchant(vendor.transactionName || '');
        setMerchantLookup(vendor.merchant || '');
        setMccCode(vendor.mcc || '');
        setCategory(vendor.category || '');
        if (vendor.preferredCardId) setCardId(vendor.preferredCardId);
        if (vendor.preferredRuleId) setApplicableRuleId(vendor.preferredRuleId);
        else setApplicableRuleId('');
        setShowLookupButton(false);
        amountInputRef.current?.focus();
    };

    // --- Memoized Calculations ---
    const selectedCard = useMemo(() => cards.find(c => c.id === cardId), [cardId, cards]);
    const filteredRules = useMemo(() => {
        if (!cardId) return [];
        return rules.filter(rule => {
            // 1. Handle if cardId is an Array (from Airtable/DB) or String
            const rCardId = Array.isArray(rule.cardId) ? rule.cardId[0] : rule.cardId;

            // 2. FORCE STRING comparison to avoid "123" !== 123 mismatch
            return String(rCardId) === String(cardId);
        })
        // Fallback to rule.name if rule.ruleName is missing
        .sort((a, b) => (a.ruleName || a.name || '').localeCompare(b.ruleName || b.name || ''));
    }, [cardId, rules]);

    const selectedRule = useMemo(() => rules.find(r => r.id === applicableRuleId), [applicableRuleId, rules]);

    // --- UPDATED: Use the passed-in function ---
    const cashbackMonth = useMemo(() => {
        if (!selectedCard || !date) return null;
        return getCurrentCashbackMonthForCard(selectedCard, date);
    }, [selectedCard, date, getCurrentCashbackMonthForCard]);

    const filteredSummaries = useMemo(() => {
        if (!selectedRule || !cardId || !cashbackMonth) return [];
        const targetSummaryId = `${cashbackMonth} - ${selectedRule.ruleName || selectedRule.name}`; // Handle potential naming diff
        return monthlyCategories.filter(summary => summary.cardId === cardId && summary.summaryId === targetSummaryId);
    }, [cardId, monthlyCategories, selectedRule, cashbackMonth]);

    const estimatedCashbackAndWarnings = useMemo(() => {
        const result = { cashback: 0, warnings: [] };
        if (!selectedRule || !amount || !selectedCard) return result;

        const numericAmount = parseFloat(String(amount).replace(/,/g, ''));
        if (isNaN(numericAmount) || numericAmount <= 0) return result;

        const cardMonthSummary = monthlySummary.find(s => s.cardId === cardId && s.month === cashbackMonth);
        const categoryMonthSummary = monthlyCategorySummary.find(s =>
            s.cardId === cardId &&
            s.month === cashbackMonth &&
            s.summaryId.endsWith(selectedRule.ruleName || selectedRule.name)
        );

        // --- NEW TIERED LOGIC ---
        const currentMonthSpend = cardMonthSummary?.spend || 0;
        const isTier2Met = selectedCard.cashbackType === '2 Tier' && selectedCard.tier2MinSpend > 0 && currentMonthSpend >= selectedCard.tier2MinSpend;

        // Determine effective rate and limits
        const effectiveRate = isTier2Met && selectedRule.tier2Rate ? selectedRule.tier2Rate : selectedRule.rate;
        const effectiveCategoryLimit = (isTier2Met && selectedRule.tier2CategoryLimit) ? selectedRule.tier2CategoryLimit : selectedRule.categoryLimit;
        const effectiveMonthlyLimit = (isTier2Met && selectedCard.tier2Limit) ? selectedCard.tier2Limit : selectedCard.overallMonthlyLimit;

        // Category Cap
        const currentCategoryCashback = categoryMonthSummary?.cashback || 0;
        const isCategoryCapReached = (effectiveCategoryLimit > 0) && currentCategoryCashback >= effectiveCategoryLimit;

        // Overall Card Cap
        const isMonthlyCapReached = (effectiveMonthlyLimit > 0) ? (cardMonthSummary?.cashback || 0) >= effectiveMonthlyLimit : false;

        // Min Spend
        const isMinSpendMet = selectedCard.minimumMonthlySpend > 0 ? (cardMonthSummary?.spend || 0) >= selectedCard.minimumMonthlySpend : true;

        // Add Warnings
        if (!isMinSpendMet) result.warnings.push("Minimum monthly spend not met for this card.");
        if (isMonthlyCapReached) result.warnings.push("Card's overall monthly cashback limit has been reached.");
        if (isCategoryCapReached) result.warnings.push("This specific category's cashback limit has been reached.");

        if (isMonthlyCapReached || isCategoryCapReached || !isMinSpendMet) {
            return result;
        }

        // Calculate Cashback
        let calculatedCashback = numericAmount * effectiveRate;

        // NEW Transaction Limit Logic
        let cap = selectedRule.transactionLimit;
        // Check for secondary criteria
        if (selectedRule.secondaryTransactionCriteria > 0 && numericAmount >= selectedRule.secondaryTransactionCriteria) {
            cap = selectedRule.secondaryTransactionLimit;
        }
        // Apply the determined cap
        if (cap > 0) {
            calculatedCashback = Math.min(calculatedCashback, cap);
        }

        result.cashback = calculatedCashback;

        return result;
    }, [amount, selectedRule, cardId, cashbackMonth, monthlySummary, monthlyCategorySummary, selectedCard]);

    // --- Effects ---
    useEffect(() => {
        if (filteredSummaries.length > 0) setCardSummaryCategoryId(filteredSummaries[0].id);
        else setCardSummaryCategoryId('new');
    }, [filteredSummaries]);

    useEffect(() => {
        if (method !== 'International' || !selectedCard) return;

        const foreignAmount = parseFloat(String(foreignCurrencyAmount).replace(/,/g, '')) || 0;
        const feePercentage = selectedCard.foreignFee || 0;

        if (foreignInputMode === 'vnd_known') {
            const vndAmount = parseFloat(String(amount).replace(/,/g, '')) || 0;
            if (foreignAmount > 0 && vndAmount > 0) {
                const totalForeignCost = foreignAmount * (1 + feePercentage);
                const calculatedRate = vndAmount / totalForeignCost;
                const feeInVnd = (vndAmount / (1 + feePercentage)) * feePercentage;

                setConversionRate(calculatedRate.toLocaleString('en-US', { maximumFractionDigits: 2 }));
                setConversionFee(feeInVnd.toLocaleString('en-US', { maximumFractionDigits: 2 }));
            } else {
                setConversionRate('');
                setConversionFee('');
            }
        } else { // vnd_unknown
            const rate = parseFloat(String(conversionRate).replace(/,/g, '')) || 0;
            if (foreignAmount > 0 && rate > 0) {
                const totalForeignCost = foreignAmount * (1 + feePercentage);
                const calculatedVndAmount = totalForeignCost * rate;
                const feeInVnd = (foreignAmount * rate) * feePercentage;

                setAmount(calculatedVndAmount.toLocaleString('en-US', { maximumFractionDigits: 2 }));
                setConversionFee(feeInVnd.toLocaleString('en-US', { maximumFractionDigits: 2 }));
            } else {
                setAmount('');
                setConversionFee('');
            }
        }
    }, [method, selectedCard, foreignCurrencyAmount, amount, conversionRate, foreignInputMode]);

    useEffect(() => {
        if (!initialData && cards.length > 0 && !cardId) {
            const lastUsedCardId = localStorage.getItem('lastUsedCardId');
            if (lastUsedCardId && cards.some(c => c.id === lastUsedCardId)) {
                setCardId(lastUsedCardId);
            } else if (cards.length > 0) { // Added a check to prevent error on empty array
                setCardId(cards[0].id);
            }
        }
    }, [cards, cardId, initialData]);

    const currencyFn = (n) => (n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

    // --- Use the new hook to get recommendations ---
    const rankedCards = useCardRecommendations({
        mccCode,
        amount,
        date,
        rules,
        cards,
        monthlySummary,
        monthlyCategorySummary,
        getCurrentCashbackMonthForCard
    });

    // --- Handlers ---
    const resetForm = () => {
        setMerchant('');
        setAmount('');
        setCategory('');
        setMccCode('');
        setMerchantLookup('');
        setApplicableRuleId('');
        setCardSummaryCategoryId('new');
        setShowLookupButton(false);
        setNotes('');
        setPaidFor('');
        form.setValue('subCategory', []);
        setBillingDate('');
        setForeignCurrencyAmount('');
        setForeignCurrency('USD');
        setConversionFee('');
        setDiscounts([]);
        setFees([]);

        // Keep the selected card
        if (cards.length > 0 && !cardId) {
             const lastUsedCardId = localStorage.getItem('lastUsedCardId');
             if (lastUsedCardId && cards.some(c => c.id === lastUsedCardId)) {
                 setCardId(lastUsedCardId);
             } else {
                 setCardId(cards[0].id);
             }
         }
    };

    const handleAmountChange = (e) => {
        const value = e.target.value.replace(/,/g, '');
        if (!isNaN(value) && value.length <= 15) setAmount(Number(value).toLocaleString('en-US'));
        else if (value === '') setAmount('');
    };

    const handleFormattedNumericInput = (value, setter, allowDecimal = false) => {
        const cleanValue = String(value).replace(/,/g, '');

        if (cleanValue === '' || cleanValue === '-') {
            setter(cleanValue);
            return;
        }

        const regex = allowDecimal ? /^-?\d*\.?\d*$/ : /^-?\d+$/;
        if (regex.test(cleanValue) && cleanValue.length <= 15) {
            if (allowDecimal && cleanValue.endsWith('.')) {
                setter(cleanValue);
                return;
            }
            const num = parseFloat(cleanValue);
            if (!isNaN(num)) {
                setter(num.toLocaleString('en-US', { maximumFractionDigits: 2 }));
            }
        }
    };

    const handleMerchantLookup = async () => {
        const trimmedMerchant = merchant.trim();
        if (!trimmedMerchant) return;
        setIsLookingUp(true);
        setLookupResults([]);
        setShowLookupButton(false);

        try {
            const res = await fetch(`${API_BASE_URL}/lookup-merchant?keyword=${encodeURIComponent(trimmedMerchant)}`);
            if (!res.ok) throw new Error("Server responded with an error.");

            const data = await res.json();
            const allResults = [...(data.history || []).map(item => (["Your History", item.merchant, item.mcc, mccMap[item.mcc]?.en || "Unknown", mccMap[item.mcc]?.vn || "Không rõ"])), ...(data.external || []).map(item => (["External Suggestion", item.merchant, item.mcc, mccMap[item.mcc]?.en || "Unknown", mccMap[item.mcc]?.vn || "Không rõ"]))];
            setLookupResults(allResults);

            if (data.bestMatch?.mcc) {
                // Always set the MCC code if found
                setMccCode(data.bestMatch.mcc);

                let toastMessage = "Auto-filled MCC Code.";

                // Only set the merchantLookup if it's currently empty
                if (data.bestMatch.merchant && !merchantLookup) {
                    setMerchantLookup(data.bestMatch.merchant);
                    toastMessage = "Auto-filled MCC and Merchant Name."; // Update toast
                }

                toast.info(toastMessage);
                if (allResults.length > 0) setShowLookupButton(true);
            } else if (allResults.length > 0) {
                setIsLookupDialogOpen(true);
            } else {
                toast.info("No transaction history or suggestions found.");
            }
        } catch (error) {
            console.error("Merchant Lookup Error:", error);
            toast.error("Could not perform merchant lookup.");
        } finally {
            setIsLookingUp(false);
        }
    };

    const handleSubmit = async (data) => {
        let finalMerchant = merchant;
        const transactionData = {
            id: initialData ? initialData.id : getZonedDate().toISOString(),
            'Transaction Name': finalMerchant,
            'Amount': parseFloat(String(amount).replace(/,/g, '')),
            'Transaction Date': date,
            'Card': cardId ? [cardId] : [],
            'Category': category || null,
            'MCC Code': mccCode || null,
            'merchantLookup': merchantLookup || null,
            'Applicable Rule': applicableRuleId ? [applicableRuleId] : [],
            'notes': `${notes || ''}${discounts.length > 0 ? `\n\nDiscounts: ${JSON.stringify(discounts)}` : ''}${fees.length > 0 ? `\nFees: ${JSON.stringify(fees)}` : ''}`,
            'otherDiscounts': discounts.reduce((acc, d) => acc + parseFloat(String(d.amount || '0').replace(/,/g, '')), 0),
            'otherFees': fees.reduce((acc, f) => acc + parseFloat(String(f.amount || '0').replace(/,/g, '')), 0),
            'foreignCurrencyAmount': method === 'International' ? parseFloat(String(foreignCurrencyAmount).replace(/,/g, '')) : null,
            'exchangeRate': method === 'International' ? parseFloat(String(conversionRate).replace(/,/g, '')) : null,
            'foreignCurrency': method === 'International' ? foreignCurrency : null,
            'conversionFee': method === 'International' ? parseFloat(String(conversionFee).replace(/,/g, '')) : null,
            'paidFor': paidFor || null,
            'subCategory': data.subCategory || [],
            'billingDate': billingDate || null,
            'status': 'pending', // This status is for local queueing
            'estCashback': estimatedCashbackAndWarnings.cashback,
            'Method': method,
        };

        addToQueue(transactionData);

        if (initialData) {
            toast.success("Transaction update queued!");
            onTransactionUpdated({ ...transactionData, 'Card Summary Category': [cardSummaryCategoryId] }); // Pass a mock summary for UI
            onClose();
        } else {
            toast.success("Transaction queued!");
            onTransactionAdded({ ...transactionData, 'Card Summary Category': ['new'] });
            resetForm();
        }
    };

    const handleCardSelect = (selectedCardId, selectedRuleId) => {
        setCardId(selectedCardId);
        // If a rule is provided (Recommendation click), set it.
        // If not (Manual Card change), reset it to empty.
        setApplicableRuleId(selectedRuleId || '');
    };

    // --- Render Helpers ---

    const renderMethodSelector = () => {
        const methods = definitions?.methods && definitions.methods.length > 0
            ? definitions.methods
            : ['POS', 'eCom', 'International'];

        return (
            <div className="grid grid-cols-3 gap-1 p-1 bg-muted/50 rounded-lg">
                {methods.map((m) => {
                    let icon = <Store className="h-4 w-4" />;
                    let activeClass = "bg-white dark:bg-slate-800 shadow-sm text-sky-600 dark:text-sky-400";

                    if (m === 'eCom') {
                        icon = <Laptop className="h-4 w-4" />;
                        activeClass = "bg-white dark:bg-slate-800 shadow-sm text-emerald-600 dark:text-emerald-400";
                    } else if (m === 'International') {
                        icon = <Globe className="h-4 w-4" />;
                        activeClass = "bg-white dark:bg-slate-800 shadow-sm text-orange-600 dark:text-orange-400";
                    }

                    return (
                        <button
                            key={m}
                            type="button"
                            onClick={() => setMethod(m)}
                            className={cn(
                                "flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all",
                                method === m
                                    ? activeClass
                                    : "text-muted-foreground hover:bg-white/50 dark:hover:bg-slate-800/50"
                            )}
                        >
                            {icon}
                            {m === 'International' ? "Int'l" : m}
                        </button>
                    );
                })}
            </div>
        );
    };

    return (
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 pb-20">

                {/* --- 1. HERO AMOUNT & DATE --- */}
                <div className="flex flex-col items-center justify-center space-y-3 pt-2">
                    <div className="relative w-full max-w-[280px]">
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-3xl font-bold text-muted-foreground/50">₫</span>
                        <input
                            ref={amountInputRef}
                            type="text"
                            inputMode="numeric"
                            value={amount}
                            onChange={handleAmountChange}
                            placeholder="0"
                            className="w-full bg-transparent text-center text-5xl font-bold placeholder:text-muted-foreground/30 focus:outline-none focus:ring-0 focus-visible:border-b-2 focus-visible:border-primary pb-1 rounded-none transition-all"
                            required
                            aria-label="Transaction Amount"
                        />
                    </div>

                    {/* Date Pill with Time Toggle */}
                     <div className="relative flex items-center gap-2">
                        <div className="relative group">
                            <button
                                type="button"
                                onClick={() => dateInputRef.current?.showPicker()}
                                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted/50 hover:bg-muted text-sm font-medium transition-colors group-focus-within:ring-2 group-focus-within:ring-ring group-focus-within:ring-offset-2"
                            >
                                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                                {hasTime
                                    ? new Date(date).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: getTimezone() })
                                    : new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: getTimezone() })
                                }
                            </button>
                            <input
                                ref={dateInputRef}
                                type={hasTime ? "datetime-local" : "date"}
                                className={cn("absolute inset-0 opacity-0 cursor-pointer", isDesktop && "pointer-events-none")}
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                            />
                        </div>

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={cn("h-8 w-8 rounded-full", hasTime ? "text-primary bg-primary/10" : "text-muted-foreground")}
                            onClick={() => {
                                const newHasTime = !hasTime;
                                setHasTime(newHasTime);
                                if (newHasTime) {
                                    // Switch to datetime-local: append current time or 00:00
                                    // If date was YYYY-MM-DD, make it YYYY-MM-DDTHH:mm
                                    // Better: use current time if switching ON
                                    const now = getZonedDate();
                                    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                                    setDate(`${date}T${timeStr}`);
                                } else {
                                    // Switch to date-only: slice the string
                                    setDate(date.split('T')[0]);
                                }
                            }}
                            title={hasTime ? "Remove time" : "Add time"}
                            aria-label={hasTime ? "Remove time" : "Add time"}
                        >
                            <Clock className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* --- 2. QUICK ADD --- */}
                 <div className="-mx-4 sm:mx-0 px-4 sm:px-0">
                    <QuickAddButtons vendors={commonVendors} onSelect={handleVendorSelect} />
                </div>


                {/* --- 3. MAIN INPUTS & METHOD --- */}
                <div className="space-y-4">
                    {/* Method Selector */}
                    {renderMethodSelector()}

                    {/* Merchant & Lookup */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                             <label htmlFor="merchant" className="text-sm font-semibold text-muted-foreground">Merchant</label>
                             {isLookingUp && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                        </div>
                        <div className="relative">
                            <Input
                                id="merchant"
                                value={merchant}
                                onChange={(e) => { setMerchant(e.target.value); setShowLookupButton(false); }}
                                required
                                className="pr-10 h-12 text-lg"
                                placeholder="e.g. Starbucks, Grab..."
                            />
                             <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="absolute right-1 top-1 h-10 w-10 text-muted-foreground hover:text-primary"
                                onClick={handleMerchantLookup}
                                disabled={!merchant || isLookingUp}
                                aria-label="Lookup merchant"
                            >
                                <Sparkles className="h-5 w-5" />
                            </Button>
                        </div>
                        {showLookupButton && (
                            <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setIsLookupDialogOpen(true)}>
                                View suggestions found for "{merchant}"
                            </Button>
                        )}
                    </div>

                    {/* Category - Promoted to main view */}
                    <div className="space-y-2">
                         <label htmlFor="category" className="text-sm font-semibold text-muted-foreground">Category</label>
                        <Combobox
        id="category"
                            options={categories.map(c => ({ value: c, label: c }))}
                            value={category}
                            onChange={setCategory}
                            placeholder="Select category"
                            searchPlaceholder="Search..."
                            className="h-12"
                                        disableAutoFocus={!isDesktop} // Disable on mobile to prevent keyboard jump
                        />
                    </div>
                </div>


                {/* --- 4. INTERNATIONAL DETAILS (Conditional) --- */}
                {method === 'International' && (
                    <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-xl border border-orange-100 dark:border-orange-900/50 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-orange-700 dark:text-orange-400 flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                Foreign Currency
                            </span>
                            <div className="flex items-center space-x-2">
                                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Input Mode</span>
                                <Switch
                                    checked={foreignInputMode === 'vnd_unknown'}
                                    onCheckedChange={(checked) => setForeignInputMode(checked ? 'vnd_unknown' : 'vnd_known')}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">Amount</label>
                                <Input
                                    inputMode="decimal"
                                    value={foreignCurrencyAmount}
                                    onChange={(e) => handleFormattedNumericInput(e.target.value, setForeignCurrencyAmount, true)}
                                    className="bg-white dark:bg-slate-900"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">Currency</label>
                                <Select value={foreignCurrency} onValueChange={setForeignCurrency}>
                                    <SelectTrigger className="bg-white dark:bg-slate-900">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(definitions?.foreignCurrencies?.length > 0
                                            ? definitions.foreignCurrencies
                                            : ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'SGD', 'THB', 'KRW']
                                        ).map(curr => (
                                            <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">Ex. Rate</label>
                                <Input
                                    inputMode="decimal"
                                    value={conversionRate}
                                    onChange={(e) => handleFormattedNumericInput(e.target.value, setConversionRate, true)}
                                    readOnly={foreignInputMode === 'vnd_known'}
                                    className={cn("bg-white dark:bg-slate-900", foreignInputMode === 'vnd_known' && "bg-muted text-muted-foreground")}
                                />
                            </div>
                             <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">Fee (VND)</label>
                                <Input
                                    value={conversionFee}
                                    onChange={(e) => handleFormattedNumericInput(e.target.value, setConversionFee)}
                                    className="bg-white dark:bg-slate-900"
                                />
                            </div>
                        </div>
                    </div>
                )}


                {/* --- 5. CASHBACK DETAILS (Moved from Accordions) --- */}
                <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                     <div className="space-y-2">
                        <label htmlFor="card" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Card</label>
                        <Select value={cardId} onValueChange={(value) => { handleCardSelect(value); localStorage.setItem('lastUsedCardId', value); }}>
                            <SelectTrigger id="card">
                                <SelectValue placeholder="Select a card..." />
                            </SelectTrigger>
                            <SelectContent>
                                {[...cards].sort((a, b) => a.name.localeCompare(b.name)).map(card => (
                                    <SelectItem key={card.id} value={card.id}>{card.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="rule" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rule</label>
                        <div className="flex items-center gap-2">
                            <Select value={applicableRuleId} onValueChange={(val) => val && setApplicableRuleId(val)} disabled={filteredRules.length === 0}>
                                <SelectTrigger id="rule" className="flex-1 min-w-0 [&>span]:min-w-0">
                                    <SelectValue placeholder={filteredRules.length === 0 ? 'No active rules' : 'Select rule...'} />
                                </SelectTrigger>
                                <SelectContent className="w-[var(--radix-select-trigger-width)]">
                                    {filteredRules.map(rule => (
                                        <SelectItem key={rule.id} value={rule.id} disabled={rule.status === 'Inactive'} className="[&>span]:min-w-0">
                                            <div className="flex w-full items-center justify-between gap-2 overflow-hidden">
                                                <span className="truncate">{rule.ruleName}</span>
                                                <Badge variant="secondary" className="ml-auto text-xs shrink-0">{(rule.rate * 100).toFixed(1)}%</Badge>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                             <Popover>
                                <PopoverTrigger asChild>
                                    <Button type="button" variant="ghost" size="icon" disabled={!selectedRule} aria-label="Rule details" className="shrink-0">
                                        <Info className="h-4 w-4" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                    {selectedRule && (
                                        <div className="space-y-2 text-sm">
                                            <h4 className="font-bold border-b pb-1 mb-2">{selectedRule.ruleName}</h4>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="text-muted-foreground">Rate:</div>
                                                <div className="font-medium text-right">{(selectedRule.rate * 100).toFixed(1)}%</div>
                                                <div className="text-muted-foreground">Monthly Cap:</div>
                                                <div className="font-medium text-right">{currencyFn(selectedRule.categoryLimit)}</div>
                                                <div className="text-muted-foreground">Transaction Cap:</div>
                                                <div className="font-medium text-right">{selectedRule.transactionLimit > 0 ? currencyFn(selectedRule.transactionLimit) : 'None'}</div>
                                            </div>
                                        </div>
                                    )}
                                </PopoverContent>
                            </Popover>
                        </div>
                        {selectedRule && estimatedCashbackAndWarnings.cashback > 0 && (
                            <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/20 p-2 rounded-md border border-emerald-100 dark:border-emerald-900/50 mt-2">
                                <span className="text-xs font-medium text-emerald-800 dark:text-emerald-400">Estimated Cashback:</span>
                                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-500">
                                    {currencyFn(estimatedCashbackAndWarnings.cashback)}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                             <label htmlFor="mcc" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">MCC Code</label>
                             {mccName && (
                                <Badge variant="outline" className="text-[10px] font-normal px-2 py-0 h-5 max-w-[200px] truncate" title={mccName}>
                                    {mccName}
                                </Badge>
                             )}
                        </div>
                        <Input
                            id="mcc"
                            value={mccCode}
                            onChange={(e) => setMccCode(e.target.value)}
                            placeholder="e.g. 5411"
                            type="number"
                        />
                    </div>
                </div>


                {/* --- 6. SMART CARD RECOMMENDATIONS --- */}
                {showRecommendations ? (
                    <CardRecommendations
                        recommendations={rankedCards}
                        onSelectCard={handleCardSelect}
                        currencyFn={currencyFn}
                        selectedCardId={cardId}
                    />
                ) : (
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowRecommendations(true)}
                        className="w-full"
                    >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Show Card Suggestions
                    </Button>
                )}


                {/* --- 7. ADDITIONAL DETAILS (Collapsible) --- */}
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="more-details" className="border-none">
                         <AccordionTrigger className="py-2 text-sm text-muted-foreground hover:no-underline">
                            More Details (Sub-category, Paid For, Notes)
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 space-y-4">
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="merchantLookup">Merchant Name</label>
                                    <Input
                                        id="merchantLookup"
                                        value={merchantLookup}
                                        onChange={(e) => setMerchantLookup(e.target.value)}
                                        placeholder=""
                                    />
                                </div>
                            </div>

                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <TagsInputField
                                        name="subCategory"
                                        label="Sub Category"
                                        placeholder="Add tags..."
                                        suggestions={definitions?.subCategories || []}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="paidFor">Paid For</label>
                                    <Combobox
        id="paidFor"
                                        options={(definitions?.paidFor?.length > 0
                                            ? definitions.paidFor
                                            : ['Personal', 'Family', 'Work']
                                        ).map(c => ({ value: c, label: c }))}
                                        value={paidFor}
                                        onChange={setPaidFor}
                                        placeholder="Who is this for?"
                                        searchPlaceholder="Search..."
                                        disableAutoFocus={!isDesktop} // Disable on mobile
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="notes">Notes</label>
                                <Textarea
                                    id="notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="min-h-[80px]"
                                    placeholder="Add details..."
                                />
                            </div>

                            {/* Discounts & Fees */}
                             <div className="space-y-2 pt-2 border-t">
                                <label className="text-sm font-medium">Adjustments</label>
                                {discounts.map((discount, index) => (
                                    <div key={`d-${index}`} className="flex items-center gap-2">
                                        <Input placeholder="Discount Desc" className="text-xs" value={discount.description} onChange={(e) => {
                                            const newDiscounts = [...discounts];
                                            newDiscounts[index].description = e.target.value;
                                            setDiscounts(newDiscounts);
                                        }} />
                                        <Input placeholder="Amount" className="text-xs w-24" value={discount.amount} onChange={(e) => {
                                            const newDiscounts = [...discounts];
                                            handleFormattedNumericInput(e.target.value, (val) => {
                                                newDiscounts[index].amount = val;
                                                setDiscounts(newDiscounts);
                                            });
                                        }} />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => setDiscounts(discounts.filter((_, i) => i !== index))} aria-label="Remove discount">
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                {fees.map((fee, index) => (
                                    <div key={`f-${index}`} className="flex items-center gap-2">
                                        <Input placeholder="Fee Desc" className="text-xs" value={fee.description} onChange={(e) => {
                                            const newFees = [...fees];
                                            newFees[index].description = e.target.value;
                                            setFees(newFees);
                                        }} />
                                        <Input placeholder="Amount" className="text-xs w-24" value={fee.amount} onChange={(e) => {
                                            const newFees = [...fees];
                                            handleFormattedNumericInput(e.target.value, (val) => {
                                                newFees[index].amount = val;
                                                setFees(newFees);
                                            });
                                        }} />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => setFees(fees.filter((_, i) => i !== index))} aria-label="Remove fee">
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                <div className="flex gap-2">
                                    <Button type="button" variant="outline" size="sm" className="text-xs h-7" onClick={() => setDiscounts([...discounts, { description: '', amount: '' }])}>+ Discount</Button>
                                    <Button type="button" variant="outline" size="sm" className="text-xs h-7" onClick={() => setFees([...fees, { description: '', amount: '' }])}>+ Fee</Button>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                {/* --- 8. SUBMIT (Desktop & Mobile FAB) --- */}
                {isDesktop ? (
                    <div className="sticky bottom-0 bg-background/95 backdrop-blur pt-4 pb-4 border-t mt-8">
                         <Button type="submit" disabled={isSubmitting} size="lg" className="w-full text-lg h-12 shadow-lg">
                            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (initialData ? "Update Transaction" : "Add Transaction")}
                        </Button>
                    </div>
                ) : (
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl z-50 p-0 flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90"
                        aria-label={initialData ? "Update Transaction" : "Add Transaction"}
                    >
                        {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : <Check className="h-7 w-7" />}
                    </Button>
                )}
            </form>
            <MccSearchResultsDialog
                open={isLookupDialogOpen}
                onOpenChange={setIsLookupDialogOpen}
                results={lookupResults}
                onSelect={(selectedResult) => {
                    setMccCode(selectedResult[2]);
                    setMerchantLookup(selectedResult[1]);
                    setIsLookupDialogOpen(false);
                }}
            />
        </FormProvider>
    );
}
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
import React from 'react';
import { Button } from '../../ui/button';

export default function QuickAddButtons({ vendors, onSelect }) {
    if (!vendors || vendors.length === 0) {
        return null;
    }

    return (
        <div className="mb-4 space-y-2">
            <label className="text-sm font-medium">Quick Add</label>
            <div className="flex flex-nowrap overflow-x-auto gap-2 pb-2 -mx-4 px-4 scrollbar-hide">
                {vendors.map(vendor => (
                    <Button
                        key={vendor.id}
                        variant="outline"
                        size="sm"
                        onClick={() => onSelect(vendor)}
                        className="h-8 flex-shrink-0"
                    >
                        {vendor.name}
                    </Button>
                ))}
            </div>
        </div>
    );
}
import React from 'react';
import { Wallet, Snowflake, Trophy, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

// Helper to determine the color of the rate badge
const getRateBadgeClass = (rate) => {
    if (rate >= 0.15) return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800';
    if (rate >= 0.10) return 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800';
    return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700';
};

// --- WINNER CARD COMPONENT ---
const WinnerCard = ({ item, onSelectCard, selectedCardId, currencyFn }) => {
    const { card, rule, calculatedCashback, remainingCategoryCashback } = item;
    const isSelected = card.id === selectedCardId;

    return (
        <button
            type="button"
            onClick={() => onSelectCard(card.id, rule.id)}
            className={cn(
                "w-full text-left relative overflow-hidden rounded-xl border-2 transition-all p-4 shadow-md group",
                isSelected
                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20"
                    : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 hover:border-emerald-200 dark:hover:border-emerald-800"
            )}
        >
            {/* Background Decoration */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-emerald-400/20 to-sky-400/20 blur-2xl rounded-full pointer-events-none" />

            <div className="relative flex justify-between items-start mb-2">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-amber-500 fill-amber-500" />
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500">Best Option</span>
                    </div>
                    <h3 className="font-bold text-lg leading-tight pr-8 text-slate-900 dark:text-slate-100">{card.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{rule.ruleName}</p>
                </div>

                <div className="text-right">
                     <Badge className={cn("text-base px-2.5 py-0.5 font-bold", getRateBadgeClass(rule.rate))}>
                        {(rule.rate * 100).toFixed(1)}%
                    </Badge>
                </div>
            </div>

            <div className="relative pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-end justify-between">
                <div>
                     <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Wallet className="h-3.5 w-3.5" />
                        Cap left: <span className="font-semibold text-slate-700 dark:text-slate-300">{isFinite(remainingCategoryCashback) ? currencyFn(remainingCategoryCashback) : 'Unlimited'}</span>
                    </span>
                </div>

                {calculatedCashback > 0 && (
                     <div className="text-right">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Estimated</p>
                        <p className="text-xl font-bold text-emerald-600 dark:text-emerald-500">+{currencyFn(calculatedCashback)}</p>
                    </div>
                )}
            </div>

            {isSelected && (
                <div className="absolute inset-0 border-2 border-emerald-500 rounded-xl pointer-events-none ring-2 ring-emerald-500/20" />
            )}
        </button>
    );
};


// Sub-component for rendering other recommendation items
const RecommendationItem = ({ item, rank, onSelectCard, selectedCardId, currencyFn }) => {
    const { card, rule, calculatedCashback } = item;
    const isSelected = card.id === selectedCardId;

    const isFrozen = item.rule.status === 'Inactive';
    const isCappedOrIneligible = !item.isMinSpendMet || item.isCategoryCapReached || item.isMonthlyCapReached;

    return (
        <button
            type="button"
            onClick={() => onSelectCard(card.id, rule.id)}
            className={cn(
                "w-full text-left border rounded-lg p-3 transition-all space-y-2 flex items-center justify-between gap-3",
                isSelected ? "bg-sky-50 border-sky-400 dark:bg-sky-950/30 dark:border-sky-700" : "bg-card hover:bg-muted/50",
                isCappedOrIneligible && "bg-muted opacity-60 grayscale"
            )}
        >
            <div className="flex items-center gap-3 min-w-0">
                {/* Compact Rank/Status Indicator */}
                 <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                    isFrozen ? "bg-slate-100 text-slate-400" : (isSelected ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-500 dark:bg-slate-800")
                 )}>
                    {isFrozen ? <Snowflake className="h-4 w-4" /> : `#${rank}`}
                 </div>

                <div className="min-w-0">
                    <p className="font-semibold text-sm truncate leading-tight">{card.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{rule.ruleName}</p>
                </div>
            </div>

            <div className="text-right shrink-0">
                 <div className="flex flex-col items-end gap-0.5">
                    <Badge variant="outline" className={cn("text-xs px-1.5 py-0", getRateBadgeClass(rule.rate))}>
                        {(rule.rate * 100).toFixed(1)}%
                    </Badge>
                     {calculatedCashback > 0 && !isCappedOrIneligible ? (
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-500">
                            +{currencyFn(calculatedCashback)}
                        </span>
                    ) : (
                         isCappedOrIneligible && (
                             <span className="text-[10px] text-orange-600 font-medium">Limited</span>
                         )
                    )}
                </div>
            </div>
        </button>
    );
};

export default function CardRecommendations({ recommendations, onSelectCard, currencyFn, selectedCardId }) {
    if (!recommendations || recommendations.length === 0) {
        return null;
    }

    // Separate cards into eligible and ineligible groups
    const eligible = recommendations.filter(r => !r.isCategoryCapReached && !r.isMonthlyCapReached && r.isMinSpendMet && r.rule.status !== 'Inactive');
    const ineligible = recommendations.filter(r => r.isCategoryCapReached || r.isMonthlyCapReached || !r.isMinSpendMet || r.rule.status === 'Inactive');

    // Deprioritize inactive rules within the eligible list
    eligible.sort((a, b) => {
        if (a.rule.status === 'Inactive' && b.rule.status !== 'Inactive') return 1;
        if (a.rule.status !== 'Inactive' && b.rule.status === 'Inactive') return -1;
        return 0;
    });

    const winner = eligible.length > 0 ? eligible[0] : null;
    const runnersUp = eligible.length > 1 ? eligible.slice(1) : [];

    return (
        <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Star className="h-4 w-4 text-emerald-500" />
                    Recommended Cards
                </h4>
            </div>

            {/* Winner Card */}
            {winner && (
                <WinnerCard
                    item={winner}
                    onSelectCard={onSelectCard}
                    selectedCardId={selectedCardId}
                    currencyFn={currencyFn}
                />
            )}

            {/* Runners Up - Compact List */}
            {runnersUp.length > 0 && (
                <div className="space-y-2 pt-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">Other Options</p>
                    {runnersUp.map((item, index) => (
                        <RecommendationItem
                            key={item.rule.id}
                            item={item}
                            rank={index + 2}
                            onSelectCard={onSelectCard}
                            selectedCardId={selectedCardId}
                            currencyFn={currencyFn}
                        />
                    ))}
                </div>
            )}

            {/* Ineligible List */}
            {ineligible.length > 0 && (
                <Accordion type="single" collapsible className="w-full pt-2">
                    <AccordionItem value="ineligible-cards" className="border-none">
                        <AccordionTrigger className="text-xs text-muted-foreground hover:no-underline justify-center py-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
                            Show {ineligible.length} unavailable options
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="pt-2 space-y-2">
                                {ineligible.map((item) => (
                                    <RecommendationItem
                                        key={item.rule.id}
                                        item={item}
                                        // Rank for ineligible is just a placeholder
                                        rank="-"
                                        onSelectCard={onSelectCard}
                                        selectedCardId={selectedCardId}
                                        currencyFn={currencyFn}
                                    />
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            )}
        </div>
    );
}
import React, { useState, useMemo } from "react";
import { CreditCard, Wallet, DollarSign, TrendingUp, AlertTriangle, Snowflake } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "../../ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../ui/accordion";
import { Badge } from "../../ui/badge";
import { Progress } from "../../ui/progress";
import { cn } from "../../../lib/utils";
import { getTimezone } from "../../../lib/timezone";
import { cardThemes } from "../../../lib/constants";
import { getCurrentCashbackMonthForCard, calculateFeeCycleProgress } from "../../../lib/date";
import StatCard from "../../shared/StatCard";
import CardDetailsDialog from "../dialogs/CardDetailsDialog";

export default function CardsTab({
  cards,
  allCards,
  monthlySummary,
  activeMonth,
  rules,
  currencyFn,
  fmtYMShortFn,
  mccMap,
  isDesktop,
  onUpdateCard,
  onUpdateRule
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
        onUpdateCard={onUpdateCard}
        onUpdateRule={onUpdateRule}
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

function EnhancedCard({ card, activeMonth, cardMonthSummary, rules, currencyFn, fmtYMShortFn, calculateFeeCycleProgressFn, view, mccMap, isDesktop, onUpdateCard, onUpdateRule }) {
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

  const formattedOpenDate = card.cardOpenDate ? new Date(card.cardOpenDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: getTimezone() }) : 'N/A';
  const formattedNextFeeDate = card.nextAnnualFeeDate ? new Date(card.nextAnnualFeeDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: getTimezone() }) : 'N/A';

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
          <CardDetailsDialog
            card={card}
            rules={rules}
            mccMap={mccMap}
            isDesktop={isDesktop}
            onUpdateCard={onUpdateCard}
            onUpdateRule={onUpdateRule}
          />
        </div>
      </div>
    </div>
  );
}
import React, { useState, useMemo } from 'react';
import { ChevronDown, CheckCircle2, Circle, Unlock, Lock, Infinity, Eye, Snowflake } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { calculateDaysLeftInCashbackMonth, calculateDaysUntilStatement } from '@/lib/date';

import { toast } from 'sonner';
import SharedTransactionsDialog from '@/components/shared/SharedTransactionsDialog';


function CategoryCapsUsage({ card, rules, activeMonth, monthlyCategorySummary, currencyFn, isTier2Met, onSelectCategory }) {
    const categoryCapData = useMemo(() => {
        const rulesMap = new Map(rules.map(r => [r.ruleName, r]));

        const summaries = monthlyCategorySummary.filter(
            summary => summary.cardId === card.id && summary.month === activeMonth
        );
        if (!summaries.length) return [];

        const data = summaries.map(summary => {
            let categoryName = 'Unknown Category';
            if (summary.summaryId) {
                const parts = summary.summaryId.split(' - ');
                if (parts.length > 1) categoryName = parts.slice(1).join(' - ');
            }

            const rule = rulesMap.get(categoryName);
            const currentCashback = summary.cashback || 0;

            const baseCategoryLimit = rule?.categoryLimit ?? summary.categoryLimit ?? 0;
            const baseTier2CategoryLimit = rule?.tier2CategoryLimit ?? 0;
            const baseRate = rule?.rate ?? 0;
            const baseTier2Rate = rule?.tier2Rate ?? 0;

            const isTier2LimitActive = isTier2Met && baseTier2CategoryLimit > 0;
            const isTier2RateActive = isTier2Met && baseTier2Rate > baseRate;
            const isBoosted = isTier2LimitActive || isTier2RateActive;

            const categoryLimit = isTier2LimitActive ? baseTier2CategoryLimit : baseCategoryLimit;

            const usedPct = categoryLimit > 0 ? Math.min(100, Math.round((currentCashback / categoryLimit) * 100)) : 0;
            const remaining = categoryLimit - currentCashback;
            const isCompleted = usedPct >= 100;

            return {
                id: summary.id,
                category: categoryName,
                currentCashback,
                limit: categoryLimit,
                usedPct,
                remaining,
                isBoosted,
                isCompleted
            };
        });

        return data.sort((a, b) => b.usedPct - a.usedPct);

    }, [card, rules, activeMonth, monthlyCategorySummary, isTier2Met]);

    return (
        <div className="px-4">
            <h4 className="text-sm font-semibold text-muted-foreground mb-4">CATEGORY CAPS USAGE</h4>
            {categoryCapData.length > 0 ? (
                <div className="space-y-4">
                    {categoryCapData.map(cap => (
                        <div key={cap.id}>
                            <div className="flex justify-between items-start text-sm mb-1.5 gap-2">
                                <p className="font-medium text-slate-700 dark:text-slate-300 flex-1 min-w-0 break-words" title={cap.category}>
                                    {cap.category}
                                    {cap.isBoosted && ' ✨'}
                                </p>
                                {cap.limit > 0 && (
                                    <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400 flex-shrink-0">{cap.usedPct}%</span>
                                )}
                            </div>
                            {cap.limit > 0 ? (
                                <Progress
                                    value={cap.usedPct}
                                    className="h-2"
                                    indicatorClassName={cn(
                                        cap.isCompleted ? "bg-emerald-500" : "bg-black dark:bg-slate-200"
                                    )}
                                />
                            ) : (
                                <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                    <Infinity className="h-4 w-4 text-gray-500" />
                                </div>
                            )}
                            <div className="flex justify-between items-center text-xs text-muted-foreground mt-1.5">
                                <span>
                                    {currencyFn(cap.currentCashback)}{cap.limit > 0 ? ` / ${currencyFn(cap.limit)}` : ''}
                                </span>
                                <div className="flex items-center">
                                    {cap.limit > 0 && (
                                        <span className="font-medium mr-2">
                                            {`${currencyFn(cap.remaining)} left`}
                                        </span>
                                    )}
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onSelectCategory({
                                        categoryName: cap.category,
                                        cardId: card.id,
                                        summaryPageId: cap.id
                                    })}>
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-4">
                    <p className="text-xs text-muted-foreground">No specific category data for this month.</p>
                </div>
            )}
        </div>
    );
}

// --- SingleCapCard component ---
// This component renders an individual Card for each item in the progress list.
function SingleCapCard({
    p,
    isExpanded,
    onToggleExpand,
    currencyFn,
    rules,
    monthlyCategorySummary,
    getProgressColor,
    getDotColorClass,
    DaysLeftBadge,
    onSelectCategory
}) {
    return (
        <Card key={p.cardId} className={cn("w-full", p.isFrozen && "opacity-60 grayscale bg-slate-50 dark:bg-slate-900/50")}>
            {/* Clickable Header Area */}
            <div
                className="flex flex-col gap-2 p-3 cursor-pointer"
                onClick={() => onToggleExpand(p.cardId)}
            >
                {/* Card Name and Days Left */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className={cn(
                            "w-2 h-2 rounded-full flex-shrink-0",
                            getDotColorClass(p.dotStatus)
                        )} />
                        <div className="flex items-center gap-1.5 min-w-0">
                            {p.isFrozen && <Snowflake className="h-4 w-4 text-sky-500 flex-shrink-0" />}
                            <p className={cn(
                                "font-semibold truncate",
                                { "text-slate-400 font-normal": p.isCapReached || p.isFrozen }
                            )} title={p.cardName}>{p.cardName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <DaysLeftBadge status={p.cycleStatus} days={p.daysLeft} />
                        <ChevronDown className={cn( "h-5 w-5 text-muted-foreground transition-transform duration-200 flex-shrink-0",
                            isExpanded && "rotate-180"
                        )} />
                    </div>
                </div>

                {/* Progress Bar and Figures */}
                {p.monthlyLimit > 0 && (
                    <div className="space-y-1.5">
                        {/* Key Figures (responsive) */}
                        <div className="flex justify-between items-center w-full text-sm">
                            <span className={cn(
                                "font-medium",
                                p.isCapReached || p.isFrozen ? "text-slate-500" : "text-emerald-600"
                            )}>
                                {p.isFrozen ? "Frozen" : (p.isCapReached ? "✓ Maximized" : `${currencyFn(p.monthlyLimit - p.currentCashback)} left`)}
                            </span>
                            <span className={cn(
                                "text-xs text-right",
                                p.isCapReached ? "text-slate-400" : "text-muted-foreground"
                            )}>
                                {currencyFn(p.currentCashback)} / {currencyFn(p.monthlyLimit)}
                            </span>
                        </div>
                        {/* Progress Bar */}
                        <Progress value={p.usedCapPct} indicatorClassName={getProgressColor(p.usedCapPct)} className="h-1.5 w-full" />
                    </div>
                )}

                {/* Status Badges */}
                {(p.minSpend > 0 || (p.cashbackType === '2 Tier' && p.tier2MinSpend > 0)) && (
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                        {/* Min Spend Tag */}
                        {p.minSpend > 0 && (
                            <Badge
                                variant="outline"
                                className={cn(
                                    "text-xs h-5 px-1.5 font-semibold flex items-center gap-1.5",
                                    p.minSpendMet
                                        ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                        : "bg-yellow-100 text-yellow-800 border-yellow-200"
                                )}
                            >
                                {p.minSpendMet ? (
                                    <>
                                        <CheckCircle2 className="h-3 w-3" />
                                        <span>Min. Spend Met</span>
                                    </>
                                ) : (
                                    <>
                                        <Circle className="h-3 w-3" />
                                        <span>
                                            Min Spend: {currencyFn(p.currentSpend)} / {currencyFn(p.minSpend)} ({p.minSpendPct}%)
                                        </span>
                                    </>
                                )}
                            </Badge>
                        )}
                        {/* Tier 2 Tag */}
                        {p.cashbackType === '2 Tier' && p.tier2MinSpend > 0 && (
                            <Badge
                                variant="outline"
                                className={cn(
                                    "text-xs h-5 px-1.5 font-semibold flex items-center gap-1.5",
                                    p.isTier2Met
                                        ? "bg-emerald-100 text-emerald-800 border-emerald-200" // Unlocked = Green
                                        : "bg-blue-100 text-blue-800 border-blue-200" // Locked = Blue
                                )}
                            >
                                {p.isTier2Met ? (
                                    <>
                                        <Unlock className="h-3 w-3" />
                                        <span>Tier 2 Unlocked</span>
                                    </>
                                ) : (
                                    <>
                                        <Lock className="h-3 w-3" />
                                        <span>
                                            Tier 2: {currencyFn(p.currentSpend)} / {currencyFn(p.tier2MinSpend)} ({p.tier2SpendPct}%)
                                        </span>
                                    </>
                                )}
                            </Badge>
                        )}
                    </div>
                )}
            </div>

            {/* Expandable Section */}
            <div className={cn( "overflow-hidden transition-all duration-300 ease-in-out",
                isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
            )}>
                {isExpanded && (
                    <div className="py-4 border-t">
                        <CategoryCapsUsage
                            card={p.card}
                            rules={rules.filter(r => r.cardId === p.cardId)}
                            activeMonth={p.activeMonth}
                            monthlyCategorySummary={monthlyCategorySummary}
                            currencyFn={currencyFn}
                            isTier2Met={p.isTier2Met}
                            onSelectCategory={onSelectCategory}
                        />
                    </div>
                )}
            </div>
        </Card>
    );
}

// --- REFACTORED CardSpendsCap Component ---
export default function CardSpendsCap({
    cards,
    rules,
    activeMonth,
    monthlySummary,
    monthlyCategorySummary,
    currencyFn,
    getCurrentCashbackMonthForCard,
    onEditTransaction,
    onTransactionDeleted,
    onBulkDelete,
    onViewTransactionDetails,
    cardMap,
    isLoading // NEW PROP
}) {
    const [expandedCardId, setExpandedCardId] = useState(null);
    const [dialogState, setDialogState] = useState({
        isOpen: false,
        isLoading: false,
        categoryName: null,
        transactions: [],
    });

    const isLiveView = activeMonth === 'live';

    const handleToggleExpand = (cardId) => {
        setExpandedCardId(prevId => (prevId === cardId ? null : cardId));
    };

    const handleSelectCategory = async ({ categoryName, cardId, summaryPageId }) => { // <-- 1. ADD summaryPageId here
        setDialogState({ isOpen: true, isLoading: true, categoryName, transactions: [] });

        try {
            const card = cards.find(c => c.id === cardId);
            if (!card) throw new Error("Card not found");

            const monthForCard = isLiveView ? getCurrentCashbackMonthForCard(card) : activeMonth;

            const res = await fetch(`${API_BASE_URL}/transactions?month=${monthForCard.replace('-', '')}&filterBy=cashbackMonth&cardId=${cardId}`);
            if (!res.ok) throw new Error('Failed to fetch transactions');

            const allTransactions = await res.json();

            // --- 2. REPLACE THE FILTER LOGIC ---
            const filtered = allTransactions.filter(t => {
                const summaryCategories = t['Card Summary Category']; // This is an array of relation IDs
                if (!Array.isArray(summaryCategories) || summaryCategories.length === 0) {
                    return false;
                }
                // Check if the transaction's summary category IDs
                // include the specific summaryPageId that was clicked.
                return summaryCategories.includes(summaryPageId);
            });
            // --- END OF REPLACEMENT ---

            setDialogState({ isOpen: true, isLoading: false, categoryName, transactions: filtered });

        } catch (err) {
            console.error(err);
            toast.error("Could not load transaction details.");
            setDialogState({ isOpen: false, isLoading: false, categoryName: null, transactions: [] });
        }
    };

    const cardSpendsCapProgress = useMemo(() => {
        return cards
            .filter(card => card.status !== 'Closed')
            .filter(card => card.overallMonthlyLimit > 0 || card.minimumMonthlySpend > 0 || (card.cashbackType === '2 Tier' && (card.tier2Limit > 0 || card.tier2MinSpend > 0)))
            .map(card => {
                const monthForCard = isLiveView ? getCurrentCashbackMonthForCard(card) : activeMonth;
                const cardMonthSummary = monthlySummary.find(
                    summary => summary.cardId === card.id && summary.month === monthForCard
                );

                const isFrozen = card.status === 'Frozen';

                const currentCashback = cardMonthSummary?.cashback || 0;
                const currentSpend = cardMonthSummary?.spend || 0;

                const isTier2Met = card.cashbackType === '2 Tier' && card.tier2MinSpend > 0 && currentSpend >= card.tier2MinSpend;
                const cardTierLimit = isTier2Met ? card.tier2Limit : card.overallMonthlyLimit;

                const dynamicLimit = cardMonthSummary?.monthlyCashbackLimit;
                const monthlyLimit = dynamicLimit > 0 ? dynamicLimit : cardTierLimit;

                const usedCapPct = monthlyLimit > 0 ? Math.min(100, Math.round((currentCashback / monthlyLimit) * 100)) : 0;
                const isCapReached = usedCapPct >= 100;

                const minSpend = card.minimumMonthlySpend || 0;
                const minSpendMet = minSpend > 0 ? currentSpend >= minSpend : true;
                const minSpendPct = minSpend > 0 ? Math.min(100, Math.round((currentSpend / minSpend) * 100)) : 100;

                const tier2SpendPct = card.tier2MinSpend > 0 ? Math.min(100, Math.round((currentSpend / card.tier2MinSpend) * 100)) : 0;

                let days = 0;
                let status = 'Unknown';

                if (isFrozen) {
                    status = 'Frozen';
                    days = 0;
                } else {
                    const result = card.useStatementMonthForPayments
                        ? calculateDaysLeftInCashbackMonth(monthForCard)
                        : calculateDaysUntilStatement(card.statementDay, monthForCard);
                    days = result.days;
                    status = result.status;
                }

                let dotStatus = 'gray'; // Default

                if (isFrozen) {
                    dotStatus = 'gray';
                } else if (isCapReached) {
                    dotStatus = 'green'; // Fully capped
                } else if (!minSpendMet && minSpend > 0) {
                    dotStatus = 'yellow'; // Requires action: Minimum Spend not met
                } else if (minSpendMet && !isCapReached) {
                    dotStatus = 'blue'; // In progress: Minimums met, not capped
                }
                // 'gray' remains for default (e.g., no min spend, not capped)

                return {
                    card, cardId: card.id, cardName: card.name, currentCashback,
                    currentSpend, monthlyLimit, usedCapPct, minSpend, minSpendMet,
                    minSpendPct, daysLeft: days, cycleStatus: status, isCapReached,
                    activeMonth: monthForCard,
                    isTier2Met,
                    cashbackType: card.cashbackType,
                    tier2MinSpend: card.tier2MinSpend,
                    tier2Limit: card.tier2Limit,
                    tier2SpendPct,
                    dotStatus,
                    isFrozen, // Add this property
                };
            })
            .sort((a, b) => {
                 if (a.isFrozen !== b.isFrozen) return a.isFrozen ? 1 : -1; // Frozen cards always last
                 if (a.isCapReached !== b.isCapReached) return a.isCapReached ? 1 : -1; // Capped cards last
                 if (a.minSpendMet !== b.minSpendMet) return a.minSpendMet ? -1 : 1; // Unmet min spend cards last among uncapped
                 // Prioritize 2 Tier cards that met Tier 2
                 if (a.cashbackType === '2 Tier' && b.cashbackType !== '2 Tier') {
                     if (a.isTier2Met) return -1;
                 }
                 if (a.cashbackType !== '2 Tier' && b.cashbackType === '2 Tier') {
                      if (b.isTier2Met) return 1;
                 }
                 if (a.cashbackType === '2 Tier' && b.cashbackType === '2 Tier') {
                     if(a.isTier2Met !== b.isTier2Met) return a.isTier2Met ? -1 : 1;
                 }
                 // Otherwise sort by percentage used (higher percentage first)
                 return b.usedCapPct - a.usedCapPct;
            });
    }, [cards, activeMonth, monthlySummary, isLiveView, getCurrentCashbackMonthForCard]);

    const getProgressColor = (percentage) => {
        // If logic needs to depend on card frozen state, we might need to change signature,
        // but easier to handle in SingleCapCard render or assume passed percentage handles it.
        // Actually, we should handle Frozen color in the component render logic or update this.
        // But for now, let's keep this pure percentage based.
        if (percentage >= 100) return "bg-emerald-500";
        if (percentage > 85) return "bg-orange-500";
        return "bg-sky-500";
    };

    const getDotColorClass = (status) => {
        switch (status) {
            case 'green': return "bg-emerald-500";
            case 'blue': return "bg-blue-500";
            case 'yellow': return "bg-yellow-500";
            default: return "bg-slate-400";
        }
    };

    const DaysLeftBadge = ({ status, days }) => {
        if (status === 'Frozen') {
             return (
                <Badge variant="outline" className="text-xs h-6 px-2 font-semibold justify-center bg-slate-100 text-slate-500 border-slate-200">
                    <Snowflake className="h-3 w-3 mr-1" />
                    Frozen
                </Badge>
             );
        }
        return (
            <Badge
                variant="outline"
                className={cn( "text-xs h-6 px-2 font-semibold justify-center",
                    status === 'Completed' && "bg-emerald-100 text-emerald-800 border-emerald-200"
                )}
            >
                {status === 'Completed' ? 'Done' : `${days} days left`}
            </Badge>
        );
    };

    return (
        // This div replaces the original outer <Card>
        <div>
            {/* This h3 replaces the original <CardTitle> */}
            <h3 className="text-lg font-semibold mb-4 px-1">Card Spends Cap</h3>

            {/* This div replaces the original <CardContent> */}
            <div>
                 {/* SKELETON LOADING STATE */}
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="rounded-xl border bg-card text-card-foreground shadow-sm p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Skeleton className="h-2 w-2 rounded-full" />
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                    <Skeleton className="h-5 w-20 rounded-full" />
                                </div>
                                <div className="space-y-2">
                                     <div className="flex justify-between">
                                         <Skeleton className="h-3 w-16" />
                                         <Skeleton className="h-3 w-24" />
                                     </div>
                                     <Skeleton className="h-1.5 w-full rounded-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : cardSpendsCapProgress.length > 0 ? (
                    <div className="space-y-4"> {/* This stacks the new <SingleCapCard> components */}
                        {cardSpendsCapProgress.map(p => (
                            <SingleCapCard
                                key={p.cardId}
                                p={p}
                                isExpanded={expandedCardId === p.cardId}
                                onToggleExpand={handleToggleExpand}
                                currencyFn={currencyFn}
                                rules={rules}
                                monthlyCategorySummary={monthlyCategorySummary}
                                getProgressColor={getProgressColor}
                                getDotColorClass={getDotColorClass}
                                DaysLeftBadge={DaysLeftBadge}
                                onSelectCategory={handleSelectCategory}
                            />
                        ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="pt-6"> {/* Add pt-6 to match default CardContent padding */}
                            <p className="text-sm text-muted-foreground text-center py-4">No monthly limits or minimums defined for your active cards.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
            <SharedTransactionsDialog
                isOpen={dialogState.isOpen}
                isLoading={dialogState.isLoading}
                onClose={() => setDialogState({ isOpen: false, isLoading: false, categoryName: null, transactions: [] })}
                transactions={dialogState.transactions}
                title={`Transactions for ${dialogState.categoryName}`}
                description="Here are the transactions for the selected category."
                currencyFn={currencyFn}
                onEdit={onEditTransaction}
                onDelete={onTransactionDeleted}
                onBulkDelete={onBulkDelete}
                onViewDetails={onViewTransactionDetails}
                cardMap={cardMap}
                rules={rules}
                allCards={cards}
                monthlyCategorySummary={monthlyCategorySummary}
            />
        </div>
    );
}
import React, { useState, useMemo } from 'react';
import {
    ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip,
    AreaChart, Area, CartesianGrid, Legend
} from 'recharts';
import {
    Card, CardContent, CardHeader, CardTitle
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * Custom Tooltip Component
 * Updated to handle both currency (All/Spend/Cashback) and percentage (Rate) views.
 */
const CustomRechartsTooltip = ({ active, payload, label, isRateView, isAllView, currencyFn }) => {
    const currency = currencyFn || ((n) => (n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }));

    if (active && payload?.length) {
        // --- Rate View ---
        if (isRateView) {
            const rateEntry = payload.find(p => p.dataKey === 'effectiveRate');
            if (!rateEntry) return null;

            const rate = rateEntry.value;
            return (
                <div className="rounded-lg bg-gray-900 p-3 text-sm shadow-xl transition-all">
                    <p className="font-bold text-white mb-2">{label}</p>
                    <p style={{ color: rateEntry.color }} className="font-medium flex justify-between items-center gap-4">
                        <span className="capitalize">{rateEntry.name}:</span>
                        <span className="font-bold">{(rate * 100).toFixed(2)}%</span>
                    </p>
                </div>
            );
        }

        // --- Standard View (Spend/Cashback) or All View ---
        const spendEntry = payload.find(p => p.dataKey === 'spend');
        const cashbackEntry = payload.find(p => p.dataKey === 'cashback');
        const effectiveRateEntry = payload.find(p => p.dataKey === 'effectiveRate'); // Get rate entry

        const spend = spendEntry ? spendEntry.value : 0;
        const cashback = cashbackEntry ? cashbackEntry.value : 0;
        const effectiveRate = effectiveRateEntry ? effectiveRateEntry.value : (spend > 0 ? (cashback / spend) : 0);

        return (
            <div className="rounded-lg bg-gray-900 p-3 text-sm shadow-xl transition-all">
                <p className="font-bold text-white mb-2">{label}</p>
                {payload
                    // Filter out effectiveRate if it's already computed implicitly for the all view
                    .filter(p => !isAllView || p.dataKey !== 'effectiveRate')
                    .map((p, i) => (
                    <p key={i} style={{ color: p.color }} className="font-medium flex justify-between items-center gap-4">
                        <span className="capitalize">{p.name}:</span>
                        <span className="font-bold">{currency(p.value)}</span>
                    </p>
                ))}

                {/* --- UPDATE --- */}
                {/* Reverted to show rate in 'All' view tooltip as requested */}
                {(isAllView || (spendEntry && cashbackEntry)) && (
                    <div className="mt-2 pt-2 border-t border-gray-600">
                        <p className="font-semibold text-white flex justify-between items-center">
                            <span>Effective Rate:</span>
                            <span className="font-bold">{(effectiveRate * 100).toFixed(2)}%</span>
                        </p>
                    </div>
                )}
            </div>
        );
    }
    return null;
};


/**
 * Main Chart Component
 */
export default function CurrentCashflowChart({ data, cards, currencyFn }) {
    const [chartView, setChartView] = useState("all"); // "all", "spend", "cashback", "rate"
    const [selectedCardId, setSelectedCardId] = useState('all'); // 'all' or a card.id

    // 1. Calculate the chart data
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];

        return data.map(monthData => {
            let spend = 0;
            let cashback = 0;

            if (selectedCardId === 'all') {
                if (cards) {
                    spend = cards.reduce((acc, card) => acc + (monthData[`${card.name} Spend`] || 0), 0);
                    cashback = cards.reduce((acc, card) => acc + (monthData[`${card.name} Cashback`] || 0), 0);
                } else {
                    // Fallback if cards not provided but data has 'spend'/'cashback'
                    spend = monthData.spend || 0;
                    cashback = monthData.cashback || 0;
                }
            } else {
                const selectedCard = cards?.find(c => c.id === selectedCardId);
                if (selectedCard) {
                    spend = monthData[`${selectedCard.name} Spend`] || 0;
                    cashback = monthData[`${selectedCard.name} Cashback`] || 0;
                }
            }

            return {
                ...monthData,
                spend,
                cashback,
                // Calculate rate as a decimal (e.g., 0.05 for 5%)
                effectiveRate: spend > 0 ? (cashback / spend) : 0
            };
        });
    }, [data, cards, selectedCardId]);

    const isRateViewOnly = chartView === 'rate'; // Only Effective Rate is visible
    const isAllView = chartView === 'all';

    // Right axis is no longer shown
    const showRightAxis = false;

    return (
        <Card className="flex flex-col min-h-[350px]">
            <CardHeader className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>Current Cashflow</CardTitle>
                <div className="flex flex-row items-center gap-2">
                    {/* Card Selector Dropdown */}
                    {cards && (
                        <Select value={selectedCardId} onValueChange={setSelectedCardId}>
                            <SelectTrigger className="w-1/2 sm:w-[180px]">
                                <SelectValue placeholder="Select a card" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Cards</SelectItem>
                                {cards.map((card) => (
                                    <SelectItem key={card.id} value={card.id}>
                                        {card.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {/* View Toggle */}
                    <Select value={chartView} onValueChange={setChartView}>
                        <SelectTrigger className="w-1/2 sm:w-[160px]">
                            <SelectValue placeholder="Select a view" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="spend">Spending</SelectItem>
                            <SelectItem value="cashback">Cashback</SelectItem>
                            <SelectItem value="rate">Effective Rate</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}
                        margin={{
                            top: 5,
                            right: 10,
                            left: 0,
                            bottom: 5
                        }}>

                        <defs>
                            <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorCashback" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                        </defs>

                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#e5e7eb"
                        />
                        <XAxis
                            dataKey="month"
                            stroke="#64748b"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dy={5}
                        />

                        {/* Primary Y-Axis for currency values */}
                        {!isRateViewOnly && (
                            <YAxis
                                yAxisId="leftCurrency"
                                stroke="#64748b"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`}
                                dx={-5}
                            />
                        )}

                        {/* Y-Axis for Rate (LEFT side, for 'rate' view only) */}
                        {isRateViewOnly && (
                            <YAxis
                                yAxisId="leftRate"
                                stroke="#64748b"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                                dx={-5}
                                domain={[0, 'auto']} // Start at 0%
                            />
                        )}

                        {/* Right Y-Axis is now controlled by 'showRightAxis' which is false */}
                        {showRightAxis && (
                            <YAxis
                                yAxisId="rightRate"
                                orientation="right"
                                stroke="#64748b"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                                dx={20}
                                domain={[0, 'auto']}
                            />
                        )}

                        <RechartsTooltip content={<CustomRechartsTooltip isRateView={isRateViewOnly} isAllView={isAllView} currencyFn={currencyFn} />} />

                        <Legend
                            verticalAlign="top"
                            align="right"
                            iconType="circle"
                            iconSize={10}
                            wrapperStyle={{ top: -10, right: 10 }}
                            formatter={(value) => (
                                <span className="capitalize text-muted-foreground font-medium ml-1">
                                    {value}
                                </span>
                            )}
                        />

                        {/* Conditional Area components */}
                        {(chartView === 'all' || chartView === 'spend') && (
                            <Area
                                type="monotone"
                                dataKey="spend"
                                stroke="#f59e0b"
                                fillOpacity={1}
                                fill="url(#colorSpend)"
                                strokeWidth={2.5}
                                dot={{ r: 3, fill: '#f59e0b' }}
                                activeDot={{ r: 6, stroke: '#f59e0b', fill: '#fff', strokeWidth: 2 }}
                                yAxisId="leftCurrency"
                            />
                        )}
                        {(chartView === 'all' || chartView === 'cashback') && (
                            <Area
                                type="monotone"
                                dataKey="cashback"
                                stroke="#3b82f6"
                                fillOpacity={1}
                                fill="url(#colorCashback)"
                                strokeWidth={2.5}
                                dot={{ r: 3, fill: '#3b82f6' }}
                                activeDot={{ r: 6, stroke: '#3b82f6', fill: '#fff', strokeWidth: 2 }}
                                yAxisId="leftCurrency"
                            />
                        )}
                        {/* Effective Rate Area (for 'rate' view) */}
                        {chartView === 'rate' && (
                            <Area
                                type="monotone"
                                dataKey="effectiveRate"
                                name="Effective Rate"
                                stroke="#10b981" // emerald-500
                                fillOpacity={1}
                                fill="url(#colorRate)"
                                strokeWidth={2.5}
                                dot={{ r: 3, fill: '#10b981' }}
                                activeDot={{ r: 6, stroke: '#10b981', fill: '#fff', strokeWidth: 2 }}
                                yAxisId="leftRate"
                            />
                        )}
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Lightbulb, AlertTriangle, Sparkles, DollarSign, ShoppingCart, ArrowUpCircle, Award } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { cn } from '@/lib/utils'; // Import cn utility

// --- ADDED: Date calculation utilities ---
import { calculateDaysLeftInCashbackMonth, calculateDaysUntilStatement } from '@/lib/date';

// --- NEW SUB-COMPONENT: RateStatusBadge ---
function RateStatusBadge({ suggestion }) {
    if (suggestion.isBoosted) {
        return (
            // Using green for active boost, which works well on light/dark
            <Badge variant="default" className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white dark:text-green-100 text-xs h-5 px-2 whitespace-nowrap overflow-hidden text-ellipsis shrink-[3] min-w-[40px]">
                ✨ Tier 2 Active
            </Badge>
        );
    }

    if (suggestion.hasTier2) {
        return (
             // Adding specific dark mode styles for the outline badge
            <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700 text-xs h-5 px-2 whitespace-nowrap overflow-hidden text-ellipsis shrink-[3] min-w-[40px]">
                Tier 2 Available
            </Badge>
        );
    }

    // --- MODIFIED: Return null for standard rate ---
    return null;
}

// --- NEW SUB-COMPONENT: SuggestionInfoCallout (for Accordion Content) ---
function SuggestionInfoCallout({ suggestion, currencyFn }) {
    const s = suggestion;

    if (s.isBoosted) {
        return (
            <div className="flex items-start gap-3 text-sm p-3 rounded-md bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-800">
                <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="font-semibold text-green-800 dark:text-green-300">Tier 2 Active</p>
                    <p className="text-green-700 dark:text-green-400 text-xs">
                        This card has met its {currencyFn(s.tier2MinSpend)} spend requirement, unlocking a higher cashback rate or an increased category limit.
                    </p>
                </div>
            </div>
        );
    }

    if (s.hasTier2) {
        return (
            <div className="flex items-start gap-3 text-sm p-3 rounded-md bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800">
                <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="font-semibold text-blue-800 dark:text-blue-300">Tier 2 Available</p>
                    <p className="text-blue-700 dark:text-blue-400 text-xs">
                        Spend {currencyFn(s.tier2MinSpend - s.currentSpend)} more on this card to unlock a better rate of <span className="font-bold">{(s.tier2Rate * 100).toFixed(1)}%</span>.
                    </p>
                </div>
            </div>
        );
    }

    return null;
}

// --- NEW SUB-COMPONENT: SuggestionDetails (for Accordion Content) ---
function SuggestionDetails({ suggestion, currencyFn }) {
    const s = suggestion; // for brevity

    // --- MODIFIED: Improved daysLeft display logic ---
    let daysLeftDisplay;
    let daysLeftColor = "text-foreground dark:text-slate-200"; // Default color

    if (s.daysLeft === null) {
        daysLeftDisplay = "Completed";
        daysLeftColor = "text-emerald-600"; // Green color as requested
    } else if (s.daysLeft === 0) {
        daysLeftDisplay = "0 days (Cycle ends today)";
    } else {
        daysLeftDisplay = s.daysLeft === 1 ? `${s.daysLeft} day` : `${s.daysLeft} days`; // Handle plural
    }

    return (
        <div className="space-y-4">

            {/* 1. Status Details (Alerts) - Now more descriptive */}
            <div className="space-y-2">
                <SuggestionInfoCallout suggestion={s} currencyFn={currencyFn} />

                {!s.hasMetMinSpend && (
                    <div className="flex items-start gap-2 text-sm p-3 rounded-md bg-orange-50 dark:bg-orange-900/50 border border-orange-200 dark:border-orange-800">
                        <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-orange-800 dark:text-orange-300">Minimum Spend Not Met</p>
                            <p className="text-orange-700 dark:text-orange-400 text-xs">
                                Spend <span className="font-bold">{currencyFn(s.minimumMonthlySpend - s.currentSpend)}</span> more on this card to activate this rate.
                            </p>
                        </div>
                    </div>
                )}
                {s.hasBetterChallenger && s.challengerDetails && (
                     <div className="flex items-start gap-2 text-sm p-3 rounded-md bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800">
                        <ArrowUpCircle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-blue-800 dark:text-blue-300">Better Offer Available</p>
                            <p className="text-blue-700 dark:text-blue-400 text-xs">
                                <span className="font-bold">{s.challengerDetails.cardName}</span> offers <span className="font-bold">{(s.challengerDetails.rate * 100).toFixed(1)}%</span>.
                            </p>
                            <p className="text-blue-700 dark:text-blue-400 text-xs mt-1">
                                It's not active because its {currencyFn(s.challengerDetails.minSpend)} min. spend is not met (Current: {currencyFn(s.challengerDetails.currentSpend)}).
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* 2. Card & Cycle Stats */}
            <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400">Card Status</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm p-3 rounded-md bg-slate-50 dark:bg-slate-800 border dark:border-slate-700">
                    <div className="space-y-0.5">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Days Left in Cycle</p>
                        {/* --- MODIFIED: Use new display string and color class --- */}
                        <p className={cn("font-medium", daysLeftColor)}>{daysLeftDisplay}</p>
                    </div>
                    {/* --- RE-ADDED: Cycle Status, but only if not 'Completed' --- */}
                    {s.cycleStatus !== 'Completed' && s.daysLeft !== null && (
                        <div className="space-y-0.5">
                            <p className="text-xs text-slate-500 dark:text-slate-400">Cycle Status</p>
                            <p className="font-medium text-slate-800 dark:text-slate-200">{s.cycleStatus}</p>
                        </div>
                    )}
                    <div className="space-y-0.5">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Total Card Spend</p>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{currencyFn(s.currentSpend)}</p>
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-xs text-slate-500 dark:text-slate-400">This Category's CB</p>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{currencyFn(s.currentCategoryCashback)}</p>
                    </div>
                </div>
            </div>

            {/* 3. Rule Breakdown */}
            <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400">Rule Breakdown</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm p-3 rounded-md bg-slate-50 dark:bg-slate-800 border dark:border-slate-700">
                    <div className="space-y-0.5">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Base Rate</p>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{(s.tier1Rate * 100).toFixed(1)}%</p>
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Base Category Limit</p>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{s.categoryLimit === Infinity ? 'Unlimited' : currencyFn(s.categoryLimit)}</p>
                    </div>
                    {s.hasTier2 && (
                        <>
                            <div className="space-y-0.5">
                                <p className="text-xs text-slate-500 dark:text-slate-400">Tier 2 Rate</p>
                                <p className="font-medium text-slate-800 dark:text-slate-200">{(s.tier2Rate * 100).toFixed(1)}%</p>
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-xs text-slate-500 dark:text-slate-400">Tier 2 Category Limit</p>
                                <p className="font-medium text-slate-800 dark:text-slate-200">{s.tier2CategoryLimit === Infinity ? 'Unlimited' : currencyFn(s.tier2CategoryLimit)}</p>
                            </div>
                        </>
                    )}
                    {s.transactionLimit > 0 && (
                        <div className="space-y-0.5">
                            <p className="text-xs text-slate-500 dark:text-slate-400">Max / Transaction</p>
                            <p className="font-medium text-slate-800 dark:text-slate-200">{currencyFn(s.transactionLimit)}</p>
                        </div>
                    )}
                    {s.secondaryTransactionLimit > 0 && (
                        <div className="space-y-0.5">
                            <p className="text-xs text-slate-500 dark:text-slate-400">2nd Tx Limit</p>
                            <p className="font-medium text-slate-800 dark:text-slate-200">{currencyFn(s.secondaryTransactionLimit)}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- REMOVED: Original Stats Footer --- */}
        </div>
    );
}


// --- REMOVED: HeroSuggestion component ---
// This is no longer a separate component and will be built directly in the main return.


// --- REFACTORED MAIN COMPONENT ---
export default function EnhancedSuggestions({ rules, cards, monthlyCategorySummary, monthlySummary, activeMonth, currencyFn, getCurrentCashbackMonthForCard, isLoading }) { // NEW PROP

    // --- UPDATED: Core logic hook ---
    const suggestions = useMemo(() => {
        const MINIMUM_RATE_THRESHOLD = 0.02;

        const allCandidates = rules.flatMap(rule => {
            const card = cards.find(c => c.id === rule.cardId);
            if (!card || card.status === 'Closed' || rule.status !== 'Active') return [];

            const monthForCard = activeMonth === 'live' ? getCurrentCashbackMonthForCard(card) : activeMonth;

            const cardSummary = monthlySummary.find(s => s.cardId === rule.cardId && s.month === monthForCard);
            const categorySummary = monthlyCategorySummary.find(s => s.cardId === rule.cardId && s.month === monthForCard && s.summaryId.endsWith(rule.ruleName));

            const currentTotalSpendForCard = cardSummary?.spend || 0;
            const currentCashbackForCategory = categorySummary?.cashback || 0;

            const isTier2Met = card.cashbackType === '2 Tier' && card.tier2MinSpend > 0 && currentTotalSpendForCard >= card.tier2MinSpend;
            const effectiveRate = isTier2Met && rule.tier2Rate ? rule.tier2Rate : rule.rate;
            const effectiveCategoryLimit = (isTier2Met && rule.tier2CategoryLimit) ? rule.tier2CategoryLimit : rule.categoryLimit;
            const isBoosted = isTier2Met && (rule.tier2Rate > rule.rate || rule.tier2CategoryLimit > rule.categoryLimit);

            const hasTier2 = card.cashbackType === '2 Tier' && (rule.tier2Rate > rule.rate || rule.tier2CategoryLimit > rule.categoryLimit);

            if (effectiveRate < MINIMUM_RATE_THRESHOLD) return [];

            // --- CHANGED: Incorporate Card Monthly Limit Logic ---
            const cardTierLimit = isTier2Met ? card.tier2Limit : card.overallMonthlyLimit;
            const dynamicLimit = cardSummary?.monthlyCashbackLimit;
            const effectiveCardLimit = dynamicLimit > 0 ? dynamicLimit : cardTierLimit;

            const remainingCardCap = effectiveCardLimit > 0
                ? Math.max(0, effectiveCardLimit - (cardSummary?.cashback || 0))
                : Infinity;

            let remainingCategoryCap = effectiveCategoryLimit > 0 ? Math.max(0, effectiveCategoryLimit - currentCashbackForCategory) : Infinity;

            // The actual remaining cap is the bottleneck of the Category Limit and the Card Limit
            remainingCategoryCap = Math.min(remainingCategoryCap, remainingCardCap);

            if (remainingCategoryCap === 0) return [];

            const hasMetMinSpend = card.minimumMonthlySpend > 0 ? currentTotalSpendForCard >= card.minimumMonthlySpend : true;
            const spendingNeeded = remainingCategoryCap === Infinity ? Infinity : remainingCategoryCap / effectiveRate;

            const categories = rule.category?.length ? rule.category : [rule.ruleName];

            const { days, status } = card.useStatementMonthForPayments
                ? calculateDaysLeftInCashbackMonth(monthForCard)
                : calculateDaysUntilStatement(card.statementDay, monthForCard);

            return categories.map(cat => ({
                ...rule,
                rate: effectiveRate,
                suggestionFor: cat,
                parentRuleName: rule.ruleName,
                cardName: card.name,
                remainingCategoryCap,
                hasMetMinSpend,
                spendingNeeded,
                isBoosted,
                hasTier2,
                tier1Rate: rule.rate,
                tier2Rate: rule.tier2Rate,
                tier2MinSpend: card.tier2MinSpend || 0,
                currentSpend: currentTotalSpendForCard,
                minimumMonthlySpend: card.minimumMonthlySpend || 0,
                currentCategoryCashback: currentCashbackForCategory,
                daysLeft: days,
                cycleStatus: status,
                categoryLimit: rule.categoryLimit || Infinity,
                tier2CategoryLimit: rule.tier2CategoryLimit || Infinity,
                transactionLimit: rule.transactionLimit || 0,
                secondaryTransactionLimit: rule.secondaryTransactionLimit || 0
            }));
        }).filter(Boolean);

        const groupedByCategory = allCandidates.reduce((acc, candidate) => {
            const category = candidate.suggestionFor;
            if (!acc[category]) acc[category] = [];
            acc[category].push(candidate);
            return acc;
        }, {});

        const bestCardPerCategory = Object.values(groupedByCategory).map(group => {
            const qualifiedCards = group.filter(c => c.hasMetMinSpend);
            const unqualifiedCards = group.filter(c => !c.hasMetMinSpend);

            const ranker = (a, b) => (b.rate - a.rate) || (b.remainingCategoryCap - a.remainingCategoryCap);

            qualifiedCards.sort(ranker);
            unqualifiedCards.sort(ranker);
            const bestQualified = qualifiedCards[0];
            const bestUnqualified = unqualifiedCards[0];

            let finalChoice = bestQualified || bestUnqualified;

            if (finalChoice) {
                let hasBetterChallenger = false;
                let challengerDetails = null;

                if (finalChoice.hasMetMinSpend && bestUnqualified) {
                    if (bestUnqualified.rate > finalChoice.rate || (bestUnqualified.rate === finalChoice.rate && bestUnqualified.remainingCategoryCap > finalChoice.remainingCategoryCap)) {
                        hasBetterChallenger = true;
                        challengerDetails = {
                            cardName: bestUnqualified.cardName,
                            rate: bestUnqualified.rate,
                            minSpend: bestUnqualified.minimumMonthlySpend,
                            currentSpend: bestUnqualified.currentSpend
                        };
                    }
                }
                finalChoice = { ...finalChoice, hasBetterChallenger, challengerDetails };
            }
            return finalChoice;
        }).filter(Boolean);

        bestCardPerCategory.sort((a, b) => {
            if (a.hasMetMinSpend !== b.hasMetMinSpend) return a.hasMetMinSpend ? -1 : 1;
            if (b.rate !== a.rate) return b.rate - a.rate;
            return b.remainingCategoryCap - a.remainingCategoryCap;
        });

        return bestCardPerCategory;
    }, [rules, cards, monthlyCategorySummary, monthlySummary, activeMonth, getCurrentCashbackMonthForCard]);

    const topSuggestion = suggestions[0];
    const otherSuggestions = suggestions.slice(1);

    return (
        <Card className="flex flex-col h-full max-h-[600px]">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    <span>Top Cashback Opportunities</span>
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col min-h-0 overflow-y-auto">
                {/* SKELETON LOADING STATE */}
                {isLoading ? (
                    <div className="space-y-4">
                        <div className="border border-sky-100 dark:border-sky-900 rounded-lg p-4 space-y-3">
                            <div className="flex justify-between">
                                <Skeleton className="h-6 w-24" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                            <div className="flex gap-4">
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-6 w-48" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                                <Skeleton className="h-10 w-20" />
                            </div>
                        </div>
                        <div className="space-y-2">
                             {[1, 2, 3].map(i => (
                                <Skeleton key={i} className="h-16 w-full rounded-lg" />
                             ))}
                        </div>
                    </div>
                ) : (
                    <>
                    {/* Scenario 1: No suggestions */}
                    {suggestions.length === 0 && (
                        <div className="flex flex-col items-center justify-center text-center p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/50 h-full min-h-[200px]">
                            <Sparkles className="h-8 w-8 text-emerald-500 mb-2" />
                            <p className="font-semibold text-emerald-800 dark:text-emerald-300">All Qualified Tiers Maxed Out!</p>
                            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">No high-tier opportunities are available on cards that have met their minimum spend.</p>
                        </div>
                    )}

                    {/* Scenarios 2 & 3: At least one suggestion exists */}
                    {suggestions.length > 0 && (
                        // --- MODIFIED: Removed min-h-0 to allow full scrolling ---
                        <div className="space-y-3 flex flex-col flex-1">

                            {/* --- MODIFIED: Top Pick is now an Accordion --- */}
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem
                                    value="top-pick"
                                    className="border-2 border-sky-500 bg-sky-50 dark:bg-sky-900/40 dark:border-sky-700 shadow-md rounded-lg overflow-hidden"
                                >
                                    <AccordionTrigger className="p-4 hover:no-underline hover:bg-sky-100/50 dark:hover:bg-sky-900/60 data-[state=open]:border-b border-sky-200 dark:border-sky-800 items-start">
                                        <div className="w-full space-y-3">
                                            {/* Header: Top Pick Badge + Card Name */}
                                            <div className="flex items-center justify-between gap-2">
                                                <Badge variant="default" className="bg-sky-600 dark:bg-sky-600 w-fit">
                                                    <Award className="h-4 w-4 mr-1.5" />
                                                    TOP PICK
                                                </Badge>
                                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400 truncate" title={topSuggestion.cardName}>{topSuggestion.cardName}</span>
                                            </div>

                                            {/* Body: Split into two columns */}
                                            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                                                {/* Left Column: Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        {!topSuggestion.hasMetMinSpend && (
                                                            <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0" />
                                                        )}
                                                        {topSuggestion.hasBetterChallenger && (
                                                            <ArrowUpCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                                                        )}
                                                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 break-words" title={topSuggestion.suggestionFor}>
                                                            {topSuggestion.suggestionFor}
                                                        </h3>
                                                    </div>
                                                    <div className="mt-1.5 flex gap-2 items-center">
                                                        {/* Badge only shows for special cases */}
                                                        {(topSuggestion.isBoosted || topSuggestion.hasTier2) && (
                                                            <RateStatusBadge suggestion={topSuggestion} />
                                                        )}
                                                    </div>
                                                </div>
                                                {/* Right Column: Rate */}
                                                <div className="flex-shrink-0 sm:text-right">
                                                    <p className="text-4xl font-bold text-sky-700 dark:text-sky-400">
                                                        {(topSuggestion.rate * 100).toFixed(1)}%
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Footer: Stats */}
                                            <div className="pt-3 border-t border-sky-200 dark:border-sky-800 text-xs text-slate-600 dark:text-slate-400 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-x-4 gap-y-1">
                                                <span className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5 text-emerald-600" /><span className="font-medium text-emerald-700 dark:text-emerald-400">{topSuggestion.remainingCategoryCap === Infinity ? 'Unlimited' : currencyFn(topSuggestion.remainingCategoryCap)}</span><span>left</span></span>
                                                <span className="flex items-center gap-1.5"><ShoppingCart className="h-3.5 w-3.5" /><span>Spend</span><span className="font-medium text-slate-800 dark:text-slate-200">{topSuggestion.spendingNeeded === Infinity ? 'N/A' : currencyFn(topSuggestion.spendingNeeded)}</span></span>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 pt-3 bg-white dark:bg-slate-900 max-h-[400px] overflow-y-auto">
                                        <SuggestionDetails
                                            suggestion={topSuggestion}
                                            currencyFn={currencyFn}
                                        />
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>


                            {/* Scenario 3: More than one suggestion */}
                            {otherSuggestions.length > 0 && (
                                <div className="flex flex-col flex-1">
                                    <div className="flex items-center gap-3 my-3">
                                        <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400">Other Suggestions</h4>
                                        <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                                    </div>

                                    <Accordion type="single" collapsible className="flex-1 space-y-2">
                                        {otherSuggestions.map((s, index) => {
                                            return (
                                                <AccordionItem
                                                    key={`${s.id}-${s.suggestionFor}`}
                                                    value={s.suggestionFor}
                                                    className="rounded-lg border bg-card shadow-sm overflow-hidden" // Item is styled as a card
                                                >
                                                    <AccordionTrigger className="p-3 hover:no-underline hover:bg-slate-50 dark:hover:bg-slate-800/60 w-full text-left data-[state=open]:border-b border-slate-200 dark:border-slate-700 items-start">
                                                        <div className="w-full space-y-2">
                                                            {/* --- MODIFIED: Main Info Row --- */}
                                                            <div className="flex justify-between items-center gap-3">
                                                                {/* Left side: Rank, Icons, Category, Badge */}
                                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                    <span className="text-sm font-semibold text-sky-600 dark:text-sky-400">#{index + 2}</span>
                                                                    {!s.hasMetMinSpend && (
                                                                        <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                                                                    )}
                                                                    {s.hasBetterChallenger && (
                                                                        <ArrowUpCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                                                    )}
                                                                    <p className="font-medium text-slate-800 dark:text-slate-200 truncate" title={s.suggestionFor}>{s.suggestionFor}</p>
                                                                    {/* --- MODIFIED: Badge is here, and conditional --- */}
                                                                    {(s.isBoosted || s.hasTier2) && (
                                                                        <RateStatusBadge suggestion={s} />
                                                                    )}
                                                                </div>
                                                                {/* Right side: Card Name, Rate */}
                                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                                    <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">{s.cardName}</span>
                                                                    <Badge variant="outline" className="text-base font-bold text-sky-700 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/50 border-sky-200 dark:border-sky-800">
                                                                        {(s.rate * 100).toFixed(1)}%
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                            <span className="text-xs text-slate-500 dark:text-slate-400 sm:hidden ml-7 -mt-1 block">{s.cardName}</span>

                                                            {/* --- MOVED: Stats Footer is now in the trigger --- */}
                                                            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex justify-between items-center flex-wrap gap-x-4 gap-y-1">
                                                                <span className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5 text-emerald-600" /><span className="font-medium text-emerald-700 dark:text-emerald-400">{s.remainingCategoryCap === Infinity ? 'Unlimited' : currencyFn(s.remainingCategoryCap)}</span><span>left</span></span>
                                                                <span className="flex items-center gap-1.5"><ShoppingCart className="h-3.5 w-3.5" /><span>Spend</span><span className="font-medium text-slate-800 dark:text-slate-200">{s.spendingNeeded === Infinity ? 'N/A' : currencyFn(s.spendingNeeded)}</span></span>
                                                            </div>
                                                        </div>
                                                    </AccordionTrigger>

                                                    <AccordionContent className="p-4 pt-3 bg-white dark:bg-slate-900 max-h-[400px] overflow-y-auto">
                                                        <SuggestionDetails
                                                            suggestion={s}
                                                            currencyFn={currencyFn}
                                                        />
                                                    </AccordionContent>
                                                </AccordionItem>
                                            )
                                        })}
                                    </Accordion>
                                </div>
                            )}
                        </div>
                    )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
// src/components/dashboard/tabs/overview/StatCards.jsx
import React from 'react';
import StatCard from "@/components/shared/StatCard";
import { Wallet, DollarSign, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function StatCards({ stats, currencyFn, isLoading }) {
    if (isLoading) {
        return (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                         <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-4 rounded-full" />
                        </div>
                        <div className="pt-2">
                             <Skeleton className="h-8 w-32 mb-2" />
                             <Skeleton className="h-4 w-full" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

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
// RecentTransactions.jsx

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, History } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { getZonedDate } from "../../../lib/timezone";
import {
    subWeeks,
    startOfDay,
    parseISO,
    format,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    isWithinInterval
} from 'date-fns';

// ⚡ Bolt Optimization: Extracted and Memoized List Item
// Prevents VDOM re-creation for every item when parent re-renders.
const RecentTransactionItem = React.memo(({ tx, cardMap, currencyFn }) => {
    const card = tx['Card'] && tx['Card'][0] ? cardMap.get(tx['Card'][0]) : null;
    const cardName = card ? card.name : 'Unknown Card';

    const formattedDate = useMemo(() => {
        try {
            if (tx._parsedDate) {
                return format(tx._parsedDate, 'dd MMM yyyy');
            }
            return format(parseISO(tx['Transaction Date']), 'dd MMM yyyy');
        } catch (e) {
            return tx['Transaction Date'];
        }
    }, [tx]);

    return (
        <div className="flex items-center p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800">
            {/* Name Column */}
            <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 dark:text-slate-200 truncate" title={tx['Transaction Name']}>
                    {tx['Transaction Name']}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{cardName}</p>
            </div>
            {/* Date Column */}
            <div className="w-28 text-sm text-slate-600 dark:text-slate-300 text-left px-2 flex-shrink-0 hidden sm:block">
                {formattedDate}
            </div>
            {/* Amount Column */}
            <div className="w-28 text-right flex-shrink-0">
                <p className="font-semibold text-slate-900 dark:text-slate-100">{currencyFn(tx['Amount'])}</p>
                <p className="text-sm text-emerald-600 dark:text-emerald-500 font-medium">+ {currencyFn(tx.estCashback)}</p>
            </div>
        </div>
    );
});
RecentTransactionItem.displayName = 'RecentTransactionItem';


// ⚡ Bolt Optimization: Memoize the container to prevent re-renders on parent state changes
const RecentTransactions = React.memo(({ transactions, cardMap, currencyFn, isLoading }) => {
    const [activityFilter, setActivityFilter] = useState('thisWeek'); // 'thisWeek', 'lastWeek', 'thisMonth'

    const filterLabels = {
        thisWeek: 'This Week',
        lastWeek: 'Last Week',
        thisMonth: 'This Month',
    };

    // ⚡ Bolt Optimization: Pre-parse dates once to avoid repeated parseISO during filtering
    const transactionsWithDates = useMemo(() => {
        if (!transactions) return [];
        return transactions.map(tx => {
            try {
                return {
                    ...tx,
                    _parsedDate: parseISO(tx['Transaction Date'])
                };
            } catch (e) {
                console.error("Error parsing date:", tx['Transaction Date']);
                return { ...tx, _parsedDate: null };
            }
        });
    }, [transactions]);

    const filteredTransactions = useMemo(() => {
        const today = startOfDay(getZonedDate());
        const options = { weekStartsOn: 1 };
        let interval;

        if (activityFilter === 'thisWeek') {
            interval = {
                start: startOfWeek(today, options),
                end: endOfWeek(today, options)
            };
        } else if (activityFilter === 'lastWeek') {
            const lastWeekDay = subWeeks(today, 1);
            interval = {
                start: startOfWeek(lastWeekDay, options),
                end: endOfWeek(lastWeekDay, options)
            };
        } else if (activityFilter === 'thisMonth') {
            interval = {
                start: startOfMonth(today),
                end: endOfMonth(today)
            };
        } else {
            return transactionsWithDates; // Fallback
        }

        // Filter using the pre-parsed date
        return transactionsWithDates.filter(tx => {
            if (!tx._parsedDate) return false;
            return isWithinInterval(tx._parsedDate, interval);
        });
    }, [transactionsWithDates, activityFilter]);


    if (!transactions && !isLoading) return null;

    return (
        <Card className="flex flex-col lg:flex-1 lg:min-h-0 max-h-[600px]">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    <span>Recent Activity</span>
                </CardTitle>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="ml-auto gap-1">
                            <span>{filterLabels[activityFilter]}</span>
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setActivityFilter('thisWeek')}>
                            This Week
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setActivityFilter('lastWeek')}>
                            Last Week
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setActivityFilter('thisMonth')}>
                            This Month
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0 p-4">
                {/* List Headers */}
                <div className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 px-2 flex-shrink-0">
                    <div className="flex-1 min-w-0">Name</div>
                    <div className="w-28 text-left px-2 flex-shrink-0 hidden sm:block">Date</div>
                    <div className="w-28 text-right flex-shrink-0">Amount</div>
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto">
                    {/* SKELETON LOADING STATE */}
                    {isLoading ? (
                        [1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center p-2 rounded-md border border-slate-100 dark:border-slate-800">
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                                <div className="hidden sm:block w-28 px-2">
                                    <Skeleton className="h-4 w-20" />
                                </div>
                                <div className="w-28 flex flex-col items-end space-y-1">
                                    <Skeleton className="h-4 w-16" />
                                    <Skeleton className="h-3 w-12" />
                                </div>
                            </div>
                        ))
                    ) : filteredTransactions.length === 0 ? (
                        <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-8">
                            No activity for this period.
                        </div>
                    ) : (
                        filteredTransactions.map(tx => (
                            <RecentTransactionItem
                                key={tx.id}
                                tx={tx}
                                cardMap={cardMap}
                                currencyFn={currencyFn}
                            />
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
});

RecentTransactions.displayName = 'RecentTransactions';

export default RecentTransactions;
import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ResponsiveContainer,
  AreaChart, // [Updated]
  Area, // [Updated]
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from 'recharts';

/**
 * [Updated] Custom Tooltip
 * - Removed cardColorMap dependency
 * - Colors the spend/cashback values instead of the card name
 */
function CustomLineChartTooltip({ active, payload, label, currencyFn, selectedCard }) {
  // Static colors to match the chart
  const spendColor = '#f59e0b';
  const cashbackColor = '#3b82f6';

  if (active && payload?.length) {
    let cardName, spend, cashback;

    if (selectedCard) {
      // Single card view
      cardName = selectedCard.name;
      spend = payload.find((p) => p.dataKey.includes('Spend'))?.value;
      cashback = payload.find((p) => p.dataKey.includes('Cashback'))?.value;
    } else {
      // "All Cards" aggregate view
      cardName = 'All Cards';
      spend = payload.find((p) => p.dataKey === 'Total Spend')?.value;
      cashback = payload.find((p) => p.dataKey === 'Total Cashback')?.value;
    }

    return (
      <div className="rounded-lg bg-gray-900 p-3 text-sm shadow-xl transition-all">
        <p className="font-bold text-white mb-2">{label}</p>
        <div className="space-y-2">
          <div>
            <p className="font-semibold mb-1 text-white">
              {cardName}
            </p>
            <div className="grid grid-cols-[1fr_auto] gap-x-4">
              {spend !== null && spend !== undefined && (
                <>
                  <span className="text-white flex justify-between items-center">Spend:</span>
                  <span className="font-medium text-right" style={{ color: spendColor }}>
                    {currencyFn(spend)}
                  </span>
                </>
              )}
              {cashback !== null && cashback !== undefined && (
                <>
                  <span className="text-muted-foreground">Cashback:</span>
                  <span className="font-medium text-right" style={{ color: cashbackColor }}>
                    {currencyFn(cashback)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

// [Updated] Main component - removed cardColorMap
export default function CummulativeResultsChart({ data, cards, currencyFn }) {
  const [view, setView] = useState('All');
  const [selectedCardId, setSelectedCardId] = useState('all'); // 'all' or a card.id

  // [New] Standardized colors
  const spendColor = '#f59e0b'; // amber-500
  const cashbackColor = '#3b82f6'; // blue-600

  // Get the currently selected card object
  const selectedCard = useMemo(
    () => cards.find((c) => c.id === selectedCardId),
    [cards, selectedCardId],
  );

  // [Original] Create aggregated *monthly* data for "All Cards" view
  const aggregatedData = useMemo(() => {
    return data.map((monthData) => {
      const totalSpend = cards.reduce(
        (acc, card) => acc + (monthData[`${card.name} Spend`] || 0),
        0,
      );
      const totalCashback = cards.reduce(
        (acc, card) => acc + (monthData[`${card.name} Cashback`] || 0),
        0,
      );
      return {
        ...monthData,
        'Total Spend': totalSpend,
        'Total Cashback': totalCashback,
      };
    });
  }, [data, cards]);

  // [New] Create *cumulative* aggregated data for "All Cards" view
  const cumulativeAggregatedData = useMemo(() => {
    let runningSpend = 0;
    let runningCashback = 0;
    return aggregatedData.map((monthData) => {
      runningSpend += monthData['Total Spend'] || 0;
      runningCashback += monthData['Total Cashback'] || 0;
      return {
        ...monthData,
        'Total Spend': runningSpend,
        'Total Cashback': runningCashback,
      };
    });
  }, [aggregatedData]);

  // [New] Create *cumulative* data for single-card views
  const cumulativeData = useMemo(() => {
    // Initialize running totals for all card metrics
    const runningTotals = {};
    cards.forEach((card) => {
      runningTotals[`${card.name} Spend`] = 0;
      runningTotals[`${card.name} Cashback`] = 0;
    });

    return data.map((monthData) => {
      const cumulativeMonth = { ...monthData }; // Start with month label

      // Iterate over all possible keys and update running totals
      for (const key in runningTotals) {
        if (monthData[key]) {
          runningTotals[key] += monthData[key];
        }
        cumulativeMonth[key] = runningTotals[key];
      }
      return cumulativeMonth;
    });
  }, [data, cards]);

  // [Updated] Select the correct cumulative data based on the dropdown
  const chartData = selectedCardId === 'all' ? cumulativeAggregatedData : cumulativeData;

  return (
    <Card>
      <CardHeader className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Cummulative Results</CardTitle>
        <div className="flex flex-row items-center gap-2">
          {/* Card Selector Dropdown */}
          <Select value={selectedCardId} onValueChange={setSelectedCardId}>
            <SelectTrigger className="w-1/2 sm:w-[180px]">
              <SelectValue placeholder="Select a card" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cards</SelectItem>
              {cards.map((card) => (
                <SelectItem key={card.id} value={card.id}>
                  {card.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Toggle (All / Spending / Cashback) */}
          <Select value={view} onValueChange={setView}>
            <SelectTrigger className="w-1/2 sm:w-[150px]">
              <SelectValue placeholder="Select a view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Spending">Spending</SelectItem>
              <SelectItem value="Cashback">Cashback</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
            {/* [New] Gradient definitions */}
            <defs>
              <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={spendColor} stopOpacity={0.4} />
                <stop offset="95%" stopColor={spendColor} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorCashback" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={cashbackColor} stopOpacity={0.4} />
                <stop offset="95%" stopColor={cashbackColor} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="left"
              domain={[0, 'auto']}
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={
                view === 'Cashback'
                  ? (v) => `${(v / 1000).toFixed(0)}k`
                  : (v) => `${(v / 1000000).toFixed(0)}M`
              }
            />
            <RechartsTooltip
              content={
                // [Updated] Removed cardColorMap
                <CustomLineChartTooltip
                  currencyFn={currencyFn}
                  selectedCard={selectedCard}
                />
              }
            />

            {/* [Updated] Area Rendering Logic */}
            {selectedCardId === 'all' ? (
              // "All Cards" View
              <React.Fragment>
                {(view === 'All' || view === 'Spending') && (
                  <Area
                    type="monotone"
                    connectNulls
                    dataKey="Total Spend"
                    stroke={spendColor}
                    fill="url(#colorSpend)" // [Updated]
                    fillOpacity={1} // [Updated]
                    strokeWidth={2}
                    yAxisId="left"
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                )}
                {(view === 'All' || view === 'Cashback') && (
                  <Area
                    type="monotone"
                    connectNulls
                    dataKey="Total Cashback"
                    stroke={cashbackColor}
                    fill="url(#colorCashback)" // [Updated]
                    fillOpacity={1} // [Updated]
                    strokeWidth={2}
                    yAxisId="left"
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                )}
              </React.Fragment>
            ) : (
              // Single Card View
              <React.Fragment>
                {(view === 'All' || view === 'Spending') && (
                  <Area
                    type="monotone"
                    connectNulls
                    dataKey={`${selectedCard.name} Spend`}
                    stroke={spendColor}
                    fill="url(#colorSpend)" // [Updated]
                    fillOpacity={1} // [Updated]
                    strokeWidth={2}
                    yAxisId="left"
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                )}
                {(view === 'All' || view === 'Cashback') && (
                  <Area
                    type="monotone"
                    connectNulls
                    dataKey={`${selectedCard.name} Cashback`}
                    stroke={cashbackColor}
                    fill="url(#colorCashback)" // [Updated]
                    fillOpacity={1} // [Updated]
                    strokeWidth={2}
                    yAxisId="left"
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                )}
              </React.Fragment>
            )}
          </AreaChart>
        </ResponsiveContainer>

        {/* [Updated] Dynamic Legend */}
        <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs">
          {selectedCardId === 'all' ? (
            // "All Cards" Legend
            <>
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2 w-4 rounded-sm"
                  style={{ backgroundColor: spendColor }} // [Updated]
                />
                <span>Total Spend</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2 w-4 rounded-sm"
                  style={{ backgroundColor: cashbackColor }} // [Updated]
                />
                <span>Total Cashback</span>
              </div>
            </>
          ) : (
            // Single Card Legend
            <>
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2 w-4 rounded-sm"
                  style={{ backgroundColor: spendColor }} // [Updated]
                />
                <span>Spend</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2 w-4 rounded-sm"
                  style={{ backgroundColor: cashbackColor }} // [Updated]
                />
                <span>Cashback</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const spendColor = '#f59e0b'; // amber-500
const cashbackColor = '#3b82f6'; // blue-600

const CustomTooltip = ({ active, payload, label, currencyFn }) => {
  if (active && payload?.length) {
    const spend = payload.find(p => p.dataKey === 'spend')?.value;
    const cashback = payload.find(p => p.dataKey === 'cashback')?.value;

    return (
      <div className="rounded-lg bg-gray-900 p-3 text-sm shadow-xl transition-all">
        <p className="font-bold text-white mb-2">{label}</p>
        <div className="space-y-1">
            {spend !== undefined && (
                <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Spend:</span>
                    <span className="font-medium text-right" style={{ color: spendColor }}>
                        {currencyFn(spend)}
                    </span>
                </div>
            )}
            {cashback !== undefined && (
                <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Cashback:</span>
                    <span className="font-medium text-right" style={{ color: cashbackColor }}>
                        {currencyFn(cashback)}
                    </span>
                </div>
            )}
        </div>
      </div>
    );
  }
  return null;
};

export default function CombinedCardStatsChart({ data, currencyFn, isLiveView, period, onPeriodChange }) {

  // Sort data by spend (highest to lowest) for better readability
  const sortedData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return [...data].sort((a, b) => b.spend - a.spend);
  }, [data]);

  // Dynamic height based on number of cards to ensure bars don't squish on mobile
  const chartHeight = Math.max(300, sortedData.length * 60 + 80);

  return (
    <Card className="flex flex-col w-full overflow-hidden">
      <CardHeader className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between pb-2">
        <CardTitle>Spending & Cashback</CardTitle>
        {isLiveView && (
            <Select value={period} onValueChange={onPeriodChange}>
                <SelectTrigger className="w-1/2 sm:w-[120px] h-8 text-xs">
                    <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="12M">12M</SelectItem>
                    <SelectItem value="6M">6M</SelectItem>
                    <SelectItem value="1M">1M</SelectItem>
                    <SelectItem value="LM">LM</SelectItem>
                    <SelectItem value="1W">1W</SelectItem>
                </SelectContent>
            </Select>
        )}
      </CardHeader>
      <CardContent className="px-0 sm:px-6 flex-grow">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={sortedData}
            layout="vertical" // Horizontal bars
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            barGap={2}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />

            <YAxis
              type="category"
              dataKey="name"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={90}
              tickFormatter={(label) => label.length > 12 ? `${label.substring(0, 11)}...` : label}
            />

            {/* X Axis for Spend (Top) */}
            <XAxis
              xAxisId="spend"
              type="number"
              orientation="top"
              stroke={spendColor}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
            />

            {/* X Axis for Cashback (Bottom) */}
            <XAxis
              xAxisId="cashback"
              type="number"
              orientation="bottom"
              stroke={cashbackColor}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />

            <RechartsTooltip
              content={<CustomTooltip currencyFn={currencyFn} />}
              cursor={{ fill: 'rgba(0,0,0,0.05)' }}
            />

            <Legend
              verticalAlign="top"
              align="center"
              wrapperStyle={{ paddingBottom: '20px' }}
              iconType="circle"
              formatter={(value) => <span className="capitalize text-muted-foreground text-xs ml-1 font-medium">{value}</span>}
            />

            <Bar
              xAxisId="spend"
              dataKey="spend"
              name="Spend"
              fill={spendColor}
              radius={[0, 4, 4, 0]}
              barSize={16}
            />
            <Bar
              xAxisId="cashback"
              dataKey="cashback"
              name="Cashback"
              fill={cashbackColor}
              radius={[0, 4, 4, 0]}
              barSize={16}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
import { Skeleton } from "../ui/skeleton";

export default function AppSkeleton() {
  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="h-8 w-24" />
      </header>

      <div className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Skeleton className="h-64 rounded-lg" />
            <Skeleton className="h-64 rounded-lg" />
          </div>
        </div>
      </div>

      <footer className="p-4 border-t">
        <div className="flex justify-center">
          <Skeleton className="h-10 w-full max-w-md rounded-full" />
        </div>
      </footer>
    </div>
  );
}
import React from "react";
import { Loader2 } from "lucide-react";
import { Checkbox } from "../ui/checkbox";
import { cn } from "../../lib/utils";
import { formatTransactionDate } from "../../lib/date";
import MethodIndicator from "./MethodIndicator";

const MobileTransactionItem = React.memo(({
    transaction,
    isSelected,
    onSelect,
    onClick,
    cardMap,
    currencyFn,
    isDeleting,
    isUpdating
}) => {
    const tx = transaction;
    const card = tx['Card'] ? cardMap.get(tx['Card'][0]) : null;
    const effectiveDate = tx['billingDate'] || tx['Transaction Date'];
    const isProcessing = isDeleting || isUpdating;

    return (
        <div
            className={cn(
                "relative flex items-center gap-3 p-3 bg-white dark:bg-slate-950 rounded-xl shadow-sm border transition-all cursor-pointer",
                isSelected
                    ? "border-blue-500 bg-blue-50/30 dark:bg-blue-900/20 ring-1 ring-blue-500/20"
                    : "border-slate-100 hover:border-slate-200 dark:border-slate-800",
                isProcessing && "opacity-60 pointer-events-none"
            )}
            onClick={() => !isProcessing && onClick && onClick(tx)}
        >
            {isProcessing && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/20 dark:bg-black/20 backdrop-blur-[1px] rounded-xl">
                    <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
                </div>
            )}
            {/* Checkbox Area */}
            <div className="shrink-0" onClick={(e) => { e.stopPropagation(); onSelect && onSelect(tx.id, !isSelected); }}>
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onSelect && onSelect(tx.id, !isSelected)}
                    aria-label={`Select ${tx['Transaction Name']}`}
                    className={cn("h-5 w-5 rounded border data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 bg-white border-slate-300")}
                />
            </div>

            {/* Main Content */}
            <div
                className="flex-1 min-w-0 flex flex-col gap-1.5 outline-none rounded-md focus-visible:ring-2 focus-visible:ring-blue-500 -m-1 p-1"
                tabIndex={0}
                role="button"
                aria-label={`View details for ${tx['Transaction Name']}, ${currencyFn(tx['Amount'])}`}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        onClick && onClick(tx);
                    }
                }}
            >
                {/* Top Row: Name & Amount */}
                <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <MethodIndicator method={tx['Method']} />
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate leading-tight">
                            {tx['Transaction Name']}
                        </h4>
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap leading-tight">
                        {currencyFn(tx['Amount'])}
                    </span>
                </div>

                {/* Bottom Row: Metadata & Cashback */}
                <div className="flex justify-between items-start">
                    {/* Left: Date • Card */}
                    <div className="flex flex-col gap-0.5 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        <div className="flex items-center gap-1.5">
                            <span>{formatTransactionDate(effectiveDate)}</span>
                            <span className="w-0.5 h-0.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                            <span className="truncate max-w-[90px] text-slate-600 dark:text-slate-300">{card ? card.name : 'Unknown'}</span>
                        </div>
                        {tx['Category'] && <span className="text-slate-400 dark:text-slate-500">{tx['Category']}</span>}
                    </div>

                    {/* Right: Cashback & Rate */}
                    <div className="flex flex-col items-end gap-0.5">
                        <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-[4px] border border-emerald-100 dark:border-emerald-900">
                            <span className="text-[10px] font-bold">+{currencyFn(tx.estCashback)}</span>
                        </div>
                        {tx.rate > 0 && (
                            <span className="text-[9px] font-medium text-emerald-600/80 dark:text-emerald-500/80">
                                {(tx.rate * 100).toFixed(1)}% Rate
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

export default MobileTransactionItem;
import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Trash2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SyncQueueSheet({ isOpen, onOpenChange, queue, onRetry, onRemove, isSyncing }) {
    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col h-full">
                <SheetHeader className="p-6 border-b">
                    <div className="flex items-center justify-between">
                        <SheetTitle>Sync Queue</SheetTitle>
                        {isSyncing && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    </div>
                    <SheetDescription>
                        Transactions waiting to be saved to the database.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-0">
                    {queue.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                            <p>All caught up!</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Transaction</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {queue.map((tx) => (
                                    <TableRow key={tx.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{tx['Transaction Name'] || tx.merchant}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {tx['Transaction Date'] || tx.date} • {tx['Amount'] || tx.amount}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={tx.status === 'error' ? 'destructive' : 'secondary'}
                                                className={cn("flex w-fit items-center gap-1", tx.status === 'pending' && "animate-pulse")}
                                            >
                                                {tx.status === 'error' && <AlertCircle className="h-3 w-3" />}
                                                {tx.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {tx.status === 'error' && (
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600" onClick={() => onRetry(tx.id)}>
                                                        <RefreshCw className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => onRemove(tx.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
import React, { useState, useMemo, useEffect } from 'react';
import { Loader2, Trash2, MoreVertical, Search, X, ArrowUpDown, ChevronDown, Layers } from 'lucide-react';
import mccData from '@/lib/MCC.json';
import useMediaQuery from '@/hooks/useMediaQuery';
import { formatDateTime, formatDate } from '@/lib/date';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import MobileTransactionItem from './MobileTransactionItem';
import TransactionDetailSheet from './TransactionDetailSheet';

// Helper function to get MCC description
const getMccDescription = (mcc) => {
    return mccData.mccDescriptionMap[mcc]?.vn || 'N/A';
};

const formatTxDate = (dateStr) => {
    if (!dateStr) return '';
    return dateStr.includes('T') ? formatDateTime(dateStr) : formatDate(dateStr);
};

export default function SharedTransactionsDialog({
    isOpen,
    onClose,
    transactions,
    title,
    description,
    currencyFn,
    isLoading,
    onEdit,
    onDuplicate,
    onDelete,
    onBulkDelete,
    cardMap,
    // New props for the embedded sheet
    rules,
    allCards,
    monthlyCategorySummary
}) {
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [isSelectionActive, setIsSelectionActive] = useState(false);
    const [viewingTransaction, setViewingTransaction] = useState(null);

    // Filtering and Sorting State
    const [searchTerm, setSearchTerm] = useState("");
    const [groupBy, setGroupBy] = useState("none");
    const [sortByValue, setSortByValue] = useState('Newest');
    const [sortConfig, setSortConfig] = useState({ key: 'Transaction Date', direction: 'descending' });

    const [visibleColumns, setVisibleColumns] = useState({
        'Date': true,
        'Transaction Name': true,
        'Merchant': false,
        'Amount': true,
        'Estimated Cashback': true,
        'Card Name': false,
        'Category': false,
        'Applicable Rule': false,
        'MCC Code': false,
        'Notes': false,
        'Cashback Rate': false,
    });

    // Clear selections when the dialog is closed or transactions change
    useEffect(() => {
        if (!isOpen) {
            setSelectedRows(new Set());
            setIsSelectionActive(false);
            setViewingTransaction(null);
            setSearchTerm("");
            setGroupBy("none");
            setSortByValue("Newest");
            setSortConfig({ key: 'Transaction Date', direction: 'descending' });
        }
    }, [isOpen, transactions]);

    const handleSortChange = (val) => {
        setSortByValue(val);
        if (val === 'Newest') setSortConfig({ key: 'Transaction Date', direction: 'descending' });
        else if (val === 'Oldest') setSortConfig({ key: 'Transaction Date', direction: 'ascending' });
        else if (val === 'Amount: High') setSortConfig({ key: 'Amount', direction: 'descending' });
        else if (val === 'Amount: Low') setSortConfig({ key: 'Amount', direction: 'ascending' });
    };

    const filteredAndSortedData = useMemo(() => {
        let items = [...transactions].map(tx => ({
            ...tx,
            effectiveDate: tx['billingDate'] || tx['Transaction Date'],
            rate: (tx['Amount'] && tx['Amount'] > 0) ? (tx.estCashback / tx['Amount']) : 0
        }));

        // Filter
        items = items.filter(tx => {
            if (!searchTerm) return true;
            const lowerCaseSearch = searchTerm.toLowerCase();
            return (
                tx['Transaction Name']?.toLowerCase().includes(lowerCaseSearch) ||
                tx['merchantLookup']?.toLowerCase().includes(lowerCaseSearch) ||
                String(tx['Amount']).includes(lowerCaseSearch) ||
                tx['Transaction Date']?.includes(lowerCaseSearch) ||
                String(tx['MCC Code']).includes(lowerCaseSearch)
            );
        });

        // Sort
        if (sortConfig.key !== null) {
            items.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;
                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
                }
                if (sortConfig.key === 'Transaction Date') {
                    return sortConfig.direction === 'ascending'
                        ? new Date(a.effectiveDate) - new Date(b.effectiveDate)
                        : new Date(b.effectiveDate) - new Date(a.effectiveDate);
                }
                return sortConfig.direction === 'ascending'
                    ? String(aValue).localeCompare(String(bValue))
                    : String(bValue).localeCompare(String(aValue));
            });
        }
        return items;
    }, [transactions, searchTerm, sortConfig]);

    const groupedData = useMemo(() => {
        if (groupBy === 'none') {
            return { 'All Transactions': filteredAndSortedData };
        }

        const groups = {};
        filteredAndSortedData.forEach(tx => {
            let key = 'Other';
            if (groupBy === 'card') {
                const cardId = tx['Card'] && tx['Card'][0];
                const card = cardMap.get(cardId);
                key = card ? card.name : 'Unknown Card';
            } else if (groupBy === 'category') {
                key = tx['Category'] || 'Uncategorized';
            } else if (groupBy === 'date') {
                key = tx.effectiveDate || 'No Date';
            }

            if (!groups[key]) groups[key] = [];
            groups[key].push(tx);
        });

        return Object.keys(groups).sort((a, b) => {
             if (groupBy === 'date') return new Date(b) - new Date(a);
             return a.localeCompare(b);
        }).reduce((obj, key) => {
            obj[key] = groups[key];
            return obj;
        }, {});
    }, [filteredAndSortedData, groupBy, cardMap]);

    const handleSelectAll = (checked) => {
        if (checked) {
            const allIds = new Set(filteredAndSortedData.map(t => t.id));
            setSelectedRows(allIds);
            setIsSelectionActive(true);
        } else {
            setSelectedRows(new Set());
            setIsSelectionActive(false);
        }
    };

    const handleSelectRow = (id, checked) => {
        const newSelectedRows = new Set(selectedRows);
        if (checked) {
            newSelectedRows.add(id);
        } else {
            newSelectedRows.delete(id);
        }
        setSelectedRows(newSelectedRows);

        if (newSelectedRows.size > 0) {
            setIsSelectionActive(true);
        } else {
            setIsSelectionActive(false);
        }
    };

    // Calculate totals for ALL filtered transactions (for the table footer)
    const totals = useMemo(() => {
        return filteredAndSortedData.reduce((acc, t) => {
            acc.amount += t['Amount'] || 0;
            acc.cashback += t.estCashback || 0;
            return acc;
        }, { amount: 0, cashback: 0 });
    }, [filteredAndSortedData]);

    // Calculate totals for SELECTED transactions (for the bulk action bar)
    const selectedTotals = useMemo(() => {
        return transactions // Use original list to ensure we can select items even if filtered out visually, or restrict to filtered? Usually bulk action applies to selected ID regardless of view.
            .filter(t => selectedRows.has(t.id))
            .reduce((acc, t) => {
                acc.amount += t['Amount'] || 0;
                acc.cashback += t.estCashback || 0;
                return acc;
            }, { amount: 0, cashback: 0 });
    }, [transactions, selectedRows]);

    const isAllSelected = filteredAndSortedData.length > 0 && selectedRows.size === filteredAndSortedData.length;

    const handleDeleteSelected = () => {
        if (onBulkDelete) {
            onBulkDelete(Array.from(selectedRows));
        }
        setSelectedRows(new Set());
        setIsSelectionActive(false);
    };

    const renderMobileFilters = () => {
        return (
            <div className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm px-4 py-3 shadow-sm border-b border-slate-100/50 dark:border-slate-800/50 -mx-6 mb-2">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide px-2 py-1 select-none no-scrollbar">
                    {/* Search */}
                    <div className="relative flex items-center min-w-[140px]">
                        <Search className="absolute left-3 w-3.5 h-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-[30px] pl-8 pr-3 bg-slate-100 dark:bg-slate-900 rounded-full text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-500 transition-all border-none"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-2 p-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500">
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                     {/* Group By Pill */}
                     <Select value={groupBy} onValueChange={setGroupBy}>
                        <SelectTrigger className="h-[30px] w-auto border-0 p-0 bg-transparent shadow-none focus:ring-0 [&>span]:hidden [&>svg]:hidden">
                            <div className={cn(
                                "flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all border cursor-pointer",
                                groupBy !== 'none'
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm dark:bg-slate-100 dark:text-slate-900'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800'
                            )}>
                                <Layers className="w-3.5 h-3.5" />
                                <span>Group</span>
                                {groupBy !== 'none' && (
                                    <>
                                        <span className="opacity-60">|</span>
                                        <span className="font-semibold max-w-[80px] truncate">{groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}</span>
                                    </>
                                )}
                                <ChevronDown className={cn("w-3 h-3 opacity-50", groupBy !== 'none' ? 'text-white dark:text-slate-900' : '')} />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">No Grouping</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                            <SelectItem value="category">Category</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Sort Pill */}
                    <Select value={sortByValue} onValueChange={handleSortChange}>
                        <SelectTrigger className="h-[30px] w-auto border-0 p-0 bg-transparent shadow-none focus:ring-0 [&>span]:hidden [&>svg]:hidden">
                            <div className={cn(
                                "flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all border cursor-pointer",
                                sortByValue !== 'Newest' && sortByValue !== 'Custom'
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm dark:bg-slate-100 dark:text-slate-900'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800'
                            )}>
                                <ArrowUpDown className="w-3.5 h-3.5" />
                                <span>Sort</span>
                                {sortByValue !== 'Newest' && sortByValue !== 'Custom' && (
                                    <>
                                        <span className="opacity-60">|</span>
                                        <span className="font-semibold max-w-[80px] truncate">{sortByValue}</span>
                                    </>
                                )}
                                <ChevronDown className={cn("w-3 h-3 opacity-50", sortByValue !== 'Newest' && sortByValue !== 'Custom' ? 'text-white dark:text-slate-900' : '')} />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Newest">Newest</SelectItem>
                            <SelectItem value="Oldest">Oldest</SelectItem>
                            <SelectItem value="Amount: High">Amount: High</SelectItem>
                            <SelectItem value="Amount: Low">Amount: Low</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        );
    }

    const renderBulkBar = () => (
        <div className="fixed bottom-4 left-4 right-4 z-50 shadow-xl rounded-xl flex flex-col items-start gap-2 p-3 bg-slate-900 text-white animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 pl-1 w-full">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-white shrink-0" onClick={() => setSelectedRows(new Set())}>
                    <X className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium whitespace-nowrap">{selectedRows.size} Selected</span>
                <div className="flex-1" />
                <div className="flex items-center gap-3 text-xs text-slate-300">
                     <span className="whitespace-nowrap">Total: <span className="text-white font-medium">{currencyFn(selectedTotals.amount)}</span></span>
                </div>
            </div>
            <div className="flex items-center gap-2 w-full justify-between pl-1 pr-1">
                 <span className="text-xs text-slate-300 whitespace-nowrap">Cashback: <span className="text-emerald-400 font-medium">{currencyFn(selectedTotals.cashback)}</span></span>
                <Button variant="destructive" size="sm" onClick={handleDeleteSelected} className="h-8 text-xs">
                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                </Button>
            </div>
        </div>
    );

    const renderContent = () => (
        <>
            {/* --- DESKTOP ACTION BAR (HIDDEN ON MOBILE) --- */}
            <div className="hidden md:flex items-center justify-between px-6 pb-4">

                {/* Bulk Actions with Summaries */}
                {isSelectionActive && selectedRows.size > 0 ? (
                    <div className="flex flex-1 items-center justify-between p-2 bg-slate-100 dark:bg-slate-800 rounded-md mr-2">
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-semibold">{selectedRows.size} selected</span>

                            <div className="hidden sm:flex items-center gap-3 border-l border-slate-300 dark:border-slate-600 pl-3">
                                <span className="text-xs text-muted-foreground">
                                    Total: <span className="font-semibold text-foreground">{currencyFn(selectedTotals.amount)}</span>
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    Cashback: <span className="font-semibold text-emerald-600">{currencyFn(selectedTotals.cashback)}</span>
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleSelectAll(false)}>Cancel</Button>
                            {onBulkDelete && (
                                <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div />
                )}

                {/* Columns Button */}
                <div className="hidden md:flex">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <MoreVertical className="h-4 w-4 mr-2" />
                                Columns
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {Object.keys(visibleColumns).map((column) => (
                                <DropdownMenuItem key={column}>
                                    <Checkbox
                                        checked={visibleColumns[column]}
                                        onCheckedChange={() =>
                                            setVisibleColumns({
                                                ...visibleColumns,
                                                [column]: !visibleColumns[column],
                                            })
                                        }
                                        className="mr-2"
                                    />
                                    {column}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6 pt-0">
                    {/* Mobile Header (Filters) - Rendered INSIDE scroll area but sticky */}
                    <div className="md:hidden">
                    {renderMobileFilters()}
                    </div>

                    {/* Mobile Bulk Bar - Rendered OUTSIDE normal flow but fixed via CSS */}
                    <div className="md:hidden">
                    {selectedRows.size > 0 && renderBulkBar()}
                    </div>

                {isLoading ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : filteredAndSortedData.length > 0 ? (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="p-2 w-10">
                                            <Checkbox
                                                checked={isAllSelected}
                                                onCheckedChange={handleSelectAll}
                                            />
                                        </th>
                                        {visibleColumns['Date'] && <th className="text-left p-2">Date</th>}
                                        {visibleColumns['Transaction Name'] && <th className="text-left p-2">Transaction</th>}
                                        {visibleColumns['Merchant'] && <th className="text-left p-2">Merchant</th>}
                                        {visibleColumns['Amount'] && <th className="text-right p-2">Amount</th>}
                                        {visibleColumns['Estimated Cashback'] && <th className="text-right p-2">Cashback</th>}
                                        {visibleColumns['Card Name'] && <th className="text-left p-2">Card</th>}
                                        {visibleColumns['Category'] && <th className="text-left p-2">Category</th>}
                                        {visibleColumns['Applicable Rule'] && <th className="text-left p-2">Rule</th>}
                                        {visibleColumns['MCC Code'] && <th className="text-left p-2">MCC</th>}
                                        {visibleColumns['Notes'] && <th className="text-left p-2">Notes</th>}
                                        {visibleColumns['Cashback Rate'] && <th className="text-right p-2">Rate</th>}
                                        <th className="text-center p-2 w-12">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAndSortedData.map(t => {
                                        const card = t['Card'] ? cardMap?.get(t['Card'][0]) : null;

                                        return (
                                            <tr key={t.id} className="border-b">
                                                <td className="p-2">
                                                    <Checkbox
                                                        checked={selectedRows.has(t.id)}
                                                        onCheckedChange={(checked) => handleSelectRow(t.id, checked)}
                                                    />
                                                </td>
                                                {visibleColumns['Date'] && <td className="p-2">{formatTxDate(t.effectiveDate)}</td>}
                                                {visibleColumns['Transaction Name'] && <td className="p-2">{t['Transaction Name']}</td>}

                                                {visibleColumns['Merchant'] && (
                                                    <td className="p-2 text-slate-500">{t.merchantLookup || ''}</td>
                                                )}

                                                {visibleColumns['Amount'] && <td className="text-right p-2">{currencyFn(t['Amount'])}</td>}

                                                {visibleColumns['Estimated Cashback'] && (
                                                    <td className="text-right p-2 text-emerald-600 font-medium">
                                                        {currencyFn(t.estCashback)}
                                                    </td>
                                                )}

                                                {visibleColumns['Card Name'] && <td className="p-2">{card ? card.name : ''}</td>}

                                                {visibleColumns['Category'] && <td className="p-2">{t['Category'] || ''}</td>}

                                                {visibleColumns['Applicable Rule'] && (
                                                    <td className="p-2 text-xs font-mono text-slate-500">
                                                        {t['Applicable Rule']?.length > 0 ? t['Applicable Rule'][0].slice(0, 8) + '...' : ''}
                                                    </td>
                                                )}

                                                {visibleColumns['MCC Code'] && (
                                                    <td className="p-2">
                                                        {t['MCC Code'] ? `${t['MCC Code']} - ${getMccDescription(t['MCC Code'])}` : ''}
                                                    </td>
                                                )}

                                                {visibleColumns['Notes'] && <td className="p-2">{t['Notes'] || ''}</td>}

                                                {visibleColumns['Cashback Rate'] && (
                                                    <td className="text-right p-2">
                                                        {(t.estCashback && t['Amount']) ? (t.estCashback / t['Amount'] * 100).toFixed(1) + '%' : ''}
                                                    </td>
                                                )}

                                                <td className="text-center p-2">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            {onEdit && <DropdownMenuItem onClick={() => onEdit(t)}>Edit</DropdownMenuItem>}
                                                            <DropdownMenuItem onClick={() => setViewingTransaction(t)}>View Details</DropdownMenuItem>
                                                            {onDelete && <DropdownMenuItem onClick={() => onDelete(t.id, t['Transaction Name'])} className="text-destructive">Delete</DropdownMenuItem>}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>

                                <tfoot>
                                    <tr className="border-t-2 font-semibold bg-slate-50/50">
                                        <td className="p-2"></td>
                                        {visibleColumns['Date'] && <td className="p-2"></td>}

                                        {/* Logic to place 'Total' label correctly */}
                                        {visibleColumns['Transaction Name'] && (
                                            <td className="p-2 text-right text-slate-500">Total</td>
                                        )}
                                        {visibleColumns['Merchant'] && !visibleColumns['Transaction Name'] && (
                                            <td className="p-2 text-right text-slate-500">Total</td>
                                        )}
                                        {visibleColumns['Merchant'] && visibleColumns['Transaction Name'] && <td className="p-2"></td>}


                                        {visibleColumns['Amount'] && (
                                            <td className="p-2 text-right">{currencyFn(totals.amount)}</td>
                                        )}

                                        {visibleColumns['Estimated Cashback'] && (
                                            <td className="p-2 text-right text-emerald-600 font-bold">{currencyFn(totals.cashback)}</td>
                                        )}

                                        {visibleColumns['Card Name'] && <td className="p-2"></td>}
                                        {visibleColumns['Category'] && <td className="p-2"></td>}
                                        {visibleColumns['Applicable Rule'] && <td className="p-2"></td>}
                                        {visibleColumns['MCC Code'] && <td className="p-2"></td>}
                                        {visibleColumns['Notes'] && <td className="p-2"></td>}
                                        {visibleColumns['Cashback Rate'] && <td className="p-2"></td>}

                                        <td className="p-2"></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Mobile List View */}
                        <div className="md:hidden space-y-2.5 pb-20">
                                {/* Select All Row */}
                            {filteredAndSortedData.length > 0 && (
                                <div className="flex items-center justify-between px-2 pt-1 pb-1">
                                    <div className="flex items-center gap-2 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleSelectAll(selectedRows.size !== filteredAndSortedData.length); }}>
                                        <Checkbox
                                            checked={selectedRows.size > 0 && selectedRows.size === filteredAndSortedData.length}
                                            onCheckedChange={handleSelectAll}
                                            className={cn("h-5 w-5 rounded border data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 bg-white border-slate-300")}
                                        />
                                        <span className="text-xs font-medium text-slate-500">Select All</span>
                                    </div>
                                    <span className="text-[10px] text-slate-400">{filteredAndSortedData.length} items</span>
                                </div>
                            )}

                            {/* Grouped List Logic */}
                            {(() => {
                                const flatList = [];
                                Object.entries(groupedData).forEach(([key, items]) => {
                                    if (groupBy !== 'none') flatList.push({ type: 'header', title: key, count: items.length });
                                    flatList.push(...items.map(i => ({ type: 'item', ...i })));
                                });

                                return flatList.map((item, index) => {
                                        if (item.type === 'header') {
                                        return (
                                            <div key={`header-${index}`} className="pt-2 pb-1 px-1">
                                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{item.title} ({item.count})</span>
                                            </div>
                                        );
                                    }

                                    // Item
                                    const tx = item;
                                    return (
                                        <MobileTransactionItem
                                            key={tx.id}
                                            transaction={tx}
                                            currencyFn={currencyFn}
                                            isSelected={selectedRows.has(tx.id)}
                                            onSelect={handleSelectRow}
                                            onClick={() => setViewingTransaction(tx)}
                                            cardMap={cardMap}
                                        />
                                    );
                                });
                            })()}
                        </div>
                    </>
                ) : (
                    <div className="flex justify-center items-center h-48">
                        <p className="text-muted-foreground">No transactions found.</p>
                    </div>
                )}
            </div>
        </>
    );

    if (isDesktop) {
        return (
            <>
                <Dialog open={isOpen} onOpenChange={onClose}>
                    <DialogContent
                        className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0"
                        onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                        <DialogHeader className="p-6 pb-2">
                            <DialogTitle>{title}</DialogTitle>
                            <DialogDescription>
                                {description}
                            </DialogDescription>
                        </DialogHeader>
                        {renderContent()}
                    </DialogContent>
                </Dialog>

                {/* Embedded Transaction Detail Sheet */}
                <TransactionDetailSheet
                    transaction={viewingTransaction}
                    isOpen={!!viewingTransaction}
                    onClose={() => setViewingTransaction(null)}
                    onEdit={(t) => {
                        setViewingTransaction(null);
                        if (onEdit) onEdit(t);
                    }}
                    onDuplicate={onDuplicate}
                    onDelete={(id, name) => {
                        setViewingTransaction(null);
                        if (onDelete) onDelete(id, name);
                    }}
                    currencyFn={currencyFn}
                    allCards={allCards}
                    rules={rules}
                    monthlyCategorySummary={monthlyCategorySummary}
                />
            </>
        );
    }

    return (
        <>
            <Drawer open={isOpen} onOpenChange={onClose}>
                <DrawerContent
                    className="max-h-[90vh] flex flex-col p-0 gap-0"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <DrawerHeader className="p-6 pb-2 text-left">
                        <DrawerTitle>{title}</DrawerTitle>
                        <DrawerDescription>
                            {description}
                        </DrawerDescription>
                    </DrawerHeader>
                    {renderContent()}
                </DrawerContent>
            </Drawer>

            {/* Embedded Transaction Detail Sheet */}
            <TransactionDetailSheet
                transaction={viewingTransaction}
                isOpen={!!viewingTransaction}
                onClose={() => setViewingTransaction(null)}
                onEdit={(t) => {
                    setViewingTransaction(null);
                    if (onEdit) onEdit(t);
                }}
                onDuplicate={onDuplicate}
                onDelete={(id, name) => {
                    setViewingTransaction(null);
                    if (onDelete) onDelete(id, name);
                }}
                currencyFn={currencyFn}
                allCards={allCards}
                rules={rules}
                monthlyCategorySummary={monthlyCategorySummary}
            />
        </>
    );
}
import React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { cn } from "../../lib/utils";

const MethodIndicator = ({ method }) => {
    let colorClass = "bg-slate-300 dark:bg-slate-600";
    let label = "Not Defined";

    if (method === 'POS') {
        colorClass = "bg-blue-500";
        label = "POS";
    } else if (method === 'eCom') {
        colorClass = "bg-emerald-500";
        label = "eCom";
    } else if (method === 'International') {
        colorClass = "bg-orange-500";
        label = "International";
    } else if (method) {
        label = method;
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className={cn("h-2.5 w-2.5 rounded-full shrink-0 cursor-help transition-colors", colorClass)} aria-label={label} />
            </TooltipTrigger>
            <TooltipContent>
                <p>{label}</p>
            </TooltipContent>
        </Tooltip>
    );
};

export default MethodIndicator;
import React from 'react';
import { LayoutDashboard, ArrowLeftRight, CreditCard, Banknote, ChevronsLeft, ChevronsRight, Search, RefreshCw, LogOut, DollarSign, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { cn } from '../../lib/utils';
import { ModeToggle } from '../dashboard/header/ThemeToggle';

const navItems = [
  { view: 'overview', icon: LayoutDashboard, label: 'Overview' },
  { view: 'transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { view: 'cards', icon: CreditCard, label: 'My Cards' },
  { view: 'cashback', icon: DollarSign, label: 'Cashback' },
  { view: 'payments', icon: Banknote, label: 'Payments' },
  { view: 'settings', icon: Settings, label: 'Settings' },
];

const NavLink = ({ item, isCollapsed, activeView, handleLinkClick }) => (
  <TooltipProvider delayDuration={0}>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={activeView === item.view ? 'default' : 'ghost'}
          className={cn('w-full justify-start h-10', isCollapsed && 'justify-center')}
          onClick={() => handleLinkClick(item.view)}
        >
          <item.icon className={cn('h-5 w-5', !isCollapsed && 'mr-3')} />
          <span className={cn(isCollapsed && 'sr-only')}>{item.label}</span>
        </Button>
      </TooltipTrigger>
      {isCollapsed && (
        <TooltipContent side="right">
          <p>{item.label}</p>
        </TooltipContent>
      )}
    </Tooltip>
  </TooltipProvider>
);

const AppSidebar = ({
  activeView,
  setActiveView,
  isCollapsed,
  setIsCollapsed,
  handleLogout,
  refreshData,
  openFinder
}) => {

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const handleLinkClick = (view) => {
    setActiveView(view);
  };

  return (
        <aside
            className={cn(
                'hidden md:flex flex-col h-screen bg-background border-r transition-all duration-300 ease-in-out fixed top-0 left-0 z-40',
                isCollapsed ? 'w-16' : 'w-56'
            )}
        >
            <div className="flex items-center justify-center h-16 border-b">
                <img src="/favicon.svg" alt="Cardifier" className="h-8 w-8" />
            </div>
            <nav className="flex-1 p-2 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.view}
                        item={item}
                        isCollapsed={isCollapsed}
                        activeView={activeView}
                        handleLinkClick={handleLinkClick}
                    />
                ))}
            </nav>
            <div className="mt-auto flex flex-col items-center gap-2 p-2 border-t">
                <div className="w-full space-y-2">
                    <TooltipProvider delayDuration={0}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" className={cn('w-full justify-start h-10', isCollapsed && 'justify-center')} onClick={openFinder}>
                                    <Search className={cn('h-5 w-5', !isCollapsed && 'mr-3')} />
                                    <span className={cn(isCollapsed && 'sr-only')}>Card Finder</span>
                                </Button>
                            </TooltipTrigger>
                            {isCollapsed && (
                                <TooltipContent side="right">
                                    <p>Card Finder</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider delayDuration={0}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" className={cn('w-full justify-start h-10', isCollapsed && 'justify-center')} onClick={() => refreshData(false)}>
                                    <RefreshCw className={cn('h-5 w-5', !isCollapsed && 'mr-3')} />
                                    <span className={cn(isCollapsed && 'sr-only')}>Refresh</span>
                                </Button>
                            </TooltipTrigger>
                            {isCollapsed && (
                                <TooltipContent side="right">
                                    <p>Refresh</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </TooltipProvider>
                    <ModeToggle isCollapsed={isCollapsed} />
                </div>
                <div className="w-full pt-2 mt-2 border-t">
                    <TooltipProvider delayDuration={0}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" className={cn('w-full justify-start h-10', isCollapsed && 'justify-center')} onClick={handleLogout}>
                                    <LogOut className={cn('h-5 w-5', !isCollapsed && 'mr-3')} />
                                    <span className={cn(isCollapsed && 'sr-only')}>Logout</span>
                                </Button>
                            </TooltipTrigger>
                            {isCollapsed && (
                                <TooltipContent side="right">
                                    <p>Logout</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <div className="p-2 border-t">
                    <Button variant="ghost" size="icon" className="w-full" onClick={toggleSidebar}>
                        {isCollapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
                    </Button>
                </div>
            </div>
        </aside>
    );
};

export default AppSidebar;
import React, { useMemo, useState, useEffect } from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "../ui/sheet";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
} from "../ui/drawer";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
    Calendar,
    Clock,
    CreditCard,
    Tag,
    Store,
    Layers,
    FileText,
    Receipt,
    Globe,
    AlertCircle,
    CheckCircle2,
    Percent,
    ArrowLeft
} from "lucide-react";
import { Checkbox } from "../ui/checkbox";
import { cn } from "../../lib/utils";
import { formatFullDateTime } from "../../lib/date";
import mccData from '../../lib/MCC.json';
import useMediaQuery from "../../hooks/useMediaQuery";

export default function TransactionDetailSheet({
    transaction,
    isOpen,
    onClose,
    onEdit,
    onDuplicate,
    onDelete,
    currencyFn,
    allCards,
    rules,
    monthlyCategorySummary
}) {
    const isDesktop = useMediaQuery("(min-width: 768px)");

    // 1. Maintain local copy of data to persist during closing animation
    const [displayTransaction, setDisplayTransaction] = useState(transaction);

    useEffect(() => {
        if (transaction) {
            setDisplayTransaction(transaction);
        }
    }, [transaction]);

    // Use displayTransaction for rendering
    const currentTransaction = displayTransaction;

    // Currency helper
    const currency = currencyFn || ((n) => (n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }));

    // Data Parsing
    const {
        cleanNotes,
        discounts,
        fees,
        totalDiscounts,
        totalFees
    } = useMemo(() => {
        if (!currentTransaction?.notes) return { cleanNotes: '', discounts: [], fees: [], totalDiscounts: 0, totalFees: 0 };

        let noteText = currentTransaction.notes;
        let discountData = [];
        let feeData = [];

        // Parse Discounts
        const discountMatch = noteText.match(/Discounts: (\[.*\])/);
        if (discountMatch) {
            try {
                discountData = JSON.parse(discountMatch[1]);
                noteText = noteText.replace(discountMatch[0], '');
            } catch (e) {
                console.error("Failed to parse discounts", e);
            }
        }

        // Parse Fees
        const feeMatch = noteText.match(/Fees: (\[.*\])/);
        if (feeMatch) {
            try {
                feeData = JSON.parse(feeMatch[1]);
                noteText = noteText.replace(feeMatch[0], '');
            } catch (e) {
                console.error("Failed to parse fees", e);
            }
        }

        const calculatedDiscounts = discountData.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
        const calculatedFees = feeData.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

        return {
            cleanNotes: noteText.trim(),
            discounts: discountData,
            fees: feeData,
            totalDiscounts: calculatedDiscounts,
            totalFees: calculatedFees
        };
    }, [currentTransaction]);

    // Only return null if we have NEVER had a transaction (initial state)
    if (!currentTransaction) return null;

    // Status logic
    const isCompleted = true; // Placeholder for now
    const statusColor = isCompleted ? "bg-emerald-100 text-emerald-800" : "bg-yellow-100 text-yellow-800";
    const statusText = isCompleted ? "Completed" : "Pending";

    // Data Resolution
    const cardId = currentTransaction['Card'] && currentTransaction['Card'][0];
    const cardName = currentTransaction['Card Name'] || (allCards && allCards.find(c => c.id === cardId)?.name) || "Unknown Card";

    const ruleId = currentTransaction['Applicable Rule'] && currentTransaction['Applicable Rule'][0];
    const ruleName = (rules && rules.find(r => r.id === ruleId)?.ruleName) || "No Rule Applied";

    const summaryIdRaw = currentTransaction['Card Summary Category'] && currentTransaction['Card Summary Category'][0];
    const summaryName = (monthlyCategorySummary && monthlyCategorySummary.find(s => s.id === summaryIdRaw)?.summaryId) || summaryIdRaw || "N/A";

    // Rate calculation
    const rate = (currentTransaction['Amount'] && currentTransaction['Amount'] > 0)
        ? (currentTransaction.estCashback / currentTransaction['Amount'])
        : 0;

    const netAmount = (currentTransaction['Amount'] || 0) - (currentTransaction.estCashback || 0);

    // Foreign Currency Helpers
    // Logic: Show foreign fields if any foreign data is present, regardless of "Method"
    const foreignAmount = currentTransaction['foreignCurrencyAmount'];
    const conversionFee = currentTransaction['conversionFee'];
    const vndAmount = currentTransaction['Amount'];
    const hasForeignData = (foreignAmount && foreignAmount !== 'N/A') || (conversionFee && conversionFee > 0);

    // Calculations for display
    let displayExchangeRate = currentTransaction['exchangeRate'] || 0;
    let displayFeePercent = 0;

    if (hasForeignData && foreignAmount > 0 && vndAmount > 0) {
        const amountBeforeFee = vndAmount - (conversionFee || 0);

        if (amountBeforeFee > 0 && conversionFee > 0) {
            displayFeePercent = (conversionFee / amountBeforeFee) * 100;
        }
    }

    // Gross Amount Calculation
    const calculatedStartingAmount = (currentTransaction['Amount'] || 0) +
                                     (totalDiscounts || 0) +
                                     (currentTransaction.otherDiscounts || 0) -
                                     (totalFees || 0) -
                                     (currentTransaction.otherFees || 0);

    const displayStartingAmount = currentTransaction.grossAmount !== undefined
        ? (hasForeignData ? currentTransaction.grossAmount + (conversionFee || 0) : currentTransaction.grossAmount)
        : calculatedStartingAmount;

    // Method Badge Logic
    const getMethodBadge = (method) => {
        const m = method || 'POS';
        switch (m) {
            case 'POS': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">POS</Badge>;
            case 'eCom': return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">eCom</Badge>;
            case 'International': return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">International</Badge>;
            default: return <Badge variant="secondary">{m}</Badge>;
        }
    };

    // MCC Description Logic
    const mccCode = currentTransaction['MCC Code'];
    const mccDesc = mccCode ? (mccData.mccDescriptionMap[mccCode]?.vn || 'Unknown') : '';
    const displayMcc = mccCode ? `${mccCode} - ${mccDesc}` : 'N/A';

    // Helper to render a row
    const DetailRow = ({ icon: Icon, label, value, subValue, className }) => (
        <div className={cn("flex items-start gap-3", className)}>
            <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
                <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{label}</p>
                <div className="text-sm text-slate-500 dark:text-slate-400 break-words">{value}</div>
                {subValue && <div className="text-xs text-slate-400 mt-0.5">{subValue}</div>}
            </div>
        </div>
    );

    const SectionHeader = ({ title }) => (
         <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">{title}</h4>
    );

    const Separator = () => <div className="h-px bg-slate-200 dark:bg-slate-800 my-6" />;

    // Shared Content Component
    const TransactionDetailBody = () => {
        const effectiveDate = currentTransaction['billingDate'] || currentTransaction['Transaction Date'];

        return (
            <div className="space-y-6">
                {/* 1. Transaction Info */}
                <div>
                    <SectionHeader title="Transaction Info" />
                    <div className="grid gap-4">
                        <DetailRow icon={Calendar} label="Date" value={formatFullDateTime(effectiveDate)} />
                        {currentTransaction['billingDate'] && (
                            <DetailRow
                                icon={Clock}
                                label="Transaction Date"
                                value={formatFullDateTime(currentTransaction['Transaction Date'])}
                                className="opacity-75"
                            />
                        )}
                        <DetailRow icon={Store} label="Merchant" value={currentTransaction.merchantLookup || currentTransaction['Transaction Name']} />
                        <DetailRow icon={CreditCard} label="Card" value={cardName} />
                        <DetailRow icon={Globe} label="Method" value={getMethodBadge(currentTransaction['Method'])} />
                        <DetailRow icon={Receipt} label="MCC Code" value={displayMcc} className="font-mono" />
                    </div>
                </div>

            <Separator />

            {/* 2. Payment & Cashback */}
            <div>
                <SectionHeader title="Payment & Cashback" />
                <div className="grid gap-4">
                    <DetailRow icon={CheckCircle2} label="Applied Rule" value={ruleName} />

                    <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 flex justify-between items-center">
                        <div className="flex gap-3 items-center">
                            <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                <Percent className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Estimated Cashback</p>
                                <p className="text-xs text-emerald-600 dark:text-emerald-400">{(rate * 100).toFixed(1)}% Rate</p>
                            </div>
                        </div>
                        <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                            +{currency(currentTransaction.estCashback)}
                        </span>
                    </div>

                    <div className="flex justify-between items-center py-2">
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Net Amount (After Cashback)</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{currency(netAmount)}</span>
                    </div>

                    {hasForeignData && (
                        <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-md text-sm space-y-2 border">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Foreign Amount</span>
                                <span className="font-medium">
                                    {foreignAmount} {currentTransaction['foreignCurrency'] ? `${currentTransaction['foreignCurrency']} ` : ''}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Exchange Rate</span>
                                <span className="font-medium">{displayExchangeRate.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                            </div>
                            {currentTransaction.grossAmount !== undefined && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Gross Amount (VND)</span>
                                    <span className="font-medium">{currency(currentTransaction.grossAmount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">% Conversion Fee</span>
                                <span className="font-medium">{displayFeePercent.toFixed(2)}%</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">Conversion Fee</span>
                                <span className="text-red-500 font-medium">+{currency(conversionFee)}</span>
                            </div>
                        </div>
                    )}

                    {(discounts.length > 0 || fees.length > 0 || currentTransaction.otherDiscounts > 0 || currentTransaction.otherFees > 0) && (
                        <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-md text-sm space-y-3 border">
                            {(displayStartingAmount !== undefined && !isNaN(displayStartingAmount)) && (
                                <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                                    <span className="text-muted-foreground">
                                        {hasForeignData ? "Amount (after conversion)" : "Gross Amount"}
                                    </span>
                                    <span className="font-medium">
                                        {currency(displayStartingAmount)}
                                    </span>
                                </div>
                            )}

                            {/* Display Parsed Discounts */}
                            {discounts.length > 0 && (
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-emerald-600 uppercase">Discounts</p>
                                    {discounts.map((d, i) => (
                                        <div key={i} className="flex justify-between text-xs">
                                            <span className="text-slate-600">{d.description || `Discount ${i+1}`}</span>
                                            <span className="text-emerald-600 font-mono">-{d.amount}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Fallback to legacy field if parsed list is empty but total > 0 */}
                            {discounts.length === 0 && currentTransaction.otherDiscounts > 0 && (
                                 <div className="flex justify-between">
                                    <span className="text-muted-foreground">Discounts</span>
                                    <span className="text-emerald-600 font-medium">-{currency(currentTransaction.otherDiscounts)}</span>
                                </div>
                            )}

                            {/* Display Parsed Fees */}
                            {fees.length > 0 && (
                                <div className="space-y-1">
                                    {/* Only add border top if there are previous elements (Discounts or Gross Amount) */}
                                    {(discounts.length > 0 || currentTransaction.otherDiscounts > 0) && (
                                         <div className="h-px bg-slate-200 dark:bg-slate-800 my-2" />
                                    )}
                                    <p className="text-xs font-semibold text-red-600 uppercase">Fees</p>
                                    {fees.map((f, i) => (
                                        <div key={i} className="flex justify-between text-xs">
                                            <span className="text-slate-600">{f.description || `Fee ${i+1}`}</span>
                                            <span className="text-red-500 font-mono">+{f.amount}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                             {/* Fallback to legacy field */}
                            {fees.length === 0 && currentTransaction.otherFees > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Additional Fees</span>
                                    <span className="text-red-500 font-medium">+{currency(currentTransaction.otherFees)}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <Separator />

            {/* 3. Category */}
            <div>
                <SectionHeader title="Categorization" />
                <div className="grid gap-4">
                    <DetailRow icon={Tag} label="Category" value={
                        <div className="flex gap-2 flex-wrap">
                            <Badge variant="secondary">{currentTransaction['Category'] || "Uncategorized"}</Badge>
                        </div>
                    } />

                    <DetailRow icon={Layers} label="Sub-Category" value={
                        (currentTransaction.subCategory && currentTransaction.subCategory.length > 0) ? (
                            <div className="flex gap-1 flex-wrap">
                                {currentTransaction.subCategory.map(sc => <Badge key={sc} variant="outline" className="text-xs">{sc}</Badge>)}
                            </div>
                        ) : "None"
                    } />

                    <DetailRow icon={FileText} label="Paid For" value={currentTransaction['paidFor'] || "N/A"} />
                </div>
            </div>

            <Separator />

            {/* 4. Other Information */}
            <div>
                <SectionHeader title="Other Information" />
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Transaction ID</p>
                            <p className="text-xs font-mono truncate bg-slate-100 dark:bg-slate-800 p-1 rounded">{currentTransaction.id}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Summary Category</p>
                            <p className="text-xs truncate text-slate-600 dark:text-slate-400">{summaryName}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Statement Month</p>
                            <p className="text-sm">{currentTransaction['Statement Month'] || "N/A"}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Cashback Month</p>
                            <p className="text-sm">{currentTransaction['Cashback Month'] || "N/A"}</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                            <Checkbox checked={currentTransaction['Match']} disabled />
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Matched Rule
                            </label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox checked={currentTransaction['Automated']} disabled />
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Automated
                            </label>
                        </div>
                    </div>

                    {cleanNotes && (
                        <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md border border-amber-100 dark:border-amber-900/50">
                            <div className="flex gap-2 items-start">
                                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-amber-800 dark:text-amber-200">Notes</p>
                                    <p className="text-xs text-amber-700 dark:text-amber-300 whitespace-pre-wrap">{cleanNotes}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
        );
    };

    // Shared Header
    const DetailHeader = () => (
         <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Badge className={statusColor}>{statusText}</Badge>
            </div>
            <div>
                {/* Use proper Title component in parent, this is just content */}
                <h2 className="text-xl font-bold leading-tight break-words">
                    {currentTransaction['Transaction Name']}
                </h2>
                {currentTransaction.merchantLookup && (
                    <p className="text-sm text-muted-foreground mt-1">
                        {currentTransaction.merchantLookup}
                    </p>
                )}
            </div>

            <div className="flex flex-col gap-1">
                <span className="text-3xl font-extrabold text-primary tracking-tight">
                    {currency(currentTransaction['Amount'])}
                </span>
                {hasForeignData && (
                    <span className="text-sm text-muted-foreground">
                        {foreignAmount} {currentTransaction['foreignCurrency'] ? `${currentTransaction['foreignCurrency']} ` : ''}
                    </span>
                )}
            </div>
        </div>
    );

    // Shared Footer Buttons
    const DetailFooterContent = () => (
        <div className="flex w-full gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onEdit(currentTransaction)}>
                Edit
            </Button>
            {onDuplicate && (
                <Button variant="outline" className="flex-1" onClick={() => {
                    onClose(false);
                    onDuplicate(currentTransaction);
                }}>
                    Duplicate
                </Button>
            )}
            <Button variant="destructive" className="flex-1" onClick={() => onDelete(currentTransaction.id, currentTransaction['Transaction Name'])}>
                Delete
            </Button>
        </div>
    );

    if (isDesktop) {
        return (
            <Sheet open={isOpen} onOpenChange={onClose}>
                <SheetContent className="w-full sm:max-w-md flex flex-col h-full p-0 gap-0">
                    {/* Header with Back Button logic */}
                    <div className="p-6 pb-2">
                        <Button variant="ghost" size="sm" className="mb-2 -ml-2 text-slate-500 hover:text-slate-900" onClick={() => onClose(false)}>
                            <ArrowLeft className="h-4 w-4 mr-1" /> Back
                        </Button>
                        <SheetHeader>
                             {/* Re-using logic but inside Sheet primitives */}
                             <DetailHeader />
                             {/* Visually hidden Title/Desc if needed for accessiblity compliance, but we rendered them visually above */}
                             <div className="sr-only">
                                <SheetTitle>{currentTransaction['Transaction Name']}</SheetTitle>
                                <SheetDescription>Transaction Details</SheetDescription>
                             </div>
                        </SheetHeader>
                    </div>

                    {/* Scrollable Wrapper */}
                    <div className="flex-1 overflow-y-auto px-6 pb-6">
                        <Separator />
                        <TransactionDetailBody />
                    </div>

                    {/* Footer fixed at the bottom */}
                    <SheetFooter className="p-6 border-t bg-white dark:bg-slate-950 gap-2 sm:gap-0 mt-auto">
                        <DetailFooterContent />
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        );
    }

    return (
        <Drawer open={isOpen} onOpenChange={onClose}>
            <DrawerContent className="h-[96%] flex flex-col focus:outline-none">
                <div className="p-6 pb-2">
                    <DrawerHeader className="p-0 text-left">
                         <DetailHeader />
                          <div className="sr-only">
                                <DrawerTitle>{currentTransaction['Transaction Name']}</DrawerTitle>
                                <DrawerDescription>Transaction Details</DrawerDescription>
                         </div>
                    </DrawerHeader>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-6">
                    <Separator />
                    <TransactionDetailBody />
                </div>

                <DrawerFooter className="p-6 pt-2 border-t bg-white dark:bg-slate-950 gap-2 mt-auto">
                    <DetailFooterContent />
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
// src/components/shared/StatCard.jsx
import React from 'react';
import { Card, CardContent } from '../ui/card'; // Adjusted path
import { cn } from '../../lib/utils'; // Adjusted path
import { ArrowUp, ArrowDown } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

/**
 * A small sparkline chart component using Recharts
 */
function SparklineChart({ data, lineColor, fillColor, dataKey, currencyFn, title }) {
    if (!data || data.length < 2) return null;

    // Format data for Recharts (AreaChart needs objects with keys)
    const formattedData = data.map((value, index) => ({ name: index, [dataKey]: value }));

    const formatTooltipValue = (value) => {
        // 1. If a currency function is provided (passed down from StatCard), use it.
        //    Format it to remove trailing decimals and use grouping.
        if (currencyFn) {
            // Use Intl.NumberFormat directly for more control
            const formatter = new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
                minimumFractionDigits: 0, // Remove .00
                maximumFractionDigits: 0  // Remove .00
            });
            return formatter.format(value);
        }

        // 2. If it's a rate (a decimal between -1 and 1), format as percentage.
        if (value > -1 && value < 1 && value !== 0) { // Exclude exact 0
            return `${(value * 100).toFixed(2)}%`;
        }

        // 3. Fallback for any other number (e.g., if currencyFn is missing).
        //    Format with thousand separators and no decimals.
        return value.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    };

    return (
        <div className="h-10 w-full"> {/* Sparkline height */}
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={formattedData}
                    margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
                >
                    {/* Gradient definition for the fill */}
                    <defs>
                        <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={fillColor} stopOpacity={0.4}/>
                            <stop offset="95%" stopColor={fillColor} stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <RechartsTooltip
                        contentStyle={{ fontSize: '10px', padding: '2px 4px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.9)', border: '1px solid #ccc' }}
                        itemStyle={{ padding: 0, color: lineColor }}
                        formatter={(value) => [formatTooltipValue(value), title]}
                        labelFormatter={() => ''} // Hide the label (index)
                        cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '3 3' }}
                    />
                    <Area
                        type="monotone" // Makes the line curvy
                        dataKey={dataKey}
                        stroke={lineColor}
                        strokeWidth={1.5}
                        fillOpacity={1}
                        fill={`url(#gradient-${dataKey})`} // Apply gradient fill
                        dot={false}
                        activeDot={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

/**
 * The main StatCard component
 */
export default function StatCard({
    title,
    value,
    numericValue,
    icon,
    lastMonthValue,
    currentMonthLabel,
    sparklineData,
    currencyFn,
    invertTrendColor = false // New prop
}) {
    // --- Trend Calculation Logic ---
    let trend = null;
    let trendColorClass = "";
    let TrendIcon = null;

    // Use the raw numeric values for calculation
    const currentVal = typeof numericValue === 'number' ? numericValue : 0;
    const previousVal = typeof lastMonthValue === 'number' ? lastMonthValue : 0;

    // Check if lastMonthValue was provided (it's null/undefined for first-ever month)
    if (typeof lastMonthValue === 'number') {
        if (previousVal !== 0) {
            // --- Case 1: Previous value is not 0, calculate percentage change ---
            const percentageChange = ((currentVal - previousVal) / Math.abs(previousVal)) * 100;

            if (Math.abs(percentageChange) < 0.1) {
                // Negligible change
                trend = '≈0%';
                trendColorClass = "text-slate-600 bg-slate-100/60 dark:bg-slate-700 dark:text-slate-200";
            } else {
                // Significant change
                trend = `${Math.abs(percentageChange).toFixed(1)}%`;
                const isPositive = percentageChange > 0;

                // Determine colors based on inversion logic
                const positiveColor = invertTrendColor ? "text-red-600 bg-red-100/60 dark:bg-red-900/50 dark:text-red-300" : "text-emerald-600 bg-emerald-100/60 dark:bg-emerald-900/50 dark:text-emerald-300";
                const negativeColor = invertTrendColor ? "text-emerald-600 bg-emerald-100/60 dark:bg-emerald-900/50 dark:text-emerald-300" : "text-red-600 bg-red-100/60 dark:bg-red-900/50 dark:text-red-300";

                if (isPositive) {
                    trendColorClass = positiveColor;
                    TrendIcon = ArrowUp;
                } else {
                    trendColorClass = negativeColor;
                    TrendIcon = ArrowDown;
                }
            }
        } else if (currentVal > 0) {
            // --- Case 2: Previous value was 0, but current is positive ---
            trend = "New";
            // Invert color if needed for "New" trend
            trendColorClass = invertTrendColor ? "text-red-600 bg-red-100/60 dark:bg-red-900/50 dark:text-red-300" : "text-emerald-600 bg-emerald-100/60 dark:bg-emerald-900/50 dark:text-emerald-300";
            TrendIcon = ArrowUp;
        } else {
            // --- Case 3: Both are 0 (or current is 0 and previous was 0) ---
            trend = '0%';
            trendColorClass = "text-slate-600 bg-slate-100/60 dark:bg-slate-700 dark:text-slate-200";
        }
    }
    // If lastMonthValue is not a number (null/undefined), 'trend' remains null and no badge is shown.

    // --- Sparkline Color Logic ---
    let lineColor = "hsl(215 20% 65%)"; // Default slate-500
    let fillColor = "hsl(215 20% 65%)";

    // Define colors
    const positiveLineColor = invertTrendColor ? "hsl(0 72% 51%)" : "hsl(142 71% 45%)"; // Red or Green
    const negativeLineColor = invertTrendColor ? "hsl(142 71% 45%)" : "hsl(0 72% 51%)"; // Green or Red

    if (TrendIcon === ArrowUp) {
        lineColor = positiveLineColor;
        fillColor = positiveLineColor;
    } else if (TrendIcon === ArrowDown) {
        lineColor = negativeLineColor;
        fillColor = negativeLineColor;
    }

    return (
        <Card className="flex flex-col justify-between shadow-sm border border-slate-200 overflow-hidden">
            <CardContent className="p-4 flex-grow flex flex-col justify-between">
                {/* --- Top Row: Title and Trend Badge --- */}
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center text-sm font-medium text-muted-foreground">
                        {icon && <span className="mr-2">{icon}</span>}
                        {title}
                    </div>
                    {trend !== null && (
                         <div className={cn(
                             "flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold",
                             trendColorClass
                         )}>
                             {TrendIcon && <TrendIcon className="h-3 w-3" />}
                             <span>{trend}</span>
                         </div>
                     )}
                </div>

                {/* --- Middle Content: Value and Month Label --- */}
                <div className="mb-2">
                    <p className="text-2xl font-bold tracking-tight leading-none mt-1">
                        {value}
                    </p>
                    {currentMonthLabel && (
                        <p className="text-xs text-muted-foreground mt-1">
                            {currentMonthLabel}
                        </p>
                    )}
                </div>

            </CardContent>

            {/* Sparkline Integration */}
            {sparklineData && sparklineData.length > 1 && (
                <div className="px-1 -mt-2"> {/* Pull sparkline up a bit */}
                     <SparklineChart
                        data={sparklineData}
                        lineColor={lineColor}
                        fillColor={fillColor}
                        dataKey={title.toLowerCase().replace(/\s+/g, '-')} // Unique key
                        currencyFn={title !== 'Effective Rate' ? currencyFn : undefined}
                        title={title}
                    />
                </div>
            )}
        </Card>
    );
}
import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props} />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow",
      className
    )}
    {...props} />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props} />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const DropdownMenu = DropdownMenuPrimitive.Root

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

const DropdownMenuGroup = DropdownMenuPrimitive.Group

const DropdownMenuPortal = DropdownMenuPrimitive.Portal

const DropdownMenuSub = DropdownMenuPrimitive.Sub

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const DropdownMenuSubTrigger = React.forwardRef(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className
    )}
    {...props}>
    {children}
    <ChevronRight className="ml-auto" />
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = React.forwardRef(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-dropdown-menu-content-transform-origin]",
      className
    )}
    {...props} />
))
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = React.forwardRef(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-dropdown-menu-content-transform-origin]",
        className
      )}
      {...props} />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0",
      inset && "pl-8",
      className
    )}
    {...props} />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = React.forwardRef(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}>
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = React.forwardRef(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}>
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = React.forwardRef(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className)}
    {...props} />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props} />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuShortcut = ({
  className,
  ...props
}) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props} />
  );
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}
import * as React from "react"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}) {
  return (<div className={cn(badgeVariants({ variant }), className)} {...props} />);
}

export { Badge, badgeVariants }
import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    )}
    {...props}
    ref={ref}>
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
      )} />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
import React, { createContext, useContext, useEffect, useState } from "react"

const ThemeProviderContext = createContext({
  theme: "system",
  setTheme: () => null,
})

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem(storageKey) || defaultTheme
  )

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    let effectiveTheme = theme;
    if (theme === "system") {
      effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    root.classList.add(effectiveTheme);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") {
        const newSystemTheme = mediaQuery.matches ? "dark" : "light";
        root.classList.remove("light", "dark");
        root.classList.add(newSystemTheme);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
      className
    )}
    {...props}>
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }} />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"

const Drawer = ({
  shouldScaleBackground = true,
  ...props
}) => (
  <DrawerPrimitive.Root shouldScaleBackground={shouldScaleBackground} {...props} />
)
Drawer.displayName = "Drawer"

const DrawerTrigger = DrawerPrimitive.Trigger

const DrawerPortal = DrawerPrimitive.Portal

const DrawerClose = DrawerPrimitive.Close

const DrawerOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/80", className)}
    {...props} />
))
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName

const DrawerContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background",
        className
      )}
      {...props}>
      <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
      {children}
    </DrawerPrimitive.Content>
  </DrawerPortal>
))
DrawerContent.displayName = "DrawerContent"

const DrawerHeader = ({
  className,
  ...props
}) => (
  <div
    className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
    {...props} />
)
DrawerHeader.displayName = "DrawerHeader"

const DrawerFooter = ({
  className,
  ...props
}) => (
  <div className={cn("mt-auto flex flex-col gap-2 p-4", className)} {...props} />
)
DrawerFooter.displayName = "DrawerFooter"

const DrawerTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props} />
))
DrawerTitle.displayName = DrawerPrimitive.Title.displayName

const DrawerDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props} />
))
DrawerDescription.displayName = DrawerPrimitive.Description.displayName

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props} />
  );
})
Textarea.displayName = "Textarea"

export { Textarea }
import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef(({ className, ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props} />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
"use client";
import { memo, useState, useRef, useEffect } from "react";
import { X, Plus, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useFormContext,
} from "react-hook-form";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const TagsInputFieldBase = ({
  name,
  label,
  beautifyName,
  description,
  placeholder,
  disabled,
  className,
  autoFocus,
  maxTags,
  maxLength = 50,
  allowDuplicates = false,
  variant = "default",
  tagVariant = "default",
  startIcon,
  endIcon,
  suggestions = [],
}) => {
  const { control } = useFormContext();
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addTag = (
    tag,
    currentTags,
    onChange
  ) => {
    const trimmedTag = tag.trim();
    if (!trimmedTag) return;

    if (!allowDuplicates && currentTags.includes(trimmedTag)) return;
    if (maxTags && currentTags.length >= maxTags) return;
    if (trimmedTag.length > maxLength) return;

    onChange([...currentTags, trimmedTag]);
    setInputValue("");
    setShowSuggestions(false);
  };

  const removeTag = (
    index,
    currentTags,
    onChange
  ) => {
    const newTags = currentTags.filter((_, i) => i !== index);
    onChange(newTags);
  };

  const handleKeyDown = (
    e,
    currentTags,
    onChange
  ) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue, currentTags, onChange);
    } else if (e.key === "Backspace" && !inputValue && currentTags.length > 0) {
      removeTag(currentTags.length - 1, currentTags, onChange);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "enterprise":
        return {
          container:
            "dark:border-gray-600 border-2 border-muted hover:border-primary/30 transition-all duration-300 backdrop-blur-sm",
          input:
            "bg-transparent border-0 focus:ring-0 placeholder:text-muted-foreground/60",
          suggestions:
            "bg-background/95 backdrop-blur-md border border-border/50 shadow-xl",
        };
      case "minimal":
        return {
          container:
            "bg-background border border-border hover:border-primary/50 transition-colors",
          input: "bg-transparent border-0 focus:ring-0",
          suggestions: "bg-background border border-border shadow-lg",
        };
      default:
        return {
          container:
            "bg-background border border-input hover:border-primary/50 transition-colors",
          input: "bg-transparent border-0 focus:ring-0",
          suggestions: "bg-background border border-border shadow-lg",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const tags = field.value || [];
        const filteredSuggestions = suggestions.filter(
          (s) =>
            s.toLowerCase().includes(inputValue.toLowerCase()) &&
            !tags.includes(s)
        );

        return (
          <FormItem className={cn("space-y-2", className)}>
            <FormLabel className="flex items-center gap-2">
              {label}
              {maxTags && (
                <Badge
                  variant="outline"
                  className="text-xs dark:border-gray-500"
                >
                  {tags.length}/{maxTags}
                </Badge>
              )}
            </FormLabel>

            <FormControl>
              <div ref={containerRef} className="relative">
                <div
                  className={cn(
                    "min-h-[2.5rem] p-2 rounded-md flex flex-wrap gap-2 items-center ",
                    styles.container,
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {startIcon && (
                    <span className="text-muted-foreground">{startIcon}</span>
                  )}

                  <AnimatePresence>
                    {tags.map((tag, index) => (
                      <motion.div
                        key={`${tag}-${index}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Badge
                          variant={tagVariant}
                          className={cn(
                            "flex items-center gap-1 pr-1 group transition-colors",
                            variant === "enterprise" &&
                              "bg-primary border-primary/20"
                          )}
                        >
                          <span className="max-w-[150px] truncate">{tag}</span>
                          {!disabled && (
                            <button
                              type="button"
                              onClick={() =>
                                removeTag(index, tags, field.onChange)
                              }
                              className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                              aria-label={`Remove ${tag}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </Badge>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  <div className="flex-1 min-w-[120px]">
                    <Input
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => {
                        setInputValue(e.target.value);
                        setShowSuggestions(
                          e.target.value.length > 0 && suggestions.length > 0
                        );
                      }}
                      onKeyDown={(e) => handleKeyDown(e, tags, field.onChange)}
                      onFocus={() =>
                        setShowSuggestions(
                          inputValue.length > 0 && suggestions.length > 0
                        )
                      }
                      placeholder={
                        tags.length === 0
                          ? placeholder ??
                            `Enter ${label.toLowerCase()} and press Enter`
                          : maxTags && tags.length >= maxTags
                          ? `Maximum ${maxTags} tags reached`
                          : "Add another..."
                      }
                      className={styles.input}
                      disabled={
                        disabled || (maxTags ? tags.length >= maxTags : false)
                      }
                      autoFocus={autoFocus}
                      maxLength={maxLength}
                    />
                  </div>

                  {endIcon && (
                    <span className="text-muted-foreground">{endIcon}</span>
                  )}

                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => {
                        if (inputValue.trim()) {
                          addTag(inputValue, tags, field.onChange);
                        }
                        inputRef.current?.focus();
                      }}
                      className="p-1 hover:bg-muted rounded transition-colors"
                      disabled={
                        !inputValue.trim() ||
                        (maxTags ? tags.length >= maxTags : false)
                      }
                      aria-label="Add tag"
                    >
                      <Plus className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
                <AnimatePresence>
                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "absolute z-50 w-full mt-1 rounded-md py-1 overflow-auto",
                        styles.suggestions
                      )}
                    >
                      {filteredSuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() =>
                            addTag(suggestion, tags, field.onChange)
                          }
                          className="w-full px-3 py-2 text-left hover:bg-muted transition-colors text-sm"
                        >
                          <div className="flex items-center gap-2">
                            {startIcon ? (
                              startIcon
                            ) : (
                              <Tag className="w-3 h-3 text-muted-foreground" />
                            )}
                            {suggestion}
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </FormControl>

            {description && <FormDescription>{description}</FormDescription>}

            <div className="flex justify-between items-center">
              <FormMessage />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {maxLength && inputValue && (
                  <span>
                    {inputValue.length}/{maxLength}
                  </span>
                )}
                {tags.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {tags.length} {beautifyName ?? "tags"}
                  </Badge>
                )}
              </div>
            </div>
          </FormItem>
        );
      }}
    />
  );
};

export const TagsInputField = memo(TagsInputFieldBase);
import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props} />
  );
})
Input.displayName = "Input"

export { Input }
import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}>
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}>
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}>
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-[--radix-select-content-available-height] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-select-content-transform-origin]",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}>
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn("p-1", position === "popper" &&
          "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]")}>
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", className)}
    {...props} />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}>
    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props} />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
"use client";
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { Controller, FormProvider, useFormContext } from "react-hook-form";

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const Form = FormProvider

const FormFieldContext = React.createContext(null)

const FormField = (
  {
    ...props
  }
) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  if (!itemContext) {
    throw new Error("useFormField should be used within <FormItem>")
  }

  const fieldState = getFieldState(fieldContext.name, formState)

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

const FormItemContext = React.createContext(null)

const FormItem = React.forwardRef(({ className, ...props }, ref) => {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  );
})
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField()

  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...props} />
  );
})
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props} />
  );
})
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-[0.8rem] text-muted-foreground", className)}
      {...props} />
  );
})
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message ?? "") : children

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-[0.8rem] font-medium text-destructive", className)}
      {...props}>
      {body}
    </p>
  );
})
FormMessage.displayName = "FormMessage"

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}
"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const Combobox = ({ options = [], value, onChange, placeholder, searchPlaceholder, disableAutoFocus = false, className, id }) => {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState('');

  // Explicitly manage focus to ensure disableAutoFocus is respected
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (open && disableAutoFocus && inputRef.current) {
      // Force blur if it grabs focus, or ensure we don't focus it.
      // cmdk might try to focus it.
      // Actually, cmdk's Command.Input has autoFocus.
      // If we pass autoFocus={false}, react might still focus it if cmdk does internally.
      // Let's try blurring it immediately if it's not supposed to be focused.
      setTimeout(() => {
          if (document.activeElement === inputRef.current) {
              inputRef.current.blur();
          }
      }, 0);
    }
  }, [open, disableAutoFocus]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-10", className)}
        >
          {/* --- FIX 1: Added fallback to 'value' --- */}
          {value
            ? (options.find((option) => option.value === value)?.label || value)
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            ref={inputRef}
            placeholder={searchPlaceholder}
            value={inputValue}
            onValueChange={setInputValue}
            // Fix: Disable autofocus if requested (e.g. on mobile)
            autoFocus={!disableAutoFocus}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && inputValue) {
                if (!options.some(opt => opt.value.toLowerCase() === inputValue.toLowerCase())) {
                  onChange(inputValue);
                  setInputValue('');
                  setOpen(false);
                }
              }
            }}
          />
          <CommandEmpty>
            {inputValue && (
                <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                        onChange(inputValue);
                        setInputValue('');
                        setOpen(false);
                    }}
                >
                    Create "{inputValue}"
                </Button>
            )}
          </CommandEmpty>
          <CommandGroup>
            {options.map((option) => (
              <CommandItem
                key={option.value}
                // --- FIX 2: Use label for searching ---
                value={option.label}
                // --- FIX 3: Use value for selecting ---
                onSelect={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === option.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export { Combobox }
import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cva } from "class-variance-authority";
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Sheet = SheetPrimitive.Root

const SheetTrigger = SheetPrimitive.Trigger

const SheetClose = SheetPrimitive.Close

const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref} />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom rounded-t-xl sm:rounded-t-lg",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

const SheetContent = React.forwardRef(({ side = "right", className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content ref={ref} className={cn(sheetVariants({ side }), className)} {...props}>
      <SheetPrimitive.Close
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
      {children}
    </SheetPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}
    {...props} />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
    {...props} />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props} />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props} />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverAnchor = PopoverPrimitive.Anchor

const PopoverContent = React.forwardRef(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-popover-content-transform-origin]",
        className
      )}
      {...props} />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

const Accordion = AccordionPrimitive.Root

const AccordionItem = React.forwardRef(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item ref={ref} className={cn("border-b", className)} {...props} />
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline text-left [&[data-state=open]>svg]:rotate-180",
        className
      )}
      {...props}>
      {children}
      <ChevronDown
        className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}>
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>
))
AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
"use client";
import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Dialog, DialogContent } from "@/components/ui/dialog"

const Command = React.forwardRef(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
      className
    )}
    {...props} />
))
Command.displayName = CommandPrimitive.displayName

const CommandDialog = ({
  children,
  ...props
}) => {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0">
        <Command
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
}

const CommandInput = React.forwardRef(({ className, ...props }, ref) => (
  <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
      "flex h-10 w-full rounded-md bg-transparent py-2 text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props} />
  </div>
))

CommandInput.displayName = CommandPrimitive.Input.displayName

const CommandList = React.forwardRef(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
    {...props} />
))

CommandList.displayName = CommandPrimitive.List.displayName

const CommandEmpty = React.forwardRef((props, ref) => (
  <CommandPrimitive.Empty ref={ref} className="py-6 text-center text-sm" {...props} />
))

CommandEmpty.displayName = CommandPrimitive.Empty.displayName

const CommandGroup = React.forwardRef(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
      className
    )}
    {...props} />
))

CommandGroup.displayName = CommandPrimitive.Group.displayName

const CommandSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator ref={ref} className={cn("-mx-1 h-px bg-border", className)} {...props} />
))
CommandSeparator.displayName = CommandPrimitive.Separator.displayName

const CommandItem = React.forwardRef(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      className
    )}
    {...props} />
))

CommandItem.displayName = CommandPrimitive.Item.displayName

const CommandShortcut = ({
  className,
  ...props
}) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)}
      {...props} />
  );
}
CommandShortcut.displayName = "CommandShortcut"

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}
import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "grid place-content-center peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    {...props}>
    <CheckboxPrimitive.Indicator className={cn("grid place-content-center text-current")}>
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-tooltip-content-transform-origin]",
        className
      )}
      {...props} />
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

const ScrollArea = React.forwardRef(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}>
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}>
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("rounded-xl border bg-card text-card-foreground shadow-md", className)}
    {...props} />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props} />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-xl font-semibold leading-none tracking-tight", className)}
    {...props} />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props} />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props} />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props} />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}>
      {children}
      <DialogPrimitive.Close
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
    {...props} />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
    {...props} />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props} />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props} />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
import * as React from "react"

import { cn } from "@/lib/utils"

const Table = React.forwardRef(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props} />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props} />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)}
    {...props} />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props} />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className
    )}
    {...props} />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className
    )}
    {...props} />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props} />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-primary/10", className)}
      {...props} />
  );
}

export { Skeleton }
import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import PinInput from './PinInput';

export default function LoginScreen({ onLoginSuccess }) {
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handlePinComplete = async (pin) => {
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ pin }),
                credentials: 'include',
            });

            if (response.ok) {
                onLoginSuccess();
            } else {
                setError('Incorrect PIN. Please try again.');
                // Clear the PIN inputs after a failed attempt (optional but good UX)
                // You would need to add a reset function to your PinInput component.
            }
        } catch (err) {
            console.error('Login request failed:', err);
            setError('An error occurred. Please check your connection.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
            <div className="w-full max-w-sm">
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Enter PIN</CardTitle>
                        <p className="text-sm text-muted-foreground pt-1">Please enter your 6-digit PIN to continue.</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* The PinInput component doesn't need any changes */}
                        <PinInput onComplete={handlePinComplete} />

                        {isLoading && <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}

                        {error && <p className="text-sm font-medium text-destructive text-center">{error}</p>}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
import React, { useState, useRef, useEffect } from 'react';
import { Input } from '../ui/input';

export default function PinInput({ length = 6, onComplete }) {
    const [pin, setPin] = useState(Array(length).fill(''));
    const inputRefs = useRef([]);

    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    const handleChange = (e, index) => {
        const value = e.target.value;
        if (!/^[0-9]$/.test(value) && value !== '') return;

        const newPin = [...pin];
        newPin[index] = value;
        setPin(newPin);

        if (value !== '' && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        if (newPin.join('').length === length) {
            onComplete(newPin.join(''));
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && pin[index] === '' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        const pastedData = e.clipboardData.getData('text').slice(0, length);
        if (/^[0-9]+$/.test(pastedData)) {
            const newPin = Array(length).fill('');
            pastedData.split('').forEach((char, index) => {
                newPin[index] = char;
            });
            setPin(newPin);
            if (newPin.join('').length === length) {
                onComplete(newPin.join(''));
            }
        }
    };

    return (
        <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {pin.map((digit, index) => (
                <Input
                    key={index}
                    ref={el => inputRefs.current[index] = el}
                    type="password"
                    maxLength="1"
                    pattern="[0-9]"
                    inputMode="numeric"
                    value={digit}
                    onChange={(e) => handleChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className="w-12 h-14 text-center text-2xl font-semibold"
                />
            ))}
        </div>
    );
}
// CashbackDashboard.jsx

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { CreditCard, DollarSign, AlertTriangle, Loader2, LayoutDashboard, ArrowLeftRight, Banknote, Settings } from "lucide-react";
import { Toaster, toast } from 'sonner';

// Import utility functions
import { cn } from "./lib/utils";
import { getCurrentCashbackMonthForCard } from './lib/date';

// Import UI components
import { TooltipProvider } from "./components/ui/tooltip";

// Import dialog components
import BestCardFinderDialog from './components/dashboard/dialogs/BestCardFinderDialog';
import SyncQueueSheet from './components/shared/SyncQueueSheet';
import DashboardHeader from "./components/dashboard/header/DashboardHeader";

// Import overview tab components
import CardSpendsCap from "./components/dashboard/overview/CardSpendsCap";
import EnhancedSuggestions from "./components/dashboard/overview/EnhancedSuggestions";
import CombinedCardStatsChart from "./components/dashboard/overview/CombinedCardStatsChart";
import CummulativeResultsChart from "./components/dashboard/overview/CummulativeResultsChart";
import RecentTransactions from './components/dashboard/overview/RecentTransactions';
import CurrentCashflowChart from "./components/dashboard/overview/CurrentCashflowChart";
import TransactionReview from './components/dashboard/transactions/TransactionReview';
import TransactionsList from './components/dashboard/transactions/TransactionsList';
import TransactionDetailSheet from './components/shared/TransactionDetailSheet';
import CashbackTracker from './components/dashboard/cashback/CashbackTracker';

// Import new CardsTab component
import CardsTab from "./components/dashboard/cards/CardsTab";

// Import new PaymentsTab component
import PaymentsTab from "./components/dashboard/payments/PaymentsTab";

// Import new SettingsTab component
import SettingsTab from "./components/dashboard/settings/SettingsTab";

// Import authentication component
import LoginScreen from './components/auth/LoginScreen';

// Import shared components
import AppSkeleton from "./components/shared/AppSkeleton";
import AppSidebar from "./components/shared/AppSidebar";
import SharedTransactionsDialog from "./components/shared/SharedTransactionsDialog";
import StatCards from './components/dashboard/overview/OverviewStatCards';

// Import custom hooks
import useMediaQuery from "./hooks/useMediaQuery";
import useCashbackData from "./hooks/useCashbackData";
import useTransactionSync from "./hooks/useTransactionSync";
import useLiveTransactions from "./hooks/useLiveTransactions";
import useDashboardStats from "./hooks/useDashboardStats";

// Import constants and utilities
import { COLORS } from './lib/constants';
import { calculateDaysLeft } from './lib/date';
import { currency, fmtYMShort } from './lib/formatters';

const navItems = [
    { view: 'overview', icon: LayoutDashboard, label: 'Overview' },
    { view: 'transactions', icon: ArrowLeftRight, label: 'Transactions' },
    { view: 'cards', icon: CreditCard, label: 'My Cards' },
    { view: 'cashback', icon: DollarSign, label: 'Cashback' },
    { view: 'payments', icon: Banknote, label: 'Payments' },
    { view: 'settings', icon: Settings, label: 'Settings' },
];

export default function CashbackDashboard() {
    const {
        liveTransactions, setLiveTransactions,
        liveCursor, setLiveCursor,
        liveHasMore, setLiveHasMore,
        isLiveLoading, setIsLiveLoading,
        isLiveAppending, setIsLiveAppending,
        liveSearchTerm, setLiveSearchTerm,
        liveDateRange, setLiveDateRange,
        liveSort, setLiveSort,
        liveCardFilter, setLiveCardFilter,
        liveCategoryFilter, setLiveCategoryFilter,
        liveMethodFilter, setLiveMethodFilter,
        fetchLiveTransactions,
        handleLiveLoadMore,
        handleLiveSearch,
        handleLiveDateRangeChange,
        handleLiveSortChange,
        handleLiveFilterChange
    } = useLiveTransactions();

    const [activeMonth, setActiveMonth] = useState("live");
    const [monthlyTransactions, setMonthlyTransactions] = useState([]);
    const [isMonthlyTxLoading, setIsMonthlyTxLoading] = useState(true);
    const [isAddTxDialogOpen, setIsAddTxDialogOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [duplicateTransaction, setDuplicateTransaction] = useState(null);
    const [viewingTransaction, setViewingTransaction] = useState(null);
    const [transactionFilterType, setTransactionFilterType] = useState('date'); // 'date' or 'cashbackMonth'
    const [dialogDetails, setDialogDetails] = useState(null); // Will hold { cardId, cardName, month, monthLabel }
    const [dialogTransactions, setDialogTransactions] = useState([]);
    const [isDialogLoading, setIsDialogLoading] = useState(false);
    // const [cardView, setCardView] = useState('month'); // MOVED TO CardsTab
    const [activeView, setActiveView] = useState('overview');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const [isFinderOpen, setIsFinderOpen] = useState(false);

    // --- LOADING STATES ---
    const [processingIds, setProcessingIds] = useState(new Set());

    const isDesktop = useMediaQuery("(min-width: 768px)");
    const addTxSheetSide = isDesktop ? 'right' : 'bottom';

    const {
        cards, allCards, rules, monthlySummary, mccMap, monthlyCategorySummary,
        recentTransactions, allCategories, commonVendors, reviewTransactions,
        error, refreshData, isShellReady, isDashboardLoading,
        setRecentTransactions, setReviewTransactions,
        cashbackRules, monthlyCashbackCategories, liveSummary,
        fetchReviewTransactions, reviewLoading, fetchSummariesForMonth,
        definitions, updateCard, updateRule, availableMonths
    } = useCashbackData(isAuthenticated);


    // --- SYNC LOGIC ---
    const handleBackgroundSyncSuccess = useCallback((updatedTransaction, oldId) => {
        const targetId = oldId || updatedTransaction.id;

        // Find and replace the transaction in the list for an instant UI update
        // without disrupting the user or closing the form
        setMonthlyTransactions(prevTxs =>
            prevTxs.map(tx => tx.id === targetId ? updatedTransaction : tx)
        );

        // Also update the recent transactions carousel
        setRecentTransactions(prevRecent =>
            prevRecent.map(tx => tx.id === targetId ? updatedTransaction : tx)
        );

        // Update Live Transactions (Critical for "Appears Faster")
        setLiveTransactions(prevLive =>
            prevLive.map(tx => tx.id === targetId ? updatedTransaction : tx)
        );

        setReviewTransactions(prevReview =>
            prevReview.filter(tx => tx.id !== targetId && tx.id !== updatedTransaction.id)
        );

        // Quietly refresh other data, skipping static resources (cards, rules)
        refreshData(true, true);
    }, [setRecentTransactions, setReviewTransactions, refreshData]);

    const {
        queue: needsSyncing,
        addToQueue,
        retry: handleRetrySync,
        remove: handleRemoveFromSync,
        isSyncing,
        isSheetOpen: isSyncingSheetOpen,
        setSheetOpen: setIsSyncingSheetOpen
    } = useTransactionSync({
        cards,
        monthlySummary,
        monthlyCategorySummary, // actually passed but hook logic does fetch itself if needed, but it's good for deps
        onSyncSuccess: handleBackgroundSyncSuccess
    });

    const syncingIds = useMemo(() => {
        return new Set(needsSyncing.filter(t => t.status === 'pending').map(t => t.id));
    }, [needsSyncing]);

    // Fetch review transactions when tab is active
    useEffect(() => {
        if (!isAddTxDialogOpen) {
            setDuplicateTransaction(null);
        }
    }, [isAddTxDialogOpen]);

    // Fetch review transactions when tab is active
    useEffect(() => {
        if (activeView === 'transactions') {
            fetchReviewTransactions();
        }
    }, [activeView, fetchReviewTransactions]);

    const fetchedMonthsRef = React.useRef(new Set());

    // Trigger lazy load of BOTH summaries when activeMonth changes
    useEffect(() => {
        if (!monthlyCategorySummary || !monthlySummary) return;

        if (activeMonth === 'live') {
            const requiredMonths = new Set();
            cards.forEach(card => {
                const currentMonth = getCurrentCashbackMonthForCard(card);
                requiredMonths.add(currentMonth);
            });

            const missingMonths = [...requiredMonths].filter(m => !fetchedMonthsRef.current.has(m));

            if (missingMonths.length > 0) {
                missingMonths.forEach(month => {
                    fetchedMonthsRef.current.add(month);
                    fetchSummariesForMonth(month);
                });
            }
        } else {
            if (!fetchedMonthsRef.current.has(activeMonth)) {
                fetchedMonthsRef.current.add(activeMonth);
                fetchSummariesForMonth(activeMonth);
            }
        }
    }, [activeMonth, monthlyCategorySummary, monthlySummary, fetchSummariesForMonth, cards]);

    const handleLogout = async () => {
        try {
            await fetch(`${API_BASE_URL}/logout`, {
                method: 'POST',
                credentials: 'include'
            });
            setIsAuthenticated(false);
        } catch (error) {
            console.error("Logout failed:", error);
            toast.error("Logout failed. Please try again.");
        }
    };

    // ⚡ Bolt Optimization: Memoize handlers to prevent re-renders
    const handleTransactionAdded = useCallback((newTransaction) => {
        // 1. Instantly update the list for the current month
        if (newTransaction['Transaction Date'].startsWith(activeMonth.replace('-', ''))) {
                setMonthlyTransactions(prevTxs => [newTransaction, ...prevTxs]);
        }

        // 2. Update the recent transactions carousel
        setRecentTransactions(prevRecent => [newTransaction, ...prevRecent].slice(0, 20));

        // 3. Update Live Transactions list
        setLiveTransactions(prev => [newTransaction, ...prev]);

        // 4. Trigger a full refresh in the background to update all aggregate data (charts, stats, etc.) without a loading screen.
        // Skip static data fetch to prevent unnecessary re-renders of memoized components.
        refreshData(true, true);
    }, [activeMonth, setRecentTransactions, refreshData]);

    const handleViewTransactions = useCallback(async (cardId, cardName, month, monthLabel) => {
        setDialogDetails({ cardId, cardName, month, monthLabel });
        setIsDialogLoading(true);
        setDialogTransactions([]);

        try {
            // Use 'cashbackMonth' filter as it aligns with statement periods
            const res = await fetch(`${API_BASE_URL}/transactions?month=${month}&filterBy=statementMonth&cardId=${cardId}`);
            if (!res.ok) throw new Error('Failed to fetch transactions for dialog');
            const data = await res.json();

            // Sort by date just in case
            data.sort((a, b) => new Date(b['Transaction Date']) - new Date(a['Transaction Date']));

            setDialogTransactions(data);
        } catch (err) {
            console.error(err);
            toast.error("Could not load transaction details.");
        } finally {
            setIsDialogLoading(false);
        }
    }, []);

    const handleTransactionDeleted = useCallback(async (deletedTxId, txName) => {
        // 1. Ask for confirmation to prevent accidental deletion
        const confirmationMessage = txName
            ? `Are you sure you want to delete the transaction for "${txName}"? This action cannot be undone.`
            : `Are you sure you want to delete this transaction? This action cannot be undone.`;

        if (!window.confirm(confirmationMessage)) {
            return;
        }

        setProcessingIds(prev => {
            const next = new Set(prev);
            next.add(deletedTxId);
            return next;
        });

        try {
            // 2. Call the backend API to archive the page in Notion
            const response = await fetch(`${API_BASE_URL}/transactions/${deletedTxId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                // Handle server-side errors
                throw new Error('Failed to delete the transaction on the server.');
            }

            // 3. If successful, update the UI
            // Remove the transaction from the main list to update the UI instantly
            setMonthlyTransactions(prevTxs => prevTxs.filter(tx => tx.id !== deletedTxId));
            setLiveTransactions(prev => prev.filter(tx => tx.id !== deletedTxId)); // Optimistic Live Update

            // Also remove it from the recent transactions carousel for consistency
            setRecentTransactions(prevRecent => prevRecent.filter(tx => tx.id !== deletedTxId));

            // Also remove it from the review transactions list
            setReviewTransactions(prevReview => prevReview.filter(tx => tx.id !== deletedTxId));

            toast.success('Transaction deleted successfully!');

            // Optionally, trigger a silent refresh to ensure all aggregate data is up-to-date
            refreshData(true, true);

        } catch (error) {
            console.error("Delete failed:", error);
            toast.error("Could not delete the transaction. Please try again.");
        } finally {
            setProcessingIds(prev => {
                const next = new Set(prev);
                next.delete(deletedTxId);
                return next;
            });
        }
    }, [setRecentTransactions, setReviewTransactions, refreshData]);

    const handleEditClick = useCallback((transaction) => {
        setEditingTransaction(transaction);
    }, []);

    const handleDuplicateClick = useCallback((transaction) => {
        setDuplicateTransaction(transaction);
        setIsAddTxDialogOpen(true);
    }, []);

    // ⚡ Bolt Optimization: Memoize helper functions to prevent re-renders
    const cardMap = useMemo(() => new Map(allCards.map(c => [c.id, c])), [allCards]); // Use allCards here

    const handleViewTransactionDetails = useCallback((transaction) => {
        const cardName = transaction['Card Name'] || (transaction['Card'] && cardMap.get(transaction['Card'][0])?.name);
        setViewingTransaction({ ...transaction, 'Card Name': cardName });
    }, [cardMap]);

    const handleBulkDelete = useCallback(async (transactionIds) => {
        if (!window.confirm(`Are you sure you want to delete ${transactionIds.length} transactions? This action cannot be undone.`)) {
            return;
        }

        setProcessingIds(prev => {
            const next = new Set(prev);
            transactionIds.forEach(id => next.add(id));
            return next;
        });

        try {
            const response = await fetch(`${API_BASE_URL}/transactions/bulk-delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: transactionIds }),
            });

            if (!response.ok) {
                throw new Error('Failed to delete transactions on the server.');
            }

            const idsSet = new Set(transactionIds);

            setMonthlyTransactions(prevTxs => prevTxs.filter(tx => !idsSet.has(tx.id)));
            setLiveTransactions(prev => prev.filter(tx => !idsSet.has(tx.id))); // Optimistic Live Update
            setRecentTransactions(prevRecent => prevRecent.filter(tx => !idsSet.has(tx.id)));
            setReviewTransactions(prevReview => prevReview.filter(tx => !idsSet.has(tx.id)));
            toast.success(`${transactionIds.length} transactions deleted successfully!`);
            refreshData(true, true);
        } catch (error) {
            console.error("Bulk delete failed:", error);
            toast.error("Could not delete transactions. Please try again.");
        } finally {
            setProcessingIds(prev => {
                const next = new Set(prev);
                transactionIds.forEach(id => next.delete(id));
                return next;
            });
        }
    }, [setRecentTransactions, setReviewTransactions, refreshData]);

    // Used for MANUAL edits (when user clicks "Update Transaction" in form)
    // The background sync updates are handled by handleBackgroundSyncSuccess
    const handleTransactionUpdated = useCallback((updatedTransaction) => {
        // Find and replace the transaction in the list for an instant UI update
        setMonthlyTransactions(prevTxs =>
            prevTxs.map(tx => tx.id === updatedTransaction.id ? updatedTransaction : tx)
        );

        // Also update the recent transactions carousel
        setRecentTransactions(prevRecent =>
            prevRecent.map(tx => tx.id === updatedTransaction.id ? updatedTransaction : tx)
        );

        setReviewTransactions(prevReview =>
            prevReview.filter(tx => tx.id !== updatedTransaction.id)
        );

        // Close the edit form ONLY IF we are editing THIS transaction
        if (editingTransaction && editingTransaction.id === updatedTransaction.id) {
            setEditingTransaction(null);
        }

        refreshData(true, true);
    }, [setRecentTransactions, setReviewTransactions, refreshData, editingTransaction]);

    const handleBulkTransactionUpdate = useCallback((updatedTransactions) => {
        if (!updatedTransactions || updatedTransactions.length === 0) return;

        const updatedIds = new Set(updatedTransactions.map(t => t.id));

        // Update Monthly
        setMonthlyTransactions(prev => prev.map(tx => updatedIds.has(tx.id) ? updatedTransactions.find(u => u.id === tx.id) : tx));

        // Update Live
        setLiveTransactions(prev => prev.map(tx => updatedIds.has(tx.id) ? updatedTransactions.find(u => u.id === tx.id) : tx));

        // Update Review
        setReviewTransactions(prev => prev.map(tx => updatedIds.has(tx.id) ? updatedTransactions.find(u => u.id === tx.id) : tx));

        // Update Recent
        setRecentTransactions(prev => prev.map(tx => updatedIds.has(tx.id) ? updatedTransactions.find(u => u.id === tx.id) : tx));

        refreshData(true, true);
    }, [refreshData, setRecentTransactions, setReviewTransactions]);

    // NEW: Optimistic updates from TransactionReview actions
    const handleTransactionReviewUpdate = useCallback((action, txIdOrIds, updatedData) => {
        if (action === 'delete') {
            const idsToDelete = Array.isArray(txIdOrIds) ? new Set(txIdOrIds) : new Set([txIdOrIds]);

            setMonthlyTransactions(prev => prev.filter(tx => !idsToDelete.has(tx.id)));
            setLiveTransactions(prev => prev.filter(tx => !idsToDelete.has(tx.id)));
            setRecentTransactions(prev => prev.filter(tx => !idsToDelete.has(tx.id)));
            setReviewTransactions(prev => prev.filter(tx => !idsToDelete.has(tx.id)));
        } else if (action === 'update' && updatedData) {
            // Update in lists if exists, otherwise append if it matches current view criteria?
            // For simplicity and safety, we mainly update existing items.
            // "Quick Approve" might move it from Review to Main lists if it wasn't there (but usually it is).

            const updateList = (list) => list.map(tx => tx.id === txIdOrIds ? updatedData : tx);

            setMonthlyTransactions(updateList);
            setLiveTransactions(updateList);
            setRecentTransactions(updateList);

            // For Review list, we usually remove it if it's approved/fixed?
            // Or update it if it still needs review?
            // TransactionReview component handles removing it from its own list via optimistic state.
            // But we should sync the prop `reviewTransactions` too.
            // If updatedData.status is 'Review Needed' or similar, keep it.
            // If 'Automated' is false and Match is true, it might not be in "needs-review" anymore.
            // For now, let's assume if we update it here, we update it everywhere.
             setReviewTransactions(prev => prev.map(tx => tx.id === txIdOrIds ? updatedData : tx));
        }

        // We do NOT trigger full refreshData here to keep it instant.
        // The background refresh is triggered by the caller if needed (e.g. onRefresh prop in TransactionReview).
    }, [setRecentTransactions, setReviewTransactions]);



    // We now use availableMonths directly from useCashbackData
    // Removed old statementMonths useMemo.

    // --- NEW: AUTHENTICATION CHECK EFFECT ---

    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                // Use fetch with 'credentials: "include"' to send cookies
                const response = await fetch(`${API_BASE_URL}/verify-auth`, {
                    credentials: 'include'
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.isAuthenticated) {
                        setIsAuthenticated(true);
                    } else {
                        setIsAuthenticated(false);
                    }
                } else {
                    // Fallback for any other non-200 status (though we aim for 200)
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error("Auth check failed:", error);
                setIsAuthenticated(false);
            }
        };

        checkAuthStatus();
    }, []); // Empty dependency array means this runs only once on component mount.



    const fetchMonthlyTransactions = useCallback(async () => {
        if (!activeMonth || activeMonth === 'live') return;

        setIsMonthlyTxLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/transactions?month=${activeMonth}&filterBy=${transactionFilterType}`);
            if (!res.ok) throw new Error('Failed to fetch monthly transactions');
            const data = await res.json();
            setMonthlyTransactions(data);
        } catch (err) {
            console.error(err);
            setMonthlyTransactions([]);
        } finally {
            setIsMonthlyTxLoading(false);
        }
    }, [activeMonth, transactionFilterType]);

    useEffect(() => {
        const isLiveView = activeMonth === 'live';

        // 1. Handle Live View fetching
        if (isLiveView && activeView === 'transactions') {
             // Only fetch if empty to avoid refetching on every tab switch,
             // unless we want to ensure freshness.
             // Given 'recentTransactions' might be stale or partial, we fetch fresh.
             if (liveTransactions.length === 0) {
                 fetchLiveTransactions();
             }
        }
        // 2. Handle Historical View fetching
        else if (activeView === 'transactions') {
            fetchMonthlyTransactions();
        }
    }, [activeMonth, activeView, fetchLiveTransactions, fetchMonthlyTransactions, liveTransactions.length]);

    const handleGlobalRefresh = useCallback(() => {
        fetchReviewTransactions();
        if (activeMonth === 'live') {
            fetchLiveTransactions(null, liveSearchTerm, false);
        } else {
            fetchMonthlyTransactions();
        }
        // Skip static data fetch for smoother UX in transaction review
        refreshData(true, true);
    }, [fetchReviewTransactions, activeMonth, fetchLiveTransactions, liveSearchTerm, fetchMonthlyTransactions, refreshData]);

    // --------------------------
    // 2) HELPERS & CALCULATIONS
    // --------------------------

    // --- UTILITIES ---
    // ⚡ Bolt Optimization: Memoize this function to prevent re-renders of TransactionsList
    const mccName = useCallback((code) => mccMap[code]?.vn || "Unknown", [mccMap]);

    // sortedCards MOVED TO CardsTab
    // const sortedCards = useMemo(() => { ... }, [allCards]);

    // --- MEMOIZED DATA PROCESSING ---

    const cardColorMap = useMemo(() => {
        const map = new Map();
        // Sort cards by name to ensure color assignment is stable
        const sortedCards = [...allCards].sort((a, b) => a.name.localeCompare(b.name)); // Use allCards here
        sortedCards.forEach((card, index) => {
            map.set(card.name, COLORS[index % COLORS.length]);
        });
        return map;
    }, [allCards]);


    const {
        liveChartPeriod, setLiveChartPeriod,
        displayStats, overviewChartStats,
        liveOverviewChartStats, cardPerformanceData
    } = useDashboardStats({
        activeMonth, monthlySummary, liveSummary,
        cards, recentTransactions, monthlyTransactions
    });

    // cardsTabStats MOVED TO CardsTab
    // const cardsTabStats = useMemo(() => { ... }, [allCards]);

    // calculateFeeCycleProgress MOVED TO lib/date.js

    // --- NEW LOADING STATE FOR AUTH CHECK ---
    if (isAuthenticated === null) {
        return (
            <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Verifying session...</p>
            </div>
        );
    }

    // If the user is not authenticated, show the login screen.
    if (!isAuthenticated) {
        return <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />;
    }

    if (!isShellReady) {
        return <AppSkeleton />;
    }

    if (error) {
        return (
            <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40 p-4">
                <div className="flex flex-col items-center text-center max-w-md">
                    <AlertTriangle className="h-12 w-12 text-destructive" />
                    <h2 className="mt-4 text-2xl font-semibold">Oops! Something went wrong.</h2>
                    <p className="mt-2 text-muted-foreground">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <TooltipProvider>
        <div className="flex min-h-screen w-full bg-muted/40">
            <Toaster richColors position="top-center" />
            <AppSidebar
                activeView={activeView}
                setActiveView={setActiveView}
                isCollapsed={isSidebarCollapsed}
                setIsCollapsed={setIsSidebarCollapsed}
                handleLogout={handleLogout}
                refreshData={refreshData}
                openFinder={() => setIsFinderOpen(true)}
            />
            <div className={cn(
                "flex flex-col w-full transition-all duration-300 ease-in-out",
                isSidebarCollapsed ? "md:pl-16" : "md:pl-56"
            )}>
            <DashboardHeader
                activeView={activeView}
                setActiveView={setActiveView}
                isFinderOpen={isFinderOpen}
                setIsFinderOpen={setIsFinderOpen}
                handleLogout={handleLogout}
                refreshData={refreshData}
                needsSyncing={needsSyncing}
                isSyncing={isSyncing}
                isSyncingSheetOpen={isSyncingSheetOpen}
                setIsSyncingSheetOpen={setIsSyncingSheetOpen}
                activeMonth={activeMonth}
                setActiveMonth={setActiveMonth}
                availableMonths={availableMonths}
                isAddTxDialogOpen={isAddTxDialogOpen}
                setIsAddTxDialogOpen={setIsAddTxDialogOpen}
                duplicateTransaction={duplicateTransaction}
                editingTransaction={editingTransaction}
                setEditingTransaction={setEditingTransaction}
                addToQueue={addToQueue}
                handleTransactionAdded={handleTransactionAdded}
                handleTransactionUpdated={handleTransactionUpdated}
                isDesktop={isDesktop}
                addTxSheetSide={addTxSheetSide}
                cards={cards}
                allCategories={allCategories}
                definitions={definitions}
                cashbackRules={cashbackRules}
                monthlyCashbackCategories={monthlyCashbackCategories}
                mccMap={mccMap}
                commonVendors={commonVendors}
                monthlySummary={monthlySummary}
                monthlyCategorySummary={monthlyCategorySummary}
                getCurrentCashbackMonthForCard={getCurrentCashbackMonthForCard}
                navItems={navItems}
            />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">

                {activeView === 'overview' && (
                    <div className="space-y-4 pt-4">
                        {/* --- 1. UNIFIED DYNAMIC COMPONENTS --- */}
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* LEFT COLUMN */}
                            <div className="lg:w-7/12 flex flex-col gap-4">
                                <StatCards stats={displayStats} currencyFn={currency} isLoading={isDashboardLoading} />

                                <CardSpendsCap
                                    cards={cards}
                                    rules={rules}
                                    activeMonth={activeMonth}
                                    monthlySummary={monthlySummary}
                                    monthlyCategorySummary={monthlyCategorySummary}
                                    currencyFn={currency}
                                    getCurrentCashbackMonthForCard={getCurrentCashbackMonthForCard}
                                    onEditTransaction={handleEditClick}
                                    onTransactionDeleted={handleTransactionDeleted}
                                    onBulkDelete={handleBulkDelete}
                                    onViewTransactionDetails={handleViewTransactionDetails}
                                    cardMap={cardMap}
                                    isLoading={isDashboardLoading}
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
                                    isLoading={isDashboardLoading}
                                />

                                {/* RecentTransactions is second, and will fill remaining space */}
                                <RecentTransactions
                                    transactions={recentTransactions}
                                    cardMap={cardMap}
                                    currencyFn={currency}
                                    isLoading={isDashboardLoading}
                                />
                            </div>
                        </div>

                        {/* --- 3. UNIFIED CONTEXTUAL COMPONENTS --- */}

                        <div className="grid gap-4">
                            <CurrentCashflowChart
                                data={cardPerformanceData}
                                cards={cards}
                                currencyFn={currency}
                            />
                        </div>

                        <div className="mt-4">
                            <CummulativeResultsChart
                                data={cardPerformanceData}
                                cards={cards}
                                currencyFn={currency}
                                cardColorMap={cardColorMap}
                            />
                        </div>

                        {/* --- 4. SPEND AND CASHBACK BY CARD CHARTS --- */}
                        <div className="grid gap-4 mt-4">
                            <CombinedCardStatsChart
                                data={activeMonth === 'live' ? liveOverviewChartStats : overviewChartStats}
                                currencyFn={currency}
                                isLiveView={activeMonth === 'live'}
                                period={liveChartPeriod}
                                onPeriodChange={setLiveChartPeriod}
                            />
                        </div>
                    </div>
                )}

                {activeView === 'transactions' && (
                    <div className="pt-4 space-y-4">
                        <TransactionReview
                            transactions={reviewTransactions}
                            isLoading={reviewLoading}
                            onRefresh={handleGlobalRefresh}
                            cards={cards}
                            categories={allCategories}
                            rules={cashbackRules}
                            getCurrentCashbackMonthForCard={getCurrentCashbackMonthForCard}
                            onEditTransaction={handleEditClick}
                            isDesktop={isDesktop}
                            mccMap={mccMap}
                            setReviewTransactions={setReviewTransactions}
                            onReviewUpdate={handleTransactionReviewUpdate}
                        />
                        <TransactionsList
                            isDesktop={isDesktop}
                            transactions={activeMonth === 'live' ? liveTransactions : monthlyTransactions}
                            isLoading={activeMonth === 'live' ? isLiveLoading : isMonthlyTxLoading}
                            activeMonth={activeMonth}
                            cardMap={cardMap}
                            categories={allCategories}
                            mccNameFn={mccName}
                            mccMap={mccMap}
                            allCards={cards}
                            filterType={transactionFilterType}
                            onFilterTypeChange={setTransactionFilterType}
                            statementMonths={availableMonths}
                            onTransactionDeleted={handleTransactionDeleted}
                            onEditTransaction={handleEditClick}
                            onDuplicateTransaction={handleDuplicateClick}
                            onBulkDelete={handleBulkDelete}
                            onBulkUpdate={handleBulkTransactionUpdate}
                            onViewDetails={handleViewTransactionDetails}
                            fmtYMShortFn={fmtYMShort}
                            rules={cashbackRules}
                            getCurrentCashbackMonthForCard={getCurrentCashbackMonthForCard}
                            processingIds={processingIds}
                            syncingIds={syncingIds}

                            // Server-side props
                            isServerSide={activeMonth === 'live'}
                            onLoadMore={handleLiveLoadMore}
                            hasMore={liveHasMore}
                            onSearch={handleLiveSearch}
                            onSortChange={handleLiveSortChange}
                            onFilterChange={handleLiveFilterChange}
                            dateRange={liveDateRange}
                            onDateRangeChange={handleLiveDateRangeChange}
                            isAppending={activeMonth === 'live' ? isLiveAppending : false}
                        />
                    </div>
                )}

                {activeView === 'cards' && (
                    <CardsTab
                        cards={cards}
                        allCards={allCards}
                        monthlySummary={monthlySummary}
                        activeMonth={activeMonth}
                        rules={rules}
                        currencyFn={currency}
                        fmtYMShortFn={fmtYMShort}
                        mccMap={mccMap}
                        isDesktop={isDesktop}
                        onUpdateCard={updateCard}
                        onUpdateRule={updateRule}
                    />
                )}

                {activeView === 'cashback' && (
                    <div className="space-y-4 pt-4">
                        <CashbackTracker
                            cards={cards}
                            monthlySummary={monthlySummary}
                            onUpdate={() => refreshData(true, true)}
                            onEditTransaction={handleEditClick}
                            onTransactionDeleted={handleTransactionDeleted}
                            onBulkDelete={handleBulkDelete}
                            onViewTransactionDetails={handleViewTransactionDetails}
                            cardMap={cardMap}
                            rules={cashbackRules}
                            monthlyCategorySummary={monthlyCategorySummary}
                        />
                    </div>
                )}

                {activeView === 'payments' && (
                    <div className="space-y-4 pt-4">
                        <PaymentsTab
                            cards={allCards} // Pass allCards (including Closed) to Payments tab
                            monthlySummary={monthlySummary}
                            currencyFn={currency}
                            fmtYMShortFn={fmtYMShort}
                            daysLeftFn={calculateDaysLeft}
                            onViewTransactions={handleViewTransactions}
                        />
                    </div>
                )}

                {activeView === 'settings' && (
                    <div className="space-y-4 pt-4">
                        <SettingsTab />
                    </div>
                )}
            </main>

            {/* 4. RENDER THE DIALOG COMPONENT */}

            <BestCardFinderDialog
                isOpen={isFinderOpen}
                onOpenChange={setIsFinderOpen}
                allCards={cards}
                allRules={rules}
                mccMap={mccMap}
                monthlySummary={monthlySummary}
                monthlyCategorySummary={monthlyCategorySummary}
                activeMonth={activeMonth}
                getCurrentCashbackMonthForCard={getCurrentCashbackMonthForCard}
                isDesktop={isDesktop}
            />
            <SharedTransactionsDialog
                isOpen={!!dialogDetails}
                onClose={() => setDialogDetails(null)}
                transactions={dialogTransactions}
                title={dialogDetails ? `Transactions - ${dialogDetails.cardName}` : 'Transactions'}
                description={dialogDetails ? `Viewing statement for ${dialogDetails.monthLabel}` : ''}
                currencyFn={currency}
                isLoading={isDialogLoading}
                cardMap={cardMap}
                rules={cashbackRules}
                allCards={cards}
                monthlyCategorySummary={monthlyCategorySummary}
                onEdit={handleEditClick}
                onDuplicate={handleDuplicateClick}
                onDelete={handleTransactionDeleted}
                onBulkDelete={handleBulkDelete}
            />
            <TransactionDetailSheet
                transaction={viewingTransaction}
                isOpen={!!viewingTransaction}
                onClose={() => setViewingTransaction(null)}
                onEdit={(tx) => {
                    setViewingTransaction(null);
                    handleEditClick(tx);
                }}
                onDuplicate={handleDuplicateClick}
                onDelete={(id, name) => {
                    setViewingTransaction(null);
                    handleTransactionDeleted(id, name);
                }}
                currencyFn={currency}
                allCards={cards}
                rules={cashbackRules}
                monthlyCategorySummary={monthlyCategorySummary}
            />
            <SyncQueueSheet
                isOpen={isSyncingSheetOpen}
                onOpenChange={setIsSyncingSheetOpen}
                queue={needsSyncing}
                onRetry={handleRetrySync}
                onRemove={handleRemoveFromSync}
                isSyncing={isSyncing}
            />
        </div>
        </div>
        </TooltipProvider>
    );
}

// --------------------------
// 3) UI SUB-COMPONENTS
// --------------------------
import { useMemo, useState } from 'react';
import { getMetricSparkline } from '../lib/stats';
import { getTodaysMonth, getPreviousMonth, getCurrentCashbackMonthForCard } from '../lib/date';
import { fmtYMShort } from '../lib/formatters';

export default function useDashboardStats({
    activeMonth,
    monthlySummary,
    liveSummary,
    cards,
    recentTransactions,
    monthlyTransactions
}) {
    const [liveChartPeriod, setLiveChartPeriod] = useState('1M'); // '12M', '6M', '1M', 'LM', '1W'

    // --- NEW: CONSOLIDATED STATS LOGIC ---
    // This single hook provides all stats for the StatCards,
    // for both 'live' and 'historical' views.
    const displayStats = useMemo(() => {
        const today = getTodaysMonth(); // e.g., '2024-07'
        const lastCompletedMonth = getPreviousMonth(today); // e.g., '2024-06'

        // --- Helper to get data for a specific month ---
        const getMonthStats = (month) => {
            if (!month) return { totalSpend: 0, totalCashback: 0, effectiveRate: 0 };
            const monthData = monthlySummary.filter(s => s.month === month);
            const totalSpend = monthData.reduce((acc, curr) => acc + (curr.spend || 0), 0);
            const totalCashback = monthData.reduce((acc, curr) => acc + (curr.cashback || 0), 0);
            const effectiveRate = totalSpend > 0 ? totalCashback / totalSpend : 0;
            return { totalSpend, totalCashback, effectiveRate };
        };

        // --- Calculate sparkline data (last 6 completed months) ---
        const sparklineBaseMonth = activeMonth === 'live' ? lastCompletedMonth : activeMonth;
        const spendSparkline = getMetricSparkline(monthlySummary, sparklineBaseMonth, 6, 'spend');
        const cashbackSparkline = getMetricSparkline(monthlySummary, sparklineBaseMonth, 6, 'cashback');
        const rateSparkline = getMetricSparkline(monthlySummary, sparklineBaseMonth, 6, 'cashback')
            .map((cb, i) => {
                const spend = spendSparkline[i];
                return spend > 0 ? cb / spend : 0;
            });


        // --- CASE 1: LIVE VIEW ---
        if (activeMonth === 'live') {
            const { totalSpend: prevMonthSpend, totalCashback: prevMonthCashback, effectiveRate: prevMonthRate } = getMonthStats(lastCompletedMonth);

            // Assuming liveSummary is passed from useCashbackData
            const totalSpend = liveSummary?.liveSpend || 0;
            const totalCashback = liveSummary?.liveCashback || 0;
            const effectiveRate = totalSpend > 0 ? totalCashback / totalSpend : 0;

            return {
                label: "Latest", // <-- Changed from "Live"
                totalSpend,
                totalCashback,
                effectiveRate,
                prevMonthSpend,
                prevMonthCashback,
                prevMonthRate,
                spendSparkline,
                cashbackSparkline,
                rateSparkline
            };
        }

        // --- CASE 2: HISTORICAL VIEW ---
        const { totalSpend, totalCashback, effectiveRate } = getMonthStats(activeMonth);
        const prevMonth = getPreviousMonth(activeMonth);
        const { totalSpend: prevMonthSpend, totalCashback: prevMonthCashback, effectiveRate: prevMonthRate } = getMonthStats(prevMonth);

        return {
            label: fmtYMShort(activeMonth),
            totalSpend,
            totalCashback,
            effectiveRate,
            prevMonthSpend,
            prevMonthCashback,
            prevMonthRate,
            spendSparkline,
            cashbackSparkline,
            rateSparkline
        };

    }, [activeMonth, monthlySummary, liveSummary]);


    const overviewChartStats = useMemo(() => {
        const monthData = monthlySummary.filter(s => s.month === activeMonth);

        const combinedData = cards.map(card => {
            const summary = monthData.find(s => s.cardId === card.id);
            return {
                name: card.name,
                spend: summary?.spend || 0,
                cashback: summary?.cashback || 0
            };
        });

        return combinedData;
    }, [activeMonth, monthlySummary, cards]);

    // --- NEW: Live Chart Stats (12M, 6M, 1M, LM, 1W) ---
    const liveOverviewChartStats = useMemo(() => {
        if (activeMonth !== 'live') return [];

        const spendMap = new Map();
        const cashbackMap = new Map();

        cards.forEach(card => {
            spendMap.set(card.id, 0);
            cashbackMap.set(card.id, 0);
        });

        if (liveChartPeriod === '1W') {
            // For 1W, we filter transactions from the last 7 days.
            // Using recentTransactions (and maybe monthlyTransactions if needed, but recent usually has the latest).
            // Combine both to ensure we have recent ones, avoiding duplicates.
            const allRecent = [...recentTransactions, ...monthlyTransactions];
            const uniqueTxs = Array.from(new Map(allRecent.map(tx => [tx.id, tx])).values());

            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            sevenDaysAgo.setHours(0, 0, 0, 0);

            uniqueTxs.forEach(tx => {
                const txDate = new Date(tx['Transaction Date']);
                if (txDate >= sevenDaysAgo && tx['Card']) {
                    const cardId = tx['Card'][0];
                    if (spendMap.has(cardId)) {
                        spendMap.set(cardId, spendMap.get(cardId) + (tx.Amount || 0));
                        cashbackMap.set(cardId, cashbackMap.get(cardId) + (tx.Cashback || 0));
                    }
                }
            });
        } else {
            // For month-based periods, we use monthlySummary
            cards.forEach(card => {
                const currentMonth = getCurrentCashbackMonthForCard(card);
                let targetMonths = [];

                if (liveChartPeriod === '1M') {
                    targetMonths = [currentMonth];
                } else if (liveChartPeriod === 'LM') {
                    targetMonths = [getPreviousMonth(currentMonth)];
                } else {
                    const count = liveChartPeriod === '6M' ? 6 : 12;
                    let m = currentMonth;
                    for (let i = 0; i < count; i++) {
                        targetMonths.push(m);
                        m = getPreviousMonth(m);
                    }
                }

                // Sum up for target months
                targetMonths.forEach(m => {
                    const summary = monthlySummary.find(s => s.month === m && s.cardId === card.id);
                    if (summary) {
                        spendMap.set(card.id, spendMap.get(card.id) + (summary.spend || 0));
                        cashbackMap.set(card.id, cashbackMap.get(card.id) + (summary.cashback || 0));
                    }
                });
            });
        }

        const combinedData = cards.map(card => ({
            name: card.name,
            spend: spendMap.get(card.id) || 0,
            cashback: cashbackMap.get(card.id) || 0
        }));

        return combinedData;
    }, [activeMonth, liveChartPeriod, cards, monthlySummary, recentTransactions, monthlyTransactions]);

    const cardPerformanceData = useMemo(() => {
        const allMonths = [...new Set(monthlySummary.map(s => s.month))].sort();
        const summaryMap = new Map();
        monthlySummary.forEach(s => {
            const key = `${s.month}-${s.cardId}`;
            summaryMap.set(key, s);
        });

        return allMonths.map(month => {
            const monthData = { month: fmtYMShort(month) };
            cards.forEach(card => {
                const key = `${month}-${card.id}`;
                const summary = summaryMap.get(key);

                // THIS IS THE FIX: Default to null instead of 0
                monthData[`${card.name} Spend`] = summary ? summary.spend : null;
                monthData[`${card.name} Cashback`] = summary ? summary.cashback : null;
            });
            return monthData;
        });
    }, [monthlySummary, cards]);

    return {
        liveChartPeriod,
        setLiveChartPeriod,
        displayStats,
        overviewChartStats,
        liveOverviewChartStats,
        cardPerformanceData
    };
}
import { useState, useEffect } from 'react';

export default function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { getCurrentCashbackMonthForCard, getTodaysMonth, getPastNMonths } from '../lib/date'; // This import now gets the correct function


export default function useCashbackData(isAuthenticated) {

    // --- STATE MANAGEMENT ---
    const [allCards, setAllCards] = useState([]); // NEW: Stores ALL cards, including Closed
    const [cards, setCards] = useState([]); // Stores only Active/Frozen cards (filtered)
    const [rules, setRules] = useState([]);
    const [availableMonths, setAvailableMonths] = useState([]); // NEW: Stores all available statement months
    const [monthlySummary, setMonthlySummary] = useState([]);
    const [mccMap, setMccMap] = useState({});
    const [monthlyCategorySummary, setMonthlyCategorySummary] = useState([]);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [commonVendors, setCommonVendors] = useState([]);
    const [reviewTransactions, setReviewTransactions] = useState([]);
    const [reviewLoading, setReviewLoading] = useState(false); // Separate loading state
    const [definitions, setDefinitions] = useState({ categories: [], methods: [], paidFor: [], foreignCurrencies: [], subCategories: [] });

    // --- NEW LOADING STATES ---
    const [isShellReady, setIsShellReady] = useState(false); // Critical data for UI shell
    const [isDashboardLoading, setIsDashboardLoading] = useState(true); // Data for dashboard content

    // Kept for backwards compatibility if needed, or mapped to !isShellReady
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- DATA FETCHING ---
    const fetchData = useCallback(async (isSilent = false, skipStatic = false) => {
        let hasShellLoaded = false; // Local variable to track shell loading status

        if (!isSilent) {
            setLoading(true);
            setIsDashboardLoading(true);
            setIsShellReady(false);
        }
        setError(null);

        try {
            // --- STAGE 1: CRITICAL SHELL DATA ---
            // Fetch minimal data required to render the Sidebar, Header, and basic actions (Add Tx, Finder)
            if (!skipStatic) {
                const [cardsRes, rulesRes, mccRes, definitionsRes, monthsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/cards?includeClosed=true`),
                    fetch(`${API_BASE_URL}/rules`),
                    fetch(`${API_BASE_URL}/mcc-codes`),
                    fetch(`${API_BASE_URL}/definitions`),
                    fetch(`${API_BASE_URL}/available-months`),
                ]);

                if (!cardsRes.ok || !rulesRes.ok || !mccRes.ok || !definitionsRes.ok || !monthsRes.ok) {
                    throw new Error('Failed to fetch critical shell data.');
                }

                const cardsData = await cardsRes.json();
                const rulesData = await rulesRes.json();
                const mccData = await mccRes.json();
                const definitionsData = await definitionsRes.json();
                const monthsData = await monthsRes.json();

                setAllCards(cardsData);
                setCards(cardsData.filter(c => c.status !== 'Closed'));
                setRules(rulesData);
                setMccMap(mccData.mccDescriptionMap || {});
                setDefinitions(definitionsData);
                setAllCategories(definitionsData.categories || []);
                setAvailableMonths(monthsData || []);

                // Shell is ready! The UI can render now.
                hasShellLoaded = true;
                if (!isSilent) {
                    setIsShellReady(true);
                    setLoading(false); // Dismiss full-screen skeleton
                }
            } else {
                // If skipping static, we assume shell is already loaded or we don't block
                hasShellLoaded = true;
            }

            // --- STAGE 2: DASHBOARD CONTENT ---
            // Fetch data needed for Overview charts, StatCards, and Activity Feed
            const currentMonth = getTodaysMonth();
            const pastMonths = getPastNMonths(currentMonth, 3);
            const monthsToFetch = [...new Set([...pastMonths, currentMonth])].join(',');

            // Limit initial monthly summary fetch to the last 12 months for performance
            const past12Months = getPastNMonths(currentMonth, 11);
            const monthsToFetchSummary = [...new Set([...past12Months, currentMonth])].join(',');

            // MOVED: monthly-category-summary is now fetched here to prevent empty state flash in widgets
            const [monthlyRes, recentTxRes, monthlyCatRes] = await Promise.all([
                fetch(`${API_BASE_URL}/monthly-summary?months=${monthsToFetchSummary}`),
                fetch(`${API_BASE_URL}/recent-transactions`),
                fetch(`${API_BASE_URL}/monthly-category-summary?months=${monthsToFetch}`),
            ]);

             if (!monthlyRes.ok || !recentTxRes.ok || !monthlyCatRes.ok) {
                throw new Error('Failed to fetch dashboard content.');
            }

            const monthlyData = await monthlyRes.json();
            const recentTxData = await recentTxRes.json();
            const monthlyCatData = await monthlyCatRes.json();

            setMonthlySummary(monthlyData);
            setRecentTransactions(recentTxData);
            setMonthlyCategorySummary(monthlyCatData);

            if (!isSilent) {
                setIsDashboardLoading(false); // Dashboard widgets can now replace skeletons
            }

            // --- STAGE 3: BACKGROUND DATA ---
            // Fetch heavy or secondary data that isn't immediately critical
            const [commonVendorsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/common-vendors`),
            ]);

            if (commonVendorsRes.ok) {
                const commonVendorsData = await commonVendorsRes.json();
                setCommonVendors(commonVendorsData);
            }

        } catch (err) {
            setError("Failed to fetch data. Please check the backend.");
            console.error(err);
            if (isSilent) {
                toast.error("Failed to refresh data.");
            }
            // Even if Stage 2/3 fails, ensure we unblock the UI if Stage 1 succeeded (using local variable)
            if (hasShellLoaded) {
                 setIsShellReady(true);
                 setLoading(false);
                 setIsDashboardLoading(false);
            }
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // New dedicated function to lazy load category summaries for a specific month
    // Renamed and expanded to fetch both summary types for a specific month
    const fetchSummariesForMonth = useCallback(async (month) => {
        try {
            const [catRes, summaryRes] = await Promise.all([
                fetch(`${API_BASE_URL}/monthly-category-summary?months=${month}`),
                fetch(`${API_BASE_URL}/monthly-summary?months=${month}`)
            ]);

            if (!catRes.ok || !summaryRes.ok) throw new Error('Failed to fetch summaries');

            const newCatData = await catRes.json();
            const newSummaryData = await summaryRes.json();

            setMonthlyCategorySummary(prevData => {
                if (!newCatData || newCatData.length === 0) return prevData;
                const existingMap = new Map(prevData.map(item => [item.id, item]));
                let changed = false;
                newCatData.forEach(item => {
                    if (!existingMap.has(item.id) || JSON.stringify(existingMap.get(item.id)) !== JSON.stringify(item)) {
                        existingMap.set(item.id, item);
                        changed = true;
                    }
                });
                return changed ? Array.from(existingMap.values()) : prevData;
            });

            setMonthlySummary(prevData => {
                if (!newSummaryData || newSummaryData.length === 0) return prevData;
                const existingMap = new Map(prevData.map(item => [item.id, item]));
                let changed = false;
                newSummaryData.forEach(item => {
                    if (!existingMap.has(item.id) || JSON.stringify(existingMap.get(item.id)) !== JSON.stringify(item)) {
                        existingMap.set(item.id, item);
                        changed = true;
                    }
                });
                return changed ? Array.from(existingMap.values()) : prevData;
            });
        } catch (err) {
            console.error(`Failed to fetch summaries for ${month}:`, err);
            toast.error("Could not load summary data for the selected month.");
        }
    }, []);

    // New dedicated function for lazy-loading review transactions
    const fetchReviewTransactions = useCallback(async () => {
        setReviewLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/transactions/needs-review`);
            if (!res.ok) throw new Error('Failed to fetch review transactions');
            const data = await res.json();
            setReviewTransactions(data);
        } catch (err) {
            console.error("Failed to fetch review transactions:", err);
            toast.error("Could not load transactions for review.");
        } finally {
            setReviewLoading(false);
        }
    }, []);

    // --- This effect triggers the initial data fetch ---
    useEffect(() => {
        // Only fetch data if the user is authenticated.
        if (isAuthenticated) {
            fetchData();
        } else {
            // If the user logs out, we can clear the data and set loading to false.
            setLoading(false);
            setIsShellReady(false);
        }
    }, [isAuthenticated, fetchData]); // It runs when auth status changes.

    const liveSummary = useMemo(() => {
        // Wait until both cards and summary data are loaded
        if (!monthlySummary || monthlySummary.length === 0 || !cards || cards.length === 0) {
            return { liveSpend: 0, liveCashback: 0 };
        }

        // --- NEW "STATEMENT CYCLE" LOGIC ---

        // Create a fast lookup map for summaries
        const summaryMap = new Map();
        monthlySummary.forEach(s => {
            const key = `${s.cardId}-${s.month}`;
            summaryMap.set(key, s);
        });

        let totalSpend = 0;
        let totalCashback = 0;

        // Iterate over each card to find its current statement cycle
        cards.forEach(card => {
            // 1. Get the card's specific in-progress month (e.g., "202410" or "202411")
            const currentMonthForCard = getCurrentCashbackMonthForCard(card);

            // 2. Find the summary for that specific card and that specific month
            const summary = summaryMap.get(`${card.id}-${currentMonthForCard}`);

            // 3. Add its spend and cashback to the totals
            if (summary) {
                totalSpend += summary.spend || 0;
                totalCashback += summary.cashback || 0;
            }
        });

        return {
            liveSpend: totalSpend,
            liveCashback: totalCashback,
        };
        // Add `cards` to the dependency array
    }, [monthlySummary, cards]);

    // --- Return everything the component needs ---
    return {
        // Data states
        cards,    // Filtered (Active/Frozen)
        allCards, // Complete list (including Closed)
        rules,
        monthlySummary,
        liveSummary, // This is now calculated with the new logic
        mccMap,
        monthlyCategorySummary,
        recentTransactions,
        allCategories,
        commonVendors,
        reviewTransactions,

        // Derived data, calculated on demand and memoized for performance
        cashbackRules: useMemo(() => rules.map(r => ({ ...r, name: r.ruleName })), [rules]),
        monthlyCashbackCategories: useMemo(() => monthlyCategorySummary.map(c => ({ ...c, name: c.summaryId })), [monthlyCategorySummary]),

        // State setters for optimistic UI updates
        setRecentTransactions,
        setReviewTransactions,

        // Status states
        loading, // Kept for backward compatibility, same as !isShellReady
        isShellReady, // NEW: Use this to unblock the main UI
        isDashboardLoading, // NEW: Use this for widget loading skeletons
        error,
        reviewLoading,

        // Update Helpers
        updateCard: (updatedCard) => {
            setAllCards(prev => prev.map(c => c.id === updatedCard.id ? updatedCard : c));
            setCards(prev => prev.map(c => c.id === updatedCard.id ? updatedCard : c));
        },
        updateRule: (ruleId, newStatus) => {
            setRules(prev => prev.map(r => r.id === ruleId ? { ...r, status: newStatus } : r));
        },

        // Action
        refreshData: fetchData, // Provide the fetch function under a clearer name
        fetchReviewTransactions,
        fetchSummariesForMonth, // Expose the new function
        definitions,
        availableMonths,
    };
}
import { useState, useEffect } from 'react';

/**
 * A custom React hook that tracks the state of a CSS media query.
 * @param {string} query - The media query string to watch (e.g., "(min-width: 768px)").
 * @returns {boolean} - Returns true if the media query matches, otherwise false.
 */
const useMediaQuery = (query) => {
    // State to store whether the media query matches or not.
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        // Create a MediaQueryList object.
        const media = window.matchMedia(query);

        // Update the state with the initial value on mount.
        if (media.matches !== matches) {
            setMatches(media.matches);
        }

        // Create a listener function to update the state on change.
        const listener = () => {
            setMatches(media.matches);
        };

        // Add the listener for changes to the media query state.
        media.addEventListener('change', listener);

        // Cleanup function to remove the listener when the component unmounts.
        return () => {
            media.removeEventListener('change', listener);
        };
    }, [matches, query]); // Re-run the effect if the query string changes.

    return matches;
};

export default useMediaQuery;
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { getCurrentCashbackMonthForCard } from '../lib/date';

export default function useTransactionSync({ cards, monthlySummary, monthlyCategorySummary, onSyncSuccess }) {
    const [queue, setQueue] = useState([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isSheetOpen, setSheetOpen] = useState(false);

    // Load queue from localStorage on mount
    useEffect(() => {
        const storedQueue = localStorage.getItem('needsSyncing');
        if (storedQueue) {
            try {
                setQueue(JSON.parse(storedQueue));
            } catch (e) {
                console.error("Failed to parse sync queue", e);
            }
        }
    }, []);

    // Save queue to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('needsSyncing', JSON.stringify(queue));
    }, [queue]);

    // Background Sync Loop
    useEffect(() => {
        const syncTransactions = async () => {
            setIsSyncing(true);

            try {
                // Iterate through a copy of the queue to avoid issues if state changes mid-loop
                // However, we only process one at a time and rely on the latest state for the next iteration?
                // Actually, the loop iterates over the `queue` captured in closure.
                // We should re-check status inside loop if we were doing parallel, but here serial is fine.
                
                // We only want to process pending items.
                const pendingItems = queue.filter(t => t.status === 'pending');

                for (const transaction of pendingItems) {
                    try {
                        let finalSummaryId = null;

                        // --- Summary Logic ---
                        const cardId = transaction['Card'] ? transaction['Card'][0] : null;
                        const ruleId = transaction['Applicable Rule'] ? transaction['Applicable Rule'][0] : null;
                        const cardForTx = cardId ? cards.find(c => c.id === cardId) : null;

                        if (ruleId && cardForTx) {
                            const cbMonth = getCurrentCashbackMonthForCard(cardForTx, transaction['Transaction Date']);

                            // Check if we need to create a summary.
                            // Note: ideally we should check if it already exists in `monthlySummary` prop to avoid API call,
                            // but the logic in Dashboard was to always call /api/summaries which presumably handles "get or create".
                            // For safety/consistency with existing logic, we keep the API call.
                            const summaryResponse = await fetch(`${API_BASE_URL}/summaries`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    cardId: cardId,
                                    month: cbMonth,
                                    ruleId: ruleId
                                }),
                            });

                            if (!summaryResponse.ok) throw new Error('Failed to create/fetch monthly summary.');
                            const newSummary = await summaryResponse.json();
                            finalSummaryId = newSummary.id;
                        }

                        // --- API Payload Construction ---
                        const apiPayload = {
                            merchant: transaction['Transaction Name'],
                            amount: transaction['Amount'],
                            date: transaction['Transaction Date'],
                            cardId: cardId,
                            category: transaction['Category'],
                            mccCode: transaction['MCC Code'],
                            merchantLookup: transaction['merchantLookup'],
                            applicableRuleId: ruleId,
                            cardSummaryCategoryId: finalSummaryId,
                            notes: transaction['notes'],
                            otherDiscounts: transaction['otherDiscounts'],
                            otherFees: transaction['otherFees'],
                            foreignCurrencyAmount: transaction['foreignCurrencyAmount'],
                            exchangeRate: transaction['exchangeRate'],
                            foreignCurrency: transaction['foreignCurrency'],
                            conversionFee: transaction['conversionFee'],
                            paidFor: transaction['paidFor'],
                            subCategory: transaction['subCategory'],
                            billingDate: transaction['billingDate'],
                            method: transaction['Method'],
                        };

                        const isNewTransaction = transaction.id.toString().includes('T') && transaction.id.toString().includes('Z'); // Simple check for temp ID

                        let response;
                        if (isNewTransaction) {
                            response = await fetch(`${API_BASE_URL}/transactions`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(apiPayload),
                            });
                        } else {
                            response = await fetch(`${API_BASE_URL}/transactions/${transaction.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(apiPayload),
                            });
                        }

                        if (!response.ok) {
                            const errorBody = await response.json().catch(() => ({}));
                            throw new Error(errorBody.error || 'Server Error');
                        }

                        const syncedTransaction = await response.json();

                        // Success! Remove from queue.
                        setQueue(prevQueue => prevQueue.filter(t => t.id !== transaction.id));

                        // Trigger success callback (updates UI)
                        if (onSyncSuccess) {
                            onSyncSuccess(syncedTransaction, transaction.id);
                        }

                        toast.success(`Synced "${syncedTransaction['Transaction Name'] || 'Transaction'}"`);

                    } catch (error) {
                        console.error('Error syncing transaction:', error);
                        // Mark as error in queue
                        setQueue(prevQueue =>
                            prevQueue.map(t => t.id === transaction.id ? { ...t, status: 'error', errorMessage: error.message } : t)
                        );
                    }
                }
            } finally {
                setIsSyncing(false);
            }
        };

        // Trigger sync if there are pending items and we aren't already syncing
        if (queue.some(t => t.status === 'pending') && !isSyncing) {
            syncTransactions();
        }
    }, [queue, isSyncing, cards, monthlySummary, onSyncSuccess]);


    const addToQueue = useCallback((transaction) => {
        const item = { ...transaction, status: 'pending' };
        setQueue(prev => [...prev, item]);

        // Optionally open the sheet if user wants visibility, but usually we keep it background unless error.
        // User requested "sleek SyncQueueSheet", usually background sync is invisible unless error.
        // We won't auto-open.
    }, []);

    const retry = useCallback((id) => {
        setQueue(prev => prev.map(t => t.id === id ? { ...t, status: 'pending' } : t));
    }, []);

    const remove = useCallback((id) => {
        setQueue(prev => prev.filter(t => t.id !== id));
    }, []);

    return {
        queue,
        addToQueue,
        retry,
        remove,
        isSyncing,
        isSheetOpen,
        setSheetOpen
    };
}
import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';


export default function useLiveTransactions() {
    const [liveTransactions, setLiveTransactions] = useState([]);
    const [liveCursor, setLiveCursor] = useState(null);
    const [liveHasMore, setLiveHasMore] = useState(false);
    const [isLiveLoading, setIsLiveLoading] = useState(false);
    const [isLiveAppending, setIsLiveAppending] = useState(false);
    const [liveSearchTerm, setLiveSearchTerm] = useState('');
    const [liveDateRange, setLiveDateRange] = useState(undefined);
    const [liveSort, setLiveSort] = useState({ key: 'Transaction Date', direction: 'descending' });
    const [liveCardFilter, setLiveCardFilter] = useState('all');
    const [liveCategoryFilter, setLiveCategoryFilter] = useState('all');
    const [liveMethodFilter, setLiveMethodFilter] = useState('all');

    const fetchLiveTransactions = useCallback(async (cursor = null, search = '', isAppend = false, dateRangeOverride = null, sortOverride = null, filterOverride = null) => {
        if (isAppend) {
            setIsLiveAppending(true);
        } else {
            setIsLiveLoading(true);
        }

        try {
            const params = new URLSearchParams();
            if (cursor) params.append('cursor', cursor);
            if (search) params.append('search', search);

            const range = dateRangeOverride !== null ? dateRangeOverride : liveDateRange;
            if (range && range.from) {
                params.append('startDate', format(range.from, 'yyyy-MM-dd'));
                if (range.to) {
                    params.append('endDate', format(range.to, 'yyyy-MM-dd'));
                } else {
                    params.append('endDate', format(range.from, 'yyyy-MM-dd'));
                }
            }

            const sort = sortOverride || liveSort;
            if (sort) {
                params.append('sortKey', sort.key);
                params.append('sortDirection', sort.direction);
            }

            // Apply Filters
            const card = filterOverride?.card ?? liveCardFilter;
            if (card && card !== 'all') params.append('cardId', card);

            const category = filterOverride?.category ?? liveCategoryFilter;
            if (category && category !== 'all') params.append('category', category);

            const method = filterOverride?.method ?? liveMethodFilter;
            if (method && method !== 'all') params.append('method', method);

            const res = await fetch(`${API_BASE_URL}/transactions/query?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch live transactions');

            const data = await res.json();

            setLiveTransactions(prev => isAppend ? [...prev, ...data.results] : data.results);
            setLiveCursor(data.nextCursor);
            setLiveHasMore(data.hasMore);
        } catch (error) {
            console.error("Error fetching live transactions:", error);
            toast.error("Failed to load transactions.");
        } finally {
            if (isAppend) {
                setIsLiveAppending(false);
            } else {
                setIsLiveLoading(false);
            }
        }
    }, [liveDateRange, liveSort, liveCardFilter, liveCategoryFilter, liveMethodFilter]);

    const handleLiveLoadMore = useCallback(() => {
        if (liveHasMore && liveCursor) {
            fetchLiveTransactions(liveCursor, liveSearchTerm, true);
        }
    }, [liveHasMore, liveCursor, liveSearchTerm, fetchLiveTransactions]);

    const handleLiveSearch = useCallback((term) => {
        setLiveSearchTerm(term);
        // Reset list and fetch new results
        fetchLiveTransactions(null, term, false);
    }, [fetchLiveTransactions]);

    const handleLiveDateRangeChange = useCallback((range) => {
        setLiveDateRange(range);
        // Reset list and fetch new results
        fetchLiveTransactions(null, liveSearchTerm, false, range);
    }, [fetchLiveTransactions, liveSearchTerm]);

    const handleLiveSortChange = useCallback((newSortConfig) => {
        setLiveSort(newSortConfig);
        // Reset list and fetch new results with new sort
        // Explicitly pass newSortConfig to avoid race conditions with state update
        setLiveTransactions([]);
        setLiveCursor(null);
        setLiveHasMore(false);
        fetchLiveTransactions(null, liveSearchTerm, false, null, newSortConfig);
    }, [fetchLiveTransactions, liveSearchTerm]);

    const handleLiveFilterChange = useCallback(({ type, value }) => {
        // Create an override object to pass to fetch
        const filterOverride = {};

        if (type === 'card') {
            setLiveCardFilter(value);
            filterOverride.card = value;
        } else if (type === 'category') {
            setLiveCategoryFilter(value);
            filterOverride.category = value;
        } else if (type === 'method') {
            setLiveMethodFilter(value);
            filterOverride.method = value;
        }

        // Reset and Fetch
        setLiveTransactions([]);
        setLiveCursor(null);
        setLiveHasMore(false);
        fetchLiveTransactions(null, liveSearchTerm, false, null, null, filterOverride);
    }, [fetchLiveTransactions, liveSearchTerm]);

    return {
        liveTransactions, setLiveTransactions,
        liveCursor, setLiveCursor,
        liveHasMore, setLiveHasMore,
        isLiveLoading, setIsLiveLoading,
        isLiveAppending, setIsLiveAppending,
        liveSearchTerm, setLiveSearchTerm,
        liveDateRange, setLiveDateRange,
        liveSort, setLiveSort,
        liveCardFilter, setLiveCardFilter,
        liveCategoryFilter, setLiveCategoryFilter,
        liveMethodFilter, setLiveMethodFilter,
        fetchLiveTransactions,
        handleLiveLoadMore,
        handleLiveSearch,
        handleLiveDateRangeChange,
        handleLiveSortChange,
        handleLiveFilterChange
    };
}
import { useMemo } from 'react';

export default function useCardRecommendations({
    mccCode,
    amount,
    date,
    rules,
    cards,
    monthlySummary,
    monthlyCategorySummary,
    getCurrentCashbackMonthForCard
}) {
    // 1. Map setup
    const cardMap = useMemo(() => new Map(cards.map(c => [c.id, c])), [cards]);

    // 2. Main Logic
    const rankedCards = useMemo(() => {
        // Basic validation
        if (!mccCode || !/^\d{4}$/.test(mccCode)) return [];

        const numericAmount = parseFloat(String(amount).replace(/,/g, ''));

        // Helper: Safely parse "1234, 5678" strings or single numbers into an array
        const safeSplit = (val) => {
            if (typeof val === 'string') return val.split(',').map(c => c.trim());
            if (typeof val === 'number') return [String(val)]; // Handle single numeric codes
            return []; // Return empty array for null/undefined
        };

        return rules
            .filter(rule => {
                // --- UPDATED SAFE PARSING ---
                const ruleMccCodes = safeSplit(rule.mccCodes);
                const ruleExcludedCodes = safeSplit(rule.excludedMccCodes);
                // ----------------------------

                const isSpecificMatch = ruleMccCodes.includes(mccCode);
                const isBroadRule = rule.isDefault || ruleMccCodes.length === 0;

                // Match specific code OR broad rule (unless excluded)
                return isSpecificMatch || (isBroadRule && !ruleExcludedCodes.includes(mccCode));
            })
            .map(rule => {
                const card = cardMap.get(rule.cardId);
                if (!card || card.status !== 'Active') return null;

                const monthForCard = getCurrentCashbackMonthForCard(card, date);
                const cardMonthSummary = monthlySummary.find(s => s.cardId === card.id && s.month === monthForCard);
                const categorySummaryId = `${monthForCard} - ${rule.ruleName}`;
                const categoryMonthSummary = monthlyCategorySummary.find(s => s.summaryId === categorySummaryId && s.cardId === card.id);

                // --- TIERED LOGIC ---
                const currentMonthSpend = cardMonthSummary?.spend || 0;
                const isTier2Met = card.cashbackType === '2 Tier' && card.tier2MinSpend > 0 && currentMonthSpend >= card.tier2MinSpend;

                // Effective Rates & Limits
                const effectiveRate = isTier2Met && rule.tier2Rate ? rule.tier2Rate : rule.rate;
                const effectiveCategoryLimit = (isTier2Met && rule.tier2CategoryLimit) ? rule.tier2CategoryLimit : rule.categoryLimit;
                const effectiveMonthlyLimit = (isTier2Met && card.tier2Limit) ? card.tier2Limit : card.overallMonthlyLimit;

                // Category Cap
                const currentCategoryCashback = categoryMonthSummary?.cashback || 0;
                const remainingCategoryCashback = (effectiveCategoryLimit > 0) ? effectiveCategoryLimit - currentCategoryCashback : Infinity;
                const isCategoryCapReached = (effectiveCategoryLimit > 0) && currentCategoryCashback >= effectiveCategoryLimit;

                // Overall Card Cap
                const isMonthlyCapReached = (effectiveMonthlyLimit > 0) ? (cardMonthSummary?.cashback || 0) >= effectiveMonthlyLimit : false;

                // Min Spend
                const isMinSpendMet = card.minimumMonthlySpend > 0 ? (cardMonthSummary?.spend || 0) >= card.minimumMonthlySpend : true;

                // Calculate Cashback
                let calculatedCashback = null;
                if (!isNaN(numericAmount) && numericAmount > 0) {
                    calculatedCashback = numericAmount * effectiveRate;

                    let cap = rule.transactionLimit;
                    if (rule.secondaryTransactionCriteria > 0 && numericAmount >= rule.secondaryTransactionCriteria) {
                        cap = rule.secondaryTransactionLimit;
                    }
                    if (cap > 0) {
                        calculatedCashback = Math.min(calculatedCashback, cap);
                    }
                }

                return {
                    rule,
                    card,
                    calculatedCashback,
                    isMinSpendMet,
                    isCategoryCapReached,
                    isMonthlyCapReached,
                    remainingCategoryCashback,
                };
            })
            .filter(Boolean)
            .sort((a, b) => {
                const isACapped = a.isMonthlyCapReached || a.isCategoryCapReached;
                const isBCapped = b.isMonthlyCapReached || b.isCategoryCapReached;
                if (isACapped !== isBCapped) return isACapped ? 1 : -1;
                if (a.isMinSpendMet !== b.isMinSpendMet) return a.isMinSpendMet ? -1 : 1;
                if (!isNaN(numericAmount)) {
                    const cashbackDiff = (b.calculatedCashback || 0) - (a.calculatedCashback || 0);
                    if (cashbackDiff !== 0) return cashbackDiff;
                }
                return b.rule.rate - a.rule.rate;
            });
    }, [mccCode, amount, rules, cardMap, monthlySummary, monthlyCategorySummary, getCurrentCashbackMonthForCard, date]);

    return rankedCards;
}
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // You may need to create this file for styling
import CashbackDashboard from './CashbackDashboard'; // Imports your main component
import { ThemeProvider } from "./components/ui/theme-provider"

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <CashbackDashboard />
    </ThemeProvider>
  </React.StrictMode>
);
// src/setupTests.js
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Polyfill TextEncoder/TextDecoder for Node environments (required by some libs)
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Polyfill ReadableStream (required by undici/fetch)
if (typeof global.ReadableStream === 'undefined') {
  const { ReadableStream } = require('stream/web');
  global.ReadableStream = ReadableStream;
}

// Polyfill MessagePort (required by some workers/undici)
if (typeof global.MessagePort === 'undefined') {
    const { MessagePort } = require('worker_threads');
    global.MessagePort = MessagePort;
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
{
  "mccDescriptionMap": {
    "742": { "en": "Veterinary Services", "vn": "Dịch vụ thú y" },
    "763": { "en": "Agricultural Cooperatives", "vn": "Hợp tác xã nông nghiệp" },
    "780": { "en": "Landscaping and Horticultural Services", "vn": "Dịch vụ cảnh quan và làm vườn" },
    "1520": { "en": "General Contractor/Residential Building", "vn": "Tổng thầu/Xây dựng nhà ở" },
    "1711": { "en": "Heating, Plumbing, Air Conditioning Contractors", "vn": "Nhà thầu hệ thống sưởi, ống nước, điều hòa không khí" },
    "1731": { "en": "Electrical Contractors", "vn": "Nhà thầu điện" },
    "1740": { "en": "Masonry, Stonework, Tile Setting, Plastering, Insulation Contractors", "vn": "Nhà thầu xây, đá, ốp lát, trát, cách nhiệt" },
    "1750": { "en": "Carpentry", "vn": "Nghề mộc" },
    "1761": { "en": "Roof, Siding, and Sheet Metal Work Contractors", "vn": "Nhà thầu lợp mái, vách, và kim loại tấm" },
    "1771": { "en": "Contractors, Concrete", "vn": "Nhà thầu bê tông" },
    "1799": { "en": "Special Trade Contractor - Not Elsewhere Classified", "vn": "Nhà thầu chuyên ngành - Không được phân loại ở nơi khác" },
    "2741": { "en": "Miscellaneous Publishing and Printing Services", "vn": "Dịch vụ xuất bản và in ấn linh tinh" },
    "2791": { "en": "Typesetting, Plate Making and Related Services", "vn": "Dịch vụ sắp chữ, làm bản in và các dịch vụ liên quan" },
    "2842": { "en": "Specialty Cleaning, Polishing and Sanitation Preparations", "vn": "Chế phẩm làm sạch, đánh bóng và vệ sinh chuyên dụng" },
    "3000": { "en": "United Airlines", "vn": "Hãng hàng không United Airlines" },
    "3001": { "en": "American Airlines", "vn": "Hãng hàng không American Airlines" },
    "3002": { "en": "Pan American", "vn": "Hãng hàng không Pan American" },
    "3005": { "en": "British Airways", "vn": "Hãng hàng không British Airways" },
    "3006": { "en": "Japan Air Lines", "vn": "Hãng hàng không Japan Air Lines" },
    "3007": { "en": "Air France", "vn": "Hãng hàng không Air France" },
    "3008": { "en": "Lufthansa", "vn": "Hãng hàng không Lufthansa" },
    "4111": { "en": "Local/Suburban Commuter Passenger Transportation - Railroads, Feries, Local Water Transportation", "vn": "Vận tải hành khách ngoại ô - Đường sắt, Phà" },
    "4112": { "en": "Passenger Railways", "vn": "Đường sắt chở khách" },
    "4121": { "en": "Taxicabs and Limousines", "vn": "Taxi và Limousine" },
    "4131": { "en": "Bus Lines", "vn": "Tuyến xe buýt" },
    "4214": { "en": "Motor Freight Carriers, Trucking - Local/Long Distance, Moving and Storage Companies, and Local Delivery Services", "vn": "Vận tải hàng hóa, Xe tải - Khoảng cách ngắn/dài, Công ty chuyển nhà và lưu kho, Dịch vụ giao hàng địa phương" },
    "4215": { "en": "Courier Services - Air and Ground, and Freight Forwarders", "vn": "Dịch vụ chuyển phát nhanh - Hàng không và đường bộ, Giao nhận vận tải" },
    "4411": { "en": "Steamship and Cruise Lines", "vn": "Tàu thủy và Du thuyền" },
    "4457": { "en": "Boat Rentals and Leases", "vn": "Cho thuê thuyền và tàu" },
    "4468": { "en": "Marinas, Marine Service, and Supplies", "vn": "Bến du thuyền, Dịch vụ và vật tư hàng hải" },
    "4511": { "en": "Airlines, Air Carriers", "vn": "Hãng hàng không" },
    "4722": { "en": "Travel Agencies and Tour Operators", "vn": "Đại lý du lịch và Lữ hành" },
    "4784": { "en": "Tolls and Bridge Fees", "vn": "Phí cầu đường" },
    "4789": { "en": "Transportation Services - Not Elsewhere Classified", "vn": "Dịch vụ vận tải - Không được phân loại ở nơi khác" },
    "4812": { "en": "Telecommunication Equipment including telephone sales", "vn": "Thiết bị viễn thông bao gồm bán hàng qua điện thoại" },
    "4814": { "en": "Telecommunication Services including local and long distance calls, credit card calls, calls through use of magnetic-strip reading telephones, and fax services", "vn": "Dịch vụ viễn thông" },
    "4816": { "en": "Computer Network/Information Services", "vn": "Dịch vụ mạng/Thông tin máy tính" },
    "4821": { "en": "Telegraph Services", "vn": "Dịch vụ điện báo" },
    "4829": { "en": "Money Orders - Wire Transfer", "vn": "Chuyển tiền - Điện chuyển tiền" },
    "4899": { "en": "Cable and other pay television services", "vn": "Truyền hình cáp và các dịch vụ truyền hình trả tiền khác" },
    "4900": { "en": "Utilities - Electric, Gas, Water, and Sanitary", "vn": "Tiện ích - Điện, Gas, Nước và Vệ sinh" },
    "5013": { "en": "Motor Vehicle Supplies and New Parts", "vn": "Vật tư và phụ tùng mới cho xe cơ giới" },
    "5021": { "en": "Office and Commercial Furniture", "vn": "Nội thất văn phòng và thương mại" },
    "5039": { "en": "Construction Materials - Not Elsewhere Classified", "vn": "Vật liệu xây dựng - Không được phân loại ở nơi khác" },
    "5044": { "en": "Office, Photographic, Photocopy, and Microfilm Equipment", "vn": "Thiết bị văn phòng, nhiếp ảnh, photocopy và vi phim" },
    "5045": { "en": "Computers, Computer Peripheral Equipment, Software", "vn": "Máy tính, Thiết bị ngoại vi, Phần mềm" },
    "5046": { "en": "Commercial Equipment - Not Elsewhere Classified", "vn": "Thiết bị thương mại - Không được phân loại ở nơi khác" },
    "5047": { "en": "Dental/Labratory/Medical/Opthalmic Hospital Equipment and Supplies", "vn": "Thiết bị và vật tư y tế, nha khoa, phòng thí nghiệm, mắt" },
    "5051": { "en": "Metal Service Centers and Offices", "vn": "Trung tâm và văn phòng dịch vụ kim loại" },
    "5065": { "en": "Electrical Parts and Equipment", "vn": "Phụ tùng và thiết bị điện" },
    "5072": { "en": "Hardware Equipment and Supplies", "vn": "Thiết bị và vật tư phần cứng" },
    "5074": { "en": "Plumbing and Heating Equipment and Supplies", "vn": "Thiết bị và vật tư ống nước và hệ thống sưởi" },
    "5085": { "en": "Industrial Supplies - Not Elsewhere Classified", "vn": "Vật tư công nghiệp - Không được phân loại ở nơi khác" },
    "5094": { "en": "Precious Stones and Metals, Watches and Jewelry", "vn": "Đá quý và kim loại quý, Đồng hồ và Trang sức" },
    "5099": { "en": "Durable Goods - Not Elsewhere Classified", "vn": "Hàng tiêu dùng lâu bền - Không được phân loại ở nơi khác" },
    "5111": { "en": "Stationery, Office Supplies, Printing, and Writing Paper", "vn": "Văn phòng phẩm, Vật tư văn phòng, In ấn và Giấy viết" },
    "5122": { "en": "Drugs, Drug Proprietaries, and Druggist Sundries", "vn": "Thuốc, Dược phẩm và các mặt hàng khác của nhà thuốc" },
    "5131": { "en": "Piece Goods, Notions, and Other Dry Goods", "vn": "Hàng mảnh, Phụ liệu và các mặt hàng khô khác" },
    "5137": { "en": "Men's, Women's, and Children's Uniforms and Commercial Clothing", "vn": "Đồng phục và quần áo thương mại cho nam, nữ và trẻ em" },
    "5139": { "en": "Commercial Footwear", "vn": "Giày dép thương mại" },
    "5169": { "en": "Chemicals and Allied Products - Not Elsewhere Classified", "vn": "Hóa chất và các sản phẩm liên quan - Không được phân loại ở nơi khác" },
    "5172": { "en": "Petroleum and Petroleum Products", "vn": "Xăng dầu và các sản phẩm từ dầu mỏ" },
    "5192": { "en": "Books, Periodicals, and Newspapers", "vn": "Sách, Tạp chí và Báo" },
    "5193": { "en": "Florists' Supplies, Nursery Stock and Flowers", "vn": "Vật tư cho người bán hoa, Cây giống và Hoa" },
    "5198": { "en": "Paints, Varnishes, and Supplies", "vn": "Sơn, Véc ni và Vật tư" },
    "5199": { "en": "Nondurable Goods - Not Elsewhere Classified", "vn": "Hàng tiêu dùng không lâu bền - Không được phân loại ở nơi khác" },
    "5200": { "en": "Home Supply Warehouse Stores", "vn": "Cửa hàng kho vật tư gia đình" },
    "5211": { "en": "Lumber and Building Materials Stores", "vn": "Cửa hàng gỗ và vật liệu xây dựng" },
    "5231": { "en": "Glass, Paint, and Wallpaper Stores", "vn": "Cửa hàng kính, sơn và giấy dán tường" },
    "5251": { "en": "Hardware Stores", "vn": "Cửa hàng phần cứng" },
    "5261": { "en": "Nurseries, Lawn and Garden Supply Stores", "vn": "Vườn ươm, Cửa hàng vật tư sân vườn" },
    "5262": { "en": "Online Marketplaces", "vn": "Chợ trực tuyến" },
    "5300": { "en": "Wholesale Clubs", "vn": "Câu lạc bộ bán buôn" },
    "5309": { "en": "Duty Free Stores", "vn": "Cửa hàng miễn thuế" },
    "5310": { "en": "Discount Stores", "vn": "Cửa hàng giảm giá" },
    "5311": { "en": "Department Stores", "vn": "Cửa hàng bách hóa" },
    "5331": { "en": "Variety Stores", "vn": "Cửa hàng tạp hóa" },
    "5399": { "en": "Miscellaneous General Merchandise", "vn": "Hàng hóa tổng hợp linh tinh" },
    "5411": { "en": "Grocery Stores, Supermarkets", "vn": "Cửa hàng tạp hóa, Siêu thị" },
    "5422": { "en": "Freezer, Locker Meat Provisioners", "vn": "Nhà cung cấp thịt đông lạnh" },
    "5441": { "en": "Candy, Nut, and Confectionery Stores", "vn": "Cửa hàng kẹo, hạt và bánh kẹo" },
    "5451": { "en": "Dairy Products Stores", "vn": "Cửa hàng sản phẩm từ sữa" },
    "5462": { "en": "Bakeries", "vn": "Tiệm bánh" },
    "5499": { "en": "Miscellaneous Food Stores - Convenience Stores, Specialty Markets", "vn": "Cửa hàng thực phẩm linh tinh - Cửa hàng tiện lợi, Chợ đặc sản" },
    "5511": { "en": "Car and Truck Dealers (New and Used) Sales, Service, Repairs, Parts, and Leasing", "vn": "Đại lý ô tô và xe tải (Mới và Cũ) Bán hàng, Dịch vụ, Sửa chữa, Phụ tùng và Cho thuê" },
    "5521": { "en": "Car and Truck Dealers (Used Only) Sales, Service, Repairs, Parts, and Leasing", "vn": "Đại lý ô tô và xe tải (Chỉ xe cũ) Bán hàng, Dịch vụ, Sửa chữa, Phụ tùng và Cho thuê" },
    "5531": { "en": "Auto Store, Home Supply Stores", "vn": "Cửa hàng ô tô, Cửa hàng vật tư gia đình" },
    "5532": { "en": "Automotive Tire Stores", "vn": "Cửa hàng lốp ô tô" },
    "5533": { "en": "Automotive Parts and Accessories Stores", "vn": "Cửa hàng phụ tùng và phụ kiện ô tô" },
    "5541": { "en": "Service Stations (with or without ancillary services)", "vn": "Trạm dịch vụ (có hoặc không có dịch vụ phụ)" },
    "5542": { "en": "Automated Fuel Dispensers", "vn": "Máy bán nhiên liệu tự động" },
    "5551": { "en": "Boat Dealers", "vn": "Đại lý thuyền" },
    "5561": { "en": "Recreational and Utility Trailers, Campers Dealers", "vn": "Đại lý xe moóc giải trí và tiện ích, xe cắm trại" },
    "5571": { "en": "Motorcycle Shops and Dealers", "vn": "Cửa hàng và đại lý xe máy" },
    "5592": { "en": "Motor Home Dealers", "vn": "Đại lý nhà di động" },
    "5598": { "en": "Snowmobile Dealers", "vn": "Đại lý xe trượt tuyết" },
    "5599": { "en": "Miscellaneous Auto & Vehicle Dealers - Not Elsewhere Classified", "vn": "Đại lý ô tô và xe cộ linh tinh - Không được phân loại ở nơi khác" },
    "5611": { "en": "Men's and Boy's Clothing and Accessories Stores", "vn": "Cửa hàng quần áo và phụ kiện cho nam và bé trai" },
    "5621": { "en": "Women's Ready-to-Wear Stores", "vn": "Cửa hàng quần áo may sẵn cho nữ" },
    "5631": { "en": "Women's Accessory and Specialty Shops", "vn": "Cửa hàng phụ kiện và đặc sản cho nữ" },
    "5641": { "en": "Children's and Infant's Wear Stores", "vn": "Cửa hàng quần áo trẻ em và trẻ sơ sinh" },
    "5651": { "en": "Family Clothing Stores", "vn": "Cửa hàng quần áo gia đình" },
    "5655": { "en": "Sports and Riding Apparel Stores", "vn": "Cửa hàng quần áo thể thao và cưỡi ngựa" },
    "5661": { "en": "Shoe Stores", "vn": "Cửa hàng giày" },
    "5681": { "en": "Furriers and Fur Shops", "vn": "Cửa hàng lông thú" },
    "5691": { "en": "Men's and Women's Clothing Stores", "vn": "Cửa hàng quần áo nam và nữ" },
    "5697": { "en": "Tailors, Seamstress, Mending, and Alterations", "vn": "Thợ may, Thợ sửa chữa và Chỉnh sửa" },
    "5698": { "en": "Wig and Toupee Stores", "vn": "Cửa hàng tóc giả" },
    "5699": { "en": "Miscellaneous Apparel and Accessory Shops", "vn": "Cửa hàng quần áo và phụ kiện linh tinh" },
    "5712": { "en": "Furniture, Home Furnishings, and Equipment Stores, Except Appliances", "vn": "Cửa hàng nội thất, đồ gia dụng và thiết bị, trừ thiết bị điện" },
    "5713": { "en": "Floor Covering Stores", "vn": "Cửa hàng trải sàn" },
    "5714": { "en": "Drapery, Window Covering and Upholstery Stores", "vn": "Cửa hàng rèm, che cửa sổ và bọc ghế" },
    "5718": { "en": "Fireplace, Fireplace Screens, and Accessories Stores", "vn": "Cửa hàng lò sưởi, màn che lò sưởi và phụ kiện" },
    "5719": { "en": "Miscellaneous Home Furnishing Specialty Stores", "vn": "Cửa hàng đặc sản nội thất gia đình linh tinh" },
    "5722": { "en": "Household Appliance Stores", "vn": "Cửa hàng thiết bị gia dụng" },
    "5732": { "en": "Electronics Stores", "vn": "Cửa hàng điện tử" },
    "5733": { "en": "Music Stores - Musical Instruments, Pianos, and Sheet Music", "vn": "Cửa hàng âm nhạc - Nhạc cụ, Đàn piano và Bản nhạc" },
    "5734": { "en": "Computer Software Stores", "vn": "Cửa hàng phần mềm máy tính" },
    "5735": { "en": "Record Shops", "vn": "Cửa hàng đĩa nhạc" },
    "5811": { "en": "Caterers", "vn": "Dịch vụ ăn uống" },
    "5812": { "en": "Eating Places, Restaurants", "vn": "Nhà hàng, Quán ăn" },
    "5813": { "en": "Drinking Places (Alcoholic Beverages) - Bars, Taverns, Nightclubs, Cocktail Lounges, and Discotheques", "vn": "Quán rượu, Quầy bar, Hộp đêm" },
    "5814": { "en": "Fast Food Restaurants", "vn": "Nhà hàng ăn nhanh" },
    "5815": { "en": "Digital Goods: Books, Movies, Music", "vn": "Hàng hóa kỹ thuật số: Sách, Phim, Nhạc" },
    "5816": { "en": "Digital Goods: Games", "vn": "Hàng hóa kỹ thuật số: Trò chơi" },
    "5817": { "en": "Digital Goods: Applications (Excludes Games)", "vn": "Hàng hóa kỹ thuật số: Ứng dụng (Trừ trò chơi)" },
    "5818": { "en": "Digital Goods: Large Digital Goods Merchant", "vn": "Hàng hóa kỹ thuật số: Nhà bán lẻ lớn" },
    "5912": { "en": "Drug Stores and Pharmacies", "vn": "Nhà thuốc và Hiệu thuốc" },
    "5921": { "en": "Package Stores - Beer, Wine, and Liquor", "vn": "Cửa hàng bán lẻ - Bia, Rượu vang và Rượu mạnh" },
    "5931": { "en": "Used Merchandise and Secondhand Stores", "vn": "Cửa hàng đồ cũ và đồ đã qua sử dụng" },
    "5932": { "en": "Antique Shops - Sales, Repairs, and Restoration Services", "vn": "Cửa hàng đồ cổ - Bán, Sửa chữa và Phục chế" },
    "5933": { "en": "Pawn Shops and Salvage Yards", "vn": "Cửa hàng cầm đồ và Bãi phế liệu" },
    "5935": { "en": "Wrecking and Salvage Yards", "vn": "Bãi phá dỡ và phế liệu" },
    "5937": { "en": "Antique Reproductions", "vn": "Đồ cổ sao chép" },
    "5940": { "en": "Bicycle Shops - Sales and Service", "vn": "Cửa hàng xe đạp - Bán và Dịch vụ" },
    "5941": { "en": "Sporting Goods Stores", "vn": "Cửa hàng đồ thể thao" },
    "5942": { "en": "Book Stores", "vn": "Hiệu sách" },
    "5943": { "en": "Stationery Stores, Office and School Supply Stores", "vn": "Cửa hàng văn phòng phẩm, vật tư văn phòng và trường học" },
    "5944": { "en": "Watch, Clock, Jewelry, and Silverware Stores", "vn": "Cửa hàng đồng hồ, đồ trang sức và đồ bạc" },
    "5945": { "en": "Hobby, Toy, and Game Shops", "vn": "Cửa hàng sở thích, đồ chơi và trò chơi" },
    "5946": { "en": "Camera and Photographic Supply Stores", "vn": "Cửa hàng máy ảnh và vật tư nhiếp ảnh" },
    "5947": { "en": "Gift, Card, Novelty, and Souvenir Shops", "vn": "Cửa hàng quà tặng, thiệp, đồ mới lạ và đồ lưu niệm" },
    "5948": { "en": "Luggage and Leather Goods Stores", "vn": "Cửa hàng hành lý và đồ da" },
    "5949": { "en": "Sewing, Needlework, Fabric, and Piece Goods Stores", "vn": "Cửa hàng may, thêu, vải và hàng mảnh" },
    "5950": { "en": "Glassware/Crystal Stores", "vn": "Cửa hàng đồ thủy tinh/pha lê" },
    "5960": { "en": "Direct Marketing - Insurance Services", "vn": "Tiếp thị trực tiếp - Dịch vụ bảo hiểm" },
    "5962": { "en": "Direct Marketing - Travel-Related Arrangement Services", "vn": "Tiếp thị trực tiếp - Dịch vụ sắp xếp liên quan đến du lịch" },
    "5963": { "en": "Door-to-Door Sales", "vn": "Bán hàng tận nhà" },
    "5964": { "en": "Direct Marketing - Catalog Merchant", "vn": "Tiếp thị trực tiếp - Nhà bán lẻ theo danh mục" },
    "5965": { "en": "Direct Marketing - Combination Catalog and Retail Merchant", "vn": "Tiếp thị trực tiếp - Kết hợp danh mục và bán lẻ" },
    "5966": { "en": "Direct Marketing - Outbound Telemarketing Merchant", "vn": "Tiếp thị trực tiếp - Tiếp thị qua điện thoại" },
    "5967": { "en": "Direct Marketing - Inbound Teleservices Merchant", "vn": "Tiếp thị trực tiếp - Dịch vụ điện thoại trong nước" },
    "5968": { "en": "Direct Marketing - Continuity/Subscription Merchant", "vn": "Tiếp thị trực tiếp - Nhà bán lẻ theo thuê bao" },
    "5969": { "en": "Direct Marketing - Other Direct Marketers", "vn": "Tiếp thị trực tiếp - Các nhà tiếp thị trực tiếp khác" },
    "5970": { "en": "Artist's Supply and Craft Shops", "vn": "Cửa hàng vật tư và đồ thủ công của nghệ sĩ" },
    "5971": { "en": "Art Dealers and Galleries", "vn": "Nhà buôn và phòng trưng bày nghệ thuật" },
    "5972": { "en": "Stamp and Coin Stores", "vn": "Cửa hàng tem và tiền xu" },
    "5973": { "en": "Religious Goods Stores", "vn": "Cửa hàng đồ tôn giáo" },
    "5975": { "en": "Hearing Aids - Sales, Service, and Supply Stores", "vn": "Máy trợ thính - Cửa hàng bán, dịch vụ và vật tư" },
    "5976": { "en": "Orthopedic Goods - Prosthetic Devices", "vn": "Hàng chỉnh hình - Thiết bị giả" },
    "5977": { "en": "Cosmetic Stores", "vn": "Cửa hàng mỹ phẩm" },
    "5978": { "en": "Typewriter Stores - Sales, Service, and Rentals", "vn": "Cửa hàng máy chữ - Bán, Dịch vụ và Cho thuê" },
    "5983": { "en": "Fuel Dealers - Fuel Oil, Wood, Coal, and Liquefied Petroleum", "vn": "Đại lý nhiên liệu - Dầu nhiên liệu, Gỗ, Than và Dầu khí hóa lỏng" },
    "5992": { "en": "Florists", "vn": "Người bán hoa" },
    "5993": { "en": "Cigar Stores and Stands", "vn": "Cửa hàng và quầy xì gà" },
    "5994": { "en": "News Dealers and Newsstands", "vn": "Đại lý và quầy báo" },
    "5995": { "en": "Pet Shops, Pet Food, and Supplies", "vn": "Cửa hàng thú cưng, Thức ăn và Vật tư cho thú cưng" },
    "5996": { "en": "Swimming Pools - Sales, Service, and Supplies", "vn": "Bể bơi - Bán, Dịch vụ và Vật tư" },
    "5997": { "en": "Electric Razor Stores - Sales and Service", "vn": "Cửa hàng dao cạo điện - Bán và Dịch vụ" },
    "5998": { "en": "Tent and Awning Shops", "vn": "Cửa hàng lều và mái hiên" },
    "5999": { "en": "Miscellaneous and Specialty Retail Shops", "vn": "Cửa hàng bán lẻ linh tinh và đặc sản" },
    "6010": { "en": "Financial Institutions - Manual Cash Disbursements", "vn": "Tổ chức tài chính - Chi tiền mặt thủ công" },
    "6011": { "en": "Financial Institutions - Automated Cash Disbursements", "vn": "Tổ chức tài chính - Chi tiền mặt tự động" },
    "6012": { "en": "Financial Institutions - Merchandise and Services", "vn": "Tổ chức tài chính - Hàng hóa và Dịch vụ" },
    "6051": { "en": "Non-Financial Institutions - Foreign Currency, Money Orders (not wire transfer), and Travelers Cheques", "vn": "Tổ chức phi tài chính - Ngoại tệ, Lệnh chuyển tiền (không phải điện chuyển tiền) và Séc du lịch" },
    "6211": { "en": "Security Brokers/Dealers", "vn": "Môi giới/Đại lý chứng khoán" },
    "6300": { "en": "Insurance Sales, Underwriting, and Premiums", "vn": "Bán, Bảo lãnh và Phí bảo hiểm" },
    "6513": { "en": "Real Estate Agents and Managers - Rentals", "vn": "Đại lý và Quản lý bất động sản - Cho thuê" },
    "6540": { "en": "Non-Financial Institutions - Stored Value Card Purchase/Load", "vn": "Tổ chức phi tài chính - Mua/Nạp thẻ giá trị lưu trữ" },
    "7011": { "en": "Lodging - Hotels, Motels, Resorts, Central Reservation Services (not elsewhere classified)", "vn": "Lưu trú - Khách sạn, Nhà nghỉ, Khu nghỉ dưỡng, Dịch vụ đặt phòng trung tâm" },
    "7012": { "en": "Timeshares", "vn": "Sở hữu kỳ nghỉ" },
    "7032": { "en": "Sporting and Recreational Camps", "vn": "Trại thể thao và giải trí" },
    "7033": { "en": "Trailer Parks and Campgrounds", "vn": "Khu xe moóc và Khu cắm trại" },
    "7210": { "en": "Laundry, Cleaning, and Garment Services", "vn": "Dịch vụ giặt, là và may mặc" },
    "7211": { "en": "Laundry - Family and Commercial", "vn": "Giặt là - Gia đình và Thương mại" },
    "7216": { "en": "Dry Cleaners", "vn": "Giặt khô" },
    "7217": { "en": "Carpet and Upholstery Cleaning", "vn": "Giặt thảm và bọc ghế" },
    "7221": { "en": "Photographic Studios", "vn": "Studio nhiếp ảnh" },
    "7230": { "en": "Beauty and Barber Shops", "vn": "Thẩm mỹ viện và Tiệm cắt tóc" },
    "7251": { "en": "Shop Repair Shops and Shoe Shine Parlors, and Hat Cleaning Shops", "vn": "Cửa hàng sửa chữa và Đánh giày, Cửa hàng giặt mũ" },
    "7261": { "en": "Funeral Service and Crematories", "vn": "Dịch vụ tang lễ và Hỏa táng" },
    "7273": { "en": "Dating and Escort Services", "vn": "Dịch vụ hẹn hò và hộ tống" },
    "7276": { "en": "Tax Preparation Services", "vn": "Dịch vụ khai thuế" },
    "7277": { "en": "Counseling Services - Debt, Marriage, Personal", "vn": "Dịch vụ tư vấn - Nợ, Hôn nhân, Cá nhân" },
    "7278": { "en": "Buying/Shopping Services, Clubs", "vn": "Dịch vụ mua sắm, Câu lạc bộ" },
    "7296": { "en": "Clothing Rental - Costumes, Uniforms, and Formal Wear", "vn": "Cho thuê quần áo - Trang phục, Đồng phục và Lễ phục" },
    "7297": { "en": "Massage Parlors", "vn": "Phòng mát-xa" },
    "7298": { "en": "Health and Beauty Spas", "vn": "Spa sức khỏe và sắc đẹp" },
    "7299": { "en": "Miscellaneous Personal Services - Not Elsewhere Classified", "vn": "Dịch vụ cá nhân linh tinh - Không được phân loại ở nơi khác" },
    "7311": { "en": "Advertising Services", "vn": "Dịch vụ quảng cáo" },
    "7321": { "en": "Consumer Credit Reporting Agencies", "vn": "Cơ quan báo cáo tín dụng tiêu dùng" },
    "7333": { "en": "Commercial Photography, Art, and Graphics", "vn": "Nhiếp ảnh, Nghệ thuật và Đồ họa thương mại" },
    "7338": { "en": "Quick Copy, Reproduction, and Blueprinting Services", "vn": "Dịch vụ sao chép nhanh, sao chụp và in bản thiết kế" },
    "7339": { "en": "Stenographic and Secretarial Support Services", "vn": "Dịch vụ hỗ trợ tốc ký và thư ký" },
    "7342": { "en": "Exterminating and Disinfecting Services", "vn": "Dịch vụ diệt trừ và khử trùng" },
    "7349": { "en": "Cleaning, Maintenance, and Janitorial Services", "vn": "Dịch vụ vệ sinh, bảo trì và lao công" },
    "7361": { "en": "Employment Agencies, Temporary Help Services", "vn": "Cơ quan việc làm, Dịch vụ trợ giúp tạm thời" },
    "7372": { "en": "Computer Programming, Integrated Systems Design and Data Processing Services", "vn": "Lập trình máy tính, Thiết kế hệ thống tích hợp và Dịch vụ xử lý dữ liệu" },
    "7375": { "en": "Information Retrieval Services", "vn": "Dịch vụ truy xuất thông tin" },
    "7379": { "en": "Computer Maintenance, Repair and Services - Not Elsewhere Classified", "vn": "Bảo trì, Sửa chữa và Dịch vụ máy tính - Không được phân loại ở nơi khác" },
    "7392": { "en": "Management, Consulting, and Public Relations Services", "vn": "Dịch vụ quản lý, tư vấn và quan hệ công chúng" },
    "7393": { "en": "Detective Agencies, Protective Services, and Security Services", "vn": "Cơ quan thám tử, Dịch vụ bảo vệ và Dịch vụ an ninh" },
    "7394": { "en": "Equipment, Tool, Furniture, and Appliance Rental and Leasing", "vn": "Cho thuê và cho thuê thiết bị, dụng cụ, nội thất và thiết bị" },
    "7395": { "en": "Photofinishing Laboratories, Photo Developing", "vn": "Phòng thí nghiệm hoàn thiện ảnh, Rửa ảnh" },
    "7399": { "en": "Business Services - Not Elsewhere Classified", "vn": "Dịch vụ kinh doanh - Không được phân loại ở nơi khác" },
    "7512": { "en": "Automobile Rental Agency", "vn": "Đại lý cho thuê ô tô" },
    "7513": { "en": "Truck and Utility Trailer Rentals", "vn": "Cho thuê xe tải và xe moóc tiện ích" },
    "7519": { "en": "Motor Home and Recreational Vehicle Rentals", "vn": "Cho thuê nhà di động và xe giải trí" },
    "7523": { "en": "Parking Lots and Garages", "vn": "Bãi đậu xe và Nhà để xe" },
    "7531": { "en": "Automotive Body Repair Shops", "vn": "Xưởng sửa chữa thân xe ô tô" },
    "7534": { "en": "Tire Re-treading and Repair Shops", "vn": "Xưởng đắp lại và sửa chữa lốp xe" },
    "7535": { "en": "Automotive Paint Shops", "vn": "Xưởng sơn ô tô" },
    "7538": { "en": "Automotive Service Shops (Non-Dealer)", "vn": "Xưởng dịch vụ ô tô (Không phải đại lý)" },
    "7542": { "en": "Car Washes", "vn": "Rửa xe" },
    "7549": { "en": "Towing Services", "vn": "Dịch vụ kéo xe" },
    "7622": { "en": "Radio Repair Shops", "vn": "Xưởng sửa chữa radio" },
    "7623": { "en": "Air Conditioning and Refrigeration Repair Shops", "vn": "Xưởng sửa chữa điều hòa không khí và điện lạnh" },
    "7629": { "en": "Electrical and Small Appliance Repair Shops", "vn": "Xưởng sửa chữa điện và thiết bị nhỏ" },
    "7631": { "en": "Watch, Clock, and Jewelry Repair", "vn": "Sửa chữa đồng hồ và trang sức" },
    "7641": { "en": "Furniture - Reupholstery, Repair, and Refinishing", "vn": "Nội thất - Bọc lại, Sửa chữa và Hoàn thiện lại" },
    "7692": { "en": "Welding Repair", "vn": "Sửa chữa hàn" },
    "7699": { "en": "Repair Shops and Related Services - Not Elsewhere Classified", "vn": "Xưởng sửa chữa và các dịch vụ liên quan - Không được phân loại ở nơi khác" },
    "7800": { "en": "Government-Owned Lotteries", "vn": "Xổ số thuộc sở hữu của chính phủ" },
    "7801": { "en": "Government-Licensed On-Line Casinos (On-Line Gambling)", "vn": "Sòng bạc trực tuyến được cấp phép của chính phủ (Cờ bạc trực tuyến)" },
    "7802": { "en": "Government-Licensed Horse/Dog Racing", "vn": "Đua ngựa/chó được cấp phép của chính phủ" },
    "7829": { "en": "Motion Picture and Video Tape Production and Distribution", "vn": "Sản xuất và Phân phối phim và băng video" },
    "7832": { "en": "Motion Picture Theaters", "vn": "Rạp chiếu phim" },
    "7841": { "en": "Video Tape Rental Stores", "vn": "Cửa hàng cho thuê băng video" },
    "7911": { "en": "Dance Halls, Studios, and Schools", "vn": "Phòng khiêu vũ, Studio và Trường học" },
    "7922": { "en": "Theatrical Producers (except Motion Pictures), Ticket Agencies", "vn": "Nhà sản xuất sân khấu (trừ Phim), Đại lý vé" },
    "7929": { "en": "Bands, Orchestras, and Miscellaneous Entertainers - Not Elsewhere Classified", "vn": "Ban nhạc, Dàn nhạc và các nghệ sĩ giải trí linh tinh - Không được phân loại ở nơi khác" },
    "7932": { "en": "Billiard and Pool Establishments", "vn": "Cơ sở bi-a và bi-lắc" },
    "7933": { "en": "Bowling Alleys", "vn": "Sân chơi bowling" },
    "7941": { "en": "Commercial Sports, Professional Sports Clubs, Athletic Fields, and Sports Promoters", "vn": "Thể thao thương mại, Câu lạc bộ thể thao chuyên nghiệp, Sân vận động và Nhà quảng bá thể thao" },
    "7991": { "en": "Tourist Attractions and Exhibits", "vn": "Điểm tham quan và Triển lãm du lịch" },
    "7992": { "en": "Public Golf Courses", "vn": "Sân gôn công cộng" },
    "7993": { "en": "Video Amusement Game Supplies", "vn": "Vật tư trò chơi giải trí video" },
    "7994": { "en": "Video Game Arcades/Establishments", "vn": "Khu/Cơ sở trò chơi điện tử" },
    "7995": { "en": "Betting, including Lottery Tickets, Casino Gaming Chips, Off-Track Betting, and Wagers at Race Tracks", "vn": "Cá cược, bao gồm Vé số, Chip sòng bạc, Cá cược ngoài trường đua và Cược tại trường đua" },
    "7996": { "en": "Amusement Parks, Carnivals, Circuses, and Fortune Tellers", "vn": "Công viên giải trí, Lễ hội, Rạp xiếc và Thầy bói" },
    "7997": { "en": "Membership Clubs (Sports, Recreation, Athletic), Country Clubs, and Private Golf Courses", "vn": "Câu lạc bộ thành viên (Thể thao, Giải trí, Điền kinh), Câu lạc bộ đồng quê và Sân gôn tư nhân" },
    "7998": { "en": "Aquariums, Seaquariums, and Dolphinariums", "vn": "Thủy cung, Bể cá biển và Bể cá heo" },
    "7999": { "en": "Recreation Services - Not Elsewhere Classified", "vn": "Dịch vụ giải trí - Không được phân loại ở nơi khác" },
    "8011": { "en": "Doctors - Not Elsewhere Classified", "vn": "Bác sĩ - Không được phân loại ở nơi khác" },
    "8021": { "en": "Dentists and Orthodontists", "vn": "Nha sĩ và Bác sĩ chỉnh nha" },
    "8031": { "en": "Osteopaths", "vn": "Bác sĩ nắn xương" },
    "8041": { "en": "Chiropractors", "vn": "Bác sĩ nắn khớp xương" },
    "8042": { "en": "Optometrists and Ophthalmologists", "vn": "Bác sĩ đo thị lực và Bác sĩ nhãn khoa" },
    "8043": { "en": "Opticians, Optical Goods, and Eyeglasses", "vn": "Chuyên viên đo thị lực, Hàng quang học và Kính mắt" },
    "8049": { "en": "Podiatrists and Chiropodists", "vn": "Bác sĩ chân và Bác sĩ chân" },
    "8050": { "en": "Nursing and Personal Care Facilities", "vn": "Cơ sở điều dưỡng và chăm sóc cá nhân" },
    "8062": { "en": "Hospitals", "vn": "Bệnh viện" },
    "8071": { "en": "Medical and Dental Laboratories", "vn": "Phòng thí nghiệm y tế và nha khoa" },
    "8099": { "en": "Health Practitioners, Medical Services - Not Elsewhere Classified", "vn": "Chuyên gia y tế, Dịch vụ y tế - Không được phân loại ở nơi khác" },
    "8111": { "en": "Legal Services and Attorneys", "vn": "Dịch vụ pháp lý và Luật sư" },
    "8211": { "en": "Elementary and Secondary Schools", "vn": "Trường tiểu học và trung học cơ sở" },
    "8220": { "en": "Colleges, Universities, Professional Schools, and Junior Colleges", "vn": "Cao đẳng, Đại học, Trường chuyên nghiệp và Cao đẳng cộng đồng" },
    "8241": { "en": "Correspondence Schools", "vn": "Trường học qua thư" },
    "8244": { "en": "Business and Secretarial Schools", "vn": "Trường kinh doanh và thư ký" },
    "8249": { "en": "Vocational and Trade Schools", "vn": "Trường dạy nghề và Thương mại" },
    "8299": { "en": "Schools and Educational Services - Not Elsewhere Classified", "vn": "Trường học và Dịch vụ giáo dục - Không được phân loại ở nơi khác" },
    "8351": { "en": "Child Care Services", "vn": "Dịch vụ chăm sóc trẻ em" },
    "8398": { "en": "Charitable and Social Service Organizations", "vn": "Tổ chức từ thiện và dịch vụ xã hội" },
    "8641": { "en": "Civic, Social, and Fraternal Associations", "vn": "Hiệp hội dân sự, xã hội và huynh đệ" },
    "8651": { "en": "Political Organizations", "vn": "Tổ chức chính trị" },
    "8661": { "en": "Religious Organizations", "vn": "Tổ chức tôn giáo" },
    "8675": { "en": "Automobile Associations", "vn": "Hiệp hội ô tô" },
    "8699": { "en": "Membership Organizations - Not Elsewhere Classified", "vn": "Tổ chức thành viên - Không được phân loại ở nơi khác" },
    "8734": { "en": "Testing Laboratories (Not Medical)", "vn": "Phòng thí nghiệm thử nghiệm (Không phải y tế)" },
    "8911": { "en": "Architectural, Engineering, and Surveying Services", "vn": "Dịch vụ kiến trúc, kỹ thuật và khảo sát" },
    "8931": { "en": "Accounting, Auditing, and Bookkeeping Services", "vn": "Dịch vụ kế toán, kiểm toán và ghi sổ" },
    "8999": { "en": "Professional Services - Not Elsewhere Classified", "vn": "Dịch vụ chuyên nghiệp - Không được phân loại ở nơi khác" },
    "9211": { "en": "Court Costs, including Alimony and Child Support", "vn": "Chi phí tòa án, bao gồm Tiền cấp dưỡng và Hỗ trợ nuôi con" },
    "9222": { "en": "Fines", "vn": "Tiền phạt" },
    "9223": { "en": "Bail & Bond Payments", "vn": "Thanh toán tiền bảo lãnh và thế chân" },
    "9311": { "en": "Tax Payments", "vn": "Thanh toán thuế" },
    "9399": { "en": "Government Services - Not Elsewhere Classified", "vn": "Dịch vụ của chính phủ - Không được phân loại ở nơi khác" },
    "9402": { "en": "Postal Services - Government Only", "vn": "Dịch vụ bưu chính - Chỉ dành cho chính phủ" },
    "9405": { "en": "U.S. Federal Government Agencies or Departments", "vn": "Cơ quan hoặc Bộ của Chính phủ Liên bang Hoa Kỳ" },
    "9700": { "en": "Automated Referral Service", "vn": "Dịch vụ giới thiệu tự động" },
    "9701": { "en": "Visa Credential Server", "vn": "Máy chủ chứng thực Visa" },
    "9702": { "en": "GCAS Emergency Services", "vn": "Dịch vụ khẩn cấp GCAS" }
  }
}
import { getZonedDate } from './timezone';
/**
 * Calculates the split of cashback into Tier 1 and Tier 2 based on the card's monthly limit.
 *
 * @param {number} actualCashback - The base earned cashback from transactions.
 * @param {number} adjustment - Manual adjustment amount (can be negative).
 * @param {number} monthlyLimit - The "Overall Monthly Limit" of the card (Tier 1 cap).
 * @returns {{ total: number, tier1: number, tier2: number }}
 */
// Calculates cashback split for Tier 1 and Tier 2
export const calculateCashbackSplit = (actualCashback, adjustment, monthlyLimit) => {
    // ACTUAL CASHBACK from Notion already includes the adjustment (via Formula).
    // So we use it directly as the total.
    const total = (actualCashback || 0);

    // If there is no limit, everything is Tier 1 (or treat as single tier)
    if (!monthlyLimit || monthlyLimit <= 0) {
        return { total, tier1: total, tier2: 0 };
    }

    const tier1 = Math.min(total, monthlyLimit);
    const tier2 = Math.max(0, total - monthlyLimit);

    return { total, tier1, tier2 };
};

/**
 * Calculates the expected payment date based on the cashback month and payment method.
 *
 * @param {string} cashbackMonth - Format "YYYYMM" (e.g., "202310").
 * @param {string} paymentType - "M0", "M+1", "M+2", "Points", or null.
 * @param {number} statementDay - The card's statement day.
 * @returns {Date|string|null} - Returns a Date object for definite dates, "Accumulating" for points, or null.
 */
export const calculatePaymentDate = (cashbackMonth, paymentType, statementDay) => {
    // We need cashbackMonth, paymentType, and statementDay to form a date.
    if (!cashbackMonth || !paymentType || !statementDay) return null;

    // Ensure paymentType is a string and normalize it (Trim, Uppercase, Remove spaces)
    // This handles inputs like "m+1", "M + 1", "Points", "points ", etc.
    const normalizedType = String(paymentType).trim().toUpperCase().replace(/\s+/g, '');

    // Check for 'POINT' in the normalized string
    if (normalizedType.includes('POINT')) return 'Accumulating';

    let year, month;
    if (cashbackMonth.includes('-')) {
        // Handle YYYY-MM
        year = parseInt(cashbackMonth.split('-')[0], 10);
        month = parseInt(cashbackMonth.split('-')[1], 10);
    } else {
        // Handle YYYYMM
        year = parseInt(cashbackMonth.substring(0, 4), 10);
        month = parseInt(cashbackMonth.substring(4, 6), 10);
    }

    let offset = 0;
    if (normalizedType === 'M0') offset = 0;
    else if (normalizedType === 'M+1') offset = 1;
    else if (normalizedType === 'M+2') offset = 2;
    // Fallback: If unknown type, return null to avoid bad dates
    else return null;

    // Base target month (1-indexed) after applying offset
    // e.g. Month 10 (Oct), M+1 -> Target 11 (Nov)
    const targetMonth = month + offset;
    const targetYear = year;

    // Use Statement Day.
    // Date(year, monthIndex, day) handles overflow (e.g. monthIndex 12 becomes Jan next year).
    // targetMonth is 1-indexed (1..12+), so we pass targetMonth - 1.
    const targetDate = new Date(targetYear, targetMonth - 1, statementDay);
    return targetDate;
};

/**
 * Checks if the statement for a given month is finalized.
 * A statement is finalized if the current date is past the statement day of that month.
 *
 * @param {string} cashbackMonth - "YYYYMM" or "YYYY-MM"
 * @param {number} statementDay
 * @returns {boolean}
 */
export const isStatementFinalized = (cashbackMonth, statementDay) => {
    if (!cashbackMonth || !statementDay) return true; // Default to true if missing info to avoid locking

    let year, month;
    if (cashbackMonth.includes('-')) {
        // Handle YYYY-MM
        year = parseInt(cashbackMonth.split('-')[0], 10);
        month = parseInt(cashbackMonth.split('-')[1], 10);
    } else {
        // Handle YYYYMM
        year = parseInt(cashbackMonth.substring(0, 4), 10);
        month = parseInt(cashbackMonth.substring(4, 6), 10);
    }

    // Determine the statement date for this specific cashback month
    // Note: statementDay is just a day number. The statement date is that day in the cashback month.
    // e.g., Cashback Month Oct 2023, Statement Day 20 -> Statement Date is Oct 20, 2023.
    // However, if the cashback logic relies on "M+1" for payment, the statement itself
    // is usually generated at the end of the billing cycle.
    // The requirement says: "if the current date is before the statement day then the amount is not finalized"
    // This implies we are checking against the statement day OF THAT MONTH.

    const statementDate = new Date(year, month - 1, statementDay);
    statementDate.setHours(23, 59, 59, 999); // End of the statement day

    const now = getZonedDate();
    return now > statementDate;
};

/**
 * Determines the status of a payment.
 *
 * @param {number} amountDue
 * @param {number} amountPaid
 * @param {Date|string} dueDate
 * @returns {{ status: 'paid'|'partial'|'unpaid'|'overdue', label: string, color: string }}
 */
export const getPaymentStatus = (amountDue, amountPaid, dueDate) => {
    // If nothing due, consider it handled or ignore
    if (amountDue <= 0) return { status: 'paid', label: 'Paid', color: 'bg-green-100 text-green-800' };

    const paid = amountPaid || 0;

    if (paid >= amountDue) {
        return { status: 'paid', label: 'Paid', color: 'bg-green-100 text-green-800' };
    }

    if (paid > 0) {
        return { status: 'partial', label: 'Partial', color: 'bg-yellow-100 text-yellow-800' };
    }

    // It is unpaid. Check if overdue.
    if (dueDate instanceof Date) {
        const today = getZonedDate();
        today.setHours(0,0,0,0);
        // If due date is strictly before today, it's overdue
        if (dueDate < today) {
             return { status: 'overdue', label: 'Overdue', color: 'bg-red-100 text-red-800' };
        }
    }

    return { status: 'unpaid', label: 'Unpaid', color: 'bg-gray-100 text-gray-800' };
};

// Regex for [Redeemed <amount> (on <date>)?: <note>]
// Updated to support decimal amounts and optional commas: ([\d,]+(?:\.\d+)?)
// Updated to support optional time: (\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2})?)
export const RE_REDEMPTION_LOG = /\[Redeemed\s+([\d,]+(?:\.\d+)?)(?:\s+on\s+(\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2})?))?(?::\s*(.*?))?\]/g;

/**
 * Groups monthly summary items into a unified history timeline.
 *
 * @param {Array} items - Array of monthly summary items (from cardData.items)
 * @param {number} [statementDay] - Optional statement day to determine the exact earn date
 * @returns {Array} - Sorted array of events { type: 'earned'|'redeemed', date, amount, ... }
 */
export const groupRedemptionEvents = (items, statementDay) => {
    const events = [];
    const redemptionMap = new Map(); // Key: "date-note", Value: { totalAmount, contributors: [] }

    if (!items) return [];

    // 1. Process Items
    items.forEach(item => {
        let loggedRedemption = 0; // Track logged amount to detect manual adjustments

        // Parse month info once
        let year, month;
        if (item.month.includes('-')) {
             const p = item.month.split('-');
             year = parseInt(p[0], 10);
             month = parseInt(p[1], 10);
        } else {
             year = parseInt(item.month.substring(0, 4), 10);
             month = parseInt(item.month.substring(4, 6), 10);
        }

        // A. Earned Events
        if (item.totalEarned > 0) {
            // Use statement day if available, otherwise 1st of month
            const day = statementDay || 1;
            // Basic YYYY-MM-DD formatting
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            events.push({
                type: 'earned',
                id: `earned-${item.id}`,
                date: dateStr,
                amount: item.totalEarned,
                month: item.month,
                item: item
            });
        }

        // B. Redemption Logs
        if (item.notes) {
            let match;
            // Reset regex lastIndex
            RE_REDEMPTION_LOG.lastIndex = 0;

            while ((match = RE_REDEMPTION_LOG.exec(item.notes)) !== null) {
                const amount = Number(match[1].replace(/,/g, ''));
                loggedRedemption += amount;

                let dateStr = match[2];
                let note = match[3] ? match[3].trim() : '';
                const fullLog = match[0];

                // Legacy format handling (if needed, copying logic from CashbackTracker)
                if (!dateStr) {
                    // Fallback to item month end if date missing
                    const d = new Date(year, month, 0).getDate();
                    dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                }

                const key = `${dateStr}|${note || 'Redemption'}`;

                if (!redemptionMap.has(key)) {
                    redemptionMap.set(key, {
                        type: 'redeemed',
                        id: `redeem-${key}`,
                        date: dateStr,
                        note: note || 'Redemption',
                        amount: 0,
                        contributors: []
                    });
                }

                const event = redemptionMap.get(key);
                event.amount += amount;
                event.contributors.push({
                    itemId: item.id,
                    month: item.month,
                    amount: amount,
                    originalLog: fullLog
                });
            }
        }

        // C. Detect Manual/Unlogged Redemptions
        // If the total Amount Redeemed is greater than what's logged in notes, capture the difference.
        const totalRedeemed = Number(item.amountRedeemed) || 0;
        if (totalRedeemed > loggedRedemption + 0.01) {
             const diff = totalRedeemed - loggedRedemption;

             // Default to Statement Date for manual adjustments
             const day = statementDay || 1;
             const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
             const note = "Manual Redemption";

             const key = `${dateStr}|${note}`;

             if (!redemptionMap.has(key)) {
                  redemptionMap.set(key, {
                      type: 'redeemed',
                      id: `redeem-manual-${dateStr}`,
                      date: dateStr,
                      note: note,
                      amount: 0,
                      contributors: []
                  });
             }
             const event = redemptionMap.get(key);
             event.amount += diff;
             event.contributors.push({
                 itemId: item.id,
                 month: item.month,
                 amount: diff,
                 originalLog: "(Manual Adjustment)"
             });
        }
    });

    // 2. Merge Redemptions into Events
    redemptionMap.forEach(event => events.push(event));

    // 3. Sort by Date Descending
    // Note: Earned events date might be YYYYMM or YYYY-MM. Redeemed is YYYY-MM-DD.
    // We normalize to string comparison which works for YYYY...
    return events.sort((a, b) => b.date.localeCompare(a.date));
};
// src/lib/stats.js
import { getPastNMonths } from './date';

/**
 * Generates an array of metric data for a sparkline chart.
 * @param {Array} monthlySummary - The array of all monthly summary data.
 * @param {string} endMonth - The most recent month to include (e.g., '2024-07').
 * @param {number} length - The number of months to retrieve (e.g., 6).
 * @param {string} metric - The key of the metric to sum (e.g., 'spend', 'cashback').
 * @returns {Array<number>} - An array of numerical values for the sparkline.
 */
export const getMetricSparkline = (monthlySummary, endMonth, length, metric) => {
    // Get the array of month strings (e.g., ['2024-02', '2024-03', ..., '2024-07'])
    const months = getPastNMonths(endMonth, length);

    return months.map(month => {
        return monthlySummary
            .filter(s => s.month === month)
            .reduce((acc, curr) => acc + (curr[metric] || 0), 0);
    });
};
/**
 * A constant array of hex color codes for charts.
 */
export const COLORS = ['#0ea5e9', '#84cc16', '#f43f5e', '#f59e0b', '#6366f1', '#14b8a6', '#d946ef'];

/**
 * An object defining the gradient and text color themes for different bank cards.
 */
export const cardThemes = {
    'VIB': { gradient: 'bg-gradient-to-r from-sky-500 to-sky-700', textColor: 'text-white' },
    'HSBC': { gradient: 'bg-gradient-to-r from-red-600 to-red-800', textColor: 'text-white' },
    'Shinhan Bank': { gradient: 'bg-gradient-to-r from-blue-400 to-blue-600', textColor: 'text-white' },
    'Techcombank': { gradient: 'bg-gradient-to-r from-red-500 to-orange-500', textColor: 'text-white' },
    'Kbank': { gradient: 'bg-gradient-to-r from-lime-500 to-green-600', textColor: 'text-white' },
    'Cake': { gradient: 'bg-gradient-to-r from-pink-500 to-fuchsia-600', textColor: 'text-white' },
    'MSB': { gradient: 'bg-gradient-to-r from-orange-500 to-orange-700', textColor: 'text-white' },
    'UOB': { gradient: 'bg-gradient-to-r from-blue-700 to-blue-900', textColor: 'text-white' },
    'default': { gradient: 'bg-gradient-to-r from-slate-600 to-slate-800', textColor: 'text-white' },
};
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
import { getZonedDate, getTimezone } from './timezone';

/**
 * Gets the current month and year string in YYYYMM format.
 * @param {Date} [date] - The date object to use. Defaults to zoned current time.
 * @returns {string} - The formatted string (e.g., "202510").
 */
export function getTodaysMonth(date = getZonedDate()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}${month}`; // Returns 'YYYYMM'
}

/**
 * Gets the previous month string relative to a given 'YYYYMM' string.
 * @param {string} monthString - The month string ('YYYYMM') to calculate from.
 * @returns {string | null} - The formatted string for the previous month (e.g., "202509").
 */
export const getPreviousMonth = (monthString) => {
    // Expects "YYYYMM" format
    if (!monthString || monthString.length !== 6) return null;

    const year = parseInt(monthString.substring(0, 4), 10);
    const month = parseInt(monthString.substring(4, 6), 10); // 1-12

    // new Date(year, month - 2) creates a date for the *previous* month.
    // (Month is 0-indexed, so 10 (Oct) becomes 9. 9-1 = 8, which is September)
    const prevMonthDate = new Date(year, month - 2, 1);

    const prevYear = prevMonthDate.getFullYear();
    const prevMonth = String(prevMonthDate.getMonth() + 1).padStart(2, '0');

    return `${prevYear}${prevMonth}`;
};

/**
 * Gets an array of month strings (YYYYMM) for the past N months, ending at endMonth.
 * @param {string} endMonth - The ending month in 'YYYYMM' format (e.g., '202407').
 * @param {number} length - The number of months to retrieve.
 * @returns {string[]} - Array of month strings (e.g., ['202402', ..., '202407']).
 */
export const getPastNMonths = (endMonth, length) => {
    // Add this check to prevent the 'slice of null' error
    if (!endMonth || typeof endMonth !== 'string' || endMonth.length !== 6) {
        console.warn('getPastNMonths called with invalid endMonth:', endMonth);
        return [];
    }

    const months = [];
    const year = parseInt(endMonth.slice(0, 4), 10);
    const month = parseInt(endMonth.slice(4, 6), 10) - 1; // 0-indexed month

    for (let i = 0; i < length; i++) {
        const d = new Date(year, month - i, 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        months.push(`${y}${m}`);
    }
    return months.reverse(); // Return in chronological order
};

/**
 * Calculates the number of days left until a given payment date string.
 * @param {string} paymentDateString - The due date in 'YYYY-MM-DD' format.
 * @returns {number | null} - The number of days remaining, or null if invalid or past.
 */
export const calculateDaysLeft = (paymentDateString) => {
    if (!paymentDateString || paymentDateString === "N/A") return null;

    const today = getZonedDate();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(paymentDateString);
    dueDate.setHours(0, 0, 0, 0);

    if (isNaN(dueDate)) return null;

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    return diffDays >= 0 ? diffDays : null;
};

/**
 * Calculates the days left in a given cashback month (e.g., '202510').
 * @param {string} cashbackMonth - The month in 'YYYYMM' format.
 * @returns {{days: number | null, status: string}} - An object with days left and status.
 */
export const calculateDaysLeftInCashbackMonth = (cashbackMonth) => {
    if (!cashbackMonth) return { days: null, status: 'N/A' };

    const today = getZonedDate();
    today.setHours(0, 0, 0, 0);

    const year = parseInt(cashbackMonth.slice(0, 4), 10);
    const month = parseInt(cashbackMonth.slice(4, 6), 10);

    const lastDayOfMonth = new Date(year, month, 0);

    if (isNaN(lastDayOfMonth.getTime())) return { days: null, status: 'N/A' };

    const diffTime = lastDayOfMonth.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { days: null, status: 'Completed' };
    }
    return { days: diffDays, status: 'Upcoming' };
};

/**
 * Calculates the days until the next statement date for a given month.
 * @param {number} statementDay - The day of the month the statement is generated.
 * @param {string} activeMonth - The month to check in 'YYYYMM' format.
 * @returns {{days: number | null, status: string}} - An object with days left and status.
 */
export const calculateDaysUntilStatement = (statementDay, activeMonth) => {
    if (!statementDay || !activeMonth) return { days: null, status: 'N/A' };

    const today = getZonedDate();
    today.setHours(0, 0, 0, 0);

    const year = parseInt(activeMonth.slice(0, 4), 10);
    const month = parseInt(activeMonth.slice(4, 6), 10);

    const statementDate = new Date(year, month - 1, statementDay);

    if (isNaN(statementDate.getTime())) return { days: null, status: 'N/A' };

    const diffTime = statementDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { days: null, status: 'Completed' };
    }
    return { days: diffDays, status: 'Upcoming' };
};

/**
 * --- NEW REPLACEMENT FUNCTION ---
 * Gets the current cashback month for a specific card based on its statement day.
 * If no card is provided, defaults to the current calendar month.
 * @param {object} [card] - The card object (must have statementDay and useStatementMonthForPayments).
 * @param {string} [transactionDateStr] - An optional date string to calculate for.
 * @returns {string} - The current month in 'YYYYMM' format.
 */
export const getCurrentCashbackMonthForCard = (card = null, transactionDateStr = null) => {
    // If a transaction date string is provided, we still use getZonedDate to interpret it in our timezone,
    // unless it's just a pure date string we want to keep absolute. But typically transactions have times.
    const effectiveDate = transactionDateStr ? getZonedDate(new Date(transactionDateStr)) : getZonedDate();

    let year = effectiveDate.getFullYear();
    let month = effectiveDate.getMonth(); // 0-indexed

    // Default to current calendar month if no card is passed
    if (!card) {
        const finalMonth = month + 1;
        return `${year}${String(finalMonth).padStart(2, '0')}`;
    }

    if (card.useStatementMonthForPayments) {
        const currentMonth = month + 1;
        return `${year}${String(currentMonth).padStart(2, '0')}`;
    }

    if (effectiveDate.getDate() >= card.statementDay) {
        month += 1;
    }

    if (month > 11) {
        month = 0;
        year += 1;
    }

    const finalMonth = month + 1;
    return `${year}${String(finalMonth).padStart(2, '0')}`;
};

/**
 * Calculates the progress of the annual fee cycle.
 * @param {string} openDateStr - The card open date string.
 * @param {string} nextFeeDateStr - The next annual fee date string.
 * @returns {{daysPast: number, progressPercent: number}} - Object containing days past and progress percentage.
 */
export const calculateFeeCycleProgress = (openDateStr, nextFeeDateStr) => {
    if (!openDateStr || !nextFeeDateStr) return { daysPast: 0, progressPercent: 0 };

    const openDate = new Date(openDateStr);
    const nextFeeDate = new Date(nextFeeDateStr);
    const today = getZonedDate();

    const totalDuration = nextFeeDate.getTime() - openDate.getTime();
    const elapsedDuration = today.getTime() - openDate.getTime();

    if (totalDuration <= 0) return { daysPast: 0, progressPercent: 0 };

    const daysPast = Math.floor(elapsedDuration / (1000 * 60 * 60 * 24));
    const progressPercent = Math.min(100, Math.round((elapsedDuration / totalDuration) * 100));

    return { daysPast, progressPercent };
};

/**
 * Formats a date string into a standard date format (e.g., "06 Jan 2026").
 * @param {string} dateStr - The date string to format.
 * @returns {string} - The formatted date string.
 */
export const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: getTimezone() });
    } catch (e) {
        return dateStr;
    }
};

/**
 * Formats a date string into a date and time format (e.g., "06 Jan • 00:32").
 * @param {string} dateStr - The date string to format.
 * @returns {string} - The formatted date and time string.
 */
export const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        const tz = getTimezone();
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: tz }) + ' • ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz });
    } catch (e) {
        return dateStr;
    }
};

/**
 * Formats a date string for transactions.
 * Includes time if the input string indicates presence of time (e.g. ISO format).
 * Returns "DD MMM YYYY" or "DD MMM YYYY • HH:mm".
 * @param {string} dateStr - The date string to format.
 * @returns {string} - The formatted string.
 */
export const formatTransactionDate = (dateStr) => {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;

        const tz = getTimezone();
        // Simple heuristic: YYYY-MM-DD is 10 chars. ISO string with time is longer.
        const hasTime = dateStr.length > 10;

        const datePart = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: tz });

        if (hasTime) {
            const timePart = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz });
            return `${datePart} • ${timePart}`;
        }

        return datePart;
    } catch (e) {
        return dateStr;
    }
};

/**
 * Formats a date string into a full verbose date and time format (e.g., "Tuesday, 06 Jan 2026 at 00:32").
 * @param {string} dateStr - The date string to format.
 * @returns {string} - The formatted full date and time string.
 */
export const formatFullDateTime = (dateStr) => {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        const tz = getTimezone();
        return d.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric', timeZone: tz }) + ' at ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz });
    } catch (e) {
        return dateStr;
    }
};
/**
 * Formats a number into Vietnamese Dong (VND) currency string.
 * @param {number} n - The number to format.
 * @returns {string} - The formatted currency string (e.g., "1.234.567 ₫").
 */
export const currency = (n) => (n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

/**
 * Formats a 'YYYYMM' code into a short month and year string.
 * @param {string} ymCode - The year-month code (e.g., '202510').
 * @returns {string} - The formatted string (e.g., "Oct 2025").
 */
export const fmtYMShort = (ymCode) => {
    if (!ymCode || typeof ymCode !== 'string' || ymCode.length !== 6) return "";
    const year = Number(ymCode.slice(0, 4));
    const month = Number(ymCode.slice(4, 6));
    if (isNaN(year) || isNaN(month)) return "";
    return new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'short', year: 'numeric' });
};
export const DEFAULT_TIMEZONE = 'Asia/Ho_Chi_Minh';

export const getTimezone = () => {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('app_timezone');
        if (stored) return stored;
    }
    return DEFAULT_TIMEZONE;
};

export const setTimezone = (tz) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('app_timezone', tz);
    }
};

/**
 * Returns a local Date object that corresponds to the wall-clock time
 * of the provided date in the selected timezone.
 * Useful for extracting year, month, date, hours matching the timezone.
 * DO NOT use this for absolute time comparisons (.getTime()) against real UTC dates.
 */
export const getZonedDate = (date = new Date()) => {
    const tz = getTimezone();
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
    });

    const parts = formatter.formatToParts(date);
    const getPart = (type) => parts.find(p => p.type === type)?.value;

    const year = parseInt(getPart('year'), 10);
    const month = parseInt(getPart('month'), 10) - 1;
    const day = parseInt(getPart('day'), 10);
    let hour = parseInt(getPart('hour'), 10);
    if (hour === 24) hour = 0; // en-US hour12: false can return 24 for midnight
    const minute = parseInt(getPart('minute'), 10);
    const second = parseInt(getPart('second'), 10);

    return new Date(year, month, day, hour, minute, second);
};
