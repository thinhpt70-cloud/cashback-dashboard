// src/components/dashboard/dialogs/AddTransactionSheet.jsx
import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import AddTransactionForm from '@/components/dashboard/forms/AddTransactionForm';
import { cn } from "@/lib/utils";
import useMediaQuery from "@/hooks/useMediaQuery";

export default function AddTransactionSheet({
    isOpen,
    onOpenChange,
    transaction, // This is the editingTransaction
    onTransactionAdded,
    onTransactionUpdated,
    cards,
    allCategories,
    commonVendors,
    cashbackRules,
    monthlyCashbackCategories,
    mccMap,
    monthlySummary,
    monthlyCategorySummary,
    getCurrentCashbackMonthForCard
}) {
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const sheetSide = isDesktop ? 'right' : 'bottom';
    const isEditing = !!transaction;

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent
                side={sheetSide}
                className={cn(
                    "flex flex-col p-0",
                    "w-full sm:max-w-2xl",
                    !isDesktop && "h-[90dvh]"
                )}
            >
                <SheetHeader className="px-6 pt-6">
                    <SheetTitle>{isEditing ? 'Edit Transaction' : 'Add a New Transaction'}</SheetTitle>
                </SheetHeader>
                <div className="flex-grow overflow-y-auto px-6 pb-6">
                    <AddTransactionForm
                        cards={cards}
                        categories={allCategories}
                        rules={cashbackRules}
                        monthlyCategories={monthlyCashbackCategories}
                        mccMap={mccMap}
                        onTransactionAdded={onTransactionAdded}
                        onTransactionUpdated={onTransactionUpdated}
                        commonVendors={commonVendors}
                        monthlySummary={monthlySummary}
                        monthlyCategorySummary={monthlyCategorySummary}
                        getCurrentCashbackMonthForCard={getCurrentCashbackMonthForCard}
                        initialData={transaction}
                        onClose={() => onOpenChange(false)}
                    />
                </div>
            </SheetContent>
        </Sheet>
    );
}
