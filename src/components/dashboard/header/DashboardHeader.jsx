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
                        <Button variant="ghost" size="icon" aria-label="Toggle menu">
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
                            <div className="grow overflow-y-auto px-6 pb-6">
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
                            <div className="grow overflow-y-auto px-6 pb-6">
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
                            <Button variant="default" size="icon" className="h-10 w-10 rounded-full shadow-lg" aria-label="Add transaction">
                                <Plus className="h-6 w-6" />
                            </Button>
                        </DrawerTrigger>
                        <DrawerContent className="h-[90vh]">
                            <DrawerHeader>
                                <DrawerTitle>Add Transaction</DrawerTitle>
                            </DrawerHeader>
                            <div className="flex-1 min-h-0 px-4 pb-4 overflow-y-auto">
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
                    <Drawer open={!!editingTransaction && !isDesktop} onOpenChange={(isOpen) => !isOpen && setEditingTransaction(null)}>
                        <DrawerContent className="h-[90vh]">
                            <DrawerHeader>
                                <DrawerTitle>Edit Transaction</DrawerTitle>
                            </DrawerHeader>
                            <div className="flex-1 min-h-0 px-4 pb-4 overflow-y-auto">
                                {editingTransaction && !isDesktop && (
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
                                )}
                            </div>
                        </DrawerContent>
                    </Drawer>
                </div>
            </div>
        </header>
    );
}