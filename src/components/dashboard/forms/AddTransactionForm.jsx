import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Sparkles, CalendarClock, AlertTriangle, Info, X } from 'lucide-react';
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
import useIOSKeyboardGapFix from '../../../hooks/useIOSKeyboardGapFix';
import MccSearchResultsDialog from './MccSearchResultsDialog';
import useCardRecommendations from '../../../hooks/useCardRecommendations';
import { useForm, FormProvider } from 'react-hook-form';


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
        const sourceData = initialData || prefillData;
        if (sourceData) {
            // Automatically clean the "Email_" prefix for a better user experience
            let initialMerchant = sourceData['Transaction Name'] || '';
            if (initialMerchant.startsWith('Email_')) {
                initialMerchant = initialMerchant.substring(6); // Remove "Email_"
            }

            setMerchant(initialMerchant || '');
            setAmount((sourceData['Amount'] || '').toLocaleString('en-US'));
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
                setMethod('International');
                setForeignCurrencyAmount(sourceData.foreignCurrencyAmount.toLocaleString('en-US'));
                setConversionFee(sourceData.conversionFee.toLocaleString('en-US'));
                if (sourceData.exchangeRate) setConversionRate(sourceData.exchangeRate.toLocaleString('en-US'));
                if (sourceData.foreignCurrency) setForeignCurrency(sourceData.foreignCurrency);
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

    // FIX: The validation useEffect was deleted here.
    // The handleCardSelect function below correctly handles resetting logic, 
    // so the useEffect was redundant and causing the double-click race condition.

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

    return (
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4">
                <QuickAddButtons vendors={commonVendors} onSelect={handleVendorSelect} />

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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label htmlFor="amount">Amount</label>
                        <Input ref={amountInputRef} id="amount" type="text" inputMode="numeric" value={amount} onChange={handleAmountChange} required />
                    </div>
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

                <div className="space-y-2">
                    <label>Method</label>
                    <div className="flex space-x-2">
                        <Button type="button" variant={method === 'POS' ? 'secondary' : 'outline'} onClick={() => setMethod('POS')}>POS</Button>
                        <Button type="button" variant={method === 'eCom' ? 'secondary' : 'outline'} onClick={() => setMethod('eCom')}>eCommerce</Button>
                        <Button type="button" variant={method === 'International' ? 'secondary' : 'outline'} onClick={() => setMethod('International')}>International</Button>
                    </div>
                </div>

                {method === 'International' && (
                    <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                        <div className="flex items-center space-x-2">
                            <label htmlFor="foreign-input-mode" className="text-sm font-medium">VND Amount Known</label>
                            <Switch
                                id="foreign-input-mode"
                                checked={foreignInputMode === 'vnd_unknown'}
                                onCheckedChange={(checked) => setForeignInputMode(checked ? 'vnd_unknown' : 'vnd_known')}
                            />
                            <label htmlFor="foreign-input-mode" className="text-sm font-medium">VND Amount Unknown</label>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="foreignCurrencyAmount">Foreign Amount</label>
                                <Input id="foreignCurrencyAmount" type="text" inputMode="decimal" value={foreignCurrencyAmount} onChange={(e) => handleFormattedNumericInput(e.target.value, setForeignCurrencyAmount, true)} placeholder="e.g., 100.00" />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="foreignCurrency">Foreign Currency</label>
                                <Select value={foreignCurrency} onValueChange={setForeignCurrency}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select currency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'SGD'].map(curr => (
                                            <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="conversionRate">Exchange Rate</label>
                                <Input 
                                    id="conversionRate" 
                                    type="text" 
                                    inputMode="decimal" 
                                    value={conversionRate} 
                                    onChange={(e) => handleFormattedNumericInput(e.target.value, setConversionRate, true)} 
                                    placeholder={foreignInputMode === 'vnd_known' ? 'Auto-calculated' : 'e.g., 23000'}
                                    readOnly={foreignInputMode === 'vnd_known'}
                                    className={foreignInputMode === 'vnd_known' ? 'bg-muted/50 focus-visible:ring-offset-0 focus-visible:ring-0' : ''}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="conversionFee">Conversion Fee (VND)</label>
                                <Input id="conversionFee" type="text" inputMode="numeric" value={conversionFee} onChange={(e) => handleFormattedNumericInput(e.target.value, setConversionFee)} />
                                {selectedCard && selectedCard.foreignFee > 0 && (
                                    <p className="text-xs text-muted-foreground pt-1">Foreign Fee: {(selectedCard.foreignFee * 100).toFixed(1)}%</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <CardRecommendations
                    recommendations={rankedCards}
                    onSelectCard={handleCardSelect}
                    currencyFn={currencyFn}
                    selectedCardId={cardId}
                />

                <div className="space-y-4 border-t pt-6">
                    <div className="space-y-2">
                        <label htmlFor="card">Card</label>
                        <Select value={cardId} onValueChange={(value) => { handleCardSelect(value); localStorage.setItem('lastUsedCardId', value); }} required>
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
                        <label htmlFor="rule">Applicable Cashback Rule</label>
                        <div className="flex items-center gap-2">
                        <Select value={applicableRuleId} onValueChange={(val) => val && setApplicableRuleId(val)} disabled={filteredRules.length === 0}>
                            <SelectTrigger>
                                <SelectValue placeholder={filteredRules.length === 0 ? 'No active rules for this card' : 'None'} />
                            </SelectTrigger>
                            <SelectContent>
                                {filteredRules.map(rule => (
                                    <SelectItem key={rule.id} value={rule.id} disabled={rule.status === 'Inactive'}>
                                        {/* WRAPPER DIV: Forces row layout for everything inside ItemText */}
                                        <div className="flex w-full items-center gap-2">
                                            {/* Name: Takes available space */}
                                            <span className="truncate flex-1 text-left">
                                                {rule.ruleName} {rule.status === 'Inactive' && '(Inactive)'}
                                            </span>
                                            
                                            {/* Badges: Stays on the same line, doesn't shrink */}
                                            <div className="flex shrink-0 items-center gap-2">
                                                <Badge variant="outline" className="text-emerald-600">
                                                    {(rule.rate * 100).toFixed(1)}%
                                                </Badge>
                                                <Badge variant="secondary">
                                                    {currencyFn(rule.categoryLimit)}
                                                </Badge>
                                            </div>
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
                            <PopoverContent>
                                {selectedRule && (
                                    <div className="space-y-2 text-sm">
                                        <p className="font-bold">{selectedRule.ruleName}</p>
                                        <p><strong>Rate:</strong> {(selectedRule.rate * 100).toFixed(1)}% {selectedRule.tier2Rate ? `(Tier 2: ${(selectedRule.tier2Rate * 100).toFixed(1)}%)` : ''}</p>
                                        <p><strong>Category Cap:</strong> {currencyFn(selectedRule.categoryLimit)}</p>
                                        {selectedRule.transactionLimit > 0 && <p><strong>Transaction Cap:</strong> {currencyFn(selectedRule.transactionLimit)}</p>}
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
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button type="button" className="focus:outline-none">
                                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent>
                                            <div className="space-y-2 text-sm">
                                                <p className="font-bold text-orange-600">Warnings</p>
                                                <ul className="list-disc pl-4 space-y-1">
                                                    {estimatedCashbackAndWarnings.warnings.map((warning, i) => (
                                                        <li key={i}>{warning}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        {discounts.map((discount, index) => (
                            <div key={`d-${index}`} className="flex items-center gap-2">
                                <Input placeholder="Discount Description" value={discount.description} onChange={(e) => {
                                    const newDiscounts = [...discounts];
                                    newDiscounts[index].description = e.target.value;
                                    setDiscounts(newDiscounts);
                                }} />
                                <Input placeholder="Amount" value={discount.amount} onChange={(e) => {
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
                                <Input placeholder="Fee Description" value={fee.description} onChange={(e) => {
                                    const newFees = [...fees];
                                    newFees[index].description = e.target.value;
                                    setFees(newFees);
                                }} />
                                <Input placeholder="Amount" value={fee.amount} onChange={(e) => {
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
                        <div className="flex items-center gap-2 pt-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setDiscounts([...discounts, { description: '', amount: '' }])}>Add Discount</Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => setFees([...fees, { description: '', amount: '' }])}>Add Fee</Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label>Final Amount</label>
                        <div className="text-xl font-bold p-4 rounded-lg bg-muted">
                            {currencyFn(parseFloat(String(amount || '0').replace(/,/g, '')) - discounts.reduce((acc, d) => acc + parseFloat(String(d.amount || '0').replace(/,/g, '')), 0) + fees.reduce((acc, f) => acc + parseFloat(String(f.amount || '0').replace(/,/g, '')), 0) + parseFloat(String(conversionFee || '0').replace(/,/g, '')))}
                        </div>
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
                                    <TagsInputField
                                        name="subCategory"
                                        label="Sub Category"
                                        placeholder="Enter sub-categories"
                                    />
                                </div>
                            </div>

                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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