import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Sparkles, CalendarClock, AlertTriangle, Info, X } from 'lucide-react';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../ui/tooltip';
import { Textarea } from '../../ui/textarea'; // <-- FIX: Import the Textarea component
import { Combobox } from '../../ui/combobox';
import { TagsInputField } from '../../ui/tag-input';
import { Switch } from '../../ui/switch';
import QuickAddButtons from './QuickAddButtons';
import CardRecommendations from './CardRecommendations';
import useIOSKeyboardGapFix from '../../../hooks/useIOSKeyboardGapFix';
import MccSearchResultsDialog from './MccSearchResultsDialog';
import useCardRecommendations from '../../../hooks/useCardRecommendations';
import { useForm, FormProvider } from 'react-hook-form';


export default function AddTransactionForm({ cards, categories, rules, monthlyCategories, mccMap, onTransactionAdded, commonVendors, monthlySummary, monthlyCategorySummary, getCurrentCashbackMonthForCard, onTransactionUpdated, initialData, onClose, needsSyncing, setNeedsSyncing }) {
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

    // --- NEW STATE FOR THE NEW FIELDS ---
    const [notes, setNotes] = useState('');
    const [paidFor, setPaidFor] = useState('');
    const [billingDate, setBillingDate] = useState('');
    const [isForeignCurrency, setIsForeignCurrency] = useState(false);
    const [foreignCurrencyAmount, setForeignCurrencyAmount] = useState('');
    const [foreignCurrency, setForeignCurrency] = useState('USD');
    const [conversionFee, setConversionFee] = useState('');
    const [discounts, setDiscounts] = useState([]);
    const [fees, setFees] = useState([]);

    useIOSKeyboardGapFix();

    const amountInputRef = useRef(null);

    useEffect(() => {
        if (mccMap && mccCode && mccMap[mccCode]) {
            setMccName(mccMap[mccCode].vn);
        } else {
            setMccName('');
        }
    }, [mccCode, mccMap]);

    useEffect(() => {
        if (initialData) {
            // Automatically clean the "Email_" prefix for a better user experience
            let initialMerchant = initialData['Transaction Name'] || '';
            if (initialMerchant.startsWith('Email_')) {
                initialMerchant = initialMerchant.substring(6); // Remove "Email_"
            }

            setMerchant(initialMerchant || '');
            setAmount((initialData['Amount'] || '').toLocaleString('en-US'));
            setDate(initialData['Transaction Date'] || new Date().toISOString().slice(0, 10));
            setCardId(initialData['Card'] ? initialData['Card'][0] : '');
            setApplicableRuleId(initialData['Applicable Rule'] ? initialData['Applicable Rule'][0] : '');
            setCardSummaryCategoryId(initialData['Card Summary Category'] ? initialData['Card Summary Category'][0] : 'new'); // <-- ADDED THIS
            setCategory(initialData['Category'] || '');
            setMccCode(initialData['MCC Code'] || '');
            setMerchantLookup(initialData['merchantLookup'] || '');
            const notes = initialData['notes'] || '';
            const discountsMatch = notes.match(/Discounts: (.*)/);
            const feesMatch = notes.match(/Fees: (.*)/);
            if (discountsMatch) {
                setDiscounts(JSON.parse(discountsMatch[1]));
            }
            if (feesMatch) {
                setFees(JSON.parse(feesMatch[1]));
            }
            setNotes(notes.split('\n\nDiscounts:')[0]);
            setPaidFor(initialData['paidFor'] || '');
            form.setValue('subCategory', initialData['subCategory'] || []);
            setBillingDate(initialData['billingDate'] || '');

            if (initialData.foreignCurrencyAmount) {
                setIsForeignCurrency(true);
                setForeignCurrencyAmount(initialData.foreignCurrencyAmount.toLocaleString('en-US'));
                setConversionFee(initialData.conversionFee.toLocaleString('en-US'));
            }
        }
    }, [initialData, form]);

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
        return rules.filter(rule => rule.cardId === cardId && rule.status === 'Active').sort((a, b) => a.name.localeCompare(b.name));
    }, [cardId, rules]);
    const selectedRule = useMemo(() => rules.find(r => r.id === applicableRuleId), [applicableRuleId, rules]);
    
    // --- UPDATED: Use the passed-in function ---
    const cashbackMonth = useMemo(() => {
        if (!selectedCard || !date) return null;
        return getCurrentCashbackMonthForCard(selectedCard, date);
    }, [selectedCard, date, getCurrentCashbackMonthForCard]);
    
    const filteredSummaries = useMemo(() => {
        if (!selectedRule || !cardId || !cashbackMonth) return [];
        const targetSummaryId = `${cashbackMonth} - ${selectedRule.name}`;
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
            s.summaryId.endsWith(selectedRule.name)
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
        if (isForeignCurrency && selectedCard && foreignCurrencyAmount) {
            const amount = parseFloat(String(foreignCurrencyAmount).replace(/,/g, ''));
            const fee = amount * (selectedCard.foreignFee || 0);
            setConversionFee(fee.toLocaleString('en-US', { maximumFractionDigits: 2 }));
        }
    }, [isForeignCurrency, selectedCard, foreignCurrencyAmount]);

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
        setIsForeignCurrency(false);
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
        if (!merchant) return;
        setIsLookingUp(true);
        setLookupResults([]);
        setShowLookupButton(false);

        try {
            const res = await fetch(`/api/lookup-merchant?keyword=${encodeURIComponent(merchant)}`);
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
        const transactionData = {
            id: initialData ? initialData.id : new Date().toISOString(),
            merchant,
            amount: parseFloat(String(amount).replace(/,/g, '')),
            date,
            cardId,
            category: category || null,
            mccCode: mccCode || null,
            merchantLookup: merchantLookup || null,
            applicableRuleId: applicableRuleId || null,
            notes: `${notes || ''}\n\nDiscounts: ${JSON.stringify(discounts)}\nFees: ${JSON.stringify(fees)}`,
            otherDiscounts: discounts.reduce((acc, d) => acc + parseFloat(d.amount.replace(/,/g, '') || 0), 0),
            otherFees: fees.reduce((acc, f) => acc + parseFloat(f.amount.replace(/,/g, '') || 0), 0),
            foreignCurrencyAmount: isForeignCurrency ? parseFloat(String(foreignCurrencyAmount).replace(/,/g, '')) : null,
            conversionFee: isForeignCurrency ? parseFloat(String(conversionFee).replace(/,/g, '')) : null,
            paidFor: paidFor || null,
            subCategory: data.subCategory || [],
            billingDate: billingDate || null,
            status: 'pending',
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
        setApplicableRuleId(selectedRuleId || ''); 
    };

    return (
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4">
                <QuickAddButtons vendors={commonVendors} onSelect={handleVendorSelect} />
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="merchant">Transaction Name</label>
                        <div className="relative flex items-center">
                            <Input id="merchant" value={merchant} onChange={(e) => { setMerchant(e.target.value); setShowLookupButton(false); }} required className="pr-12" />
                            <div className="absolute right-2 flex items-center gap-2">
                                <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={handleMerchantLookup} disabled={!merchant || isLookingUp}>
                                    {isLookingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        {showLookupButton && (
                            <div className="pt-2">
                                <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => setIsLookupDialogOpen(true)}>
                                    View Other Suggestions
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="merchantLookup">Merchant Name</label>
                            <Input 
                                id="merchantLookup" 
                                value={merchantLookup} 
                                onChange={(e) => setMerchantLookup(e.target.value)} 
                                placeholder="e.g., GRAB, SHOPEE" 
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="mcc">MCC Code</label>
                            <Input 
                                id="mcc" 
                                value={mccCode} 
                                onChange={(e) => setMccCode(e.target.value)} 
                                placeholder="e.g., 5411" 
                                type="number"
                            />
                            {mccName && <p className="text-xs text-muted-foreground pt-1">{mccName}</p>}
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="amount">Amount</label>
                            <Input ref={amountInputRef} id="amount" type="text" inputMode="numeric" value={amount} onChange={handleAmountChange} required />
                        </div>
                        {/* MODIFIED: Adopted the working code structure for the date field */}
                        <div className="space-y-2">
                            <label htmlFor="date">Date</label>
                            <div className="relative flex items-center">
                                <CalendarClock className="absolute left-3 z-10 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    id="date" 
                                    type="date" 
                                    className="w-full pl-10" 
                                    value={date} 
                                    onChange={(e) => setDate(e.target.value)} 
                                    required 
                                />
                            </div>
                        </div>
                    </div>

                    <CardRecommendations 
                        recommendations={rankedCards} 
                        onSelectCard={handleCardSelect}
                        currencyFn={currencyFn}
                        selectedCardId={cardId}
                    />
                </div>

                <div className="space-y-4 border-t pt-6">
                    <div className="space-y-2">
                        <label htmlFor="card">Card</label>
                        <select id="card" value={cardId} onChange={(e) => { setCardId(e.target.value); setApplicableRuleId(''); localStorage.setItem('lastUsedCardId', e.target.value); }} className="w-full p-2 border border-input bg-background rounded cursor-pointer" required> {/* <-- FIX: Added border-input and bg-background */}
                            {/* Removed default "Select Card" option, selection is handled by useEffect */}
                            {[...cards].sort((a, b) => a.name.localeCompare(b.name)).map(card => <option key={card.id} value={card.id}>{card.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="rule">Applicable Cashback Rule</label>
                        <div className="flex items-center gap-2">
                        <select id="rule" value={applicableRuleId} onChange={(e) => setApplicableRuleId(e.target.value)} className="w-full p-2 border border-input bg-background rounded cursor-pointer" disabled={filteredRules.length === 0}> {/* <-- FIX: Added border-input and bg-background */}
                            <option value="">{filteredRules.length === 0 ? 'No active rules for this card' : 'None'}</option>
                            {filteredRules.map(rule => (
                                <option key={rule.id} value={rule.id}>
                                    {rule.ruleName} - {(rule.rate * 100).toFixed(1)}% (up to {currencyFn(rule.categoryLimit)})
                                </option>
                            ))}
                        </select>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button type="button" variant="ghost" size="icon" disabled={!selectedRule}>
                                    <Info className="h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent>
                                {selectedRule && (
                                    <div className="space-y-2">
                                        <p className="font-bold">{selectedRule.ruleName}</p>
                                        <p><strong>Conditions:</strong> {selectedRule.conditions}</p>
                                        <p><strong>Min Spend:</strong> {currencyFn(selectedRule.minSpend)}</p>
                                    </div>
                                )}
                            </PopoverContent>
                        </Popover>
                        </div>
                        {selectedRule && (
                            <div className="flex items-center gap-2 pt-2">
                                <Badge variant="secondary">Rate: {(selectedRule.rate * 100).toFixed(1)}%</Badge>
                                {selectedRule.tier2Rate && <Badge variant="outline">Tier 2: {(selectedRule.tier2Rate * 100).toFixed(1)}%</Badge>}
                                {estimatedCashbackAndWarnings.cashback > 0 && (
                                    <Badge variant="outline" className="text-emerald-600">
                                        Est: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(estimatedCashbackAndWarnings.cashback)}
                                    </Badge>
                                )}
                                {estimatedCashbackAndWarnings.warnings.length > 0 && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild><button type="button"><AlertTriangle className="h-4 w-4 text-orange-500" /></button></TooltipTrigger>
                                            <TooltipContent>
                                                <ul className="list-disc pl-4 space-y-1">
                                                    {estimatedCashbackAndWarnings.warnings.map((warning, i) => (<li key={i}>{warning}</li>))}
                                                </ul>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="more-details">
                        <AccordionTrigger className="text-sm font-semibold">More Details</AccordionTrigger>
                        <AccordionContent className="pt-4 space-y-4 px-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="category">Internal Category</label>
                                    <Combobox
                                        options={categories.map(c => ({ value: c, label: c }))}
                                        value={category}
                                        onChange={setCategory}
                                        placeholder="Select a category"
                                        searchPlaceholder="Search categories..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="paidFor">Paid For</label>
                                    <Combobox
                                        options={['Personal', 'Family', 'Work'].map(c => ({ value: c, label: c }))}
                                        value={paidFor}
                                        onChange={setPaidFor}
                                        placeholder="Select who this was for"
                                        searchPlaceholder="Search..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="subCategory">Sub Category</label>
                                <TagsInputField
                                    name="subCategory"
                                    label="Sub Category"
                                    placeholder="Enter sub-categories"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <Switch id="foreign-currency-switch" checked={isForeignCurrency} onCheckedChange={setIsForeignCurrency} />
                                    <label htmlFor="foreign-currency-switch">Foreign Currency Transaction</label>
                                </div>
                            </div>

                            {isForeignCurrency && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="foreignCurrencyAmount">Original Amount</label>
                                        <Input id="foreignCurrencyAmount" type="text" inputMode="decimal" value={foreignCurrencyAmount} onChange={(e) => handleFormattedNumericInput(e.target.value, setForeignCurrencyAmount, true)} placeholder="e.g., 100.00" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="foreignCurrency">Currency</label>
                                        <Input id="foreignCurrency" value={foreignCurrency} onChange={(e) => setForeignCurrency(e.target.value)} placeholder="e.g., USD" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="conversionFee">Conversion Fee (VND)</label>
                                        <Input id="conversionFee" type="text" inputMode="numeric" value={conversionFee} onChange={(e) => handleFormattedNumericInput(e.target.value, setConversionFee)} />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label>Other Discounts</label>
                                {discounts.map((discount, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <Input placeholder="Description" value={discount.description} onChange={(e) => {
                                            const newDiscounts = [...discounts];
                                            newDiscounts[index].description = e.target.value;
                                            setDiscounts(newDiscounts);
                                        }} />
                                        <Input placeholder="Amount" value={discount.amount} onChange={(e) => {
                                            const newDiscounts = [...discounts];
                                            newDiscounts[index].amount = e.target.value;
                                            setDiscounts(newDiscounts);
                                        }} />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => setDiscounts(discounts.filter((_, i) => i !== index))}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={() => setDiscounts([...discounts, { description: '', amount: '' }])}>Add Discount</Button>
                            </div>

                            <div className="space-y-2">
                                <label>Other Fees</label>
                                {fees.map((fee, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <Input placeholder="Description" value={fee.description} onChange={(e) => {
                                            const newFees = [...fees];
                                            newFees[index].description = e.target.value;
                                            setFees(newFees);
                                        }} />
                                        <Input placeholder="Amount" value={fee.amount} onChange={(e) => {
                                            const newFees = [...fees];
                                            newFees[index].amount = e.target.value;
                                            setFees(newFees);
                                        }} />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => setFees(fees.filter((_, i) => i !== index))}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={() => setFees([...fees, { description: '', amount: '' }])}>Add Fee</Button>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="billingDate">Billing Date</label>
                                <div className="relative flex items-center">
                                    <CalendarClock className="absolute left-3 z-10 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="billingDate"
                                        type="date"
                                        className="w-full pl-10"
                                        value={billingDate}
                                        onChange={(e) => setBillingDate(e.target.value)}
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
                                    placeholder="Add any relevant notes here..."
                                />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
                
                <div className="pt-2">
                    <Button type="submit" disabled={isSubmitting} size="lg" className="w-full">
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