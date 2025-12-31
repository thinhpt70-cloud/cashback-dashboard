import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Sparkles, CalendarClock, Info, X, Store, Globe, Laptop, CreditCard } from 'lucide-react';
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
import { useForm, FormProvider } from 'react-hook-form';
import { cn } from '@/lib/utils';


export default function AddTransactionForm({ cards, categories, rules, monthlyCategories, mccMap, onTransactionAdded, commonVendors, monthlySummary, monthlyCategorySummary, getCurrentCashbackMonthForCard, onTransactionUpdated, initialData, prefillData, onClose, needsSyncing, setNeedsSyncing }) {
    const form = useForm({
        defaultValues: {
            subCategory: [],
        }
    });
    // --- State Management ---
    const [merchant, setMerchant] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
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
            setDate(sourceData['Transaction Date'] || new Date().toISOString().slice(0, 10));
            setCardId(sourceData['Card'] ? String(sourceData['Card'][0]) : '');
            setApplicableRuleId(sourceData['Applicable Rule'] ? String(sourceData['Applicable Rule'][0]) : '');
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
            const res = await fetch(`/api/lookup-merchant?keyword=${encodeURIComponent(trimmedMerchant)}`);
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
            id: initialData ? initialData.id : new Date().toISOString(),
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

        setNeedsSyncing([...needsSyncing, transactionData]);

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

    const renderMethodSelector = () => (
        <div className="grid grid-cols-3 gap-1 p-1 bg-muted/50 rounded-lg">
             <button
                type="button"
                onClick={() => setMethod('POS')}
                className={cn(
                    "flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all",
                    method === 'POS'
                        ? "bg-white dark:bg-slate-800 shadow-sm text-sky-600 dark:text-sky-400"
                        : "text-muted-foreground hover:bg-white/50 dark:hover:bg-slate-800/50"
                )}
            >
                <Store className="h-4 w-4" />
                POS
            </button>
            <button
                type="button"
                onClick={() => setMethod('eCom')}
                className={cn(
                    "flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all",
                    method === 'eCom'
                        ? "bg-white dark:bg-slate-800 shadow-sm text-emerald-600 dark:text-emerald-400"
                        : "text-muted-foreground hover:bg-white/50 dark:hover:bg-slate-800/50"
                )}
            >
                <Laptop className="h-4 w-4" />
                eCom
            </button>
            <button
                type="button"
                onClick={() => setMethod('International')}
                className={cn(
                    "flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all",
                    method === 'International'
                        ? "bg-white dark:bg-slate-800 shadow-sm text-orange-600 dark:text-orange-400"
                        : "text-muted-foreground hover:bg-white/50 dark:hover:bg-slate-800/50"
                )}
            >
                <Globe className="h-4 w-4" />
                Int'l
            </button>
        </div>
    );

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
                            className="w-full bg-transparent text-center text-5xl font-bold placeholder:text-muted-foreground/30 focus:outline-none focus:ring-0"
                            required
                        />
                    </div>

                    {/* Date Pill */}
                     <div className="relative">
                        <button
                            type="button"
                            onClick={() => dateInputRef.current?.showPicker()}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted/50 hover:bg-muted text-sm font-medium transition-colors"
                        >
                            <CalendarClock className="h-4 w-4 text-muted-foreground" />
                            {new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </button>
                        <input
                            ref={dateInputRef}
                            type="date"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
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
                            options={categories.map(c => ({ value: c, label: c }))}
                            value={category}
                            onChange={setCategory}
                            placeholder="Select category"
                            searchPlaceholder="Search..."
                            className="h-12"
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
                                        {['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'SGD', 'THB', 'KRW'].map(curr => (
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


                {/* --- 5. SMART CARD RECOMMENDATIONS --- */}
                <CardRecommendations
                    recommendations={rankedCards}
                    onSelectCard={handleCardSelect}
                    currencyFn={currencyFn}
                    selectedCardId={cardId}
                />

                {/* --- 6. MANUAL OVERRIDES (Collapsible) --- */}
                 <Accordion type="single" collapsible className="w-full border rounded-lg bg-card">
                    <AccordionItem value="card-override" className="border-none">
                        <AccordionTrigger className="px-4 py-3 text-sm font-medium text-muted-foreground hover:no-underline hover:bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4" />
                                Manual Card Selection
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 space-y-4 pt-2">
                             <div className="space-y-2">
                                <label htmlFor="card" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Card</label>
                                <Select value={cardId} onValueChange={(value) => { handleCardSelect(value); localStorage.setItem('lastUsedCardId', value); }}>
                                    <SelectTrigger>
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
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder={filteredRules.length === 0 ? 'No active rules' : 'Select rule...'} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredRules.map(rule => (
                                                <SelectItem key={rule.id} value={rule.id} disabled={rule.status === 'Inactive'}>
                                                    <div className="flex w-full items-center justify-between gap-4">
                                                        <span>{rule.ruleName}</span>
                                                        <Badge variant="secondary" className="ml-auto text-xs">{(rule.rate * 100).toFixed(1)}%</Badge>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                     <Popover>
                                        <PopoverTrigger asChild>
                                            <Button type="button" variant="ghost" size="icon" disabled={!selectedRule}>
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
                        </AccordionContent>
                    </AccordionItem>
                 </Accordion>


                {/* --- 7. ADDITIONAL DETAILS (Collapsible) --- */}
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="more-details" className="border-none">
                         <AccordionTrigger className="py-2 text-sm text-muted-foreground hover:no-underline">
                            More Details (Sub-category, Paid For, Notes)
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 space-y-4">
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="merchantLookup">Merchant Name (Clean)</label>
                                    <Input
                                        id="merchantLookup"
                                        value={merchantLookup}
                                        onChange={(e) => setMerchantLookup(e.target.value)}
                                        placeholder="Optional override"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="mcc">MCC Code</label>
                                    <div className="relative">
                                        <Input
                                            id="mcc"
                                            value={mccCode}
                                            onChange={(e) => setMccCode(e.target.value)}
                                            placeholder="e.g. 5411"
                                            type="number"
                                        />
                                        {mccName && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground bg-background px-1">{mccName}</span>}
                                    </div>
                                </div>
                            </div>

                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <TagsInputField
                                        name="subCategory"
                                        label="Sub Category"
                                        placeholder="Add tags..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="paidFor">Paid For</label>
                                    <Combobox
                                        options={['Personal', 'Family', 'Work'].map(c => ({ value: c, label: c }))}
                                        value={paidFor}
                                        onChange={setPaidFor}
                                        placeholder="Who is this for?"
                                        searchPlaceholder="Search..."
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
                                        <Button type="button" variant="ghost" size="icon" onClick={() => setDiscounts(discounts.filter((_, i) => i !== index))}>
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
                                        <Button type="button" variant="ghost" size="icon" onClick={() => setFees(fees.filter((_, i) => i !== index))}>
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
                
                {/* --- 8. SUBMIT --- */}
                <div className="sticky bottom-0 bg-background/95 backdrop-blur pt-4 pb-4 border-t mt-8">
                     <Button type="submit" disabled={isSubmitting} size="lg" className="w-full text-lg h-12 shadow-lg">
                        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (initialData ? "Update Transaction" : "Add Transaction")}
                    </Button>
                </div>
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
